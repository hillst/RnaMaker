<?php



namespace HillCMS\RnaMakerBundle\Controller;

use Symfony\Component\HttpFoundation\Response;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

/**
 * Controller which handles everthing, probably should move into seperate controllers.
 * @author shill
 *
 */
class AngularController extends Controller
{
    private $server_results = "server_results";
    private $server_encoded = "server_encoded"; 
   //we could have an argument here to make it more API like
    public function indexAction(){
            return $this->render('HillCMSRnaMakerBundle:Default:angular.html.twig', array());
    }
    public function syntasiRNADesignerResultsAction($token){
        return $this->render('HillCMSRnaMakerBundle:Default:angular.html.twig', array("token"=>$token));
    }
    public function syntasiResultsDataAction($token){
        $fd = fopen($this->server_encoded ."/" . $token, "r");
        $results = "";
        while( ! feof($fd) ){
            $results .= fread($fd, 8092);
        }
        fclose($fd);
        return new Response($results, 200);
    }
}
