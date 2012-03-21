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
// Store the original `jitsu.config.load()` function
// for later use.
//
var _load = jitsu.config.load;

//
// Setup target file for `.jitsuconf`.
//
//
// TODO: Refactor broadway to emit `bootstrap:after` and put this 
//       code in a handler for that event
//
try {
  jitsu.config.file({
    file: jitsu.argv.jitsuconf || jitsu.argv.j || '.jitsuconf',
    dir: process.env.HOME,
    search: true
  });
}
catch (err) {
  console.log('Error parsing ' + jitsu.config.stores.file.file.magenta);
  console.log(err.message);
  console.log('');
  console.log('This is most likely not an error in jitsu.');
  console.log('Please check your jitsuconf and try again.');
  console.log('');
  process.exit(1);
}


var defaults = {
  analyze: true,
  release: 'build',
  colors: true,
  gzipbin: 'gzip',
  loglevel: 'info',
  loglength: 110,
  protocol: 'http',
  remoteHost: 'api.nodejitsu.com',
  requiresAuth: ['apps', 'databases', 'env', 'logs', 'snapshots'],
  root: process.env.HOME,
  tar: 'tar',
  tmproot: process.env.HOME + '/.jitsu/tmp',
  userconfig: '.jitsuconf'
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
// Use the `flatiron-cli-config` plugin for `jitsu config *` commands
//
jitsu.use(require('flatiron-cli-config'), {
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

//
// Override `jitsu.config.load` so that we can map
// some existing properties to their correct location.
//
jitsu.config.load = function (callback) {
  _load.call(jitsu.config, function (err, store) {
    if (err) {
      return callback(err, true, true, true);
    }

    jitsu.config.set('userconfig', jitsu.config.stores.file.file);
    
    if (store.auth) {
      var auth = store.auth.split(':');
      jitsu.config.clear('auth');
      jitsu.config.set('username', auth[0]);
      jitsu.config.set('password', auth[1]);
      return jitsu.config.save(callback);
    }

    callback(null, store);
  });
};
