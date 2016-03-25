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


ruleClass.prototype._initRule     = function (msg, ruleObj) {
    var
        self  = this,
        msgId = _.get(msg, "_meta.id", null);


    _.set(self.flowControl, msgId + ".rules." + ruleObj.rule.id + ".conditions", {});
    _.set(self.flowControl, msgId + ".rules." + ruleObj.rule.id + ".total_conditions", ruleObj.rule.conditions.length);
    _.set(self.flowControl, msgId + ".rules." + ruleObj.rule.id + ".actions", {});
    _.set(self.flowControl, msgId + ".rules." + ruleObj.rule.id + ".total_actions", ruleObj.rule.actions.length);

    _.set(self.flowControl, msgId +  ".rule_condition_idx", 0);
    _.set(self.flowControl, msgId +  ".rule_action_idx", 0);

};

ruleClass.prototype._exitRE       = function (msg) {
    var self     = this,
        callback = null,
        _meta    = null,
        msgId    = _.get(msg, "_meta.id", null),
        reHash   = _.get(self.flowControl, msgId + ".ruleHash", null);

    // This callback fn is set when the execrules is called in the start .
    callback = _.get(self.flowControl, msgId + "._YKW_callback", null);

    // Get all meta related info from a common getClientMeta function
    _meta = self._getClientMeta(msg);


    // Clean the self.flowControl variable before returning ....
    delete self.flowControl[msgId];

    // Decrement message counter from the ruleEngine ..
    self.loadedRules[reHash].messageCounter -= 1;

    return callback(_meta);
};

ruleClass.prototype._cb_applyRule = function (msg, currentRuleObject) {

    /*
     This either executes more rules once all the actions have been applied for the current rule

     OR

     This becomes the final callback which captures the state where
     ALL rules have been executed ...

     This is the only function which will call the callback for the RE caller
     */

    var
        self     = this,
        ruleObj  = null;

    self._updateFlowControl(msg, 'rule');

    ruleObj = self._getRule(msg);

    if (ruleObj) {
        // Transfer this to a function ...
        self._initRule(msg, ruleObj);
        return self._applyRule(self._cb_applyRule.bind(self, msg, ruleObj), msg, ruleObj);
    }


    self._exitRE(msg);

};

ruleClass.prototype._cb_applyCondition = function (msg, conditionObj, ruleObj, cDecision) {

    // call check decision here with the applyConditionCallback ....
    var self = this,
        msgId = _.get(msg, "_meta.id", null);


    // Increment condition counter each time the callback is returned ...
    self._updateFlowControl(msg, 'condition');

    // Update changes to meta here ...
    _.set(self.flowControl, msgId + ".rules." + ruleObj.rule.id + ".conditions." + conditionObj.condition.id, cDecision);

    return self._applyRule(self._cb_applyRule.bind(self, msg, ruleObj), msg, ruleObj);
};

ruleClass.prototype._cb_applyAction = function (msg, action , rule) {

    var
        self = this;
    // Increment action counter each time the callback is returned ...
    self._updateFlowControl(msg, 'action');

    return self._applyRule(self._cb_applyRule.bind(self, msg, rule), msg, rule);

};

