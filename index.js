/*jshint multistr: true ,node: true*/
"use strict";

var
    /* NODE internal */

    /* NPM Third Party */
    _                         = require('lodash'),

    /* YKW INTERNALS */
    RULE_CLASS                = require('./lib/rule');


function YKW (opts) {
    var self  = this;
    self.RULE = new RULE_CLASS();
    self.opts = opts;
}

YKW.prototype.loadRules  = function (rules) {
    var self = this;
    self.RULE.loadRules(rules);
};

YKW.prototype.applyRules = function (callback, message, tag) {
    var self = this;
    self.RULE.executeRules(callback, message, tag);
};


/* set the execution context of user-defined-function */
YKW.prototype.setExecContext = function (context) {
    var self = this;
    self.RULE.ACTION.execCtx = context;

};



module.exports = YKW;


if (require.main == module) {
    /*
     If executed directly, start the web server .
     */
    var
        /* NPM Third Party */
        CONFIG          = require('./config.js'),
        PROGRAM         = require('commander'),

        /* internal */
        WEBSERVER       = require('./webServer/server.js'),
        YKW_INSTANCE    = new YKW({}),
        WS              = new WEBSERVER(CONFIG, YKW_INSTANCE);

    PROGRAM
        .option('-v, --verbose', 'Run in verbose mode')
        .option('-p, --port <path>', 'Specify port number')
        .parse(process.argv);

    if (PROGRAM.verbose)    CONFIG.LOG_LEVEL = "verbose";

    if (PROGRAM.port)       CONFIG.WEBSERVER.PORT = PROGRAM.port;

    WS.setup(function (error) {
        if (error) {
            process.exit(1);
        }

        WS.start();
    });

}
