

var winston = require('winston'),
    jitsu = require('jitsu');

var commands = exports;

// Setup the commands organized by resource
commands.commands = {
  apps:      require('jitsu/commands/apps'),
  config:    require('jitsu/commands/config'),
  snapshots: require('jitsu/commands/snapshots'),
  help:      require('jitsu/commands/help')
};

var requireAuth = ['apps', 'users', 'snapshots', 'logs'];

//
// ### function parse (command)
// #### @command {string} Command to parse
// Parses the specified command string.
//
commands.parse = function (command) {
  //
  // Remark (indexzero): Do we need more parsing than this?
  //
  return command.split(' ');
};

//
// ### function run (command, callback) 
// #### @command {Array} Command to run
// #### @callback {function} Continuation to pass control to when complete.
// Runs the specified command.
//
commands.run = function (command, callback) {
  var parts = commands.parse(command),
      name = parts.shift(),
      action = parts.shift(),
      expected, resource;
  
  //
  // If we have been asked for `help` or `usage`
  // about a particular resource, print the help 
  // for that resource.
  //
  if (action === 'usage' || action === 'help') {
    commands.commands.help.show(name);
    return callback();
  }
  else if (name === 'help' && (!action || action === 'show')) {
    commands.commands.help.show('help');
    return callback();
  }
  
  if (!commands.commands[name]) {
    return callback(new Error('Cannot run command on unknown resource: ' + name), true);
  }
  
  resource = commands.commands[name];
  if (!resource[action]) {
    winston.error('Unknown action ' + action + ' on resource ' + name.magenta);
    commands.commands.help.show(name);
    return callback(true);
  }
  
  //
  // When the command completes, check for an error, and if 
  // we are surpressing the err callstack (i.e. it is an **expected** error)
  // then print the usage of the specified command.
  //
  parts.push(function (err, shallow) {
    if (err && shallow) {
      winston.help('');
      winston.help('Usage:'.bold);
      resource[action].usage.forEach(function (line) {
        winston.help(line);
      });
      winston.help('');
    }
    
    callback(err, shallow);
  });
  
  //
  // Check the arguments length then execute the command.
  //
  expected = resource[action].length;
  if (parts.length > expected) {
    return callback(new Error('Wrong number of arguments: ' + parts.length + ' for ' + expected), true);
  }
  
  function runCommand() {
    resource[action].apply(resource, parts);
  }
  
  // 
  // If this resource can only be accessed
  // after authenticating with Nodejitsu, do so
  // then run the specified command on the resource
  //
  if (requireAuth.indexOf(name) !== -1) {
    return jitsu.auth(function (err) {
      if (err) {
        return callback(err);
      }
      
      runCommand();
    });
  }
  
  runCommand();
};