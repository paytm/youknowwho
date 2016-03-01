/*jshint multistr: true ,node: true*/
"use strict";


var
    /* NPM Third Party */
    _                   = require('lodash');


function actions () {

    var self = this;

    self.R_ACTIONS           = {
        RE_EXIT                 : "RE_EXIT",
        SET_VARIABLE            : "SET_VARIABLE",
        DANGEROUS_EVAL          : "DANGEROUS_EVAL"
    };

}


/*
    returns true ( BOOLEAN ) if string true, false if string false, otherwise string
*/
actions.prototype.__toBoolOrNull = function(refVal) {

    if(refVal==="true")         return true;
    else if(refVal==="false")   return false;
    else if(refVal==="null")    return null;
    else return refVal;

};


/*
    doc/ruleEngine
    # Variables in Action Values

    - Almost all message properties can be used in Action Values as variables
    - The Syntax for variables is <%= userdata.amount %>
    E.g. This is not done. We have <%= userdata.amount %> with us. Your number is<%= userdata.number %> . OKay

    - Please note it is a direct replacement function and we use LODASH.template for this.
 */

actions.prototype.__toCompiledString = function(refVal) {
    if (typeof refVal !== 'string') return refVal;

    // a Simple optimization where we dont need to keep compiled function
    if(refVal.indexOf('<%=') <= -1) return refVal;

    // Lets compile it
    return _.template(refVal);
};


/*
   Apply Action
 */

actions.prototype._applyAction = function(msg, action, rule) {
    var
        self    = this,
        act     = _.get(action, "action", null);

    switch(act) {

        // Set variable
        case self.R_ACTIONS.SET_VARIABLE : {
            self.__applyActionSetVariable(msg, action, rule);
            break;
        }

        // Quit rule engine and do not test anymore rules
        case self.R_ACTIONS.RE_EXIT : {
            msg[self.R_ACTIONS.RE_EXIT] = true;
            break;
        }

        // eval the expression
        case self.R_ACTIONS.DANGEROUS_EVAL : {
            self.__applyActionDangerousEval(msg, action, rule);
            break;
        }


    }

};

/*
   Apply Action SET VARIABLE
 */

actions.prototype.__applyActionSetVariable = function(msg, action) {
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
actions.prototype.__applyActionDangerousEval = function(msg, action) {
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
actions.prototype._parseRuleAction = function(action) {

    var self = this;

    // If Rule Action values have true / false, then lets parse it to Boolean
    _.set(action, "value", self.__toBoolOrNull(_.get(action , "value", null)));

    // Compiled string ( variable based )
    _.set(action, "value", self.__toCompiledString(_.get(action , "value", null)));

    return action;
};


module.exports = actions;
