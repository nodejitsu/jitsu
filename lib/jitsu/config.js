/*
 * config.js: Configuration for the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    log = require('jitsu/log');
    fs = require('fs');

var config = exports, settings = config.settings = {
  root: process.env.HOME,
  remoteUri: 'http://localhost',
  files: {
    config: '.jitsuconf'
  }
};

// Export the log configuration
config.log = log.config;

//
// ### function load (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Loads the settings for this process.
//
config.load = function (callback) {
  fs.readFile(config.file('config'), function (err, data) {
    if (err && /ENOENT, No such file/.test(err.message)) {
      return config.save(function (err) {
        return err ? callback(err) : callback();
      });
    }
    else if (err) {
      return callback(err);
    }
    
    data = JSON.parse(data.toString());
    Object.keys(data).forEach(function (key) {
      config.settings[key] = data[key];
    });
    
    callback();
  });
};

//
// ### function save (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Saves the settings to the specified location for `.jitsuconf`
//
config.save = function (callback) {
  fs.writeFile(config.file('config'), JSON.stringify(config.settings), function (err) {
    return err ? callback(err) : callback();
  });
};

//
// ### function file (file)
// #### @file {string} Name of the file to get the path for
// Gets the full path for the file supplied 
//
config.file = function (file) {
  if (!settings.files[file]) {
    return null;
  }
  
  return path.join(settings.root, settings.files[file]);
};