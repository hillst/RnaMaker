<?php

namespace HillCMS\RnaMakerBundle\Controller;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use HillCMS\ManageBundle\Controller\CMSController;
use HillCMS\RnaMakerBundle\ClientSocket\DaemonHunter;

/**
 *   syntasiRNASuiteController handles all actions related to the syntasiRNA Suite.
 *   Right now that is just the syntasiRNA Oligo designer.
 *   @author shill
 *
 */
class syntasiRNASuiteController extends CMSController
{
    private $server_results = "server_results";
    private $server_encoded = "server_encoded";	
    /**
     * action which should only be called when the /syntasiRnaSuite/ route is taken.
     * For now it will redirect to the only viable action.
     */	
    public function indexAction(){
        return $this->redirect($this->generateUrl('rnamaker_syntasi_oligorequest'));
        return $this->render('HillCMSRnaMakerBundle:Default:index.html.twig', array("groups" => $homegroups['Main']));
    }
    
    public function syntasiOligoDesignerFormAction(){
        $pid = 5;
        $em = $this->getDoctrine()->getManager();
        $repo = $em->getRepository("HillCMSManageBundle:CmsPageThings");
        $pagethings = $repo->findBy(array("pageid" => $pid)); //our people page id
        if (sizeof($pagethings) === 0){
            //empty page
            return new Response("Error", 404);
        }
        $homegroups = $this->buildPageGroups($pagethings);
        return $this->render('HillCMSRnaMakerBundle:Default:syntasioligodesigner.html.twig', array("groups"=> $homegroups["syntasiRNAOligo"]));
    }

    public function syntasiOligoRequestAction(){
        //perl ./sites/amirna/bin/amiR_final.pl -s $seq -n $name -t $fb"
    
        //it is reasonable to code in the script in this file because this is the specific function's action.
        $request = $this->getRequest();
        if ($request->getMethod() === 'POST') {
            $seq = $request->get('seq');
            $name = $request->get('name');
            $fb = $request->get('fb'); 
            $syntasis = $request->get('syntasis');
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
        $arguments[6] = "-a";
        $arguments[7] = $syntasis;
        $json = $daemonSocket->jsonBuilder("amiR_final.pl", "amiR_final.pl", $arguments);
        /*
         *  Example job.
         *  $json = $daemonSocket->jsonBuilder("nqueens", "./nqueens.py", $this->server_results."/".uniqid("nqueens_"), $arguments);
        *  $arguments = array(0=>"12");
        */
        $result = $daemonSocket->socketSend($json);
        if(strlen($result) < 1){
            return new Response("Error, unexpected response.", 500);
        }
        $token = $this->jsonResultsDecoder($result);
        return new Response($token ."", 200);
    
    }
    /**
     * Decodes passed json and writes to two different files on the server, one encoded, one not encoded.
     * Generates a uniqID for the written files.
     */
    function jsonResultsDecoder($json_result){
        $token = uniqid("syntasiOligoDesigner_");
        $fd = fopen($this->server_encoded . "/" . $token, "w");
        fwrite($fd, $json_result);
        fclose($fd);
        $tokenized_results = json_decode($json_result);
        $plain_result = "syntasiRNA Cassette: 5' ". $tokenized_results->{"results"}->{"syntasiRNA"} . " 3'\n";
        $syntasis = explode(",", $tokenized_results->{"results"}->{"seq"});
        $stars = explode(",", $tokenized_results->{"results"}->{"miRNA*"});
        $names = explode(",", $tokenized_results->{"results"}->{"syntasis"});
        for ($i = 0; $i < sizeof($syntasis); $i++){
            $plain_result .= $names[$i] . "*" .": 5' ". $stars[$i] . " 3'\n";
            $plain_result .= $names[$i] . ": 5' " . $syntasis[$i] . " 3'\n";
        }
        $plain_result .= "Forward Oligo: 5' " . $tokenized_results->{"results"}->{"Forward Oligo"} . " 3'\n";
        $plain_result .= "Reverse Oligo: 5' " . $tokenized_results->{"results"}->{"Reverse Oligo"} . " 3'\n";

        //Write a plain text and json version, json for the view to render
        $plainfile = $this->server_results."/". $token;
        $fd = fopen($plainfile, "w");
        fwrite($fd, $plain_result);
        fclose($fd);
        return $token;
    }

    public function syntasiResultsAction($token){
        $fd = fopen($this->server_encoded . "/" . $token, "r");
        $result = "";
        while( ! feof($fd )){
            $result .= fread($fd, 8092);
        }
        fclose($fd);
        $decoded_result =  json_decode($result);
        $nameandseqs = array();
        $names = explode(",", $decoded_result->{"results"}->{"syntasis"});
        $seqs = explode(",", $decoded_result->{"results"}->{"seq"});
        $stars = explode(",", $decoded_result->{"results"}->{"miRNA*"});
        if ((sizeof($names) != sizeof($seqs)) && (sizeof($seqs) != sizeof($stars))){
            return new Response("Malformed json", 403);    
        } 
        for ($i = 0; $i < sizeof($names); $i++){
            $namesandseqs[$i] = array($names[$i],$seqs[$i],$stars[$i]);
        }
        $dlpath = $this->server_results . "/". $token;
        return $this->render("HillCMSRnaMakerBundle:Default:syntasiOligoResults.html.twig", array(
            "amiRNA" => $decoded_result->{"results"}->{"syntasiRNA"},
            "oligo1" => $decoded_result->{"results"}->{"Forward Oligo"},
            "oligo2" => $decoded_result->{"results"}->{"Reverse Oligo"},
            "syntasis" => $namesandseqs,
            "dl_token"=> $dlpath));
    }
}
