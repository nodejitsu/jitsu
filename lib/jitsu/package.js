/*
 * package.js: Utilities for working with package.json files.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    util = require('util'),
    async = require('async'),
    analyzer = require('require-analyzer'),
    npm = require('npm'),
    npmout = require('npm/lib/utils/output'),
    optimist = require('optimist'),
    semver = require('semver'),
    winston = require('winston'),
    jitsu = require('../jitsu');

var package = exports;

//
// Monkey patch `npmout.write()` so that we don't need log or out files
//
npmout.write = function () {
  var args = Array.prototype.slice.call(arguments),
      callback;

  args.forEach(function (arg) {
    if (typeof arg === 'function') {
      callback = arg;
    }
  });

  callback();
};

//
// Setup `npmtar` to be a lazy loaded variable that
// isn't setup until `npm.load` is invoked.
//
var npmtar;

//
// ### function get (dir, callback)
// #### @dir {string} Directory to get the package.json from
// #### @options {object} Ignored
// #### @callback {function} Continuation to respond to when complete
// Attempts to read the package.json from the specified `dir`. If it is
// unable to do, walks the user through creating a new one from scratch.
//
package.get = function (dir, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  package.read(dir, function (err, pkg) {
    if (err) {
      return package.create(dir, callback);
    }

    package.validate(pkg, dir, options, function (err, updated) {
      return err ? callback(err) : callback(null, updated);
    });
  });
};

//
// ### function read (dir, callback)
// #### @dir {string} Directory to read the package.json from
// #### @callback {function} Continuation to pass control to when complete
// Attempts to read the package.json file out of the specified directory.
//
package.read = function (dir, callback) {
  var file = path.join(dir, 'package.json');

  fs.readFile(file, function (err, data) {
    if (err) {
      return callback(err);
    }

    data = data.toString();

    if (!data.length) {
      return callback(new Error('package.json is empty'));
    }
    
    try {
      data = JSON.parse(data.toString());
    } 
    catch (ex) {
      return callback(new Error('Invalid package.json file'));
    }
    
    callback(null, data);
  });
};

//
// ### function tryRead (dir, callback, success)
// #### @dir {string} Directory to try to read the package.json from.
// #### @callback {function} Continuation to respond to on error.
// #### @success {function} Continuation to respond to on success.
// Attempts to read the package.json file from the specified `dir`; responds
// to `callback` on error and `success` if the read operation worked.
//
package.tryRead = function (dir, callback, success) {
  package.read(dir, function (err, pkg) {
    return err ? callback(new Error('No package.json in ' + dir), true) : success(pkg);
  });
};

//
// ### function createPackage (dir, callback)
// #### @dir {string} Directory to create the package.json in
// #### @callback {function} Continuation to respond to when complete
// Walks the user through creating a simple package.json in the specified
// `dir` then writes to file and responds to `callback`.
//
package.create = function (dir, callback) {
  var help = [
    '',
    'A package.json stores meta-data about your application',
    'In order to continue we\'ll need to gather some information about your app',
    '',
    'Press ^C at any time to quit.',
    'to select a default value, press ENTER'
  ];

  winston.warn('There in no valid package.json file in ' + dir.grey);
  winston.warn('Creating package.json at ' + (path.join(dir, '/package.json')).grey);

  help.forEach(function (line) {
    winston.help(line);
  });

  fillPackage(null, dir, function(err, pkg) {
    if (err) {
      return callback(err);
    }
    
    package.write(pkg, dir, true, function(err, pkg) {
      if (err) {
        return callback(err);
      }
      tryAnalyze(pkg, dir, callback);
    });
  });
};

//
// ### function validate (pkg, dir, callback)
// #### @pkg {Object} Parsed package.json to validate
// #### @dir {string} Directory containing the package.json file
// #### @options {object} Ignored
// #### @callback {function} Continuation to respond to when complete
// Validates the specified `pkg` against the properties list
// returned from `package.properties(dir)`.
// Also prompts the user if there are any missing properties.
//
package.validate = function (pkg, dir, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  var properties = package.properties(dir),
      missing = [];

  function checkProperty (desc, next) {
    var nested = desc.name.split('.'),
        value = pkg[nested[0]];

    if (nested.length > 1 && value) {
      value = value[nested[1]];
    }

    if (!value || (missing.validator && !missing.validator.test(value))) {
      missing.push(desc);
    }

    next();
  }

  async.forEach(properties, checkProperty, function () {
    if (missing.length <= 0) {
      return tryAnalyze(pkg, dir, callback);
    }

    var help, names = missing.map(function (prop) {
      return '  ' + (prop.message || prop.name).grey;
    });

    help = [
      '',
      'Your package.json file is missing required fields:',
      '',
      names.join(', '),
      '',
      'Prompting user for required fields.',
      'Press ^C at any time to quit.',
      ''
    ];

    help.forEach(function (line) {
      winston.warn(line);
    });

    fillPackage(pkg, dir, function (err, pkg) {
      if (err) {
        return callback(err);
      }
      
      package.write(pkg, dir, true, function (err, pkg) {
        return err 
          ? callback(err) 
          : tryAnalyze(pkg, dir, callback);
      });
    });
  });
};

//
// ### function writePackage (pkg, dir, callback)
// #### @pkg {Object} Data for the package.json
// #### @dir {string} Directory to write the package.json in
// #### @callback {function} Continuation to respond to when complete
// Prompts the user about writing the new package.json file. If the user
// OKs the operation, attempts to write to file. Otherwise restarts the
// create operation in the specified `dir`.
//
package.write = function (pkg, dir, create, callback) {
  if (!callback) {
    callback = create;
    create = null;
  }
  
  delete pkg.analyzed;

  winston.warn('About to write ' + path.join(dir, 'package.json').magenta);
  jitsu.log.putObject(pkg, 2);
  jitsu.prompt.get([{
    name: 'answer',
    message: 'Is this ' + 'ok?'.green.bold,
    default: 'yes'
  }], function (err, result) {
    if (result.answer !== 'yes' && result.answer !== 'y') {
      return create ? package.create(dir, callback) : callback(new Error('Save package.json cancelled.'));
    }

    fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2), function (err) {
      return err ? callback(err) : callback(null, pkg, dir);
    })
  });
};

//
// ### function checkDependencies (pkg, dir, callback)
// #### @pkg {Object} Parsed package.json to check dependencies for.
// #### @dir {string} Directory containing the package.json file.
// #### @callback {function} Continuation to respond to when complete.
// Analyzes the dependencies in `pkg` using the `require-analyzer` module.
//
package.analyzeDependencies = function (pkg, dir, callback) {
  winston.info('Analyzing your application dependencies in ' + pkg.scripts.start.magenta);
  analyzer.analyze({ target: path.join(dir, pkg.scripts.start) }, function (err, pkgs) {
    //
    // Create a hash of `'package': '>= version'` for the new dependencies
    //
    var versions = analyzer.extractVersions(pkgs),
        updates;

    if (package.newDependencies(pkg.dependencies, versions)) {
      //
      // If there are new dependencies, indicate this to the user.
      //
      winston.info('Found new dependencies. They will be added automatically');

      //
      // Extract, merge, and display the updates found by `require-analyzer`
      //
      updates = analyzer.updates(pkg.dependencies, versions);
      updates = analyzer.merge({}, updates.added, updates.updated);
      jitsu.log.putObject(updates);

      //
      // Update the package.json dependencies
      //
      pkg.dependencies = analyzer.merge({}, pkg.dependencies || {}, updates);
    }

    callback(null, pkg, updates);
  });
};

//
// ### function createPackage (dir, callback)
// #### @dir {string} Directory to create the package *.tgz file from
// #### @version {string} Optional version to name saved file.
// #### @callback {function} Continuation to pass control to when complete
// Creates a *.tgz package file from the specified directory `dir`.
//
package.createTarball = function (dir, version, callback) {
  if (!callback) {
    callback = version;
    version = null;
  }

  package.read(dir, function (err, pkg) {
    if (err) {
      return callback(err);
    }

    if (dir.slice(-1) === '/') {
      dir = dir.slice(0, -1);
    }

    var name = [jitsu.config.get('username'), pkg.name, version || pkg.version].join('-') + '.tgz',
        tarball = path.join(jitsu.config.get('tmproot'), name);

    npm.load({ exit: false }, function () {
      //
      // Lazy load `npmtar`, then use it to package 
      // the specified tarball.
      //
      npmtar = npmtar || require('npm/lib/utils/tar');
      npmtar.pack(tarball, dir, pkg, true, function (err) {
        return err ? callback(err) : callback(null, pkg, tarball);
      });
    });
  });
};

//
// ### function updateTarball (version, pkg, existing, callback)
// #### @version {string} **Optional** Version to use for the updated tarball
// #### @pkg {Object} Current package.json file on disk
// #### @existing {Object} Remote package.json stored at Nodejitsu
// #### @callback {function} Continuation to respond to when complete.
//
//
package.updateTarball = function (version, pkg, existing, firstSnapshot, callback) {
  if (!callback) {
    callback = firstSnapshot;
    firstSnapshot = false;
  }

  function executeCreate (err) {
    if (err) {
      return callback(err, true);
    }

    version = version || pkg.version;
    jitsu.package.createTarball(process.cwd(), version, function (err, ign, filename) {
      if (err) {
        return callback(err, true)
      }

      winston.warn('Creating new snapshot for version ' + version.magenta);
      winston.silly('Filename: ' + filename);

      fs.stat(filename, function(err, stat) {
        if (err) return callback(err);

        // XXX Is 50mb enough? Please warning message
        if (stat.size > 50 * 1024 * 1024) {
          winston.warn('You\'re trying to upload snapshot larger than ' + '50M'.magenta + '.');
          winston.warn('This is not recommended practice.');
        }

        jitsu.snapshots.create(pkg.name, version, filename, function (err, snapshots) {
          winston.info('Done creating snapshot ' + version.magenta);
          return err ? callback(err) : callback(null, version, pkg);
        });
      });
    });
  }

  var old = false;

  if (!firstSnapshot) {
    winston.silly('Existing version: ' + existing.version.magenta);
    winston.silly('Local version: ' + pkg.version.magenta);
    var old = semver.gte(existing.version, pkg.version);

    if (old) {
      //
      // If the existing version is greater than the version in the
      // package.json file on disk, update it and then write back to disk.
      //
      winston.warn('Local version appears to be old.');
      winston.warn('Your package.json version will be incremented for you automatically.');
      pkg.version = semver.inc(existing.version, 'build');
    }
  }

  return old
    ? package.write(pkg, process.cwd(), executeCreate)
    : executeCreate();
};

//
// ### function newDependencies (current, updated)
// #### @current {Object} Set of current dependencies
// #### @updated {Object} Set of updated dependencies
// Returns a value indicating if there are any new dependencies
// in `updated` as compared to `current`.
//
package.newDependencies = function (current, updated) {
  var updates = analyzer.updates(current, updated);
  return Object.keys(updates.added).length > 0 || Object.keys(updates.updated).length > 0;
};

//
// ### function properties (dir)
// #### @dir {string} Directory in which the package.json properties are being used
// Returns a new set of properties to be consumed by `jitsu.prompt` to walk a user
// through creating a new `package.json` file.
//
package.properties = function (dir) {
  return [
    {
      name: 'name',
      message: 'App name',
      validator: /[\w|\-]+/,
      default: path.basename(dir)
    },
    {
      name: 'subdomain',
      validator: /[\w|\-|\_]+/,
      help: [
        '',
        'The ' + 'subdomain '.grey + 'is where your application will reside.',
        'Your application will then become accessible at: http://' + 'yourdomain'.grey + '.nodejitsu.com',
        ''
      ],
      default: path.basename(dir)
    },
    {
      name: 'scripts.start',
      message: 'scripts.start',
      validator: function (script) {
        try {
          fs.statSync(path.join(dir, script));
          return true;
        }
        catch (ex) {
          return false;
        }
      },
      warning: 'Start script was not found in ' + dir.magenta,
      default: searchStartScript(dir)
    },
    {
      name: 'version',
      validator: /[\w|\-|\.]+/,
      default: '0.0.0'
    }
  ];
};

//
// ### function available (pkg, dir, callback, createPackage)
// #### @pkg {Object} Current package.json file on disk
// #### @dir {string} Directory in which the package.json properties are being used
// #### @callback {function} Continuation to respond to when complete.
// #### @createPackage {function} Function needed to make it recursive
// Prompts for appname and subdomain until the combination is available
//
package.available = function (pkg, dir, callback, createPackage) {
  jitsu.apps.available(pkg, function (err, isAvailable) {
    var props, fields = [];
    if (err) {
      winston.error('There was an error while checking app name / subdomain availability.');
      return callback(err);
    }
    if (!isAvailable.available) {
      if (isAvailable.appname === false) {
        delete pkg.name;
        fields.push('name');
      }
      if (isAvailable.subdomain === false) {
        delete pkg.subdomain;
        fields.push('subdomain');
      }
      props = package.properties(dir).filter(function (p) {
        return fields.indexOf(p.name) !== -1;
      });
      if (fields.indexOf('name') !== -1) {
        winston.error('The application name you have requested is already in use.');
      }
      if (fields.indexOf('subdomain') !== -1) {
        winston.error('The subdomain you have requested is already in use.');
      }
      jitsu.prompt.addProperties(pkg, props, createPackage);
      return;
    }

    callback(null, pkg);
  });
}

function searchStartScript(dir) {
  var scripts = ['server.js', 'bin/server', 'app.js', 'index.js'];
  for (i in scripts) {
    if (path.existsSync(path.join(dir, scripts[i]))) {
      return scripts[i];
    }
  }
}

function tryAnalyze (target, dir, callback) {
  if (target.analyzed) {
    return callback(null, target);
  }
  
  var noanalyze = !((jitsu.config.get('analyze') === 'true')
                  || (jitsu.config.get('analyze') === true))
           || ((jitsu.config.get('noanalyze') === 'true')
                  || (jitsu.config.get('noanalyze') === true))
           || ((target.analyze === 'false')
                  || (target.analyze === false))
           || optimist.argv.noanalyze

  if (noanalyze) {
    winston.info('skipping require-analyzer because ' + 'noanalyze'.magenta + ' option is set');
    return callback(null, target);
  }

  package.analyzeDependencies(target, dir, function (err, addedDeps, updates) {
    if (err) {
      return callback(err);
    }

    target.analyzed = true;
    return updates 
      ? package.write(addedDeps, dir, true, callback) 
      : callback(null, addedDeps);
  });
}

function fillPackage (base, dir, callback) {
  base = base || {};
  var subdomain, descriptors, missing; 
  
  missing = ['name', 'subdomain', 'version'].filter(function (prop) { 
    return !base[prop] 
  });
  
  if (!(base.scripts && base.scripts.start)) {
    missing.push('scripts.start');
  }
  
  descriptors = package.properties(dir).filter(function (descriptor) {
    if (descriptor.name == 'subdomain') {
      subdomain = descriptor;
    }
    
    return missing.indexOf(descriptor.name) !== -1;
  });
  
  jitsu.prompt.addProperties(base, descriptors, function createPackage (err, result) {
    if (err) {
      //
      // TODO: Something here...
      //
      winston.error('Unable to add properties to package description.');
      return callback(err);
    }
    
    result.scripts = result.scripts || {};
    package.available(result, dir, callback, createPackage);
  });
}
