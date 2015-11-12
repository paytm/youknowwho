/* 
    Main Rule Engine Object
*/

/*jshint multistr: true ,node: true*/
"use strict";

var
    /* NODE internal */
    UTIL                = require('util'),
    PATH                = require('path'),
    EVENTEMITTER        = require('events').EventEmitter,

    /* NPM Third Party */
    _                   = require('lodash'),
    Q                   = require('q'),
    MOMENT              = require('moment'),
    RANGE               = require('./lib/tinyRange'),
    VALIDATOR           = require('validator'),

    /* NPM Paytm */
    TRANGE_BINARYSEARCH = require('tiny-range-binarysearch'),


    /* Global Variables */

    R_OPERATORS         = {
        AND     : "&&",
        OR      : "||"
    },

    R_ACTIONS           = {
        RE_EXIT                 : "RE_EXIT",
        RE_INIT                 : "RE_INIT",
        SET_VARIABLE            : "SET_VARIABLE"
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

        'T_RANGE'              : 'timerange',
        'NOT_T_RANGE'          : '!timerange',

        'REGEX'              : 'regex',
        'NOT_REGEX'          : '!regex',

        'ERRORCODETAG'              : 'errorcodetag',
        'NOT_ERRORCODETAG'          : '!errorcodetag',

        'STRINGRANGE'              : 'stringrange',
        'NOT_STRINGRANGE'          : '!stringrange'
    };


UTIL.inherits(YKW, EVENTEMITTER);
function YKW(config, opts) {

    var self = this;
    EVENTEMITTER.call(self);
}


YKW.prototype.__checkRange = function(rangeArray, val) {
    var self = this;
    var result = TRANGE_BINARYSEARCH(rangeArray, val);
    self.emit("log.verbose", "YKW.prototype.__checkRange", "array and value and result" + VALIDATOR.toString(rangeArray) + " " + val + " " + result);
    return result;
};


/* Check Datetime Range */
YKW.prototype.__checkDateTimeRange = function(momentArray, msgVal) {
    /*
        Okay, now the date time range we get here is something like this
        [ MOMENT/null, MOMENT/null]
    */

    // Check lesser value of range
    msgVal = MOMENT(msgVal);
    var lesser = momentArray[0];
    if(lesser !== null && msgVal - lesser < 0)  return false;

    // Check greater value of range
    var greater = momentArray[1];
    if(greater !== null && msgVal - greater > 0)    return false;
    
    // All conditions must be met
    return true;
};

YKW.prototype.__checkTimeRange = function(momentArray, msgVal) {
    /*
        Okay, now the date time range we get here is something like this
        [ MOMENT/null, MOMENT/null]
    */

    // Check lesser value of range
    msgVal = MOMENT(msgVal);
    var lesser = MOMENT(momentArray[0],'HH:mm:ss');
    if(lesser !== null && msgVal - lesser < 0)  return false;

    // Check greater value of range
    var greater = MOMENT(momentArray[1],'HH:mm:ss');
    if(greater !== null && msgVal - greater > 0)    return false;
    
    // All conditions must be met
    return true;
};

/* Check in Error Code range */
YKW.prototype.__checkErrorCodeTag = function(ErrorCodeArray, msgVal) {
    return (ErrorCodeArray.indexOf(VALIDATOR.toString(msgVal)) > -1);
};

/* Check if value matches regext */
YKW.prototype.__checkRegex = function(regexVal, msgVal) {
    if (typeof(regexVal) === 'string')
        regexVal = new RegExp(regexVal);

    return regexVal.test(msgVal);
};

/* Check is in the string array provided */
YKW.prototype.__checkStringRange = function(rangeArray, msgVal) {
    return (rangeArray.indexOf(VALIDATOR.toString(msgVal).toLowerCase()) > -1)||(rangeArray.indexOf(VALIDATOR.toString(msgVal).toUpperCase()) > -1);
};

