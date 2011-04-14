/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var eyes = require('eyes'),
    winston = require('winston'),
    jitsu = require('jitsu');

var apps = exports;

apps.usage = [
  '`jitsu apps *` commands allow you to work with your',
  'Applications on Nodejitsu. Valid commands are:',
  '',
  'jitsu apps create',
  'jitsu apps list',
  'jitsu apps deploy',
  'jitsu apps view    <name>',
  'jitsu apps update  <name>',
  'jitsu apps destroy <name>',
  'jitsu apps start   <name>',
  'jitsu apps restart <name>',
  'jitsu apps stop    <name>',
  '',
  'For commands that take a <name> parameter, if no parameter',
  'is supplied, jitsu will attempt to read the package.json',
  'from the current directory.'
];

apps.deploy = function (callback) {
  jitsu.utils.getPackage(process.cwd(), function (err, pkg) {

    if (err) {
      winston.error(err);
      //winston.info('Generating new package.json for your app');
      return callback(new Error(), true);
    }

    if (!pkg.name) {
      winston.error('Cannot deploy application with no name. Add a name property to local package.json');
      return callback(new Error(), true);
    }
    
    function checkStarted (err, existing) {
      if (err) {
        winston.error('Error creating snapshot for app ' + pkg.name.magenta);
        winston.error(err.message);
        return callback(new Error(), true);
      }
      
      if (existing.state === 'started') {
        apps.stop(existing.name, function (err) {
          return err ? callback(err) : apps.start(existing.name, callback);
        });
      }
      else {
        apps.start(existing.name, callback);
      }
    }
    
    function checkSnapshots (err, existing) {
      if (err) {
        winston.error('Error creating app ' + pkg.name.magenta + ': ' + err.message.red);
        return callback(new Error(), true);
      }
      
      winston.warn('Creating new snapshot, name is required.'.yellow);
      jitsu.commands.commands.snapshots.create(existing.name, function (err, snapshot) {
        if (err) {
          return callback(err);
        }
        
        winston.info('Activating snapshot ' + snapshot.yellow + ' for ' + existing.name.magenta);
        jitsu.snapshots.activate(existing.name, snapshot, function (err) {
          winston.silly('Done activating snapshot ' + snapshot.yellow);
          checkStarted(err, existing);
        });
      });
    }
    
    winston.silly('Checking if application ' + pkg.name.magenta + ' exists.');
    jitsu.apps.view(pkg.name, function (err, app) {
      if (err) {
        winston.warn('No application exists for ' + pkg.name.magenta);
        return apps.create(pkg.name, checkSnapshots);
      }
      
      checkSnapshots(null, app);
    });
  });
};

apps.deploy.usage = [
  '',
  'Deploys an application using the following steps:'.cyan.underline,
  '',
  '  1. Creates the application (if necessary)',
  '  2. Creates or validates the package.json',
  '  3. Packages and creates a new snapshot',
  '  4. Stops the application (if neccessary)',
  '  5. Starts the application',
  '',
];

//
// ### function list (callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Creates an application for the package.json in the current directory
// using `name` if supplied and falling back to `package.name`.
//
apps.create = function (name, callback) {
  jitsu.utils.getPackage(process.cwd(), function (err, pkg) {
    if (!callback) {
      callback = name;
      name = null;
    }

    if (err) {
      winston.error(err);
      return callback(new Error(), true);
    }

    pkg.name = name || pkg.name;
    jitsu.apps.list(function (err, apps) {
      var existing = apps.filter(function (a) { 
        return a.name === pkg.name;
      });
      
      if (existing.length > 0) {
        return winston.warn('Cannot create duplicate application ' + pkg.name.magenta);
      }
      
      //
      // TODO (indexzero): Configure this default value in nodejitsu APIs
      //
      pkg.state = 'stopped';

      winston.info('Creating app ' + pkg.name.magenta);
      jitsu.apps.create(pkg, function (err, res, result) {
        winston.silly('Done creating app ' + pkg.name.magenta);
        return err ? callback(err) : callback(null, pkg);
      });
    });
  });
};

//
// Usage for `jitsu apps create [<name>]`
//
apps.create.usage = [
  'Creates an application using the package.json file in the',
  'current directory, if <name> is supplied then this is used',
  'instead of the `name` property in the package.json file.',
  '',
  'jitsu create',
  'jitsu apps create',
  'jitsu apps create <name>'
];

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Lists the applications for the authenticated user.
//
apps.list = function (callback) {
  winston.info('Listing apps');
  jitsu.apps.list(function (err, apps) {
    if (err) {
      return callback(err);
    }
    
    if (!apps || apps.length === 0) {
      winston.warn('No applications exist.');
      winston.help('Try creating one with ' + 'jitsu apps create'.magenta);
      return callback();
    }
    
    var rows = [['name', 'state', 'subdomain', 'start', 'latest']],
        colors = ['underline', 'yellow', 'green', 'grey', 'red'];
    
    apps.forEach(function (app) {
      rows.push([
        app.name,
        app.state || 'stopped',
        app.subdomain,
        app.scripts.start || '---',
        app.snapshots && app.snapshots.length > 0 ? app.snapshots[0].filename : '---'
      ]);
    });
    
    jitsu.log.logRows('data', rows, colors);
    callback();
  });
};

