/*
 * config.js: Command related to jitsu configuration
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('jitsu'),
    winston = require('winston');
 
var config = exports,
    noDelete = ['root', 'remoteUri', 'userconfig', 'auth', 'tmproot', 'tar', 'gzipbin'];

//
// ### function set (key, value, callback)
// #### @key {string} Key to set in jitsu config.
// #### @value {string} Value to set the key to.
// #### @callback {function} Continuation to pass control to when complete
// Sets the specified `key` in jitsu config to `value`.
//
config.set = function (key, value, callback) {
  jitsu.config.settings[key] = value;
  jitsu.config.save(callback);
};

//
// ### function get (key, callback)
// #### @key {string} Key to get in jitsu config.
// #### @callback {function} Continuation to pass control to when complete
// Gets the specified `key` in jitsu config.
//
config.get = function (key, callback) {
  if (!jitsu.config.settings[key]) {
    return winston.error('No configuration value for ' + key.yellow);
  }
  
  winston.data([key.yellow, jitsu.config.settings[key].magenta].join(' '));
  callback();
};

//
// ### function delete (key, callback)
// #### @key {string} Key to delete, in jitsu config.
// #### @callback {function} Continuation to pass control to when complete
// Deletes the specified `key` in jitsu config.
//
config.delete = function (key, callback) {
  if (!jitsu.config.settings[key]) {
    return winston.error('No configuration value for ' + key.yellow);
  }
  else if (noDelete.indexOf(key) !== -1) {
    winston.error('Cannot delete reserved setting ' + key.yellow);
    winston.error('Use jitsu config set <key> <value>');
    return;
  }
  
  delete jitsu.config.settings[key];
  jitsu.config.save(callback);
};

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete
// Lists all the key-value pairs in jitsu config.
//
config.list = function (callback) {
  function listObject (obj, prefix) {
    prefix = prefix || '';
    Object.keys(obj).forEach(function (key) {
      if (Array.isArray(obj[key])) {
        winston.data((prefix + key).yellow + ' ' + obj[key].join(' ').magenta);
      }
      else {
        winston.data((prefix + key).yellow + ' ' + obj[key].toString().magenta);
      }
    });
  }
  
  listObject(jitsu.config.settings);
  callback();
};