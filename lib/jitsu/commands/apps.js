/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');

var apps = exports;

apps.list = function (callback) {
  jitsu.apps.list(function (err, apps) {
    var rows = [['name', 'state', 'subdomain', 'start', 'latest']],
        colors = ['underline', 'yellow', 'green', 'grey', 'red'];
    
    apps.forEach(function (app) {
      rows.push([
        app.name,
        app.state,
        app.subdomain,
        app.scripts.start,
        app.snapshots[0].filename
      ]);
    });
    
    jitsu.log.logRows('data', rows, colors);
  });
};

apps.create = function (name, callback) {
  
};

apps.update = function (name, callback) {
  if (!callback) {
    callback = name;
  }
  
  
};

apps.destroy = function (name, callback) {
  
};

apps.start = function (name, callback) {
  
};

apps.stop = function (name, callback) {
  
};