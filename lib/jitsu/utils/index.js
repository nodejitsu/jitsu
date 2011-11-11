/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    util = require('util'),
    async = require('async'),
    request = require('request'),
    semver = require('semver'),
    winston = require('winston'),
    jitsu = require('../../jitsu');
 
var utils = exports;

utils.base64 = require('./base64');

//
// ### function formatTime (obj)
// #### @obj {Date} Date to format
// Returns a formatted date string for `obj` in the format
// YYYY/MM/DD HH:MM:SS
//
utils.formatTime = function (obj) {
  var date = [obj.getFullYear(), obj.getMonth() + 1, obj.getDate()].join('/'),
      time = [obj.getHours(), obj.getMinutes(), obj.getSeconds()].join(':');
  
  return [date, time].join(' ');
};

//
// ### function formatApp (app, exclude)  
// #### @app {Object} Application document to format
// #### @exclude {Array} **Optional** List of additional properties to exclude
// Formats the specified `app` by removing unnecessary properties combined with
// any additional properties the caller wishes to `exclude`.
//
utils.formatApp = function (app, exclude) {
  var snapshots = app.snapshots,
      remove = ['_id', '_rev', 'drones', 'id', 'maxDrones', 'resource'];
  
  app.snapshots = !snapshots ? [] : snapshots.map(function (snap) {
    return {
      id: snap.id,
      created: jitsu.utils.formatTime(new Date(snap.ctime))
    }
  });
  
  if (exclude) {
    remove = remove.concat(exclude);
  }
  
  remove.forEach(function (key) {
    delete app[key];
  });
  
  return app;
}

//
// ### function missingKeys (source, target) 
// #### @source {Array} List of keys for the current object
// #### @target {Array} List of keys for the new object
// Returns the complement of the intersection of the two arrays.
//
// e.g. [1,2,3,5], [1,2,3,4,5] => [4]
//
utils.missingKeys = function (source, target) {
  var missing = [];

  source.forEach(function (key) {
    if (target.indexOf(key) === -1) {
      missing.push(key);
    }
  });
  
  return missing;
};

//
// ### function objectDiff (current, update, level) 
// #### @current {Object} Current representation of the object.
// #### @update {Object} Updated representation of the object.
// #### @level {Number} Level in the object we are diffing.
// Returns an incremental diff of the `current` object  
// against the updated representation `update`
//
// e.g. { foo: 1, bar: 2 }, { foo: 2, bar: 2 } => { foo: 2 }
//
utils.objectDiff = function (current, update, level) {
  var ckeys = Object.keys(current),
      ukeys = Object.keys(update),
      diff = {};
  
  //
  // Ignore changes on the first level of the object.
  //
  level = level || 0;
  if (level > 0) {
    utils.missingKeys(ckeys, ukeys).forEach(function (key) {
      diff[key] = undefined;
    });
  }
  
  ukeys.forEach(function (key) {
    var nested, i;
    
    if (!current[key]) {
      diff[key] = update[key];
    }
    else if (Array.isArray(update[key])) {
      if (update[key].length !== current[key].length) {
        diff[key] = update[key];
      }
      else {
        for (i = 0; i < update[key]; i += 1) {
          if (current[key].indexOf(update[key][i]) === -1) {
            diff[key] = update[key];
            break;
          }
        }
      }
    }
    else if (typeof update[key] === 'object') {
      if ((nested = utils.objectDiff(current[key], update[key], level + 1))) {
        diff[key] = update[key];
      }
    }
    else {
      if (current[key] !== update[key]) {
        diff[key] = update[key];
      }
    }
  });
  
  return Object.keys(diff).length > 0 ? diff : null;
};

utils.checkVersion = function (callback) {
  var responded = false
  
  //
  // Check the GitHub tags for `jitsu` to see if the current
  // version is outdated. If it is not make sure to message the user at the end.
  //
  request({
    uri: 'http://registry.npmjs.org/jitsu/latest',
    timeout: 400
  }, function (err, res, body) {
    if (!responded) {
      responded = true;
      
      try {
        var pkg = JSON.parse(body);

        if (semver.gt(pkg.version, jitsu.version)) {
          winston.warn('A newer version of ' + 'jitsu'.magenta + ' is available. ' + 'You should update immediately.');
          winston.help('To install the latest ' + 'jitsu'.magenta + ' type `[sudo] npm install jitsu -g`');
          winston.warn('If you wish to ' + 'continue'.bold + ' without an update you must ' + 'type'.cyan  + ' ' + '\'yes\''.magenta);
          var question = [{
            message: 'Continue without updating? Bad things might happen (no)',
            name: 'ignore'
          }];
          jitsu.prompt.get(question, function(err, result) {
            if (err) return callback();

            callback(result.ignore !== 'yes');
          });
        } else {
          callback();
        }
      }
      catch (ex) {
        //
        // Ignore errors from GitHub. We will notify the user
        // of an upgrade at the next possible opportunity.
        //
        callback();
      }
      
    }
  });
};
