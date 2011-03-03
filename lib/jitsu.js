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

var jitsu = exports;

// Failure HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var failCodes = jitsu.failCodes = {
  400: "Bad Request",
  404: "Item not found",
  500: "Internal Server Error"
};

// Success HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var successCodes = jitsu.successCodes = {
  200: "OK",
  201: "Created"
};


jitsu.Client = require('jitsu/client').Client;
jitsu.Apps   = require('jitsu/apps').Apps;
jitsu.Prompt = require('jitsu/prompt').Prompt;
jitsu.config = require('jitsu/config');

jitsu.start = function (command) {
  // Setup the initial prompt but don't leave it open
  jitsu.prompt = new jitsu.Prompt().start().pause();
  
  winston.info('Welcome to ' + 'Nodejitsu'.grey);
  jitsu.config.load(function (err) {
    if (err) {
      eyes.inspect(err);
    }
    
    if (!jitsu.config.settings.auth) {
      return jitsu.setupUser(function () {
        jitsu.exec(command)
      });
    }
    
    jitsu.exec(command);
  });
};

jitsu.exec = function (command) {
  if (!command) {
    return winston.error('No command supplied');
  }
  
  winston.info('Executing command ' + command.magenta);
};

jitsu.setupUser = function (callback) {
  winston.info('No user has been setup on this machine')
  jitsu.prompt.get(['username', 'password'], function (result) {
    jitsu.prompt.pause();
    
    //
    // TODO (indexzero): Validate the username and password before saving
    //
    jitsu.config.settings.auth = result;
    jitsu.config.save(function (err) {
      if (err) {
        eyes.inspect(err);
      }
      
      return err ? callback(err) : callback();
    });
  });
};