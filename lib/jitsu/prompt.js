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

//
// ### @private function capitalize (str)
// #### str {string} String to capitalize
// Capitalizes the string supplied.
//
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

var prompt = exports,
    started = false,
    paused = false,
    linereader;

//
// ### function start ()
// Starts the prompt by opening stdin and
// creating an interface for the `readline` module.
//
prompt.start = function () {
  if (started) {
    return;
  }
  
  process.openStdin();
  linereader = readline.createInterface(process.stdin, process.stdout);
  started = true;
  
  return prompt;
};

//
// ### function pause ()
// Pauses input coming in from stdin
//
prompt.pause = function () {
  if (!started || paused) {
    return;
  }
  
  process.stdin.pause();
  paused = true;
  return prompt;
};

//
// ### function resume ()
// Resumes input coming in from stdin 
//
prompt.resume = function () {
  if (!started || !paused) {
    return;
  }
  
  process.stdin.resume();
  paused = false;
  return prompt;
};

//
// ### function get (msg, [validator,] callback)
// #### @msg {Array|string} Set of variables to get input for.
// #### @validator {function} Validation function to check input received against.
// #### @callback {function} Continuation to pass control to when complete.
// Gets input from the user via stdin for the specified message(s) `msg`.
//
prompt.get = function (/* msg, [validator,] callback */) {
  var args = Array.prototype.slice.call(arguments),
      msg = args.shift(),
      callback = args.pop(),
      validator = args.length > 0 && args[0],
      vars = typeof msg === 'string' ? [msg] : msg,
      result = {};
  
  vars = vars.map(function (s) {
    return s.toLowerCase();
  });
  
  function get(promptMsg, next) {
    prompt.getInput(capitalize(promptMsg), validator, function (line) {
      result[promptMsg] = line;
      next();
    });
  }
  
  async.forEachSeries(vars, get, function () {
    callback(result);
  });
};

//
// ### function getInput (msg, validator, callback)
// #### @msg {string} Variables to get input for.
// #### @validator {function} Validation function to check input received against.
// #### @callback {function} Continuation to pass control to when complete.
// Gets input from the user via stdin for the specified message `msg`.
//
prompt.getInput = function (msg, validator, callback) {
  var raw = ['prompt', ': ' + msg + ': '],
      length = raw.join('').length,
      promptMsg;
  
  // Colorize the prompt now that we have the raw length
  raw[0] = raw[0].magenta;
  promptMsg = raw.join('');
  
  linereader.once('line', function (line) {
    //
    // TODO (indexzero): Validate this result
    //
    
    prompt.pause();
    winston.input(line.yellow);
    callback(line);
  });
  
  linereader.setPrompt(promptMsg, length);
  linereader.prompt();
  prompt.resume();
  return prompt;
};

prompt.addProperties = function (obj, properties, callback) {
  properties = properties.filter(function (prop) {
    return typeof obj[prop] === 'undefined';
  });
  
  if (properties.length === 0) {
    return callback(obj);
  }
  
  prompt.get(properties, function (results) {
    Object.keys(results).forEach(function (key) {
      obj[key] = results[key];
      callback(obj);
    });
  });
};