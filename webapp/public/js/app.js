'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute',
    //'ngSanitize',
    'ngProgress',
    'myApp.filters',
    'myApp.services',
    'myApp.directives',
    'myApp.controllers'
]).
config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'partials/partial1.html',
            controller: 'MyCtrl1'
        });
        $routeProvider.when('/view2', {
            templateUrl: 'partials/partial2.html',
            controller: 'MyCtrl2'
        });

        $routeProvider.when('/cards', {
            templateUrl: 'partials/cards.html',
            controller: 'CardController'
        });
        $routeProvider.when('/about', {
            templateUrl: 'partials/blank.html',
            controller: 'About'
        });
        $routeProvider.when('/inbox', {
            templateUrl: 'partials/inbox.html',
            controller: 'InboxController'
        });
        $routeProvider.otherwise({
            redirectTo: '/cards'
        });
    }
]).run(function($rootScope, ParseService) {
    $rootScope.currentUser = Parse.User.current()
    //console.log('run:',$rootScope.currentUser)
});
