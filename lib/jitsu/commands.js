

var jitsu = require('jitsu');

var commands = exports;

// Setup the commands organized by resource
commands.commands = {
  apps: require('jitsu/commands/apps'),
  config: require('jitsu/commands/config')
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
  
  if (!commands.commands[name]) {
    return callback(new Error('Cannot run command on unknown resource: ' + name));
  }
  
  resource = commands.commands[name];
  if (!resource[action]) {
    return callback(new Error('Cannot run unknown action ' + action + ' on resource ' + name));
  }
  
  //
  // Append the callback to the arguments to pass the command,
  // check the arguments length then execute the command.
  //
  parts.push(callback);
  expected = resource[action].length;
  
  if (parts.length !== expected) {
    return callback(new Error('Wrong number of arguments: ' + parts.length + ' for ' + expected))
  }
  
  function runCommand () {
    resource[action].apply(resource, parts);
  }
  
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