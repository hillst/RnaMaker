(function(){
    //change name please
    var app = angular.module('SyntasiBuilder', [ 'syntasi-services','syntasi-directives', 'lvl.directives.dragdrop', 'ui.bootstrap' ]);
     
    app.controller('ddController', function(constructDataService, resultsService, oligoDataService, $scope){
        // function referenced by the drop target in the construct
        $scope.construct = constructDataService.getConstruct(); //share a reference now
        $scope.dropped = function(dragEl, dropEl) { 
            var drop = angular.element(dropEl);
            var drag = angular.element(dragEl);
            $scope.data = oligoDataService;
            
            // do nothing if the box is empty already
            if(drag.attr("prev-text") != undefined && drag.attr("prev-text").trim() == drag.text().trim()){
                return;
            }     
            //clear the previously applied color, if it exists
            var dpText = drop.text();
            if (dpText) {
                drop.text("Contstruct");
                drop.attr("style", "");
            }
            //add the dragged color
            resultName = drag.text().trim();
            constructEleName = drop.attr("prev-text");
            drColor = drag.attr("style");
            drop.text(resultName);
            drop.attr("style", drColor);
            
            //if element has been dragged from the grid, clear dragged color and reset construct
            if (drag.attr("x-lvl-drop-target") == 'true') {
                drag.text(constructEleName);
                drag.attr("style","");
                $scope.construct.middle[constructEleName] = "";
                //register removal    
            }
           
            $scope.construct.middle[constructEleName] = resultName;
            var resultSequence = resultsService.parseResultName(resultName);
            //sanity check
            if (resultSequence != undefined){
              oligoDataService.setConstruct(constructEleName, resultSequence); 
              $scope.$apply();
            }
        }
        $scope.remove = function(dragEl, dropEl) {
            var drop = angular.element(dropEl); //trash bin
            var drag = angular.element(dragEl); //element moved
            // ignore if it is one of our original elements
            if(drag.hasClass("element")){
               return;
            } else{
               var constructEleName = drag.attr("prev-text");
               drag.text(drag.attr("prev-text"));
               drag.attr("style", "");
               $scope.construct.middle[drag.attr("prev-text")] = "";
               oligoDataService.setConstruct(constructEleName, "");
               $scope.$apply();
               return;
            }
        }
    }); 
    app.controller("oligoController", function(oligoDataService, $scope){
        $scope.data = oligoDataService;
        this.isSet = function(key){
            if ($scope.data[key] != "" && $scope.data[key] != undefined){
                return true;
            } else{
                return false;
            }
        };
    });
    //Migrate the length from the other controller to this one. data should be accessed via service
    app.controller("ConstructController", function(resultsService, constructDataService, $scope){
        this.syntasis;
        var curObj = this;
        this.numBlocks;
        this.construct;
        resultsService.getSyntasis().then(function(data){
            curObj.syntasis = data;
            curObj.numBlocks = curObj.syntasis.blocks.length;
            curObj.initConstruct();
        });
        
        this.initConstruct = function(){
            this.construct = constructDataService.getConstruct();
            for (var i = 1; i < 7; i++){
                if(i <= 2){
                    this.construct.front["D" + (i)] = "";
                }
                else if(i > 2 && i <= this.numBlocks + 2){
                    this.construct.middle["D" + (i)] = "D" + (i);
                } else{
                    this.construct.end["D" + (i)] = "";
                }
            }
        }
    });
    app.controller("SyntasiController", function(resultsService, constructDataService, $scope){
        this.syntasis;
        var curObj = this;
        //no idea why this works
        var url = angular.element(token).text();
        resultsService.getSyntasis(url).then(function(data){
            curObj.syntasis = data;
            curObj.initSyntasi();
            curObj.construct = constructDataService.getConstruct();
        });
        this.formattedSyntasis = [];
        this.preview;
        this.colClass = "";
        $scope.isEmpty = function(obj){
            return (Object.keys(obj).length < 1);
        };
        // Wrapper function for the work that depends on getSyntasi   
        this.initSyntasi = function(){
            this.preview = this.syntasis.blocks[0].optimal["optimal 1.1"];
            this.colClass = "col-xs-" + Math.floor(12/this.syntasis.blocks.length);
            this.formatGeneSets(this.formattedSyntasis);
        }

        this.getColor = function(index, parentIndex, name){
            var totalLength = this.optimal.length + this.suboptimal.length;
            var localIndex = (index) * totalLength + (parentIndex);
            if (name == 'empty'){
                return "darkgrey";
            } else{
                return 'hsl(' + (Number(localIndex) + 1) * 210/totalLength + ',80%,70%)';
            }
        };

        //expectations:
        //  expects the tested structure, see code
        //  not tested on lists with unequal values (!!)
        // Format list
        // for all gene sets:
        // [set1, set2],
        // [set1.1, set2.1] 
        //
        this.formatGeneSets = function(result){
            var maxOpt = 0;
            var maxSub = 0;
            var optimal = []
            var suboptimal = []
            for (var key in this.syntasis.blocks){
                //optimal
                var set = this.syntasis.blocks[key];
                var optL = Object.keys(set.optimal).length;
                var subL = Object.keys(set.suboptimal).length;
                if ( optL  > maxOpt){
                    maxOpt = optL;
                }
                if( subL > maxSub) {
                    maxSub = subL;
                }
            }
            for (var i = 0; i < maxOpt; i++){
                for (var j = 0; j < this.syntasis.blocks.length; j++){
                    var keys = Object.keys(this.syntasis.blocks[j].optimal);
                    if (optimal[i] == undefined){
                        optimal[i] = [];
                    }   
                    if (i < keys.length){
                        var key = keys[i];
                        optimal[i][j] = this.syntasis.blocks[j].optimal[keys[i]];
                        optimal[i][j].name = keys[i];
                    } else{
                        optimal[i][j] = {"name": "empty"};
                    } 
                }
            }
            var offset = i; //set offset to previous last value
            for (var i = 0; i < maxSub; i++){
                for (var j = 0; j < this.syntasis.blocks.length; j++){
                    var keys = Object.keys(this.syntasis.blocks[j].suboptimal);
                    if (suboptimal[i] == undefined){
                        suboptimal[i] = [];
                    }
                    if (i < keys.length){
                        suboptimal[i][j] = this.syntasis.blocks[j].suboptimal[keys[i]];
                        suboptimal[i][j].name = keys[i];
                    } else{
                        suboptimal[i][j] = {"name": "empty"};
                    }
                }
            }
            this.optimal = optimal;
            this.suboptimal = suboptimal;
        }
    });
})();
