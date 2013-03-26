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
// Update env if using Windows
//
if (process.platform == "win32") {
  process.env.HOME = process.env.USERPROFILE;
}

//
// Setup target file for `.jitsuconf`.
//
//
// TODO: Refactor broadway to emit `bootstrap:after` and put this
//       code in a handler for that event
//
try {
  jitsu.config.env().file({
    file: jitsu.argv.jitsuconf || jitsu.argv.j || '.jitsuconf',
    dir: process.env.HOME,
    search: true
  });
}
catch (err) {
  console.log('Error parsing ' + jitsu.config.stores.file.file.magenta);
  console.log(err.message);
  console.log('');
  console.log('This is most likely not an error in jitsu');
  console.log('Please check the .jitsuconf file and try again');
  console.log('');
  process.exit(1);
}


var defaults = {
  analyze: true,
  "apiTokenName": 'jitsu',
  release: 'build',
  colors: true,
  loglevel: 'info',
  loglength: 110,
  protocol: 'https',
  remoteHost: 'api.nodejitsu.com',
  requiresAuth: ['apps', 'databases', 'env', 'logs', 'snapshots'],
  root: process.env.HOME,
  timeout: 4 * 60 * 1000,
  tmproot: path.join(process.env.HOME, '.jitsu/tmp'),
  userconfig: '.jitsuconf'
};

Object.defineProperty(defaults, 'remoteUri', {
  get: function () {
    var port = jitsu.config.get('port') || '';
    if (port) {
      port = ':' + port;
    }

    return [jitsu.config.get('protocol'), '://', jitsu.config.get('remoteHost'), port].join('');
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
    'root',
    'remoteUri',
    'tmproot',
    'userconfig'
  ],
  before: {
    list: function () {
      var username = jitsu.config.get('username'),
          configFile = jitsu.config.stores.file.file;

      var display = [
        ' here is the ' + configFile.grey + ' file:',
        'To change a property type:',
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
      // create a new token and remove password from being saved to .jitsuconf
      jitsu.tokens.create(auth[0], (jitsu.config.get('apiTokenName')||'jitsu'), function(err, result) {
          if(!err && result) {
            var token = Object.getOwnPropertyNames(result).filter(function(n){return n !== 'operation'}).pop();
            jitsu.config.set('apiToken', result[token]);
            jitsu.config.set('apiTokenName', token);
            jitsu.config.clear('password');
            return jitsu.config.save(callback);
          }
        });


    }

    callback(null, store);
  });
};
