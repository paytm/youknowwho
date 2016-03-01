/*jshint multistr: true ,node: true*/
"use strict";


var
    /* NODE internal */


    /* NPM Paytm */
    TRANGE_BINARYSEARCH = require('tiny-range-binarysearch'),


    /* NPM Third Party */
    _                   = require('lodash'),
    MOMENT              = require('moment'),
    VALIDATOR           = require('validator'),
    RANGE               = require('../lib/tinyRange'),

    /* YKW Internals */
    UTILITIES           = require('../lib/utilities');


function conditions () {
    var self = this;

    self.R_CONDITIONS        = {
        CHECK_VARIABLE          : "CHECK_VARIABLE"
    };

    self.R_COND_OPS          = {
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
    };

}

/*
    converts 2015-06-23 15:00:00 ~ 2015-06-23 16:00:00
    type string to an array of MOMENTs
 */

conditions.prototype.__toDateTimeMomentArray = function(refVal) {
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

conditions.prototype.__toTimeMomentArray = function(refVal) {
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

conditions.prototype.__compileRegex = function(refVal) {
    if (typeof refVal !== 'string') return refVal;

    return new RegExp(refVal);
};


/*
    for compiling and storing string array
*/
conditions.prototype.__toStringRange = function(refVal) {
    return refVal.split(',');
};


conditions.prototype.__checkRange = function(rangeArray, val) {
    var self = this;
    var result = TRANGE_BINARYSEARCH(rangeArray, val);

    return result;
};



/* Check Datetime Range */
conditions.prototype.__checkDateTimeRange = function(momentArray, msgVal) {
    /*
        Okay, now the date time range we get here is something like this
        [ MOMENT/null, MOMENT/null]
    */

    // Check lesser value of range
    msgVal = MOMENT(msgVal);
    var lesser = momentArray[0];
    if(lesser !== null && msgVal - lesser < 0)      return false;

    // Check greater value of range
    var greater = momentArray[1];
    if(greater !== null && msgVal - greater > 0)    return false;

    // All conditions must be met
    return true;
};

conditions.prototype.__checkTimeRange = function(momentArray, msgVal) {
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

/* Check if value matches regext */
conditions.prototype.__checkRegex = function(regexVal, msgVal) {
    if (typeof(regexVal) === 'string')
        regexVal = new RegExp(regexVal);

    return regexVal.test(msgVal);
};

/* Check is in the string array provided */
conditions.prototype.__checkStringRange = function(rangeArray, msgVal) {
    return (
        (rangeArray.indexOf(VALIDATOR.toString(msgVal).toLowerCase()) > -1) ||
        (rangeArray.indexOf(VALIDATOR.toString(msgVal).toUpperCase()) > -1)
    );
};

conditions.prototype.__checkIsSet = function (cVal, msgVal) {
    if (!msgVal) {
	return false;
    }

    if (typeof cVal !== 'string') {
        cVal = cVal.toString();
    }

    if (typeof msgVal !== 'string') {
        msgVal = msgVal.toString();
    }

    cVal = cVal.split(',');

    msgVal = msgVal.split(',');

    var intersection_set = _.intersection(cVal, msgVal);

    if (intersection_set.length > 0) {
        return true;
    } else {
        return false;
    }

};

conditions.prototype.__checkOperation = function(operation, msgVal, cVal) {
    /*
        Self explanatory operations between lval and rval , returns true/false
        Applies following operations as of now.

        msgVal  : Value from message
        cVal    : Value from condition
    */

    var
        self                = this,
        result              = null;

    switch(operation) {

        // =
        case self.R_COND_OPS.EQUALS : {
            result = (msgVal==cVal)? true : false;
            break;
        }

        // !=
        case self.R_COND_OPS.NOT_EQUALS : {
            result = (msgVal!=cVal)? true : false;
            break;
        }

        // >
        case self.R_COND_OPS.GREATER_THAN : {
            result = (_.parseInt(msgVal) > _.parseInt(cVal))? true : false;
            break;
        }

        // >=
        case self.R_COND_OPS.GREATER_THAN_EQ : {
            result = (_.parseInt(msgVal) >= _.parseInt(cVal))? true : false;
            break;
        }

        // <
        case self.R_COND_OPS.LESS_THAN : {
            result = (_.parseInt(msgVal) < _.parseInt(cVal))? true : false;
            break;
        }

        // <=
        case self.R_COND_OPS.LESS_THAN_EQ : {
            result = (_.parseInt(msgVal) <= _.parseInt(cVal))? true : false;
            break;
        }

        // range
        case self.R_COND_OPS.RANGE : {
            result = self.__checkRange(cVal, msgVal);
            break;
        }

        // not in range
        case self.R_COND_OPS.NOT_RANGE : {
            result = !(self.__checkRange(cVal, msgVal));
            break;
        }

        // datetime range
        case self.R_COND_OPS.DT_RANGE : {
            result = self.__checkDateTimeRange(cVal, msgVal);
            break;
        }

        // not datetime range
        case self.R_COND_OPS.NOT_DT_RANGE : {
            result = !(self.__checkDateTimeRange(cVal, msgVal));
            break;
        }

        // Time range
        case self.R_COND_OPS.T_RANGE : {
            result = self.__checkTimeRange(cVal, msgVal);
            break;
        }

        // not Time range
        case self.R_COND_OPS.NOT_T_RANGE : {
            result = !(self.__checkTimeRange(cVal, msgVal));
            break;
        }

        // Regex Match
        case self.R_COND_OPS.REGEX : {
            result = self.__checkRegex(cVal, msgVal);
            break;
        }

        // not regex match
        case self.R_COND_OPS.NOT_REGEX : {
            result = !(self.__checkRegex(cVal, msgVal));
            break;
        }

        // String Match
        case self.R_COND_OPS.STRINGRANGE : {
            result = self.__checkStringRange(cVal, msgVal);
            break;
        }

        // not string match
        case self.R_COND_OPS.NOT_STRINGRANGE : {
            result = !(self.__checkStringRange(cVal, msgVal));
            break;
        }


        case self.R_COND_OPS.IS_OF_SET : {
            result = self.__checkIsSet(cVal, msgVal);
            break;
        }

        case self.R_COND_OPS.IS_NOT_OF_SET : {
            result = !(self.__checkIsSet(cVal, msgVal));
            break;
        }


    } // Switch

    return result;

};


/*
    Pre Parse Rule Condition Values based on their conditions
    This is done at the time of Rules Loading to make rule executions faster
 */

conditions.prototype._parseRuleCondition = function(condition) {

    var self = this;
    /*
     Conditions having "<%=" are presumed to be lodash templates
     and are used for variable to variable comparison depending upon
     the input message to the rule engine.

     condition.value is checked since there can be rules without any conditions
     and  have only actions.

     */
    if (condition.value && condition.value.indexOf('<%=') > -1) {
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

conditions.prototype._parseCondition = function (condition) {
    var self = this;

    // If Rule Condition values have true / false, then lets parse it to Boolean
    _.set(condition, "value", UTILITIES.toBoolOrNull(_.get(condition , "value", null)));

    // if range is in condition , then Lets parse it using TinyRange
    if([self.R_COND_OPS.RANGE , self.R_COND_OPS.NOT_RANGE].indexOf(condition.operation) > -1)
        condition.value = RANGE.parse(condition.value);

    // If condition has Datetime in operation , then lets parse it in MOMENT and keep it
    else if([
        self.R_COND_OPS.DT_RANGE,
        self.R_COND_OPS.NOT_DT_RANGE
    ].indexOf(condition.operation) > -1)
        condition.value = self.__toDateTimeMomentArray(condition.value);

    // If condition has time in operation , then lets parse it in MOMENT and keep it
    else if([
        self.R_COND_OPS.T_RANGE,
        self.R_COND_OPS.NOT_T_RANGE
    ].indexOf(condition.operation) > -1)
        condition.value = self.__toTimeMomentArray(condition.value);

    // If condition has regex in operation , then lets compile it and keep it
    else if([
        self.R_COND_OPS.REGEX,
        self.R_COND_OPS.NOT_REGEX
    ].indexOf(condition.operation) > -1)
        condition.value = self.__compileRegex(condition.value);

    // If condition has String Array check in operation , then lets parse it and keep it
    else if([
        self.R_COND_OPS.STRINGRANGE,
        self.R_COND_OPS.NOT_STRINGRANGE
    ].indexOf(condition.operation) > -1)
        condition.value = self.__toStringRange(condition.value);
    return condition;
};


module.exports = conditions;