YKW.prototype.__checkOperation = function(operation, msgVal, cVal) {
    /* 
        Self explanatory operations between lval and rval , returns true/false
        Applies following operations as of now.

        msgVal  : Value from message
        cVal    : Value from condition

        =
        !=
        range
        !range
    */

    var
        self                = this,
        result              = null;

    switch(operation) {

        // =
        case R_COND_OPS.EQUALS : {
            result = (msgVal==cVal)? true : false;
            break;
        }

        // !=
        case R_COND_OPS.NOT_EQUALS : {
            result = (msgVal!=cVal)? true : false;
            break;
        }

        // >
        case R_COND_OPS.GREATER_THAN : {
            result = (_.parseInt(msgVal) > _.parseInt(cVal))? true : false;
            break;
        }

        // >=
        case R_COND_OPS.GREATER_THAN_EQ : {
            result = (_.parseInt(msgVal) >= _.parseInt(cVal))? true : false;
            break;
        }

        // <
        case R_COND_OPS.LESS_THAN : {
            result = (_.parseInt(msgVal) < _.parseInt(cVal))? true : false;
            break;
        }

        // <=
        case R_COND_OPS.LESS_THAN_EQ : {
            result = (_.parseInt(msgVal) <= _.parseInt(cVal))? true : false;
            break;
        }

        // range
        case R_COND_OPS.RANGE : {
            result = self.__checkRange(cVal, msgVal);
            break;
        }

        // not in range
        case R_COND_OPS.NOT_RANGE : {
            result = !(self.__checkRange(cVal, msgVal));
            break;
        }

        // datetime range
        case R_COND_OPS.DT_RANGE : {
            result = self.__checkDateTimeRange(cVal, msgVal);
            break;
        }

        // not datetime range
        case R_COND_OPS.NOT_DT_RANGE : {
            result = !(self.__checkDateTimeRange(cVal, msgVal));
            break;
        }

        // Time range
        case R_COND_OPS.T_RANGE : {
            result = self.__checkTimeRange(cVal, msgVal);
            break;
        }

        // not Time range
        case R_COND_OPS.NOT_T_RANGE : {
            result = !(self.__checkTimeRange(cVal, msgVal));
            break;
        }

        // Regex Match
        case R_COND_OPS.REGEX : {
            result = self.__checkRegex(cVal, msgVal);
            break;
        }

        // not regex match
        case R_COND_OPS.NOT_REGEX : {
            result = !(self.__checkRegex(cVal, msgVal));
            break;
        }

        // String Match
        case R_COND_OPS.STRINGRANGE : {
            result = self.__checkStringRange(cVal, msgVal);
            break;
        }

        // not string match
        case R_COND_OPS.NOT_STRINGRANGE : {
            result = !(self.__checkStringRange(cVal, msgVal));
            break;
        }

        // Check in Error Code tag
        case R_COND_OPS.ERRORCODETAG : {
            result = self.__checkErrorCodeTag(cVal, msgVal);
            break;
        }

        // not in Error Code tag
        case R_COND_OPS.NOT_ERRORCODETAG : {
            result = !(self.__checkErrorCodeTag(cVal, msgVal));
            break;
        }


    } // Switch

    return result;

};