ruleClass.prototype._checkDecision = function (msg, rule) {


    var
       self                = this,

       // This is just an object which keeps individually executed conditions
       //  incase there is a mixed rule type ...
        compiledObj        = {},
        msgId              = _.get(msg, "_meta.id", null),

        msgMeta            = _.get(self.flowControl, msgId, null),
        currentRule        = self._getRule(msg).rule,

        rOperator          = rule.conditionsOperator,
        ruleConditions     = _.get(self.flowControl, msgId + ".rules." + currentRule.id + ".conditions", {}),

        // Decision for each individual condition
        cDecision          = null,

        conditionsCtr      = 0,
        totalConditions    = _.get(self.flowControl, msgId + ".rules." + currentRule.id + ".total_conditions", 0),

        /*


         The following statements are under the assumption that conditions always return
         true or false.

         If the condition is null , then we blindly set the final decision var to be null.

         The final decision is set depending upon the rule operator type (&& or || or mix).


         Possible values for final decision are :
         a) True : The rule conditions have been successfully applied.
                   This would tell flow control to start executing actions .

         b) False : The rule conditions could not be applied.
                   This would ask the flow control to start executing the other rule.

         c) null : This means that a final decision cannot be arrived at,
                   We need to execute more conditions to arrive at a final decision.


         Every time this function is called, it iterates over all the conditions that have been
         executed and calculates the final decision . The conditions are ANDED or ORD among them
         depending upon the rOperator type .


         If the rOperator is of a mix type ( C1 && C2 || C3) , then we wait for the result of
         all conditions to execute before sending a reply ...

         this means returning the final decision is null till all conditions have been arrived at .

         If there are no conditions to a rule , by default all actions are supposed to be executed ...
         This would mean that the final Decision is always supposed to be true .

         */

        finalDecision = null;

        /*

         We set the final decision depending upon the result of the first condition AND
         ONLY IF the rOperator is of type && or ||. This is does not hold true for
         mix type rules ...

         */


    _.keys(ruleConditions).forEach(function (conditionId, idx) {

        cDecision = _.get(ruleConditions, conditionId, null);

        if (idx === 0) {
            finalDecision = cDecision;
        }

        if (self.R_OPERATORS.AND === rOperator) {
            // Get the boolean value for the condition executed .
            finalDecision = finalDecision && cDecision;
        } else if (self.R_OPERATORS.OR === rOperator) {
            // Get the boolean value for the condition executed .
            finalDecision = finalDecision || cDecision;
        } else {

            // Keep setting condition values in the compiled obj

            _.set(compiledObj, idx, cDecision);

            // Eval only when all conditions of the rule have been executed.
            if (idx === totalConditions.length - 1) {
                finalDecision = eval(rOperator({'c': compiledObj}));
            }
        }

        conditionsCtr++;
    });

    /*

     We return the finalDecision has a boolean under the following cases :

     a) All conditions have been executed and we have to return the computed final decision.
     b) The rOperator type is "&&" and the finalDecision is false .
     c) The rOperator type is "||" and the finalDecision is true.

     else
       return null (need to execute more conditions to arrive at a final decision) .
     */


    if ((rOperator === self.R_OPERATORS.AND) && finalDecision === false) {
        return finalDecision;
    }

    if ((rOperator === self.R_OPERATORS.OR) && finalDecision === true) {
        return finalDecision;
    }


    if (conditionsCtr === totalConditions) {
        // case where there are no conditions to be executed ...
        if (totalConditions === 0) {
            finalDecision = true;
        }

        return finalDecision;
    }

    return null;
};

ruleClass.prototype._getClientMeta = function (msg) {

    var
        self    = this,
       _meta   = _.cloneDeep(self._meta),

        rules   = [],
        msgId   = _.get(msg, "_meta.id", null),
        msgMeta = _.get(self.flowControl, msgId, {});


    rules = _.get(msgMeta , "rules", {});
    _.set(_meta, "ts.start", _.get(msgMeta, "ts.start"));

    // Iterate over all rules and set their meta .

    _.keys(rules).forEach(function (ruleId) {
        // Copy specific keys from msgMeta
        _.set(_meta, "rules." + ruleId, {});
        _.set(_meta, "rules." + ruleId + ".conditions", _.get(msgMeta, "rules." + ruleId + ".conditions", null));
        _.set(_meta, "rules." + ruleId + ".applied", _.get(msgMeta, "rules." + ruleId + ".applied", null));
        _.set(_meta, "rules." + ruleId + ".actions", _.get(msgMeta, "rules." + ruleId + ".actions", null));
        _.set(_meta, "rules." + ruleId + ".total_actions", _.get(msgMeta, "rules." + ruleId + ".total_actions", null));
        _.set(_meta, "rules." + ruleId + ".total_conditions", _.get(msgMeta, "rules." + ruleId + ".total_conditions", null));
    });

    _.set(_meta, "ts.end", Date.now());
    return _meta;
};

ruleClass.prototype._applyCondition     = function (callback, msg, conditionObj) {
    return CONDITION.apply(callback , msg, conditionObj.condition);
};

