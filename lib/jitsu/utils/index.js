/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('jitsu'),
    util = require('util'),
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
  return utils.formatTime(new Date(parseInt(time)));
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
    
    try {
      callback(null, JSON.parse(data.toString()));
    }
    catch (ex) {
      callback(ex);
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
    
    if (dir.slice(-1) === '/') dir = dir.slice(0, -1);
    var parent = path.dirname(dir),
        base = path.basename(dir),
        tarball = path.join(jitsu.config.settings.tmproot, [jitsu.config.username, pkg.name, Date.now()].join('-') + '.tgz'),
        target = fs.createWriteStream(tarball),
        tarargs = ['-cvf', '-', '--exclude', '.git', '-C', parent, base];
        
    //
    // TODO (indexzero) Support for `.jitsuignore` files and support for package.json files
    //
    var tar = spawn(jitsu.config.settings.tar, tarargs), 
        gzip = spawn(jitsu.config.settings.gzipbin, ["--stdout"]), 
        errState;
        
    //
    // TODO (indexzero) Make this piping more robust
    //
    util.pump(tar.stdout, gzip.stdin);
    util.pump(gzip.stdout, target);
    
    target.on("close", function (err, ok) {
      if (errState) {
        return
      }
      else if (err) {
        return callback(errState = err)
      }
      
      callback(null, pkg, tarball);
    });
  });
};