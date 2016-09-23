/*jshint multistr: true ,node: true*/

"use strict";

var rules  = [
   {
       "id": 1,
       "name": "Natural Number ",
       "externalReference": "",
       "conditionsOperator": "&&", // very important
       "priority": 100,
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
               "operation": "=",
               "value": "1"
           },

           {
               "id": 105,
               "key": "integer",
               "operation": "!=",
               "value": "-10"
           },

       ],
       "actions": [
           {
               "id": 101,
               "action": "SET_VARIABLE",
               "key": "is_natural",
               "value": 1
           },
       ]
    },

    {
       "id": 2,
       "name": "2",
       "externalReference": "",
       "conditionsOperator": "&&", // very important
       "priority": 101,
       "tags": [
           "b2",
       ],
       "conditions": [
           {
               "id": 200,
               "key": "integer",
               "operation": ">",
               "value": "0"
           },

           {
               "id": 201,
               "key": "integer",
               "operation": ">=",
               "value": "1"
           },

           {
               "id": 202,
               "key": "integer",
               "operation": "<",
               "value": "100000"
           }

       ],
       "actions": [
           {
               "id": 201,
               "action": "SET_VARIABLE",
               "key": "is_b2_1",
               "value": 1
           },
       ]
    },

    {
       "id": 3,
       "name": "3",
       "externalReference": "",
       "conditionsOperator": "&&", // very important
       "priority": 103,
       "tags": [
           "b2",
       ],
       "conditions": [

           {
               "id": 301,
               "key": "integer",
               "operation": "<=",
               "value": "100000"
           },

           {
               "id": 302,
               "key": "integer",
               "operation": "=",
               "value": "1"
           },

           {
               "id": 303,
               "key": "integer",
               "operation": "!=",
               "value": "-10"
           },

       ],
       "actions": [
           {
               "id": 301,
               "action": "SET_VARIABLE",
               "key": "is_b2_2",
               "value": 1
           },
       ]
    },

];

module.exports = rules;