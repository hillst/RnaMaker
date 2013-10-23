<?php

namespace HillCMS\RnaMakerBundle\Controller;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use HillCMS\ManageBundle\Controller\CMSController;
use HillCMS\RnaMakerBundle\ClientSocket\DaemonHunter;

/**
 * TODO: Break up controllers into FormActions and ResultActions
 * @author shill
 *
 */
class DefaultController extends CMSController
{
    private $server_results = "server_results";	
	
    public function indexAction(){
    	$pid = 1;
    	//        return $this->render('HillCMSCCBLBundle:Default:index.html.twig', array("main" => $homegroups['Main'][0], "slides" => $homegroups["Slide"]));
    	$em = $this->getDoctrine()->getManager();
    	$repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
    	$pagethings = $repo->findBy(array("pageid" => $pid)); //our people page id
    	if (sizeof($pagethings) === 0){
    		//empty page
    		return new Response("Error", 404);
    	}
    	$homegroups = $this->buildPageGroups($pagethings);
        return $this->render('HillCMSRnaMakerBundle:Default:index.html.twig', array("groups" => $homegroups['Main']));
    }
    
    
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
    	$fd = fopen("/scratch/testing", "a");
    	
    	
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
     * right now handles requests from both forms. Only expectation of this type of function is that it returns a token that points to the result.
     *
     * Eventually they should each have their own action.
     */
    public function dummyAction(){
    	$request = $this->getRequest();
    	$data = $request->request->all();
    	if ($request->getMethod() === 'POST') {
    		//assert non-null form values
    	} else{
    		return new Response("", 403);
    	}
    	sleep(1);
    	$result = "m. Donec elementum odio in dui sollicitudin, at feugiat erat blandit. Duis est justo, porttitor nec leo scelerisque, tempus scelerisque est. Integer porttitor bibendum justo vitae molestie. Integer a lacus sit amet nisl pretium varius eu vel sapien. Vestibulum convallis mi nec mauris mattis hendrerit. Nunc leo dui, condimentum quis arcu eu, fringilla luctus arcu. In hac habitasse platea dictumst. Nulla convallis id lorem ut adipiscing. Aenean nec aliquet leo. Nullam convallis tortor fermentum vestibulum bibendum. In interdum lorem eros, sed convallis nunc imperdiet ac. Cras vel erat nec arcu ornare blandit at in ante.";
    	//placeholder, comes from daemon
    	$token = uniqid("result_");
    	$fd = fopen($this->server_results . "/". $token, "w");
    	fwrite($fd, $result);
    	fclose($fd);
    	return new Response($token, 200);
    }
    
    public function emptyAction(){
    	return new Response("Bad Request.", 403);
    }
    

    
    
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
    	return $this->render('HillCMSRnaMakerBundle:Default:oligodesigner.html.twig', array("groups"=> $homegroups["Oligo"]));
    }
    
    /**
     * Request handler for Oligo Designer.  Expects a post and the arguments to be passed to the command line function. Then opens (hunts)
     * a socket and connects to the Server's Daemon. Upon return, it will pass the results (both specified in the json file and output by the server) to the user.
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
    	$json = $daemonSocket->jsonBuilder("amiR_final.pl", "amiR_final.pl", $this->server_results."/".uniqid("amiRNA_"), $arguments);
    	/*
    	 *  Example job.
    	*  $json = $daemonSocket->jsonBuilder("nqueens", "./nqueens.py", $this->server_results."/".uniqid("nqueens_"), $arguments);
    	*  $arguments = array(0=>"12");
    	*/
    	$result = $daemonSocket->socketSend($json);
    	$tokens = explode(",",$result);
    	if(sizeof($tokens) > 1){
    		$token = trim($tokens[1]);
    	} else{
    		return new Response("Error, unexpected response.", 500);
    	}
    	return new Response($token ."", 200);
    
    }
    
    
    /**
     * Universal results action. If a custom results page is a needed a new action should be written. This function finds the file with the 
     * class field server_result. It expects the token to be the filename.
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
