"use strict";

/* To profile the app 

	node --prof profile
	node --prof-process isolate-<>-v8.log > processedlog
*/

var
    _           = require('lodash'),
    ykw         = require('../'),
    reData      = require('./ruleSet'),
    re          = new ykw();

re.loadRules(reData);


var msg_case1 = { "integer": 1};

console.log("Start Performance : with 1 Rule : natural number")

for (var i = 0; i < 1000000 ; i++) {
    var meta = re.applyRules(
        msg_case1,
        'natural'
    );
}

console.log("Done");
