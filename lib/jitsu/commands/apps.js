/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var analyzer = require('require-analyzer'),
    opener   = require('opener'),
    jitsu    = require('../../jitsu'),
    utile    = jitsu.common,
    async    = utile.async;

var apps = exports;

apps.usage = [
  'The `jitsu apps` command manages',
  'Applications on Nodejitsu. Valid commands are:',
  '',
  'jitsu apps deploy',
  'jitsu apps list',
  'jitsu apps create',
  'jitsu apps cloud   [<name>]',
  'jitsu apps view    [<name>]',
  'jitsu apps update  [<name>]',
  'jitsu apps destroy [<name>]',
  'jitsu apps start   [<name>]',
  'jitsu apps restart [<name>]',
  'jitsu apps stop    [<name>]',
  'jitsu apps setdrones [<name>] <number>',
  '',
  'For commands that take a <name> parameter, if no parameter',
  'is supplied, jitsu will attempt to read the package.json',
  'from the current directory.'
];

function handleStartError(err, name, callback) {
  //
  // TODO: replace this error handling with errs library
  //
  if (err.result) {
    if (err.result.message === "Cannot start application with no snapshots") {
      jitsu.log.error('Cannot start ' + name.magenta + ' since it has no snapshots');
      jitsu.log.help('Try running a ' + 'jitsu deploy'.magenta);
      return callback({}, null);
    }
    else if (err.result.error === 'not_found') {
      jitsu.log.error('App ' + name.magenta + ' doesn\'t exist on Nodejitsu yet!');
      return callback({});
    }
  }
  callback(err);
}

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
  var dir = process.cwd(),
      args = utile.args(arguments),
      cloud = {},
      pkg;

  //
  // Allows arbitrary amount of arguments to deploy
  //
  if (arguments.length) {
    callback = args.callback;
  }

  //
  // Allow use provider name and datacenter name without flags (--provider, --datacenter)
  //
  if (arguments.length === 2) {
    jitsu.log.error('Error: No datacenter name specified');
    jitsu.log.error('Please use a valid datacenter name.');

    return jitsu.apps.endpoints(function (err, endpoints) {
      if (err) return callback(err);

      if (endpoints) {
        jitsu.log.info('You can use one of the following providers');
        Object.keys(endpoints).forEach(function (provider) {
          var datacenters = endpoints[provider];
          Object.keys(datacenters).forEach(function (datacenter) {
            jitsu.log.data('jitsu deploy ' + provider + ' ' + datacenter);
          });
        });
      }

      return callback(new Error(), true);
    });
  }

  if (arguments.length === 3) {
    cloud.provider = args[0];
    cloud.datacenter = args[1];
  }

  // Setup of cloud parameters specified using (--)
  if (jitsu.argv['provider'] || jitsu.argv['datacenter']) {
    cloud.provider = jitsu.argv['provider'];
    cloud.datacenter = jitsu.argv['datacenter'];
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

    //
    // Enable custom drone number and memory ram
    //
    if (jitsu.argv['drones'] && typeof jitsu.argv['drones'] === 'number') {
      cloud.drones = jitsu.argv['drones'];
    } else if (cloud.provider && cloud.datacenter) {
      // Default drones to 1
      cloud.drones = 1;
    }

    if (jitsu.argv['ram'] && typeof jitsu.argv['ram'] === 'number') {
      if ([1, 256, 512, 1024].indexOf(jitsu.argv['ram']) === -1) {
        jitsu.log.warn('Invalid value of parameter: --ram, using 256 as default');
        cloud.ram = 256;
      } else {
        cloud.ram = jitsu.argv['ram'];
      }
    } else if (cloud.provider && cloud.datacenter) {
      // Default ram to 256
      cloud.ram = 256;
    }

    var next = function next (err) {
      if (err) {
        return callback(err);
      }

      jitsu.package.runScript(pkg, 'postdeploy', callback);
    };

    // Only if all options are correct we pass cloud options
    if (cloud.provider && cloud.datacenter && cloud.drones && cloud.ram) {
      apps.start(existing.name, cloud, next);
    } else {
      apps.start(existing.name, next);
    }

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
    return err
      ? jitsu.package.get(dir, checkApp)
      : jitsu.package.validate(local, dir, {}, checkApp);
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
  // Allows arbitrary amount of arguments to deploy
  //
  if (arguments.length) {
    callback = utile.args(arguments).callback;
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
// Usage for `jitsu apps create`.
//
apps.create.usage = [
  'Creates the application basing on `package.json` file in the current',
  'directory.',
  '',
  'jitsu apps create'
];

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Lists the applications for the authenticated user.
//
apps.list = function (username, callback) {

  var authuser = jitsu.config.get('username') || '';

  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    username = args[0] || authuser;
  }

  if (authuser === '') {
    return jitsu.commands.users.login(function (err) {
      if (err) {
        return callback(err);
      }

      jitsu.commands.apps.list(username, callback);
    });
  }

  jitsu.log.info('Listing all apps for ' + username.magenta);

  jitsu.apps.list(username, function cb(err, apps) {
    if (err) {
      if (err.statusCode === 403) {
        if (authuser === '') {
          jitsu.log.error('You are not authorized to list application for user: ' + username.magenta);
          jitsu.log.error('You need to login to do that!');
        }
        else {
          jitsu.log.error(jitsu.config.get('username').magenta + ' is not authorized to list applications for user: ' + username.magenta);
        }
      }
      return callback(err);
    }

    if (!apps || apps.length === 0) {
      jitsu.log.warn('No applications exist.');
      jitsu.log.help('Try creating one with ' + 'jitsu install'.magenta + ' and then deploy it with ' + 'jitsu deploy'.magenta);
      return callback();
    }

    var rows = [['name', 'state', 'subdomain', 'drones', 'running snapshot']],
        colors = ['underline', 'underline', 'underline', 'underline', 'underline'];

    apps.forEach(function (app) {
      app.state = jitsu.common.formatAppState(app.state);

      //
      // Remark: Attempt to always show running snapshot
      //
      var snapshot = '---';
      if (app.running && app.running.filename) {
        snapshot = app.running.filename;
      }

      rows.push([
        app.name,
        app.state,
        app.subdomain,
        app.drones + '/' + app.maxDrones,
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
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name = args[0] || null;
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
      if (err) {
        jitsu.commands.list(function () {
          jitsu.log.info('Which ' + 'app'.magenta + ' to view?');
          jitsu.prompt.get(["app name"], function (err, result) {
            if (err) {
              jitsu.log.error('Prompt error:');
              return callback(err);
            }
            executeView(result["app name"]);
          });
        });
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
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name = args[0] || null;
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
        jitsu.log.warn('No changes found in package.json for ' + name.magenta);
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
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name = args[0] || null;
  }
  if (!name) {
    jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      jitsu.log.info('Attempting to destroy app ' + pkg.name.magenta);
      name = pkg.name;
      executeDestroy();
    });
  } else {
    executeDestroy();
  }

  function executeDestroy() {
    jitsu.log.info('Destroy app ' + name.magenta);
    jitsu.prompt.confirm('yes/no', { default: 'yes'}, function(err, result){
      if (result) {
        jitsu.apps.destroy(name, function (err) {
          jitsu.log.silly('Done destroying app ' + name.magenta);
          return err ? callback(err) : callback();
        });
      } else {
        jitsu.log.info('app ' + name.magenta + ' was not destroyed');
        callback(null);
      }
    });
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
apps.start = function (name, cloud, callback) {

  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name = args[0] || null;
    cloud = args[1] || null;
  }

  // Little check when call jitsu start directly
  if (typeof cloud === 'string') {
    cloud = { provider: cloud };
    if (args[2]) {
      cloud.datacenter = args[2];
    } else {
      jitsu.log.error('Error: No datacenter name specified');
      jitsu.log.error('Please use a valid datacenter name.');
      return callback(new Error(), true)
    }
  }

  function executeStart() {
    // Skip straight to cloud if we have cloud data.
    if (cloud) return apps.cloud(name, cloud.provider, cloud.datacenter, callback);

    jitsu.log.info('Starting app ' + name.magenta);

    var showInfo = function showInfo (err, config) {
      if (err) {
        return handleStartError(err, name, callback);
      }

      async.series({
        //
        // 1. Fetch the endpoints so that we can properly
        //    tell the user what datacenter they are in later.
        //
        endpoints: function getEndpoints(next) {
          jitsu.apps.endpoints(next);
        },
        //
        // 2. Get app information to show the proper subdomain.
        //
        app: function start(next) {
          jitsu.apps.view(name, next);
        }
      }, function (err, result) {
        if (err) {
          return callback(err);
        }

        var endpoints = result.endpoints,
            tld = (config && config.provider && config.datacenter)
              ? result.endpoints[config.provider][config.datacenter]
              : 'api.jit.su',
            subdomain = result.app.subdomain;

        jitsu.log.info('App ' + name.magenta + ' is now started');
        jitsu.log.info(('http://' + subdomain + tld.replace('api', '')).magenta + ' on Port ' + '80'.magenta);
        callback();
      });
    }

    return jitsu.apps.start(name, showInfo);
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
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name = args[0] || null;
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
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name = args[0] || null;
  }

  function executeStop() {
    jitsu.log.info('Stopping app ' + name.magenta);
    jitsu.apps.stop(name, function (err) {

      //
      // TODO: replace this error handling with errs library
      //
      if (err) {
        if (err.result && err.result.error === "not_found") {
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

//
// ### function setdrones (name, number, callback)
// #### @name {string} **optional** Name of the application to stop.
// #### @callback {function} Continuation to pass control to when complete.
// Stops the application specified by `name`. If no name is supplied
// this will stop the application in the current directory.
//
apps.setdrones = function (name, number, callback) {
  function executeSet() {
    number = parseInt(number, 10);

    jitsu.log.info('Setting number of drones for app ' + name.magenta + ' to ' + number.toString().magenta);
    jitsu.apps.setDrones(name, number, function (err) {
      if (err) {
        return handleStartError(err, name, callback);
      }

      jitsu.log.info('App ' + name.magenta + ' is now running on ' + number.toString().magenta + ' drones');
      callback();
    });
  }

  if (!isNaN(parseInt(name, 10))) {
    number = name;
    name = null;
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      name = pkg.name;
      executeSet();
    });
  }

  executeSet();
};

//
// Usage for `jitsu apps setdrones [<name>] <number>`
//
apps.setdrones.usage = [
  'Sets number of drones used by the application.',
  '',
  'jitsu apps setdrones [<name>] <number>',
];


//
// ### function cloud (name, provider, datacenter, drones, callback)
// #### @name {string} **optional** Name of the application to view/set cloud info for.
// #### @callback {function} Continuation to pass control to when complete.
// Views or sets the cloud information for the specified application defaulting
// to the app in the current directory.
//
apps.cloud = function (name, provider, datacenter) {
  var providers = ['joyent'],
      args      = utile.args(arguments),
      callback  = args.callback,
      drones    = jitsu.argv.drones,
      ram       = jitsu.argv.ram;

  //
  // If `name` is `list` then show the current providers.
  //
  if (name === 'list') {
    return jitsu.apps.endpoints(function (err, endpoints) {
      if (err) {
        callback(err);
      }

      if (typeof endpoints === 'undefined') {
        endpoints = {};
      }

      jitsu.log.info('You can use one of the following providers');
      Object.keys(endpoints).forEach(function (provider) {
        var datacenters = endpoints[provider];
        Object.keys(datacenters).forEach(function (datacenter) {
          jitsu.log.data('jitsu cloud ' + provider + ' ' + datacenter);
        });
      });

      callback(null);
    });
  }

  //
  // If `name` is one of the known providers then curry
  // arguments and read package.json from `process.cwd()`.
  //
  if (providers.indexOf(name) !== -1) {
    datacenter = provider;
    provider = name;
    name = null;
  }

  //
  // If `datacenter` was not passed it will
  // be the callback.
  //
  datacenter = typeof datacenter !== 'function'
    ? datacenter
    : null;

  //
  // Print the cloud information for the app and respond.
  //
  function viewCloud(app) {
    if (!app.config || !app.config.cloud) {
      jitsu.log.error('Error: The app ' + app.name.magenta + ' don\'t have any cloud config.');
      jitsu.log.error('You need deploy your app before get any cloud config.');
      return callback(new Error());
    }
    jitsu.log.info('Viewing cloud info for ' + name.magenta);
    jitsu.inspect.putObject(app.config.cloud[0]);
    callback(null, app);
  }

  //
  // 1. Print what cloud app is deployed in now.
  // 2. Print new cloud app will be deployed to.
  // 3. Start the app in the specified cloud.
  //
  function setCloud(app) {
    drones = drones || app.maxDrones;
    ram = ram || (app.config.cloud ? app.config.cloud[0].ram : 256);

    var cloud = {
      datacenter: datacenter,
      provider: provider,
      drones: drones,
      ram: ram
    };

    if (app.state === 'started') {
      jitsu.log.info('App currently deployed to the cloud with:')
      jitsu.inspect.putObject(app.config.cloud[0]);
    }

    jitsu.log.info('Deploying application to the cloud with:')
    jitsu.inspect.putObject(cloud);

    async.series({
      //
      // 1. Fetch the endpoints so that we can properly
      //    tell the user what datacenter they are in later.
      //
      endpoints: function getEndpoints(next) {
        jitsu.apps.endpoints(next);
      },
      //
      // 2. Start the app with the specified cloud information.
      //
      start: function start(next) {
        jitsu.apps.datacenter(name, cloud, next);
      }
    }, function (err, result) {
      if (err) {
        jitsu.log.error('Error starting ' + name.magenta);
        return callback(err);
      }

      var endpoints = result.endpoints,
          tld = result.endpoints[provider][datacenter];

      jitsu.log.info('App ' + name.magenta + ' is now started');
      jitsu.log.info(('http://' + app.subdomain + tld.replace('api', '')).magenta + ' on Port ' + '80'.magenta);
      callback(null, app);
    });
  }

  //
  // Retreive the app and call `setCloud` or `viewCloud`
  // depending on what arguments have been passed.
  //
  function viewApp() {
    jitsu.log.info('Fetching app ' + name.magenta);
    jitsu.apps.view(name, function (err, app) {
      if (err) {
        jitsu.log.error('App ' + name.magenta + ' doesn\'t exist on Nodejitsu yet!');
        jitsu.log.help('Try running ' + 'jitsu deploy'.magenta);
        return callback({});
      }

      return provider && datacenter
        ? setCloud(app)
        : viewCloud(app);
    });
  }

  //
  // Read the app from the current directory.
  //
  function readApp(next) {
    jitsu.package.read(process.cwd(), function (err, pkg) {
      if (err) {
        callback(err);
      }

      name = pkg.name;
      next();
    });
  }

  return !name
    ? readApp(viewApp)
    : viewApp();
};

//
// Usage for `jitsu apps cloud`.
//
apps.cloud.usage = [
  'Views or sets the cloud information for the specified application defaulting',
  'to the app in the current directory',
  '',
  'jitsu apps cloud [<name>]',
  'jitsu cloud [<name>]',
  '',
  'jitsu apps cloud [<name>] <provider> <datacenter> [<drones>]',
  'jitsu cloud [<name>] <provider> <datacenter> [<drones>]',
  '',
  'Options:',
  '--ram  RAM size to deploy to'
];

//
// ### function browse (name, callback)
// #### @name {string} Application name (optional).
// #### @callback {function} Continuation to respond to.
// Open app in a browser.
//
apps.browse = function (name, callback) {
  function runBrowser(err, pkg) {
    if (err) {
      return callback(err);
    }

    opener('https://' + (pkg.domain || (pkg.domains && pkg.domains[0]) || (pkg.subdomain + '.jit.su')));
    callback();
  }

  if (!name) {
    return jitsu['package'].tryRead(process.cwd(), runBrowser, function (pkg) {
      runBrowser(null, pkg);
    });
  }

  jitsu.apps.view(name, runBrowser);
};

//
// Usage for `jitsu apps browse`.
//
apps.browse.usage = [
  'Open application in a browser.',
  '',
  'jitsu apps browse [<name>]'
];
