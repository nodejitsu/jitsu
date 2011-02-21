/*
 * app.js: Client for the Nodejitsu apps API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var util = require('util'),
    jitsu = require('jitsu');

var Apps = exports.Apps = function (options) {
  jitsu.Client.call(this, options);
};

util.inherits(Apps, jitsu.Client);

Apps.prototype.list = function (callback) {
  
};

Apps.prototype.create = function (app, callback) {
  this._request('POST', ['apps' app.name], app, callback, function (err, res, body) {
    
  });
};

Apps.prototype.update = function (attrs, callback) {
  
};

Apps.prototype.destory = function (name, callback) {
  
};