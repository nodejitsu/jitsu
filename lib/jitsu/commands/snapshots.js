/*
 * snapshots.js: Commands related to snapshots resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var fs          = require('fs'),
    semver      = require('semver'),
    dateformat  = require('dateformat'),
    jitsu       = require('../../jitsu'),
    ProgressBar = require('progress'),
    utile       = jitsu.common;

var snapshots = exports;

snapshots.usage = [
  'The `jitsu snapshots` command manages snapshots',
  'for apps on Nodejitsu. Snapshots are images of the',
  'apps\'s code that is deployed to the Nodejitsu Platform.',
  'Valid commands are: ',
  '',
  'jitsu snapshots create',
  'jitsu snapshots list',
  'jitsu snapshots list <app-name>',
  'jitsu snapshots activate',
  'jitsu snapshots activate <app-name>',
  'jitsu snapshots activate <app-name> <snapshot-id>',
  'jitsu snapshots fetch',
  'jitsu snapshots fetch <app-name>',
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

  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name  = args[0] || null;
  }

  function getAppName(callback) {
    jitsu.package.read(process.cwd(), function (err, pkg) {
      if (!err) {
        jitsu.log.info('Attempting to load snapshots for ' + (process.cwd()+ '/package.json').grey);
        return callback(null, pkg.name);
      }
      callback(err);
    });
  }

  function listSnapshots(appName) {
    jitsu.log.info('Listing snapshots for ' + appName.magenta);
    jitsu.snapshots.list(appName, function (err, snapshots) {
      if (err) {
        return callback(err, true);
      }
      if (snapshots && snapshots.length > 0) {
        var rows = [['name', 'status', 'created', 'md5']],
            colors = ['underline', 'underline', 'underline', 'underline'];

        snapshots.forEach(function (snap) {

          var status = "archived".grey;

          //
          // showing running vs. active to users is confusing
          // we should  just show "active" or "archived" states to user in CLI
          //
          if (snap.running) {
            status = "active".green;
          }

          var date = new Date(snap.ctime);
          date = dateformat(date, "mm/dd HH:MM:ss Z");
          rows.push([
            snap.id,
            status,
            date,
            snap.md5
          ]);
        });

        jitsu.inspect.putRows('data', rows, colors);
      }
      else {
        jitsu.log.warn('No snapshots for application ' + appName.magenta);
      }
      callback(null, snapshots, appName);
    });
  }

  if (!name) {
    getAppName(function (err, appName) {
      if (err) {
        jitsu.log.warn('App name is required to list snapshots');
        jitsu.commands.list(function () {
          jitsu.log.info('Which app to view ' + 'snapshots'.magenta + ' for?');
          jitsu.prompt.get(["app name"], function (err, result) {
            if (err) {
              jitsu.log.error('Prompt error:');
              return callback(err);
            }
            appName = result["app name"];
            listSnapshots(appName, callback);
          });
        });
      } else {
        listSnapshots(appName, callback);
      }
    });
  } else {
    listSnapshots(name, callback);
  }

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
// ### function create (version, callback)
// #### @version {string} **optional** Version of the application to create
// #### @callback {function} Continuation to pass control to when complete.
// Creates a snapshots for the application belonging for the authenticated user
// using the data in the current directory. If `version` is not supplied the
// value in `package.version` will be used.
//
snapshots.create = function (version, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    version  = args[0] || null;
  }

  jitsu.package.get(process.cwd(), function (err, pkg) {
    if (err) {
      return callback(err, true);
    }

    jitsu.apps.view(pkg.name, function (err, existing) {
      if (err) {
        jitsu.log.warn('No application exists for ' + pkg.name.magenta);
        return callback(err, true);
      }

      jitsu.package.updateTarball(version, pkg, existing, callback);
    });
  });
};

snapshots.create.usage = [
  'Creates a snapshot for the application in the current directory',
  '',
  'jitsu snapshots create',
  'jitsu snapshots create <app-name>'
];

snapshots.activate = function (name, id, callback) {

  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name  = args[0] || null;
    id = args[1] || null;
  }

  if (!name) {
    snapshots.list(null, function (err, results, name) {
      executeActivate(err, results, name);
    });
  } else if (!id) {
    snapshots.list(name, function (err, results) {
      if (err) {
        //
        // Remark: The nodejitsu API should probably be returning a 404 here and not a 400
        //
        if (err.statusCode === 400) {
          jitsu.log.error('Application ' + name.magenta + ' not found.');
        }
        return callback(err);
      }
      executeActivate(err, results, name);
    });
  } else {
    activateSnapshot(name, id, callback);
  }

  function executeActivate (err, snapshots, name) {
    jitsu.prompt.get(['snapshot'], function (err, result) {
      var snapshot = snapshots.filter(function (snap) {
        return snap.id === result.snapshot;
      })[0];
      if (!snapshot) {
        return callback(new Error('Cannot find snapshot with name: ' + result['snapshot'].magenta), true);
      }

      activateSnapshot(name, snapshot.id, callback);
    });
  }

  function activateSnapshot(name, id, callback) {
    jitsu.log.info('Activating snapshot ' + id.magenta);

    jitsu.snapshots.activate(name, id, function (err, result) {
      if (err) {
        return callback(err);
      }
      jitsu.log.info('Snapshot ' + id.magenta + ' is now active');
      //
      // Remark: After activating a snapshot, we immediately stop && start it,
      // as to update the running version of the snapshot
      //
      jitsu.commands.start(name, function (err) {
        if (err) {
          return callback(err);
        }

        jitsu.log.info('Snapshot ' + id.magenta + ' is now running');
        callback();
      });
    });
  }

};

snapshots.activate.usage = [
  'Activates a snapshot for the application in the current directory',
  '',
  'jitsu snapshots activate',
  'jitsu snapshots activate <app-name>',
  'jitsu snapshots activate <app-name> <snapshot-id>'
];

snapshots.fetch = function (name, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name  = args[0] || null;
  }

  if (typeof name === 'function') {
    name = null;
    callback = name;
  }

  function fetch(appName, snapshot) {
    jitsu.snapshots.fetch(appName, snapshot.id)
      .on('error', callback)
      .on('response', function (res) {
        if (res.statusCode === 404) {
          return callback(new Error('No such snapshot'));
        }
        else if (res.statusCode !== 200) {
          return callback(new Error('Unknown status code: ' + res.statusCode));
        }

        if (!jitsu.config.get('raw') && process.stdout.isTTY ) {
          var bar = new ProgressBar('info'.green + '\t Downloading: [:bar] :percent',{
            total: parseInt(res.headers['content-length'], 10),
            width: 30,
            complete: '=',
            incomplete: ' '
          });

          res.on('data', function (chunk) {
            bar.tick(chunk.length);
          });

          res.on('end', function () {
            // fix for bar that sometimes hangs at 99%
            if (bar) {
              bar.tick(bar.total - bar.curr);
            }

            console.log();
          });
        }

        var filename = appName.replace('/', '-') + '-' + snapshot.id + '.tgz';
        res.pipe(fs.createWriteStream(filename)).on('close', function () {
          jitsu.log.info('Snapshot ' + snapshot.id + ' saved to file ' + filename + '.');
          return callback();
        });
      });
  }

  snapshots.list(name, function (err, snapshots, appName) {
    if (err) {
      return callback(err);
    }

    jitsu.prompt.get(['snapshot'], function (err, result) {
      if (err) {
        return callback(err);
      }

      var snapshot = snapshots.filter(function (snap) {
        return snap.id === result.snapshot;
      })[0];

      if (!snapshot) {
        return callback(new Error('Cannot find snapshot with name: ' + result['snapshot'].magenta), true);
      }

      fetch(appName, snapshot);
    });
  });
};

snapshots.fetch.usage = [
  'Fetches a snapshot for the application in the current directory',
  '',
  'jitsu snapshots fetch',
  'jitsu snapshots fetch <app-name>'
];

//
// ### function destroy (appName, callback)
// #### @count {string} **optional** Number of snapshots to destroy
// #### @callback {function} Continuation to pass control to when complete.
// Destroys the specified number of snapshots for the application in the current
// directory. If `count` is not supplied one snapshot will be destroyed.
//
snapshots.destroy = function (name, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    name  = args[0] || null;
  }

  if (!name) {
    return jitsu.package.tryRead(process.cwd(), callback, function (pkg) {
      snapshots.list.apply(null, [ pkg.name ].concat(executeDestroy));
    });
  }
  else {
    snapshots.list.apply(null, [ name ].concat(executeDestroy));
  }

  function executeDestroy (err, snapshots, name) {
    if (err) {
      return callback(err);
    }

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
};

snapshots.destroy.destructive = true;
snapshots.destroy.usage = [
  'Destroys a snapshot for the application in the current directory',
  '',
  'jitsu snapshots destroy',
  'jitsu snapshots destroy <app-name>'
];
