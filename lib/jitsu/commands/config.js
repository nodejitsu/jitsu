/*
 * config.js: Command related to jitsu configuration
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('jitsu');
 
var config = exports;

config.set = function (key, value, callback) {
  jitsu.config.settings[key] = value;
  jitsu.config.save(callback);
};