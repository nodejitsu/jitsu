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
var Databases = exports.Databases = function (options) {
  jitsu.api.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Databases, jitsu.api.Client);

//
// ### function auth (callback)
// #### @callback {function} Continuation to pass control to when complete
// Tests the authentication of the user identified in this process.
//
Databases.prototype.create = function (databaseType, databaseName, callback) {
  this._request('POST', ['databases', this.options.get('username'), databaseName], {type:databaseType}, callback, function (res, result) {
    callback(null, result);
  });
};

Databases.prototype.get = function (databaseName, callback) {
  this._request('GET', ['databases', this.options.get('username'), databaseName], callback, function (res, result) {
    callback(null, result);
  });
};

Databases.prototype.list = function (callback) {
  this._request('GET', ['databases', this.options.get('username')], callback, function (res, result) {
    callback(null, result);
  });
};

Databases.prototype.delete = function (databaseName, callback) {
   this._request('DELETE', ['databases', this.options.get('username'), databaseName], callback, function (res, result) {
    callback(null, result);
  });
}