YKW.prototype.applyRules = function(msg, tag) {
    /* Apply Rules to a message 

        Phase 1 : We apply rules sequentially .. we are starting with a few rules

        Phase 2 : We will need to maintain a HASH of params which can be mapped to message
        somehow maintain a list of conditions that can be applied

        tag
            Rules for these atags are executed
    */

    var
        self                = this,
        listofActiveRules   = null;

    // Load only rules from that tag or all rules
    if(tag)     listofActiveRules = self.tagsRuleMap[tag];
    else        listofActiveRules = self.loadedRules;

    self.emit("log.debug", "apply rules : " + JSON.stringify(msg));
    // In case no rules are found
    if(!UTIL.isArray(listofActiveRules)) listofActiveRules = [];

    // Each Rule
    for(var iRule = 0; iRule < listofActiveRules.length; iRule ++) {

        var
            eachRule            = listofActiveRules[iRule],
            finalDecision       = true,
            compiledObj         = {};

        // self.emit("log.info", "CHECKING RULE : " + eachRule);

        /*
            Conditions in RUle
        */
        for(var iCondition = 0; iCondition < eachRule.conditions.length; iCondition ++) {

            var
                // each condition
                eachCondition   = eachRule.conditions[iCondition],

                // Get Key from message
                msgValue        = _.get(msg, eachCondition.key, null),

                // Get condition value
                condValue       = eachCondition.value,

                op              = eachCondition.operation,

                cDecision       = self.__checkOperation(op, msgValue, condValue);

            self.emit("log.debug", "Checking condition : " + JSON.stringify(eachCondition) + " " + cDecision);

            /* This is for Rule Trails , mostly for Debug */
            // msg.logs += UTIL.format('C:%s:%s:%s ', eachRule.id, iCondition, (cDecision ? 'T' : 'F')); 

            // see conditions operator and decide what final decision is
            if(eachRule.conditionsOperator == R_OPERATORS.AND) {
                finalDecision = finalDecision && cDecision;

                // Even if 1 condition is not met here, no point in continuing
                if(finalDecision === false) break;
            }
            else if(eachRule.conditionsOperator == R_OPERATORS.OR) {
                finalDecision = finalDecision || cDecision;

                // Even if 1 condition is met here, Lets continue
                if(finalDecision === true) break;
            }
            else {
                //for handling complex functions
                _.set(compiledObj,iCondition,cDecision);
             }

        } // Each condition is a rule

        self.emit("log.debug", " Final decision: " + finalDecision);

        /* 
            Actions in Rule .. Check if they can be applied ... 
        */
        if (eachRule.conditionsOperator != R_OPERATORS.AND && eachRule.conditionsOperator != R_OPERATORS.OR) {
            //_.template(' <%= c[0] %> && <%= c[1] %> || <%= c[2] %> && <%= c[3] %>')
            finalDecision = eval(eachRule.conditionsOperator({'c': compiledObj }));
        }

        if(!finalDecision) continue;

        // Apply each action for that rule
        for(var iAction = 0; iAction < eachRule.actions.length; iAction ++) {

            /* This is for Rule Trails , mostly for Debug */
            self.emit("log.debug", UTIL.format('A:%s:%s ', eachRule.id, iAction));
            
            self._applyAction(msg, eachRule.actions[iAction], eachRule);
        }

        /* Exit Rule engine and do not execute any more rules */
        if( _.get(msg, R_ACTIONS.RE_EXIT, false) === true) {

            // delete this unwated key. Might uncomment this in future if we wish to trace where this rule ended
            delete msg[R_ACTIONS.RE_EXIT];

            break;
        }
    } // Each rule

    /*
        DONE...!!!!

        We have checked every rule against this message and have moved on
        to applying actions here.
        Now routing logic should just move this message ahead
    */

    self.emit("log.debug",  "APPLY RULES .. "  + JSON.stringify(msg));

    return msg;
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
    doc/ruleEngine
    # Variables in Action Values

    - Almost all message properties can be used in Action Values as variables
    - The Syntax for variables is <%= userdata.amount %>
    E.g. This is not done. We have <%= userdata.amount %> with us. Your number is<%= userdata.number %> . OKay
    
    - Please note it is a direct replacement function and we use LODASH.template for this.

*/
YKW.prototype.__toCompiledString = function(refVal) {
    if (typeof refVal !== 'string') return refVal;

    // a Simple optimization where we dont need to keep compiled function
    if(refVal.indexOf('<%=') <= -1) return refVal;

    // Lets compile it
    return _.template(refVal);
};


/*
    converts 2015-06-23 15:00:00 ~ 2015-06-23 16:00:00
    type string to an array of MOMENTs
*/
YKW.prototype.__toDateTimeMomentArray = function(refVal) {
    if (typeof refVal !== 'string') return refVal;

    var momArray = [];

    // split from ~ , first value of array is lower end and second is max
    refVal.split('~').forEach(function(k) {
        var mom = MOMENT(k.trim());

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
    if (typeof refVal !== 'string') return refVal;

    var momArray = [];
    // split from ~ , first value of array is lower end and second is max
    refVal.split('~').forEach(function(k) {
        momArray.push(k);
    });
    return momArray;
};

/*
    for compiling and storing regex
*/
YKW.prototype.__compileRegex = function(refVal) {
    if (typeof refVal !== 'string') return refVal;
    
    return new RegExp(refVal);
};


/*
    converts gateway ~ errorcodetag
    type string to an array of error code values
*/
YKW.prototype.__toErrorCodeArray = function(refVal) {
    if (typeof refVal !== 'string') return refVal;

    var
        self = this,

        // split from ~ , first value of array is gateway  and second is errorcodetag
        arr = refVal.split('~'),

        // First part is gateway whose erroro codes we want
        gw = arr[0].trim(),

        // Second part is error code tag
        // converting to upper case as the error code has been normalised with all tags in upper case
        ect = arr[1].trim().toUpperCase();

    /*
        BugFix: 
        Lodash works even when there is a space in objects
        This is to prevent an error if some errorcode tag is not available for a gateway
    */
    var errorCodeArray=  _.cloneDeep(Object.keys(_.get(self,'ecGwMapped.' + gw + '.' + ect, [])));
    return errorCodeArray;
};

/*
    for compiling and storing string array
*/
YKW.prototype.__toStringRange = function(refVal) {
    return refVal.split(',');
};

/*
   Apply Action
*/
YKW.prototype._applyAction = function(msg, action, rule) {
    var
        self    = this,
        act     = _.get(action, "action", null);

    switch(act) {

        // Set variable
        case R_ACTIONS.SET_VARIABLE : {
            self.__applyActionSetVariable(msg, action, rule);
            break;
        }

        // Quit rule engine and do not test anymore rules
        case R_ACTIONS.RE_EXIT : {
            msg[R_ACTIONS.RE_EXIT] = true;
            break;
        }
        //reinitialise keys
        case R_ACTIONS.RE_INIT : {
            //the following checks are necessary for reinitiating a transaction
            //dbUpdateID being null the msg is treated as a new transaction and hence a new entry is created in db for it
            //rechargeAttempt count is incremented everytime we reinit any transaction
            msg.dbUpdateID = null;
            msg.rechargeAttempt = _.parseInt(msg.rechargeAttempt) + 1;//incrementing recharge attempt count
            break;
        }

        // Defer Transaction ( Put in DB )
        case R_ACTIONS.DEFER_TXN : {
            self.__applyActionDeferTxn(msg, action, rule);
            break;
        }

        // Initiate StatusCheck
        case R_ACTIONS.INITIATE_STATUSCHECK : {
            self.__applyActionInitiateSc(msg, action, rule);
            break;
        }

    }

};

/*
   Apply Action SET VARIABLE
*/
YKW.prototype.__applyActionSetVariable = function(msg, action) {
    var
        // key, value
        actKey          = action.key,
        actVal          = action.value;

    // self.emit("log.info", "MSG ", msg);
    // self.emit("log.info", "ACTION ", action);

    // Value can be a compiled function or a direct value
    if(typeof actVal === "function")    _.set(msg,  actKey, actVal(msg));
    else    _.set(msg,  actKey, actVal);

};


/*
    Pre Parse Rule Condition Values based on their conditions
    This is done at the time of Rules Loading to make rule executions faster
*/
YKW.prototype._parseRuleCondition = function(condition) {

    var self = this;

    // If Rule Condition values have true / false, then lets parse it to Boolean
    _.set(condition, "value", self.__toBoolOrNull(_.get(condition , "value", null)));

    // if range is in condition , then Lets parse it using TinyRange
    if([R_COND_OPS.RANGE , R_COND_OPS.NOT_RANGE].indexOf(condition.operation) > -1)
        condition.value = RANGE.parse(condition.value);

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

    // If condition has Error Code Tag in operation , then lets parse it and keep it
    else if([
            R_COND_OPS.ERRORCODETAG,
            R_COND_OPS.NOT_ERRORCODETAG
        ].indexOf(condition.operation) > -1)
            condition.value = self.__toErrorCodeArray(condition.value);
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
*/
YKW.prototype._parseRuleAction = function(action) {

    var self = this;

    // If Rule Action values have true / false, then lets parse it to Boolean
    _.set(action, "value", self.__toBoolOrNull(_.get(action , "value", null)));

    // Compiled string ( variable based )
    _.set(action, "value", self.__toCompiledString(_.get(action , "value", null)));

    return action;
};


/*
    Here We load rules from Database.
    And keep reloading every 5 minutes or so ... 
 */

YKW.prototype.loadRules = function(r) {
  var
        self        = this,
        result      = [],

    /*
        rule_condition_map keeps a mapping of rule Ids to the condition keys already associated to the rule
        Example
           {
              1 : { 'catlogProductId': true, 'requestType': true  },
              2 : {  'requestType': true }
            }
     */
        rule_condition_map = {},
    
     /*
        rule_action_map keeps a mapping of rule Ids to the action keys already associated to the rule
        Example
           {
              1 : { 'validationSuccesful': true  },
              2 : {  'frontendErrMessage': true }
            }
     */
        rule_action_map    = {},

    /*
      rule_map is the mapping of rule_ids to the final object
      Example
       {
          1 : { 
                id         : 1,
                name       : 'Test',
                conditions : [],
                actions    : []
              }
        }
    */
        rule_map    = {},

        count   = r.length;
      
        r.forEach(function (item) {
            /* HAck : to parse the value as true/false boolean
                We check value in condition and action,
                and if we encounter true/ false , we parse it to BOOLEAN
                Not neat, maybe we will change in future and put data type
            */

            // Rule already exists, just put some more valus in it
            if (rule_map[item.rule.id]) {

                // get Rule
                var row_found = rule_map[item.rule.id];
                
                // see if rule condition has already been there
                if (!rule_condition_map[row_found.id][item.rule_condition.id]) {
                    
                    item.rule_condition = self._parseRuleCondition(item.rule_condition);
                    row_found.conditions.push(item.rule_condition);

                    rule_condition_map[row_found.id][item.rule_condition.id] = true;
                }

                // see if action is already there
                if (!rule_action_map[row_found.id][item.rule_action.id]) {

                    item.rule_action = self._parseRuleAction(item.rule_action);
                    row_found.actions.push(item.rule_action);

                    rule_action_map[row_found.id][item.rule_action.id] = true;
                }
            }

            // Create new Rule
            else {
                var row_new = item.rule;

                // set tags
                var tags = _.get(item[''], 'tags', null);
                row_new.tags = (tags) ? tags.split(',') : [];

                // set conditions
                item.rule_condition = self._parseRuleCondition(item.rule_condition);
                row_new.conditions = [ item.rule_condition];

                // set actions
                item.rule_action = self._parseRuleAction(item.rule_action);
                row_new.actions    = [ item.rule_action ];

                // setting condition to avoid stuff : this is join
                rule_condition_map[row_new.id] = {};
                rule_condition_map[row_new.id][item.rule_condition.id] = true;
                
                // setting action to avoid stuff : this is join
                rule_action_map[row_new.id] = {};
                rule_action_map[row_new.id][item.rule_action.id] = true;

                //create a template in case its a complex rule
                if (row_new.conditionsOperator != R_OPERATORS.AND && row_new.conditionsOperator != R_OPERATORS.OR) {
                    row_new.conditionsOperator = _.template(row_new.conditionsOperator);
                }

                // Final Rule Map
                rule_map[item.rule.id] = row_new;

            }
        });

        // Get a List of Rules , then we will sort it
        Object.keys(rule_map).forEach(function (rule_id) {

            // Push the Rule to a list
            result.push(rule_map[rule_id]);
        });

        /* Sort Resultant Rules by priority */
        result = _.sortBy(result, 'priority');

        /* Assign the rules to loaded rules */
        self.loadedRules = result;
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

       self.emit("log.info", "Loaded Rules : " + self.loadedRules.length);
       self.emit("log.debug", "Loaded Rules : " + JSON.stringify(self.loadedRules));
  


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
