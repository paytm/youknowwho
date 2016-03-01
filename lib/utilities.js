/*jshint multistr: true ,node: true*/
"use strict";

var
    /* NPM Third Party */
    _                   = require('lodash');


module.exports = {
    /*
     returns true ( BOOLEAN ) if string true, false if string false, otherwise string
     */

    toBoolOrNull : function(refVal) {
	if(refVal==="true")         return true;
	else if(refVal==="false")   return false;
	else if(refVal==="null")    return null;
	else return refVal;
    },


    /*
     doc/ruleEngine
     # Variables in Action Values

     - Almost all message properties can be used in Action Values as variables
     - The Syntax for variables is <%= userdata.amount %>
     E.g. This is not done. We have <%= userdata.amount %> with us. Your number is<%= userdata.number %> . OKay

     - Please note it is a direct replacement function and we use LODASH.template for this.
     */

    toCompiledString : function(refVal) {
	if (typeof refVal !== 'string') return refVal;

	// a Simple optimization where we dont need to keep compiled function
	if(refVal.indexOf('<%=') <= -1) return refVal;

	// Lets compile it
	return _.template(refVal);
    }
};
