/*
    Main Rule Engine Object
*/

/*jshint multistr: true ,node: true*/
"use strict";

var
    /* NODE internal */
    UTIL                = require('util'),
    PATH                = require('path'),
    CRYPTO              = require('crypto'),

    /* NPM Third Party */
    _                   = require('lodash'),
    MOMENT              = require('moment'),
    RANGE               = require('./lib/tinyRange'),
    LO                  = require('./lib/lodashOverride'),
    VALIDATOR           = require('validator'),

    /* NPM Paytm */
    TRANGE_BINARYSEARCH = require('tiny-range-binarysearch'),
    GLTV                = require('get-lodash-template-vars'),


    /* Global Variables */

    R_OPERATORS         = {
        AND                     : "&&",
        OR                      : "||"
    },

    R_ACTIONS           = {
        RE_EXIT                 : "RE_EXIT",
        SET_VARIABLE            : "SET_VARIABLE",
        DANGEROUS_EVAL          : "DANGEROUS_EVAL"
    },

    R_ACTIONS_REV_MAP   = {
        RE_EXIT                 : "RE_EXIT",
        SET_VARIABLE            : "SET_VARIABLE",
        DANGEROUS_EVAL          : "DANGEROUS_EVAL"
    },

    R_CONDITIONS        = {
        CHECK_VARIABLE          : "CHECK_VARIABLE"
    },

    R_COND_OPS          = {
        'EQUALS'                : '=',
        'NOT_EQUALS'            : '!=',

        'GREATER_THAN'          : '>',
        'GREATER_THAN_EQ'       : '>=',

        'LESS_THAN'             : '<',
        'LESS_THAN_EQ'          : '<=',

        'RANGE'                 : 'range',
        'NOT_RANGE'             : '!range',

        'DT_RANGE'              : 'datetimerange',
        'NOT_DT_RANGE'          : '!datetimerange',

        'T_RANGE'               : 'timerange',
        'NOT_T_RANGE'           : '!timerange',

        'REGEX'                 : 'regex',
        'NOT_REGEX'             : '!regex',

        'STRINGRANGE'           : 'stringrange',
        'NOT_STRINGRANGE'       : '!stringrange',

        'IS_OF_SET'             : 'set',
        'IS_NOT_OF_SET'         :  '!set'
    },

    R_COND_OPS_REV_MAP          = {
        '='             : 'EQUALS',
        '!='            : 'NOT_EQUALS',

        '>'             : 'GREATER_THAN',
        '>='            : 'GREATER_THAN_EQ',

        '<'             : 'LESS_THAN',
        '<='            : 'LESS_THAN_EQ',

        'range'         : 'RANGE',
        '!range'        : 'NOT_RANGE',

        'datetimerange' : 'DT_RANGE',
        '!datetimerange': 'NOT_DT_RANGE',

        'timerange'     : 'T_RANGE' ,
        '!timerange'    : 'NOT_T_RANGE',

        'regex'         : 'REGEX',
        '!regex'        : 'NOT_REGEX',

        'stringrange'   : 'STRINGRANGE',
        '!stringrange'  : 'NOT_STRINGRANGE',

        'set'           : 'IS_OF_SET',
        '!set'          : 'IS_NOT_OF_SET',
    };

