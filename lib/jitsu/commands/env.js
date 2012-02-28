/*
 * env.js: Commands related to environment variables for Nodejitsu applications.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu');
 
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
env.set = function (appName, key, value, callback) {
  if (value === null) {
    value = key;
    key = appName;
    return viewApp(callback, update);
  }

  viewAppByName(appName, callback, update);
  
  function update(err, app) {
    app.env = app.env || {};
    app.env[key] = value;
    jitsu.apps.update(app.name, { env: app.env }, callback);
  }
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
env.get = function (appName, key, callback) {
  if (key === null) {
    key = appName;
    return viewApp(callback, gotEnv);
  }
  
  viewAppByName(appName, callback, gotEnv);

  function gotEnv(err, app) {
    if (!app.env[key]) {
      jitsu.log.warn('No environment variables for ' + key.yellow);
      return callback();
    }

    jitsu.log.data([key.yellow, app.env[key].toString().magenta].join(' '));
    callback();
  }
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
env.delete = function (appName, key, callback) {
  if (key === null) {
    key = appName;
    return viewApp(callback, deleteKey);
  }
  
  viewAppByName(appName, callback, deleteKey);

  function deleteKey(err, app) {
    if (!app.env[key]) {
      jitsu.log.warn('No environment variables for ' + key.yellow);
      return callback();
    }

    delete app.env[key];
    jitsu.apps.update(app.name, { env: app.env }, callback);
  }
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
  function executeList(err, app) {
    if (!app.env || Object.keys(app.env).length === 0) {
      jitsu.log.warn('No environment variables for ' + app.name.magenta);
      return callback();
    }

    jitsu.log.info('Listing all environment variables for: ' + app.name.magenta);
    jitsu.inspect.putObject(app.env);
    callback();
  }
  
  if (!appName) {    
    viewApp(callback, executeList);
  }
  else {
    viewAppByName(appName, callback, executeList);
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

env.clear = function (appName, callback) {
  if (appName === null) {
    return viewApp(callback, clearEnv);
  }

  viewAppByName(appName, callback, clearEnv);
 
  function clearEnv(err, app) {
    if (!app.env || Object.keys(app.env).length === 0) {
      jitsu.log.warn('No environment variables for ' + app.name.magenta);
      return callback();
    }
    
    jitsu.log.warn('All environment variables for ' + app.name.magenta + ' will be deleted.');
    jitsu.prompt.get(['yesno'], function (err, result) {
      return err 
        ? callback(err) 
        : jitsu.apps.update(app.name, { env: {} }, callback);
    });
  }
};

//
// ### @private viewApp (callback, success)
// #### @callback {function} Continuation to respond to on error.
// #### @success {function} Continuation to respond to on success.
// Attempts to read the package.json for the current directory 
// and retrieve it from Nodejitsu.
//
function viewApp(callback, success) {
  jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
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
function viewAppByName(appName, callback, success) {
  jitsu.apps.view(appName, function (err, app) {
    return err ? callback(err) : success(null, app);
  });
}
