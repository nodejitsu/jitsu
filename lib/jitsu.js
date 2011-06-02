/*
 * jitsu.js: Top-level include for the jitsu module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(__dirname);

var jitsu = exports,
    auth = false,
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

jitsu.version       = [0, 3, 5];
jitsu.utils         = require('jitsu/utils');
jitsu.package       = require('jitsu/package');
jitsu.log           = require('jitsu/log');
jitsu.api           = {};
jitsu.api.Client    = require('jitsu/api/client').Client;
jitsu.api.Apps      = require('jitsu/api/apps').Apps;
jitsu.api.Snapshots = require('jitsu/api/snapshots').Snapshots;
jitsu.api.Users     = require('jitsu/api/users').Users;
jitsu.prompt        = require('jitsu/prompt');
jitsu.config        = require('jitsu/config');
jitsu.commands      = require('jitsu/commands');

//
// Alias the appropriate commands for simplier CLI usage
//
jitsu.commands.alias('create', { resource: 'apps', command: 'create' });
jitsu.commands.alias('deploy', { resource: 'apps', command: 'deploy' });
jitsu.commands.alias('list',   { resource: 'apps', command: 'list' });
jitsu.commands.alias('conf',   { resource: 'config', command: 'list' });
jitsu.commands.alias('logout', { resource: 'users', command: 'logout' });


var eyes = require('eyes'),
    winston = require('winston'),
    colors = require('colors');

//
// ### function start (command, callback)
// #### @command {string} Command to execute once started
// #### @callback {function} Continuation to pass control to when complete.
// Starts the jitsu CLI and runs the specified command.
//
jitsu.start = function (argv, callback) {
  var command = argv._;

  if(argv.version || argv.v) {
    console.log('v' + jitsu.version.join('.'));
    process.exit(0);
  }

  // Setup the initial prompt but don't leave it open
  jitsu.prompt.start().pause();
  
  //
  // Default to the `help` command.
  //
  command[0] || (command[0] = 'help');
  
  winston.info('Welcome to ' + 'Nodejitsu'.grey);
  winston.info('It worked if it ends with ' + 'Nodejitsu'.grey + ' ok'.green.bold);
  jitsu.utils.checkVersion(function () {
    var username = jitsu.config.get("username")
    if (!username && jitsu.commands.requiresAuth(command[0])) {
      return jitsu.setupUser(function (err) {
        if (err) {
          return callback(err);
        }

        winston.info('Successfully configured user ' + username.magenta);
        return command.length > 0 ? jitsu.exec(command, callback) : callback();
      });
    }

    return jitsu.exec(command, callback)
  });
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
    
    winston.info('Executing command ' + command.join(' ').magenta);
    jitsu.commands.run(command, function (err, shallow) {
      if (err) {
        return jitsu.showError(command.join(' '), err, shallow);
      }

      //
      // TODO (indexzero): Something here
      //
      callback();
    });
  }
  
  return !started ? jitsu.setup(execCommand) : execCommand();
};

//
// ### function setup (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Sets up the instances of the Resource clients for jitsu and tests
// the username/password combo for the authenticated user.
//
jitsu.setup = function (callback) {
  if (!started) {
    jitsu.config.load(function(err,store){
      jitsu.users = new jitsu.api.Users(store);
      jitsu.apps = new jitsu.api.Apps(store);
      jitsu.snapshots = new jitsu.api.Snapshots(store);
      started = true;
      callback();
    });
  }
  
  else callback();
};

//
// ### function auth (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Attempts to authenicate the user identified in `jitsu.config.get("username"|"password")`
//
jitsu.auth = function (callback) {
  if (auth) {
    return callback();
  }
  var username = jitsu.config.get("username");
  winston.silly('Attempting to authenticate as ' + username.magenta);
  jitsu.users.auth(function (err, success) {
    if (err || !success) {
      winston.error('Unable to Authenticate as ' + username.magenta);
      winston.error(err.message);
      return callback(err);
    } 
    
    auth = true;
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
  winston.info('No user has been setup on this machine');
  jitsu.prompt.get(['username', 'password'], function (err, result) {
    jitsu.config.set("username", result.username)
    jitsu.config.set("password", result.password)
    jitsu.setup(function () {
      jitsu.auth(function (err) {
        if (err) {
          return callback(err);
        }

        jitsu.config.save(function (err) {
          return err ? callback(err) : callback();
        });
        return undefined;
      });
    });
  });
};

jitsu.showError = function (command, err, shallow, skip) {
  if (err.statusCode !== '403' && !skip) {
    winston.error('Error running command ' + command.magenta);
    
    if (err.message) {
      winston.error(err.message);
    }
    
    if (err.result && err.result.error) {
      winston.error(err.result.error);
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