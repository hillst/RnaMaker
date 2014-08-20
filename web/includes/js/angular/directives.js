(function(){
    var app = angular.module("syntasi-directives", []);    
    app.directive('syntasiTabs', function(){
        return {
            restrict: "E",
            templateUrl: "/includes/js/angular/templates/syntasi-tabs.html",
            controller: function(){
                this.tab = 1;
                this.setTab = function(newValue){
                    this.tab = newValue;
                };
                this.isSet = function(tabName){
                    return this.tab === tabName;
                }
            },
            controllerAs: "tab"
        };
    });
    app.directive("helpTab", function(){
        return {
            restrict: "E",
            templateUrl: "/includes/js/angular/templates/help-tab.html"
        }
    });
    app.directive('detailsTab', function(){
        return {
            restrict: "E",
            templateUrl: "/includes/js/angular/templates/details-tab.html",
            controller: function() {
            }
        }
    });
    app.directive("constructTab", function(){
        return {
            restrict: "E",
            templateUrl: "/includes/js/angular/templates/construct-tab.html",
            controller: function() {
            }
        }
    });
})();
