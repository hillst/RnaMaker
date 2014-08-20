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
    //we could have an argument here to make it more API like
    public function indexAction(){
            return $this->render('HillCMSRnaMakerBundle:Default:angular.html.twig', array());
    }
}
