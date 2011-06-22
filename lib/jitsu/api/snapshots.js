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
  var username = jitsu.config.get('username');
  this.request('GET', ['apps', username, name, 'snapshots'], callback, function (res, result) {
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
Snapshots.prototype.create = function (appName, snapshotName, filename, callback) {
  var username = jitsu.config.get('username');
  var url = ['apps', username, appName, 'snapshots', snapshotName];
  this.upload(url, 'application/octet-stream', filename, callback, function (res, body) {
    callback(null);
  });
};

//
// ### function create (name, snapshot, callback)
// #### @name {string} Name of the application to destroy a snapshot for.
// #### @callback {function} Continuation to pass control to when complete
// Destroys a snapshot for the application with `app.name = name` and 
// `snapshot.id === snapshotName`.
//
Snapshots.prototype.destroy = function (appName, snapshotName, callback) {
  var username = jitsu.config.get('username'),
      url = ['apps', username, appName, 'snapshots', snapshotName];
      
  this.request('DELETE', url, callback, function (res, body) {
    callback();
  });
};

//
// ### function activate (name, snapshot, callback)
// #### @name {string} Name of the application to activate a snapshot for.
// #### @snapshot {string} Name of the snapshot to activate.
// #### @callback {function} Continuation to pass control to when complete
// Activates a snapshot for the application with `app.name = name` and 
// `snapshot.id === snapshotName`.
//
Snapshots.prototype.activate = function (appName, snapshotName, callback) {
  var username = jitsu.config.get('username'),
      url = ['apps', username, appName, 'snapshots', snapshotName, 'activate'];
      
  this.request('POST', url, callback, function (res, body) {
    callback();
  });
};