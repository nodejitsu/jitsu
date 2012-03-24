/*
 * jitsu.js: Top-level include for the jitsu module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    colors = require('colors'),
    flatiron = require('flatiron');

var jitsu = module.exports = flatiron.app;

//
// Setup `jitsu` to use `pkginfo` to expose version
//
require('pkginfo')(module, 'name', 'version');

//
// Configure jitsu to use `flatiron.plugins.cli`
//
jitsu.use(flatiron.plugins.cli, {
  version: true,
  usage: require('./jitsu/usage'),
  source: path.join(__dirname, 'jitsu', 'commands'),
  argv: {
    version: {
      alias: 'v',
      description: 'print jitsu version and exit',
      string: true
    },
    localconf: {
      description: 'search for .jitsuconf file in ./ and then parent directories',
      string: true
    },
    jitsuconf: {
      alias: 'j', 
      description: 'specify file to load configuration from',
      string: true
    },
    noanalyze: {
      description: 'skip require-analyzer: do not attempt to dynamically detect dependencies',
      boolean: true
    },
    colors: {
      description: '--no-colors will disable output coloring',
      default: true,
      boolean: true
    },
    release: {
      alias: 'r',
      description: 'specify release version number or semantic increment (build, patch, minor, major)',
      string: true
    },
    raw: {
      description: 'jitsu will only output line-delimited raw JSON ( useful for piping )',
      boolean: true
    }
  }
});

jitsu.options.log = {
  console: {
    raw: jitsu.argv.raw
  }
};

//
// Setup config, users, command aliases and prompt settings
//
jitsu.prompt.properties = flatiron.common.mixin(
  jitsu.prompt.properties, 
  require('./jitsu/properties')
);
jitsu.prompt.override   = jitsu.argv;
require('./jitsu/config');
require('./jitsu/alias');
require('./jitsu/commands');

//
// Setup other jitsu settings.
//
jitsu.started  = false;
jitsu.common   = require('./jitsu/common');
jitsu.package  = require('./jitsu/package');
jitsu.logFile  = new (require('./jitsu/common/logfile').LogFile)(path.join(process.env.HOME, '.jitsulog'));

//
// Hoist `jitsu.api` from `nodejitsu-api` module.
//
jitsu.api               = {};
jitsu.api.Client        = require('nodejitsu-api').Client;
jitsu.api.Apps          = require('nodejitsu-api').Apps;
jitsu.api.Databases     = require('nodejitsu-api').Databases;
jitsu.api.Logs          = require('nodejitsu-api').Logs;
jitsu.api.Snapshots     = require('nodejitsu-api').Snapshots;
jitsu.api.Users         = require('nodejitsu-api').Users;

//
// ### function welcome ()
// Print welcome message.
//
jitsu.welcome = function () {
  jitsu.log.info('Welcome to ' + 'Nodejitsu'.grey);
  jitsu.log.info('It worked if it ends with ' + 'Nodejitsu'.grey + ' ok'.green.bold);
};

//
// ### function start (command, callback)
// #### @command {string} Command to execute once started
// #### @callback {function} Continuation to pass control to when complete.
// Starts the jitsu CLI and runs the specified command.
//
jitsu.start = function (callback) {  
  //
  // Check for --no-colors/--colors option, without hitting the config file
  // yet
  //
  var useColors = (typeof jitsu.argv.colors == 'undefined' || jitsu.argv.colors);

  useColors || (colors.mode = "none");

  jitsu.common.checkVersion(function (err) {
    if (err) {
      return callback();
    }
    
    jitsu.init(function (err) {
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
      if ( !jitsu.config.get('colors') || !useColors ) {
        colors.mode = "none";
        jitsu.log.get('default').stripColors = true;
        jitsu.log.get('default').transports.console.colorize = false;
      }

      jitsu.welcome();

      var username = jitsu.config.get('username');
      if (!username && jitsu.config.get('requiresAuth').indexOf(jitsu.argv._[0]) !== -1) {
        return jitsu.commands.users.login(function (err) {
          if (err) {
            callback(err);
            return jitsu.showError.apply(jitsu, [command[0]].concat(arguments));
          }

          var username = jitsu.config.get('username');
          jitsu.log.info('Successfully configured user ' + username.magenta);
          return jitsu.exec(jitsu.argv._, callback);
        });
      }

      return jitsu.exec(jitsu.argv._, callback);
    });
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

    //
    // Remark: This is a temporary fix for aliasing init=>install,
    // was having a few issues with the alias command on the install resource
    //
    if (command[0] === 'init') {
      command[0] = 'install';
    }

    // Alias db to databases
    if (command[0] === 'db') {
      command[0] = 'databases';
    }

    // Allow `jitsu logs` as a shortcut for `jitsu logs app`
    if (command[0] === 'logs' && command.length === 1) {
      command[1] = 'app';
    }

    jitsu.log.info('Executing command ' + command.join(' ').magenta);
    jitsu.router.dispatch('on', command.join(' '), jitsu.log, function (err, shallow) {
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

  ['Users', 'Apps', 'Snapshots', 'Databases', 'Logs'].forEach(function (key) {
    var k = key.toLowerCase();
    jitsu[k] = new jitsu.api[key](jitsu.config);
    jitsu[k].on('debug::request',  debug);
    jitsu[k].on('debug::response', debug);
    function debug (data) {
      if (jitsu.argv.debug || jitsu.config.get('debug')) {
        //
        // TODO: replace with custom logger method
        //
        console.log(data);
      }
    };
  });

  jitsu.started = true;
  callback();
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
  var username,
      stack;

  if (err.statusCode === '403') {
    username = jitsu.config.get('username');
    if (username) {
      jitsu.log.error('Unable to authenticate as: ' + username.magenta);
    }
    
    jitsu.log.error('403 ' + err.result.error);    
  }
  else if (!skip) {
    jitsu.log.error('Error running command ' + command.magenta);
    
    if (!jitsu.config.get('nolog')) {
      jitsu.logFile.log(err);
    }

    if (err.message) {
      jitsu.log.error(err.message);
    }

    if (err.result) {
      if (err.result.error) {
        jitsu.log.error(err.result.error);
      }

      if (err.result.result && err.result.result.error) {
        if (err.result.result.error.stderr || err.result.result.error.stdout) {
          jitsu.log.error('');
          jitsu.log.error('There was an error while attempting to start your application.');
          jitsu.log.error(err.result.result.error.message);
          if (err.result.result.error.blame) {
            jitsu.log.error(err.result.result.error.blame.message);
            jitsu.log.error('');
            jitsu.log.error('This type of error is usually a ' + err.result.result.error.blame.type + ' error.');
          }
          
          jitsu.log.error('Error output from your application:');
          jitsu.log.error('');
          if (err.result.result.error.stdout) {
            err.result.result.error.stdout.split('\n').forEach(function (line) {
              jitsu.log.error(line);
            });
          }
          
          if (err.result.result.error.stderr) {
            err.result.result.error.stderr.split('\n').forEach(function (line) {
              jitsu.log.error(line);
            });
          }
        }
        else if (err.result.result.error.stack && jitsu.config.get('debug')) {
          jitsu.log.error('There was an error while attempting to deploy your application.');
          jitsu.log.error('');
          jitsu.log.error(err.result.result.error.message);
          
          if (err.result.result.error.blame) {
            jitsu.log.error(err.result.result.error.blame.message);
            jitsu.log.error('');
            jitsu.log.error('This type of error is usually a ' + err.result.result.error.blame.type + ' error.');
          } 
          
          jitsu.log.error('Error output from Haibu:');
          jitsu.log.error('');
          stack = err.result.result.error.result || err.result.result.error.stack;
          stack.split('\n').forEach(function (line) {
            jitsu.log.error(line);
          });
        }
      }
      else if (err.result.stack) {
        jitsu.log.warn('Error returned from Nodejitsu');
        err.result.stack.split('\n').forEach(function (line) {
          jitsu.log.error(line);
        });
      }
    }
    else {
      if (err.stack && !shallow) {
        err.stack.split('\n').forEach(function (trace) {
          jitsu.log.error(trace);
        });
      }
    }
  }

  jitsu.log.info('Nodejitsu '.grey + 'not ok'.red.bold);
};
