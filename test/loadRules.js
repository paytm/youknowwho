"use strict";


var mysql = require('mysql');
var ruleEngine = require('../');

/*
 Have to add mocha later , figuring out rule engine for now.
*/


var connection = mysql.createConnection({
  "user" : "root",
  "password" : "paytm@197",
  "database" : "fs_recharge",
  "host" : "localhost"
});


var query = 'SELECT \
                        rule.id,\
                        rule.name,\
                        rule.external_reference,\
                        (\
                            SELECT GROUP_CONCAT(ruletag_id) FROM rule_ruletag WHERE rule_id = rule.id\
                        ) as tags,\
                        rule.conditionsOperator,\
                        rule.priority,\
                        rule_condition.id,\
                        rule_condition.key,\
                        rule_condition.operation,\
                        rule_condition.value,\
                        rule_action.id, \
                        rule_action.action, \
                        rule_action.key, \
                        rule_action.value \
                    FROM \
                        rule \
                            join \
                        rule_action \
                            on rule.id=rule_action.rule_id \
                            join \
                        rule_condition \
                            on rule.id=rule_condition.rule_id \
                    WHERE \
                        status = 1 \
                    order by \
                        rule.priority ASC';

var options = {sql: query , nestTables: true};

connection.query(options, function (error, rows, fields) {
  var ykw = new ruleEngine();
  ykw.on('log.info', function (message) {
    console.log(message);
  });
  
  ykw.on('log.debug', function (message) {
    // console.log(message);
  });

  ykw.loadRules(rows);

  var message = {
    catalogProductID : 1,
    userData : {
      // recharge_number : 8860035989
    },
      productInfo : {
	  circle : "Haryana"
      }
  };

  ykw.applyRules(message);
  console.log("################# ", message);
});

