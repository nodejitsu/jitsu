/*
 * env.js: Commands related to environment variables for Nodejitsu applications.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var winston = require('winston'),
    jitsu = require('../../jitsu');
 
var env = exports;

env.usage = [
  '`jitsu env *` commands allow you to set local environment',
  'variables for your application. Valid commands are:',
  '',
  'jitsu env list',
  'jitsu env list   <app>',
  'jitsu env set    <key> <value>',
  'jitsu env get    <key>',
  'jitsu env delete <key>',
  'jitsu env clear'
];

//
// ### function set (key, value, callback)
// #### @key {string} Key to set in jitsu config.
// #### @value {string} Value to set the key to.
// #### @callback {function} Continuation to pass control to when complete
// Sets the specified `key` in the environment variables to `value` for 
// the application in the current directory.
//
env.set = function (key, value, callback) {
  var args = Array.prototype.slice.call(arguments);
  callback = args.pop();
  
  if (args.length !== 2) {
    winston.error('You must pass both <key> and <value>');
    return callback(true, true);
  }
  
  viewApp(callback, function (err, app) {
    app.env = app.env || {};
    app.env[key] = value;

    jitsu.apps.update(jitsu.config.get('username') + '/' + app.name, { env: app.env }, callback);
  });
};

//
// Usage for `jitsu env set <key> <value>`
//
env.set.usage = [
  'Sets the specified `key` in the environment variables to `value`',
  'for the application in the current directory.',
  '',
  'jitsu env set <key> <value>'
];

//
// ### function get (key, callback)
// #### @key {string} Key to get in jitsu config.
// #### @callback {function} Continuation to pass control to when complete
// Gets the specified `key` in the environment variables for the 
// application in the current directory.
//
env.get = function (key, callback) {
  if (!callback) {
    callback = key;
    winston.error('No environment variables for ' + 'undefined'.yellow);
    return callback(new Error(), true, true);
  }
  
  viewApp(callback, function (err, app) {
    if (!app.env[key]) {
      winston.warn('No environment variables for ' + key.yellow);
      return callback();
    }

    if(app.name.search('/') === -1){
      app.name = jitsu.config.get('username') + '/' + app.name;
    }

    winston.data([key.yellow, app.env[key].toString().magenta].join(' '));
    callback();
  });
};

//
// Usage for `jitsu config get <key>`
//
env.get.usage = [
  'Gets the specified `key` in the environment variables for the',
  'application in the current directory.',
  '',
  'jitsu env get <key>'
];

//
// ### function delete (key, callback)
// #### @key {string} Key to delete, in jitsu config.
// #### @callback {function} Continuation to pass control to when complete
// Deletes the specified `key` in the environment variables for the 
// application in the current directory.
//
env.delete = function (key, callback) {
  if (!callback) {
    callback = key;
    winston.warn('No configuration for ' + 'undefined'.magenta);
    return callback();
  }

  var value = jitsu.config.get(key);
  if (!value) {
    winston.warn('No configuration value for ' + key.yellow);
    return callback();
  }
  
  viewApp(callback, function (err, app) {
    if (!app.env[key]) {
      winston.warn('No environment variables for ' + key.yellow);
      return callback();
    }

    delete app.env[key];
    jitsu.apps.update(app.name, { env: app.env }, callback);
  });
};

//
// Usage for `jitsu env delete <key>`
//
env.delete.usage = [
  'Deletes the specified `key` in the environment variables for the',
  'application in the current directory.',
  '',
  'jitsu env delete <key>'
];

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete
// Lists all environment variables for the application in the 
// current directory.
//
env.list = function (appName, callback) {
  
  if (typeof appName === 'function') {
    callback = appName;
    appName = null;
    viewApp(callback, success);
  }
  else {
    viewAppByName(appName, callback, success);
  }

  function success(err, app) {
    if (!app.env || Object.keys(app.env).length === 0) {
      winston.warn('No environment variables for ' + app.name.magenta);
      return callback();
    }
    
    if(app.name.search('/') === -1){
      app.name = jitsu.config.get('username') + '/' + app.name;
    }

    winston.info('Listing all environment variables for: ' + app.name.magenta);
    jitsu.log.putObject(app.env);
    callback();
  }
};

//
// Usage for `jitsu env list`
//
env.list.usage = [
  'Lists all environment variables for the application in the',
  'current directory.',
  '',
  'jitsu env list'
];

env.clear = function (callback) {
  viewApp(callback, function (err, app) {
    if (!app.env || Object.keys(app.env).length === 0) {
      winston.warn('No environment variables for ' + app.name.magenta);
      return callback();
    }
    
    winston.warn('All environment variables for ' + app.name.magenta + ' will be deleted.');
    jitsu.prompt.get(['yesno'], function (err, result) {
      return err 
        ? callback(err) 
        : jitsu.apps.update(app.name, { env: {} }, callback);
    });
  });
};

//
// ### @private viewApp (callback, success)
// #### @callback {function} Continuation to respond to on error.
// #### @success {function} Continuation to respond to on success.
// Attempts to read the package.json for the current directory 
// and retrieve it from Nodejitsu.
//
function viewApp (callback, success) {
  jitsu.package.tryRead(process.cwd(), callback, function (pkg) {

    if(pkg.name.search('/') === -1){
      pkg.name = jitsu.config.get('username') + '/' + pkg.name;
    }

    jitsu.apps.view(pkg.name, function (err, app) {
      return err ? callback(err) : success(null, app);
    });
  });
}

//
// ### @private viewAppByName (appName, callback, success)
// #### @callback {function} Continuation to respond to on error.
// #### @success {function} Continuation to respond to on success.
// Attempts to retrieve the application from Nodejitsu with the given name.
//
function viewAppByName (appName, callback, success) {
  if (appName.search('/') === -1) {
    appName = jitsu.config.get('username') + '/' + appName;
  }
  jitsu.apps.view(appName, function (err, app) {
    return err ? callback(err) : success(null, app);
  });
}
