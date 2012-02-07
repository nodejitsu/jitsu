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
// Setup defaults and target file for `jitsu.config`.
//
jitsu.config.file({
  file: jitsu.argv.jitsuconf || jitsu.argv.j || '.jitsuconf',
  dir: process.cwd(),
  search: true
});

jitsu.config.defaults({
  'root': process.env.HOME,
  'debug': true,
  'protocol': 'http',
  'remoteHost': 'api.nodejitsu.com',
  'loglength': 110,
  'userconfig': '.jitsuconf',
  'loglevel': 'info',
  'tmproot': process.env.HOME + '/.jitsu/tmp',
  'tar': 'tar',
  'colors': true,
  'analyze': true,
  'gzipbin': 'gzip'
});

// Object.defineProperty(defaults, 'remoteUri', {
//   get: function () {
//     var port = optimist.argv.port || config.get('port') || this.port || '';
//     if (port) {
//       port = ':' + port;
//     }
// 
//     return [this.protocol, '://', (optimist.argv.remoteHost || config.get('remoteHost') || defaults.remoteHost), port].join('');
//   }
// });

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