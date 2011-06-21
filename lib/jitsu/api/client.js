/*
 * client.js: Client base for the Nodejitsu API clients.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var eyes = require('eyes'),
    fs = require('fs'),
    _request = require('request'),
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

//to enable mocking the io we're gonna expose request here.

Client.__requestHook = _request
request = function (){
  return Client.__requestHook.apply(null,[].slice.call(arguments))
}

//
// ### @private function _request (method, uri, [body], success, callback)
// #### @method {string} HTTP method to use
// #### @uri {Array} Locator for the Remote Resource
// #### @body {Object} **optional** JSON Request Body
// #### @callback {function} Continuation to call if errors occur.
// #### @success {function} Continuation to call upon successful transactions
// Makes a request to `this.remoteUri + uri` using `method` and any 
// `body` (JSON-only) if supplied. Short circuits to `callback` if the response
// code from Nodejitsu matches `jitsu.failCodes`. 
//
Client.prototype._request = function (method, uri /* variable arguments */) {
  var options, args = Array.prototype.slice.call(arguments),
      success = args.pop(),
      callback = args.pop(),
      body = typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) && args.pop(),
      encoded = jitsu.utils.base64.encode(this.options.get('username') + ':' + this.options.get('password'));
      
  options = {
    method: method || 'GET',
    uri: this.options.get('remoteUri') + '/' + uri.join('/'),
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
    
    var statusCode, result, error;
    
    try {
      statusCode = response.statusCode.toString();
      result = JSON.parse(body);
    }
    catch (ex) {
      // Ignore Errors
    }
    
    if (Object.keys(jitsu.failCodes).indexOf(statusCode) !== -1) {
      error = new Error('Nodejitsu Error (' + statusCode + '): ' + jitsu.failCodes[statusCode]);
      error.statusCode = statusCode;
      error.result = result;
      return callback(error);
    }

    success(response, result);
  });
};

//
// ### function _upload (uri, contentType, file, callback, success) 
// #### @uri {Array} Locator for the Remote Resource
// #### @contentType {string} Content-Type header to use for the upload.
// #### @file {string} Path of the local file to upload. 
// #### @success {function} Continuation to call upon successful transactions
// #### @callback {function} Continuation to call if errors occur.
// Makes a `POST` request to `this.remoteUri + uri` with the data in `file` 
// as the request body. Short circuits to `callback` if the response
// code from Nodejitsu matches `jitsu.failCodes`.
//
Client.prototype._upload = function (uri, contentType, file, callback, success) {
  var options, out, self = this,
      encoded = jitsu.utils.base64.encode(this.options.get('username') + ':' + this.options.get('password'));
  
  fs.readFile(file, function (err, data) {
    options = {
      method: 'POST',
      uri: self.options.get('remoteUri') + '/' + uri.join('/'),
      headers: {
        'Authorization': 'Basic ' + encoded,
        'Content-Type': contentType,
        'Content-Length': data.length
      }
    };
    
    out = request(options, function (err, response, body) {
      if (err) {
        return callback(err);
      }

      var statusCode, result, error;

      try {
        statusCode = response.statusCode.toString();
        result = JSON.parse(body);
      }
      catch (ex) {
        // Ignore Errors
      }

      if (Object.keys(jitsu.failCodes).indexOf(statusCode) !== -1) {
        error = new Error('Nodejitsu Error (' + statusCode + '): ' + jitsu.failCodes[statusCode]);
        error.result = result;
        return callback(error);
      }

      success(response, result);
    });

    fs.createReadStream(file).pipe(out);
  });
};
