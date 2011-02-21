/*
 * client.js: Client base for the Nodejitsu API clients.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var request = require('request'),
    jitsu = require('jitsu');

var Client = exports.Client = function (options) {
  
};

Client.prototype._request = function (method, uri /* variable arguments */) {
  var options, args = Array.prototype.slice.call(arguments),
      success = args.pop(),
      callback = args.pop(),
      body = typeof args[args.length - 1] === 'object' && args.pop();
      
  options = {
    method: method || 'GET',
    uri: this.remoteUri + uri,
    headers: {
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
      var error = new Error('Broodmother Error (' + statusCode + '): ' + jitsu.failCodes[statusCode]);
      error.result = result;
      return callback(error);
    }
    
    success(response, result);
  });
};
