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
  'jitsu snapshots list',
  'jitsu snapshots list <app-name>',
  'jitsu snapshots activate',
  'jitsu snapshots activate <app-name>',
  'jitsu snapshots destroy',
  'jitsu snapshots destroy <app-name>',
  '',
  'For commands that take a <name> parameter, if no parameter',
  'is supplied, jitsu will attempt to read the package.json',
  'from the current directory.'
];

//
// ### function list (name, callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Lists the snapshots for the application belonging for the authenticated user.
// If `name` is not supplied the value for name in `package.name` will be used.
//
snapshots.list = function (name, callback) {
  function executeList() {
    jitsu.snapshots.list(name, function (err, snapshots) {
      if (err) {
        return callback(err, true);
      }
    
      if (snapshots && snapshots.length > 0) {
        var rows = [['name', 'created', 'md5']],
            colors = ['underline', 'underline', 'underline'];

        snapshots.forEach(function (snap) {
          rows.push([
            snap.id,
            jitsu.utils.snapshotTime(snap.filename),
            snap.md5
          ]);
        });

        jitsu.log.logRows('data', rows, colors);
      }
      else {
        winston.warn('No snapshots for application ' + name.magenta);
      }
    
      callback(null, snapshots, name);
    });
  }
  
  if (!callback) {
    callback = name;
    return jitsu.utils.tryReadPackage(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeList();
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
  'jitsu snapshots list <app-name>'
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
  //winston.info('Once a Snapshot of your application is created you can roll back and activate that Snapshot at any time.'.cyan);
  jitsu.prompt.get(['snapshot'], function (err, result) {
    jitsu.utils.packageDir(process.cwd(), function (err, pkg, filename) {
      if (!callback) {
        callback = name;
        name = null;
      }

      name = name || pkg.name;
      winston.info('Creating snapshot for ' + name.magenta);
      winston.silly('Filename: ' + filename);
      jitsu.snapshots.create(name, result.snapshot, filename, function (err, snapshots) {
        winston.info('Done creating snapshot ' + name.magenta);
        return err ? callback(err) : callback(null, result.snapshot);
      });
    });
  });
};

snapshots.create.usage = [
  'Creates a snapshot for the application in the current directory',
  '',
  'jitsu snapshots create',
  'jitsu snapshots create <app-name>'
];

snapshots.activate = function (name, callback) {
  var args = [name];
  
  if (!callback) {
    callback = name;
    name = null;
    args = []; 
  }
  
  function executeActivate (err, snapshots, name) {
    jitsu.prompt.get(['snapshot'], function (err, result) {
      var snapshot = snapshots.filter(function (snap) {
        return snap.id === result.snapshot;
      })[0];
      
      if (!snapshot) {
        return callback(new Error('Cannot find snapshot with name: ' + result['snapshot'].magenta), true);
      }
      
      jitsu.snapshots.activate(name, snapshot.id, callback);
    });
  }
  
  snapshots.list.apply(null, args.concat(executeActivate));
};

snapshots.activate.usage = [
  'Activates a snapshot for the application in the current directory',
  '',
  'jitsu snapshots activate',
  'jitsu snapshots activate <app-name>'
];

//
// ### function destroy (appName, callback)
// #### @count {string} **optional** Number of snapshots to destroy
// #### @callback {function} Continuation to pass control to when complete.
// Destroys the specified number of snapshots for the application in the current
// directory. If `count` is not supplied one snapshot will be destroyed. 
//
snapshots.destroy = function (name, callback) {
  var args = [name];
  
  if (!callback) {
    callback = name;
    name = null;
    args = []; 
  }
  
  function executeDestroy (err, snapshots, name) {
    jitsu.prompt.get(['snapshot'], function (err, result) {
      var snapshot = snapshots.filter(function (snap) {
        return snap.id === result.snapshot;
      })[0];
      
      if (!snapshot) {
        return callback(new Error('Cannot find snapshot with name: ' + result['snapshot'].magenta), true);
      }
      
      jitsu.snapshots.destroy(name, snapshot.id, callback);
    });
  }
  
  snapshots.list.apply(null, args.concat(executeDestroy));
};

snapshots.destroy.usage = [
  'Destroys a snapshot for the application in the current directory',
  '',
  'jitsu snapshots destroy',
  'jitsu snapshots destroy <app-name>'
];