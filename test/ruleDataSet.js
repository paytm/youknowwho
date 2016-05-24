/*jshint multistr: true ,node: true*/

"use strict";

var rules  = [
   {
       "id": 1,
       "name": "Natural Number ",
       "externalReference": "",
       "conditionsOperator": "&&", // very important
       "priority": 170001,
       "tags": [
           "natural",
       ],
       "conditions": [
           {
               "id": 1,
               "key": "integer",
               "operation": ">",
               "value": "0"
           }
       ],
       "actions": [
           {
               "id": 2,
               "action": "SET_VARIABLE",
               "key": "is_natural",
               "value": 1
           }
       ]
    },

    {
       "id": 2,
       "name": "Execute  Function",
       "externalReference": "",
       "conditionsOperator": "&&", // very important
       "priority": 2,
       "tags": [
           "exec",
       ],
       "conditions": [
           {
                'id': 3,
                'key': 'integer',
                'operation': '>',
                'value': '0'
            }
       ],
       "actions": [
           {
                'id'     : 4,
                'action' : "EXEC",
                'key'    : "parse_json",
                'value'  : "name"
            }
       ]
    },
];

module.exports = rules;