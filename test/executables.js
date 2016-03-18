/*jshint multistr: true ,node: true*/

"use strict";


/*
 List of executable functions to be supplied to the rule engine.
*/

module.exports = {

    "parse_json" : function (callback, string) {

	var result = {};

	try {
            result.value = JSON.parse(string);
	} catch (e) {
            result.error = e;
	}

	return callback(result);
    }
};
