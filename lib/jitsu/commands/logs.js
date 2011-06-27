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
  'The `jitsu logs` commands allow you to read the logs related to your app',
  '',
  'Example usages:',
  'jitsu logs all',
  'jitsu logs app <app name>'
];

//
// ### function all (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Queries the log API and retrieves the logs for all of the user's apps
//
logs.all = function (callback) {
  jitsu.logs.byUser( function (err, results) {
    if (err) {
      callback(err);
    }
    else {
      for (key in results) {
        for (var i = 0; i < results[key].data.length; ++i) {
          var data = parse(results[key].data[i].text);
          winston.info(results[key].data[i].timestamp.blue +
               ' ' + data['app'].yellow +
               ' ' + data['message']);
        }
      }

      if (results.data.length === 0) {
        winston.info('No logs from timespan');
      }

      callback();
    }
  });
};

logs.all.usage = [
  'Print the logs from all applications',
  '',
  'Example usage:',
  'jitsu logs all'
]

//
// ### function app (appName, callback)
// #### @appName {string} the application to get the logs for
// #### @callback {function} Continuation to pass control to when complete.
// Queries the log API and retrieves the logs for the specified application
//
logs.app = function (appName, callback) {
  jitsu.logs.byApp(appName, function (err, results) {
    if (err) {
      callback(err);
    }
    else {
      for (var i = 0; i < results.data.length; ++i) {
        var data = parse(results.data[i].text);
        winston.info(results.data[i].timestamp.blue +
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
  'Print the logs from specified application',
  '',
  'Example usage:',
  'jitsu logs app <database name>'
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

