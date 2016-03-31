/*jshint multistr: true ,node: true*/
"use strict";
var

    /* NPM Third Party */
    CONFIG          = require('./config.js'),
    PROGRAM         = require('commander'),

    /* internal */
    WEBSERVER       = require('./webServer/server.js'),
    YKW             = require('./');


    /* Global Variables */

PROGRAM
    .option('-v, --verbose', 'Run in verbose mode')
    .option('-p, --port <path>', 'Specify port number')
    .parse(process.argv);


if (PROGRAM.verbose)    CONFIG.LOG_LEVEL = "verbose";

if (PROGRAM.port)       CONFIG.WEBSERVER.PORT = PROGRAM.port;

var YKW_INSTANCE = new YKW({});
var WS = new WEBSERVER(CONFIG, YKW_INSTANCE);


/*
 The setup function is used to meet any prereqs (Setting up db connections , instantiating logger etc before running the webserver ...
 */

WS.setup(function (error) {

    if (error) {
	process.exit(1);
    }

    WS.start();
});
