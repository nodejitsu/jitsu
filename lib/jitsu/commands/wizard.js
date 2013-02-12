/*
 * wizard.js: Commands for running a configuration and installation wizard.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

var fs        = require('fs'),
    path      = require('path'),
    common    = require('../common'),
    cpr       = common.cpr,
    rimraf    = common.rimraf,
    npmModule = require('npm'),
    jitsu     = require('../../jitsu'),
    utile     = jitsu.common;

var thisPath  = process.cwd();


module.exports = function (callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    callback = utile.args(arguments).callback;
  }

  jitsu.plugins.cli.executeCommand(['help'], callback);
};

module.exports.usage = [
  'Runs a configuration and installation wizard for jitsu',
  '',
  'jitsu wizard',
];
