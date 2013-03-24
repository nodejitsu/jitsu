/*
 * logs.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    dateformat = require('dateformat'),
    logs = exports,
    utile = jitsu.common;

logs.usage = [
  'The `jitsu logs` command will display logs related to the app',
  'The default number of lines to show is 10',
  '',
  'Example usages:',
  'jitsu logs all',
  'jitsu logs all <number of lines to show>',
  'jitsu logs app <app name>',
  'jitsu logs app <app name> <number of lines to show>'
];

//
// ### function all (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Queries the log API and retrieves the logs for all of the user's apps
//
logs.all = function (amount, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    amount  = args[0] || null;
  }

  if (!amount) {
    amount = 10;
  }

  jitsu.logs.byUser(jitsu.config.get('username'), amount, function (err, apps) {
    if (err) {
      return callback(err);
    }

    if (apps.length === 0) {
      jitsu.log.warn('No logs for ' + jitsu.config.get('username').magenta + ' from timespan');
      return callback();
    }

    function sortLength (lname, rname) {
      var llength = apps[lname].data.length,
          rlength = apps[rname].data.length;

      if (llength === rlength) {
        return 0;
      }

      return llength > rlength ? 1 : -1;
    }

    Object.keys(apps).sort(sortLength).forEach(function (app) {
      console.log('App: '.grey + app.magenta);
      putLogs(apps[app], app, amount, true);
    });

    callback();
  });
};

logs.all.usage = [
  'Print the logs from all applications. The default number of',
  'lines to show is 10.',
  'jits logs all <number of lines to show>',
  '',
  'Example usage:',
  'jitsu logs all',
  'jitsu logs all 5'
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

  amount = amount || 100;

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
function putLogs (results, appName, amount, showApp) { //TODO: utilize amount and showApp
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

  results.data = results.data.filter(function (item) {
    return item.json && item.json.hasOwnProperty('message');
  });

  if (results.data.length === 0) {
    return jitsu.log.warn('No logs for ' + appName.magenta + ' in specified timespan');
  }

  var logLength = jitsu.config.get('loglength'),
      logged = 0;

  function sort(first, second) {
    return new Date(first.timestamp) - new Date(second.timestamp);
  }

  results.data.sort(sort).forEach(function (datum) {
    if (datum.json && datum.json.message !== null && datum.json.app !== null && RegExp('^' + appName + '$').test(datum.json.app)) {
      // '[' + datum.json.app.magenta + ']
      datum.json.message.split('\n').forEach(function (line) {
        var now = new Date(datum.timestamp);
        now = dateformat(now, "mm/dd HH:MM:ss Z");
        if (line.length) {
          console.log('[' + now.toString().yellow + '] ' + line);
        }
      });
    }
  });
}
