'use strict';

angular.module('myApp.services', ['ngResource'])
    .value('version', '0.1')
    .service('ParseService', [

        function() {
            var app_id = "UOevAcMHBoRwEZZTlrwMwXHqqAFnChS4DfCjOsnx";
            var js_key = "XyYNQKXaFWVKHPtqlDBisXZNT1S9u4wn6qpW1ztq";
            Parse.initialize(app_id, js_key);

            return Parse;
        }
    ])
    .service('CardService', ['$q', '$rootScope',

        function($q, $scope) {
            var cards = [{
                title: 'Text sample',
                description: '12345-679-00'
            }, {
                title: 'Link Sample',
                link: 'http://google.com'
            }, {
                title: 'Image Sample',
                image: 'http://docs.angularjs.org/img/angularjs-for-header-only.svg'
            }]
            //this.cards = cards

            return {
                getCards: function() {
                    //console.log(Parse.User.current());
                    var deferred = $q.defer();

                    if (!Parse.User.current()) {
                        deferred.reject()
                    } else {
                        var Card = Parse.Object.extend("Card");

                        var query = new Parse.Query(Card).descending('date_received');


                        query.find({
                            success: function(results) {
                                //console.log('parse returns: ', results)

                                $scope.$apply(function() {
                                    deferred.resolve(results);
                                });
                            },
                            error: function(error) {
                                console.log(error);
                            }
                        });
                    }
                    return deferred.promise;
                },
                sync: function() {
                    var deferred = $q.defer();

                    if (!Parse.User.current()) {
                        deferred.reject()
                    } else {
                        var Card = Parse.Object.extend("Card");

                        var query = new Parse.Query(Card).descending('date_received');


                        query.find({
                            success: function(results) {
                                //console.log('parse returns: ', results)

                                $scope.$apply(function() {
                                    deferred.resolve(results);
                                });
                            },
                            error: function(error) {
                                console.log(error);
                            }
                        });
                    }
                    return deferred.promise;
                }
            }
        }
    ])
    .factory('Inbox', ['$resource',
        function($resource, ParseService) {
            //console.log('resource?', $resource)
            var currentUser = Parse.User.current()
            //console.log('userid: ', currentUser.id)
            var Inbox = $resource('/api/:userId/inbox/:inboxId', {
                userId: currentUser ? currentUser.id : -1,
                inboxId: '@id'
            });
            //console.log('okay')

            return Inbox;
        }
    ]).factory('Sync', ['$resource',
        function($resource, ParseService) {
            //console.log('resource?', $resource)
            var currentUser = Parse.User.current()
            //console.log('userid: ', currentUser.id)
            var Sync = $resource('/api/:userId/sync', {
                userId: currentUser ? currentUser.id : -1
            });
            //console.log('okay')

            return Sync;
        }
    ]);
