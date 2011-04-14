/*
 * prompt.js: Tools for interacting with a prompt in the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var async = require('async'),
    colors = require('colors'),
    winston = require('winston'),
    stdio = process.binding('stdio');

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
    stdin;

//
// ### function start ()
// Starts the prompt by opening stdin listening 
// to the appropriate events
//
prompt.start = function () {
  if (started) {
    return;
  }
  
  stdin = process.openStdin();
  
  process.on('SIGINT', function () {
    process.stdout.write('\n');
    process.exit(1);
  })
    
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
  
  stdin.pause();
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
  
  stdin.resume();
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
    prompt.getInput(capitalize(promptMsg), validator, function (err, line) {
      if (err) {
        return next(err);
      }
      
      result[promptMsg] = line;
      next();
    });
  }
  
  async.forEachSeries(vars, get, function (err) {
    return err ? callback(err) : callback(null, result);
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
  
  process.stdout.write(promptMsg); 
  readLine(function (err, line) {
    if (err) {
      return callback(err);
    }
    
    winston.input(line.yellow);
    callback(null, line);
  });

  return prompt;
};

//
// ### function getInput (msg, validator, callback)
// #### @msg {string} Variables to get input for.
// #### @validator {function} Validation function to check input received against.
// #### @callback {function} Continuation to pass control to when complete.
// Gets input from the user via stdin for the specified message `msg`.
//
prompt.getHiddenInput = function (msg, validator, callback) {
  var raw = ['prompt', ': ' + msg + ': '],
      length = raw.join('').length,
      promptMsg;
  
  // Colorize the prompt now that we have the raw length
  raw[0] = raw[0].magenta;
  promptMsg = raw.join('');
  
  process.stdout.write(promptMsg); 
  readLineHidden(function (err, line) {
    if (err) {
      return callback(err);
    }
    
    winston.input(line.yellow);
    callback(null, line);
  });

  return prompt;
};

//
// ### function addProperties (obj, properties, callback) 
// #### @obj {Object} Object to add properties to
// #### @properties {Array} List of properties to get values for
// #### @callback {function} Continuation to pass control to when complete.
// Prompts the user for values each of the `properties` if `obj` does not already
// have a value for the property. Responds with the modified object.  
//
prompt.addProperties = function (obj, properties, callback) {
  properties = properties.filter(function (prop) {
    return typeof obj[prop] === 'undefined';
  });
  
  if (properties.length === 0) {
    return callback(obj);
  }
  
  prompt.get(properties, function (err, results) {
    if (!results) {
      return callback(obj);
    }
    
    Object.keys(results).forEach(function (key) {
      obj[key] = results[key];
      callback(obj);
    });
  });
};

function readLine (callback) {
  var value = '', buffer = '';
  prompt.resume();
  stdin.setEncoding("utf8");
  stdin.on('error', callback);
  stdin.on('data', function data (chunk) {
    value += buffer + chunk;
    buffer = '';
    value = value.replace(/\r/g, '');
    if (value.indexOf('\n') !== -1) {
      if (value !== '\n') {
        value = value.replace(/^\n+/, '');
      }
      
      buffer = value.substr(value.indexOf('\n'));
      val = value.substr(0, value.indexOf('\n'));
      prompt.pause();
      stdin.removeListener('data', data);
      stdin.removeListener('error', callback);
      value = value.trim();
      callback(null, value);
    }
  });
};

function readLineHidden (callback) {
  var value = '', buffer = '';
  stdio.setRawMode(true);
  prompt.resume();
  stdin.on('error', callback);
  stdin.on('data', function data (c) {
    c = '' + c;
    switch (c) {
      case '\n': case '\r': case '\r\n': case '\u0004':
        stdio.setRawMode(false);
        stdin.removeListener('data', data);
        stdin.removeListener('error', callback);
        value = value.trim();
        process.stdout.write('\n');
        process.stdout.flush();
        prompt.pause();
        return callback(null, value)
      case '\u0003': case '\0':
        process.stdout.write('\n');
        process.exit(1);
        break;
      default:
        value += buffer + c
        buffer = '';
        break;
    }
  });
};