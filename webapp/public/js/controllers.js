'use strict';

/* Controllers */

angular.module('myApp.controllers', ['ngSanitize'])
    .controller('MyCtrl1', [

        function() {

        }
    ])
    .controller('MyCtrl2', [

        function() {

        }
    ])
    .controller('Settings', [

        function() {

        }
    ])
    .controller('About', [

        function() {

        }
    ])
    .controller('LoginController', ['$scope', 'ParseService', '$location', '$rootScope',
        function($scope, ParseService, $location, $rootScope) {
            // redirect to "/" if user is already logged in
            if ($rootScope.currentUser !== null) {
                $location.path("/");
            }

            function loginSuccessful(user) {
                $rootScope.$apply(function() {
                    // set the current user
                    $rootScope.currentUser = Parse.User.current();
                    // redirect
                    $location.path("/");
                });
            }

            function loginUnsuccessful(user, error) {
                alert("Error: " + error.message + " (" + error.code + ")");
            }

            $rootScope.loggedIn = function() {
                //console.log($rootScope.currentUser)
                if ($rootScope.currentUser === null || $rootScope.currentUser === undefined) {
                    return false;
                } else {
                    return true;
                }
            };

            $scope.login = function() {
                var username = $scope.login.username;
                var password = $scope.login.password;

                Parse.User.logIn(username, password, {
                    success: loginSuccessful,
                    error: loginUnsuccessful
                });
            };

            $scope.logout = function() {
                $rootScope.currentUser = null;
                Parse.User.logOut();
                console.log('logging out');
            }

            $scope.signup = function() {
                console.log('registering new user')
                var email = $scope.newuser.email
                var password = $scope.newuser.password

                Parse.User.signUp(email, password, {
                    email: email
                })
                    .then(function() {
                        console.log('Successfully created new user')
                        location.href = '/'
                        // after verification, then we start connecting inboxes
                    }, function() {
                        console.log('failed creating new user')
                        alert('Unable to create new user')
                    })
            }
        }
    ], {
        $inject: ['$http']
    })
    .controller('CardController', ['$scope', 'CardService', 'Inbox', '$rootScope',
        function($scope, CardService, Inbox, $rootScope) {
            if ($rootScope.loggedIn()) {
                $scope.loading = true
                Inbox.get(function(data) {
                    if (data.inboxes.length == 0) {
                        location.href = '/#/inbox'
                    } else {
                        CardService.getCards().then(function(data) {
                            //console.log(data)
                            $scope.cards = data
                            $scope.loading = false
                        })

                        $scope.done = function(idx) {
                            //console.log('idx: ', idx);]
                            $scope.cards[idx].set('done', true);
                            $scope.cards[idx].save(null, {
                                success: function(card) {
                                    //console.log('done updating')
                                },
                                error: function(card, error) {
                                    // Execute any logic that should take place if the save fails.
                                    // error is a Parse.Error with an error code and description.
                                    console.log('Failed to update object, with error code: ' + error.description);
                                }
                            });

                        }

                        $scope.card_done = function(card) {
                            return !card.get('done') || $scope.show_archive
                        }
                    }
                })
            } else {
                $scope.cards = []
            }

            $scope.sync = function() {
                CardService.sync().then(function(data) {
                    //console.log(data)
                    $scope.cards = data
                })
            }
            //console.log('ParseService: ',getCards)
        }
    ], {
        $inject: ['$scope', 'CardService']
    })
    .controller('InboxController', ['$scope', 'Inbox', '$http', 'ngProgress',
        function($scope, Inbox, $http, ngProgress) {
            $scope.inboxLoaded = false
            //console.log(Inbox)
            Inbox.get(function(data) {
                //ngProgress.start()
                $scope.inboxes = data.inboxes
                $scope.inboxLoaded = true
                //ngProgress.complete()
            })

            $scope.currentUser = Parse.User.current()
            //console.log($scope.currentUser)

            $scope.addNewInbox = function() {
                var cur_user = Parse.User.current()
                if (!cur_user) {
                    alert('Must login first')
                    return
                }

                $http.post('/api/add-new-inbox/' + cur_user.id)
                    .success(function(data, status, headers, config) {
                        /*
                        {
  "success": true,
  "token": "wrmebvglgwxaidk1",
  "resource_url": "https://api.context.io/2.0/connect_tokens/wrmebvglgwxaidk1",
  "browser_redirect_url": "https://api.context.io/connect/wrmebvglgwxaidk1"
}
                        */
                        if (data.success) {
                            window.location = data.browser_redirect_url;
                            // after that we'll receive:
                            // http://localhost:8000/?contextio_token=9j1oknhboqnvez2c
                        } else {
                            console.log(data)
                            alert('Unable to add new inbox')
                        }
                    })
                    .error(function(data, status, headers, config) {
                        //console.log(data, status, headers, config)
                        alert('cannot add new inbox: ' + data)
                    });
            }
        }
    ], {
        $inject: ['$scope', 'Inbox']
    });
