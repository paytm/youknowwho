"use strict";

/*

    Test cases
    1. To test coverage of all conditions , Flow , rules priority and early exit optimizations
    2. To becnahmark by creating dynamic rules , conditions and data
*/

var
    _           = require('lodash'),
    should      = require("should"),
    ykw         = require('../'),
    assert      = require('assert'),
    reData      = require('./ruleDataSet'),
    M           = require('moment'),
    re          = new ykw();


function check_basic_meta(meta) {
    should(meta).have.property('startTime').which.is.a.String().and.have.lengthOf(13);
    should(meta).have.property('endTime').which.is.a.String().and.have.lengthOf(13);
    should(meta).have.property('execTime').which.is.a.Number();
}

function check_basic_load_meta(meta) {
    should(meta.rules_load).have.property('load_start').which.is.a.String().and.have.lengthOf(13);
    should(meta.rules_load).have.property('load_end').which.is.a.String().and.have.lengthOf(13);
    should(meta.rules_load).have.property('load_exec_time').which.is.a.Number();
}

function check_rule_count_and_hash(meta, n) {
    should(meta).have.property('rules');
    _.keys(meta.rules).length.should.equal(n);

    // if(n === 0 ) meta.rules_load.hash.should.equal("d751713988987e9331980363e24189ce");
    // else if(n===2) meta.rules_load.hash.should.equal("7bc680b2e7df72490d3838a3c3d10909");
}

describe("Rule Engine Test Suite for empty rules" , function () {

    it("Apply without loading rules", function (done) {
        var message = {
            "integer" : 1
        };
        var meta = re.applyRules(message, null, true);

        // check basics in meta object
        check_basic_meta(meta);

        done();

    });

    it("load empty rules" , function (done) {
        var hash = re.loadRules([]);

        // check hash
        hash.should.equal("d751713988987e9331980363e24189ce");
        done();
    });

    it("apply after loading empty rules", function (done) {
        var message = {
            "integer" : 1
        };
        var meta = re.applyRules(message, null, true);

        // check basics in meta object
        check_basic_meta(meta);
        check_rule_count_and_hash(meta, 0);

        done();

    });

    it("Test getLoadedMeta uniqueConditionKeys uniqueActionKeys", function (done) {
        var message = {
            "integer" : 1
        };
        re.loadRules(reData);

        // check unique condition values
        var masterMeta = re.getLoadedMeta();

        assert(JSON.stringify(masterMeta.rules_load.uniqueConditionKeys),
            '["integer","datetime","time","string","datetime_wrong","time_wrong"]',
            "Unique condition keys"
        );

        assert(JSON.stringify(masterMeta.rules_load.uniqueActionKeys),
            '["eval_val","is_natural","","is_weird","template_eval_val","integer","set_variable_eval","wrong_cond","true","false","null","wrong"]',
            'Uniq Action Keys'
        );

        done();
    });


});

