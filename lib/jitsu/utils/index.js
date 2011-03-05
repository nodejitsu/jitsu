/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var fs = require('fs'),
    path = require('path');
 
var utils = exports;

utils.base64 = require('./base64');

utils.snapshotTime = function (name) {
  var time = name.match(/[\w|\-]+-[\w|\-]+-(\d+)/)[1];
  return utils.formatTime(new Date(parseInt(time)));
};

utils.formatTime = function (obj) {
  var date = [obj.getFullYear(), obj.getMonth(), obj.getDate()].join('/'),
      time = [obj.getHours(), obj.getMinutes(), obj.getSeconds()].join(':');
  
  return [date, time].join(' ');
};

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