/*
    Main Rule Engine Object
*/

/*jshint multistr: true ,node: true*/
"use strict";

var
    /* NODE internal */
    UTIL                = require('util'),
    PATH                = require('path'),

    /* removing event emitter issue #14 */
    // EVENTEMITTER        = require('events').EventEmitter,


    /* NPM Third Party */
    _                   = require('lodash');


    /* Global Variables */




/* removing event emitter issue #14 */
// UTIL.inherits(YKW, EVENTEMITTER);

function YKW(opts) {

    var self = this;

    self.opts  = opts;

    self._meta = {

        "ts" : {
            "rules_loaded" : null,
            "start"        : null,
            "end"          : null
        },

        "ruleEngineHash" : "",

        "rules" : {
        }

    };

    /* If debug is true , we  DO NOT EMIT ... */

    // This fact can be changed if the user explicity
    // calls the enableDebug function ...

    // Need to disable this later.
    self.debug = _.get(opts, 'debug', false);

    /* removing event emitter issue #14 */
    // if(self.debug === true) self.emitLogs = self.__emitLogs;
    // else self.emitLogs = self.__dummyEmitLogs;

    /* removing event emitter issue #14 */
    // EVENTEMITTER.call(self);
}

/* removing event emitter issue #14 */

/*
    Emit Logs Functions.
    If Debug is true , we assign the emitLogs function to __emitLogs otherwise to __dummyEmitLogs.
    Just saving an if condition :D
*/


// YKW.prototype.__dummyEmitLogs = function(type, step, argsArray) {};

/*
    Type supposedly like logs.verbose
    Step : to track steps and which steps to listen to
    argsArray : Whatever needs to passed in event emitter as info
*/

// YKW.prototype.__emitLogs = function(type, step, argsArray) {

//     argsArray.unshift(step);
//     argsArray.unshift(type);

//     this.emit.apply(this, argsArray);
// };
/* Emit Log Functions */


/* removing event emitter issue #14 */

/*

 The following functions are enabled so that
 people can enable and disable debug logs at run time ...

 Useful if you want to give back a
 response as to what happens in the rule engine .

*/

// YKW.prototype.enableDebug = function () {
//     var self = this;
//     self.emitLogs = self.__emitLogs;
// };

// YKW.prototype.disableDebug = function () {
//     var self = this;
//     self.emitLogs = self.__dummyEmitLogs;
// };



module.exports = YKW;



/*
    ***************** TESTING ********************

    To test we use webserver. Just run it with -l flag
    and use it for /search url to test
*/


(function() {
    if (require.main === module) {
      var ykw = new YKW();
      ykw.loadRules();
    }
}());
