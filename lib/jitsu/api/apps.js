/*
 * app.js: Client for the Nodejitsu apps API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var util = require('util'),
    winston = require('winston'),
    jitsu = require('jitsu');

//
// ### function Apps (options)
// #### @options {Object} Options for this instance
// Constructor function for the Apps resource responsible
// with Nodejitsu's Apps API
//
var Apps = exports.Apps = function (options) {
  jitsu.api.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Apps, jitsu.api.Client);

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete
// Lists all applications for the authenticated user
//
Apps.prototype.list = function (callback) {
  winston.info('Listing apps');
  this._request('GET', ['apps', jitsu.config.username], callback, function (res, result) {
    callback(null, result.apps);
  });
};

//
// ### function create (app, callback)
// #### @app {Object} Package.json manifest for the application.
// #### @callback {function} Continuation to pass control to when complete
// Creates an application with the specified package.json manifest in `app`. 
//
Apps.prototype.create = function (app, callback) {
  this._request('POST', ['apps', jitsu.config.username, app.name], app, callback, function (res, result) {
    callback();
  });
};

//
// ### function view (name, callback)
// #### @name {string} Name of the application to view
// #### @callback {function} Continuation to pass control to when complete
// Views the application specified by `name`.
//
Apps.prototype.view = function (name, callback) {
  this._request('GET', ['apps', jitsu.config.username, name], callback, function (res, result) {
    callback(null, result.app);
  });
};

//
// ### function update (name, attrs, callback)
// #### @name {string} Name of the application to update
// #### @attrs {Object} Attributes to update for this application.
// #### @callback {function} Continuation to pass control to when complete
// Updates the application with `name` with the specified attributes in `attrs`
//
Apps.prototype.update = function (name, attrs, callback) {
  this._request('PUT', ['apps', jitsu.config.username, name], attrs, callback, function (res, result) {
    callback();
  });
};

//
// ### function destroy (name, callback)
// #### @name {string} Name of the application to destroy
// #### @callback {function} Continuation to pass control to when complete
// Destroys the application with `name` for the authenticated user. 
//
Apps.prototype.destroy = function (name, callback) {
  this._request('DELETE', ['apps', jitsu.config.username, name], callback, function (res, result) {
    callback();
  });
};

//
// ### function start (name, callback)
// #### @name {string} Name of the application to start
// #### @callback {function} Continuation to pass control to when complete
// Starts the application with `name` for the authenticated user. 
//
Apps.prototype.start = function (name, callback) {
  this._request('POST', ['apps', jitsu.config.username, name, 'start'], { start: name }, callback, function (res, result) {
    callback();
  });
};

//
// ### function restart (name, callback)
// #### @name {string} Name of the application to start
// #### @callback {function} Continuation to pass control to when complete
// Starts the application with `name` for the authenticated user. 
//
Apps.prototype.restart = function (name, callback) {
  this._request('POST', ['apps', jitsu.config.username, name, 'restart'], { restart: name }, callback, function (res, result) {
    callback();
  });
};

//
// ### function stop (name, callback)
// #### @name {string} Name of the application to stop.
// #### @callback {function} Continuation to pass control to when complete
// Stops the application with `name` for the authenticated user. 
//
Apps.prototype.stop = function (name, callback) {
  this._request('POST', ['apps', jitsu.config.username, name, 'stop'], { stop: name }, callback, function (res, result) {
    callback();
  });
};