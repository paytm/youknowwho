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
               "value": "~-1,1,2,3~5, 6~"
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
               "id": 101,
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
           "natural",
       ],
       "conditions": [
           {
                'id': 201,
                'key': 'integer',
                'operation': '>',
                'value': '0'
            }
       ],
       "actions": [
           {
                'id'     : 202,
                'action' : "DANGEROUS_EVAL",
                'key'    : "eval_val",
                'value'  : "2+3"
            }
       ]
    },

    {
       "id": 3,
       "name": "Checking all || conditions",
       "externalReference": "",
       "conditionsOperator": "||",
       "priority": 200001,
       "tags": [
           "or_rule",
       ],
       "conditions": [
           {
               "id": 301,
               "key": "integer",
               "operation": "<",
               "value": "0"
           },

           {
               "id": 302,
               "key": "integer",
               "operation": "<=",
               "value": "0"
           },

           {
               "id": 303,
               "key": "integer",
               "operation": ">",
               "value": "2"
           },

           {
               "id": 304,
               "key": "integer",
               "operation": ">=",
               "value": "2"
           },

           {
               "id": 305,
               "key": "integer",
               "operation": "range",
               "value": "2,3~5, 6~"
           },

           {
               "id": 306,
               "key": "integer",
               "operation": "!range",
               "value": "-100~2"
           },
           {
               "id": 307,
               "key": "datetime",
               "operation": "datetimerange",
               "value": "2013-01-01 00:00:00~2014-01-01 00:00:00"
           },

           {
               "id": 308,
               "key": "datetime",
               "operation": "!datetimerange",
               "value": "2013-01-01 00:00:00~2016-01-01 00:00:00"
           },

           {
               "id": 309,
               "key": "time",
               "operation": "timerange",
               "value": "13:00:00 ~ 13:05:00"
           },

           {
               "id": 310,
               "key": "time",
               "operation": "!timerange",
               "value": "10:00:00 ~ 15:00:00"
           },

           {
               "id": 311,
               "key": "string",
               "operation": "regex",
               "value": "~\\w+"
           },

           {
               "id": 312,
               "key": "string",
               "operation": "!regex",
               "value": "\\w+"
           },
           {
               "id": 313,
               "key": "string",
               "operation": "!stringrange",
               "value": "abcdef,xyz,pqr"
           },

           {
               "id": 314,
               "key": "string",
               "operation": "stringrange",
               "value": "xyz,pqr"
           },
           {
               "id": 315,
               "key": "integer",
               "operation": "set",
               "value": "2,3"
           },

           {
               "id": 316,
               "key": "integer",
               "operation": "!set",
               "value": "1,2,3,4,5,6"
           },

           {
               "id": 317,
               "key": "integer",
               "operation": "!=",
               "value": "1"
           },

           {
               "id": 318,
               "key": "integer",
               "operation": "=",
               "value": "-10"
           },

           {
               "id": 319,
               "key": "datetime",
               "operation": "datetimerange",
               "value": "2016-01-01 00:00:00~2017-01-01 00:00:00"
           },


           {
               "id": 320,
               "key": "time",
               "operation": "timerange",
               "value": "14:00:00 ~ 14:05:00"
           },

           {
               "id": 321,
               "key": "integer",
               "operation": "=",
               "value": "1"
           },
       ],
       "actions": [
           {
               "id": 301,
               "action": "SET_VARIABLE",
               "key": "is_weird",
               "value": 1
           }
       ]
    },

    {
       "id": 4,
       "name": "Template conditional op and complex conditions",
       "externalReference": "",
       "conditionsOperator": "<%= c[0] %> && ( <%= c[1] %> || <%= c[2] %> )",
       "priority": 400001,
       "tags": [
           "template_condition",
       ],
       "conditions": [
           {
                'id': 401,
                'key': 'integer',
                'operation': '=',
                'value': '<%= integer %>'
            },
            {
                'id': 402,
                'key': 'integer',
                'operation': '>',
                'value': '0'
            },
            {
                'id': 403,
                'key': 'integer',
                'operation': '<',
                'value': '0'
            },
       ],
       "actions": [
           {
                'id'     : 401,
                'action' : "DANGEROUS_EVAL",
                'key'    : "eval_val",
                'value'  : "1*2"
            }
       ]
    },


    {
       "id": 5,
       "name": "0 condition, template eval",
       "externalReference": "",
       "conditionsOperator": "&&",
       "priority": 500001,
       "tags": [
           "template_eval",
       ],
       "conditions": [
       ],
       "actions": [
           {
                'id'     : 501,
                'action' : "DANGEROUS_EVAL",
                'key'    : "template_eval_val",
                'value'  : "<%= integer %> + 1"
            }
       ]
    },

    {
       "id": 6,
       "name": "0 condition, template action set variable",
       "externalReference": "",
       "conditionsOperator": "&&",
       "priority": 600001,
       "tags": [
           "template_action_eval",
       ],
       "conditions": [
       ],
       "actions": [
           {
               "id": 601,
               "action": "SET_VARIABLE",
               "key": "set_variable_eval",
               "value": "<%= integer %>"
           },
       ]
    },

    {
       "id": 7,
       "name": "wrong condition which should be null in decision",
       "externalReference": "",
       "conditionsOperator": "&&",
       "priority": 700001,
       "tags": [
           "wrong_cond",
       ],
       "conditions": [
      {
              'id': 701,
              'key': 'integer',
              'operation': 'wrong',
              'value': '0'
      },
       ],
       "actions": [
           {
               "id": 701,
               "action": "SET_VARIABLE",
               "key": "wrong_cond",
               "value": 1
           },
       ]
    },

    {
       "id": 8,
       "name": "setting true false and null in rule action set variable",
       "externalReference": "",
       "conditionsOperator": "&&",
       "priority": 800001,
       "tags": [
       ],
       "conditions": [
       ],
       "actions": [
           {
               "id": 801,
               "action": "SET_VARIABLE",
               "key": "true",
               "value": "true"
           },
           {
               "id": 802,
               "action": "SET_VARIABLE",
               "key": "false",
               "value": "false"
           },
           {
               "id": 803,
               "action": "SET_VARIABLE",
               "key": "null",
               "value": "null"
           },
       ]
    },


    {
       "id": 9,
       "name": "Wrong Datetime format in condition",
       "externalReference": "",
       "conditionsOperator": "&&",
       "priority": 900001,
       "tags": [
          "wrong_datetime"
       ],
       "conditions": [
         {
               "id": 901,
               "key": "datetime",
               "operation": "datetimerange",
               "value": "asdf~asdg"
          },
          {
               "id": 902,
               "key": "time",
               "operation": "timerange",
               "value": "asdf~asdg"
          },

          {
               "id": 903,
               "key": "datetime_wrong",
               "operation": "datetimerange",
               "value": "asdf~asdf"
          },
          {
               "id": 904,
               "key": "time_wrong",
               "operation": "timerange",
               "value": "asdf~asdf"
          },
          {
               "id": 905,
               "key": "integer",
               "operation": "range",
               "value": "asdf"
           },
           {
               "id": 906,
               "key": "integer",
               "operation": "range",
               "value": ",,"
           },
           {
               "id": 907,
               "key": "integer",
               "operation": "range",
               "value": "7~6"
           },
           {
               "id": 908,
               "key": "integer",
               "operation": "range",
               "value": "7~7"
           },
           {
               "id": 908,
               "key": "integer",
               "operation": "range",
               "value": "4~8,5~8"
           },
       ],
       "actions": [
           {
               "id": 901,
               "action": "SET_VARIABLE",
               "key": "wrong",
               "value": "true"
           },
       ]
    },

    {
       "id": 10,
       "name": "Unknown action",
       "externalReference": "",
       "conditionsOperator": "&&",
       "priority": 10 * 100001,
       "tags": [
          "unknown_action"
       ],
       "conditions": [
       ],
       "actions": [
           {
               "id": 1001,
               "action": "wrong",
               "key": "wrong",
               "value": "true"
           },
       ]
    },

];

module.exports = rules;