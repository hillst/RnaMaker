var app = angular.module('SyntasiOligoResults', ['syntasi-services'])
.config( [
    '$compileProvider',
    function( $compileProvider ){   
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|blob|http):/);
     }
]);

app.controller("resultsController", function($scope, resultsService, oligoDataService){
    this.oligos;
    var curObj = this;
    this.numBlocks;
    this.construct;
    var url = angular.element(path).text();
    resultsService.getSyntasis(url).then(function(data){
        $scope.oligos = data;
        var content = "";
        for (var label in $scope.oligos.results){
            content += label + ": 5' " + $scope.oligos.results[label] + " 3'\n";
        }
        $scope.oligos.syntasiRNA = "";
        for (var i = 0; i< $scope.oligos.results['syntasiRNA'].length; i++){
            for(key in $scope.oligos.results.syntasiRNA[i]){
                $scope.oligos.syntasiRNA += $scope.oligos.results.syntasiRNA[i][key];
            }
        }
        $scope.oligos["syntasiRNA*"] = oligoDataService.reverseComplement($scope.oligos.syntasiRNA);
        var content = "syn-tasiRNA: 5' "+ $scope.oligos.syntasiRNA +" 3'\n";
        for (var i = 0; i< $scope.oligos.results['syntasiRNA'].length; i++){
            for(key in $scope.oligos.results.syntasiRNA[i]){
                content += key + ": 5' " + $scope.oligos.results.syntasiRNA[i][key] + " 3'\n";
            }
        }
        content += "syn-tasiRNA*: 5' "+ $scope.oligos['syntasiRNA*'] +" 3'\n";
        content += "Forward Oligo: 5' "+ $scope.oligos.results["Forward Oligo"] +" 3'\n";
        content += "Reverse Oligo: 5' "+ $scope.oligos.results["Reverse Oligo"] +" 3'\n";
        var blob = new Blob([ content ], { type: "text/plain" });
        $scope.downloadUrl = (window.URL || window.webkitURL).createObjectURL( blob );
    });
});