describe("Basic Operator Test Suite with rules", function () {

    before(function() {
        re.loadRules(reData);
    });

    describe("  --> ", function () {

        // Write generic test cases here
        [
            // Cases
            {
                'testCaseName'  : '#1 Should should pass a natural number check for a positive integer',

                'tag_to_exec'   : 'natural',
                'rules_executed' : 2,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },

                'meta'    : {"1":{"ruleid":1,"exec_order":1,"condOperator":"&&","conditions":{"100":{"cid":100,"lval":1,"op":">","rval":"0","d":true},"101":{"cid":101,"lval":1,"op":">=","rval":"1","d":true},"102":{"cid":102,"lval":1,"op":"<","rval":"100000","d":true},"103":{"cid":103,"lval":1,"op":"<=","rval":"100000","d":true},"104":{"cid":104,"lval":1,"op":"range","rval":[[-4294967295,-1],[1,4294967295]],"d":true},"105":{"cid":105,"lval":1,"op":"!range","rval":[[-100,0]],"d":true},"106":{"cid":106,"lval":"2015-01-01 00:00:00","op":"datetimerange","rval":["2013-12-31T18:30:00.000Z","2015-12-31T18:30:00.000Z"],"d":true},"107":{"cid":107,"lval":"2015-01-01 00:00:00","op":"!datetimerange","rval":["2009-12-31T18:30:00.000Z","2010-12-31T18:30:00.000Z"],"d":true},"108":{"cid":108,"lval":"13:24:30","op":"timerange","rval":[ M().format('YYYY-MM-DD') + "T07:30:00.000Z", M().format('YYYY-MM-DD') + "T08:30:00.000Z"],"d":true},"109":{"cid":109,"lval":"13:24:30","op":"!timerange","rval":[M().format('YYYY-MM-DD') + "T04:30:00.000Z",M().format('YYYY-MM-DD') + "T05:30:00.000Z"],"d":true},"110":{"cid":110,"lval":"abcdef","op":"regex","rval":{},"d":true},"111":{"cid":111,"lval":"abcdef","op":"!regex","rval":{},"d":true},"112":{"cid":112,"lval":1,"op":"=","rval":"1","d":true},"113":{"cid":113,"lval":1,"op":"!=","rval":"-10","d":true}},"applied":true,"actions":{"101":{"aid":101,"action":"SET_VARIABLE","key":"is_natural","val":1},"102":{"aid":102,"action":"RE_EXIT"}}},"2":{"ruleid":2,"exec_order":0,"condOperator":"||","conditions":{"201":{"cid":201,"lval":1,"op":">","rval":"0","d":true}},"applied":true,"actions":{"202":{"aid":202,"action":"DANGEROUS_EVAL","key":"eval_val","val":"2+3"}}}},

                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'is_natural': 1, 'eval_val' : 5 },
            },
            {
                'testCaseName'  : '#2 Should not pass a natural number check for 0',
                'rules_executed' : 10,

                'message'       : {
                                    "integer" : 0,
                                    "datetime_wrong" : "asdf 23:42:#35:wrong_date",
                                    "time_wrong"     : "asdf 23:42:#35:wrong_date"
                                },

                'meta'    : {"1":{"ruleid":1,"exec_order":1,"condOperator":"&&","conditions":{"100":{"cid":100,"lval":0,"op":">","rval":"0","d":false},"101":{"cid":101,"lval":0,"op":">=","rval":"1","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"condOperator":"||","conditions":{"201":{"cid":201,"lval":0,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"3":{"ruleid":3,"exec_order":2,"condOperator":"||","conditions":{"301":{"cid":301,"lval":0,"op":"<","rval":"0","d":false},"302":{"cid":302,"lval":0,"op":"<=","rval":"0","d":true}},"applied":true,"actions":{"301":{"aid":301,"action":"SET_VARIABLE","key":"is_weird","val":1}}},"4":{"ruleid":4,"exec_order":3,"conditions":{"401":{"cid":401,"lval":0,"op":"=","rval":"0","d":true},"402":{"cid":402,"lval":0,"op":">","rval":"0","d":false},"403":{"cid":403,"lval":0,"op":"<","rval":"0","d":false}},"applied":false,"actions":{},"compiledCondExpr":"true && ( false || false )"},"5":{"ruleid":5,"exec_order":4,"condOperator":"&&","conditions":{},"applied":null,"actions":{"501":{"aid":501,"action":"DANGEROUS_EVAL","key":"template_eval_val","val":"0 + 1"}}},"6":{"ruleid":6,"exec_order":5,"condOperator":"&&","conditions":{},"applied":null,"actions":{"601":{"aid":601,"action":"SET_VARIABLE","key":"set_variable_eval","val":"0"}}},"7":{"ruleid":7,"exec_order":6,"condOperator":"&&","conditions":{"701":{"cid":701,"lval":0,"op":"wrong","rval":"0","d":null}},"applied":null,"actions":{"701":{"aid":701,"action":"SET_VARIABLE","key":"wrong_cond","val":1}}},"8":{"ruleid":8,"exec_order":7,"condOperator":"&&","conditions":{},"applied":null,"actions":{"801":{"aid":801,"action":"SET_VARIABLE","key":"true","val":true},"802":{"aid":802,"action":"SET_VARIABLE","key":"false","val":false},"803":{"aid":803,"action":"SET_VARIABLE","key":"null","val":null}}},"9":{"ruleid":9,"exec_order":8,"condOperator":"&&","conditions":{"901":{"cid":901,"lval":null,"op":"datetimerange","rval":[null,null],"d":null},"902":{"cid":902,"lval":null,"op":"timerange","rval":[null,null],"d":null},"903":{"cid":903,"lval":"asdf 23:42:#35:wrong_date","op":"datetimerange","rval":[null,null],"d":null},"904":{"cid":904,"lval":"asdf 23:42:#35:wrong_date","op":"timerange","rval":[null,null],"d":null},"905":{"cid":905,"lval":0,"op":"range","rval":null,"d":null},"906":{"cid":906,"lval":0,"op":"range","rval":[],"d":false},"907":{"cid":907,"lval":0,"op":"range","rval":[[6,7]],"d":false},"908":{"cid":908,"lval":0,"op":"range","rval":[[4,8]],"d":false}},"applied":null,"actions":{"901":{"aid":901,"action":"SET_VARIABLE","key":"wrong","val":true}}},"10":{"ruleid":10,"exec_order":9,"condOperator":"&&","conditions":{},"applied":null,"actions":{"1001":{"aid":1001,"action":"wrong"}}}},

                'output'        : {
                    "integer": 0,
                    "is_weird": 1,
                    "template_eval_val": 1,
                    "set_variable_eval": "0",
                    'wrong_cond' : 1,
                    'true': true,
                    'false': false,
                    'null': null,
                    'wrong' : true,

                    "datetime_wrong" : "asdf 23:42:#35:wrong_date",
                    "time_wrong"     : "asdf 23:42:#35:wrong_date"
                },

            },
            {
                'testCaseName'  : '#3 Should not pass a natural number check for negative numbers',
                'rules_executed' : 10,

                'message'       : {
                                    "integer" : -1,
                                    "datetime_wrong" : "asdf 23:42:#35:wrong_date",
                                    "time_wrong"     : "asdf 23:42:#35:wrong_date"
                                },
                'meta'    : {"1":{"ruleid":1,"exec_order":1,"condOperator":"&&","conditions":{"100":{"cid":100,"lval":-1,"op":">","rval":"0","d":false},"101":{"cid":101,"lval":-1,"op":">=","rval":"1","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"condOperator":"||","conditions":{"201":{"cid":201,"lval":-1,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"3":{"ruleid":3,"exec_order":2,"condOperator":"||","conditions":{"301":{"cid":301,"lval":-1,"op":"<","rval":"0","d":true},"302":{"cid":302,"lval":-1,"op":"<=","rval":"0","d":true}},"applied":true,"actions":{"301":{"aid":301,"action":"SET_VARIABLE","key":"is_weird","val":1}}},"4":{"ruleid":4,"exec_order":3,"conditions":{"401":{"cid":401,"lval":-1,"op":"=","rval":"-1","d":true},"402":{"cid":402,"lval":-1,"op":">","rval":"0","d":false},"403":{"cid":403,"lval":-1,"op":"<","rval":"0","d":true}},"applied":true,"actions":{"401":{"aid":401,"action":"DANGEROUS_EVAL","key":"eval_val","val":"1*2"}},"compiledCondExpr":"true && ( false || true )"},"5":{"ruleid":5,"exec_order":4,"condOperator":"&&","conditions":{},"applied":null,"actions":{"501":{"aid":501,"action":"DANGEROUS_EVAL","key":"template_eval_val","val":"-1 + 1"}}},"6":{"ruleid":6,"exec_order":5,"condOperator":"&&","conditions":{},"applied":null,"actions":{"601":{"aid":601,"action":"SET_VARIABLE","key":"set_variable_eval","val":"-1"}}},"7":{"ruleid":7,"exec_order":6,"condOperator":"&&","conditions":{"701":{"cid":701,"lval":-1,"op":"wrong","rval":"0","d":null}},"applied":null,"actions":{"701":{"aid":701,"action":"SET_VARIABLE","key":"wrong_cond","val":1}}},"8":{"ruleid":8,"exec_order":7,"condOperator":"&&","conditions":{},"applied":null,"actions":{"801":{"aid":801,"action":"SET_VARIABLE","key":"true","val":true},"802":{"aid":802,"action":"SET_VARIABLE","key":"false","val":false},"803":{"aid":803,"action":"SET_VARIABLE","key":"null","val":null}}},"9":{"ruleid":9,"exec_order":8,"condOperator":"&&","conditions":{"901":{"cid":901,"lval":null,"op":"datetimerange","rval":[null,null],"d":null},"902":{"cid":902,"lval":null,"op":"timerange","rval":[null,null],"d":null},"903":{"cid":903,"lval":"asdf 23:42:#35:wrong_date","op":"datetimerange","rval":[null,null],"d":null},"904":{"cid":904,"lval":"asdf 23:42:#35:wrong_date","op":"timerange","rval":[null,null],"d":null},"905":{"cid":905,"lval":-1,"op":"range","rval":null,"d":null},"906":{"cid":906,"lval":-1,"op":"range","rval":[],"d":false},"907":{"cid":907,"lval":-1,"op":"range","rval":[[6,7]],"d":false},"908":{"cid":908,"lval":-1,"op":"range","rval":[[4,8]],"d":false}},"applied":null,"actions":{"901":{"aid":901,"action":"SET_VARIABLE","key":"wrong","val":true}}},"10":{"ruleid":10,"exec_order":9,"condOperator":"&&","conditions":{},"applied":null,"actions":{"1001":{"aid":1001,"action":"wrong"}}}},

                'output'        : {
                    "integer": -1,
                    "is_weird": 1,
                    "eval_val": 2,
                    "template_eval_val": 0,
                    "set_variable_eval": "-1",
                    'wrong_cond' : 1,
                    'true': true,
                    'false': false,
                    'null': null,

                    'wrong' : true,

                    "datetime_wrong" : "asdf 23:42:#35:wrong_date",
                    "time_wrong"     : "asdf 23:42:#35:wrong_date"
                },
            },

            {
                'testCaseName'  : '#4 Checking all ANTI conditions in OR rule',
                'tag_to_exec'   : 'or_rule',
                'rules_executed': 1,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },
                'meta'    : {"3":{"ruleid":3,"exec_order":0,"condOperator":"||","conditions":{"301":{"cid":301,"lval":1,"op":"<","rval":"0","d":false},"302":{"cid":302,"lval":1,"op":"<=","rval":"0","d":false},"303":{"cid":303,"lval":1,"op":">","rval":"2","d":false},"304":{"cid":304,"lval":1,"op":">=","rval":"2","d":false},"305":{"cid":305,"lval":1,"op":"range","rval":[[2,4294967295]],"d":false},"306":{"cid":306,"lval":1,"op":"!range","rval":[[-100,2]],"d":false},"307":{"cid":307,"lval":"2015-01-01 00:00:00","op":"datetimerange","rval":["2012-12-31T18:30:00.000Z","2013-12-31T18:30:00.000Z"],"d":false},"308":{"cid":308,"lval":"2015-01-01 00:00:00","op":"!datetimerange","rval":["2012-12-31T18:30:00.000Z","2015-12-31T18:30:00.000Z"],"d":false},"309":{"cid":309,"lval":"13:24:30","op":"timerange","rval":[ M().format('YYYY-MM-DD') + "T07:30:00.000Z",M().format('YYYY-MM-DD') + "T07:35:00.000Z"],"d":false},"310":{"cid":310,"lval":"13:24:30","op":"!timerange","rval":[M().format('YYYY-MM-DD') + "T04:30:00.000Z",M().format('YYYY-MM-DD') + "T09:30:00.000Z"],"d":false},"311":{"cid":311,"lval":"abcdef","op":"regex","rval":{},"d":false},"312":{"cid":312,"lval":"abcdef","op":"!regex","rval":{},"d":false},"313":{"cid":313,"lval":"abcdef","op":"!stringrange","rval":["abcdef","xyz","pqr"],"d":false},"314":{"cid":314,"lval":"abcdef","op":"stringrange","rval":["xyz","pqr"],"d":false},"315":{"cid":315,"lval":1,"op":"set","rval":"2,3","d":false},"316":{"cid":316,"lval":1,"op":"!set","rval":"1,2,3,4,5,6","d":false},"317":{"cid":317,"lval":1,"op":"!=","rval":"1","d":false},"318":{"cid":318,"lval":1,"op":"=","rval":"-10","d":false},"319":{"cid":319,"lval":"2015-01-01 00:00:00","op":"datetimerange","rval":["2015-12-31T18:30:00.000Z","2016-12-31T18:30:00.000Z"],"d":false},"320":{"cid":320,"lval":"13:24:30","op":"timerange","rval":[M().format('YYYY-MM-DD') + "T08:30:00.000Z",M().format('YYYY-MM-DD') + "T08:35:00.000Z"],"d":false},"321":{"cid":321,"lval":1,"op":"=","rval":"1","d":true}},"applied":true,"actions":{"301":{"aid":301,"action":"SET_VARIABLE","key":"is_weird","val":1}}}},

                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'is_weird' : 1 },
            },

            {
                'testCaseName'  : '#5 Checking template condition and complex conditions',
                'tag_to_exec'   : 'template_condition',
                'rules_executed': 1,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },
                'meta'    : {"4":{"ruleid":4,"exec_order":0,"conditions":{"401":{"cid":401,"lval":1,"op":"=","rval":"1","d":true},"402":{"cid":402,"lval":1,"op":">","rval":"0","d":true},"403":{"cid":403,"lval":1,"op":"<","rval":"0","d":false}},"applied":true,"actions":{"401":{"aid":401,"action":"DANGEROUS_EVAL","key":"eval_val","val":"1*2"}},"compiledCondExpr":"true && ( true || false )"}},

                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'eval_val' : 2 },
            },

            {
                'testCaseName'  : '#6 Template Eval',
                'tag_to_exec'   : 'template_eval',
                'rules_executed': 1,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },
                'meta'    : {"5":{"ruleid":5,"exec_order":0,"condOperator":"&&","conditions":{},"applied":null,"actions":{"501":{"aid":501,"action":"DANGEROUS_EVAL","key":"template_eval_val","val":"1 + 1"}}}},

                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'template_eval_val' : 2 },
            },

            {
                'testCaseName'  : '#7 Set variable Eval',
                'tag_to_exec'   : 'template_action_eval',
                'rules_executed': 1,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },
                'meta'    : {"6":{"ruleid":6,"exec_order":0,"condOperator":"&&","conditions":{},"applied":null,"actions":{"601":{"aid":601,"action":"SET_VARIABLE","key":"set_variable_eval","val":"1"}}}},

                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'set_variable_eval' : '1' },
            },

            {
                'testCaseName'  : '#8 wrong condition test case',
                'tag_to_exec'   : 'wrong_cond',
                'rules_executed': 1,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },
                'meta'    : {"7":{"ruleid":7,"exec_order":0,"condOperator":"&&","conditions":{"701":{"cid":701,"lval":1,"op":"wrong","rval":"0","d":null}},"applied":null,"actions":{"701":{"aid":701,"action":"SET_VARIABLE","key":"wrong_cond","val":1}}}},

                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'wrong_cond' : 1 },
            },

            {
                'testCaseName'  : '#9 Wrong datetime format',
                'tag_to_exec'   : 'wrong_datetime',
                'rules_executed': 1,

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00",
                                    "datetime_wrong" : "asdf",
                                    "time_wrong"    : "asdf",

                                },
                'meta'    : {"9":{"ruleid":9,"exec_order":0,"condOperator":"&&","conditions":{"901":{"cid":901,"lval":"2015-01-01 00:00:00","op":"datetimerange","rval":[null,null],"d":null},"902":{"cid":902,"lval":"13:24:30","op":"timerange","rval":[null,null],"d":null},"903":{"cid":903,"lval":"asdf","op":"datetimerange","rval":[null,null],"d":null},"904":{"cid":904,"lval":"asdf","op":"timerange","rval":[null,null],"d":null},"905":{"cid":905,"lval":1,"op":"range","rval":null,"d":null},"906":{"cid":906,"lval":1,"op":"range","rval":[],"d":false},"907":{"cid":907,"lval":1,"op":"range","rval":[[6,7]],"d":false},"908":{"cid":908,"lval":1,"op":"range","rval":[[4,8]],"d":false}},"applied":null,"actions":{"901":{"aid":901,"action":"SET_VARIABLE","key":"wrong","val":true}}}},

                'output'        : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00",
                                    "datetime_wrong" : "asdf",
                                    "time_wrong"    : "asdf",

                                    "wrong" : true,
                                },
            },
            {
                'testCaseName' : '#10 Should not pass a nature number check for numbers defined as null',
                'rules_executed' : 10,
                'message' : {
                    'integer' : null,
                    'datetime_wrong' : null,
                    'time_wrong' : null
                },

                'output' : {
                    "integer": null,
                    "is_weird": 1,
                    "template_eval_val": 1,
                    "set_variable_eval": "",
                    'wrong_cond' : 1,
                    'true': true,
                    'false': false,
                    'null': null,
                    'wrong' : true,
                    "datetime_wrong" : null,
                    "time_wrong"     : null
                },
                'meta'    : {"1":{"ruleid":1,"exec_order":1,"condOperator":"&&","conditions":{"100":{"cid":100,"lval":null,"op":">","rval":"0","d":false},"101":{"cid":101,"lval":null,"op":">=","rval":"1","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"condOperator":"||","conditions":{"201":{"cid":201,"lval":null,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"3":{"ruleid":3,"exec_order":2,"condOperator":"||","conditions":{"301":{"cid":301,"lval":null,"op":"<","rval":"0","d":false},"302":{"cid":302,"lval":null,"op":"<=","rval":"0","d":false},"303":{"cid":303,"lval":null,"op":">","rval":"2","d":false},"304":{"cid":304,"lval":null,"op":">=","rval":"2","d":false},"305":{"cid":305,"lval":null,"op":"range","rval":[[2,4294967295]],"d":false},"306":{"cid":306,"lval":null,"op":"!range","rval":[[-100,2]],"d":true}},"applied":true,"actions":{"301":{"aid":301,"action":"SET_VARIABLE","key":"is_weird","val":1}}},"4":{"ruleid":4,"exec_order":3,"conditions":{"401":{"cid":401,"lval":null,"op":"=","rval":"","d":false},"402":{"cid":402,"lval":null,"op":">","rval":"0","d":false},"403":{"cid":403,"lval":null,"op":"<","rval":"0","d":false}},"applied":false,"actions":{},"compiledCondExpr":"false && ( false || false )"},"5":{"ruleid":5,"exec_order":4,"condOperator":"&&","conditions":{},"applied":null,"actions":{"501":{"aid":501,"action":"DANGEROUS_EVAL","key":"template_eval_val","val":" + 1"}}},"6":{"ruleid":6,"exec_order":5,"condOperator":"&&","conditions":{},"applied":null,"actions":{"601":{"aid":601,"action":"SET_VARIABLE","key":"set_variable_eval","val":""}}},"7":{"ruleid":7,"exec_order":6,"condOperator":"&&","conditions":{"701":{"cid":701,"lval":null,"op":"wrong","rval":"0","d":null}},"applied":null,"actions":{"701":{"aid":701,"action":"SET_VARIABLE","key":"wrong_cond","val":1}}},"8":{"ruleid":8,"exec_order":7,"condOperator":"&&","conditions":{},"applied":null,"actions":{"801":{"aid":801,"action":"SET_VARIABLE","key":"true","val":true},"802":{"aid":802,"action":"SET_VARIABLE","key":"false","val":false},"803":{"aid":803,"action":"SET_VARIABLE","key":"null","val":null}}},"9":{"ruleid":9,"exec_order":8,"condOperator":"&&","conditions":{"901":{"cid":901,"lval":null,"op":"datetimerange","rval":[null,null],"d":null},"902":{"cid":902,"lval":null,"op":"timerange","rval":[null,null],"d":null},"903":{"cid":903,"lval":null,"op":"datetimerange","rval":[null,null],"d":null},"904":{"cid":904,"lval":null,"op":"timerange","rval":[null,null],"d":null},"905":{"cid":905,"lval":null,"op":"range","rval":null,"d":null},"906":{"cid":906,"lval":null,"op":"range","rval":[],"d":false},"907":{"cid":907,"lval":null,"op":"range","rval":[[6,7]],"d":false},"908":{"cid":908,"lval":null,"op":"range","rval":[[4,8]],"d":false}},"applied":null,"actions":{"901":{"aid":901,"action":"SET_VARIABLE","key":"wrong","val":true}}},"10":{"ruleid":10,"exec_order":9,"condOperator":"&&","conditions":{},"applied":null,"actions":{"1001":{"aid":1001,"action":"wrong"}}}},
            },

            {
                'testCaseName' : '#11 Should not ',
                'tag_to_exec'   : 'unknown_action',
                'rules_executed' : 1,
                'message' : {
                    'integer' : null,
                    'datetime_wrong' : null,
                    'time_wrong' : null
                },
                'output' : {
                    'integer' : null,
                    'datetime_wrong' : null,
                    'time_wrong' : null
                },
                'meta'    : {"10":{"ruleid":10,"exec_order":0,"condOperator":"&&","conditions":{},"applied":null,"actions":{"1001":{"aid":1001,"action":"wrong"}}}},
            }


        ].forEach(function(eachTest){

            it(eachTest.testCaseName, function(done) {

                var meta = null;
                if(eachTest.tag_to_exec) meta = re.applyRules(eachTest.message, eachTest.tag_to_exec, true);
                else meta = re.applyRules(eachTest.message, null, true);

                // Output check ...
                // console.log("meta.rules", JSON.stringify(meta.rules, null, 4));
                // console.log("eachTest.message", eachTest.message);

                if(eachTest.output) {
                    if(!_.isEqual(eachTest.output ,eachTest.message))
                        console.log("Test going to Fail : output expected, output got", eachTest.output ,eachTest.message);
                    _.isEqual(eachTest.output ,eachTest.message).should.equal(true);
                }

                // Meta check
                check_basic_meta(meta);
                check_basic_load_meta(meta);

                if(eachTest.rules_executed)
                    check_rule_count_and_hash(meta, eachTest.rules_executed);

                // Checking rules which were applied
                if(eachTest.meta) {
                    var o = _.isEqual(JSON.stringify(meta.rules), JSON.stringify(eachTest.meta));
                    if(o === false) {
                        console.log("Msg meta -",eachTest.testCaseName, ' ##', JSON.stringify(meta.rules));
                        console.log("eachTest.meta ",eachTest.testCaseName, ' ##', JSON.stringify(eachTest.meta));
                    }
                    assert(o, "Meta check failed");
                }

                done();

            });

        });

    });

});
