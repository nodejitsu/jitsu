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
  'with the Nodejitsu platform. Commands are structured:',
  '',
  'jitsu <resource> <action> <param1> <param2> ...',
  '',
  'Resources:'.bold,
  'Valid resources for `jitsu` are:',
  '  1. ' + 'apps'.underline      + ': Applications hosted on Nodejitsu',
  '  2. ' + 'snapshots'.underline + ': Images of your applications on Nodejitsu',
  '  3. ' + 'config'.underline    + ': Configuration for the jitsu CLI',
  '',
  'For help about a particular resource use:    jitsu help <resource>',
  'and for help about a particular action use:  jitsu help <resource> <action>',
  '  e.g.',
  '    jitsu help apps',
  '    jitsu help snapshots list'
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

//
// Setup exports for all relevant resources: 
// `apps`, `snapshots`, `config`.
//
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