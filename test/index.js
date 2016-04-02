"use strict";


var should = require("should");

var ykw = require('../');

var reData     = require('./ruleDataSet');

var fake      = require('./fakerTest');

var re = new ykw();

function test() {
    faker();
}


function faker() {

    var randomTests = new fake();
    var testInfo = randomTests.init();
    var rules = testInfo.rules;
    var messages = testInfo.messages;
    var results = testInfo.resultMap;

    //console.log(JSON.stringify(testInfo));
    var start, finish;

    console.log("Generated " + rules.length + " test cases...");

    console.log("Generated " + messages.length + " random inputs to test rules on...");

    console.log("Initiating Random Test Cases...");

    start = Date.now();

    console.log ("Loading test rules...");

    re.loadRules(rules);

    messages.forEach(function(message, index) {
        describe("Test Suite " + String(index+1), function(){
            it("Should pass for eligible criteria...", function (done){
                console.log(JSON.stringify(message));
                re.applyRules(function(reMeta){
                    
                    ["have_property", "not_have_property"].forEach(function(property) {
                        if(results[message.id][property]) {
                            var props = results[message.id][property];
                            props.forEach(function(checks){
                                if(property == "have_property") {
                                    should(message).have.property(checks.key, checks.value);
                                } else {
                                    should(message).not.have.property(checks.key, checks.value);
                                }
                            })
                        }
                    });
                    

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
                    //should.deepEqual(reMeta.rules, results[message.id].metaRules);
                    if(index == (messages.length-1)) {
                        finish = Date.now();
                        console.log("\nTotal time taken to run this testsuite: " + String((finish-start)/1000) + " seconds");
                    }
                    done();
                }, message);        

            });
        });
    });

}

function manual() {
    
    console.log("Initiating Manual Test Cases...");

    describe("Load Rules Test Suite" , function () {
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

        });

    });

    console.log("Manual Test Cases completed!!!");

    return;
}


test();