function YKW(opts) {
    var self = this;
    self.opts = opts;

    /* declare common Meta, for each msg we will use cloneDeep*/
    self.masterMeta = {};


    /*
        Condition Operations micro functions
        Initially we used to call checkoperation function which used to call on a switch case
        and check what operation needs to be applied.

        Now we bind the required operation function at the time of rule loading itself.
        and save the cost of a operation lookup at the time of every condition.
    */
    this.__condOps = {

        /*
            Each function will receive args : msgVal, cVal where msgVal is lval and cVal is rval
            funciton has to return true/false/null
        */

        EQUALS            : function(msgVal, cVal) {
            return (msgVal==cVal)? true : false;
        },
        NOT_EQUALS        : function(msgVal, cVal) {
            return (msgVal!=cVal)? true : false;
        },
        GREATER_THAN      : function(msgVal, cVal) {
            return (_.parseInt(msgVal) > _.parseInt(cVal))? true : false;
        },
        GREATER_THAN_EQ   : function(msgVal, cVal) {
            return (_.parseInt(msgVal) >= _.parseInt(cVal))? true : false;
        },
        LESS_THAN         : function(msgVal, cVal) {
            return (_.parseInt(msgVal) < _.parseInt(cVal))? true : false;
        },
        LESS_THAN_EQ      : function(msgVal, cVal) {
            return (_.parseInt(msgVal) <= _.parseInt(cVal))? true : false;
        },
        RANGE             : function(msgVal, cVal) {
            return self.__checkRange(cVal, msgVal);
        },
        NOT_RANGE         : function(msgVal, cVal) {
            return !(self.__checkRange(cVal, msgVal));
        },
        DT_RANGE          : function(msgVal, cVal) {
            return self.__checkDateTimeRange(cVal, msgVal);
        },
        NOT_DT_RANGE      : function(msgVal, cVal) {
            return !(self.__checkDateTimeRange(cVal, msgVal));
        },
        T_RANGE           : function(msgVal, cVal) {
            return self.__checkTimeRange(cVal, msgVal);
        },
        NOT_T_RANGE       : function(msgVal, cVal) {
            return !(self.__checkTimeRange(cVal, msgVal));
        },
        REGEX             : function(msgVal, cVal) {
            return self.__checkRegex(cVal, msgVal);
        },
        NOT_REGEX         : function(msgVal, cVal) {
            return !(self.__checkRegex(cVal, msgVal));
        },
        STRINGRANGE       : function(msgVal, cVal) {
            return self.__checkStringRange(cVal, msgVal);
        },
        NOT_STRINGRANGE   : function(msgVal, cVal) {
            return !(self.__checkStringRange(cVal, msgVal));
        },
        IS_OF_SET         : function(msgVal, cVal) {
            return self.__checkIsSet(cVal, msgVal);
        },
        IS_NOT_OF_SET     : function(msgVal, cVal) {
            return !(self.__checkIsSet(cVal, msgVal));
        },

        // none of the above
        EMPTY               : function() { return null; }
    };

    /*
        Action micro functions
    */
    this.__actionOps = {

        /*
            Each function will receive args : msg, action, rule, actionMeta
            funciton has to return true/false/null
        */

        SET_VARIABLE            : function(msg, action, rule, actionMeta) {
            self.__applyActionSetVariable(msg, action, rule, actionMeta);
        },
        RE_EXIT        : function(msg, action, rule, actionMeta) {
            msg[R_ACTIONS.RE_EXIT] = true;
        },
        DANGEROUS_EVAL      : function(msg, action, rule, actionMeta) {
            self.__applyActionDangerousEval(msg, action, rule, actionMeta);
        },

        // none of the above
        EMPTY               : function() {}
    };


}


YKW.prototype.__checkRange = function(rangeArray, val) {
    // this will nbe null if Range array wasnt parsed properly
    if(rangeArray === null) return null;

    /*
     If the value passed is null or undefined or a string of invalid numbers , it
     will definitely NOT lie in the range specified . return false.

     The conversion to string is required since validator gives an exception
     incase we pass a number to isInt.

     */


    if (VALIDATOR.isInt(VALIDATOR.toString(val)) === false) return false;

    var result = TRANGE_BINARYSEARCH(rangeArray, val);
    return result;
};


