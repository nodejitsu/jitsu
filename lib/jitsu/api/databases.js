/*
 * databases.js: Client for the Nodejitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var util = require('util'),
    winston = require('winston'),
    jitsu = require('jitsu');

//
// ### function Databases (options)
// #### @options {Object} Options for this instance
// Constructor function for the Databases resource responsible
// with Nodejitsu's Databases API
//
var Databases = exports.Databases = function (options) {
  jitsu.api.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Databases, jitsu.api.Client);

//
// ### function create (databaseType, databaseName, callback)
// #### @databaseType {string} Type of database to create, valid values: redis, couch, mongo
// #### @databaseName {string} Name of the database to create
// #### @callback {function} Continuation to pass control to when complete
// Provisions a database for the user
//
Databases.prototype.create = function (databaseType, databaseName, callback) {
  this.request('POST', ['databases', this.options.get('username'), databaseName], {type:databaseType}, callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function get (databaseName, callback)
// #### @databaseName {string} Name of the database to get
// #### @callback {function} Continuation to pass control to when complete
// Gets the metadata for the specified database
//
Databases.prototype.get = function (databaseName, callback) {
  this.request('GET', ['databases', this.options.get('username'), databaseName], callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete
// Gets the list of databases assigned to the user
//
Databases.prototype.list = function (callback) {
  this.request('GET', ['databases', this.options.get('username')], callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function destroy (databaseName, callback)
// #### @databaseName {string} Name of the database to delete
// #### @callback {function} Continuation to pass control to when complete
// Deprovisions specified database
//
Databases.prototype.destroy = function (databaseName, callback) {
   this.request('DELETE', ['databases', this.options.get('username'), databaseName], callback, function (res, result) {
    callback(null, result);
  });
}
