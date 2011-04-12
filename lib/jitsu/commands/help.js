/*
 * help.js: Command related to jitsu help and usage
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var colors = require('colors'),
    winston = require('winston'),
    jitsu = require('jitsu');
 
var help = exports;

help.usage = [
  'jitsu is the command-line interface (CLI) for interacting',
  'with the Nodejitsu platform.',
  '',
  'jitsu is open-source and fully customizable.',
  '',
  'see: https://github.com/nodejitsu/jitsu',
  '',
  'Commands are structured:',
  '',
  '  jitsu <resource> <action> <param1> <param2> ...',
  '',
  'Resources:'.cyan.bold.underline,
  '',
  'Valid resources for `jitsu` are:',
  '  1. ' + 'apps'.underline      + ': Applications hosted on Nodejitsu',
  '  2. ' + 'snapshots'.underline + ': Images of your applications on Nodejitsu',
  '  3. ' + 'users'.underline     + ': Nodejitsu user accounts',
  '  4. ' + 'config'.underline    + ': Configuration for the jitsu CLI',
  '',
  'Shortcuts:'.cyan.bold.underline,
  '',
  'jitsu exposes some shortcuts for commonly used commands',
  '',
  'jitsu create: Creates an application on Nodejitsu',
  'jitsu list:   Lists all applications for the current user',
  'jitsu deploy: Deploys an application to Nodejitsu',
  '',
  'Help:'.cyan.bold.underline,
  '',
  '  jitsu help <resource>',
  '  jitsu help <resource> <action>',
  '',
  'Examples:'.bold,
  '',
  '  jitsu help apps',
  '  jitsu help snapshots list'
];

//
// ### function show (name, action)
// #### @name {string} Name of the resource to show help for
// #### @action {string} Name of the action on the resource
// Shows the help for the resource with the specified `name`.
// If `action` is supplied, help for `jitsu <name> <action>`
// is shown.
//
help.show = function (name, action) {
  var usage, resource = jitsu.commands.commands[name];

  if (typeof resource !== 'function') {
    if (action && !resource[action]) {
      winston.error('No help for command ' + [name, action].join(' ').magenta);
      return;
    }

    usage = action ? resource[action].usage : resource.usage;

    if (!usage) {
      winston.error('No help for command ' + [name, action].join(' ').magenta);
      return;
    }
  }
  else {
    usage = resource.usage;
  }
  
  winston.help('');
  winston.help('Usage:'.underline.bold.cyan);
  winston.help('');

  usage.forEach(function (line) {
    winston.help(line.cyan);
  });
  winston.help('');
};

//
// Setup exports for all relevant resources: 
// `apps`, `snapshots`, `config`.
//
['apps', 'snapshots', 'users', 'config', 'list', 'deploy', 'create'].forEach(function (resource) {
  help[resource] = function (action, callback) {
    if (!callback) {
      callback = action;
      action = null;
    }

    help.show(resource, action);
    callback();
  };
});