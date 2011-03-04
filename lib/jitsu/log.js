/*
 * log.js: Tools for configuring winston in jitsu.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston');

//
// ### @config
// Log level configuration for jitsu.
//
var config = exports.config = {
  levels: {
    silly: 0,
    input: 1,
    verbose: 2,
    prompt: 3,
    info: 4,
    warn: 5,
    debug: 6,
    error: 7
  },
  colors: {
    silly: 'magenta',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
  }
};

//
// Configure winston with the levels and colors that we've defined
//
winston.emitErrs = false;
winston.defaultTransports().console.colorize = true;
winston.defaultTransports().console.timestamp = false;
winston.padLevels = true;
winston.setLevels(config.levels);
winston.addColors(config.colors);

//
// TODO (indexzero): Load this in config.js
//
winston.defaultTransports().console.level = 'silly';