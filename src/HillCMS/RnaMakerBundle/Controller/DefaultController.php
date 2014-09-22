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
        $test = $dbs[0]->getClass();
        $root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
    	return $this->render('HillCMSRnaMakerBundle:Default:amirna.html.twig', array("groups"=> $homegroups["Amirna"], "dbs" => $dbs, "root"=>$root));
    }
    
    /**
     * Request action for the amiRNADesigner. The logic is a little bit more  complex. The gene XOR the sequence must be selected. Additionally, the species is
     * derived from the selected database.
     *
     * Executed Commands:
     * perl /shares/jcarrington_share/www/psams/bin/psams.pl -f $sequence -d $database -s $species -l $offTargets -r $num -t $fb
     */
    public function amirnaDesignerRequestAction(){
	    $request = $this->getRequest();
    	if ($request->getMethod() === 'POST') {
    		$speciesId = $request->get('species'); //going to be dbId
    		$transcriptId = $request->get('transcriptId');
    		$filtered = $request->get("filtered");
            $transcript = $request->get('transcript');
		    if( ($transcript == "" && $transcriptId == "") || $filtered == ""){
    			return new Response("Error: Missing one of the required fields.", 400);
            }
    	} else{
    		return new Response("Error: Invalid request type.", 400);
    	} 
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
    	if ($speciesId !== ""){
    	    $dbs = $repo->findBy(array("dbId" => $speciesId));
    	    if (sizeof($dbs) < 1){
    		    return new Response("Invalid species.", 400);
    	    }
            $root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
            $database =  $dbs[0]->getDbPath();
            $species =  $dbs[0]->getSpecies();
    	} else{
            $species = "";
        }
        $escaped_transcript = "";
    	if ($transcriptId == "") {
            //must reconstruct with escpaced newline characters
            $fasta = explode("\n", $transcript);
            if (substr($fasta[0],0,1) != ">"){
                //legacy i think
                return new Response("Error: malformed fasta." . substr($fasta[0], 0,1), 400);
            } 
            for($i = 0; $i < sizeof($fasta); $i++){
                $escaped_transcript .= $fasta[$i] . "\\n";
            }
        }
        $daemonSocket = new DaemonHunter();
    	$arguments = array();
        if ($species !== ""){
            $arguments[2] = "-s";
            $arguments[3] = $species;
        }
    	if ($transcript !== "") {
    		$arguments[10] = "-f";
       		$arguments[11] = $escaped_transcript;
    	} else {
    		$arguments[10] = "-a";
    		$arguments[11] = $transcriptId;
    	}
        if ($filtered != "false"){
            $arguments[12] = "-o";
        }
    	$json = $daemonSocket->jsonBuilder("psams.pl", "psams.pl", $arguments);
        $json_result = $daemonSocket->socketSend($json);
        if(strlen($json_result) < 1){
            return new Response("Error, unexpected response. " . print_r($json, TRUE), 500);
        }
        
        $token = $this->amiRNADesignerJsonDecoder($json_result);
        return new Response($token, 200);
    }
    
    public function syntasirnaDesignerRequestAction(){
        $request = $this->getRequest();
        if ($request->getMethod() === 'POST') {
            $recieved = json_decode($request->getContent());
            $speciesId = $recieved->database->id; //going to be dbId
            $transcriptId = join(";",$recieved->transcriptIds);
            $filtered = $recieved->filtering;
            $transcript = join(";", $recieved->fastaTranscriptSeqs);
            if( ($transcript == "" && $transcriptId == "") || $filtered == ""){
                return new Response("Error: Missing one of the required fields.", 400);
            }
        } else{
            return new Response("Error: Invalid request type.", 400);
        }
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
        if ($speciesId !== ""){
            $dbs = $repo->findBy(array("dbId" => $speciesId));
            if (sizeof($dbs) < 1){
                return new Response("Invalid species.", 400);
            }
            $root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
            $database =  $dbs[0]->getDbPath();
            $species =  $dbs[0]->getSpecies();
        } else{
            $species = "";
        }
        $escaped_transcript = "";
        if($transcriptId == "") {
            //fasta validation?
            //must reconstruct with escpaced newline characters
            $fasta = explode("\n", $transcript);
            if (substr($fasta[0],0,1) != ">"){
                return new Response("Error: malformed fasta." . substr($fasta[0], 0,1), 400);
            }
            for($i = 0; $i < sizeof($fasta); $i++){
                $escaped_transcript .= $fasta[$i] . "\\n";
            }
        }
        $daemonSocket = new DaemonHunter();
        $arguments = array();
        if ($species !== ""){
            $arguments[2] = "-s";
            $arguments[3] = $species;
        }
        $arguments[4] = "-c";
        $arguments[5] = "syntasiRNA";
        if ($transcript !== "") {
            $arguments[10] = "-f";
            $arguments[11] = $escaped_transcript;
        } else {
            $arguments[10] = "-a";
            $arguments[11] = $transcriptId;
        }
        if ($filtered == "true"){
            $arguments[12] = "-o";
        }
        $json = $daemonSocket->jsonBuilder("psams.pl", "psams.pl", $arguments);
        $json_result = $daemonSocket->socketSend($json);
        if(strlen($json_result) < 1){
            return new Response("Error, unexpected response. " . print_r($json, TRUE), 500);
        }
        if (strpos($json_result, "not found") !== false){
            return new Response("Error: " . print_r($json_result, TRUE), 400);

        }
        $token = $this->syntasirnaJsonWriter($json_result);
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
            $eudicot = $request->get('eudicot');
            if ($eudicot == "true"){
                $fb = "eudicot";
            } else{
                $fb = "monocot";
            }
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
            $plain_result = $tokenized_results->{"results"}->{"name"}.": ". $tokenized_results->{"results"}->{"amiRNA"} . "\n";
            $plain_result .= $tokenized_results->{"results"}->{"name"}."*: " . $tokenized_results->{"results"}->{"miRNA*"} . "\n";
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
        return $this->render('HillCMSRnaMakerBundle:Default:syntasi.html.twig', array("groups"=> $homegroups["Syntasi"], "root"=>$root));
    }
    //lolphp doesn't support objects in json_encode
    public function json_encode_objs($item){
        if(!is_array($item) && !is_object($item)){
            return json_encode($item);
        }else{
            $pieces = array();
            foreach($item as $k=>$v){
                $pieces[] = "\"$k\":". $this->json_encode_objs($v);
            }
            return '{'.implode(',',$pieces).'}';
        }
    }
    public function psamsDatabasesAction(){
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
        $json = "[";
        $dbs = $repo->findAll();
        
        foreach ($dbs as $db){
            $json .= '{"label":"' . $db->getDbLabel() .'", ';
            $json .= '"class":"' . $db->getClass() .'", ';
            $json .= '"id":"' . $db->getDbId() . '"},';
        }
        $json = substr($json, 0, -1);
        $json .= "]";
        return new Response($json, 200);
    }
    /**
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
    
    public function syntasirnaJsonWriter($json_result){
        $token = uniqid("syntasirnaDesigner_");
        $fd = fopen($this->server_encoded . "/" . $token, "w");
        fwrite($fd, $json_result);
        fclose($fd);
        return $token;
    }
    /**
     * Function responsible for parsing the amiRNADesigner results and saving them to disk.
     */
    public function amiRNADesignerJsonDecoder($json_result){
        //decode results to plain text
        //write to disk    
        $token = uniqid("amirnaDesigner_");
        $plainfile = $this->server_results . "/" . $token;
        $fd = fopen($plainfile, "w");
        $plain_result = "Optimal Results\n\n";
        $json_assoc = json_decode($json_result, True);
        if (sizeof($json_assoc['optimal']) == 0){
            $plain_result .= "No optimal results.\n";
        } else{
            foreach($json_assoc['optimal'] as $key => $value){
                $plain_result .= "$key\n\n";
                foreach($value as $keyinfo => $info){
                    if ($keyinfo == "TargetFinder"){
                        $plain_result .="\n";
                        $plain_result .= "TargetFinder\n";
                        foreach($value[$keyinfo] as $tfkey => $tfvalue){
                            $plain_result .= "Hit: $tfkey\n";
                            foreach($tfvalue["hits"] as $hit){
                                foreach($hit as $hitk => $hitv){
                                    if ($hitk == "Base pairing"){
                                        $plain_result .= "$hitk:\t$hitv\n";
                                    } else{
                                        $plain_result .= "$hitk: $hitv\n";
                                    }
                                }
                            }        
                        }
                        $plain_result .= "\n";
                    } else{
                        $plain_result .= "$keyinfo: ";
                        $plain_result .= "5' $info 3'\n";
                    }
                }
            }
        }
        $plain_result .= "\n\nSub-optimal Results\n\n";
        if (sizeof($json_assoc['suboptimal']) == 0){
            $plain_result .= "No sub-optimal results.\n";
        } else{ 
            foreach($json_assoc['suboptimal'] as $key => $value){
                $plain_result .= "$key\n\n";
                foreach($value as $keyinfo => $info){
                    if ($keyinfo == "TargetFinder"){
                        $plain_result .= "\n";
                        $plain_result .= "TargetFinder\n";
                        foreach($value[$keyinfo] as $tfkey => $tfvalue){
                            $plain_result .= "Hit: $tfkey\n";
                            foreach($tfvalue["hits"] as $hit){
                                foreach($hit as $hitk => $hitv){
                                   if ($hitk == "Base pairing"){
                                        $plain_result .= "$hitk:\t$hitv\n";
                                    } else{
                                        $plain_result .= "$hitk: $hitv\n";
                                    } 
                                }
                            }
                        }
                        $plain_result .= "\n";
                    } else{
                        $plain_result .= "$keyinfo: ";
                        $plain_result .= "5' $info 3'\n";
                    }
                }
            }
        }
        $plain_result = str_replace("&nbsp"," ", $plain_result);
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
        $json_decoded = json_decode($result, true);
        $dlpath = $this->server_results . "/". $token;
        return $this->render("HillCMSRnaMakerBundle:Default:amiRNADesignerResults.html.twig", array(
             "dl_token"=> $dlpath,
             "results" => $json_decoded
        ));
    }
    
    public function faqAction(){
        $pid = 8;
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
        $pagethings = $repo->findBy(array("pageid" => $pid));
        if (sizeof($pagethings) === 0){
            //empty page
            return new Response("Error", 404);
        }
        $homegroups = $this->buildPageGroups($pagethings);
        return $this->render('HillCMSRnaMakerBundle:Default:faq.html.twig', array("groups"=> $homegroups["FAQ"]));
    }

    public function aboutAction(){
        $pid = 7;
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
        $pagethings = $repo->findBy(array("pageid" => $pid));
        if (sizeof($pagethings) === 0){
            //empty page
            return new Response("Error", 404);
        }
        $homegroups = $this->buildPageGroups($pagethings);
        return $this->render('HillCMSRnaMakerBundle:Default:about.html.twig', array("groups"=> $homegroups["About"]));
    }
}
