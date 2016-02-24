"use strict";


var rules = [{
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
        id: 1,
        action: 'SET_VARIABLE',
        key: 'is_natural',
        value: 1
    }
}];

module.exports = rules;
