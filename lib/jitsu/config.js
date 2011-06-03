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
    var port = this.port ? ':' + this.port : '';
    return [this.protocol, '://', this.remoteHost, port].join('');
  }
});

var overrides = optimist.argv
var oldget = nconf.get
nconf.get = function(key,callback) {
  nconf.load(function(err,store) {
    if(overrides.hasOwnProperty(key)) callback(false,overrides[key])
    oldget.call(nconf,key,function(err,value) {
      if(err) {
        if(defaults.hasOwnProperty(key)) callback(false,defaults[key])
        else callback(err)
      }
      else callback(false,value)
    })
  })
}
module.exports = nconf;