/* Check Datetime Range */
YKW.prototype.__checkDateTimeRange = function(momentArray, msgVal) {
    msgVal = MOMENT(msgVal, "YYYY-MM-DD HH:mm:ss");

    // return null if msgVal is wrongly parsed datetime string
    if(!msgVal.isValid()) return null;

    var lesser = momentArray[0];
    if(lesser !== null && msgVal - lesser < 0)      return false;

    // Check greater value of range
    var greater = momentArray[1];
    if(greater !== null && msgVal - greater > 0)    return false;

    // if datetime Conditions are both null , then condition must be null
    if(lesser === null && greater === null)         return null;

    // All conditions must be met
    return true;
};

YKW.prototype.__checkTimeRange = function(momentArray, msgVal) {
    msgVal = MOMENT(msgVal, 'HH:mm:ss');

    // return null if msgVal is wrongly parsed datetime string
    if(!msgVal.isValid()) return null;

    var lesser = momentArray[0];
    if(lesser !== null && msgVal - lesser < 0)  return false;

    // Check greater value of range
    var greater = momentArray[1];
    if(greater !== null && msgVal - greater > 0)    return false;

    // if datetime Conditions are both null , then condition must be null
    if(lesser === null && greater === null)         return null;

    // All conditions must be met
    return true;
};

/* Check if value matches regext */
YKW.prototype.__checkRegex = function(regexVal, msgVal) {
    return regexVal.test(VALIDATOR.toString(msgVal));
};

/* Check is in the string array provided */
YKW.prototype.__checkStringRange = function(rangeArray, msgVal) {
    return (
        (rangeArray.indexOf(VALIDATOR.toString(msgVal).toLowerCase()) > -1) ||
        (rangeArray.indexOf(VALIDATOR.toString(msgVal).toUpperCase()) > -1)
    );
};

YKW.prototype.__checkIsSet = function (cVal, msgVal) {
    cVal    = VALIDATOR.toString(cVal).split(',');
    msgVal  = VALIDATOR.toString(msgVal).split(',');

    return (_.intersection(cVal, msgVal).length > 0) ? true : false;
};

