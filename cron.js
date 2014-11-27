var Q = require('q')

var common = require('./common')

var ctxioClient = common.ctxioClient

var parse = common.parse

var asmart = require('./asmart-engine')

var amazonjp = require('./amazon-engine')

var kuroneko = require('./kuroneko-engine')
//console.log(kuroneko)

// mail parsers
var parsers = common.parsers

/*kuroneko.getStatus('http://toi.kuronekoyamato.co.jp/cgi-bin/tneko?type=1&no01=276144721904&id=324EDCE').then(function(data) {
    console.log(data)
})*/

/*asmart.getStatus('https://paysec.aplc.jp/SP/SPCA/SPCP0010/140128829260001b6e2ca53f110204b61357e729a1bcc600111c79b').then(function(data) {
    console.log(data)
})*/


// insert
// should sync first, otherwise new meial may not be there yet: https://api.context.io/2.0/accounts/id/sync
module.exports.syncInbox = function() {
    parse.getUsers(function(err, response, body, success) {
        if (err) throw err;
        //console.log(body);
        body.forEach(function(user) {
            if (user.contextio_account_id) syncInbox(user.contextio_account_id, user);
        })
    })
}

// update
module.exports.updateStatus = function() {
    parsers.forEach(function(engine) {
        parse.getObjects('Card', {
            where: {
                parsed_with: engine.name,
                is_final: false
            }
        }, function(err, response, body, success) {
            console.log('Updating cards for engine ', engine.name, ', ', body.length, ' items available')
            body.forEach(function(card) {
                if ('getStatus' in engine) {
                    engine.getStatus(card.link).then(function(data) {
                        parse.updateObject('Card', card.objectId, data, function(err, res, body, success) {
                            console.log('object updated at = ', body.updatedAt, ' using data: ', data);
                        });
                    })
                }
            })
        })
    })
}


function syncInbox(contextio_account_id, user) {
    console.log('processing contextio acc id: ', contextio_account_id)
    ctxioClient.accounts(contextio_account_id).get({
        limit: 15
    }, function(err, response) {
        if (err) throw err;
        //console.log(response.body);

        var acc = response.body;


        var filter_timestamp = new Date;
        filter_timestamp -= 7 * 24 * 60 * 60 * 1000 // 24 hours ago
        filter_timestamp = Math.floor(filter_timestamp / 1000) // unix time

        console.log('processing for ', acc.username)
        parsers.forEach(function(engine) {
            var filters = engine.filters;
            filters['indexed_after'] = filter_timestamp
            console.log(filters)
            ctxioClient.accounts(acc.id).messages().get(filters, function(err, response) {
                if (err) throw err;
                //console.log(response.body);
                if (!(response.body instanceof Array)) {
                    console.log('Error, expecting array of emails but received: ', response.body)
                    return;
                }
                // iterate messages
                var emails = response.body;

                emails.forEach(function(email) {
                    // check if message already parsed before
                    console.log('Ensure uniqueness: ', {
                        message_id: email.message_id,
                        owner: {
                            "__type": "Pointer",
                            "className": "_User",
                            "objectId": user.objectId
                        }
                    })
                    parse.getObjects('Card', {
                        where: {
                            message_id: email.message_id,
                            owner: {
                                "__type": "Pointer",
                                "className": "_User",
                                "objectId": user.objectId
                            }
                        }
                    }, function(err, response, body, success) {
                        console.log('Checking for ', email.message_id, ' got: ', body.length, ' items')

                        if (body.length > 0) {
                            console.log('Skipping previously processed message ', email.message_id)
                        } else {
                            console.log('fetching body for msg id: ', email.message_id);

                            ctxioClient.accounts(acc.id).messages(email.message_id).body().get({
                                type: 'text/plain'
                            }, function(err, response) {
                                if (err) throw err;
                                //console.log('message body',response.body);
                                var message_body = response.body[0]
                                var payload = engine.payloadExtractor(message_body, email.subject)
                                console.log('payload: ', payload)
                                var ACL = {}
                                ACL[user.objectId] = {
                                    read: true,
                                    write: true
                                }
                                payload.ACL = ACL
                                payload.owner = {
                                    "__type": "Pointer",
                                    "className": "_User",
                                    "objectId": user.objectId
                                }
                                payload.done = false
                                payload.message_id = email.message_id
                                payload.parsed_with = engine.name
                                payload.is_final = false
                                date_received = new Date(email.date_received * 1000)
                                payload.date_received = {
                                    __type: "Date",
                                    iso: date_received.toISOString()
                                }
                                parse.createObject('Card', payload, function(err, response, body, success) {
                                    if (err) {
                                        console.log('error processing: ', payload)
                                        throw err;
                                    }
                                    console.log('new card: ', body);
                                });
                            });
                        }
                    })
                })
            });
        })


    });
}
