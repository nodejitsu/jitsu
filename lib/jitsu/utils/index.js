/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var util = require('util'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    request = require('request'),
    winston = require('winston'),
    semver = require('semver'),
    jitsu = require('jitsu');
 
var utils = exports;

utils.base64 = require('./base64');

//
// ### function formatTime (obj)
// #### @obj {Date} Date to format
// Returns a formatted date string for `obj` in the format
// YYYY/MM/DD HH:MM:SS
//
utils.formatTime = function (obj) {
  var date = [obj.getFullYear(), obj.getMonth(), obj.getDate()].join('/'),
      time = [obj.getHours(), obj.getMinutes(), obj.getSeconds()].join(':');
  
  return [date, time].join(' ');
};

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
  // Only allow the `checkVersion` function 200ms
  // to attempt to contact GitHub.
  //
  setTimeout(function () {
    if (!responded) {
      responded = true;
      callback();
    }
  }, 200);
  
  //
  // Check the GitHub tags for `jitsu` to see if the current
  // version is outdated.
  //
  request({
    uri: 'http://github.com/api/v2/json/repos/show/nodejitsu/jitsu/tags'
  }, function (err, res, body) {
    if (!responded) {
      responded = true;
      
      try {
        var results = JSON.parse(body),
            latest = Object.keys(results.tags).map(function (ver) {
              return ver.slice(1);
            }).pop();

        if (latest > jitsu.version.join('.')) {
          winston.warn('A newer version of jitsu is available: ' + latest.magenta);
          winston.warn('Please run `npm update jitsu`');
        }
      }
      catch (ex) {
        //
        // Ignore errors from GitHub. We will notify the user
        // of an upgrade at the next possible opportunity.
        //
      }

      callback();
    }
  });
};