/*
 * package.js: Utilities for working with package.json files.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    async = require('async'),
    analyzer = require('require-analyzer'),
    semver = require('semver'),
    winston = require('winston'),
    jitsu = require('jitsu');

var package = exports;

//
// ### function get (dir, callback)
// #### @dir {string} Directory to get the package.json from
// #### @callback {function} Continuation to respond to when complete
// Attempts to read the package.json from the specified `dir`. If it is
// unable to do, walks the user through creating a new one from scratch.
//
package.get = function (dir, callback) {
  package.read(dir, function (err, pkg) {
    if (err) {
      return package.create(dir, callback);
    }
    
    package.validate(pkg, dir, function (err, updated) {
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
      callback(null, JSON.parse(data.toString()));
    }
    catch (ex) {
      callback(new Error('Invalid package.json file'));
    }
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
  winston.warn('Creating package.json at ' + (dir + '/package.json').grey);

  help.forEach(function (line) {
    winston.help(line);
  });
  
  jitsu.prompt.get(package.properties(dir), function (err, result) {
    if (err) {
      //
      // TODO: Something here...
      //
    }
    
    var pkg = {
      name: result.name,
      subdomain: result.subdomain,
      scripts: {
        start: result['scripts.start']
      },
      version: result.version
    };
    
    package.write(pkg, dir, true, callback);
  });
};

//
// ### function validate (pkg, dir, callback)
// #### @pkg {Object} Parsed package.json to validate
// #### @dir {string} Directory containing the package.json file
// #### @callback {function} Continuation to respond to when complete
// Validates the specified `pkg` against the properties list 
// returned from `package.properties(dir)`.
//
package.validate = function (pkg, dir, callback) {
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
    if (missing.length > 0) {
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
      
      return jitsu.prompt.addProperties(pkg, missing, function (err, updated) {
        return err ? callback(err) : package.analyzeDependencies(updated, dir, function (err, addedDeps) {
          return err ? callback(err) : package.write(addedDeps, dir, true, callback);
        })
      });
    }
    
    package.analyzeDependencies(pkg, dir, function (err, updated) {
      return err ? callback(err) : callback(null, updated);
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
  
  winston.warn('About to write ' + path.join(dir, 'package.json').magenta);
  jitsu.log.putObject(pkg, 2);
  jitsu.prompt.get({
    name: 'answer',
    message: 'Is this ' + 'ok?'.green.bold,
    default: 'yes'
  }, function (err, result) {
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
  analyzer.analyze({ target: path.join(process.cwd(), pkg.scripts.start), timeout: 1000 }, function (err, pkgs) {
    //
    // Create a hash of `'package': '>= version'` for the new dependencies
    //
    var updates, versions = analyzer.extractVersions(pkgs);
    
    if (package.newDependencies(pkg.dependencies, versions)) {
      winston.info('Found new dependencies');
      
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
    
    callback(null, pkg);
  });
};

//
// ### function createPackage (dir, callback)
// #### @dir {string} Directory to create the package *.tgz file from
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
    
    var parent = path.dirname(dir),
        base = path.basename(dir),
        tarball = path.join(jitsu.config.settings.tmproot, [jitsu.config.username, pkg.name, version || pkg.version].join('-') + '.tgz'),
        target = fs.createWriteStream(tarball),
        tarargs = ['-cvf', '-', '-C', parent, base],
        tar, gzip, errState;
        
    //
    // TODO (indexzero) Support for `.jitsuignore` files and support for package.json files
    //
    tar = spawn(jitsu.config.settings.tar, tarargs);
    gzip = spawn(jitsu.config.settings.gzipbin, ["--stdout"]);
        
    //
    // TODO (indexzero) Make this piping more robust
    //
    util.pump(tar.stdout, gzip.stdin);
    util.pump(gzip.stdout, target);
    
    target.on("close", function (err, ok) {
      if (errState) {
        return;
      }
      else if (err) {
        return callback(errState = err);
      }
      
      callback(null, pkg, tarball);
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
package.updateTarball = function (version, pkg, existing, callback) {
  function executeCreate (err) {
    if (err) {
      return callback(err, true);
    }
    
    version = version || pkg.version;
    jitsu.package.createTarball(process.cwd(), version, function (err, ign, filename) {
      if (err) {
        return callback(err, true)
      }

      winston.warn('Creating new snapshot for version ' + pkg.version.magenta);
      winston.silly('Filename: ' + filename);
      jitsu.snapshots.create(pkg.name, version, filename, function (err, snapshots) {
        winston.info('Done creating snapshot ' + version.magenta);
        return err ? callback(err) : callback(null, version, pkg);
      });
    });
  }
  
  winston.silly('Existing version: ' + existing.version.magenta);
  winston.silly('Local version: ' + pkg.version.magenta);
  var old = semver.gte(existing.version, pkg.version),
      update = package.newDependencies(existing.dependencies, pkg.dependencies);
  
  if (old) {
    //
    // If the existing version is greater than the version in the
    // package.json file on disk, update it and then write back to disk.
    //
    winston.warn('Your package.json version will be incremented for you automatically.');
    pkg.version = package.bumpVersion(existing.version);
  }
  
  if (update) {
    //
    // If there are new dependencies, indicate this to the user.
    //
    winston.warn('New dependencies will be added for you automatically.');
  }
  
  return old || update 
    ? package.write(pkg, process.cwd(), executeCreate)
    : executeCreate();
};

//
// ### function bumpVersion (version)
// #### @version {string} Existing version to bump
// Returns an incremental copy of `version` with the
// build number updated. e.g:
//
//     package.bumpVersion('0.1.1-2');
//     // '0.1.1-3'
//
package.bumpVersion = function (version) {
  var match = semver.expressions.parse(version),
      major = match[1],
      minor = match[2],
      patch = match[3],
      build = match[4];
  
  var compile = [major, minor, patch];
  
  if (build) {
    //
    // If there's a build string, extrapolate any numbers from it,
    // and increment them, then push it back to the string to build.
    //
    build = build.match(/^-?(\d{1,3})-?$/)[1] || 0;
    build = parseInt(build, 10) + 1;
  }
  else {
    build = 1;
  }
  
  return compile.join('.') + '-' + build;
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
      default: 'server.js'

    },
    {
      name: 'version',
      validator: /[\w|\-|\.]+/,
      default: "0.0.0"
    }
  ];
};