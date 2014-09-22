/**
 * Created by Steve on 9/11/2014.
 */
var Wizard = angular.module("Wizard", []);
Wizard.directive("wizInit", function(){
    return {
        restrict: "E",
        controller: function($scope, $http){
            $scope.steps = {};
            $scope.history = [{"step": "", "data": {}}]; //represents our data state
            $scope.currentStep = ""; //just represents the name of the current step
            $scope.addStep = function(step){
                $scope.steps[step.title] = step;
            };
            //when you advance a step you should receive all of the data in the history step
            $scope.advanceStep = function(nextStep, callback){
                if ($scope.steps[nextStep] == undefined){
                    return;
                }
                var histObj = {"step": nextStep, "data": $scope.clone($scope.getCurrentData())};
                $scope.history.push(histObj);
                $scope.currentStep = nextStep;
                $scope.$apply();
                $scope.$broadcast("continueEvent");
            };
            $scope.setCurrentStep = function(stepName){
                $scope.currentStep = stepName;
            }
            $scope.previousStep = function(){
                if ($scope.history.length < 2){
                    return;
                }
                $scope.history.pop();
                $scope.currentStep = $scope.getCurrentStep();
                $scope.$broadcast("backEvent");
                $scope.$apply();
            };
            $scope.reset = function(){
                var first = $scope.history[0];
                $scope.history = [first];
                $scope.currentStep = first.step;
                $scope.$apply();
                $scope.$broadcast("resetEvent");
            };
            $scope.getCurrentData = function(){
                return $scope.history[$scope.history.length - 1].data;
            }
            $scope.getCurrentStep = function(){
                return $scope.history[$scope.history.length - 1].step;
            }
            $scope.isSet = function(current){
                return (current == $scope.currentStep);
            }
            $scope.clone = function(toClone){
                return JSON.parse( JSON.stringify( toClone ) );
            }
        }
    }
});
Wizard.directive("wizStep", function(){
   return {
       restrict: "E",
       transclude: true,
       templateUrl: '/includes/js/angular/templates/wizStep.html',
       scope: true,
       controller: function($scope, $element ) {
           $scope.title = angular.element($element).attr("wiz-step-title") || "defaultTitle";
           $scope.wizStarting = angular.element($element).attr("wiz-starting");
           if ($scope.wizStarting === "true") {
               $scope.setCurrentStep($scope.title);
               //probably needs to be a setter or encapsulated in an object per documentation
               $scope.history[0].step = $scope.title;
           }
           $scope.element = $element;
           $scope.curData = $scope.getCurrentData();
           $scope.addStep($scope);
       }
   }
});

Wizard.directive("wizCont", function(){
    return {
        restrict: "EA",
        scope: {
            wizNextStep: '@',
            wizContTitle: '@',
            advance: '&',
            wizBool: "@",
            wizBoolValue: "@"
        },
        templateUrl: "/includes/js/angular/templates/wizCont.html",
        link: function($scope, $element) {
            $element.bind("click", function(){
                $scope.$parent.advanceStep($scope.wizNextStep);
                if( $scope.wizBool != undefined){
                    $scope.$parent.getCurrentData()[$scope.wizBool] = $scope.wizBoolValue || "true";
                }
            });
        }
    }
});

Wizard.directive("wizBack", function(){
    return {
        restrict: "EA",
        scope: {
            wizBackTitle: "@"
        },
        templateUrl: "/includes/js/angular/templates/wizBack.html",
        controller: function($scope, $element){
            $element.bind("click", function(){
                $scope.$parent.previousStep();
            });
        }
    }
});

Wizard.directive("wizReset", function(){
    return {
        restrict: "EA",
        scope: {
            wizResetTitle: "@"
        },
        templateUrl: "/includes/js/angular/templates/wizReset.html",
        controller: function($scope, $element){
            $element.bind("click", function(){
                $scope.$parent.reset();
            });
        }
    }
})
