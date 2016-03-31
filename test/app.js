"use strict";

var should    = require("should");
var assert    = require("assert");
var supertest = require("supertest");

var ruleSet   = require('./ruleDataSet');

var host = 'http://localhost:2929';

describe("YKW Load rules API", function () {
    var url = '/load';

    it("should load all rules", function (done) {
        supertest(host)
            .post('/load')
            .send({
		"rules" : ruleSet
            })
            .end(function (error, response) {
                should.not.exist(error);
                should(response.statusCode).be.exactly(204);
		done();
            });
    });

    it("should not load rules", function (done) {
        supertest(host)
            .post('/load')
            .send(ruleSet)
            .end(function (error, response) {
                should.not.exist(error);
                should(response.statusCode).be.exactly(400);
		done();
            });
    });
});


describe("YKW APPLY RULE API", function () {
    var url = "/apply";

    var tag = "natural";


    it("Should pass a natural number check" , function (done) {

	var message = {
            "integer" : 1
	};

	supertest(host)
            .post(url)
            .send({
                "message" : message,
                "tag"     : tag
            })
            .end(function (error, response) {
                should.not.exist(error);
		should(response.statusCode).be.exactly(200);

		var reMeta = response.body._meta;
		var message = response.body.message;

		console.log("### REMETA", JSON.stringify(reMeta));
		console.log("### message", message);


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
	    });


    });

});
