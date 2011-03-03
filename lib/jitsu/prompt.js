/*
 * prompt.js: Tools for interacting with a prompt in the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var async = require('async'),
    colors = require('colors'),
    winston = require('winston'),
    readline = require('readline');

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

var Prompt = exports.Prompt = function (options) {
  this.started = false;
  this.paused = false;
};

Prompt.prototype.start = function () {
  if (this.started) {
    return;
  }
  
  process.openStdin();
  this.readline = readline.createInterface(process.stdin, process.stdout);
  this.started = true;
  
  return this;
};

Prompt.prototype.pause = function () {
  if (!this.started || this.paused) {
    return;
  }
  
  process.stdin.pause();
  this.paused = true;
  return this;
};

Prompt.prototype.resume = function () {
  if (!this.started || !this.paused) {
    return;
  }
  
  process.stdin.resume();
  this.paused = false;
  return this;
};

Prompt.prototype.get = function (/* msg, [validator,] callback */) {
  var self = this,
      args = Array.prototype.slice.call(arguments),
      msg = args.shift(),
      callback = args.pop(),
      validator = args.length > 0 && args[0],
      vars = typeof msg === 'string' ? [msg] : msg,
      result = {};
  
  vars = vars.map(function (s) {
    return s.toLowerCase();
  });
  
  function get(prompt, next) {
    self.getInput(capitalize(prompt), validator, function (line) {
      result[prompt] = line;
      next();
    });
  }
  
  async.forEachSeries(vars, get, function () {
    callback(result);
  });
};

Prompt.prototype.getInput = function (msg, validator, callback) {
  var raw = ['prompt', ': ' + msg + ': '],
      length = raw.join('').length,
      prompt;
  
  // Colorize the prompt now that we have the raw length
  raw[0] = raw[0].magenta;
  prompt = raw.join('');
  
  this.readline.once('line', function (line) {
    //
    // TODO (indexzero): Validate this result
    //
    
    winston.input(line.yellow);
    callback(line);
  });
  
  this.readline.setPrompt(prompt, length);
  this.readline.prompt();
  this.resume();
  return this;
};