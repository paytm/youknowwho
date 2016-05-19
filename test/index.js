"use strict";


var should = require("should");

var ykw = require('../');

var reData     = require('./ruleDataSet');

var re = new ykw();


describe("Rule Engine Test Suite" , function () {

    it("Should not fail if there are no rules loaded", function (done) {
        var message = {
            "integer" : 1
        };

        re.applyRules(function (reMeta) {
            done();
        }, message);


    });

    it("Should load the rules into the rule engine " , function () {
        re.loadRules(reData);
    });

});

describe("Basic Operator Test Suite", function () {

    before(function() {
        re.loadRules(reData);
    });

    describe("Natural Number Test", function () {

        it("Should should pass a natural number check for a positive integer" , function (done) {

            var message = {
                "integer" : 1
            };

            // Tags to ensure independent spaces for test cases
            re.applyRules(function (reMeta) {

                // Normal Rule check ...
                should(message).have.property('is_natural', 1);

                // Meta Object checks

                should(reMeta).have.property('ts');

                should(reMeta.ts).have.property('rules_loaded');
                should(reMeta.ts.rules_loaded).be.a.Number();

                should(reMeta.ts).have.property('start');
                should(reMeta.ts.start).be.a.Number();

                should(reMeta.ts).have.property('end');
                should(reMeta.ts.end).be.a.Number();


                should(reMeta).have.property('ruleEngineHash');
                should(reMeta.ruleEngineHash).be.a.String();

                should(reMeta).have.property('rules');

                // Would like assertions / deep object comparison now

                should.deepEqual(reMeta.rules,

                                 {
                                     "1": {
                                         "conditions": {
                                             "1": true
                                         },
                                         "total_conditions": 1,
                                         "actions": {},
                                         "total_actions": 1,
                                         "applied": true
                                     }
                                 });
                done();

            }, message,'natural');


        });

        it("Should not pass a natural number check for 0" , function (done) {

            var message = {
                "integer" : 0
            };


            // Tags to ensure independent spaces for test cases
            re.applyRules(function (reMeta) {
                // Normal Rule check ...

                should(message).not.have.property('is_natural');

                // Meta Object checks

                should(reMeta).have.property('ts');

                should(reMeta.ts).have.property('rules_loaded');
                should(reMeta.ts.rules_loaded).be.a.Number();

                should(reMeta.ts).have.property('start');
                should(reMeta.ts.start).be.a.Number();

                should(reMeta.ts).have.property('end');
                should(reMeta.ts.end).be.a.Number();


                should(reMeta).have.property('ruleEngineHash');
                should(reMeta.ruleEngineHash).be.a.String();

                should(reMeta).have.property('rules');

                // Would like assertions / deep object comparison now

                should.deepEqual(reMeta.rules,
                                 {
                                     "1": {
                                         "conditions": {
                                             "1": false
                                         },
                                         "total_conditions": 1,
                                         "actions": {},
                                         "total_actions": 1,
                                         "applied": false
                                     }
                                 });
                done();

            }, message,'natural');
        });


        it("Should not pass a natural number check for negative numbers" , function (done) {

            var message = {
                "integer" : -1
            };


            // Tags to ensure independent spaces for test cases
            re.applyRules(function (reMeta) {
                // Normal Rule check ...

                should(message).not.have.property('is_natural');

                // Meta Object checks

                should(reMeta).have.property('ts');

                should(reMeta.ts).have.property('rules_loaded');
                should(reMeta.ts.rules_loaded).be.a.Number();

                should(reMeta.ts).have.property('start');
                should(reMeta.ts.start).be.a.Number();

                should(reMeta.ts).have.property('end');
                should(reMeta.ts.end).be.a.Number();


                should(reMeta).have.property('ruleEngineHash');
                should(reMeta.ruleEngineHash).be.a.String();

                should(reMeta).have.property('rules');

                // Would like assertions / deep object comparison now

                should.deepEqual(reMeta.rules,
                                 {
                                     "1": {
                                         "conditions": {
                                             "1": false
                                         },
                                         "total_conditions": 1,
                                         "actions": {},
                                         "total_actions": 1,
                                         "applied": false
                                     }
                                 });

                done();

            }, message,'natural');

        });

    });

});