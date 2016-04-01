/*jshint multistr: true ,node: true*/
"use strict";

var
    HTTP            = require('http'),
    UTIL            = require('util'),
    PATH            = require('path'),

    EXPRESS         = require('express'),
    BODY_PARSER     = require('body-parser'),
    _               = require('lodash'),
    LGR             = require('lgr'),

    /* internal */
    L               = null,
    ERROR           = require('./error.js');


// ***************************************************************************************************************
// ***************************************************************************************************************

function webServer(config, ykw) {

    var self = this;

    // Config
    self.config         = config;

    // Shipper Engine instance
    self.ykw     = ykw;

    // env
    self.env            = process.env.NODE_ENV || 'development';

    // Express app
    self.app            = EXPRESS();

    // Basic app setup
    self.app.disable('etag');
    self.app.disable('x-powered-by');

    self.app.set('port', self.config.WEBSERVER.PORT);

    self.app.use(BODY_PARSER.json());

    // NO STATIC FILES , uncomment when static files are required
    // self.app.use(EXPRESS.static(PATH.join(__dirname, 'public'))); // defines folder for static assets

} // main function


// CORS middleware
webServer.prototype._setCors = function(req, res, next) {
    res.header('Access-Control-Allow-Origin',   '*');
    res.header('Access-Control-Allow-Methods',  '*');
    next();
};


webServer.prototype.setup = function (callback) {
    var self = this;

    L = LGR;

    if (self.config.LOG_LEVEL) L.setLevel(self.config.LOG_LEVEL);

    callback();
};



// Set Routes
webServer.prototype._setRoutes = function() {
    var self = this;
    var simulate = self.config.SIMULATE;

    // set cors
    self.app.use(self._setCors);

    self.app.all('/_status', function (req, res, next) {
        return res.send(200);
    });

    /**
     * @api {post} /load Loads a rule set to the YKW instace.
     * @apiVersion 0.0.1
     * @apiName Load Rules .
     * @apiGroup YKW
     * @apiParam {Object[]} rules Array of rule objects. This will contain the rule , its conditions and actions .
     * @apiParamExample {json} Request Sample
     *[
     *  {
     *   rule: {
     *       id: 1,
     *       name: 'Natural Number ',
     *       external_reference: '',
     *       conditionsOperator: '&&',
     *       priority: 170001
     *   },
     *   'rule_tags': {
     *       tags: 'natural'
     *   },
     *   rule_condition: {
     *       id: 1,
     *       key: 'integer',
     *       operation: '>',
     *       value: '0'
     *   },
     *   rule_action: {
     *       id: 1,
     *       action: 'SET_VARIABLE',
     *       key: 'is_natural',
     *       value: 1
     *   }
     *  }
     *  ]
     * @apiSuccess (204) {String} OK The rules have been loaded into the rule engine instance.
     * @apiError (400) {String} NO-RULES-PASSED This says that the rules have not been passed or passed in an incorrect format.
     */


    self.app.post('/load', function (req, res, next) {

	var rules = _.get(req , 'body.rules' , []);

	if (rules.length === 0) {
            return res.status(400).send("NO RULES PASSED");
	}

	self.ykw.loadRules(rules);
	return res.status(204).send("OK");
    });



    /**
     * @api {post} /apply Runs the rule engine with the loaded set of rules on a given message and tag.
     * @apiVersion 0.0.1
     * @apiName Apply Rules .
     * @apiGroup YKW
     * @apiParam {json} message The message on which you want to run the rule engine.
     * @apiParam {string} tag The specific set of rules that you want to run the rule engine on.
     * @apiParamExample {json} Request Sample
     * {
     *    "message": {
     *        "integer": 1
     *    },
     *    "tag": "natural"
     * }
     * @apiSuccess (200) {json} message The message after the rule engine has been run.
     * @apiSuccess (200) {json} _meta The statistics (how many actions / conditions were run / time took) on the rule engine for this message.
     * @apiSuccessExample {json} YKW-Response:
     *     {
     *    "message": {
     *        integer: 1,
     *        _meta: {
     *            id: 1459408164318
     *        },
     *        is_natural: 1
     *    },
     *    "_meta": {
     *        "ts": {
     *            "rules_loaded": 1459408164036,
     *            "start": 1459408164069,
     *            "end": 1459408164071
     *        },
     *        "rules": {
     *            "1": {
     *                "conditions": {
     *                    "1": true
     *                },
     *                "applied": true,
     *                "actions": {},
     *                "total_actions": 1,
     *                "total_conditions": 1
     *            }
     *        },
     *        "ruleEngineHash": "9edb27c675b4a567ce5e13ae976cc12347c72e8b"
     *    }
     *}
     */

    self.app.post('/apply', function (req, res, next) {
	var
            response = {},
            reqBody  = _.get(req, 'body', {}),
            message  = _.get(reqBody, 'message', {}),
            tag      = _.get(reqBody, 'tag', {});

	L.verbose("webserver:apply", message, tag);

	self.ykw.applyRules(function (_meta) {
            _.set(response, 'message', message);
            _.set(response, '_meta', _meta);
            return res.status(200).send(response);
	}, message, tag);
    });

};

webServer.prototype.start = function() {
    var self = this;

    // set routes first
    L.info("webserver", "webServer.prototype.start :: Setting routes");
    self._setRoutes();

    L.info("webserver", "webServer.prototype.start :: Creating HTTP Server");

    HTTP.createServer(self.app)
        .on('error', function(err) {
            L.error(err);
            process.exit(1);
        })

        .listen(self.config.WEBSERVER.PORT, 'localhost', function() {
            L.info("webserver", "Listening on localhost on port " + self.app.get('port') + ' in ' + (process.env.NODE_ENV || 'development'));
      });
}; //start

module.exports = webServer;
