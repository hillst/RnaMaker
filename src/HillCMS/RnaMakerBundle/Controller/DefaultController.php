<?php

namespace HillCMS\RnaMakerBundle\Controller;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use HillCMS\ManageBundle\Controller\CMSController;
use HillCMS\RnaMakerBundle\ClientSocket\DaemonHunter;

/**
 * Controller which handles everthing, probably should move into seperate controllers.
 * @author shill
 *
 */
class DefaultController extends CMSController
{
    private $server_results = "server_results";	
    private $server_encoded = "server_encoded";
    /*
     * It is worth mentioning that buttons are hard-coded, but the content in the buttons (and following) are not.
     */	
    public function indexAction(){
    	$pid = 1;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); 
    	if (sizeof($pagethings) === 0){
    		//empty page
    		return new Response("Error", 404);
    	}
    	$homegroups = $this->buildPageGroups($pagethings);
        
        return $this->render('HillCMSRnaMakerBundle:Default:index.html.twig', array("main" => $homegroups['Main'][0], "amirna" => $homegroups['Main'][5], "syntasirna" => $homegroups["Main"][6]));

    }
    /*
     * Page which only contains amiRNA Designer and syntasiRNA Designer. Just a clone of index
     */
    public function rnaDesignerAction(){
        //doesnt actually have a pid, just a clone of index.
        $pid = 1;
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
        $pagethings = $repo->findBy(array("pageid" => $pid));
        if (sizeof($pagethings) === 0){
            //empty page
            return new Response("Error", 404);
        }
        $homegroups = $this->buildPageGroups($pagethings);
        return $this->render('HillCMSRnaMakerBundle:Default:rnadesigner.html.twig', array("amirna" => $homegroups['Main'][5], "syntasirna" => $homegroups["Main"][6]));

    }
    
    public function amirnaDesignerFormAction(){
    	$pid = 4;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); 
    	if (sizeof($pagethings) === 0){
    		//empty page
    		return new Response("Error", 404);
    	}
    	$homegroups = $this->buildPageGroups($pagethings);
    	$repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
    	$dbs = $repo->findAll();
    	$root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
    	return $this->render('HillCMSRnaMakerBundle:Default:amirna.html.twig', array("groups"=> $homegroups["Amirna"], "dbs" => $dbs, "root"=>$root));
    }
    
    /**
     * Request action for the amiRNADesigner. The logic is a little bit more  complex. The gene XOR the sequence must be selected. Additionally, the species is
     * derived from the selected database.
     *
     * Executed Commands:
     * perl ./sites/amirna/bin/generate_amiRNA_list.pl -f $sequence -d $database -s $species -l $offTargets -r $num -t $fb
     */
    public function amirnaDesignerRequestAction(){
	    $request = $this->getRequest();
    	if ($request->getMethod() === 'POST') {
    		$speciesId = $request->get('species'); //going to be dbId
    		$transcriptId = $request->get('transcriptId');
    		$filtered = $request->get("filtered");
            $transcript = $request->get('transcript');
		    if($speciesId == "" || ($transcript == "" && $transcriptId == "") || $filtered == ""){
    			return new Response("Error: Missing one of the required fields.", 400);
            }
    	} else{
    		return new Response("Error: Invalid request type.", 400);
    	} 
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
    	
    	$dbs = $repo->findBy(array("dbId" => $speciesId));
    	if (sizeof($dbs) < 1){
    		return new Response("Invalid species.", 400);
    	}
    		
	    $root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
    	$database =  $dbs[0]->getDbPath();
    	$species =  $dbs[0]->getSpecies();
        $escaped_transcript = "";
    	if ($transcriptId != "") {
    		if ($species !== 'S_ITALICA') {
    			if (!preg_match("/\.\d+$/",$transcriptId)) {
    				$transcriptId = $transcriptId.".1";
    			}
    		}
    	} else {
            //must reconstruct with espaced newline characters
            $fasta = explode("\n", $transcript);
            if (sizeof($fasta) % 2 != 0){
                return new Response("Error 1, malformed fasta.", 400);
            }
            for($i = 0; $i < sizeof($fasta); $i++){
                if($i % 2 == 0 && substr($fasta[$i],0,1) != ">"){
                    return new Response("Error 2, malformed fasta.", 400);
                }
                $escaped_transcript .= $fasta[$i] . "\\n";
            }
        }
        //uncomment to test success message
        //return new Response("plain response", 200);
        //already updated arguments

        $daemonSocket = new DaemonHunter();
    	$arguments = array();
    	$arguments[0] = "-d";
    	$arguments[1] = $database;
    	$arguments[2] = "-s";
    	$arguments[3] = $species;
    	if ($transcript !== "") {
    		$arguments[10] = "-f";
       		$arguments[11] = $escaped_transcript;
    	} else {
    		$arguments[10] = "-a";
    		$arguments[11] = $transcriptId;
    	}
        if ($filtered){
            $arguments[12] = "-o";
        }
    	$json = $daemonSocket->jsonBuilder("designer_tool.pl", "designer_tool.pl", $arguments);
    
        $json_result = $daemonSocket->socketSend($json);
        if(strlen($json_result) < 1){
            return new Response("Error, unexpected response. " . print_r($arguments, TRUE), 500);
        }
        
        $token = $this->amiRNADesignerJsonDecoder($json_result);
        return new Response($token, 200);
    }
    /**
     * Request handler for Oligo Designer.  Expects a post and the arguments to be passed to the command line function. 
     * The following function may take a fasta or some comma seperated list of oligos to accept. It will then run
     * the oligo designer on each input and return the results. We will need to spawn a daemon for each one, and
     * possibly limit how long it may run (although these are fast so it's probably irrelevant).
     *
     * perl bin/amiR_final.pl -s $seq -n $name -t $fb
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function oligoRequestAction(){
       /*
        *   perl ./sites/amirna/bin/amiR_final.pl -s $seq -n $name -t $fb"
        */
        $request = $this->getRequest();
        if ($request->getMethod() === 'POST') {
            $seq = $request->get('seq');
            $name = $request->get('name');
            //$fb = $request->get('fb');
            $fb = "eudicot";
            $fasta = $request->get('fasta');
            if(($seq == "" || $name == "") && ($fasta == "")){
                return new Response("Not enough inputs.", 403);
            }
        } else{
            return new Response("Must be POST.", 403);
        }
        $fasta != "" ? $performFast = TRUE : $performFast = FALSE;
        //list of names and seqs, indicies should match
        $names = array();
        $seqs = array();
        if ($performFast){
            $fastaLines = explode("\n", $fasta);
            for($i = 0; $i < sizeof($fastaLines); $i++){
                if ($i % 2 == 0){
                    array_push($names, substr($fastaLines[$i], 1 ));
                } else{
                    array_push($seqs, $fastaLines[$i]);
                }
            }
        } else{
            $names = explode(",", $name);
            $seqs = explode(",", $seq);
        }
        $json_results = array();
        for($i = 0; $i < sizeof($seqs); $i++){ 
            $daemonSocket = new DaemonHunter();
            $arguments = array();
            $arguments[0] = "-s";
            $arguments[1] = $seqs[$i];
            $arguments[2] = "-n";
            $arguments[3] = $names[$i];
            $arguments[4] = "-t";
            $arguments[5] = $fb;
            $json = $daemonSocket->jsonBuilder("amiR_final.pl", "amiR_final.pl", $arguments);
            $json_result = $daemonSocket->socketSend($json);
            if(strlen($json_result) < 1){
                return new Response("Error, unexpected response. " . print_r($arguments, TRUE), 500);
            }
            array_push($json_results, $json_result);
        }
        $token = $this->oligoMultiResultsDecoder($json_results);
        return new Response($token, 200);

    }
    /**
     * Writes to the server encoded version of amirnaOligoDesigner_ with each result encoded as an element
     * in an array. To render this view, just iterate over each result.
     */
    public function oligoMultiResultsDecoder($json_results){
        $token = uniqid("amirnaOligoDesigner_");
        $plainfile = $this->server_results."/". $token;
        $pfd = fopen($plainfile, "w");
        $sfd = fopen($this->server_encoded . "/" . $token, "w");
        $json_array = array();
        foreach($json_results as $json_result){
            $tokenized_results = json_decode($json_result);
            $plain_result = "Name: " . $tokenized_results->{"results"}->{"name"} . "\n";
            $plain_result .= "amiRNA: ". $tokenized_results->{"results"}->{"amiRNA"} . "\n";
            $plain_result .= "miRNA*: " . $tokenized_results->{"results"}->{"miRNA*"} . "\n";
            $plain_result .= "Forward Oligo: 5' " . $tokenized_results->{"results"}->{"Forward Oligo"} . " 3'\n";
            $plain_result .= "Reverse Oligo: 5' " . $tokenized_results->{"results"}->{"Reverse Oligo"} . " 3'\n\n";
            //Write a plain text and json version, json for the view to render
            array_push($json_array, json_decode($json_result));
            fwrite($pfd, $plain_result);
        }
        
        fwrite($sfd, json_encode($json_array));
        fclose($pfd);
        fclose($sfd);
        return $token;
    }
    public function oligoResultsAction($token){
        $fd = fopen($this->server_encoded . "/" . $token, "r");
        $result = "";
        while( ! feof($fd )){
            $result .= fread($fd, 8092);
        }
        fclose($fd);
        //returns as an associative array and not an object.
        $decoded_result =  json_decode($result,true);
        $dlpath = $this->server_results . "/". $token;
        return $this->render("HillCMSRnaMakerBundle:Default:amiRNAOligoResults.html.twig", array(
                             "json_results" => $decoded_result,
                             "dl_token" => $dlpath )
                            );
        
    }

    //TODO remove useless code during cleanup step
    //everything below this is kind of wtf why is it here

    





    public function syntasiDesignerFormAction(){
        $pid = 6;
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
        $pagethings = $repo->findBy(array("pageid" => $pid)); 
        if (sizeof($pagethings) === 0){
            //empty page
            return new Response("Error", 404);
        }
        $homegroups = $this->buildPageGroups($pagethings);
        $repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
        $dbs = $repo->findAll();
        $root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
        return $this->render('HillCMSRnaMakerBundle:Default:syntasi.html.twig', array("groups"=> $homegroups["Syntasi"], "dbs" => $dbs, "root"=>$root));
    }
    
    public function oligoDesignerFormAction(){
    	$pid = 3;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); 
    	if (sizeof($pagethings) === 0){
    		//empty page
    		return new Response("Error", 404);
    	}
    	$homegroups = $this->buildPageGroups($pagethings);
    	return $this->render('HillCMSRnaMakerBundle:Default:oligodesigner.html.twig', array("groups"=> $homegroups["Oligo"]));
    }

    /**
     * Universal results action. If a custom results page is a needed a new action should be written. This function finds the file with the 
     * class field server_result. private $server_encoded = "server_encoded";It expects the token to be the filename.
     * 
     * @param $token results token returned by the job daemon
     */
    public function resultsAction($token){
    	$fd = fopen($this->server_results . "/" . $token, "r"); //do work son lol
    	$result = "";
    	while( ! feof($fd )){
    		$result .= fread($fd, 8092);
    	}
    	fclose($fd);
    	 
    	return $this->render("HillCMSRnaMakerBundle:Default:results.html.twig", array("results" => $result, "dl_token"=> $token));
    }
    
    /**
     * Identical to the other resultsAction, except uses the syntasiRNA header.
     */
    public function syntasiResultsAction($token){
        $fd = fopen($this->server_results ."/" . $token, "r");
        $results = "";
        while( ! feof($fd) ){
            $results .= fread($fd, 8092);
        }
        fclose($fd);
        return $this->render("HillCMSRnaMakerBundle:Default:syntasiResults.html.twig", array("results" => $results, "dl_token" => $token));
    }
    /**
     * Handles requeusts for the target finder. Validates the POST submission and connects to the daemon. If the submission is missing a field, it will return 403.
     * If the response from the daemon is bad (format is not "statuscode","resultname"), it will return 500.
     * 
     * Executes:
     * perl bin/targetfinder.pl -q $name -s $miRNA -d $db -c $score"
     */
    public function targetFinderRequestAction(){
       	$request = $this->getRequest();
    	if ($request->getMethod() === 'POST') {
    		$miRNA = $request->get('miRNA');
    		$name = $request->get('name');
    		$db = $request->get('database');
    		$score = $request->get('score');
    		
    		if($miRNA == "" || $name == "" || $db == "" || $score == ""){
    			return new Response("Error: One of the required fields is empty.", 400);
    		}
    	} else{
    		return new Response("Error: Must be POST", 400);
    	}
    	 
    	$daemonSocket = new DaemonHunter();
    	$arguments = array();
    	$arguments[0] = "-s";
    	$arguments[1] = $miRNA;
    	$arguments[2] = "-q";
    	$arguments[3] = $name;
    	$arguments[4] = "-d";
    	$arguments[5] = $db;
    	$arguments[6] = "-c";
    	$arguments[7] = $score;
    	$json = $daemonSocket->jsonBuilder("targetfinder.pl", "targetfinder.pl", $this->server_results."/".uniqid("targetfinder_"), $arguments);
	
    	$json_result = $daemonSocket->socketSend($json);
        if (strlen($json_result) < 1){
            return new Response("Error, unexpected empty response.", 500);
        }	
        $token = $this->targetFinderJsonDecoder($json_result);
        return new Response($token , 200);
    }
    
    
    public function targetFinderFormAction(){
    	$pid = 2;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); 
    	if (sizeof($pagethings) === 0){
    		//empty page
    		return new Response("Error", 404);
    	}
    	$homegroups = $this->buildPageGroups($pagethings);
    	$repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
    	$dbs = $repo->findAll();
    	$root = $this->get('kernel')->getRootDir() ."/../amirna_dbs"; //directory of amirna sql_lite dbs
    	 
    	return $this->render('HillCMSRnaMakerBundle:Default:targetfinder.html.twig', array("groups" => $homegroups['Target'], "dbs" => $dbs, "root"=>$root));
    }
    /**
     * Function responsible for parsing the amiRNADesigner results and saving them to disk.
     */
    public function amiRNADesignerJsonDecoder($json_result){
        //decode results to plain text
        
        //$tokenized_results = json_decode($json_result);
        //there is no json to decode yet.
        $plain_result = $json_result;        

        //write to disk    
        $token = uniqid("amirnaDesigner_");
        $plainfile = $this->server_results . "/" . $token;
        $fd = fopen($plainfile, "w");
        fwrite($fd, $plain_result);
        fclose($fd);
        $fd = fopen($this->server_encoded . "/" . $token, "w");
        fwrite($fd, $json_result);
        fclose($fd);
        return $token;
    } 
    /*
     *
     */
    public function amiRNADesignerResultsAction($token){
        $fd = fopen($this->server_encoded . "/" . $token, "r");
        $result = "";
        while( ! feof($fd )){
            $result .= fread($fd, 8092);
        }
        fclose($fd);
        //again there is no json yet so it's commented out.
        //$decoded_result =  json_decode($result);
        
        $dlpath = $this->server_results . "/". $token;
        //"amiRNA" => $decoded_result->{"results"}->{"amiRNA"},
        return $this->render("HillCMSRnaMakerBundle:Default:amiRNADesignerResults.html.twig", array(
            "dl_token"=> $dlpath,
             "results" => $result
        ));
    }

    public function targetFinderResultsAction(){
        /*
        "hit-50": {
        "hit_accession": "AT5G38610.1 | Symbols:  | Plant invertase/pectin methylesterase inhibitor superfamily protein",
        "score":"4",
        "strand":"580-598 (+)",
        "target_seq":"AUGCUCUCU-UCUUCUGUCA",
        "homology_string":"&nbsp:::::&nbsp::&nbsp::::::::::",
        "miR_seq":"CACGAGUGAGAGAAGACAGU"
        */
        //parse a list of these out from the response and do the normal server_encoded server_plain process.
    }
    
 
}
