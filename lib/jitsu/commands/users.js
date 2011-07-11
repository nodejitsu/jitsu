/*
 * users.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');
    
var users = exports;

users.usage = [
  '`jitsu users *` commands allow you to work with new',
  'or existing Nodejitsu user accounts',
  '',
  'jitsu users create',
  'jitsu users available <username>',
  'jitsu users confirm <username>',
  'jitsu users forgot <username>',
  'jitsu users logout',
  '',
  'You will be prompted for additional user information',
  'as required.'
];

//
// ### function create (username, callback)
// #### @username {string} Desired username to create
// #### @callback {function} Continuation to pass control to when complete.
// Attempts to create a Nodejitsu user account with the specified `username`.
// Prompts the user for additional `email` and `password` information.
//
users.create = function (callback) {
  var username, email, password;
  getUsername();
  function getUsername() {
    jitsu.prompt.get('username', function (err, result) {
      jitsu.users.available(result.username, function (err,result1) {
        if (err) {
          callback(err);
        }
        else if (result1.available === false) {
          winston.error('Username was already taken');
          getUsername();
        }
        else {
          username = result.username;
          getEmail();
        }
      })
    });
  }

  function getEmail() {
    jitsu.prompt.get('email', function (err, result) {
      if (err) {
        callback(err);
      }
      else {
        email = result.email;
        getPassword();
      }
    });
  }

  function getPassword() {
    jitsu.prompt.get(['password', {name:'confirm password', hidden: true}], function (err, result) {
      if (result['password'] === result['confirm password'] && result['password'] != "") {
        password = result['password'];
        var options = {
          username: username,
          email: email,
          password: password
        };
        jitsu.users.create(options, callback);
      }
      else {
        if (result['password'] === "") {
          winston.error('You password must have characters in it');
        } else {
          winston.error('The entered passwords do not match');
        }
        getPassword();
      }
    });
  }
};

users.create.usage = [
  'Creates a new user account with Nodejitsu. You will be', 
  'prompted to provide additional `email` and `password` information.',
  '',
  'jitsu users create',
  'jitsu signup'
];

//
// ### function available (username, callback)
// #### @username {string} Desired username to check
// #### @callback {function} Continuation to pass control to when complete.
// Checks the availability of the specified `username`.
//
users.available = function (username, callback) {
  if (!callback) {
    callback = username;
    return callback(new Error('Username is required'), true);
  }
  
  winston.info('Checking availability for ' + username.magenta);
  jitsu.users.available(username, function (err, result) {
    if (err) {
      return callback(err);
    }
    
    var msg = 'Username ' + username.magenta + ' is ';
    msg += result.available ? 'available'.green : 'not available'.red;
    winston.info(msg);
    callback(null,result);//callback with results, so that can be tested.
  });
};

users.available.usage = [
  'Checks the availability of the desired username',
  '',
  'jitsu users available <username>'
];

//
// ### function confirm (username, callback)
// #### @username {string} Desired username to confirm
// #### @callback {function} Continuation to pass control to when complete.
// Attempts to confirm the Nodejitsu user account with the specified `username`.
// Prompts the user for additional `inviteCode` information.
//
users.confirm = function (username, callback) {
  if (!callback) {
    callback = username;
    return callback(new Error('username is required'), true);
  }
  
  jitsu.prompt.get(['Invite code'], function (err, result) {
    var user = {
      username: username,
      inviteCode: result['Invite code']
    };

    winston.info('Confirming user ' + username.magenta);
    jitsu.users.confirm(user, function (err, result) {
      if (err) {
        return callback(err);
      }

      if (result.error) {
        winston.error(result.error);
      }
      else {
        winston.info('User ' + username.magenta + ' confirmed');
      }

      callback();
    });
  });
};

users.confirm.usage = [
  'Confirms the Nodejitsu user account for the specified username.',
  'You will be prompted to supply a valid invite code for the account.',
  '',
  'jitsu users confirm <username>'
];

//
// ### function logout (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Attempts to logout current user by removing the name from .jitsuconf
//
users.logout = function (callback) {
  jitsu.config.clear('username');
  jitsu.config.clear('password');

  jitsu.config.save(function (err) {
    if (err) {
      return callback(err, true);
    }
    
    winston.info('User has been logged out');
    callback();
  });
};

users.logout.usage = [
  'Logs out the current user',
  '',
  'jitsu logout',
  'jitsu users logout'
];

//
// ### function forgot (username, callback)
// #### @username {string} Desired username request password reset.
// #### @callback {function} Continuation to pass control to when complete.
// Sends the password reset email to the user with the specified `username`.
//
users.forgot = function (username, callback) {
  if (!callback) {
    callback = username;
    return callback(new Error('Username is required'), true);
  }
  
  winston.info('Request password reset for: ' + username.magenta);
  jitsu.users.forgot(username, function (err, result) {
    if (err) {
      return callback(err);
    }

    winston.info('Check your email for password reset link');
    callback();
  });
};

users.forgot.usage = [
  'Sends the password reset email to the user with the specified `username`.',
  '',
  'jitsu users forgot <username>'
];

users.login = function(callback) {
  jitsu.setupUserNoWarn(callback);
}

users.login.usage = [
  'Allows the user to login',
  '',
  'jitsu users login',
  'jitsu login'
]
