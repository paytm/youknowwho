"use strict";
/*jshint multistr: true ,node: true*/

var env = process.env.NODE_ENV || 'development';

module.exports= function(err, req, res, next) {

  var response = {};

  var errorStatus = err.status || 500;

  response.error = err.message;
  response.status = {result: 'failure'};
  response.status.message = {title : 'Error'};
  response.status.message.message = err.message;
  response.code = errorStatus;

  /**
   * Return stack trace only in dev.
   * In production, log stack traces only
   * for 500 errors
   *
   **/

  if (env == 'production') {
    if (errorStatus == 500) {
      console.error(err.stack);
      response.error = 'Sorry. An unexpected error has occured.';
      response.status.message.message = 'Sorry. An unexpected error has occured.';
    } else if (errorStatus == 404) {
      response.error = 'Not found';
      response.status.message.message = 'Not found';
    } else {
      response.error = 'Unexpected Error Occured .';
      response.status.message.message = 'Unexpected Error Occured .';
    }
  } else {
    try{
      response.stack = err.stack.split('\n');
      console.error(err.stack);
    }
    catch(ex){}
  }
  res.status(errorStatus).json(response);
};
