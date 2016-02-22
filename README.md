# youknowwho
Rule engine for most of generic decision makings ... Gui will follow some


# Opts to instantiate
- *debug*         : BOOLEAN . Will start emitting Debug Events. NOTE : Will SLOW DOWN the rule engine since Event Emitter is panifully Slow. ( Tag 0.0.7 ) UPDATED : wont emit debug logs anymore


# Rules
- *Id*            : Will be unique identification of a rule
- *Name*          : Not used anywhere except for Logging
- *Tags*          : Each rule can be associated with many tags . They help in applying selective rules
- *Description*   : Personal comments for a rule
- *External Reference*    : If rules are created by some other entity, this is used to create that bonding
- *Status*    : obvious
- *Priority*  : Lower the integer value, higher the priority.

- *Conditonal Operator* : Operator Applied to all conditions to calculate final True/False value for conditions. 
    || if all conditions are to be || (ORed)
    && if all conditions are to be && (ANDed)
    Custom value E.g. <%= c[0] %> && <%= c[1] %> || <%= c[2] %> && <%= c[3] %> : which dictates how conditions are manipulated

- *Conditions* : are applied sequentially, and are blocking in manner. Next condition is applied only after previous has been evaluated. More about Rule conditions in next topic
 
- *Actions* : are applied only after conditions evaluate to TRUE according to conditional operator's value.Are sequential, and blocking in manner. Next Action is applied only after previous has been evaluated. More about Rule Actions in next topic


# Rule Conditions
Each condition has 4 parts

1. **Condition**  : possible options
> + **Check Variable** : Default option which uses key value operation 
> + **Custom blocking Sync function** ( ToDo )
> + **Custom blocking Async Function** ( ToDo )

2. **Key**           : Value / dictionary path which will be compared
3. **Value**         : which will be compared to the key
4. **Operation**     : How to compare. Possible options are

