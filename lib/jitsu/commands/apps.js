/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var analyzer = require('require-analyzer'),
    jitsu = require('../../jitsu');

var apps = exports;

apps.usage = [
  '`jitsu apps *` commands allow you to work with your',
  'Applications on Nodejitsu. Valid commands are:',
  '',
  'jitsu apps create',
  'jitsu apps list',
  'jitsu apps deploy',
  'jitsu apps view    [<name>]',
  'jitsu apps update  [<name>]',
  'jitsu apps destroy [<name>]',
  'jitsu apps start   [<name>]',
  'jitsu apps restart [<name>]',
  'jitsu apps stop    [<name>]',
  '',
  'For commands that take a <name> parameter, if no parameter',
  'is supplied, jitsu will attempt to read the package.json',
  'from the current directory.'
];

//
// ### function deploy (callback) 
// #### @callback {function} Continuation to respond to when complete.
// Deploys an application through the following steps:
// 1. Creates the application (if necessary)
// 2. Creates or validates the package.json
// 3. Packages and creates a new snapshot
// 4. Stops the application (if necessary)
// 5. Starts the application
//
apps.deploy = function (callback) {
  var dir = process.cwd(), pkg;
  
  function startApp(err, existing) {
    if (err) {
      jitsu.log.error('Error creating snapshot for app ' + pkg.name.magenta);
      jitsu.log.error(err.message);
      return callback(new Error(), true);
    }

    //if (existing.state === 'started') {
    //
    // existing.state is thrown away in check app. 
    // these closures would need to be rearanged so that this closure can see the result of view..
    //
    apps.stop(existing.name, function (err) {
      return err ? callback(err) : apps.start(existing.name, callback);
    });
    //}
    //else {
    //  apps.start(existing.name, callback);
    //}
  }
  
  function activateSnapshot(existing, snapshot) {
    jitsu.log.info('Activating snapshot ' + snapshot.grey + ' for ' + existing.name.magenta);
    jitsu.snapshots.activate(existing.name, snapshot, function (err) {
      jitsu.log.silly('Done activating snapshot ' + snapshot.grey);
      startApp(err, existing);
    });
  }

  function updateApp(existing, snapshot) {
    jitsu.log.info('Updating application ' + existing.name.magenta);
    jitsu.apps.update(existing.name, pkg, function (err) {

      if (err) {
        return callback(err);
      }
      
      activateSnapshot(existing, snapshot);
    });
  }
  
  function updateSnapshot(err, existing, firstSnapshot) {
    if (err) {
      return callback(err, true, true);
    }

    jitsu.package.updateTarball(null, pkg, existing, firstSnapshot, function (err, snapshot) {
      if (err) {
        return callback(err, snapshot);
      }
      
      updateApp(existing, snapshot);
    });
  }
  
  function checkApp(err, local) {
    if (err) {
      jitsu.log.error(err);
      return callback(new Error(), true);
    }

    pkg = local;
    jitsu.log.silly('Checking if application ' + local.name.magenta + ' exists.');
    jitsu.apps.view(local.name, function (err, app) {
      var pkg;

      if (err) {
        if (err.result.error === 'not_found') {

          jitsu.log.warn('No application exists for ' + local.name.magenta);
          //
          // If there is a before filter we should run before creating the app do so, 
          // then create the application.
          //
          apps.create(local, function (err, existing) {
            updateSnapshot(err, existing, true);
          });
        }
        else if (err.result.statusCode === 403) {
          jitsu.commands.users.login(function (err) {
            if (err) {
              return callback(err, true);
            }

            pkg = analyzer.merge({}, local);
            jitsu.package.validate(pkg, dir, updateSnapshot);
          });
        }
        else {

          // Our api can return a number of errors that aren't relevant, such
          // as '500, app deleted'.
          pkg = analyzer.merge({}, local);
          jitsu.package.validate(pkg, dir, updateSnapshot);
        }
      }
      else {
        pkg = analyzer.merge({}, local);
        jitsu.package.validate(pkg, dir, updateSnapshot);
      }
    });
  }
  
  jitsu.package.read(dir, function (err, local) {
    if (err) {
      return jitsu.package.get(dir, checkApp);
    }
    else {

      return jitsu.package.validate(local, dir, {}, checkApp);
    }
  });
};

apps.deploy.usage = [
  '',
  'Deploys an application using the following steps:'.cyan.underline,
  '',
  '  1. Creates the application (if necessary)',
  '  2. Creates or validates the package.json',
  '  3. Packages and creates a new snapshot',
  '  4. Stops the application (if necessary)',
  '  5. Starts the application',
  '',
  'jitsu deploy',
  'jitsu apps deploy'
];

