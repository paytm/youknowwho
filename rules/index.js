/*jshint multistr: true ,node: true*/
"use strict";


var
    /* NODE internal */
    UTIL                = require('util'),
    /* NPM Third Party */
    CRYPTO              = require('crypto'),
    _                   = require('lodash');


function rules () {
    var self = this;

    self.R_OPERATORS         = {
        AND                     : "&&",
        OR                      : "||"
    };
}




rules.prototype.applyRules = function(msg, tag) {
    /* Apply Rules to a message

        Phase 1 : We apply rules sequentially .. we are starting with a few rules

        Phase 2 : We will need to maintain a HASH of params which can be mapped to message
        somehow maintain a list of conditions that can be applied

        tag
            Rules for these atags are executed
    */

    var
        self                = this,
        listofActiveRules   = null,
        _meta                = _.cloneDeep(self._meta);

    // Load only rules from that tag or all rules
    if(tag)     listofActiveRules = self.tagsRuleMap[tag];
    else        listofActiveRules = self.loadedRules;

    // In case no rules are found
    if(!UTIL.isArray(listofActiveRules)) listofActiveRules = [];

    _.set(_meta, "ts.start", Date.now());

    // Each Rule
    for(var iRule = 0; iRule < listofActiveRules.length; iRule ++) {

        var
            eachRule            = listofActiveRules[iRule],

            /*
                finalDecision : null

                For 1st codition we are setting finaldecision = Output of the condition
                For other conditions --> If conditional operator is && or || , Lets apply the condition with finaldecision normally

                IFF no Condition , then we check finaldecision for null also
            */
            finalDecision       = null,
            compiledObj         = {};

        _.set(_meta, "rules." + eachRule.id + ".conditions", {});
        _.set(_meta, "rules." + eachRule.id + ".total_conditions", eachRule.conditions.length);

        _.set(_meta, "rules." + eachRule.id + ".actions", {});
        _.set(_meta, "rules." + eachRule.id + ".total_actions", eachRule.actions.length);

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

                op              = eachCondition.operation;


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

            var cDecision       = self.__checkOperation(op, msgValue, condValue);

            /* This is for Rule Trails , mostly for Debug */
            // msg.logs += UTIL.format('C:%s:%s:%s ', eachRule.id, iCondition, (cDecision ? 'T' : 'F'));

            _.set(_meta, "rules." + eachRule.id + ".conditions." + eachCondition.id, cDecision);

            /* Check if 1st condition */
            if(iCondition === 0)    finalDecision = cDecision;
            else {

                // see conditions operator and decide what final decision is
                if(eachRule.conditionsOperator == self.R_OPERATORS.AND) {
                    finalDecision = finalDecision && cDecision;
                    if (finalDecision === false) break;
                }

                else if(eachRule.conditionsOperator == self.R_OPERATORS.OR) {
                    finalDecision = finalDecision || cDecision;
                    if (finalDecision === true) break;
                }

                else { //for handling complex functions
                    _.set(compiledObj,iCondition,cDecision);
                }
            }


        } // Each condition is a rule


        /*
            Actions in Rule .. Check if they can be applied ...
         */

        if (eachRule.conditionsOperator != self.R_OPERATORS.AND && eachRule.conditionsOperator != self.R_OPERATORS.OR) {
            // Example : _.template(' <%= c[0] %> && <%= c[1] %> || <%= c[2] %> && <%= c[3] %>')
            finalDecision = eval(eachRule.conditionsOperator({'c': compiledObj }));
        }

        /*
            When do we apply actions ?
                If finaldecision is TRUE
                or NULL --> Why ? That mean no condition was there , hence we always apply that Rule
         */

        _.set(_meta, "rules." + eachRule.id + ".applied", finalDecision);

        if(finalDecision === false) continue;

        // Apply each action for that rule
        for(var iAction = 0; iAction < eachRule.actions.length; iAction ++) {

            /* This is for Rule Trails , mostly for Debug */
            self._applyAction(msg, eachRule.actions[iAction], eachRule);
        }

        /* Exit Rule engine and do not execute any more rules */
	// Broken for now : will solve this part once the flow control kicks in ....
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
    */
    _.set(_meta, "ts.end", Date.now());
    return _meta;
};


/*
    Here We load rules from Database.
    And keep reloading every 5 minutes or so ...
 */

rules.prototype.loadRules = function(r) {
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
        rule_map    = {};


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
            var tags = _.get(item.rule_tags, 'tags', null);
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
            if (row_new.conditionsOperator != self.R_OPERATORS.AND && row_new.conditionsOperator != self.R_OPERATORS.OR) {
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


    // Filling meta
    self._meta.ts.rules_loaded = Date.now();

    // to check hash function
    self._meta.ruleEngineHash  = CRYPTO.createHash('sha1').update(JSON.stringify(self.loadedRules)).digest('hex');

};


module.exports = rules;