YKW.prototype.applyRules = function(msg, tag, generateMeta) {
    var
        self                = this,
        startTime           = null,
        msgMeta             = null,
        endTime             = null,
        listofActiveRules   = null;

    // Meta , catching the start time
    if(generateMeta) {
        startTime = MOMENT(),
        msgMeta = _.cloneDeep(self.masterMeta),
        msgMeta.startTime = startTime.format('x');
        msgMeta.rules = {};
    }

    // Load only rules from that tag or all rules
    if(tag)     listofActiveRules = self.tagsRuleMap[tag];
    else        listofActiveRules = self.loadedRules;

    // In case no rules are found
    if(!UTIL.isArray(listofActiveRules)) listofActiveRules = [];

    // Each Rule
    for(var iRule = 0; iRule < listofActiveRules.length; iRule ++) {

        var
            eachRule            = listofActiveRules[iRule],

            ruleMeta            = {"ruleid" : eachRule.id, 'exec_order' : iRule, 'condOperator' : eachRule.conditionsOperator , 'conditions' : {}, 'applied' : null, 'actions': {} },

            /*
                finalDecision : null

                For 1st codition we are setting finaldecision = Output of the condition
                For other conditions --> If conditional operator is && or || , Lets apply the condition with finaldecision normally

                IFF no Condition , then we check finaldecision for null also
            */
            finalDecision       = null,
            conditionSets         = {};

        // Add in Meta
        if(generateMeta) {
            msgMeta.rules[eachRule.id] = ruleMeta;
        }

        /*
            Conditions in RUle
        */
        for(var iCondition = 0; iCondition < eachRule.conditions.length; iCondition ++) {

            var
                // each condition
                eachCondition   = eachRule.conditions[iCondition],

                // condition meta
                condMeta        = {"cid" : eachCondition.id },

                // Get Key from message
                // msgValue        = _.get(msg, eachCondition.key, null),
                // use improved GET
                msgValue        = LO.cpGet(msg, eachCondition.castedPath, null),

                // Get condition value
                condValue       = eachCondition.value,

                // per condition decision
                cDecision       = null,

                op              = eachCondition.operation;


            // Add in Meta
            ruleMeta.conditions[eachCondition.id] = condMeta;

            /*
             Okay , so condition value can be either a static string or can be a lodash template
             If it is lodash template, then we evaluate that first to get the static value
             and afterwards, parse that value to get a usage operatable value ...
             */

            if (typeof condValue === 'function') {
                // Get value from lodash template
                condValue = condValue(msg);

                // Parse the condition into an tiny-range / moment etc object
                condValue = self._parseCondition(condValue);
            }

            // Meta
            condMeta.lval = msgValue;
            condMeta.op = op;
            condMeta.rval = condValue;

            // Execute the already bound condition function here for decision
            cDecision = eachCondition.funcBind(msgValue, condValue);

            // Meta
            condMeta.d = cDecision;

            // Save condition decisions for handling compelx templates in conditions
            conditionSets[iCondition] = cDecision;

            /* Check if 1st condition */
            if(iCondition === 0)    finalDecision = cDecision;
            else {

                // see conditions operator and decide what final decision is
                if(eachRule.conditionsOperator == R_OPERATORS.AND) {
                    finalDecision = finalDecision && cDecision;

                    // Optimized check . In case of && any condition being false should be enough to decide
                    if (finalDecision === false) break;
                }
                else if(eachRule.conditionsOperator == R_OPERATORS.OR) {
                    finalDecision = finalDecision || cDecision;

                    // Optimized check . In case of || any condition being true should be enough to decide
                    if (finalDecision === true) break;
                }
            }


        } // Each condition is a rule


        // Only if condition operator is complex
        if (eachRule.conditionsOperator != R_OPERATORS.AND && eachRule.conditionsOperator != R_OPERATORS.OR) {
            // Example : _.template(' <%= c[0] %> && <%= c[1] %> || <%= c[2] %> && <%= c[3] %>')
            var compiledCondExpr = eachRule.conditionsOperator({'c': conditionSets });

            // save in meta
            ruleMeta.compiledCondExpr = compiledCondExpr;

            finalDecision = eval(compiledCondExpr);
        }

        // Add final Decision in Meta
        ruleMeta.applied = finalDecision;

        /*
            When do we apply actions ?
                If finaldecision is TRUE
                or NULL --> Why ? That mean no condition was there or some bad conditions were there
                , hence we always apply that Rule
        */
        if(finalDecision === false) continue;

        // Apply each action for that rule
        for(var iAction = 0; iAction < eachRule.actions.length; iAction ++) {

            var
                eachAction   = eachRule.actions[iAction],

                // action meta
                actionMeta = {"aid" : eachAction.id,  "action" : eachAction.action };

            // Add in Meta
            ruleMeta.actions[eachAction.id] = actionMeta;

            // actually apply actions
            eachAction.funcBind(msg, eachAction, eachRule, actionMeta);

        }

        /*  It is assumed that this action will be the last Action .
            This is mainly to quit Ruleengine pre-maturely and not to break list of actions
            hence we are putting it outside of actions loop
        */
        /* Exit Rule engine and do not execute any more rules */
        // if( _.get(msg, R_ACTIONS.RE_EXIT, false) === true) {
        if(msg[R_ACTIONS.RE_EXIT] === true) {

            // delete this unwated key. Might uncomment this in future if we wish to trace where this rule ended
            delete msg[R_ACTIONS.RE_EXIT];

            break;
        }
    } // Each rule

    

    if(generateMeta) {
        endTime = MOMENT();
        msgMeta.endTime = endTime.format('x');
        msgMeta.execTime = endTime.diff(startTime);
    }

    // returning Meta instead of Msg ( which is written by reference)
    return msgMeta;
};

/*
    returns true ( BOOLEAN ) if string true, false if string false, otherwise string
*/
YKW.prototype.__toBoolOrNull = function(refVal) {
    if(refVal==="true")         return true;
    else if(refVal==="false")   return false;
    else if(refVal==="null")    return null;
    else return refVal;
};



