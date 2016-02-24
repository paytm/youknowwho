"use strict";


var should = require("should");

var ykw = require('../');

var reData     = require('./ruleDataSet');

var re = new ykw();

describe("Basic Operator Test Suite", function () {

    before(function() {
        re.loadRules(reData);
    });

    describe("Natural Number Test", function () {

        it("Should should pass a natural number check for a positive integer" , function () {

            var message = {
                "integer" : 1
            };

            // Tags to ensure independent spaces for test cases
            var reMeta = re.applyRules(message,'natural');

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

        });

        it("Should not pass a natural number check for 0" , function () {

            var message = {
                "integer" : 0
            };


            // Tags to ensure independent spaces for test cases
            var reMeta = re.applyRules(message,'natural');

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
        });


        it("Should not pass a natural number check for negative numbers" , function () {

            var message = {
                "integer" : -1
            };


            // Tags to ensure independent spaces for test cases
            var reMeta = re.applyRules(message,'natural');

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

        });

    });

});
