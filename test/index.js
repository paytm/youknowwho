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
    reData      = require('./ruleDataSet'),
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
    // else if(n===2) meta.rules_load.hash.should.equal("bdf2ecede1ffa61fac2930d98fca628d");
}

describe("Rule Engine Test Suite for empty rules" , function () {

    it("Apply without loading rules", function (done) {
        var message = {
            "integer" : 1
        };
        var meta = re.applyRules(message);

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
        var meta = re.applyRules(message);

        // check basics in meta object
        check_basic_meta(meta);
        check_rule_count_and_hash(meta, 0);

        done();

    });

});

describe("Basic Operator Test Suite with rules", function () {

    before(function() {
        re.loadRules(reData);
    });

    describe("Natural Number Test", function () {

        // Write generic test cases here
        [
            // Cases
            {
                'testCaseName'  : 'Should should pass a natural number check for a positive integer',

                'message'       : {
                                    "integer"   : 1,
                                    "string"    : "abcdef",
                                    "time"      : "13:24:30",
                                    "datetime"  : "2015-01-01 00:00:00"
                                },

                'meta'    : {"1":{"ruleid":1,"exec_order":1,"conditions":{"100":{"cid":100,"lval":1,"op":">","rval":"0","d":true},"101":{"cid":101,"lval":1,"op":">=","rval":"1","d":true},"102":{"cid":102,"lval":1,"op":"<","rval":"100000","d":true},"103":{"cid":103,"lval":1,"op":"<=","rval":"100000","d":true},"104":{"cid":104,"lval":1,"op":"range","rval":[[1,4294967295]],"d":true},"105":{"cid":105,"lval":1,"op":"!range","rval":[[-100,0]],"d":true},"106":{"cid":106,"lval":"2015-01-01 00:00:00","op":"datetimerange","rval":["2013-12-31T18:30:00.000Z","2015-12-31T18:30:00.000Z"],"d":true},"107":{"cid":107,"lval":"2015-01-01 00:00:00","op":"!datetimerange","rval":["2009-12-31T18:30:00.000Z","2010-12-31T18:30:00.000Z"],"d":true},"108":{"cid":108,"lval":"13:24:30","op":"timerange","rval":["13:00:00 "," 14:00:00"],"d":true},"109":{"cid":109,"lval":"13:24:30","op":"!timerange","rval":["10:00:00 "," 11:00:00"],"d":true},"110":{"cid":110,"lval":"abcdef","op":"regex","rval":{},"d":true},"111":{"cid":111,"lval":"abcdef","op":"!regex","rval":{},"d":true},"112":{"cid":112,"lval":1,"op":"=","rval":"1","d":true},"113":{"cid":113,"lval":1,"op":"!=","rval":"-10","d":true}},"applied":true,"actions":{"2":{"aid":2,"action":"SET_VARIABLE","key":"is_natural","val":1}}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":1,"op":">","rval":"0","d":true}},"applied":true,"actions":{"4":{"aid":4,"action":"EXEC"}}}},


                'output'        : { 'integer': 1, 'string': 'abcdef', 'time': '13:24:30', 'datetime': '2015-01-01 00:00:00', 'is_natural': 1 },
            },
            {
                'testCaseName'  : 'Should not pass a natural number check for 0',

                'message'       : {
                                    "integer" : 0
                                },

                'meta'    : {"1":{"ruleid":1,"exec_order":1,"conditions":{"100":{"cid":100,"lval":0,"op":">","rval":"0","d":false},"101":{"cid":101,"lval":0,"op":">=","rval":"1","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":0,"op":">","rval":"0","d":false}},"applied":false,"actions":{}}},

                'output'        : {"integer" : 0},

            },
            {
                'testCaseName'  : 'Should not pass a natural number check for negative numbers',

                'message'       : {
                                    "integer" : -1
                                },
                'meta'    : {"1":{"ruleid":1,"exec_order":1,"conditions":{"100":{"cid":100,"lval":-1,"op":">","rval":"0","d":false},"101":{"cid":101,"lval":-1,"op":">=","rval":"1","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":-1,"op":">","rval":"0","d":false}},"applied":false,"actions":{}}},

                'output'        : {"integer" : -1},
            },


        ].forEach(function(eachTest){

            it(eachTest.testCaseName, function(done) {

                // Tags to ensure independent spaces for test cases
                var meta = re.applyRules(eachTest.message);

                // Output check ...
                // console.log("meta.rules", JSON.stringify(meta.rules, null, 4));
                // console.log("eachTest.message", eachTest.message);

                _.isEqual(eachTest.output ,eachTest.message).should.equal(true);

                // Meta check
                check_basic_meta(meta);
                check_basic_load_meta(meta);
                check_rule_count_and_hash(meta, 2);

                // Checking rules which were applied
                // if(eachTest.meta) {
                //     console.log("Msg meta ", JSON.stringify(meta.rules, null, 1));
                //     console.log("eachTest.meta ", JSON.stringify(eachTest.meta, null, 1));

                //     _.isEqual(meta.rules,eachTest.meta).should.equal(true);
                // }

                done();

            });

        });

    });

});