/*
    converts 2015-06-23 15:00:00 ~ 2015-06-23 16:00:00
    type string to an array of MOMENTs
 */

YKW.prototype.__toDateTimeMomentArray = function(refVal) {
    var momArray = [];

    // split from ~ , first value of array is lower end and second is max
    VALIDATOR.toString(refVal).split('~').forEach(function(k) {
        var mom = MOMENT(k.trim(), "YYYY-MM-DD HH:mm:ss");

        if(mom.isValid()) momArray.push(mom);
        else    momArray.push(null);
    });

    return momArray;
};

/*
    converts 15:00:00 ~ 16:00:00
    type string to an array of time
*/
YKW.prototype.__toTimeMomentArray = function(refVal) {
    var momArray = [];

    // split from ~ , first value of array is lower end and second is max
    VALIDATOR.toString(refVal).split('~').forEach(function(k) {
        var mom = MOMENT(k.trim(), "HH:mm:ss");

        if(mom.isValid()) momArray.push(mom);
        else    momArray.push(null);
    });
    return momArray;
};

/*
    for compiling and storing regex
*/
YKW.prototype.__compileRegex = function(refVal) {
    return new RegExp(VALIDATOR.toString(refVal));
};


/*
    for compiling and storing string array
*/
YKW.prototype.__toStringRange = function(refVal) {
    return refVal.split(',');
};


/*
   Apply Action SET VARIABLE
*/
YKW.prototype.__applyActionSetVariable = function(msg, action, rule, actionMeta) {
    var
        actKey          = action.key,
        actVal          = action.value;

    // Value can be a compiled function or a direct value
    if(typeof actVal === "function") actVal = actVal(msg);

    _.set(msg,  actKey, actVal);

    // set Meta
    actionMeta.key = actKey;
    actionMeta.val = actVal;
};

/*
   Apply Action DANGEROUS_EVAL
*/
YKW.prototype.__applyActionDangerousEval = function(msg, action, rule, actionMeta) {
    var
        actKey          = action.key,
        actVal          = action.value;

    // JSHINT for eval
    if (typeof action.value === "function") actVal = actVal(msg);

    _.set(msg,  actKey, eval(actVal));

    // set Meta
    actionMeta.key = actKey;
    actionMeta.val = actVal;
};


/*
    Pre Parse Rule Condition Values based on their conditions
    This is done at the time of Rules Loading to make rule executions faster
*/
YKW.prototype._parseRuleCondition = function(condition) {

    var self = this;
    /*
     Conditions having "<%=" are presumed to be lodash templates
     and are used for variable to variable comparison depending upon
     the input message to the rule engine.

     condition.value is checked since there can be rules without any conditions
     and  have only actions.

     */
    if (condition.value && condition.value.indexOf('<%=') > -1) {
        // split the lodash template to get keys which are being used in value
        // NOTE: Always call this before _.template function since it expects string arg and not function
        condition.valueKeys = GLTV(condition.value);

        condition.value = _.template(condition.value);
    } else {
        condition = self._parseCondition(condition);
    }

    return condition;
};

/*
 This can be called from _parseRuleCondition
 or from applyRules where the condition value is a lodash template
 and we want to parse the condition according to the input message
 */

