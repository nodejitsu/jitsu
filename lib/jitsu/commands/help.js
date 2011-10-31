/*
 * help.js: Command related to jitsu help and usage
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var colors = require('colors'),
    winston = require('winston'),
    jitsu = require('../../jitsu');
 
var help = exports;

help.usage = [
  '          ___  __'.cyan,
  '    /  /  /   /_  /  /'.cyan,
  ' __/  /  /   __/ /__/'.cyan,
  '',

  'Flawless deployment of Node.js apps to the cloud',
  'open-source and fully customizable.',
  'https://github.com/nodejitsu/jitsu',
  '',

  'Usage:'.cyan.bold.underline,
  '',
  '  jitsu <resource> <action> <param1> <param2> ...',
  '',

  'Common Commands:'.cyan.bold.underline,
  '',

  'To install a pre-built application'.cyan,
  '  jitsu install',
  '',

  'To sign up for Nodejitsu'.cyan,
  '  jitsu signup',
  '',

  'To log into Nodejitsu'.cyan,
  '  jitsu login',
  '',

  'Deploys current path to Nodejitsu'.cyan,
  '  jitsu deploy',
  '',

  'Creates a new application on Nodejitsu'.cyan,
  '  jitsu create',
  '',

  'Lists all applications for the current user'.cyan,
  '  jitsu list',
  '',

  'Additional Commands'.cyan.bold.underline,
  '  jitsu apps',
  '  jitsu logs',
  '  jitsu env',
  '  jitsu conf',
  '  jitsu users',
  '  jitsu databases',
  '  jitsu snapshots',
  '  jitsu logout',
  '',
  'jitsu options'.cyan.bold.underline,
  '',
  'jitsu [commands] [options]'.cyan,
  '',
  '--version             print jitsu version and exit',
  '--localconf           search for .jitsuconf file in ./ and then parent directories',
  '--jitsuconf [file]    specify file to load configuration from',
  '--noanalyze           skip require-analyzer: do not attempt to dynamicially detect dependencies'
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
  usage.forEach(function (line) {
    winston.help(line);
  });
  winston.help('');
};

//
// Setup exports for all relevant resources: 
// `apps`, `snapshots`, `config`, etc.
//
Object.keys(jitsu.commands.commands).forEach(function (resource) {
  help[resource] = function (action, callback) {
    if (!callback) {
      callback = action;
      action = null;
    }

    help.show(resource, action);
    callback();
  };
});
