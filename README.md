# youknowwho
Rule engine for most of generic decisions and flow control ... Gui will follow soon


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


### Rule Conditions
Each condition has 4 parts

1. **Condition**  : possible options
> + **Check Variable** : Default option which uses key value operation

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
> 
> + E.g. [1, 2, 3]
> ('set', 'Is a part of the Set (set)'),
> ('!set', 'Is not a part of the set (!set)'),

The value to the condition can be a static value or something that belongs to the input message of the rule.
To provide dynamic input values, use the lodash template syntax.


### Rule Actions
Each Action will have 3 parts

1.  **Action** : Possible options are
> + **Set Variable** ==> Sets a variable in the source message
> + **Stop Processing more rules** ==> Stop Processing more rule/action after this action
> + **DANGEROUS_EVAL** ==> This will 'eval' the key and overwrite it.
> + **Execute custom functions** ==> This will execute a user defined functions in a set way with guidelines

2. **Key** : For Set variable or according to action
3. **Value** : For set variable or according to action. See Rule Action Value for options

### Rule Action Value
- **boolean** ==> "true" or "false" will be converted to boolean TRUE/FALSE
- **template string** ==> Specify string in lodash format "<="" and it will be treated as a lodash template. The variables in the template are picked from message.
- **normal string** : any string other than above two will be treated as a normal string.


## Custom Function in Actions
The function is expected to be in following format

```sh
function custom(callback, arg) {
    
    .... do something with arg()
    callback();
} 
```

 - Each function's 1st argument will be the callback it is expected to call once its execution is over.
 - There is no differentiation in blocking and non-blocking functions, and also in sync and async functions, since we are anyway passing a callback.

 - **arg** : arg is the argument which can be passed to function by previous rules/actions. Each message will have a key :=> **msg.__execargs__** which will have key for each function. E.g. if user wishes to pass an object as an argument to function *f1* , it will set it in **msg.__execargs__.f1** .

 - **function context** : Rule engine will expose a *execContext* which will be the object which will hold all function definitions and will be supplied as the context (this) in function execution.

 - **Error handling/ execptions** : All functions will be called within a try-catch exception handling and rule engine is not expected to handle any error/exception.


### Logs and Debugging
( Tag 0.0.7 ) UPDATED : wont emit logs anymore. This will be taken care by Meta object


### Rules Source/Save
Rules are to be submitted in Following Form : Array of Rules order by priority ( 1 being highest ). Ideally only Active Rules should be submitted.

Each rule is a dictionary : Object having following Keys :

| r_id | r_name | r_exref | r_tags | r_condop | r_priority | r_status | r_c_id | r_c_condition | r_c_key | r_c_op | r_c_value | r_a_id | r_a_action | r_a_key | r_a_value |

This means a lot of repeative information, but we find it easy to maintain a tabular structure.
Maybe we will change it later to a more JSONified format


### GUI ?
We at paytm save rules in Mysql and use Django Admin to create a rule engine around it. It is very simplistic. Repos will be open sourced as well, soon.


### Usage

Load the Rules first( and again and again ...) and simply apply them .
```
loaded_hash = ruleEngineObject.loadRules(arrayOfRules);

/*  Loaded_hash is hash generated for the list of rules. This can be used to differentiate the set of rules.
*/
```

Specifying context of custom user-defined functions
```
ruleEngineObject.setExecContext(execObject);

```

Applying Rules
```
/*
    msg : the object which needs to be changed . This object is passed by reference and if user wishes to keep the original object sane then he / she needs to clone the object before passing here ( using lodash/underscore or similar )

    ruletag : single tag. TODO : support for multiple tags
*/

meta_object = ruleEngineObject.applyRules(msg, ruletag);

```



### Rule Engine Hash ( loaded_hash )
This calculates a hash of loaded rules , which helps in audit. This is a simple SHA1 hash.

### Meta Object
Meta object saves the state of each rule , condition and action with variups required timestamps. It is not in the scope of this project to analyze the performace/metrics of the engine/rules.
This can help in re-arranging conditions, removing redundant /slow rules, etc. . Idea should be to minimize the number of conditions/rules for each message.
Schema of meta object

```sh
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


### Benchmarks : on single core
 - 10K rules with 1 condition 1 action
 - 1 rule with 10K conditions, 10K actions
 - 1 rule, 1 condition, 1 action , 10K iterations


### Theory 
- Why will we never support 'calling rules' with multiple tag options ? : Then conditional operators among tags will be a major requirement and tags are essentially rule groups.

- Changing Rule Engine execution from sync to async :
    + While sync offered a lot more performance benefit , ease of usage and code simplicity , it lacked a majority extensibility , i.e. executing cutom functions in code flows. Conditions, while sync, are forcefully made async to keep the options open, and to keep performance realistic.


### Todo / improvements / known Bugs
- Write test cases to use Meta object as well as Rule engine output.
- Do Benchmarks
- Support for Custom Blocking/non-blocking sync/async functions is still debatable and is not added as of now
- Rule Snapshots ? Rule Audits ?
- How to define a common Rules language ? Currently Rules are picked from DB. Is that standard way , or should we define an API for this ?
- Give a GUI to manage Rules/ get status/ get active Rules, etc...
