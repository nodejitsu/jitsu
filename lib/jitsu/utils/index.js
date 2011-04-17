/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var util = require('util'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path'),
    async = require('async'),
    request = require('request'),
    winston = require('winston'),
    jitsu = require('jitsu');
 
var utils = exports;

utils.base64 = require('./base64');

//
// ### function snapshotTime (name) 
// #### @name {string} Filename for the snapshot
// Returns a formatted date string for the unix time 
// in the snapshot filename.
//
utils.snapshotTime = function (name) {
  var time = name.match(/[\w|\-]+-[\w|\-]+-(\d+)/)[1];
  return utils.formatTime(new Date(parseInt(time, 10)));
};

//
// ### function formatTime (obj)
// #### @obj {Date} Date to format
// Returns a formatted date string for `obj` in the format
// YYYY/MM/DD HH:MM:SS
//
utils.formatTime = function (obj) {
  var date = [obj.getFullYear(), obj.getMonth(), obj.getDate()].join('/'),
      time = [obj.getHours(), obj.getMinutes(), obj.getSeconds()].join(':');
  
  return [date, time].join(' ');
};

//
// ### function readPackage (dir, callback)
// #### @dir {string} Directory to read the package.json from
// #### @callback {function} Continuation to pass control to when complete
// Attempts to read the package.json file out of the specified directory.
//
utils.readPackage = function (dir, callback) {
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
      require('eyes').inspect(ex);
      callback(new Error('Invalid package.json file'));
    }
  });
};

//
// ### function tryReadPackage (dir, callback, success)
// #### @dir {string} Directory to try to read the package.json from.
// #### @callback {function} Continuation to respond to on error.
// #### @success {function} Continuation to respond to on success.
// Attempts to read the package.json file from the specified `dir`; responds
// to `callback` on error and `success` if the read operation worked. 
//
utils.tryReadPackage = function (dir, callback, success) {
  utils.readPackage(dir, function (err, pkg) {
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
utils.createPackage = function (dir, callback) {
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
  
  jitsu.prompt.get(utils.packageProperties(dir), function (err, result) {
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
    
    utils.writePackage(pkg, dir, callback);
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
utils.writePackage = function (pkg, dir, callback) {
  winston.warn('About to write ' + (dir + 'package.json').magenta);
  jitsu.log.putObject(pkg, 2);
  jitsu.prompt.get({
    name: 'answer',
    message: 'Is this ' + 'ok?'.green.bold,
    default: 'yes'
  }, function (err, result) {
    if (result.answer !== 'yes' && result.answer !== 'y') {
      return utils.createPackage(dir, callback);
    }
    
    fs.writeFile(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2), function (err) {
      return err ? callback(err) : callback(null, pkg, dir);
    })
  });
};

utils.validatePackage = function (pkg, dir, callback) {
  var properties = utils.packageProperties(dir),
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
        'Your package.json file is missing required properties:',
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
        return err ? callback(err) : utils.writePackage(updated, dir, callback);
      });
    }
    
    callback(null, pkg);
  });
};

//
// ### function getPackage (dir, callback)
// #### @dir {string} Directory to get the package.json from
// #### @callback {function} Continuation to respond to when complete
// Attempts to read the package.json from the specified `dir`. If it is
// unable to do, walks the user through creating a new one from scratch.
//
utils.getPackage = function (dir, callback) {
  utils.readPackage(dir, function (err, pkg) {
    if (err) {
      return utils.createPackage(dir, callback);
    }
    
    utils.validatePackage(pkg, dir, function (err, updated) {
      return err ? callback(err) : callback(null, updated);
    });
  });
};

//
// ### function createPackage (dir, callback)
// #### @dir {string} Directory to create the package *.tgz file from
// #### @callback {function} Continuation to pass control to when complete
// Creates a *.tgz package file from the specified directory `dir`.
//
utils.packageDir = function (dir, callback) {
  utils.readPackage(dir, function (err, pkg) {
    if (err) {
      return callback(err);
    }
    
    if (dir.slice(-1) === '/') {
      dir = dir.slice(0, -1);
    }
    
    var parent = path.dirname(dir),
        base = path.basename(dir),
        tarball = path.join(jitsu.config.settings.tmproot, [jitsu.config.username, pkg.name, Date.now()].join('-') + '.tgz'),
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
// ### function missingKeys (source, target) 
// #### @source {Array} List of keys for the current object
// #### @target {Array} List of keys for the new object
// Returns the complement of the intersection of the two arrays.
//
// e.g. [1,2,3,5], [1,2,3,4,5] => [4]
//
utils.missingKeys = function (source, target) {
  var missing = [];

  source.forEach(function (key) {
    if (target.indexOf(key) === -1) {
      missing.push(key);
    }
  });
  
  return missing;
};

//
// ### function objectDiff (current, update, level) 
// #### @current {Object} Current representation of the object.
// #### @update {Object} Updated representation of the object.
// #### @level {Number} Level in the object we are diffing.
// Returns an incremental diff of the `current` object  
// against the updated representation `update`
//
// e.g. { foo: 1, bar: 2 }, { foo: 2, bar: 2 } => { foo: 2 }
//
utils.objectDiff = function (current, update, level) {
  var ckeys = Object.keys(current),
      ukeys = Object.keys(update),
      diff = {};
  
  //
  // Ignore changes on the first level of the object.
  //
  level = level || 0;
  if (level > 0) {
    utils.missingKeys(ckeys, ukeys).forEach(function (key) {
      diff[key] = undefined;
    });
  }
  
  ukeys.forEach(function (key) {
    var nested, i;
    
    if (!current[key]) {
      diff[key] = update[key];
    }
    else if (Array.isArray(update[key])) {
      if (update[key].length !== current[key].length) {
        diff[key] = update[key];
      }
      else {
        for (i = 0; i < update[key]; i += 1) {
          if (current[key].indexOf(update[key][i]) === -1) {
            diff[key] = update[key];
            break;
          }
        }
      }
    }
    else if (typeof update[key] === 'object') {
      if ((nested = utils.objectDiff(current[key], update[key], level + 1))) {
        diff[key] = update[key];
      }
    }
    else {
      if (current[key] !== update[key]) {
        diff[key] = update[key];
      }
    }
  });
  
  return Object.keys(diff).length > 0 ? diff : null;
};

utils.checkVersion = function (callback) {
  var responded = false
  
  //
  // Only allow the `checkVersion` function 200ms
  // to attempt to contact GitHub.
  //
  setTimeout(function () {
    if (!responded) {
      responded = true;
      callback();
    }
  }, 200);
  
  //
  // Check the GitHub tags for `jitsu` to see if the current
  // version is outdated.
  //
  request({
    uri: 'http://github.com/api/v2/json/repos/show/nodejitsu/jitsu/tags'
  }, function (err, res, body) {
    if (!responded) {
      responded = true;
      
      try {
        var results = JSON.parse(body),
            latest = Object.keys(results.tags).map(function (ver) {
              return ver.slice(1);
            }).pop();

        if (latest > jitsu.version.join('.')) {
          winston.warn('A newer version of jitsu is available: ' + latest.magenta);
          winston.warn('Please run `npm update jitsu`');
        }
      }
      catch (ex) {
        //
        // Ignore errors from GitHub. We will notify the user
        // of an upgrade at the next possible opportunity.
        //
      }

      callback();
    }
  });
};

utils.packageProperties = function (dir) {
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