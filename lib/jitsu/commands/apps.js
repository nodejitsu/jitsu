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
  'jitsu apps deploy',
  'jitsu apps list',
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

  function promptLogin () {
     jitsu.log.warn("You are not logged in.");
     jitsu.log.warn("Please authenticate first.");
     jitsu.commands.users.login(function(){
       jitsu.commands.apps.deploy(callback);
     });
   }

  //
  // If not logged in require the user to authenticate before deploying
  //
  if (!jitsu.config.get('username') && !jitsu.config.get('password')) {
     return promptLogin();
  }

  //
  // Allows arbitrary amount of arguments to deploy
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

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
    apps.start(existing.name, function (err) {
      if (err) {
        return callback(err);
      }

      jitsu.package.runScript(pkg, 'postdeploy', callback);
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
    jitsu.log.info('Updating app ' + existing.name.magenta);
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

    jitsu.package.runScript(pkg, 'predeploy', function (err) {
      if (err) {
        return callback(err);
      }

      jitsu.package.updateTarball(null, pkg, existing, firstSnapshot, function (err, snapshot) {
        if (err) {
          return callback(err, snapshot);
        }

        updateApp(existing, snapshot);
      });
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

      //
      // TODO: replace this error handling with errs library
      //
      if (err) {
        if (err.result) {
          if (err.result.error === 'not_found') {

            jitsu.log.silly('App ' + local.name.magenta + ' doesn\'t exist!');
            //
            // If there is a before filter we should run before creating the app do so, 
            // then create the application.
            //
            apps.create(local, function (err, existing) {
              updateSnapshot(err, existing, true);
            });
          }
          else if (err.statusCode === 403) {
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
          return callback(err);
        }
      }
      else {
        app = app
          ? { version: app.version }
          : {};
        pkg = analyzer.merge({}, local, app);
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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

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
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Lists the applications for the authenticated user.
//
apps.list = function (username, callback) {

  if (typeof callback === 'undefined') {
    callback = username;
    username = jitsu.config.get('username');
  } else {
    username = username || jitsu.config.get('username');
  }

  jitsu.log.info('Listing all apps for ' + username.magenta);

  jitsu.apps.list(username, function (err, apps) {
    if (err) {
      if (err.statusCode === 403) {
        jitsu.log.error(jitsu.config.get('username').magenta + ' is not authorized to list applications for user: ' + username.magenta);
      }
      return callback(err);
    }
    
    if (!apps || apps.length === 0) {
      jitsu.log.warn('No applications exist.');
      jitsu.log.help('Try creating one with ' + 'jitsu install'.magenta + ' and then deploy it with ' + 'jitsu deploy'.magenta);
      return callback();
    }
    
    var rows = [['name', 'state', 'subdomain', 'running snapshot']],
        colors = ['underline', 'underline', 'underline', 'underline'];
    
    apps.forEach(function (app) {
      app.state = jitsu.common.formatAppState(app.state);

      //
      // Remark: Attempt to always show running snapshot
      //
      var snapshot = '---';
      if(app.running && app.running.filename) {
        snapshot = app.running.filename;
      }

      rows.push([
        app.name,
        app.state,
        app.subdomain,
        snapshot
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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

  //
  // Always curry last argument to callback
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

  function executeView(name) {
    name = name || 'no-name';
    jitsu.apps.view(name, function (err, app) {

      if (err) {
        jitsu.log.error('App ' + name.magenta + ' doesn\'t exist on Nodejitsu yet!');
        jitsu.log.help('Try running ' + 'jitsu deploy'.magenta);
        return callback({});
      }

      jitsu.log.info('Viewing app ' + name.magenta);
      app = jitsu.common.formatApp(app);
      jitsu.inspect.putObject(app);
      callback(null, app);
    });
  }
  
  function getAppName(callback) {
    jitsu.package.read(process.cwd(), function (err, pkg) {
      if (!err) {
        jitsu.log.info('Attempting to view app ' + (process.cwd()+ '/package.json').grey);
        return callback(null, pkg.name);
      }
      callback(err);
    });
  }

  if (!name) {
    getAppName(function (err, pkg) {
      if(err) {
        jitsu.commands.list(function(){
          jitsu.log.info('Which ' + 'app'.magenta + ' do you want to view?');
          jitsu.prompt.get(["app name"], function (err, result) {
            if (err) {
              jitsu.log.error('Prompt error:');
              return callback(err);
            }
            appName = result["app name"];
            executeView(appName);
          });
        })
      } else {
        executeView(pkg);
      }
    });
  } else {
    executeView(name);
  }
  
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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

  function executeDestroy() {
    jitsu.log.info('Destroying app ' + name.magenta);
    jitsu.apps.destroy(name, function (err) {
      jitsu.log.silly('Done destroying app ' + name.magenta);
      return err ? callback(err) : callback();
    });
  }

  if (!name) {
    jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      jitsu.log.info('Attempting to destroy app ' + pkg.name.magenta);
      name = pkg.name;
      jitsu.prompt.get(["yesno"], function(err, result){
        if (result['yesno'] !== "no") {
          executeDestroy();
        } else {
          jitsu.log.info('app ' + pkg.name.magenta + ' was not destroyed')
          callback(null);
        }
      });
    });
  } else {
    executeDestroy();
  }

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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

  function executeStart() {
    jitsu.log.info('Starting app ' + name.magenta);

    jitsu.apps.start(name, function (err) {

      //
      // TODO: replace this error handling with errs library
      //
      if (err && err.result) {
        if(err.result.message === "Cannot start application with no snapshots") {
          jitsu.log.error('Cannot start ' + name.magenta + ' since it has no snapshots');
          jitsu.log.help('Try running a ' + 'jitsu deploy'.magenta);
          return callback({}, null);
        }
      }

      //
      // TODO: replace this error handling with errs library
      //
      if (err) {
        if (err) {
          if(err.result && err.result.error === "not_found") {
            jitsu.log.error('App ' + name.magenta + ' doesn\'t exist on Nodejitsu yet!');
            return callback({});
          }
          return callback(err);
        }
      }


      jitsu.apps.view(name, function (err, app) {
        if (err) {
          return callback(err);
        }
        
        jitsu.log.info('App ' + name.magenta + ' is now started')
        jitsu.log.info(('http://' + app.subdomain + '.jit.su').magenta + ' on Port ' + '80'.magenta);
        callback();
      });
    });
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeStart();
    });
  } else {
    executeStart();
  }
  
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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

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

  //
  // Allows arbitrary amount of arguments
  //
  if(arguments) {
    arguments = Array.prototype.slice.call(arguments);
    callback = arguments[arguments.length - 1];
  }

  function executeStop() {
    jitsu.log.info('Stopping app ' + name.magenta);
    jitsu.apps.stop(name, function (err) {

      //
      // TODO: replace this error handling with errs library
      //
      if (err) {
        if(err.result && err.result.error === "not_found") {
          jitsu.log.error('App ' + name.magenta + ' doesn\'t exist on Nodejitsu yet!');
          return callback({});
        }
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
