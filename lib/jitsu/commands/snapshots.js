/*
 * snapshots.js: Commands related to snapshots resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('jitsu');

var snapshots = exports;

snapshots.list = function (name, callback) {
  if (!callback) {
    callback = name;
    return jitsu.utils.readPackage(process.cwd(), function (err, package) {
      name = package.name;
      executeList();
    });
  }
  
  function executeList () {
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

      jitsu.log.logRows('data', rows, colors);
      callback();
    });
  }
  
  executeList();
};

snapshots.create = function (name, callback) {
  
};

snapshots.destroy = function (name, callback) {
  
};