YKW.prototype._parseCondition = function (condition) {
    var self = this;

    // If Rule Condition values have true / false, then lets parse it to Boolean
    _.set(condition, "value", self.__toBoolOrNull(_.get(condition , "value", null)));

    // if range is in condition , then Lets parse it using TinyRange
    if([R_COND_OPS.RANGE , R_COND_OPS.NOT_RANGE].indexOf(condition.operation) > -1) {
        try {
            condition.value = RANGE.parse(condition.value);
        } catch(ex) { condition.value = null; }
    }

    // If condition has Datetime in operation , then lets parse it in MOMENT and keep it
    else if([
        R_COND_OPS.DT_RANGE,
        R_COND_OPS.NOT_DT_RANGE
    ].indexOf(condition.operation) > -1)
        condition.value = self.__toDateTimeMomentArray(condition.value);

    // If condition has time in operation , then lets parse it in MOMENT and keep it
    else if([
        R_COND_OPS.T_RANGE,
        R_COND_OPS.NOT_T_RANGE
    ].indexOf(condition.operation) > -1)
        condition.value = self.__toTimeMomentArray(condition.value);

    // If condition has regex in operation , then lets compile it and keep it
    else if([
        R_COND_OPS.REGEX,
        R_COND_OPS.NOT_REGEX
    ].indexOf(condition.operation) > -1)
        condition.value = self.__compileRegex(condition.value);

    // If condition has String Array check in operation , then lets parse it and keep it
    else if([
        R_COND_OPS.STRINGRANGE,
        R_COND_OPS.NOT_STRINGRANGE
    ].indexOf(condition.operation) > -1)
        condition.value = self.__toStringRange(condition.value);
    return condition;
};

/*
    Pre Parse Rule Action Values based
    This is done at the time of Rules Loading to make rule executions faster

    # Variables in Action Values

    - Almost all message properties can be used in Action Values as variables
    - The Syntax for variables is <%= userdata.amount %>
    E.g. This is not done. We have <%= userdata.amount %> with us. Your number is<%= userdata.number %> . OKay

    - Please note it is a direct replacement function and we use LODASH.template for this.
*/
YKW.prototype._parseRuleAction = function(action) {

    var
        self    = this,
        actVal  = _.get(action , "value", null);

    action.value =  self.__toBoolOrNull(actVal);

    if(typeof actVal == 'string' && actVal.indexOf('<%=') > -1) {
        // split the lodash template to get keys which are being used in value
        // NOTE: Always call this before _.template function since it expects string arg and not function
        action.valueKeys = GLTV(action.value);

        action.value = _.template(action.value);
    }

    return action;
};


/*
   Can we called as many times as possible. Sync function so takes a toll on processing power.
 */

