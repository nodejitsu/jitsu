/*
 * logs.js: Client for the Nodejitsu logs API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var util = require('util'),
    winston = require('winston'),
    jitsu = require('jitsu');

//
// ### function Logs (options)
// #### @options {Object} Options for this instance
// Constructor function for the Logs resource
// with Nodejitsu's Logs API
//
var Logs = exports.Logs = function (options) {
  jitsu.api.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Logs, jitsu.api.Client);

Logs.prototype.byApp = function (appId, callback) {
  this._request('POST', ['logs', this.options.get('username') , appId], {}, callback, function (res, result) {
    callback(null, result);
  });
};

Logs.prototype.byUser = function (callback) {
  this._request('POST', ['logs', this.options.get('username')], {}, callback, function (res, result) {
    callback(null, result);
  });
};
