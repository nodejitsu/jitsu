/*
 * config.js: Command related to jitsu configuration
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var winston = require('winston'),
    jitsu = require('../../jitsu');
 
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
  
  jitsu.config.setFromString(key, value)
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
    winston.error('No configuration for ' + 'undefined'.yellow);
    return callback(new Error(), true, true);
  }
  
  var value = jitsu.config.get(key);
  if (!value) {
    winston.error('No configuration value for ' + key.yellow);
    return callback(new Error(), true, true);
  }
  else if (typeof value === 'object') {
    winston.data(key.yellow);
    jitsu.log.putObject(value);
    return callback();
  }
    
  winston.data([key.yellow, value.magenta].join(' '));
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
    winston.warn('No configuration for ' + 'undefined'.magenta);
    return callback();
  }

  var value = jitsu.config.get(key);
  if (!value) {
    winston.warn('No configuration value for ' + key.yellow);
    return callback();
  }
  else if (noDelete.indexOf(key) !== -1) {
    winston.warn('Cannot delete reserved setting ' + key.yellow);
    winston.help('Use jitsu config set <key> <value>');
    return callback();
  }
  
  jitsu.config.clear(key);
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
  var username = jitsu.config.get('username'),
      configFile = jitsu.config.store.file;
  
  var display = [
    ' here is your ' + configFile.grey + ' file:',
    'If you\'d like to change a property try:',
    'jitsu config set <key> <value>',
  ];

  if (!username) {
    winston.warn('No user has been setup on this machine');
    display[0] = 'Hello' + display[0];
  }
  else {
    display[0] = 'Hello ' + username.green + display[0];
  }
  
  display.forEach(function (line) {
    winston.help(line);
  });
  
  jitsu.log.putObject(jitsu.config.store.store, {
    password: function (line) {
      var password = line.match(/password.*\:\s(.*)$/)[1];
      return line.replace(password, "'********'");
    }
  }, 2);
  
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
