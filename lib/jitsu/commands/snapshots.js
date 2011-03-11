/*
 * snapshots.js: Commands related to snapshots resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');

var snapshots = exports;

snapshots.usage = [
  '`jitsu snapshots *` commands allow you to work with snapshots',
  'for your Applications on Nodejitsu. Snapshots are images of your',
  'Application\'s code that are deployed to the Nodejitsu Platform.',
  'Valid commands are: ',
  '',
  'jitsu snapshots create',
  'jitsu snapshots list    <name>',
  'jitsu snapshots destroy <count>',
  '',
  'For commands that take a <name> parameter, if no parameter',
  'is supplied, jitsu will attempt to read the package.json',
  'from the current directory.'
]

//
// ### function list (name, callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Lists the snapshots for the application belonging for the authenticated user.
// If `name` is not supplied the value for name in `package.name` will be used.
//
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
      if (err) {
        return callback(err, true);
      }
      
      if (snapshots && snapshots.length > 0) {
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
      }
      else {
        winston.warn('No snapshots for application ' + name.magenta);
      }
      
      callback();
    });
  }
  
  executeList();
};

//
// Usage for `jitsu snapshots list [<name>]`
//
snapshots.list.usage = [
  'Lists all snapshots associated with the application in the',
  'current directory or the application with <name>, if supplied',
  '',
  'jitsu snapshots list',
  'jitsu snapshots list <name>'
];

//
// ### function create (name, callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Creates a snapshots for the application belonging for the authenticated user
// using the data in the current directory. If `name` is not supplied the
// value for name in `package.name` will be used.
//
snapshots.create = function (name, callback) {    
  //
  // TODO (indexzero): Ensure `snapshot create ../../` works 
  //
  jitsu.utils.createPackage(process.cwd(), function (err, pkg, filename) {
    if (!callback) {
      callback = name;
      name = null;
    }
    
    name = name || pkg.name;
    winston.info('Creating snapshot for ' + name.magenta);
    winston.silly('Filename: ' + filename);
    jitsu.snapshots.create(name, filename, function (err, snapshots) {
      winston.info('Done creating snapshot ' + name.magenta);
      return err ? callback(err) : callback();
    });
  });
};

//
// ### function destroy (count, callback)
// #### @count {string} **optional** Number of snapshots to destroy
// #### @callback {function} Continuation to pass control to when complete.
// Destroys the specified number of snapshots for the application in the current
// directory. If `count` is not supplied one snapshot will be destroyed. 
//
snapshots.destroy = function (count, callback) {
  
};