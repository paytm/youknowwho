/*jshint multistr: true ,node: true*/
"use strict";


var
    /* NPM Third Party */
    _                   = require('lodash'),

    /* YKW Internals */
    UTILITIES           = require('../utilities');


function action () {

    var self = this;

    self.R_ACTIONS           = {
        RE_EXIT                 : "RE_EXIT",
        SET_VARIABLE            : "SET_VARIABLE",
        DANGEROUS_EVAL          : "DANGEROUS_EVAL"
    };

}

/*
   Apply Action
 */

action.prototype.apply = function(callback , msg, action) {
    var
        self    = this,
        act     = _.get(action, "action", null);

    switch(act) {

        // Set variable
        case self.R_ACTIONS.SET_VARIABLE : {
            self._setVariable(msg, action);
            return callback(null);
        }

        // Quit rule engine and do not test anymore rules
        case self.R_ACTIONS.RE_EXIT : {
            msg[self.R_ACTIONS.RE_EXIT] = true;
            return callback(null);
        }

        // eval the expression
        case self.R_ACTIONS.DANGEROUS_EVAL : {
            self._dangerousEval(msg, action);
            return callback(null);
        }
    }

};

/*
   Apply Action SET VARIABLE
 */

action.prototype._setVariable = function(msg, action) {
    var
        // key, value
        actKey          = action.key,
        actVal          = action.value;

    // Value can be a compiled function or a direct value
    if(typeof actVal === "function")    _.set(msg,  actKey, actVal(msg));
    else    _.set(msg,  actKey, actVal);

};

/*
   Apply Action DANGEROUS_EVAL
*/
action.prototype._dangerousEval = function(msg, action) {
    var
        // key, value
        actKey          = action.key;

    // JSHINT for eval

    if (typeof action.value === "function") _.set(msg, actKey, eval(action.value(msg)));
    else    _.set(msg,  actKey, eval(action.value));

};


/*
    Pre Parse Rule Action Values based
    This is done at the time of Rules Loading to make rule executions faster
*/
action.prototype._parseRuleAction = function(action) {

    var self = this;

    // If Rule Action values have true / false, then lets parse it to Boolean
    _.set(action, "value", UTILITIES.toBoolOrNull(_.get(action , "value", null)));

    // Compiled string ( variable based )
    _.set(action, "value", UTILITIES.toCompiledString(_.get(action , "value", null)));

    return action;
};


module.exports = action;
