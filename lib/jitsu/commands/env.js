/*
 * env.js: Commands related to environment variables for Nodejitsu applications.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    fs = require('fs'),
    utile = jitsu.common;

var env = exports;

env.usage = [
  '`jitsu env *` commands enable management of environment',
  'variables for the app. Valid commands are:',
  '',
  'jitsu env list',
  'jitsu env list   <app>',
  'jitsu env set    <key> <value>',
  'jitsu env get    <key>',
  'jitsu env delete <key>',
  'jitsu env clear',
  'jitsu env save  [<app>] [<file>]',
  'jitsu env load  [<app>] [<file>]'
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
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
    key      = args[1] || null;
    value    = args[2] || null;
  }

  if (value === null) {
		if (key === null) {
		  jitsu.log.error(
        'Environment variable name and value and both required'
      );
      return callback({});
		}

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
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
    key      = args[1] || null;
  }

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
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
    key      = args[1] || null;
  }

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
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
  }

  function executeList(err, app) {
    if (!app.env || Object.keys(app.env).length === 0) {
      jitsu.log.warn('No environment variables for ' + app.name.magenta);
      return callback();
    }

    jitsu.log.info('Listing all environment variables for ' + app.name.magenta);
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
// Alias `env ls` to `env list`
//
// Remark: Attempting to put this alias in `alias.js` file did not work.
//
env.ls = env.list;

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
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
  }

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
    jitsu.prompt.confirm('yes/no', { default: 'yes'}, function (err, result) {
      return (err || !result)
        ? callback(err) 
        : jitsu.apps.update(app.name, { env: {} }, callback);
    });
  }
};

//
// ### function save (callback)
// #### @callback {function} Continuation to pass control to when complete
// Outputs all environment variables into env.json for the application in the
// current directory.
//
env.save = function (appName, file, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
    file     = args[1] || 'env.json';
    if (appName === null) {
      viewApp(callback, executeSave);
    } else{
      viewAppByName(appName, function () {jitsu.commands.env.save(null, appName, callback);}, executeSave);
    }
  }

  function executeSave(err, app) {
    if (!app.env || Object.keys(app.env).length === 0) {
      jitsu.log.warn('No environment variables for ' + app.name.magenta);
      return callback();
    }

    jitsu.log.info('Saving all environment variables for ' + app.name.magenta
        + ' to ' + file);
    jitsu.log.warn('This may contain sensitive data. Be sure not to commit this'
        + ' file to some public repository. YOU HAVE BEEN WARNED.');
    jitsu.log.info('Is this okay?');
    jitsu.prompt.confirm('yes/no', { default: 'yes'}, function (err, result) {
      if (result) {
        fs.writeFile(file, JSON.stringify(app.env, null, 2), function (err) {
          if (!err) {
            jitsu.log.info(file.yellow + ' written!');
          }
          callback(err);
        });
      }
      else {
        jitsu.log.info(file + ' not written.');
      }
    });
  }
};

//
// Usage for `jitsu env save`
//
env.save.usage = [
  'Save all environment variables to env.json, or to <file> if specified, for the',
  'application in the current directory, or the specified <app>.',
  '',
  'jitsu env save',
  'jitsu env save [<app>]',
  'jitsu env save [<file>]',
  'jitsu env save [<app>] [<file>]',
];

//
// ### function load (callback)
// #### @callback {function} Continuation to pass control to when complete
// Loads all environment variables from a json file for the application in the
// current directory.
//
env.load = function (appName, file, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    appName  = args[0] || null;
    file     = args[1] || 'env.json';
    if (appName === null) {
      viewApp(callback, executeLoad);
    } else{
      viewAppByName(appName, function () {jitsu.commands.env.load(null, appName, callback);}, executeLoad);
    }
  }

  function executeLoad(err, app) {
    var env;
    jitsu.log.info('Replacing all environment variables for ' + app.name.magenta
        + ' from variables in ' + file);
    fs.readFile(file, function (err, data) {
      if (err) {
        return callback(err);
      }

      try {
        env = JSON.parse(data);
      }
      catch (err) {
        jitsu.log.error('Error parsing ' + file.yellow);
        return callback(err);
      }

      jitsu.log.info('Old environment variables: ');
      jitsu.inspect.putObject(app.env);
      jitsu.log.info('New environment variables: ');
      jitsu.inspect.putObject(env);
      jitsu.log.warn('YOU CAN LOSE ENVIRONMENT VARIABLES IF YOU ARE NOT CAREFUL.');
      jitsu.log.info('Is this okay?');
      jitsu.prompt.confirm('yes/no', { default: 'yes'}, function (err, result) {
        if (result) {
          jitsu.apps.update(app.name, { env: env }, callback);
        } else {
          jitsu.log.info('Environment vaiables for ' + app.name.magenta +
            ' were not replaced.');
          callback(null);
        }
      });
    });
  }
};

//
// Usage for `jitsu env load`
//
env.load.usage = [
  'Replaces all environment variables from env.json, or from <file> if specified,',
  'for the application in the current directory, or the specified <app>. Suggested',
  'for use with `jitsu env save`. See `jitsu help env save` for more info.',
  '',
  'jitsu env load',
  'jitsu env load [<app>]',
  'jitsu env load [<file>]',
  'jitsu env load [<app>] [<file>]',
];

//
// ### @private viewApp (callback, success)
// #### @callback {function} Continuation to respond to on error.
// #### @success {function} Continuation to respond to on success.
// Attempts to read the package.json for the current directory 
// and retrieve it from Nodejitsu.
//
function viewApp(callback, success) {
  jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
    jitsu.log.info('Attempting to load env variables for app ' + (process.cwd()+ '/package.json').grey);
    jitsu.apps.view(pkg.name, function (err, app) {
      //
      // TODO: replace this error handling with errs library
      //
      if (err && err.result && err.result.error === "not_found") {
        jitsu.log.error('app ' + pkg.name.magenta + ' doesn\'t exist on Nodejitsu yet!');
        return callback({});
      }
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
