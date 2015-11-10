/*

SELECT  rule.id as r_id, rule.name as r_name, rule.external_reference as r_exref, ( SELECT GROUP_CONCAT(ruletag_id) FROM rule_ruletag WHERE rule_id = rule.id ) as r_tags, rule.conditionsOperator as r_condop, rule.priority as r_priority, rule_condition.id as r_c_id, rule_condition.key as r_c_key, rule_condition.operation as r_c_op, rule_condition.value as r_c_value, rule_action.id as r_a_id,  rule_action.action as r_a_action, rule_action.key as r_a_key, rule_action.value as r_a_value FROM rule join rule_action on rule.id=rule_action.rule_id join rule_condition on rule.id=rule_condition.rule_id WHERE status = 1 order by rule.priority ASC


************************** 5. row ***************************
      r_id: 21
    r_name: error code test rule SUCCESS
   r_exref:
    r_tags: errormapping
  r_condop: &&
r_priority: 1001
r_status



    r_c_id: 55
    r_c_condition : 
   r_c_key: rechargeGwResponse.gwTxnErrorCode
    r_c_op: errorcodetag
 r_c_value: hfcl~Success

    r_a_id: 52
r_a_action: SET_VARIABLE
   r_a_key: inStatusMap.transactionStatus
 r_a_value: SUCCESS

| r_id | r_name | r_exref | r_tags | r_condop | r_priority | r_status | r_c_id | r_c_condition | r_c_key | r_c_op | r_c_value | r_a_id | r_a_action | r_a_key | r_a_value |
|------|--------|---------|--------|----------|------------|----------|--------|---------------|---------|--------|-----------|--------|------------|---------|-----------|
|      |        |         |        |          |            |          |        |               |         |        |           |        |            |         |           |


*/

