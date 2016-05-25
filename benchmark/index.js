"use strict";

var
    _           = require('lodash'),
    should      = require("should"),
    ykw         = require('../'),
    reData      = require('../test/ruleDataSet'),
    re          = new ykw();

var Benchmark = require('benchmark');

re.loadRules(reData);

var suite = new Benchmark.Suite;

// add tests
suite.add('ruleengine', function() {

  var meta = re.applyRules({
        "integer"   : 1,
        "string"    : "abcdef",
        "time"      : "13:24:30",
        "datetime"  : "2015-01-01 00:00:00"
    });
})

// add listeners
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
// run async
.run({ 'async': true });