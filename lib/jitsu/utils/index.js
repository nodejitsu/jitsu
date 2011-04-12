/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('jitsu'),
    util = require('util'),
    eyes = require('eyes'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path');
 
var utils = exports;

utils.base64 = require('./base64');

//
// ### function snapshotTime (name) 
// #### @name {string} Filename for the snapshot
// Returns a formatted date string for the unix time 
// in the snapshot filename.
//
utils.snapshotTime = function (name) {
  var time = name.match(/[\w|\-]+-[\w|\-]+-(\d+)/)[1];
  return utils.formatTime(new Date(parseInt(time, 10)));
};

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
// ### function readPackage (dir, callback)
// #### @dir {string} Directory to read the package.json from
// #### @callback {function} Continuation to pass control to when complete
// Attempts to read the package.json file out of the specified directory.
//
utils.readPackage = function (dir, callback) {
  var file = path.join(dir, 'package.json');
  
  fs.readFile(file, function (err, data) {
    if (err) {
      return callback(err);
    }

    data = data.toString();

    if (!data.length) {
      return callback(new Error('package.json is empty'));
    }

    try {
      callback(null, JSON.parse(data.toString()));
    }
    catch (ex) {
      callback(new Error('Invalid package.json file'));
    }
  });
};

//
// ### function createPackage (dir, callback)
// #### @dir {string} Directory to create the package *.tgz file from
// #### @callback {function} Continuation to pass control to when complete
// Creates a *.tgz package file from the specified directory `dir`.
//
utils.createPackage = function (dir, callback) {
  utils.readPackage(dir, function (err, pkg) {
    if (err) {
      return callback(err);
    }
    
    if (dir.slice(-1) === '/') {
      dir = dir.slice(0, -1);
    }
    
    var parent = path.dirname(dir),
        base = path.basename(dir),
        tarball = path.join(jitsu.config.settings.tmproot, [jitsu.config.username, pkg.name, Date.now()].join('-') + '.tgz'),
        target = fs.createWriteStream(tarball),
        tarargs = ['-cvf', '-', '-C', parent, base],
        tar, gzip, errState;
        
    //
    // TODO (indexzero) Support for `.jitsuignore` files and support for package.json files
    //
    tar = spawn(jitsu.config.settings.tar, tarargs);
    gzip = spawn(jitsu.config.settings.gzipbin, ["--stdout"]);
        
    //
    // TODO (indexzero) Make this piping more robust
    //
    util.pump(tar.stdout, gzip.stdin);
    util.pump(gzip.stdout, target);
    
    target.on("close", function (err, ok) {
      if (errState) {
        return;
      }
      else if (err) {
        return callback(errState = err);
      }
      
      callback(null, pkg, tarball);
    });
  });
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