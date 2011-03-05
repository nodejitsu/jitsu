/*
 * client.js: Client base for the Nodejitsu API clients.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var eyes = require('eyes'),
    request = require('request'),
    jitsu = require('jitsu');

//
// ### function Client (options)
// #### @options {Object} Options for this instance
// Constructor function for the Client base responsible
// for communicating with Nodejitsu's API
//
var Client = exports.Client = function (options) {
  this.options = options;
};

//
// ### @private function _request (method, uri, [body], success, callback)
// #### @method {string} HTTP method to use
// #### @uri {Array} Locator for the Remote Resource
// #### @body {Object} **optional** JSON Request Body
// #### @success {function} Continuation to call upon successful transactions
// #### @callback {function} Continuation to call if errors occur.
// Makes a request to `this.remoteUri + uri` using `method` and any 
// `body` (JSON-only) if supplied. Short circuits to `callback` if the response
// code from Nodejitsu matches `jitsu.failCodes`. 
//
Client.prototype._request = function (method, uri /* variable arguments */) {
  var options, args = Array.prototype.slice.call(arguments),
      success = args.pop(),
      callback = args.pop(),
      body = typeof args[args.length - 1] === 'object' && args.pop(),
      encoded = jitsu.utils.base64.encode(this.options.auth);
      
  options = {
    method: method || 'GET',
    uri: this.options.remoteUri + '/' + uri.join('/'),
    headers: {
      'Authorization': 'Basic ' + encoded,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  request(options, function (err, response, body) {
    if (err) {
      return callback(err);
    }
    
    try {
      var statusCode = response.statusCode.toString(),
          result = JSON.parse(body);
    }
    catch (ex) {
      // Ignore Errors
    }
    
    if (Object.keys(jitsu.failCodes).indexOf(statusCode) !== -1) {
      var error = new Error('Nodejitsu Error (' + statusCode + '): ' + jitsu.failCodes[statusCode]);
      error.result = result;
      return callback(error);
    }
    
    success(response, result);
  });
};
