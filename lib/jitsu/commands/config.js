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

config.usage = [
  '`jitsu config *` commands allow you to edit your',
  'local jitsu configuration file. Valid commands are:',
  '',
  'jitsu config list',
  'jitsu config set    <key> <value>',
  'jitsu config get    <key>',
  'jitsu config delete <key>'
];

//
// ### function set (key, value, callback)
// #### @key {string} Key to set in jitsu config.
// #### @value {string} Value to set the key to.
// #### @callback {function} Continuation to pass control to when complete
// Sets the specified `key` in jitsu config to `value`.
//
config.set = function (key, value, callback) {
  var args = Array.prototype.slice.call(arguments);
  callback = args.pop();
  
  if (args.length !== 2) {
    winston.error('You must pass both <key> and <value>');
    return callback(true, true);
  }
  
  jitsu.config.settings[key] = value;
  jitsu.config.save(callback);
};

//
// Usage for `jitsu config set <key> <value>`
//
config.set.usage = [
  'Sets the specified <key> <value> pair in the jitsu configuration',
  '',
  'jitsu config set <key> <value>'
];

//
// ### function get (key, callback)
// #### @key {string} Key to get in jitsu config.
// #### @callback {function} Continuation to pass control to when complete
// Gets the specified `key` in jitsu config.
//
config.get = function (key, callback) {
  if (!callback) {
    callback = key;
    winston.error('No configuration for ' + 'undefined'.magenta);
    return callback(true, true);
  }
  
  if (!jitsu.config.settings[key]) {
    return winston.error('No configuration value for ' + key.yellow);
  }
  
  winston.data([key.yellow, jitsu.config.settings[key].magenta].join(' '));
  callback();
};

//
// Usage for `jitsu config get <key>`
//
config.get.usage = [
  'Gets the value for the specified <key>',
  'in the jitsu configuration',
  '',
  'jitsu config get <key>'
];

//
// ### function delete (key, callback)
// #### @key {string} Key to delete, in jitsu config.
// #### @callback {function} Continuation to pass control to when complete
// Deletes the specified `key` in jitsu config.
//
config.delete = function (key, callback) {
  if (!callback) {
    callback = key;
    winston.error('No configuration for ' + 'undefined'.magenta);
    return callback(true, true);
  }
  else if (!jitsu.config.settings[key]) {
    winston.error('No configuration value for ' + key.yellow);
    return callback(true, true);
  }
  else if (noDelete.indexOf(key) !== -1) {
    winston.error('Cannot delete reserved setting ' + key.yellow);
    winston.help('Use jitsu config set <key> <value>');
    return callback(true, false);
  }
  
  delete jitsu.config.settings[key];
  jitsu.config.save(callback);
};

//
// Usage for `jitsu config delete <key>`
//
config.delete.usage = [
  'Deletes the specified <key> in the jitsu configuration',
  '',
  'jitsu config delete <key>'
];

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete
// Lists all the key-value pairs in jitsu config.
//
config.list = function (callback) {
  function listObject(obj, prefix) {
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

//
// Usage for `jitsu config list`
//
config.list.usage = [
  'Lists all configuration values currently',
  'set in the .jitsuconf file',
  '',
  'jitsu config list'
];