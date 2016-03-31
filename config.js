/*jshint multistr: true ,node: true*/
"use strict";


var config = {
    ENVIRONMENT: process.env.NODE_ENV || 'development',

    "DEVELOPMENT": {
    },

    "PRODUCTION" : {
    },

    "COMMON": {
        "WEBSERVER": {
            "PORT": 2929
        }
    }

};

var load = function() {
    var env = config.ENVIRONMENT.toUpperCase();
    var loadedConfig = config.COMMON;


    /* copy superficially , and not deep copy */
    Object.keys(config[env]).forEach(function(key) {
        loadedConfig[key] = config[env][key];
    });

    return loadedConfig;
};


module.exports = load();
