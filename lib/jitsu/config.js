/*
 * config.js: Configuration for the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var nconf = require('nconf'),
    path = require('path'),
    winston = require('winston'),
    optimist = require('optimist'),
    argv = optimist.argv,
    fs = require('fs');

var config = module.exports = Object.create(nconf.Provider.prototype);

//
// Set up our default config
//
var dir = process.cwd(),
    configPath = argv.jitsuconf || argv.j,
    looking = true;

//
// Make sure the file exists if it was set explicitly
//
config.findJitsuconf = function (filename) {
  filename = filename || '.jitsuconf';
  
  if (configPath) {
    try {
      fs.statSync(configPath);
    }
    catch (ex) {
      return false;
    }
  }
  else {
    while (looking) {
      try {
        fs.statSync(configPath = path.join(dir, filename));
        looking = false;
      }
      catch (e) {
        var olddir = dir;
        dir = path.dirname(dir);

        if (olddir === dir) {
          try {
            fs.statSync(configPath = path.join(process.env.HOME, filename));
            looking = false;
          }
          catch (e) {
            //
            // Ignore errors
            //
          }
        }
      }
    }
  }

  if (!configPath) {
    return false;
  }

  winston.silly('Using config file ' + configPath.magenta);
  config.use('file', { file: configPath });
  return true;
};

var _get = config.get,
    _load = config.load;

var defaults = {
  'root': process.env.HOME,
  'protocol': 'http',
  'remoteHost': 'api.nodejitsu.com',
  'userconfig': '.jitsuconf',
  'loglevel': 'info',
  'tmproot': '/tmp',
  'tar': 'tar',
  'gzipbin': 'gzip'
};

Object.defineProperty(defaults, 'remoteUri', {
  get: function () {
    var port = optimist.argv.port || config.get('port') || this.port || '';
    if (port) {
      port = ':' + port;
    }
    
    return [this.protocol, '://', (optimist.argv.remoteHost || config.get('remoteHost') || defaults.remoteHost), port].join('');
  }
});

config.load = function (filename, callback) {
  if (!callback) {
    callback = filename;
    filename = null;
  }
  
  //
  // Find the `.jitsuconf` file to be used for this
  // jitsu session.
  //
  if (!config.findJitsuconf(filename)) {
    return callback(new Error(configPath.magenta + ' does not exist'), true);
  }
  
  _load.call(config, function (err, store) {
    if (err) {
      return callback(err);
    }
    
    if (filename) {
      config.set('userconfig', filename);
    }
    
    if (store.auth) {
      var auth = store.auth.split(':');
      config.clear('auth');
      config.set('username', auth[0]);
      config.set('password', auth[1]);
      return config.save(callback);
    }
    
    callback(null, store);
  });
};

config.get = function (key) {
  if (optimist.argv.hasOwnProperty(key)) {
    return optimist.argv[key];
  }
  
  var value = _get.call(config, key);
  return typeof value !== 'undefined' ? value :  defaults[key];
};