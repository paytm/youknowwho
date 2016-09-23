"use strict";

var
    _           = require('lodash'),
    should      = require("should"),
    ykw         = require('../'),
    util        = require('util'),
    reData      = require('./ruleSet'),
    C           = require('lodash/_castPath'),
    K           = require('lodash/_toKey'),
    re          = new ykw();

var Benchmark = require('benchmark');

re.loadRules(reData);



/* Banchmark Sets
    Each Benchmark set is defined to run on 2 cases: With rule engine and natively on NodeJs
*/

// Benchmark Set 1
function suite1() {
    var suite = new Benchmark.Suite('Benchmark Set 1 : with 1 Rule : natural number');

    var msg_case1 = { "a" : {"integer": 1}};
    var msg_case2 = _.cloneDeep(msg_case1);

    console.log("Start Benchmark Set 1 : with 1 Rule : natural number")
    
    // Test via rule engine
    suite.add('ruleengine', function() {

        var meta = re.applyRules(
            msg_case1,
            'natural'
        );
    })

    // Native test
    .add('native', function() {
        // conditions

        if (
            msg_case2.a.integer > 0 &&
            msg_case2.a.integer >= 1 &&
            msg_case2.a.integer < 100000 &&
            msg_case2.a.integer <= 100000 &&
            msg_case2.a.integer == 1 &&
            msg_case2.a.integer != -10
        ) {
            // actions
            msg_case2.b = {}
            msg_case2.b.is_natural = 1;
        }


    })

    // add listeners 
    .on('cycle', function(event) {
      console.log(String(event.target));
    })

    .on('complete', function() {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
      console.log("Rule engine result ", msg_case1);
      console.log("Native result ", msg_case2);

    })
    .run();
}


// Benchmark Set 1
function suite2() {
    var suite = new Benchmark.Suite('Benchmark Set 2 : with 2 Rules : natural number');

    var msg_case1 = { "integer": 1};
    var msg_case2 = _.cloneDeep(msg_case1);

    console.log("\n\nStart Benchmark Set 2 : with 2 Rules : natural number")
    
    // Test via rule engine
    suite.add('ruleengine', function() {

        var meta = re.applyRules(
            msg_case1,
            'b2'
        );
    })

    // Native test
    .add('native', function() {
        // conditions

        if (
            msg_case2.integer > 0 &&
            msg_case2.integer >= 1 &&
            msg_case2.integer < 100000 &&
            msg_case2.integer <= 100000 &&
            msg_case2.integer == 1 &&
            msg_case2.integer != -10
        ) {
            // actions
            msg_case2.is_b2_1 = 1;
            msg_case2.is_b2_2 = 1;
        }

    })

    // add listeners 
    .on('cycle', function(event) {
      console.log(String(event.target));
    })

    .on('complete', function() {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
      console.log("Rule engine result ", msg_case1);
      console.log("Native result ", msg_case2);
  })
    .run();
}


   //  var m = { 'a' : { 'b' : { 'c' : 2 } } };

   //  var n = {
   //      'a' : {
   //          'b' : 2
   //      }
   //  };


   //  var x = {
   //      'a' : 2
   //  };

   //  // lets always cast path
   //  var castedPath = C('a.b.c');

   // function get(object, path, defaultValue) {
   //    var result = object == null ? undefined : baseGet(object, castedPath);
   //    return result === undefined ? defaultValue : result;
   //  }

   //  function baseGet(object, path) {
   //    var index = 0,
   //        length = path.length;

   //    while (object != null && index < length) {
   //      object = object[K(path[index++])];
   //    }
   //    return (index && index == length) ? object : undefined;
   //  }

   //  var suite = new Benchmark.Suite();

   //  // Test via rule engine
   //  suite.add('lodash get', function() {
   //      _.get(x, 'a', null);
   //  })
   //  .add('native', function() {
   //     x.a;
   //  })
   //  .add('lodash ++', function() {

   //      get(m, 'a', null);
   //  })

      

   //  // add listeners 
   //  .on('cycle', function(event) {
   //    console.log(String(event.target));
   //  })
   //  .on('complete', function() {
   //    console.log('Fastest is ' + this.filter('fastest').map('name'));
   //  })
   //  .run();


// run benchmarks synchronously
suite1();
// suite2()