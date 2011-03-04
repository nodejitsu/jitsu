/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('jitsu');

var apps = exports;

apps.list = function (callback) {
  jitsu.apps.list(function (err, apps) {
    apps.forEach(function (app) {
      require('eyes').inspect(app);
    })
  });
};