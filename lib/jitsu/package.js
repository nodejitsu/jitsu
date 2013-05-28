/*
 * package.js: Utilities for working with package.json files.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync,
    util = require('util'),
    punycode = require('punycode'),
    spawnCommand = require('spawn-command'),
    zlib = require('zlib'),
    async = require('flatiron').common.async,
    analyzer = require('require-analyzer'),
    semver = require('semver'),
    jitsu = require('../jitsu'),
    ladder = require('ladder'),
    fstream = require('fstream'),
    ProgressBar = require('progress'),
    fstreamNpm = require('fstream-npm'),
    tar = require('tar');

var package = exports;

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
      if (err.toString() === "Error: Invalid package.json file") {
        jitsu.log.error(err.toString());
        return callback(
          'Please make sure ' + (path.join(dir, '/package.json')).grey + ' is valid JSON',
          false,
          false
        );
      }
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
  var file = path.resolve(path.join(dir, 'package.json'));

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
    return err ? callback(new Error('No package found at ' + (dir + '/package.json').grey), true) : success(pkg);
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
    'A package.json stores meta-data about an app',
    'In order to continue we\'ll need to gather some information about the app',
    '',
    'Press ^C at any time to quit.',
    'to select a default value, press ENTER'
  ];

  jitsu.log.warn('There is no package.json file in ' + dir.grey);
  jitsu.log.warn('Creating package.json at ' + (path.join(dir, '/package.json')).grey);

  help.forEach(function (line) {
    jitsu.log.help(line);
  });

  fillPackage(null, dir, function (err, pkg) {
    if (err) {
      return callback(err);
    }

    package.write(pkg, dir, true, function (err, pkg) {
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
      missing = [],
      invalid = [];

  function checkProperty (desc, next) {
    var nested = desc.name.split('.'),
        value = pkg[nested[0]];

    if (nested.length > 1 && value) {
      value = value[nested[1]];
    }

    // Handle missing values
    if (!value) {
      missing.push(desc);
    }

    // handle invalid values
    function isValid(desc) {
      if (desc.validator) {
        if (desc.validator instanceof RegExp) {
          return !desc.validator.test(value);
        }

        return !desc.validator(value);
      }
      return false;
    }

    if (value && isValid(desc)) {

      if (nested.length > 1) {
        delete pkg[nested[0]][nested[1]];
      }
      else {
        delete pkg[nested[0]];
      }

      invalid.push(desc);
    }

    next();
  }

  async.forEach(properties, checkProperty, function () {

    if (missing.length <= 0 && invalid.length <= 0) {
      return tryAnalyze(pkg, dir, callback);
    }

    var help,
        missingNames = missing.map(function (prop) {
          return '  ' + (prop.message || prop.name).grey;
        }),
        invalidNames = invalid.map(function (prop) {
          return '  ' + (prop.message || prop.name).grey;
        });

    help = [
      ''
    ];

    if (missingNames.length) {
      help = help.concat([
        'The package.json file is missing required fields:',
        '',
        missingNames.join(', '),
        ''
      ]);
    }

    if (invalidNames.length) {
      help = help.concat([
        'The package.json file has invalid required fields:',
        '',
        invalidNames.join(', '),
        ''
      ]);
    }

    help = help.concat([
      'Prompting user for required fields.',
      'Press ^C at any time to quit.',
      ''
    ]);

    help.forEach(function (line) {
      jitsu.log.warn(line);
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

  jitsu.log.warn('About to write ' + path.join(dir, 'package.json').magenta);

  //
  // analyze and throw warnings if any dependencies have version of '*'
  //
  policeDependencies(pkg);

  jitsu.inspect.putObject(pkg, 2);

  jitsu.prompt.confirm('Is this ' + 'ok?'.green.bold, { default: 'yes'}, function (err, result) {
    if (err) {
      return cb(err);
    }
    if (!result) {
      return create ? package.create(dir, callback) : callback(new Error('Save package.json cancelled.'));
    }

    fs.readFile(path.resolve(path.join(dir, 'package.json')), function (e, data) {
      var offset = data ? ladder(data.toString()) : 2;

      fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg, null, offset) + '\n', function (err) {
        return err ? callback(err) : callback(null, pkg, dir);
      });
    });

  });
};

//
// ### function analyzeDependencies (pkg, dir, callback)
// #### @pkg {Object} Parsed package.json to check dependencies for.
// #### @dir {string} Directory containing the package.json file.
// #### @callback {function} Continuation to respond to when complete.
// Analyzes the dependencies in `pkg` using the `require-analyzer` module.
//
package.analyzeDependencies = function (pkg, dir, callback) {
  jitsu.log.info('Analyzing application dependencies in ' + pkg.scripts.start.magenta);
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
      jitsu.log.info('Found new dependencies. They will be added automatically');

      //
      // Extract, merge, and display the updates found by `require-analyzer`
      //
      updates = analyzer.updates(pkg.dependencies, versions);
      updates = analyzer.merge({}, updates.added, updates.updated);
      jitsu.inspect.putObject(updates);

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

    fstreamNpm({
      path: dir,
      ignoreFiles: ['.jitsuignore', '.npmignore', '.gitignore', 'package.json']
    })
      .on('error', callback)
      .pipe(tar.Pack())
      .on('error', callback)
      .pipe(zlib.Gzip())
      .on('error', callback)
      .pipe(fstream.Writer({ type: "File", path: tarball }))
      .on('close', function () {
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

      jitsu.log.info('Creating snapshot ' + version.grey);
      jitsu.log.silly('Filename: ' + filename);

      fs.stat(filename, function (err, stat) {
        var bar;

        if (err) return callback(err);

        // XXX Is 50mb enough? Please warning message
        if (stat.size > 50 * 1024 * 1024) {
          jitsu.log.warn('Snapshot is larger than ' + '50M'.magenta + '!');
          jitsu.log.warn('This is not recommended practice.');
        }

        var emitter = jitsu.snapshots.create(pkg.name, version, filename, function (err, snapshots) {
          jitsu.log.silly('Done creating snapshot ' + version.magenta);
          return err ? callback(err) : callback(null, version, pkg);
        });

        if (emitter && !jitsu.config.get('raw') && process.stdout.isTTY ) {
          var size;
          emitter.on('start', function (stats) {
            size = stats.size;
            bar = new ProgressBar('info'.green + '\t Uploading: [:bar] :percent',{
              complete  : '=',
              incomplete: ' ',
              width     : 30 ,
              total     : stats.size
            });
          });

          emitter.on('data', function (length) {
            if (bar) bar.tick(length > size ? size : length);
          });

          emitter.on('end', function () {
            // fix for bar that sometimes hangs at 99%
            if (bar) {
              bar.tick(bar.total - bar.curr);
            }

            console.log();
          });
        }
      });
    });
  }


  var start = pkg.scripts.start;
  if (start.match(/(--watch)/)) {
    jitsu.log.warn("Using the '--watch' flag may eventually cause issues as its only");
    jitsu.log.warn("intended for development usage.");
  }


  var old = false;

  if (!firstSnapshot) {
    jitsu.log.silly('Existing version: ' + existing.version.magenta);
    jitsu.log.silly('Local version: ' + pkg.version.magenta);
    old = semver.gte(existing.version, pkg.version);

    if (old) {
      //
      // If the existing version is greater than the version in the
      // package.json file on disk, update it and then write back to disk.
      //
      jitsu.log.warn('Local package version appears to be old');
      jitsu.log.warn('The ' + 'package.json'.grey + ' version will be incremented automatically');
      //
      // Check for release args then .jitsuconf or default to 'build'
      //
      var release = jitsu.argv.release || jitsu.config.get('release') || 'build';
      //
      // Pattern matching to see if release is version number or type
      // If is version number, set release to version number specified
      //
      if (jitsu.argv.release) {
        if (typeof(jitsu.argv.release) == 'string') {
          var releaseIsVersionNumber = jitsu.argv.release.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)/g);

          if (releaseIsVersionNumber) {
            pkg.version = jitsu.argv.release;
          } else {
            pkg.version = semver.inc(existing.version, release);
          }

        }
      //
      // if no release argument specified use .jitsuconf
      //
      } else {
        pkg.version = semver.inc(existing.version, release);
      }
      //
      // Default to build if user inputs as -r arg something ridiculous
      //
      if (pkg.version === null) {
        pkg.version = semver.inc(existing.version, jitsu.config.get('release') || 'build');
      }
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
      unique: true,
      message: 'Application name',
      validator: /^(?!\.)(?!_)(?!node_modules)(?!favicon.ico)[^\/@\s\+%:\n]+$/,
      warning: 'The application name  must follow the rules for npm package names.\n'+
      '         They must not start with a \'.\' or \'_\', contain any whitespace \n'+
      '         characters or any of the following characters(between quotes): "/@+%:". \n'+
      '         Additionally, the name may not be \'node_modules\' or \'favicon.ico\'.',
      default: path.basename(dir)
    },
    {
      name: 'subdomain',
      unique: true,
      message: 'Subdomain name',//+
      warning: 'The subdomain must follow the rules for ARPANET host names.  They must\n'+
      '         start with a letter, end with a letter or digit, and have as interior\n'+
      '         characters only letters, digits, and hyphen.  There are also some\n'+
      '         restrictions on the length.  Labels must be 63 characters or less.\n'+
      '         There are a few exceptions, underscores may be used as an interior \n'+
      '         character and unicode characters may be used that are supported under\n'+
      '         punycode.',
      validator: function(s){
        var reValidSubdomain = /^[a-zA-Z]$|^[a-zA-Z][a-zA-Z\d]$|^[a-zA-Z][\w\-]{1,61}[a-zA-Z\d]$/;
        if(s.indexOf('.') !== -1) { // We will support multiple level subdomains this for now warn user...
          jitsu.log.warn("**WARNING** Do not use multiple level subdomains, they will be going away soon!");
          var subdomainNames = s.split('.'),
              names = subdomainNames.map(punycode.toASCII);
          return !names.some(function(name){return !reValidSubdomain.test(name);});
        } else {
          return reValidSubdomain.test(punycode.toASCII(s));
        }
      },
      help: [
        '',
        'The ' + 'subdomain '.grey + 'is where the app will reside',
        'The app will then become accessible at: http://' + 'subdomain'.grey + '.jit.su',
        ''
      ],
      default: jitsu.config.get('username') + '-' + path.basename(dir)
    },
    {
      name: 'scripts.start',
      message: 'scripts.start',
      conform: function (script) {
        //
        // Support `scripts.start` starting with executable (`node` or `coffee`).
        //
        var split = script.split(' ');
        if (~['node', 'coffee'].indexOf(split[0])) {
          script = split.slice(1).join(' ');
        }

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
      unique: false,
      conform: semver.valid,
      default: '0.0.0'
    },
    {
      name: 'engines.node',
      unique: false,
      message: 'engines',
      conform: semver.validRange,
      default: '0.8.x'
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
    function removeAppname(){
      delete pkg.name;
      fields.push('name');
    }
    function removeSubdomain(){
      delete pkg.subdomain;
      fields.push('subdomain');
    }
    function addProps(){
      props = package.properties(dir).filter(function (p) {
        return fields.indexOf(p.name) !== -1;
      });
      // auto-suggest a new domain field based on username
      for (var p in props) {
        if (props[p].name === 'subdomain') {
          props[p].default = props[p].default + '.' + jitsu.config.get('username');
        }
      }
      jitsu.prompt.addProperties(pkg, props, createPackage);
      return;
    }
    if (err) {
      jitsu.log.error('There was an error while checking app name / subdomain availability.');
      return callback(err);
    } else if (!isAvailable.available) {
      // only appname is taken
      if(!isAvailable.appname && isAvailable.subdomain){
        jitsu.log.error('The app name requested is already in use');
        jitsu.prompt.confirm('It appears you have already used this appname before ('+pkg.name.magenta+'). ' + 'Overwrite?'.green.bold, { default: 'yes'}, function (err, result) {
          if (err) {
            return callback(err);
          }
          if (!result){
            removeAppname();
            addProps();
          } else {
            callback(null, pkg);
          }

        });
      }
      // only subdomain is taken
      else if(isAvailable.appname && !isAvailable.subdomain){
        jitsu.log.error('The subdomain requested is already in use');
        removeSubdomain();
        addProps();
      }
      //both are taken
      else if(!isAvailable.appname && !isAvailable.subdomain){
        jitsu.log.error('The subdomain and app name requested are already in use');
        jitsu.prompt.confirm('This app already exists! ('+pkg.name.magenta+'). ' + 'Do you want to deploy over it?'.green.bold, { default: 'yes'}, function (err, result) {
          if (err) {
            return callback(err);
          }
          if (!result){
            removeAppname();
            removeSubdomain();
            addProps();
          } else {
            callback(null, pkg);
          }

        });

      }
    } else { //nothing is wrong
      callback(null, pkg);
    }
  });
};

package.runScript = function (pkg, action, callback) {
  var command = pkg.scripts[action];

  if (!command) {
    //
    // If there's no such script, it's all fine.
    //
    return callback();
  }

  var child = spawnCommand(command, {
    customFds: [0, 1, 2]
  });

  child.on('exit', function (code) {
    if (code !== 0) {
      return callback(new Error('`' + command + '` exited with code ' + code));
    }

    callback();
  });
};

function searchStartScript(dir) {
  var scripts = ['server', 'app', 'index', 'bin/server'],
      script,
      i;

  for (i in scripts) {
    script = path.join(dir, scripts[i]);
    if (existsSync(script)) {
      return 'node ' + scripts[i];
    }
    else if (existsSync(script + '.js')) {
      return 'node ' + scripts[i] + '.js';
    }
    else if (existsSync(script + '.coffee')) {
      return 'coffee ' + scripts[i] + '.coffee';
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
    || (target.analyze === false));

  if (noanalyze) {
    jitsu.log.info('Skipping require-analyzer because ' + 'noanalyze'.magenta + ' option is set');
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

function policeDependencies (pkg) {
  dependencies = pkg.dependencies;
  for (var key in dependencies) {
    if (dependencies[key].toString().match(/(\*)/)) {
      jitsu.log.warn("Using '" + "*".magenta + "' as a version for dependencies may eventually cause issues");
      jitsu.log.warn('Use specific versions for dependencies to avoid future problems');
      jitsu.log.warn('See: ' + 'http://package.json.jit.su'.grey + ' for more information');
      return false;
    }
  }
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

  if (!(base.engines && base.engines.node)) {
    missing.push('engines.node');
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
      jitsu.log.error('Unable to add properties to package description.');
      jitsu.log.error(util.inspect(err));
      return callback(err);
    }

    var isUnique = descriptors.filter(function (descriptor) {
      return descriptor.unique;
    }).length;

    result.scripts = result.scripts || {};

    if (isUnique) {
      package.available(result, dir, callback, createPackage);
    }
    else {
      callback(null, result); // TODO
    }
  });
}
