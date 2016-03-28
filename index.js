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