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

//Set up our default config
var dir = process.cwd();

var looking = true;
var configPath = argv.jitsuconf || argv.j
//make sure the file exists if it was set explicitly
if(configPath) fs.statSync(configPath)
else {
  while(looking) {
    try {
      fs.statSync(configPath = path.join(dir,".jitsuconf"));
      looking = false;
    }
    catch(e) {
      var olddir = dir;
      dir = path.join(dir,"..");
      if(olddir == dir) {
        try {
          fs.statSync(configPath = path.join(process.env.HOME,".jitsuconf"))
          looking = false;
        }
        catch(e) {
          
        }
      }
    }
  }
}
if(configPath) {
  winston.info("Using config file "+ configPath.magenta)
  nconf.use( 'file', { file: path.join( process.env.HOME, '.jitsuconf' ) } );
}

var defaults = {
  "root": process.env.HOME,
  "protocol": "http",
  "remoteHost": "api.nodejitsu.com",
  "userconfig": ".jitsuconf",
  "loglevel": "info",
  "tmproot": "/tmp",
  "tar": "tar",
  "gzipbin": "gzip"
};
Object.defineProperty(defaults, 'remoteUri', {
  get: function () {
    var port = nconf.overrides.port || nconf.get("port") || this.port
    if(port) port = ':' + this.port
    else port = '';
    return [this.protocol, '://', (nconf.overrides.remoteHost || nconf.get("remoteHost") || nconf.defaults.remoteHost), port].join('');
  }
});

var oldget = nconf.get
nconf.overrides = optimist.argv
nconf.defaults = defaults
nconf.get = function get(key) {
  if(nconf.overrides.hasOwnProperty(key)) return nconf.overrides[key]
  var value = oldget.call(nconf,key)
  if(value !== undefined) return value
  return nconf.defaults[key]
}
module.exports = nconf;