/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
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
}