"use strict";

var ruleEngine = require('../');

var reData     = require('./ruleDataSet');


/*
 Have to add mocha later , figuring out rule engine for now.
*/

var ykw = new ruleEngine();

ykw.loadRules(reData);

var message = {
    integer : 1
};

console.log(JSON.stringify(ykw.applyRules(message)));
console.log("####", message);
