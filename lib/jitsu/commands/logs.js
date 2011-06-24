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
  '`jitsu logs *` commands allow you to work with the log api',
  '',
  'jitsu logs all',
  'jitsu logs app <app name>',
];

var parse = function (string) {
  var pairs = string.split(',');
  var obj = {}
  for (var i = 0; i < pairs.length; ++i) {
      var pair_split = pairs[i].split('=');
      obj[pair_split[0]] = pair_split[1];
  }
  return obj;
}

logs.all = function (databaseType, databaseName, callback) {
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
      callback();
    }
  });
};

logs.all.usage = [
  'Print the logs from all applications',
  '',
  'Example usage:',
  'jitsu logs all',
]

logs.app = function (databaseName, callback) {
  jitsu.logs.byApp(databaseName, function (err, results) {
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