YKW.prototype.loadRules = function(receivedRulesArray) {
    var
        self                    = this,
        result                  = [],

        rulesArray              = _.cloneDeep(receivedRulesArray),

        startTime               = MOMENT(),
        endTime                 = null,

        // to capture all the keys which are used in conditions and actions
        uCKeys                  = [],
        uAKeys                  = [],

        hash                    = CRYPTO.createHash('md5').update(JSON.stringify(rulesArray)).digest("hex");


    // set HASH in meta .. Now we can dirty the rulesArray
    _.set(self.masterMeta, "rules_load.hash", hash);

    // capture in Meta when were rules loaded
    _.set(self.masterMeta, 'rules_load.load_start', startTime.format('x'));


    /* E.g.

    {
       "id": 1,
       "name": "Natural Number ",
       "external_reference": "",
       "conditionsOperator": "&&", // very important
       "priority": 170001,
       "tags": [
           "natural",
       ],
       "conditions": [
           {
               "id": 1,
               "key": "integer",
               "operation": ">",
               "value": "0"
           }
       ],
       "actions": [
           {
               "id": 2,
               "action": "SET_VARIABLE",
               "key": "is_natural",
               "value": 1
           }
       ]
    },

    Important Variables to Load : self.tagsRuleMap[tag] , self.loadedRules;

    */

    /* Sort Rules by priority , ascending order: Remember : Lower the integer val, higher the Priority */
    rulesArray = _.sortBy(rulesArray, 'priority');

    for(var iRule = 0; iRule < rulesArray.length; iRule++) {
        /* HAck : to parse the value as true/false boolean
            We check value in condition and action,
            and if we encounter true/ false , we parse it to BOOLEAN
            Not neat, maybe we will change in future and put data type
        */

        var eachRule = rulesArray[iRule];

        // conditional operator, create a template in case its a complex rule
        if (eachRule.conditionsOperator != R_OPERATORS.AND && eachRule.conditionsOperator != R_OPERATORS.OR)
            eachRule.conditionsOperator = _.template(eachRule.conditionsOperator);

        // conditions parsing
        for(var icond = 0; icond < _.get(eachRule, 'conditions', []).length; icond ++) {
            eachRule.conditions[icond] = self._parseRuleCondition(eachRule.conditions[icond]);

            /* This is to indentify the unique condition keys which are being used */
            // Lets take out the key on which condition is applied
            var cKey = eachRule.conditions[icond].key;
            if (uCKeys.indexOf(cKey) === -1) uCKeys.push(cKey);
            
            //Lets check if condition has valueKeys or not.
            if(Array.isArray(eachRule.conditions[icond].valueKeys))
                uCKeys = _.union(uCKeys, eachRule.conditions[icond].valueKeys);


            /* lets bind the function which will be used */
            var opEnum = R_COND_OPS_REV_MAP[eachRule.conditions[icond].operation];

            if(self.__condOps.hasOwnProperty(opEnum) === true) {
                eachRule.conditions[icond].funcBind = self.__condOps[opEnum];
            } else eachRule.conditions[icond].funcBind = self.__condOps.EMPTY;


            /* Lets pre cast the Key which is being used to access for check_variable */
            eachRule.conditions[icond].castedPath = LO.castPath(cKey);
        }

        // action parsing
        for(var iact = 0; iact < _.get(eachRule, 'actions', []).length; iact ++) {
            eachRule.actions[iact] = self._parseRuleAction(eachRule.actions[iact]);

            /* This is to identify the unique action keys which are being used */
            // Lets take out the key on which action is applied
            var aKey = eachRule.actions[iact].key;
            if (uAKeys.indexOf(aKey) === -1) uAKeys.push(aKey);
            
            // Also parse the value in action has valueKeys
            if(Array.isArray(eachRule.actions[iact].valueKeys))
                uAKeys = _.union(uAKeys, eachRule.actions[iact].valueKeys);

            /* Lets bind the function which will be called */
            var actEnum = R_ACTIONS_REV_MAP[eachRule.actions[iact].action];

            if(self.__actionOps.hasOwnProperty(actEnum) === true) {
                eachRule.actions[iact].funcBind = self.__actionOps[actEnum];
            } else eachRule.actions[iact].funcBind = self.__actionOps.EMPTY;

        }
    }


    /* Assign the rules to loaded rules */
    self.loadedRules = rulesArray;

    /*
        Push the Rules to a Tag List Map so that
        we can access rules based on tags

        NOTE : This is done after sorting so that tagged rules are also priority based
    */
    self.tagsRuleMap = {};

    for(var irule = 0 ; irule < self.loadedRules.length; irule++) {

        // go through tags of each rule .. and create buckets
        for(var jtag = 0; jtag < self.loadedRules[irule].tags.length; jtag ++) {
            var tag = self.loadedRules[irule].tags[jtag];

            // if this tag does not exist, create it
            if(!self.tagsRuleMap[tag]) self.tagsRuleMap[tag] = [];

            self.tagsRuleMap[tag].push(self.loadedRules[irule]);
        }
    }

    // capture in Meta when were rules loaded
    endTime = MOMENT();
    _.set(self.masterMeta, 'rules_load.load_end', endTime.format('x'));
    _.set(self.masterMeta, 'rules_load.load_exec_time', endTime.diff(startTime));

    // capture unique condition keys and unique action keys
    _.set(self.masterMeta, "rules_load.uniqueConditionKeys", uCKeys);
    _.set(self.masterMeta, "rules_load.uniqueActionKeys", uAKeys);


    return hash;
};


/*
    Returns master Meta info
 */

YKW.prototype.getLoadedMeta = function() {
    return this.masterMeta;
}


module.exports = YKW;
