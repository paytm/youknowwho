/*jshint multistr: true ,node: true*/
"use strict";


var
    /* NODE internal */
    UTIL                = require('util'),
    /* NPM Third Party */
    CRYPTO              = require('crypto'),
    _                   = require('lodash'),

    /* YKW INTERNALS */

    ACTION                    = null,
    ACTION_CLASS              = require('../action'),

    CONDITION                 = null,
    CONDITION_CLASS           = require('../condition');



function rule () {

    var self = this;

    ACTION             = new ACTION_CLASS();
    CONDITION          = new CONDITION_CLASS();


    self.R_OPERATORS         = {
        AND                     : "&&",
        OR                      : "||"
    };

    self.loadedRules         = {
    };


    self.flowControl         = {
    };

    // The superset of all rules for a message
    self.loadedRules         = {
    };

    // The _meta object is given back to the client
    // whenever the rule engine is run

    self._meta               = {

        "ts" : {
            "rules_loaded" : null,
            "start"        : null,
            "end"          : null
        },

        // This is basically given back to a client and
        // contains re statistics
        "rules" : {
        },

        "ruleEngineHash" : null
    };
}


rule.prototype._getLoadedRules = function (reHash, tag) {
    var self        = this,
        ruleId      = reHash;


    if (tag) {
        ruleId += ".tagRules." + tag;
    } else {
        ruleId += ".rules";
    }

    return _.get(self.loadedRules, ruleId, []);
};

rule.prototype._getNextRule = function (msg) {
    var self        = this,
        returnVal   = null,
        msgId       = _.get(msg, "_meta.id", null),
        rules       = _.get(self.flowControl, msgId + ".rules", []),
        ruleIdx     = _.get(self.flowControl, msgId + ".rule_idx", null),
        currentRule = rules[ruleIdx];

    if (currentRule) {
        returnVal = {
            index : ruleIdx,
            rule  : currentRule
        };
    }

    return returnVal;
};


rule.prototype._getNextCondition = function (msg) {

    var self             = this,
        returnVal        = null,
        msgId            = _.get(msg, "_meta.id", null),

        rules            = _.get(self.flowControl, msgId + ".rules", []),

        currentRuleIdx   = _.get(self.flowControl, msgId + ".rule_idx", null),
        currentRule      = rules[currentRuleIdx],


        conditionIdx = _.get(self.flowControl, msgId + ".rule_condition_idx"),
        currentCondition = _.get(currentRule, "conditions", [])[conditionIdx];

    if (currentCondition) {
        returnVal = {
            index     : conditionIdx,
            condition : currentCondition
        };

    }

    return returnVal;
};


rule.prototype._getNextAction = function (msg) {

    var self             = this,
        returnVal        = null,
        msgId            = _.get(msg, "_meta.id", null),

        rules            = _.get(self.flowControl, msgId + ".rules", []),

        currentRuleIdx   = _.get(self.flowControl, msgId + ".rule_idx", null),
        currentRule      = rules[currentRuleIdx],


        actionIdx        = _.get(self.flowControl, msgId + ".rule_action_idx"),
        currentAction    = _.get(currentRule, "actions", [])[actionIdx];

    if (currentAction) {
        returnVal = {
            index     : actionIdx,
            action    : currentAction
        };
    }

    return returnVal;
};


rule.prototype._updateFlowControl = function (msg, entity) {
    // Msg to identify which message has requested the update
    // The entity can be a rule , condition or an action in any of the cases
    // the flowControl needs to be updated .

    var self  = this;
    var msgId = _.get(msg, "_meta.id", null);

    switch (entity) {
    case "rule" :
        self.flowControl[msgId].rule_idx++;
        break;
    case "condition" :
        self.flowControl[msgId].rule_condition_idx++;
        break;
    case "action" :
        self.flowControl[msgId].rule_action_idx++;
        break;
    }

    return;
};


