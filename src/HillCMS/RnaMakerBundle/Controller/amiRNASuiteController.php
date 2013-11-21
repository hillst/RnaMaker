<?php

namespace HillCMS\RnaMakerBundle\Controller;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use HillCMS\ManageBundle\Controller\CMSController;
use HillCMS\RnaMakerBundle\ClientSocket\DaemonHunter;

/**
 * All actions defined in this page are associated with the amiRNASuite. This includes form submission and
 * handling the results action.
 *
 * As of now the only enabled page is the OligoDesigner.
 */
class amiRNASuiteController extends CMSController
{
    private $server_results = "server_results";	
    private $server_encoded = "server_encoded";	
    /**
     * Form action for the amiRNA Designer. 
     */
    public function amirnaDesignerFormAction(){
    	$pid = 4;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); //our people page id
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
     *
     * perl ./sites/amirna/bin/generate_amiRNA_list.pl -a $gene -d $database -s $species -l $offTargets -r $num -t $fb
     *
     */
    public function amirnaDesignerRequestAction(){
    	$request = $this->getRequest();
    	if ($request->getMethod() === 'POST') {
    		$selection = $request->get('database'); //going to be dbId
    		$gene = $request->get('gene');
    		$sequence = $request->get('sequence');
    		$num = $request->get('results');
    		$offTargets = $request->get('off-targets');
    		$fb = $request->get('fb');
    		if($selection == "" || ($gene == "" || $sequence == "") || $num == "" || $offTargets == "" || $fb == "" ){
    			return new Response("Error: Missing one of the required fields.", 400);
    		}
    	} else{
    		return new Response("Error: Invalid request type.", 400);
    	} 
    	
    	if ($selection === 'none') {
    		return new Response("No off-target database selected!", 400);
    	}
    	if (!preg_match("/^\d+$/",$num)) {
    		return new Response("Result limit must be an integer!", 400);
    	}
    	if (!preg_match("/^\d+$/",$offTargets)) {
    		return new Response("Off-target limit must be an integer!", 400);
    	}
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSRnaMakerBundle:TargetfinderDbs");
    	$dbs = $repo->findBy(array("dbId" => $selection));
    	if (sizeof($dbs) < 1){
    		return new Response("Invalid database id.", 400);
    	}
    	$root = $this->get('kernel')->getRootDir() ."/../amirna_dbs";
    	$database = $root . $dbs[0]->getDbPath();
    	$species = $dbs[0]->getSpecies();
    	if ($gene !== "") {
    		if ($species !== 'S_ITALICA') {
    			if (!preg_match("/\.\d+$/",$gene)) {
    				$gene = $gene.".1";
    			}
    		}
    	}
    	 
    	$daemonSocket = new DaemonHunter();
    	$arguments = array();
    	$arguments[0] = "-d";
    	$arguments[1] = $database;
    	$arguments[2] = "-s";
    	$arguments[3] = $species;
    	$arguments[4] = "-l";
    	$arguments[5] = $offTargets;
    	$arguments[6] = "-r";
    	$arguments[7] = $num;
    	$arguments[8] = "-t";
    	$arguments[9] = $fb;
    	 
    	if (!preg_match("/none/",$sequence)) {
    		//$output = shell_exec("perl ./sites/amirna/bin/generate_amiRNA_list.pl -f $sequence -d $database -s $species -l $offTargets -r $num -t $fb");
    		$arguments[10] = "-f";
    		$arguments[11] = $sequence;
    	} elseif ($gene !== "") {
    		//$output = shell_exec("perl ./sites/amirna/bin/generate_amiRNA_list.pl -a $gene -d $database -s $species -l $offTargets -r $num -t $fb");
    		$arguments[10] = "-a";
    		$arguments[11] = $gene;
    	}
    	$json = $daemonSocket->jsonBuilder("generate_amiRNA_list.pl", "generate_amiRNA_list.pl", $this->server_results."/".uniqid("amiRNA_list"), $arguments);
    
    	$result = $daemonSocket->socketSend($json);
    	$tokens = explode(",",$result);
    	if(sizeof($tokens) > 1){
    		$token = trim($tokens[1]);
    	} else{
    		return new Response("Error, unexpected response.", 400);
    	}
   
    	
    	return new Response($token ."", 200);
    }
    
