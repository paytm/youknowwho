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



function ruleClass () {

    var self = this;

    ACTION             = new ACTION_CLASS();
    CONDITION          = new CONDITION_CLASS();


    self.R_OPERATORS         = {
        AND                     : "&&",
        OR                      : "||"
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

ruleClass.prototype._cb_applyRule = function (callback , msg, _meta) {

    /*
     This either executes more rules once all the actions have been applied for the current rule

     OR

     This becomes the final callback which captures the state where
     ALL rules have been executed ...

     This is the only function which will call the callback for the RE caller
     */

    var
        self = this,
        nextRuleObj = null;


    self._updateFlowControl(msg, 'rule');
    nextRuleObj = self._getNextRule(msg);

    if (nextRuleObj) {
        return self.applyRule(self._cb_applyRule.bind(self, callback, msg, _meta), msg, nextRuleObj, _meta);
    }
    _.set(_meta, "ts.end", Date.now());

    return callback(_meta);
};

ruleClass.prototype._applyCondition     = function (callback, msg, conditionObj) {
    return CONDITION.apply(callback , msg, conditionObj.condition);
};

ruleClass.prototype._cb_applyCondition = function (callback , msg, rule, _meta, conditionObj,finalDecision, cDecision) {

    // call check decision here with the applyConditionCallback ....
    var self = this;
    // Increment condition counter each time the callback is returned ...
    self._updateFlowControl(msg, 'condition');


    // Update changes to meta here ...

    _.set(_meta, "rules." + rule.id + ".conditions." + conditionObj.condition.id, cDecision);

    return self._checkDecision(callback, msg, rule, _meta, conditionObj, finalDecision, cDecision);
};

ruleClass.prototype.applyAction = function  (callback, msg, action) {
    return ACTION.apply(callback, msg, action);
};

ruleClass.prototype._cb_applyAction = function (callback, msg, _meta) {

    var
        self = this;
    // Increment action counter each time the callback is returned ...
    self._updateFlowControl(msg, 'action');

    var
        nextRule   = null,
        nextAction = self._getNextAction(msg);

    /*
     Check if any more actions have to be called ...
     or the action is the RE Exit condition ...

     If there are none , return callback ....
     */



    if (!nextAction || _.get(msg, ACTION.R_ACTIONS.RE_EXIT, false) === true) {

        // We update the rule counter here and get the next rule.
        self._updateFlowControl(msg, 'rule');

        nextRule = self._getNextRule(msg);
        return self.applyRule(callback, msg, nextRule, _meta);

    } else {
        // Execute remaining actions
        return ACTION.apply(callback, msg, nextAction);
    }

};

ruleClass.prototype._checkDecision = function (callback, msg, rule ,_meta,
                                               currentConditionObject, finalDecision,
                                               cDecision) {

    // cDecision is the condition decision
    // finalDecision is the decision of the conditions executed till the
    // current condition

    var self        = this,
        /*
         This execEntity variable decides whether

         1) The next rule has to be executed .
         2) The next condition has to be executed .
         3) The next action has to be executed ...
         */

        execEntity    = 'condition',
        ruleObj       = null,
        actionObj     = self._getNextAction(msg),
        nextConditionObj = self._getNextCondition(msg),
        compiledObj = {};


    if (currentConditionObject.index === 0) {
        finalDecision = cDecision;
    }


    if (rule.conditionsOperator === self.R_OPERATORS.AND) {
        finalDecision = finalDecision && cDecision;
        if (finalDecision === false) {
            execEntity = 'rule';
        }

    } else if (rule.conditionsOperator === self.R_OPERATORS.OR) {

        finalDecision = finalDecision || cDecision;

        if (finalDecision === true) {
            execEntity = 'action';
        }

    } else {

        //for handling complex functions
        // Samarth : Have to figure out why the index is used here ..
        // what does cdecision imply in this case
        _.set(compiledObj, currentConditionObject.index,cDecision);
    }


    if (rule.conditionsOperator != self.R_OPERATORS.AND && rule.conditionsOperator != self.R_OPERATORS.OR) {
        // Example : _.template(' <%= c[0] %> && <%= c[1] %> || <%= c[2] %> && <%= c[3] %>')
        finalDecision = eval(rule.conditionsOperator({'c': compiledObj }));
        // end exec condition  ....
    }

    /*

     Check if execEntity is null (no conclusion has been reached) and there are
     more conditions left to execute.

     If there are no more conditions to execute , then either the next rule will
     be applied or the next action ... This depends upon the final decision .

     Incase the final decision is also null , we still execute actions since there
     were no conditions for this rule to falsify it ...
     */


    if (nextConditionObj === null) {
        _.set(_meta, "rules." + rule.id + ".applied", false);

        execEntity = 'rule';

        if (finalDecision === true || finalDecision === null) {
            _.set(_meta, "rules." + rule.id + ".applied", true);
            execEntity = 'action';
        }

    }

    // call check decision here ...

    switch(execEntity) {

    case 'rule':
        // Execute next rule here

        self._updateFlowControl(msg, 'rule');
        ruleObj = self._getNextRule(msg);
        self.applyRule(callback, msg, ruleObj , _meta);
        break;
    case 'condition':
        // Unable to reach final decision ,
        // execute more conditions ...
        CONDITION.apply(callback, msg, nextConditionObj.condition);
        break;
    case 'action':
        // Conditions were met ,
        // execute actions now ....
        ACTION.apply(self._cb_applyAction.bind(self, callback, msg, _meta), msg, actionObj.action);
        break;

    }

};

ruleClass.prototype._getLoadedRules = function (reHash, tag) {
    var self        = this,
        ruleId      = reHash;

    if (tag) {
        ruleId += ".tagRules." + tag;
    } else {
        ruleId += ".rules";
    }

    return _.get(self.loadedRules, ruleId, []);
};

ruleClass.prototype._cleanLoadedRules = function () {
    // clean loaded rules that have messageCounter === 0
    // and the rule hash is not the same as the
    // latest rule hash.

    var self           = this,
        ruleHashes     = _.keys(self.loadedRules),
        ruleSet        = null,
        latestRuleHash = _.get(self, "_meta.ruleEngineHash", null);

    ruleHashes.forEach(function (hash) {
        ruleSet = _.get(self, "loadedRules." + hash, {});

        if (hash !== latestRuleHash &&
            ruleSet.messageCounter === 0) {

            delete self.loadedRules[hash];
        }
    });

    return;
};

ruleClass.prototype._getMsgId = function () {
    // *1000 is necessary since a floating point interferes with the _.get()
    return Date.now() + Math.random().toFixed(3)*1000;
};

ruleClass.prototype._getNextRule = function (msg) {

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

ruleClass.prototype._getNextCondition = function (msg) {

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

ruleClass.prototype._getNextAction = function (msg) {

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

ruleClass.prototype._updateFlowControl = function (msg, entity) {
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

ruleClass.prototype.applyRule = function (callback, msg, ruleObject, _meta) {

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
        currentRule         = null,
        currentConditionObj = null;

    // _meta has to be always set by reference ... this is being referred from
    // execRules

    if (!ruleObject) {
        // return callback if no more rules are present
        // to execute ....
        return callback();
    }

    currentRule = ruleObject.rule;

    _.set(_meta, "rules." + currentRule.id + ".conditions", {});
    _.set(_meta, "rules." + currentRule.id + ".total_conditions", currentRule.conditions.length);
    _.set(_meta, "rules." + currentRule.id + ".actions", {});
    _.set(_meta, "rules." + currentRule.id + ".total_actions", currentRule.actions.length);

    currentConditionObj = self._getNextCondition(msg);

    if (!currentConditionObj) {
        // This calls the _cb_applyRule ...
        return callback();
    }

    /*
     ConditionObj has two parts to it  :
     1. Condition is used in apply condition
        and updating the _meta variable ...

     2. Index is used in check decision function
        to end the rule engine prematurely ...
     */

    return self._applyCondition(self._cb_applyCondition.bind(self, callback, msg, currentRule,
                                                             _meta, currentConditionObj,
                                                             finalDecision), msg, currentConditionObj);
};

ruleClass.prototype.executeRules = function(callback, msg, tag) {

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
        msgId               = self._getMsgId(),
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
        "rule_idx"           : 0,
        "rule_condition_idx" : 0,
        "rule_action_idx"    : 0
    };

    // When the ruleHash is loaded , lets increment messageCounter
    // in the loaded rule object .

    self.loadedRules[reHash].messageCounter += 1;

    /*
     Start applying rules here ...
     */

    currentRuleObj = self._getNextRule(msg);

    return self.applyRule(self._cb_applyRule.bind(self, callback, msg, _meta), msg, currentRuleObj, _meta);

};

/*
    Here We load rules from Database.
    And keep reloading every 5 minutes or so ...
 */

ruleClass.prototype.loadRules = function(r) {

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


    // Clean all previous rule engine hashes
    self._cleanLoadedRules();

    return;

};

module.exports = ruleClass;
