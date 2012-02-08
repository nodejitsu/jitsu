/*
 * config.js: Configuration for the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    fs = require('fs'),
    jitsu = require('../jitsu');

//
// Setup target file for `.jitsuconf`.
//
jitsu.config.file({
  file: jitsu.argv.jitsuconf || jitsu.argv.j || '.jitsuconf',
  dir: process.cwd(),
  search: true
});

var defaults = {
  root: process.env.HOME,
  debug: true,
  protocol: 'http',
  remoteHost: 'api.nodejitsu.com',
  loglength: 110,
  userconfig: '.jitsuconf',
  loglevel: 'info',
  tmproot: process.env.HOME + '/.jitsu/tmp',
  tar: 'tar',
  colors: true,
  analyze: true,
  gzipbin: 'gzip'
};

Object.defineProperty(defaults, 'remoteUri', {
  get: function () {
    var port = jitsu.config.get('port') || '';
    if (port) {
      port = ':' + port;
    }

    return [this.protocol, '://', jitsu.config.get('remoteHost'), port].join('');
  }
});

//
// Set defaults for `jitsu.config`.
//
jitsu.config.defaults(defaults);

//
// Use the `cli-config` plugin for `jitsu config *` commands
//
jitsu.use(require('cli-config'), {
  store: 'file',
  restricted: [
    'auth', 
    'gzipbin',
    'root', 
    'remoteUri', 
    'tmproot', 
    'tar', 
    'userconfig'
  ],
  before: {
    list: function () {
      var username = jitsu.config.get('username'),
          configFile = jitsu.config.stores.file.file;

      var display = [
        ' here is your ' + configFile.grey + ' file:',
        'If you\'d like to change a property try:',
        'jitsu config set <key> <value>',
      ];

      if (!username) {
        jitsu.log.warn('No user has been setup on this machine');
        display[0] = 'Hello' + display[0];
      }
      else {
        display[0] = 'Hello ' + username.green + display[0];
      }

      display.forEach(function (line) {
        jitsu.log.help(line);
      });

      return true;
    }
  }
});

// config.load = function (filename, callback) {
//   if (!callback) {
//     callback = filename;
//     filename = null;
//   }
// 
//   //
//   // Find the `.jitsuconf` file to be used for this
//   // jitsu session.
//   //
//   if (!config.findJitsuconf(filename)) {
//     return callback(new Error(configPath.magenta + ' does not exist'), true);
//   }
// 
//   _load.call(config, function (err, store) {
//     if (err) {
//       jitsu.log.error('Error parsing ' + config.store.file.magenta);
//       jitsu.log.error(err.message);
//       jitsu.log.warn('');
//       jitsu.log.warn('This is most likely not an error in jitsu.');
//       jitsu.log.warn('Please check your jitsuconf and try again.');
//       jitsu.log.warn('');
//       return callback(err, true, true, true);
//     }
// 
//     if (filename) {
//       config.set('userconfig', filename);
//     }
// 
//     if (store.auth) {
//       var auth = store.auth.split(':');
//       config.clear('auth');
//       config.set('username', auth[0]);
//       config.set('password', auth[1]);
//       return config.save(callback);
//     }
// 
//     callback(null, store);
//   });
// };