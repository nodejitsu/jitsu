/*
 * jitsu.js: Top-level include for the jitsu module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = exports;

var path = require('path');

// Failure HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var failCodes = jitsu.failCodes = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Not Authorized',
  404: 'Item not found',
  409: 'Conflict',
  500: 'Internal Server Error'
};

// Success HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var successCodes = jitsu.successCodes = {
  200: 'OK',
  201: 'Created'
};

jitsu.skipAuth          = false;
jitsu.started           = false;
jitsu.utils             = require('./jitsu/utils');
jitsu.package           = require('./jitsu/package');
jitsu.log               = require('cliff');
jitsu.logFile           = new (require('./jitsu/utils/logfile').LogFile)(path.join(process.env.HOME, '.jitsulog'));
jitsu.api               = {};
jitsu.api.Client        = require('nodejitsu-api').Client;
jitsu.api.Apps          = require('nodejitsu-api').Apps;
jitsu.api.Databases     = require('nodejitsu-api').Databases;
jitsu.api.Logs          = require('nodejitsu-api').Logs;
jitsu.api.Snapshots     = require('nodejitsu-api').Snapshots;
jitsu.api.Users         = require('nodejitsu-api').Users;
jitsu.prompt            = require('prompt');
jitsu.prompt.properties = require('./jitsu/properties').properties;
jitsu.prompt.override   = require('optimist').argv;
jitsu.config            = require('./jitsu/config');
jitsu.commands          = require('./jitsu/commands');

//
// Alias the appropriate commands for simplier CLI usage
//
jitsu.commands.alias('create', { resource: 'apps',   command: 'create' });
jitsu.commands.alias('deploy', { resource: 'apps',   command: 'deploy' });
jitsu.commands.alias('list',   { resource: 'apps',   command: 'list' });
jitsu.commands.alias('conf',   { resource: 'config', command: 'list' });
jitsu.commands.alias('login',  { resource: 'users',  command: 'login' });
jitsu.commands.alias('logout', { resource: 'users',  command: 'logout' });
jitsu.commands.alias('signup', { resource: 'users',  command: 'create' });
jitsu.commands.alias('whoami', { resource: 'users',  command: 'whoami' });

var eyes = require('eyes'),
    winston = require('winston'),
    colors = require('colors');

//
// Setup `jitsu` to use `pkginfo` to expose version
//
require('pkginfo')(module, 'version');

//
// ### function start (command, callback)
// #### @command {string} Command to execute once started
// #### @callback {function} Continuation to pass control to when complete.
// Starts the jitsu CLI and runs the specified command.
//
jitsu.start = function (argv, callback) {
  var command = argv._;

  //
  // Special -v command for showing current version without winston formatting
  //
  if (argv.version || argv.v) {
    console.log('v' + jitsu.version);
    process.exit(0);
  }

  //
  // Check for --no-colors/--colors option, without hitting the config file
  // yet
  //
  (typeof argv.colors == "undefined" || argv.colors) || (colors.mode = "none");

  // Setup the initial prompt but don't leave it open
  jitsu.prompt.start().pause();

  //
  // Default to the `help` command.
  //
  command[0] || (command[0] = 'help');

  jitsu.utils.checkVersion(function (err) {
    if (err) return callback();
    jitsu.config.load(function (err) {
      if (err) {
        jitsu.welcome();
        callback(err);
        return jitsu.showError.apply(null, [command[0]].concat(arguments));
      }

      //
      // --no-colors option turns off output coloring, and so does setting
      // colors: false in ~/.jitsuconf (see
      // https://github.com/nodejitsu/jitsu/issues/101 )
      //
      jitsu.config.get('colors') || (colors.mode = "none");

      jitsu.welcome();

      var username = jitsu.config.get('username');
      if (!username && jitsu.commands.requiresAuth(command[0])) {
        return jitsu.setupUser(function (err) {
          if (err) {
            callback(err);
            return jitsu.showError.apply(jitsu, [command[0]].concat(arguments));
          }

          var username = jitsu.config.get('username');
          winston.info('Successfully configured user ' + username.magenta);
          return command.length > 0 ? jitsu.exec(command, callback) : callback();
        });
      }

      return jitsu.exec(command, callback)
    });
  });
};

//
// ### function welcome ()
// Print welcome message.
//
jitsu.welcome = function () {
  winston.info('Welcome to ' + 'Nodejitsu'.grey);
  winston.info('It worked if it ends with ' + 'Nodejitsu'.grey + ' ok'.green.bold);
};

//
// ### function exec (command, callback)
// #### @command {string} Command to execute
// #### @callback {function} Continuation to pass control to when complete.
// Runs the specified command in the jitsu CLI.
//
jitsu.exec = function (command, callback) {
  function execCommand (err) {
    if (err) {
      return callback(err);
    }

    //
    // Remark: This is a temporary fix for aliasing init=>install,
    // was having a few issues with the alias command on the install resource
    //
    if (command[0] === 'init'){
      command[0] = 'install';
    }

    // Alias db to databases
    if (command[0] === 'db'){
      command[0] = 'databases';
    }

    // Allow `jitsu logs` as a shortcut for `jitsu logs app`
    if (command[0] === 'logs' && command.length === 1) {
      command[1] = 'app';
    }

    winston.info('Executing command ' + command.join(' ').magenta);
    jitsu.commands.run(command, function (err, shallow) {
      if (err) {
        callback(err);
        return jitsu.showError(command.join(' '), err, shallow);
      }

      //
      // TODO (indexzero): Something here
      //
      callback();
    });
  }

  return !jitsu.started ? jitsu.setup(execCommand) : execCommand();
};

//
// ### function setup (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Sets up the instances of the Resource clients for jitsu.
// there is no io here, yet this function is ASYNC.
//
jitsu.setup = function (callback) { 
  if (jitsu.started === true) {
    return callback();
  }
  
  jitsu.users = new jitsu.api.Users(jitsu.config);
  jitsu.apps = new jitsu.api.Apps(jitsu.config);
  jitsu.snapshots = new jitsu.api.Snapshots(jitsu.config);
  jitsu.databases = new jitsu.api.Databases(jitsu.config);
  jitsu.logs = new jitsu.api.Logs(jitsu.config);
  jitsu.started = true;

  callback();
};

//
// ### function auth (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Attempts to authenicate the user identified in `jitsu.config.get('username'|'password')`
//
jitsu.auth = function (callback) {
  if (jitsu.skipAuth) {
    return callback();
  }

  var username = jitsu.config.get('username');
  winston.silly('Attempting to authenticate as ' + username.magenta);
  jitsu.users.auth(function (err, success) {
    if (err || !success) {
      winston.error('Unable to Authenticate as ' + username.magenta);
      winston.error(err.message);
      return callback(err);
    }

    jitsu.skipAuth = true;
    winston.info('Authenticated as ' + username.magenta);
    return callback();
  })
}

//
// ### function setupUser (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Prompts the user for their username / password combo, then sets up the jitsu CLI,
// and saves the resulting configuration to disk.
//
jitsu.setupUser = function (callback) {
  winston.warn('You will need to login to continue');
  winston.info('To login, you will need an activated nodejitsu account');
  winston.help('You can create an account using the ' + 'jitsu signup'.magenta + ' command');
  jitsu.setupUserNoWarn(callback);
};

//
// ### function setupUserNoWarn (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Prompts the user for their username / password combo, then sets up the jitsu CLI,
// and saves the resulting configuration to disk without a warning
//
jitsu.setupUserNoWarn = function(callback) {
  //
  // Attempt to get the password three times.
  //
  var tries = 0;

  function offerReset (username) {
    jitsu.prompt.get(['reset'], function (err, res) {
      if (err) {
        return callback(err);
      }
      if (/^y[es]+/i.test(res['request password reset'])) {
        return jitsu.commands.run(['users', 'forgot', username], callback);
      }
      
      callback(new Error('Invalid username / password.'));
    });
  }

  (function setupAuth () {
    jitsu.prompt.get(['username', 'password'], function (err, result) {
      if (err) {
        return callback(err);
      }

      jitsu.config.set('username', result.username);
      jitsu.config.set('password', result.password);
      jitsu.setup(function () {
        jitsu.auth(function (err) {
          //
          // Increment the auth attempts
          //
          tries += 1;

          if (err) {
            if (tries >= 3) {
              winston.error('Three failed login attempts');
              winston.info('Would you like to reset your password?');
              return offerReset(result.username);
            }
            return setupAuth();
          }

          jitsu.config.save(function (err) {
            return err ? callback(err) : callback();
          });
        });
      });
    });
  })();
};

//
// ### function showError (command, err, shallow, skip)
// #### @command {string} Command which has errored.
// #### @err {Error} Error received for the command.
// #### @shallow {boolean} Value indicating if a deep stack should be displayed
// #### @skip {boolean} Value indicating if this error should be forcibly suppressed.
// Displays the `err` to the user for the `command` supplied.
//
jitsu.showError = function (command, err, shallow, skip) {
  var stack;

  if (err.statusCode !== '403' && !skip) {
    winston.error('Error running command ' + command.magenta);
    
    if (!jitsu.config.get('nolog')) {
      jitsu.logFile.log(err);
    }

    if (err.message) {
      winston.error(err.message);
    }

    if (err.result) {
      if (err.result.error) {
        winston.error(err.result.error);
      }

      if (err.result.result && err.result.result.error) {
        if (err.result.result.error.stderr) {
          winston.error('');
          winston.error('There was an error while attempting to start your application.');
          winston.error(err.result.result.error.message);
          if (err.result.result.error.blame) {
            winston.error(err.result.result.error.blame.message);
            winston.error('');
            winston.error('This type of error is usually a ' + err.result.result.error.blame.type + ' error.');
          }
          winston.error('Error output from your application:');
          winston.error('');
          err.result.result.error.stderr.split('\n').forEach(function (line) {
            winston.error(line);
          })
        }
        else if (err.result.result.error.stack && jitsu.config.get('debug')) {
          winston.error('There was an error while attempting to deploy your application.');
          winston.error('');
          winston.error(err.result.result.error.message);
          if (err.result.result.error.blame) {
            winston.error(err.result.result.error.blame.message);
            winston.error('');
            winston.error('This type of error is usually a ' + err.result.result.error.blame.type + ' error.');
          } 
          winston.error('Error output from Haibu:');
          winston.error('');
          stack = err.result.result.error.result || err.result.result.error.stack;
          stack.split('\n').forEach(function (line) {
            winston.error(line);
          });
        }
      }
      else if (err.result.stack) {
        winston.warn('Error returned from Nodejitsu');
        err.result.stack.split('\n').forEach(function (line) {
          winston.error(line);
        })
      }
    }
    else {
      if (err.stack && !shallow) {
        err.stack.split('\n').forEach(function (trace) {
          winston.error(trace);
        });
      }
    }
  }

  winston.info('Nodejitsu '.grey + 'not ok'.red.bold);
};
