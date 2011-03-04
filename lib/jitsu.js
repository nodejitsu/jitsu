/*
 * jitsu.js: Top-level include for the jitsu module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(__dirname);

var eyes = require('eyes'),
    winston = require('winston'),
    colors = require('colors');

var jitsu = exports,
    started = false;

// Failure HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var failCodes = jitsu.failCodes = {
  400: "Bad Request",
  403: "Not Authorized",
  404: "Item not found",
  500: "Internal Server Error"
};

// Success HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var successCodes = jitsu.successCodes = {
  200: "OK",
  201: "Created"
};

jitsu.utils  = require('jitsu/utils');
jitsu.Client = require('jitsu/client').Client;
jitsu.Apps   = require('jitsu/apps').Apps;
jitsu.Users  = require('jitsu/users').Users;
jitsu.prompt = require('jitsu/prompt');
jitsu.config = require('jitsu/config');

//
// ### function start (command, callback)
// #### @command {string} Command to execute once started
// #### @callback {function} Continuation to pass control to when complete.
// Starts the jitsu CLI and runs the specified command.
//
jitsu.start = function (command, callback) {
  // Setup the initial prompt but don't leave it open
  jitsu.prompt.start().pause();
  
  winston.info('Welcome to ' + 'Nodejitsu'.grey);
  jitsu.config.load(function (err) {
    if (!jitsu.config.settings.auth) {
      return jitsu.setupUser(function (err) {
        return err ? callback(err) : jitsu.exec(command, callback);
      });
    }
    
    return err ? callback(err) : jitsu.exec(command, callback);
  });
};

//
// ### function exec (command, callback)
// #### @command {string} Command to execute
// #### @callback {function} Continuation to pass control to when complete.
// Runs the specified command in the jitsu CLI.
//
jitsu.exec = function (command, callback) {
  if (!command) {
    return winston.error('No command supplied');
  }
  else if (!started) {
    return jitsu.setup(function (err) {
      if (err) {
        return callback(err);
      }
      
      runCommand();
    });
  }
  
  function runCommand() {
    winston.info('Executing command ' + command.magenta);
    //
    // d (indexzero): Execute this command
    //
  }
  
  runCommand();
};

//
// ### function setup (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Sets up the instances of the Resource clients for jitsu and tests
// the username/password combo for the authenticated user.
//
jitsu.setup = function (callback) {
  jitsu.users = new jitsu.Users(jitsu.config.settings);
  
  jitsu.users.auth(function (err, success) {
    started = true;
    
    if (err || !success) {
      winston.error('Unable to Autenticate as ' + jitsu.config.settings.auth.username.magenta);
      winston.error(err.message);
      return callback(err);
    } 
    
    winston.info('Authenticated as ' + jitsu.config.settings.auth.username.magenta);
    callback();
  });
};

//
// ### function setupUser (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Prompts the user for their username / password combo, then sets up the jitsu CLI,
// and saves the resulting configuration to disk.
//
jitsu.setupUser = function (callback) {
  winston.info('No user has been setup on this machine')
  jitsu.prompt.get(['username', 'password'], function (result) {
    jitsu.config.settings.auth = result;
    jitsu.setup(function (setupErr) {
      jitsu.config.save(function (err) {
        return setupErr || err ? callback(setupErr || err) : callback();
      });
    });
  });
};