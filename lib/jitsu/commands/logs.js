/*
 * logs.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    util = require('util'),
    dateformat = require('dateformat'),
    logs = exports,
    utile = jitsu.common;

logs.usage = [
  'The `jitsu logs` command will display logs related to the app',
  'The default number of lines to show is 10',
  '',
  'Example usages:',
  'jitsu logs tail',
  'jitsu logs app <app name>',
  'jitsu logs app <app name> <number of lines to show>'
];

//
// ### function tail (appName, callback)
// #### @appName {string} the application to get the logs for
// #### @callback {function} Continuation to pass control when complete.
// Queries the log API using live streaming
//
logs.tail = function (appName, callback) {
  //
  // This is defined so that it can get called once all the arguments are
  // sorted out.
  //

  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
  }

  function tail(appName, callback) {
    jitsu.apps.view(appName, function (err) {
      if (err) {
        return err.statusCode === 404
          ? callback(new Error('Application not found.'), true)
          : callback(err);
      }

      var amount = 10;
      jitsu.logs.byApp(appName, amount, function (err, results) {
        if (err) {
          return callback(err);
        }

        jitsu.log.info('Listing logs for ' + appName.magenta);

        putLogs(results, appName, amount);

        jitsu.logs.live(appName, function (err, socket) {
          if (err) return callback(err);

          socket.on('data', printLog);
          socket.on('error', function (err) {
            return callback(err);
          });
        });
      });
    });
  }

  function getAppName(callback) {
    jitsu.package.read(process.cwd(), function (err, pkg) {
      if (!err) {
        jitsu.log.info('Attempting to load logs for ' + (process.cwd()+ '/package.json').grey);
        return callback(null, pkg.name);
      }
      callback(err);
    });
  }

  if (!appName) {
    getAppName(function (err, name) {
      if (err) {
        jitsu.commands.list(function () {
          jitsu.log.info('Which application to view ' + 'logs'.magenta + ' for?');
          jitsu.prompt.get(["app name"], function (err, result) {
            if (err) {
              jitsu.log.error('Prompt error:');
              return callback(err);
            }
            appName = result["app name"];
            tail(appName, callback);
          });
        })
      } else {
        tail(name, callback);
      }
    });
  } else {
     tail(appName, callback);
  }
};

logs.tail.usage = [
  'The `jitsu logs tail` command will display logs in a live mode',
  'jitsu logs tail <app name>',
  '',
  'Example usages:',
  'jitsu logs tail',
  'jitsu logs tail app'
];

//
// ### function app (appName, callback)
// #### @appName {string} the application to get the logs for
// #### @callback {function} Continuation to pass control to when complete.
// Queries the log API and retrieves the logs for the specified application
//
logs.app = function (appName, amount, callback) {
  //
  // This is defined so that it can get called once all the arguments are
  // sorted out.
  //

  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
    amount   = args[1] || null;
  }

  function byApp(appName, amount, callback) {
    jitsu.apps.view(appName, function (err) {
      if (err) {
        return err.statusCode === 404
          ? callback(new Error('Application not found.'), true)
          : callback(err);
      }

      jitsu.logs.byApp(appName, amount, function (err, results) {
        if (err) {
          return callback(err);
        }

        jitsu.log.info('Listing logs for ' + appName.magenta);

        putLogs(results, appName, amount);
        callback();
      });
    });
  }

  function getAppName(callback) {
    jitsu.package.read(process.cwd(), function (err, pkg) {
      if (!err) {
        jitsu.log.info('Attempting to load logs for ' + (process.cwd()+ '/package.json').grey);
        return callback(null, pkg.name);
      }
      callback(err);
    });
  }

  amount = amount || 10;

  if (!appName) {
    getAppName(function (err, name) {
      if (err) {
        jitsu.commands.list(function () {
          jitsu.log.info('Which application to view ' + 'logs'.magenta + ' for?');
          jitsu.prompt.get(["app name"], function (err, result) {
            if (err) {
              jitsu.log.error('Prompt error:');
              return callback(err);
            }
            appName = result["app name"];
            byApp(appName, amount, callback);
          });
        })
      } else {
        byApp(name, amount, callback);
      }
    });
  } else {
     byApp(appName, amount, callback);
  }

}

logs.app.usage = [
  'Print the logs from specified application. The default number of',
  'lines to show is 10.',
  'jits logs app <app name> <number of lines to show>',
  '',
  'Example usage:',
  'jitsu logs app test',
  'jitsu logs app test 40'
];

//
// ### function putLogs (results, appName, amount, showApp)
// #### @results {Object} Logs object to output.
// #### @appName {string} App name associated with the log text.
// #### @showApp {boolean} Value indicating if the app name should be output.
// Parses, formats, and outputs the specified `results` to the user.
//
function putLogs (results, appName) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    results  = args[0] || null;
    appName  = args[1] || null;
    amount   = args[2] || null;
    showApp  = args[3] || null;
  }

  if(appName.indexOf('/') !== -1){
    //username = appName.split('/')[0];
    appName = appName.split('/')[1];
  }

  if (!results || results.length === 0) {
    return jitsu.log.warn('No logs for ' + appName.magenta + ' in specified timespan');
  }

  var logLength = jitsu.config.get('loglength'),
      logged = 0;

  results.reverse().forEach(printLog);
}

function printLog(datum) {
  if (datum && datum.description !== null) {

    if (jitsu.argv.raw) {
      return console.log(JSON.stringify(datum));
    }

    datum.description.split('\n').forEach(function (line) {
      var now = new Date(datum.time * 1000);
      now = dateformat(now, "mm/dd HH:MM:ss Z");

      var type = (datum.service === 'logs/stderr') ? "err".red : "out".green;

      if (line.length) {
        console.log(util.format('[%s][%s] %s', now.toString().yellow, type, line));
      }
    });
  }
}