> + ( '=', 'Equals ( = )'), 
> ( '!=', 'Not Equals ( != )'),
> 
> + ( '>', 'Great than Integer ( > )'),
> ( '>=', 'Great than Equals
> Integer( >= )'),
> 
> + ( '<', 'Less than Integer( < )'), 
> ( '<=', 'Less than Equals Integer(<= )'),
> 
> + E.g. : 1,2,4~5, 6~10,11,12~ 
> ('range', 'In Numerical Range ( range )'),
> ('!range', 'Not In Numerical Range ( !range )'),
> 
> + E.g. : 2015-06-11 ~ 2015-07-12 
> ('datetimerange', 'In DateTime Range (datetimerange )'), 
> ('!datetimerange', 'Not In DateTime Range (!datetimerange )'),
> 
> + ('timerange', 'In Time Range ( timerange )'),
> ('!timerange', 'Not In Time Range ( !timerange )'),
> 
> + ('regex', 'In Regex ( regex )'), 
> ('!regex', 'Not In Regex ( !regex)'),
> 
> + E.g. ["a", "b", "c"] 
> ('stringrange', 'In String Array ( stringrange)'), 
> ('!stringrange', 'Not In String Array ( !stringrange )'),
> + E.g. [1, 2, 3]
> ('set', 'Is a part of the Set (set)'),
> ('!set', 'Is not a part of the set (!set)'),

The value to the condition can be a static value or something that belongs to the input message of the rule.
To provide dynamic input values, use the lodash template syntax.


# Rule Actions
Each Action will have 3 parts

1.  **Action** : Possible options are 
> + **Set Variable** ==> Sets a variable in the source message
> + **Stop Processing more rules** ==> Stop Processing more rule/action after this action
> + **DANGEROUS_EVAL** ==> This will 'eval' the key and overwrite it.
> + **Custom blocking Sync function** ( ToDo )
> + **Custom blocking Async Function** ( ToDo )
> + **Custom non blocking async Function** ( ToDo )

2. **Key** : For Set variable or according to action
3. **Value** : For set variable or according to action. See Rule Action Value for options

# Rule Action Value
- **boolean** ==> "true" or "false" will be converted to boolean TRUE/FALSE
- **template string** ==> Specify string in lodash format "<="" and it will be treated as a lodash template. The variables in the template are picked from message.
- **normal string** : any string other than above two will be treated as a normal string.


# Custom Function in Condition and Actions ( ToDo )
There are 3 types : All functions' first argument is opts, which contains keys depending upon usage

> 1. **Custom blocking Sync function** ==> Next condition/action is executed only when this function returns. For condition this is
> supposed to return TRUE/FALSE. 
> 2. **Custom blocking Async function** ==>  opts will contains *asyncCallback* ( cb ) .This should be called when work of action/condition is over. In case of condition , cb should be called
> with argument TRUE/FALSE . Opts will also contain *defaultOutput*
> which is default Boolean value in case of Error/exception. Opts will
> also contain a *asyncTimeout* value, which will execute  callback with
> *defaultOutput* .
> 3. **Custom non-blocking Async function** ==>  Will move ahead in execution after calling this. This is a dont care function whose
> output and execution do not matter. This is mainly for Action and is
> used for jobs like logging, pushing some email, etc. . *asyncCallback*
> can be specified here but it will not be blocking.

**Custom function opts** ( ToDo )
Condition and Action have custom functions to make use of cases which are not covered by Rule Engine. Idea is to realize what these functions can be and increase the scope of rule engine.
opts are


> - **defaultOutput** : Default output in case of condition. Can be true or false.
> - **asyncCallback** : Async Callback that will be called after function has done its task.
> - **asyncTimeout** : Timeout after which asyncCallback will be called with defaultOutut.
> - **asyncTimeout** : Timeout after which asyncCallback will be called with defaultOutut.

**How to use these functions?** ( ToDo )
Rule Engine exposes an attribute : *customFunc* , which is essentially an object . The key is a string which is functio name and Value if function prototype. This keeps the seasoning dynamic. There is no need to declare whether the

# Logs and Debugging
Log events are emitted on 3 levels :: log.verbose , log.info and log.error . These are event names. Rule Engine does not make use of any logging library to keep things independent.
( Tag 0.0.7 ) UPDATED : wont emit logs anymore. This will be taken care by Meta object


# Rules Source/Save
Rules are to be submitted in Following Form : Array of Rules order by priority ( 1 being highest ). Ideally only Active Rules should be submitted.

Each rule is a dictionary : Object having following Keys :

| r_id | r_name | r_exref | r_tags | r_condop | r_priority | r_status | r_c_id | r_c_condition | r_c_key | r_c_op | r_c_value | r_a_id | r_a_action | r_a_key | r_a_value |

This means a lot of repeative information, but we find it easy to maintain a tabular structure.
Maybe we will change it later to a more JSONified format


# GUI ?
We at paytm save rules in Mysql and use Django Admin to create a rule engine around it. It is very simplistic. Repos for this is open sourced as well. 


# Usage
Load the Rules first( and again and again ...) and simply apply them .
```
/*  Load rules 
        Pass array of Objects in above mentioned format
*/
loaded_hash = loadRules(arrayOfRules);

```

```
/*
    msg : the object which needs to be changed . This object is passed by reference and if user wishes to keep the original object sane then he / she needs to clone the object before passing here ( using lodash/underscore or similar )

    ruletag : single tag. TODO : support for multiple tags
*/

meta_object = self.rules.applyRules(msg, ruletag);

```

# Rule Engine Hash ( loaded_hash )
This calculates a hash of loaded rules , which helps in audit. This is a simple SHA1 hash.

# Meta Object
Meta object saves the state of each rule , condition and action with variups required timestamps. It is not in the scope of this project to analyze the performace/metrics of the engine/rules.
This can help in re-arranging conditions, removing redundant /slow rules, etc. . Idea should be to minimize the number of conditions/rules for each message.
Schema of meta object

```
    _meta : {
        "ts" : {
            "rules_loaded" : dateTime Object,
            "start" : dateTime Object,
            "end"   : dateTime Object
        },
        "ruleEngineHash" : "" // ToDo : so That we should be able to TAG the appropriate hash code with Rule Engine version

        "rules" : {
           "r1" : {
                "conditions" : {
                    "c1"    : true,
                    "c2"    : false
                },
                "applied"   : true,

                "actions"   : {

                }
           } 
       }
    }
```

# Todo / improvements / known Bugs

- Support for Custom Blocking/non-blocking sync/async functions is still debatable and is not added as of now
- Rule Snapshots ? Rule Audits ?
- How to define a common Rules language ? Currently Rules are picked from DB. Is that standard way , or should we define an API for this ?
- Apply rule should accept array of tags
- Give a GUI to manage Rules/ get status/ get active Rules, etc...