rule.prototype.apply = function (callback, rule, msg, _meta) {
    var


      /*
       finalDecision : null

       For 1st codition we are setting finaldecision = Output of the condition
       For other conditions --> If conditional operator is && or || , Lets apply the condition with finaldecision normally

       IFF no Condition , then we check finaldecision for null also
       */
        self                = this,
        compiledObj         = {},
        finalDecision       = null,
        currentActionObj    = null,
        currentConditionObj = null;

    // _meta has to be always set by reference ... this is being referred from
    // execRules

    _.set(_meta, "rules." + rule.id + ".conditions", {});
    _.set(_meta, "rules." + rule.id + ".total_conditions", rule.conditions.length);

    _.set(_meta, "rules." + rule.id + ".actions", {});
    _.set(_meta, "rules." + rule.id + ".total_actions", rule.actions.length);


    var execConditions = function (execConditionCb) {

        // Just trying to avoid execution when execCurrentCondition
        // is called for the first time ...

        function _cDecisionTracker (error, decision) {
            _.set(_meta, "rules." + rule.id + ".conditions." + currentConditionObj.condition.id, decision);

            if (currentConditionObj.index === 0) {
                finalDecision = decision;
            }

            // Break the execCurrentCondition prematurely in certain cases

            if (rule.conditionsOperator === self.R_OPERATORS.AND) {
                finalDecision = finalDecision && decision;
                if (finalDecision === false) {
                    // End exec condition here ...
                    return execConditionCb(null, finalDecision);

                }
            } else if (rule.conditionsOperator === self.R_OPERATORS.OR) {

                finalDecision = finalDecision || decision;

                if (finalDecision === true) {
                    // End exec condition here ...
                    return execConditionCb(null, finalDecision);
                }
            } else {//for handling complex functions
                _.set(compiledObj,currentConditionObj.index,decision);
            }


            if (rule.conditionsOperator != self.R_OPERATORS.AND && rule.conditionsOperator != self.R_OPERATORS.OR) {
                // Example : _.template(' <%= c[0] %> && <%= c[1] %> || <%= c[2] %> && <%= c[3] %>')
                finalDecision = eval(rule.conditionsOperator({'c': compiledObj }));
                // end exec condition  ....
                return execConditionCb(null, finalDecision);
            }

            return _execCurrentCondition();
        }

        function _execCurrentCondition () {

            // Update counter everytime the next condition is asked for ...
            self._updateFlowControl(msg, 'condition');

            currentConditionObj = self._getNextCondition(msg);

            // Exit if the next condition isn't found ....
            if (!currentConditionObj) {
                return execConditionCb(null, finalDecision);
            }

            return CONDITION.apply(_cDecisionTracker, msg, currentConditionObj.condition);

        }

        _execCurrentCondition();

    };

    var execActions = function (callback) {

        function _actionTracker (error) {

            if (error) {
                return callback(error);
            }

            if (_.get(msg, ACTION.R_ACTIONS.RE_EXIT, false)) {
                return callback(null);
            }

            return _execCurrentAction();
        }

        function _execCurrentAction () {
            // Update action counter each time the next action is requested
            self._updateFlowControl(msg, 'action');

            currentActionObj = self._getNextAction(msg);
            // Maybe exit the RE here itself if the action is RE_EXIT ...
            // or let apply action execute and its action governs the reExit .

            if (!currentActionObj) {
                return callback(null);
            }

            return ACTION.apply(_actionTracker, msg, currentActionObj.action);
        }

        _execCurrentAction();
    };

    // Can shift this to promises ....

    execConditions(function (errorCondition, finalDecision) {

        if (errorCondition) {
            return callback(errorCondition);
        }

        _.set(_meta, "rules." + rule.id + ".applied", finalDecision);

        /*
            When do we apply actions ?
                If finaldecision is TRUE
                or NULL --> Why ? That mean no condition was there , hence we always apply that Rule
         */

        if (finalDecision === true || finalDecision === null) {
            return execActions(callback);
        }

        // Get next rule to execute if the final
        // decision is false

        return callback(null);

    });


};



