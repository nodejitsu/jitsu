

var fs = require('fs'),
    path = require('path'),
    winston = require('winston'),
    jitsu = require('../jitsu');

var commands = exports;

//
// Setup the commands organized by resource to be lazy loaded
// when needed. This speeds up load time.
//
commands.commands = {};
fs.readdirSync(path.join(__dirname, 'commands')).forEach(function (cmd) {
  cmd = cmd.replace('.js', '');
  commands.commands.__defineGetter__(cmd, function () {
    return require('./commands/' + cmd);
  });
});

var requireAuth = ['apps', 'databases', 'env', 'logs', 'snapshots'];

commands.requiresAuth = function (resource) {
  return requireAuth.indexOf(resource) !== -1;
};

//
// ### function run (command, callback) 
// #### @command {Array} Command to run
// #### @callback {function} Continuation to pass control to when complete.
// Runs the specified command.
//
commands.run = function (command, callback) {
  var parts = command.slice(0),
      name = parts.shift(),
      action = parts.shift(),
      command, expected, resource;

  //
  // If we have been asked for `help` or `usage`
  // about a particular resource, print the help 
  // for that resource.
  //
  if (action === 'help') {
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
  
  if (typeof commands.commands[name] !== 'function') {
    if (!action) {
      winston.error('Action is required to run a command on resource: ' + name.magenta);
      commands.commands.help.show(name);
      return callback(true);
    }

    resource = commands.commands[name];
    if (!resource[action]) {
      winston.error('Unknown action ' + action + ' on resource ' + name.magenta);
      commands.commands.help.show(name);
      return callback(true);
    }
    
    command = resource[action];
  }
  else {
    if (action) {
      parts.unshift(action);
    }
    
    command = commands.commands[name];
  }
  
  //
  // When the command completes, check for an error, and if 
  // we are surpressing the err callstack (i.e. it is an **expected** error)
  // then print the usage of the specified command.
  //
  parts.push(function (err, shallow, skip) {
    if (err && shallow && !skip) {
      winston.help('');
      winston.help('Usage:'.cyan.bold.underline);
      command.usage.forEach(function (line) {
        winston.help(line);
      });
      winston.help('');
    }
    
    callback(err, shallow);
  });
  
  //
  // Check the arguments length then execute the command.
  //
  expected = command.length;
  if (parts.length > expected) {
    return callback(new Error('Wrong number of arguments: ' + parts.length + ' for ' + expected), true);
  }
  
  function runCommand() {
    if(command.destructive) {
      jitsu.prompt.get(['destroy'], function (err, result) {
        if (result.destroy !== 'yes' && result.destroy !== 'y') {
          return callback(new Error(action + ' operation cancelled'));
        } else {
          command.apply(resource, parts);
        }
      });
    } else {
      command.apply(resource, parts);
    }
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

commands.alias = function (target, source) {
  commands.commands.__defineGetter__(target, function () {
    var resource = commands.commands[source.resource];
    return resource[source.command]
  });
    
  if (requireAuth.indexOf(source.resource) !== -1) {
    requireAuth.push(target);
  }
};