    /**
     * Renders the form page of the oligoDesigner. This is the counterpart of the syntasiRNA suite function of the
     * same purpose.
     */
    public function oligoDesignerFormAction(){
    	$pid = 3;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); //our people page id
    	if (sizeof($pagethings) === 0){
    		//empty page
    		return new Response("Error", 404);
    	}
    	$homegroups = $this->buildPageGroups($pagethings);
    	return $this->render('HillCMSRnaMakerBundle:Default:oligodesigner.html.twig', array("groups"=> $homegroups["amiRNAOligo"]));
    }
    /**
     * Request handler for Oligo Designer.  Expects a post and the arguments to be passed to the command line function. Then opens (hunts)
     * a socket and connects to the Server's Daemon. When the Daemon's process completes, the stdout will be sent back to our webapplication.
     *
     * The Daemon should be configured in such a way that the files live on the same filesystem. Calls the following function:
     *
     * perl bin/amiR_final.pl -s $seq -n $name -t $fb
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function oligoRequestAction(){
    	//perl ./sites/amirna/bin/amiR_final.pl -s $seq -n $name -t $fb"
    
    	//it is reasonable to code in the script in this file because this is the specific function's action.
    	$request = $this->getRequest();
    	if ($request->getMethod() === 'POST') {
    		$seq = $request->get('seq');
    		$name = $request->get('name');
    		$fb = $request->get('fb');
    		if($seq == "" || $name == "" || $fb == ""){
    			return new Response("", 403);
    		}
    	} else{
    		return new Response("", 403);
    	}
    	 
    	$daemonSocket = new DaemonHunter();
    	$arguments = array();
    	$arguments[0] = "-s";
    	$arguments[1] = $seq;
    	$arguments[2] = "-n";
    	$arguments[3] = $name;
    	$arguments[4] = "-t";
    	$arguments[5] = $fb;
    	$json = $daemonSocket->jsonBuilder("amiR_final.pl", "amiR_final.pl", $arguments);
    	/*
    	 *  Example job.
    	*  $json = $daemonSocket->jsonBuilder("nqueens", "./nqueens.py" , $arguments);
    	*  $arguments = array(0=>"12");
    	*/
    	$json_result = $daemonSocket->socketSend($json);
     	if(strlen($json_result) < 1){
    		return new Response("Error, unexpected response.", 500);
    	}
        $token = $this->jsonResultsDecoder($json_result);
        return new Response($token, 200);
    
    }
    
    /**
     * Maybe all actions can implement this type of method?
     */
    function jsonResultsDecoder($json_result){
        $tokenized_results = json_decode($json_result);
        $plain_result = "Name: " . $tokenized_results->{"results"}->{"name"} . "\n";
        $plain_result .= "amiRNA: ". $tokenized_results->{"results"}->{"amiRNA"} . "\n";
        $plain_result .= "miRNA*: " . $tokenized_results->{"results"}->{"miRNA*"} . "\n";
        $plain_result .= "Forward Oligo: 5' " . $tokenized_results->{"results"}->{"Forward Oligo"} . " 3'\n";
        $plain_result .= "Reverse Oligo: 5' " . $tokenized_results->{"results"}->{"Reverse Oligo"} . " 3'\n";
        $token = uniqid("amirnaOligoDesigner_");
       
        //Write a plain text and json version, json for the view to render 
        $plainfile = $this->server_results."/". $token; 
        $fd = fopen($plainfile, "w");
        fwrite($fd, $plain_result);
        fclose($fd);
        $fd = fopen($this->server_encoded . "/" . $token, "w");
        fwrite($fd, $json_result);
        fclose($fd);
        return $token;    
    }
    
    /**
     * Universal results action. If a custom results page is a needed a new action should be written. This function finds the file with the 
     * class field server_result. It expects the token to be the filename.
     * 
     * @param $token results token returned by the job daemon
     */
    public function resultsAction($token){
    	$fd = fopen($this->server_encoded . "/" . $token, "r"); 
    	$result = "";
    	while( ! feof($fd )){
    		$result .= fread($fd, 8092);
    	}
    	fclose($fd);
        $decoded_result =  json_decode($result);
    	$dlpath = $this->server_results . "/". $token; 
    	return $this->render("HillCMSRnaMakerBundle:Default:amiRNAOligoResults.html.twig", array(
            "amiRNA" => $decoded_result->{"results"}->{"amiRNA"}, 
            "miRNA" => $decoded_result->{"results"}->{"miRNA*"},
            "oligo1" => $decoded_result->{"results"}->{"Forward Oligo"},
            "oligo2" => $decoded_result->{"results"}->{"Reverse Oligo"}, 
            "name" => $decoded_result->{"results"}->{"name"},
            "dl_token"=> $dlpath));
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
	
    	$result = $daemonSocket->socketSend($json);
    	$tokens = explode(",",$result);
    	if(sizeof($tokens) > 1){
    		$token = trim($tokens[1]);
    	} else{
    		return new Response("Error, unexpected response.", 500);
    	}
    	return new Response($token ."", 200);
    }
    
    
    public function targetFinderFormAction(){
    	$pid = 2;
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); //our people page id
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
   
    
 
}