//
// ### function list (callback)
// #### @target {string|Object} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Creates an application for the package.json in the current directory
// using `name` if supplied and falling back to `package.name`.
//
apps.create = function (target, callback) {
  var dir = process.cwd();

  function createApp(err, pkg) {
    if (err) {
      return callback(err);
    }
    jitsu.log.info('Creating app ' + pkg.name.magenta);
    jitsu.apps.create(pkg, function (err, res, result) {
      if (err) {
        jitsu.log.error('Error creating ' + pkg.name.magenta);
        jitsu.log.error(err.message);
        return callback(err);
      }

      jitsu.log.silly('Done creating app ' + pkg.name.magenta);
      return callback(null, pkg);
    });
  }

  function executeCreate(err, pkg) {
    if (err) {
      return callback(err);
    }

    pkg.state = 'stopped';
    jitsu.log.info('Checking app availability ' + pkg.name.magenta);
    jitsu.package.available(pkg, dir, createApp, executeCreate);
  }

  if (target && typeof target === 'object') {
    return executeCreate(null, target);
  }
  
  jitsu.package.get(process.cwd(), executeCreate);
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
apps.list = function (username, callback) {
  jitsu.log.info('Listing apps');
  username = username || jitsu.config.get('username');
  
  jitsu.apps.list(username, function (err, apps) {
    if (err) {
      return callback(err);
    }
    
    if (!apps || apps.length === 0) {
      jitsu.log.warn('No applications exist.');
      jitsu.log.help('Try creating one with ' + 'jitsu apps create'.magenta);
      return callback();
    }
    
    var rows = [['name', 'state', 'subdomain', 'start', 'latest']],
        colors = ['underline', 'underline', 'underline', 'underline', 'underline'];
    
    apps.forEach(function (app) {
      rows.push([
        app.name,
        app.state || 'stopped',
        app.subdomain,
        app.scripts.start || '---',
        app.snapshots && app.snapshots.length > 0 ? app.snapshots[app.snapshots.length - 1].filename : '---'
      ]);
    });
    
    jitsu.inspect.putRows('data', rows, colors);
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
      
      app = jitsu.common.formatApp(app);
      jitsu.inspect.putObject(app);
      callback(null, app);
    });
  }
  
  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
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
  jitsu.log.silly('Reading package.json in ' + process.cwd());
  jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
    name = name || pkg.name;

    jitsu.apps.view(name, function (err, app) {
      if (err) {
        return callback(err);
      }
      
      var diff = jitsu.common.objectDiff(app, pkg);
      if (!diff) {
        jitsu.log.warn('No changes found to your package.json for ' + name.magenta);
        return callback();
      }
      
      jitsu.log.info('Updating application ' + name.magenta + ' with:');
      jitsu.inspect.putObject(diff);
      
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
    jitsu.log.info('Destroying app ' + name.magenta);
    jitsu.apps.destroy(name, function (err) {
      jitsu.log.silly('Done destroying app ' + name.magenta);
      return err ? callback(err) : callback();
    });
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeDestroy();
    });
  }
  
  executeDestroy();
};

//
// Usage for `jitsu apps destroy [<name>]`
//
apps.destroy.destructive = true
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
    jitsu.log.info('Starting app ' + name.magenta);
    jitsu.apps.start(name, function (err) {
      if (err) {
        return callback(err, true);
      }
      
      jitsu.apps.view(name, function (err, app) {
        if (err) {
          return callback(err);
        }
        
        jitsu.log.info('App ' + name.magenta + ' is now started')
        jitsu.log.info(('http://' + app.subdomain + '.nodejitsu.com').magenta + ' on Port ' + '80'.magenta);
        callback();
      });
    });
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
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
// ### function restart (name, callback)
// #### @name {string} **optional** Name of the application to restart.
// #### @callback {function} Continuation to pass control to when complete.
// Restarts the application specified by `name`. If no name is supplied
// this will restart the application in the current directory.
//
apps.restart = function (name, callback) {

  function executeRestart() {
    jitsu.log.info('Restarting app ' + name.magenta);
    jitsu.apps.restart(name, function (err) {
      if (err) {
        return callback(err);
      }
      
      jitsu.log.info('App ' + name.magenta + ' has been restarted');
      callback();
    });
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeRestart();
    });
  }
  
  executeRestart();
};

//
// Usage for `jitsu apps restart [<name>]`
//
apps.restart.usage = [
  'Restarts the application in the current directory. If <name>',
  'is supplied then that application is restarted instead.',
  '',
  'jitsu apps restart',
  'jitsu apps restart <name>'
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
    jitsu.log.info('Stopping app ' + name.magenta);
    jitsu.apps.stop(name, function (err) {
      if (err) {
        return callback(err);
      }
      
      jitsu.log.info('App ' + name.magenta + ' is now stopped');
      callback();
    });
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
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
