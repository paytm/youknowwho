/*jshint multistr: true ,node: true*/

"use strict";

var rules = [
{
    rule: {
        id: 1,
        name: 'Natural Number ',
        external_reference: '',
        conditionsOperator: '&&',
        priority: 170001
    },
    'rule_tags': {
        tags: 'natural'
    },
    rule_condition: {
        id: 1,
        key: 'integer',
        operation: '>',
        value: '0'
    },
    rule_action: {
        id: 2,
        action: 'SET_VARIABLE',
        key: 'is_natural',
        value: 1
    }
},
// rule with no conditions
{
    rule: {
        id: 2,
        name: 'Execute  Function ',
        external_reference: '',
        conditionsOperator: '&&',
        priority: 2
    },
    'rule_tags': {
        tags: 'exec'
    },
    rule_condition: {
        id: 3,
        key: 'integer',
        operation: '>',
        value: '0'
    },
    rule_action: {
        id     : 4,
        action : "EXEC",
        key    : "parse_json",
        value  : "name"
    }
}];

module.exports = rules;