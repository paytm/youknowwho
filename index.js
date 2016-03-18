/*jshint multistr: true ,node: true*/

/*
    Main Rule Engine Object
*/


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


YKW.prototype.loadExecutables = function (executables) {
    var self = this;

    // Have to validate this set of executables before passing.
    self.RULE.ACTION.executables = executables;

};


YKW.prototype.setExecCtx = function (context) {
    /*

     This context is made available to all the functions passed as executables ..

     */

    var self = this;
    self.RULE.ACTION.execCtx = context;

};


module.exports = YKW;



/*
    ***************** TESTING ********************

    To test we use webserver. Just run it with -l flag
    and use it for /search url to test
*/


(function() {
    if (require.main === module) {
      var ykw = new YKW();
      ykw.loadRules();
    }
}());
