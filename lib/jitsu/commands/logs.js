/*
 * logs.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var winston = require('winston'),
    jitsu = require('jitsu');

var logs = exports;

logs.usage = [
  'The `jitsu logs` commands allow you to read the logs related to your app.',
  'The default number of lines to show is 10.',
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
  if (callback === undefined) {
    callback = amount;
    amount = 10;
  }

  jitsu.logs.byUser(amount, function (err, results) {
    if (err) {
      callback(err);
    }
    else {
      var logs = false;
      for (key in results) {
        for (var i = 0; i < results[key].data.length; ++i) {
          logs = true;
          var data = parse(results[key].data[i].text);
          winston[data.level](results[key].data[i].timestamp.blue +
               ' ' + data['app'].yellow +
               ' ' + data['message']);
        }
      }

      if (!logs) {
        winston.info('No logs from timespan');
      }

      callback();
    }
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
]

//
// ### function app (appName, callback)
// #### @appName {string} the application to get the logs for
// #### @callback {function} Continuation to pass control to when complete.
// Queries the log API and retrieves the logs for the specified application
//
logs.app = function (appName, amount, callback) {
  if (callback === undefined) {
    callback = amount;
    amount = 10;
  }

  jitsu.logs.byApp(appName, amount, function (err, results) {
    if (err) {
      callback(err);
    }
    else {
      for (var i = 0; i < results.data.length; ++i) {
        var data = parse(results.data[i].text);
        winston[data.level](results.data[i].timestamp.blue +
              ' ' + data['app'].yellow +
              ' ' + data['message']);
      }

      if (results.data.length === 0) {
        winston.info('No logs from timespan');
      }

      callback();
    }
  });
}

logs.app.usage = [
  'Print the logs from specified application. The default number of',
  'lines to show is 10.',
  'jits logs app <app name> <number of lines to show>',
  '',
  'Example usage:',
  'jitsu logs app test',
  'jitsu logs app test 40'
]

//
// ### function parse (string)
// #### @string {string} string from logs
// It parses the output from the logs into an object
//
var parse = function (string) {
  var pairs = string.split(',');
  var obj = {};
  for (var i = 0; i < pairs.length; ++i) {
    var pair_split = pairs[i].split('=');
    obj[pair_split[0]] = pair_split[1];
  }
  return obj;
}

