(function(){
    var app = angular.module('syntasi-services',[]);

    // resultsService is for returning a promise object which caches or returns the async
    //  data fetched from the server. There is no way to force your browser to "wait" for an object
    //  so to accomplish this work must be placed inside of a promise object. Additionally contains 
    //  utility functions for operating on the syntasi object.
    app.factory("resultsService", function($http) {
        var syntasis = "";
        var syntasisSynced; // for things that know all the data has already loaded
        var url = "/syntasi/dumbdata/syntasirnaDesigner_testjson";
        var resultsService = {
           getSyntasis : function(){
                //fetch the data
                if ( syntasis == "" ){
                    syntasis = $http.post(url).then(function (response) {
                        syntasisSynced = response.data;
                        return response.data; //gets picked up by then in controller
                    });
                    return syntasis;
                } else{
                    return syntasis; //return the promise to the controller
                }
           },
           parseResultName: function(name){
                var optimality = name.split(" ")[0];
                var nameNumber = name.split(" ")[1].split(".");
                return syntasisSynced.blocks[Number(nameNumber[0]) - 1][optimality][name]["syn-tasiRNA"];
           }
        };
        return resultsService;
    });
    // Factory controls the construct. Construct is the element which will be built by the user using
    //  objects inside the syntasi data object.
    app.factory("constructDataService", function(){
        var construct = {"front": {}, "middle": {}, "end": {}};
        var constructDataService = {};
        constructDataService.getConstruct = function(){
            return construct;
        }
        return constructDataService;
    });
    // Controls the oligo designer. Performs transformation on the selected syntasi-RNAs to create
    //  an appropriate forward and reverse oligo. 
    app.factory("oligoDataService", function(){
        var bsa1 = "ATTA";
        var bsa2 = "GTTC";
        var forwardOligo = "";
        var reverseOligo = ""
        var oligoDataService = {"D3": "", "D4": "", "D5": "", "D6" : "", "forwardOligo" : "", "reverseOligo": "" }
        oligoDataService.setConstruct = function(item,value){
            this[item] = value;
            var returnedOligos =  computeOligos();
            this.forwardOligo = returnedOligos[0];
            this.reverseOligo = returnedOligos[1];
        };
        oligoDataService.getForwardOligo = function(){
            return forwardOligo;
        }
        //internal methods
        function computeOligos(){
            var forwardOligo = bsa1;
            forwardOligo += oligoDataService.D3;
            forwardOligo += oligoDataService.D4;
            forwardOligo += oligoDataService.D5;
            forwardOligo += oligoDataService.D6;
            //base case
            if (forwardOligo == bsa1){
                forwardOligo = "";
            }

            reverseOligo = "";
            reverseOligo += oligoDataService.D3;
            reverseOligo += oligoDataService.D4;
            reverseOligo += oligoDataService.D5;
            reverseOligo += oligoDataService.D6;
            reverseOligo = reverseSeq(reverseOligo);
            reverseOligo = complementSeq(reverseOligo);
            reverseOligo = bsa2 + reverseOligo;
            //base case
            if (reverseOligo == bsa2){
                reverseOligo = "";
            }
            return [forwardOligo, reverseOligo];
        };
        oligoDataService.reverseComplement = function(dnaSequence){
            return complementSeq(reverseSeq(dnaSequence));
        }
        function reverseSeq(dnaSequence) {
            var tempDnaArray = new Array();
            if (dnaSequence.search(/./) != -1)  {
                tempDnaArray = dnaSequence.match(/./g);
                tempDnaArray = tempDnaArray.reverse();
                dnaSequence = tempDnaArray.join("");
            }
            return dnaSequence;
        };
        function complementSeq(dnaSequence){
            dnaSequence = dnaSequence.toUpperCase();
            dnaSequence = dnaSequence.replace(/C/g,"g");
            dnaSequence = dnaSequence.replace(/G/g,"c");
            dnaSequence = dnaSequence.replace(/A/g,"t");
            dnaSequence = dnaSequence.replace(/T/g,"a");
            dnaSequence = dnaSequence.replace(/U/g,"a");
            dnaSequence = dnaSequence.toUpperCase();
            return dnaSequence;
        };
        return oligoDataService;
    });
})();
