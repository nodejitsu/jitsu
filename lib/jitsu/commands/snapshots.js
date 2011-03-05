/*
 * snapshots.js: Commands related to snapshots resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('jitsu');

var snapshots = exports;

snapshots.list = function (name, callback) {
  jitsu.snapshots.list(name, function (err, snapshots) {
    var rows = [['filename', 'created', 'md5']],
        colors = ['underline', 'yellow', 'grey'];
    
    snapshots.forEach(function (snap) {
      rows.push([
        snap.filename,
        jitsu.utils.snapshotTime(snap.filename),
        snap.md5
      ]);
    });
    
    console.log(jitsu.log.stringifyRows(rows, colors));
  });
};

snapshots.create = function (name, callback) {
  
};

snapshots.destroy = function (name, callback) {
  
};