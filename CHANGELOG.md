
## v0.0.9
- Test cases giving around 93% coverage
- Returning Meta in every call


## v0.0.8
Stable version after discarding async crap

## v0.0.7

Features :

- removed event emitters incase an output is required from the rule engine.
- Introduced _meta object that is returned on every input message.
- Optimized a conditions for Rule Engine where it breaks out of the loop prematurely depending upon the condition operator. 
- Rule Engine to support tags only under the rule_tags namespace of json. (More example in the test case)


## v0.0.6
First stable version 