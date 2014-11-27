/*
 * Serve JSON to our AngularJS client
 */
var ContextIO = require('contextio');
var ctxioClient = new ContextIO.Client('2.0', {
    key: "",
    secret: ""
});

var Kaiseki = require('kaiseki');
var parse = new Kaiseki('',
    '');
parse.masterKey = ''

exports.name = function(req, res) {
    res.json({
        name: 'Bob'
    });
};

exports.addInbox = function(req, res) {
    var user_id = req.params.user_id

    parse.getUser(user_id, function(err, pres, body, success) {
        if (err) throw err
        var cur_user = body
        var contextio_account_id = cur_user.contextio_account_id
        console.log('cur_user: ', cur_user)

        if (contextio_account_id) {
            ctxioClient.accounts(contextio_account_id).connect_tokens().post({
                callback_url: 'http://' + req.headers.host + '/api/got-contextio-token/' + contextio_account_id
            }, function(err, response) {
                if (err) throw err;

                res.json(response.body);
            })
        } else {
            ctxioClient.accounts().post({
                email: cur_user.email
            }, function(err, response) {
                if (err) throw err;
                console.log(response)
                /*
                {
  "success": true,
  "id": "52daabefcea6f9c35a4a0997",
  "resource_url": "https://api.context.io/2.0/accounts/52daabefcea6f9c35a4a0997"
}
*/
                if (response.body.success == true) {
                    var contextio_account_id = response.body.id
                    parse.updateUser(cur_user.objectId, {
                        contextio_account_id: contextio_account_id
                    }, function(err, pres, body, success) {
                        if (err) {
                            res.json({
                                success: false,
                                message: 'Unable to save new inbox information'
                            })
                            throw err
                        } else {
                            console.log('updated at = ', body.updatedAt);
                            // contextio connect tokens
                            console.log('requesting connect_tokens for: ', contextio_account_id)
                            ctxioClient.accounts(contextio_account_id).connect_tokens().post({
                                callback_url: 'http://' + req.headers.host + '/api/got-contextio-token/' + contextio_account_id
                            }, function(err, response) {
                                if (err) throw err;

                                res.json(response.body);
                            })

                        }
                    })
                } else {
                    res.send(500, response.body.feedbackCode)
                }

            })
        }
    });
}

exports.gotContextioToken = function(req, res) {
    var contextio_token = req.query.contextio_token;
    var contextio_account_id = req.params.contextio_account_id;

    //console.log(req.query.contextio_token)

    res.redirect('/#/inbox')
}

exports.inbox = function(req, res) {
    var userId = req.params.userId

    parse.getUser(userId, function(err, pres, body, success) {
        if (err) throw err
        var cur_user = body
        var contextio_account_id = cur_user.contextio_account_id
        //console.log('cur_user: ', cur_user)

        if (contextio_account_id) {
            ctxioClient.accounts(contextio_account_id).connect_tokens().get(function(err, response) {
                if (err) throw err;
                var inboxes = []
                response.body.forEach(function(token) {
                    inboxes.push({
                        email: token.email,
                        token: token.token
                    })
                });
                res.json({
                    inboxes: inboxes
                })
            })
        } else {
            res.json({
                inboxes: []
            })
        }
    })
}

exports.sync_invoke = function(req, res) {
    var userId = req.params.userId

    parse.getUser(userId, function(err, pres, body, success) {
        if (err) throw err
        var cur_user = body
        var contextio_account_id = cur_user.contextio_account_id
        //console.log('cur_user: ', cur_user)

        if (contextio_account_id) {
            ctxioClient.accounts(contextio_account_id).sync().post(function(err, response) {
                if (err) throw err;

                res.json({
                    success: response.body.success
                })
            })
        } else {
            res.json({
                success: false
            })
        }
    })
}

exports.sync_status = function(req, res) {
    var userId = req.params.userId

    parse.getUser(userId, function(err, pres, body, success) {
        if (err) throw err
        var cur_user = body
        var contextio_account_id = cur_user.contextio_account_id
        //console.log('cur_user: ', cur_user)

        if (contextio_account_id) {
            ctxioClient.accounts(contextio_account_id).sync().get(function(err, response) {
                if (err) throw err;

                res.json({
                    success: true,
                    status: response.body
                })
            })
        } else {
            res.json({
                success: false,
                status: null
            })
        }
    })
}
