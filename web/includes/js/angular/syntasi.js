(function(){
    //change name please
    var app = angular.module('SyntasiWizard', ['Wizard', 'ui.bootstrap']); 
     
    //Migrate the length from the other controller to this one. data should be accessed via service
    app.controller("SyntasiWizCtrl", function($scope, $modal, dataService){
        var curObj = this;
        var url = angular.element(token).text();
        $scope.open = function (size) {
            var modalInstance = $modal.open({
                templateUrl: '/includes/js/angular/templates/syntasiWizard.html',
                controller: ModalInstanceCtrl,
                size: size
            });
        };
    });
    app.controller("dataCtrl", function($scope, $http, dataService){
        var url = angular.element(token).text();
        $scope.loader = "my-result alert alert-warning hidden";
        $scope.loaderText = "Jobs generally take a few minutes to finish. Please wait.";
        $scope.hideSpinner = false;
        $scope.showHelp = false;
        $scope.$on("continueEvent", function(){
            $scope.showHelp = false;
        });
        $scope.$on("backEvent", function(){
            $scope.showHelp = false;
        });
        $scope.$on("resetEvent", function(){
            $scope.showHelp = false;
        });
        $scope.toggleHelp = function(){
            $scope.showHelp = !$scope.showHelp;
        }
        //returns a list of gene sets by name, converts fasta headers
        $scope.formatGeneSets = function(){
            //look through current data
            var data = $scope.getCurrentData();
            var names = []
            if(data.fastaTranscriptSeqs.length > 1){
                //do something
                for (var i = 0; i < data.fastaTranscriptSeqs.length; i++){
                    var current = data.fastaTranscriptSeqs[i];
                    var currentArr = current.split("\n");
                    var curNames = []
                    currentArr.forEach(function(element, index, array){
                        if (element.substring(0,1) == ">"){
                            curNames.push(element.substring(1,element.length));
                        }
                    });
                    names.push(curNames.join(","));
                }
                return names;
            } else{
                return data.transcriptIds;
            }
        }
        dataService.getDatabases(url).then(function(data){
            $scope.databases = data;
            $scope.getCurrentData().database = $scope.databases[0];
        });
    });
    app.controller("FastaCtrl", function($scope){
        $scope.validFasta = false;
        $scope.errorMessage = "Please input valid fasta sequences.";
        console.log("come back to the fasta validation");
    });
    app.directive("helpPane", function(){
        return {
            restrict: "E",
            templateUrl: "/includes/js/angular/templates/helpPane.html",
            transclude: true
        }
    });
    app.directive("helpButton", function(){
        return{
            restrict: "E",
            templateUrl: "/includes/js/angular/templates/helpButton.html"
        }
    });
    app.directive("submitButton", function(){
        return {
            restrict: "A",
            controller: function($scope, $element, $http){
                $scope.redirect = "";
                $scope.hasSubmitted = false;
                $scope.$on("resetEvent", function(){
                    $scope.resultsPath = undefined;
                    $scope.hasSubmitted = false;
                    $scope.loader = "my-result alert alert-warning hidden";
                    $scope.hideSpinner = false;
                    $scope.loaderText = "Jobs generally take a few minutes to finish. Please wait.";
                    angular.element($element).text("Submit");
                    $scope.$apply();
                });
                $scope.submitForm = function(){
                    var submitUrl = angular.element(submit).text();
                    if ($scope.resultsPath){
                        window.location = $scope.resultsPath;
                    } else{
                        if( $scope.hasSubmitted ) {
                            console.log("nice try jerk");
                            return; //nice try jerk
                        }
                        $scope.hasSubmitted=true;
                        $scope.loader = "my-result alert alert-warning";
                        $http.post(submitUrl, $scope.getCurrentData()).success(function(response){
                            $scope.loader = "my-result alert alert-success";
                            $scope.loaderText = "Success!";
                            $scope.hideSpinner = true;
                            angular.element($element).text("Click to see Results");
                            $scope.resultsPath = angular.element(results).text().trim() +"/"+ response;
                        })
                        .error(function(data, status, headers, config) {
                            $scope.loader = "my-result alert alert-danger";
                            $scope.loaderText = data;
                            $scope.hideSpinner = true;
                            $scope.hasSubmitted = false; 
                        });
                    }
                }
            }
        }
    });
    //isolate scopes never do anything i want and never actually help
    app.directive("fieldDuplicator", function(){
        return {
            restrict: "E",
            transclude: true,
            template: '<div ng-transclude></div>',
            controller: function($scope, $element, $attrs){
                //assumes the tracked ID's are 0 based, only effects isVisible
                //the visible counts are quantitative therefore 1 based
                $scope.currentVisible = angular.element($element).attr('dup-start-visible') || 1;
                $scope.maxVisible =  angular.element($element).attr('dup-max-visible') || 4;
                $scope.range = []
                for (var i=0; i < $scope.maxVisible; i++){
                    $scope.range[i] = i;
                }
                $scope.isVisible = function(id){
                    return id < $scope.currentVisible; 
                }
                $scope.incrementVisible = function(){
                    if ($scope.currentVisible < $scope.maxVisible)
                        $scope.currentVisible++;
                }
                $scope.decrementVisible = function(){
                    if ($scope.currentVisible > 1)
                        $scope.currentVisible--;
                }
                $scope.showPlus = function(){
                    return $scope.currentVisible < $scope.maxVisible;
                }
                $scope.showMinus = function(){
                    return $scope.currentVisible > 1;
                }
            }
        };
    });
    var ModalInstanceCtrl = function ($scope, $modalInstance, dataService) {
        $scope.ok = function () {
            $modalInstance.close();
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
    app.factory("dataService", function($http) {
        var databases = "";
        var databasesSynced;
        var dataService = {
           getDatabases : function(url){
                if ( databases == "" ){
                    databases = $http.post(url).then(function (response) {
                        databasesSynced = response.data;
                        return response.data; //gets picked up by then in controller
                    });
                    return databases;
                } else{
                    return databases; //return the promise to the controller
                }
           }
        };
        return dataService;
    });
})();
