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
// #### @msg {Array|Object|string} Set of variables to get input for.
// #### @callback {function} Continuation to pass control to when complete.
// Gets input from the user via stdin for the specified message(s) `msg`.
//
prompt.get = function (msg, callback) {
  var vars = !Array.isArray(msg) ? [msg] : msg,
      result = {};
  
  vars = vars.map(function (v) {
    if (typeof v === 'string') {
      v = v.toLowerCase();
    }
    
    return prompt.properties[v] || v;
  });
  
  function get(target, next) {
    prompt.getInput(target, function (err, line) {
      if (err) {
        return next(err);
      }
      
      var name = target.name || target;
      result[name] = line;
      next();
    });
  }
  
  async.forEachSeries(vars, get, function (err) {
    return err ? callback(err) : callback(null, result);
  });
};

//
// ### function getInput (msg, validator, callback)
// #### @msg {Object|string} Variable to get input for.
// #### @callback {function} Continuation to pass control to when complete.
// Gets input from the user via stdin for the specified message `msg`.
//
prompt.getInput = function (prop, callback) {
  var name   = prop.message || prop.name || prop,
      raw    = ['prompt', ': ' + name, ': '],
      read   = prop.hidden ? prompt.readLineHidden : prompt.readLine,
      length, msg;
  
  
  if (prop.default) {
    raw.splice(2, -1, ' (' + prop.default + ')');
  }
  
  // Calculate the raw length and colorize the prompt
  length = raw.join('').length;
  raw[0] = raw[0].magenta;
  msg = raw.join('');
  
  if (prop.help) {
    prop.help.forEach(function (line) {
      winston.help(line);
    });
  }
  
  process.stdout.write(msg); 
  read.call(null, function (err, line) {
    if (err) {
      return callback(err);
    }
    
    if (!line || line === '') {
      line = prop.default || line;
    }
    
    if (prop.validator) {
      var valid = prop.validator.test 
        ? prop.validator.test(line)
        : prop.validator(line);
      
      if (!valid) {
        winston.warn('Invalid input for ' + name.magenta);
        if (prop.warning) {
          winston.warn(prop.warning);
        }

        return prompt.getInput(prop, callback);
      }
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
    if (err) {
      return callback(err);
    }
    else if (!results) {
      return callback(null, obj);
    }
    
    function putNested (obj, path, value) {
      var last = obj, key; 
      
      while (path.length > 1) {
        key = path.shift();
        if (!last[key]) {
          last[key] = {};
        }
        
        last = last[key];
      }
      
      last[path.shift()] = value;
    }
    
    Object.keys(results).forEach(function (key) {
      putNested(obj, key.split('.'), results[key]);
    });
    
    callback(null, obj);
  });
};

prompt.readLine = function (callback) {
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

prompt.readLineHidden = function (callback) {
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

prompt.properties = {
  email: {
    name: 'email',
    validator: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
    warning: 'Must be a valid email address'
  },
  password: {
    name: 'password',
    hidden: true
  },
  inviteCode: {
    name: 'invite code',
    message: 'Invite Code',
    validator: /^\w+$/,
    warning: 'Invite code can only be letters, and numbers'
  },
  snapshot: {
    name: 'snapshot',
    message: 'Snapshot Name',
    validator: /^[\w|\-|\.]+$/,
    warning: 'Snapshot can only be letters, numbers, dashes, and dots'
  },
  username: {
    name: 'username',
    validator: /^[\w|\-]+$/,
    warning: 'Username can only be letters, numbers, and dashes'
  }
};