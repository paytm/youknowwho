/*
    Main Rule Engine Object
*/

/*jshint multistr: true ,node: true*/
"use strict";

var
    /* NODE internal */

    /* NPM Third Party */
    _                         = require('lodash'),

    /* YKW INTERNALS */
    RULE                      = null,
    RULE_CLASS                = require('./lib/rule');


function YKW (opts) {

    var self = this;
    RULE = new RULE_CLASS();

    self.opts  = opts;
}


YKW.prototype.loadRules  = function (rules) {
    RULE.loadRules(rules);
};

YKW.prototype.applyRules = function (callback, message, tag) {
    RULE.executeRules(callback, message, tag);
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
