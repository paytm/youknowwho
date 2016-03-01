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
    RULE_CLASS                = require('./rules'),

    ACTION                    = null,
    ACTION_CLASS              = require('./actions'),

    CONDITION                 = null,
    CONDITION_CLASS           = require('./conditions');



function YKW (opts) {

    RULE               = new RULE_CLASS();
    ACTION             = new ACTION_CLASS();
    CONDITION          = new CONDITION_CLASS();

    var self = this;

    self.opts  = opts;

    self._meta = {

        "ts" : {
            "rules_loaded" : null,
            "start"        : null,
            "end"          : null
        },

        "ruleEngineHash" : "",

        "rules" : {
        }

    };

}


YKW.prototype.loadRules = function (rules) {
    var self = this;

    /*
     Prototyping with this idea ,
     lets pass the objects for actions and conditions along
     with rules inside loadRules.

     This is because the parseAction and parseCondtion functions
     are used while loading the rules .

     */

    var loadRulesResult = RULE.loadRules(rules, CONDITION, ACTION);

    self._meta.ts.rules_loaded  = loadRulesResult.rules_loaded_time;
    self._meta.latest_rule_hash = loadRulesResult.ruleEngineHash;

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
