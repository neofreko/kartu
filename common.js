var ContextIO = require('contextio');
var ctxioClient = new ContextIO.Client('2.0', {
    key: "",
    secret: ""
});

var Kaiseki = require('kaiseki');
var parse = new Kaiseki('',
    '');
parse.masterKey = ''

var asmart = require('./asmart-engine')

var amazonjp = require('./amazon-engine')

var kuroneko = require('./kuroneko-engine')
//console.log(kuroneko)

// mail parsers
var parsers = [asmart, amazonjp, kuroneko];

module.exports = {
    ctxioClient: ctxioClient,
    parse: parse,
    parsers: parsers
}
