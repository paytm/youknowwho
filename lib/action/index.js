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
        DANGEROUS_EVAL          : "DANGEROUS_EVAL",
        EXEC                    : "EXEC"
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


        case self.R_ACTIONS.EXEC : {
            self._exec(callback, msg, action);
            break;
        }


        default : {
            console.log("YKW Unknown action passed", act);
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


action.prototype._exec = function (callback, msg, action) {
    var self            = this,

        execCtx         = self.execCtx,

        // List of all executables
        executables     = self.executables,

        // this is used for passing the keys that have to passed to the exec functions
        argValues       = _.get(action, "value" , ''),

        // The values which will eventually be passed to the executable ...
        funcArgs        = [],

        execFuncName    = _.get(action, "key", null),

        execFunc        = _.get(executables, execFuncName , null);



    if (!execFunc) {
        return callback(null);
    }

    if (!argValues) {
        // Return if non argument values have been passed .
        return callback(null);
    }

    argValues = argValues.split(',');

    funcArgs  = [self._cb_exec.bind(self, callback, msg,action)];

    argValues.forEach(function (value) {
        funcArgs.push( _.get(msg, value, null));
    });

    execFunc.apply(execCtx, funcArgs);

};


action.prototype._cb_exec = function (callback , msg, action, result) {
    /*
     This function just assigns the result to the message under the "exec_info space"
     Have to document this better ....
     */



    var self = this,
        funcName = _.get(action, "key", null);

    _.set(msg, "exec_info." +  funcName, result);

    return callback(null);

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