//
// Usage for `jitsu apps list`
//
apps.list.usage = [
  'Lists all of the applications for the current user',
  '',
  'jitsu list',
  'jitsu apps list'
];

//
// ### function view (name, callback)
// #### @name {string} **optional** Name of the application to view
// #### @callback {function} Continuation to pass control to when complete.
// Views the application with the specfied `name` for the authenticated user.
// If no name is supplied this will view the application in the current directory. 
//
apps.view = function (name, callback) {
  function executeView() {
    jitsu.apps.view(name, function (err, app) {
      if (err) {
        return callback(err);
      }
      
      //
      // TODO (indexzero): Better object inspection
      //
      eyes.inspect(app);
      callback(null, app);
    });
  }
  
  if (!callback) {
    callback = name;
    return jitsu.utils.tryReadPackage(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeView();
    });
  }
  
  executeView();
};

//
// Usage for `jitsu apps view [<name>]`
//
apps.view.usage = [
  'Lists the information for the application in the current',
  'directory. If <name> is supplied then that application',
  'is listed instead.',
  '',
  'jitsu apps view',
  'jitsu apps view <name>'
];

//
// ### function list (callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Lists the applications for the authenticated user.
//
apps.update = function (name, callback) {
  if (!callback) {
    callback = name;
    name = null;
  }
  
  winston.silly('Reading package.json in ' + process.cwd());
  jitsu.utils.tryReadPackage(process.cwd(), callback, function (pkg) {
    name = name || pkg.name;
    jitsu.apps.view(name, function (err, app) {
      if (err) {
        return callback(err);
      }
      
      var diff = jitsu.utils.objectDiff(app, pkg);
      if (!diff) {
        winston.warn('No changes found to your package.json for ' + name.magenta);
        return callback();
      }
      
      winston.info('Updating application ' + name.magenta + ' with:');
      eyes.inspect(diff);
      
      jitsu.apps.update(name, diff, callback);
    });
  });
};

//
// Usage for `jitsu apps update [<name>]`
//
apps.update.usage = [
  'Updates the application in the current directory',
  'with the information in the package.json file. If',
  '<name> is supplied the application with <name> is updated.',
  '',
  'jitsu apps update',
  'jitsu apps update <name>'
];

//
// ### function destroy (callback)
// #### @name {string} **optional** Name of the application to destroy.
// #### @callback {function} Continuation to pass control to when complete.
// Destroys the application specified by `name`. If no name is supplied
// this will destroy the application in the current directory.
//
apps.destroy = function (name, callback) {
  function executeDestroy() {
    winston.info('Destroying app ' + name.magenta);
    jitsu.apps.destroy(name, function (err) {
      winston.silly('Done destroying app ' + name.magenta);
      return err ? callback(err) : callback();
    });
  }

  if (!callback) {
    callback = name;
    return jitsu.utils.tryReadPackage(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeDestroy();
    });
  }
  
  executeDestroy();
};

//
// Usage for `jitsu apps destroy [<name>]`
//
apps.destroy.usage = [
  'Destroys the application in the current directory. If',
  '<name> is supplied then that application is destroyed instead',
  '',
  'jitsu apps destroy',
  'jitsu apps destroy <name>'
];

//
// ### function start (callback)
// #### @name {string} **optional** Name of the application to start.
// #### @callback {function} Continuation to pass control to when complete.
// Starts the application specified by `name`. If no name is supplied
// this will start the application in the current directory.
//
apps.start = function (name, callback) {  
  function executeStart() {
    winston.info('Starting app ' + name.magenta);
    jitsu.apps.start(name, function (err) {
      jitsu.apps.view(name, function (err, app) {
        winston.info('App ' + name.magenta + ' is now started at: ' + ('http://' + app.subdomain + '.nodejitsu.com').magenta + ' on ' + 'Port 80'.magenta);
        return err ? callback(err) : callback(null, true);
      });
    });
  }

  if (!callback) {
    callback = name;
    return jitsu.utils.tryReadPackage(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeStart();
    });
  }
  
  executeStart();
};

//
// Usage for `jitsu apps start [<name>]`
//
apps.start.usage = [
  'Starts the application in the current directory. If <name>',
  'is supplied then that application is started instead.',
  '',
  'jitsu apps start',
  'jitsu apps start <name>'
];

//
// ### function stop (callback)
// #### @name {string} **optional** Name of the application to stop.
// #### @callback {function} Continuation to pass control to when complete.
// Stops the application specified by `name`. If no name is supplied
// this will stop the application in the current directory.
//
apps.stop = function (name, callback) {  
  function executeStop() {
    winston.info('Stopping app ' + name.magenta);
    jitsu.apps.stop(name, function (err) {
      winston.info('App ' + name.magenta + ' is now stopped');
      return err ? callback(err) : callback();
    });
  }

  if (!callback) {
    callback = name;
    return jitsu.utils.tryReadPackage(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeStop();
    });
  }
  
  executeStop();
};

//
// Usage for `jitsu apps stop [<name>]`
//
apps.stop.usage = [
  'Stops the application in the current directory. If <name>',
  'is supplied then that application is stopped instead.',
  '',
  'jitsu apps stop',
  'jitsu apps stop <name>'
];