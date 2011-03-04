/*
 * users.js: Client for the Nodejitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var util = require('util'),
    winston = require('winston'),
    jitsu = require('jitsu');
    
//
// ### function Users (options)
// #### @options {Object} Options for this instance
// Constructor function for the Users resource responsible
// with Nodejitsu's Users API
//
var Users = exports.Users = function (options) {
  jitsu.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Users, jitsu.Client);

//
// ### function auth (callback)
// #### @callback {function} Continuation to pass control to when complete
// Tests the authentication of the user identified in this process.
//
Users.prototype.auth = function (callback) {
  winston.info('Attempting to authenticate as ' + jitsu.config.settings.auth.split(':')[0].magenta);
  this._request('GET', ['auth'], callback, function (res, body) {
    callback(null, true);
  });
};