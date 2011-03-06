/*
 * snapshots.js: Client for the Nodejitsu snapshots API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var util = require('util'),
    winston = require('winston'),
    jitsu = require('jitsu');

//
// ### function Snapshots (options)
// #### @options {Object} Options for this instance
// Constructor function for the Apps resource responsible
// with Nodejitsu's Snapshots API
//
var Snapshots = exports.Snapshots = function (options) {
  jitsu.api.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Snapshots, jitsu.api.Client);

//
// ### function list (name, callback)
// #### @name {string} Name of the application to list snapshots for.
// #### @callback {function} Continuation to pass control to when complete
// Lists all applications for the authenticated user
//
Snapshots.prototype.list = function (name, callback) {
  winston.info('Listing snapshots for ' + name.magenta);
  this._request('GET', ['apps', jitsu.config.username, name, 'snapshots'], callback, function (res, result) {
    callback(null, result.snapshots);
  });
};

//
// ### function create (name, snapshot, callback)
// #### @name {string} Name of the application to create a snapshot for.
// #### @snapshot {Buffer} Data for the application snapshot (tar+gzip).
// #### @callback {function} Continuation to pass control to when complete
// Creates a snapshot for the application with `app.name = name` using
// the `*.tgz` package data in `snapshot`. 
//
Snapshots.prototype.create = function (name, snapshot, callback) {
  this._upload(['apps', jitsu.config.username, name, 'snapshots'], 'application/octet-stream', snapshot, callback, function (res, body) {
    callback(null);
  });
};