rule.prototype.executeRules = function(callback, msg, tag) {

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
        reHash              = self._meta.ruleEngineHash,
        // *1000 is necessary since a floating point interferes with the _.get()
        msgId               = Date.now() + Math.random().toFixed(3)*1000,
        loadedRules         = [],
        currentRuleObj      = null,
        _meta               = _.cloneDeep(self._meta);

    _.set(_meta, "ts.start", Date.now());

    _.set(msg, "_meta.id", msgId);

    self.flowControl[msgId] = {

        // Initialize the ruleset for the message before execution .
        // Helps in iterating later and not finding the appropriate rule
        // set again and again.
        "rules"              : self._getLoadedRules(reHash, tag),
        "rule_idx"           : -1
    };


    // When the ruleHash is loaded , lets increment messageCounter
    // in the loaded rule object .

    self.loadedRules[reHash].messageCounter += 1;

    var execCurrentRule = function (error) {

        // Increment counter every time the callback returns ...
        self._updateFlowControl(msg, 'rule');

        currentRuleObj = self._getNextRule(msg);


        // Exit if next rule isn't found or there is an error in execution ....

        if (error || !currentRuleObj) {

            /*
             DONE...!!!!

             We have checked every rule against this message and have moved on
             to applying actions here.
             */
            _.set(_meta, "ts.end", Date.now());

            // We now delete the message inside the flowControl
            delete self.flowControl[msgId];

            // We also decrease the messageCounter for the specific rule Hash
            self.loadedRules[reHash].messageCounter -= 1;

            return callback(error, _meta);
        }

        // Reset conditions and actions index for every new rule

        self.flowControl[msgId].rule_condition_idx =  -1;
        self.flowControl[msgId].rule_action_idx    = -1;

        /*
         Start executing the current rule here ....
         */
        //

        return self.apply(execCurrentRule, currentRuleObj.rule, msg, _meta);
    };
    execCurrentRule();

};

/*
    Here We load rules from Database.
    And keep reloading every 5 minutes or so ...
 */

rule.prototype.loadRules = function(r) {

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
         rule_map      = {},
         tag_rule_map  = {},
         rule_hash     = null;

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

                item.rule_condition = CONDITION._parseRuleCondition(item.rule_condition);
                row_found.conditions.push(item.rule_condition);

                rule_condition_map[row_found.id][item.rule_condition.id] = true;
            }

            // see if action is already there
            if (!rule_action_map[row_found.id][item.rule_action.id]) {

                item.rule_action = ACTION._parseRuleAction(item.rule_action);
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
            item.rule_condition = CONDITION._parseRuleCondition(item.rule_condition);
            row_new.conditions = [ item.rule_condition];

            // set actions
            item.rule_action = ACTION._parseRuleAction(item.rule_action);
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

    rule_hash = CRYPTO.createHash('sha1').update(JSON.stringify(result)).digest('hex');

    _.set(self.loadedRules, rule_hash + ".rules" , result);


    /*
        Push the Rules to a Tag List Map so that
        we can access rules based on tags
        NOTE : This is done after sorting so that tagged rules are also priority based
     */

    for (var irule = 0 ; irule < result.length; irule++) {
        // go through tags of each rule .. and create buckets
        for(var jtag = 0; jtag < result[irule].tags.length; jtag ++) {

            var tag = result[irule].tags[jtag];
            // if this tag does not exist, create it
            if(!tag_rule_map[tag]) tag_rule_map[tag] = [];

            tag_rule_map[tag].push(result[irule]);
        }
    }

    _.set(self.loadedRules, rule_hash + ".tagRules" , tag_rule_map);

        /*

         Helps to keep track of messages that are currently pending
         in the instance of the Rule engine . Will help in cleaning
         older instances of the rules later.
         */

    _.set(self.loadedRules, rule_hash + ".messageCounter" , 0);
    _.set(self._meta , "ts.rules_loaded", Date.now());

    // This property indicates the latest Rule Engine Hash
    _.set(self._meta, "ruleEngineHash", rule_hash);

    // Clean all previous rule engine hashes that have no processing message
    // in them (messageCounter === 0)

    return;

};

module.exports = rule;