ruleClass.prototype._applyAction = function  (callback, msg, actionObj) {
    return ACTION.apply(callback, msg, actionObj.action);
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

ruleClass.prototype._getRule = function (msg) {

    var self        = this,
        returnVal   = null,
        msgId       = _.get(msg, "_meta.id", null),
        rules       = _.get(self.flowControl, msgId + ".rule_set", []),
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

ruleClass.prototype._getCondition = function (msg) {

    var self             = this,
        returnVal        = null,
        msgId            = _.get(msg, "_meta.id", null),

        rules            = _.get(self.flowControl, msgId + ".rule_set", []),

        currentRuleIdx   = _.get(self.flowControl, msgId + ".rule_idx", null),
        currentRule      = rules[currentRuleIdx],

        conditionIdx     = _.get(self.flowControl, msgId + ".rule_condition_idx"),
        currentCondition = _.get(currentRule, "conditions", [])[conditionIdx];


    if (currentCondition) {
        returnVal = {
            index     : conditionIdx,
            condition : currentCondition
        };

    }

    return returnVal;
};

ruleClass.prototype._getAction = function (msg) {



    var self             = this,
        returnVal        = null,
        msgId            = _.get(msg, "_meta.id", null),

        rules            = _.get(self.flowControl, msgId + ".rule_set", []),

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

ruleClass.prototype._applyRule = function (callback, msg, ruleObj) {

    /*
     apply Rule is the overall flow control function of YKW .
     This can be the entry point from exec Rule ...

     This can also be called from _cb_applyCondition && _cb_applyAction .
     */


    /*
     Not validating the ruleObject here ... presumed that all callers do their
     job of validation before passing control to this function ...
     */

    var
        self                = this,
        finalDecision       = null,
        msgId               = _.get(msg, "_meta.id", null),
        rule                = ruleObj.rule,
        conditionObj        = self._getCondition(msg),
        actionObj           = self._getAction(msg);


    /*

     If the applyRule is called from the _cb_applyAction , there can be a chance
     that it set the msg.RE_EXIT property , if that is the case , we start
     to execute the next rule ...

     */

    if (_.get(msg, ACTION.R_ACTIONS.RE_EXIT, false) === true) {
        delete msg[ACTION.R_ACTIONS.RE_EXIT];
        self._exitRE(msg);
    }

    // Call check decision here ...
    finalDecision = self._checkDecision(msg, rule);

    switch (finalDecision) {

    case true :
        // Rule conditions successful , apply actions if they exist ...
        _.set(self.flowControl, msgId + ".rules." + rule.id + ".applied", true);

        if (!actionObj) {
            // All actions have been executed ... make a call to cb_applyRule
            return callback();
        }

        return self._applyAction(self._cb_applyAction.bind(self, msg, actionObj, ruleObj), msg, actionObj);

    case false :
        _.set(self.flowControl, msgId + ".rules." + rule.id + ".applied", false);
        // Execute next rule ... this callback is basically the cb function for cb_applyRule
        return callback();

    case null:
        // The condition Obj should always exist if the check decision function has returned null ...
        return self._applyCondition(self._cb_applyCondition.bind(self, msg, conditionObj, ruleObj) , msg, conditionObj);

    }
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
        _meta               = null,
        currentRuleObj      = null;

    // Thinking of keeping a seperate _setMeta function which adds the necessary info for the client ... This will help in reducing the passing of the _meta object in the rule set ....


    _.set(msg, "_meta.id", msgId);

    /*
     When the ruleHash is loaded , lets increment messageCounter
     in the loaded rule object . This helps to keep track
     if the current rule set has any messages that are
     being processed or not . Helps in cleaning older rule sets
     afterwards .
    */

    self.loadedRules[reHash].messageCounter += 1;

    // Initialize the ruleset for the message before execution .
    // Helps in iterating later and not finding the appropriate rule
    // set again and again.



    // Should be converted to a function ....
    self.flowControl[msgId] = {

        /*
         Let each message have its own YKW callback
         function defined in its flowControl space .
         */

        _YKW_callback        : callback,
        "rule_idx"           : 0,
        "rule_set"           : self._getLoadedRules(reHash, tag),
        "rules"              : {
        },

        /*

        Each message should also have a copy
        of the reHash . This identifies the rule set
        that has been loaded into the message flow control.
        This later on is used to decrement the message counter
         */
        "ruleHash" : reHash
    };



    _.set(self.flowControl, msgId + ".ts.start", Date.now());

    /*
     Start applying rules here ...
     */

    currentRuleObj = self._getRule(msg);

    /*
     No need to execute the RE if no rules are present ...
     Add the RE end timestamp and return ...
     */

    if (!currentRuleObj) {
        _meta = self._getClientMeta(msg);
        return callback(_meta);
    }

    self._initRule(msg, currentRuleObj);

    return self._applyRule(self._cb_applyRule.bind(self, msg, currentRuleObj), msg, currentRuleObj);

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

                if (item.rule_condition.key !== null) {
                    row_found.conditions.push(item.rule_condition);
                }


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

            row_new.conditions = [];

            // set conditions
            item.rule_condition = CONDITION._parseRuleCondition(item.rule_condition);

            /*
             Avoid pushing entries to rules that are of the type :
             { id: null, key: null, operation: null, value: null }
            */

            if (item.rule_condition.key !== null) {
                row_new.conditions.push(item.rule_condition);
            }

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

    return rule_hash;

};

module.exports = ruleClass;
