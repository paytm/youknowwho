"use strict";

/*
    Pending tests
    - For Issue #1 , #16
    - For each rule ... Check Exact Meta value .. that will easily check order execution ...
        -- by something like iterative check
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

    if(n === 0 ) meta.rules_load.hash.should.equal("d751713988987e9331980363e24189ce");
    else if(n===2) meta.rules_load.hash.should.equal("feb65a88a9f346494ad5a12de14dc7ec");
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
                                    "integer" : 1
                                },

                'ruleOutput'    : {"1":{"ruleid":1,"exec_order":1,"conditions":{"1":{"cid":1,"lval":1,"op":">","rval":"0","d":true}},"applied":true,"actions":{"2":{"aid":2,"action":"SET_VARIABLE","key":"is_natural","val":1}}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":1,"op":">","rval":"0","d":true}},"applied":true,"actions":{"4":{"aid":4,"action":"EXEC"}}}},


                'output'        : {"integer" : 1, "is_natural" : 1},
            },
            {
                'testCaseName'  : 'Should not pass a natural number check for 0',

                'message'       : {
                                    "integer" : 0
                                },

                'ruleOutput'    : {"1":{"ruleid":1,"exec_order":1,"conditions":{"1":{"cid":1,"lval":0,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":0,"op":">","rval":"0","d":false}},"applied":false,"actions":{}}},

                'output'        : {"integer" : 0},

            },
            {
                'testCaseName'  : 'Should not pass a natural number check for negative numbers',

                'message'       : {
                                    "integer" : -1
                                },
                'ruleOutput'    : {"1":{"ruleid":1,"exec_order":1,"conditions":{"1":{"cid":1,"lval":-1,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":-1,"op":">","rval":"0","d":false}},"applied":false,"actions":{}}},

                'output'        : {"integer" : -1},
            },


        ].forEach(function(eachTest){

            it(eachTest.testCaseName, function(done) {

                // Tags to ensure independent spaces for test cases
                var meta = re.applyRules(eachTest.message);

                // Output check ...
                _.isEqual(eachTest.output ,eachTest.message).should.equal(true);

                // Meta check
                check_basic_meta(meta);
                check_basic_load_meta(meta);
                check_rule_count_and_hash(meta, 2);

                // Checking rules which were applied
                _.isEqual(meta.rules,eachTest.ruleOutput).should.equal(true);

                done();

            });

        });

        // it("Should should pass a natural number check for a positive integer" , function (done) {

        //     var message = {
        //         "integer" : 1
        //     };

        //     // Tags to ensure independent spaces for test cases
        //     var meta = re.applyRules(message);

        //     // Normal Rule check ...
        //     should(message).have.property('is_natural', 1);

        //     // Meta check
        //     check_basic_meta(meta);
        //     check_basic_load_meta(meta);
        //     check_rule_count_and_hash(meta, 2);

        //     // Checking rules which were applied
        //     var ruleOutput = {"1":{"ruleid":1,"exec_order":1,"conditions":{"1":{"cid":1,"lval":1,"op":">","rval":"0","d":true}},"applied":true,"actions":{"2":{"aid":2,"action":"SET_VARIABLE","key":"is_natural","val":1}}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":1,"op":">","rval":"0","d":true}},"applied":true,"actions":{"4":{"aid":4,"action":"EXEC"}}}};

        //     _.isEqual(meta.rules,ruleOutput).should.equal(true);

        //     done();

        // });

        // it("Should not pass a natural number check for 0" , function (done) {

        //     var message = {
        //         "integer" : 0
        //     };


        //     // Tags to ensure independent spaces for test cases
        //     var meta = re.applyRules(message);

        //     // Normal Rule check ...
        //     should(message).not.have.property('is_natural');

        //     // Meta check
        //     check_basic_meta(meta);
        //     check_basic_load_meta(meta);
        //     check_rule_count_and_hash(meta, 2);

        //     // Checking rules which were applied
        //     var ruleOutput = {"1":{"ruleid":1,"exec_order":1,"conditions":{"1":{"cid":1,"lval":0,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":0,"op":">","rval":"0","d":false}},"applied":false,"actions":{}}};

        //     _.isEqual(meta.rules,ruleOutput).should.equal(true);

        //     done();
        // });


        // it("Should not pass a natural number check for negative numbers" , function (done) {

        //     var message = {
        //         "integer" : -1
        //     };


        //     // Tags to ensure independent spaces for test cases
        //     var meta = re.applyRules(message);

        //     // Normal Rule check ...
        //     should(message).not.have.property('is_natural');

        //     // Meta check
        //     check_basic_meta(meta);
        //     check_basic_load_meta(meta);
        //     check_rule_count_and_hash(meta, 2);

        //     // Checking rules which were applied
        //     var ruleOutput = {"1":{"ruleid":1,"exec_order":1,"conditions":{"1":{"cid":1,"lval":-1,"op":">","rval":"0","d":false}},"applied":false,"actions":{}},"2":{"ruleid":2,"exec_order":0,"conditions":{"3":{"cid":3,"lval":-1,"op":">","rval":"0","d":false}},"applied":false,"actions":{}}};

        //     _.isEqual(meta.rules,ruleOutput).should.equal(true);

        //     done();
        // });

    });

});