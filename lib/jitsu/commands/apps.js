/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');

var apps = exports;

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Lists the applications for the authenticated user.
//
apps.list = function (callback) {
  jitsu.apps.list(function (err, apps) {
    if (err) {
      return callback(err);
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
// ### function list (callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Creates an application for the package.json in the current directory
// using `name` if supplied and falling back to `package.name`.
//
apps.create = function (name, callback) {
  jitsu.utils.readPackage(process.cwd(), function (err, pkg) {
    if (!callback) {
      callback = name;
      name = null;
    }

    pkg.name = name || pkg.name;
    jitsu.apps.list(function (err, apps) {
      var existing = apps.filter(function (a) { return a.name === pkg.name });
      if (existing.length > 0) {
        return winston.warn('Cannot create duplicate application ' + pkg.name.magenta);
      }
      
      //
      // TODO (indexzero): Configure this default value in nodejitsu APIs
      //
      pkg.state = 'stopped';
      winston.info('Validating package.json for ' + pkg.name.magenta);
      jitsu.prompt.addProperties(pkg, ['subdomain'], function (updated) {
        winston.info('Creating app ' + pkg.name.magenta);
        jitsu.apps.create(updated, function (err, res, result) {
          winston.silly('Done creating app ' + pkg.name.magenta);
          return err ? callback(err) : callback();
        });
      });
    });
  });
};

//
// ### function list (callback)
// #### @name {string} **optional** Name of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Lists the applications for the authenticated user.
//
apps.update = function (name, callback) {
  if (!callback) {
    callback = name;
  }
  
  
};

//
// ### function destroy (callback)
// #### @name {string} **optional** Name of the application to destroy.
// #### @callback {function} Continuation to pass control to when complete.
// Destroys the application specified by `name`. If no name is supplied
// this will destroy the application in the current directory.
//
apps.destroy = function (name, callback) {
  if (!callback) {
    callback = name;
    return jitsu.utils.readPackage(process.cwd(), function (err, package) {
      name = package.name;
      executeDestroy();
    });
  }
  
  function executeDestroy () {
    winston.info('Destroying app ' + name.magenta);
    jitsu.apps.destroy(name, function (err) {
      winston.silly('Done destroying app ' + name.magenta);
      return err ? callback(err) : callback();
    });
  }
  
  executeDestroy();
};

//
// ### function start (callback)
// #### @name {string} **optional** Name of the application to start.
// #### @callback {function} Continuation to pass control to when complete.
// Starts the application specified by `name`. If no name is supplied
// this will start the application in the current directory.
//
apps.start = function (name, callback) {
  
};

//
// ### function stop (callback)
// #### @name {string} **optional** Name of the application to stop.
// #### @callback {function} Continuation to pass control to when complete.
// Stops the application specified by `name`. If no name is supplied
// this will stop the application in the current directory.
//
apps.stop = function (name, callback) {
  
};