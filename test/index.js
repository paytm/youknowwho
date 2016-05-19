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
        re.applyRules(message);
        done();


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
            re.applyRules(message);

            // Normal Rule check ...
            should(message).have.property('is_natural', 1);

            done();

        });

        it("Should not pass a natural number check for 0" , function (done) {

            var message = {
                "integer" : 0
            };


            // Tags to ensure independent spaces for test cases
            re.applyRules(message);
            // Normal Rule check ...

            should(message).not.have.property('is_natural');

            done();
        });


        it("Should not pass a natural number check for negative numbers" , function (done) {

            var message = {
                "integer" : -1
            };


            // Tags to ensure independent spaces for test cases
            re.applyRules(message);
            // Normal Rule check ...

            should(message).not.have.property('is_natural');

            done();

        });

    });

});