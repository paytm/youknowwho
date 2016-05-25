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
               "id": 100,
               "key": "integer",
               "operation": ">",
               "value": "0"
           },

           {
               "id": 101,
               "key": "integer",
               "operation": ">=",
               "value": "1"
           },

           {
               "id": 102,
               "key": "integer",
               "operation": "<",
               "value": "100000"
           },

           {
               "id": 103,
               "key": "integer",
               "operation": "<=",
               "value": "100000"
           },

           {
               "id": 104,
               "key": "integer",
               "operation": "range",
               "value": "1,2,3~5, 6~"
           },

           {
               "id": 105,
               "key": "integer",
               "operation": "!range",
               "value": "-100~0"
           },
           {
               "id": 106,
               "key": "datetime",
               "operation": "datetimerange",
               "value": "2014-01-01 00:00:00~2016-01-01 00:00:00"
           },

           {
               "id": 107,
               "key": "datetime",
               "operation": "!datetimerange",
               "value": "2010-01-01 ~ 2011-01-01"
           },

           {
               "id": 108,
               "key": "time",
               "operation": "timerange",
               "value": "13:00:00 ~ 14:00:00"
           },

           {
               "id": 109,
               "key": "time",
               "operation": "!timerange",
               "value": "10:00:00 ~ 11:00:00"
           },

           {
               "id": 110,
               "key": "string",
               "operation": "regex",
               "value": "\\w+"
           },

           {
               "id": 111,
               "key": "string",
               "operation": "!regex",
               "value": "~\\w+"
           },
           {
               "id": 112,
               "key": "string",
               "operation": "stringrange",
               "value": "abcdef,xyz,pqr"
           },

           {
               "id": 113,
               "key": "string",
               "operation": "!stringrange",
               "value": "xyz,pqr"
           },
           {
               "id": 112,
               "key": "integer",
               "operation": "set",
               "value": "1,2,3"
           },

           {
               "id": 113,
               "key": "integer",
               "operation": "!set",
               "value": "4,5,6"
           },

           {
               "id": 112,
               "key": "integer",
               "operation": "=",
               "value": "1"
           },

           {
               "id": 113,
               "key": "integer",
               "operation": "!=",
               "value": "-10"
           },

       ],
       "actions": [
           {
               "id": 2,
               "action": "SET_VARIABLE",
               "key": "is_natural",
               "value": 1
           },
           {
                'id'     : 102,
                'action' : "RE_EXIT",
                'key'    : "",
                'value'  : ""
            }
       ]
    },

    {
       "id": 2,
       "name": "Execute  Function",
       "externalReference": "",
       "conditionsOperator": "||",
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
                'id'     : 200,
                'action' : "DANGEROUS_EVAL",
                'key'    : "eval_val",
                'value'  : "2+3"
            }
       ]
    },
];

module.exports = rules;