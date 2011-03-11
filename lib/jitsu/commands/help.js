/*
 * help.js: Command related to jitsu help and usage
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');
 
var help = exports;

help.show = function (name, action) {
  var usage, resource = jitsu.commands.commands[name];

  if (action && !resource[action]) {
    winston.error('No help for command ' + [name, action].join(' ').magenta);
    return;
  }

  usage = action ? resource[action].usage : resource.usage;
  
  if (!usage) {
    winston.error('No help for command ' + [name, action].join(' ').magenta);
    return;
  }
  
  winston.help('');
  winston.help('Usage:'.bold);
  usage.forEach(function (line) {
    winston.help(line);
  });
  winston.help('');
};

['apps', 'snapshots', 'config'].forEach(function (resource) {
  help[resource] = function (action, callback) {
    if (!callback) {
      callback = action;
      action = null;
    }

    help.show(resource, action);
    callback();
  };
});