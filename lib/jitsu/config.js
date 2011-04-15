/*
 * config.js: Configuration for the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    winston = require('winston'),
    fs = require('fs'),
    jitsu = require('jitsu');

var config = exports, settings = config.settings = {
  root: process.env.HOME,
  protocol: 'http',
  remoteHost: 'api.nodejitsu.com',
  userconfig: '.jitsuconf',
  loglevel: 'info',
  tmproot: '/tmp',
  tar: 'tar',
  gzipbin: 'gzip'
};

//
// Define the `remoteUri` property for the settings object
//
Object.defineProperty(config.settings, 'remoteUri', {
  get: function () {
    var port = this.port ? ':' + this.port : '';
    return [this.protocol, '://', this.remoteHost, port].join('');
  }
});

//
// ### @log {Object}
// Log level configuration for jitsu.
//
var log = config.log =  {
  levels: {
    silly: 0,
    input: 1,
    verbose: 2,
    prompt: 3,
    info: 4,
    data: 5,
    help: 6,
    warn: 7,
    debug: 8,
    error: 9
  },
  colors: {
    silly: 'magenta',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
  }
};

//
// Configure winston with the levels and colors that we've defined
//
winston.emitErrs = false;
winston.defaultTransports().console.colorize = true;
winston.defaultTransports().console.timestamp = false;
winston.padLevels = true;
if (!winston.levels.prompt) {
  winston.setLevels(log.levels);
  winston.addColors(log.colors);
}

//
// Set the default console log level to `info`. 
//
winston.defaultTransports().console.level = 'info';

//
// ### function load (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Loads the settings for this process.
//
config.load = function (callback) {
  fs.readFile(config.filepath(), function (err, data) {
    if (err && /ENOENT, No such file/.test(err.message)) {
      //
      // If there is no configuration file, save the default configuration
      // then reload the configuration.
      //
      return config.save(function (err) {
        return err ? callback(err) : config.load(callback);
      });
    }
    else if (err) {
      return callback(err);
    }
    
    //
    // Load all config data into `jitsu.config.settings`.
    //

    try {
      data = JSON.parse(data.toString());
    }
    catch (err) {
      winston.error(config.filepath().magenta + ' contains invalid JSON');
      winston.warn('Regenerating ' + '.jitsuconf'.magenta + ' file');
      return jitsu.setupUser(callback);
    }
    Object.keys(data).forEach(function (key) {
      config.settings[key] = data[key];
    });
    
    //
    // Set the default console log level to `info`. 
    //
    winston.defaultTransports().console.level = config.settings.loglevel || 'info';
    
    callback();
  });
};

//
// ### function save (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Saves the settings to the specified location for `.jitsuconf`
//
config.save = function (callback) {
  fs.writeFile(config.filepath(), JSON.stringify(config.settings), function (err) {
    return err ? callback(err) : callback();
  });
};

//
// ### function filepath ()
// Gets the full path for the user config file. 
//
config.filepath = function () {
  return path.join(settings.root, settings.userconfig);
};

//
// ### @username {string}
// Username for the user authenticated in this process. 
//
Object.defineProperty(config, 'username', {
  get: function () {
    return settings.auth ? settings.auth.split(':')[0] : null;
  }
});