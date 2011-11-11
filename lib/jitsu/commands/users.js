/*
 * users.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('../../jitsu');
    
var users = exports;

users.usage = [
  '`jitsu users *` commands allow you to work with new',
  'or existing Nodejitsu user accounts',
  '',
  'jitsu users create',
  'jitsu users available <username>',
  'jitsu users confirm <username>',
  'jitsu users forgot <username> [<shake>]',
  'jitsu users logout',
  'jitsu users changepassword',
  'jitsu users whoami',
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
users.create = function (username, callback) {
  var email, password;
  
  if (!callback && typeof username === 'function') {
    callback = username;
    username = null;
  }
  
  function getPassword() {
    jitsu.prompt.get(['password', 'confirm password'], function (err, result) {
      if (result['password'] === result['confirm password'] && result['password'] !== '') {
        password = result.password;
        winston.info('You account is now being created');
        jitsu.users.create({
          username: username,
          email: email,
          password: password
        }, function(err, result){
          winston.info('Account creation successful!');
          winston.help('Your account has been created, but it is not yet active');
          winston.help('Please check the email we sent to ' + email.grey + ' for further instructions');
          callback(err, result);
        });
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
  
  function getEmail() {
    jitsu.prompt.get('email', function (err, result) {
      if (err) {
        return callback(err);
      }

      email = result.email;
      winston.help('Finally, we will need a password for this account');
      getPassword();
    });
  }
  
  function getUsername() {
    jitsu.prompt.get('username', function (err, result) {
      jitsu.users.available(result.username, function (err, res) {
        if (err) {
          return callback(err);
        }
        else if (res.available === false) {
          winston.error('Username was already taken');
          return getUsername();
        }

        username = result.username;
        winston.help('Next, we will require your email address');

        getEmail();
      })
    });
  }

  winston.help('To signup, first you will need to provide a username');

  return !username
    ? getUsername()
    : getEmail();
};

users.create.usage = [
  'Creates a new user account with Nodejitsu. You will be', 
  'prompted to provide additional `email` and `password` information.',
  '',
  'jitsu users create',
  'jitsu users create <username>',
  'jitsu signup',
  'jitsu signup <username>'
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
      inviteCode: result['invite code']
    };

    winston.info('Confirming user ' + username.magenta);
    jitsu.users.confirm(user, function (err, response) {
      if (err) {
        return callback(err);
      }
      if (response.error) {
        winston.error(response.error);
      }
      else if (!response.hasPassword) {
        (function getNewPass() {
          jitsu.prompt.get(['password', 'confirm password'], function (err, results) {
            if (err) {
              return callback(err);
            }
            if (results['password'] !== results['confirm password']) {
              winston.error('The provided passwords do not match.');
              return getNewPass();
            }
            jitsu.users.forgot(username, {
              shake: response.shake,
              'new-password': results.password
            }, function (err, res) {
              return err ? callback(err) : callback(null, res);
            });
          });
        })();
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
users.forgot = function (username, shake, callback) {
  if (!callback && !shake) {
    callback = username;
    return callback(new Error('Username is required'), true);
  }
  else if (typeof callback === 'function') {
    // They are providing a shake so lets reset the password
    return forgotResetHelper(username, shake, callback);
  }
  
  callback = shake;
  winston.info('Request password reset for: ' + username.magenta);
  jitsu.users.forgot(username, {}, function (err, result) {
    if (err) {
      return callback(err);
    }

    winston.info('Check your email for instructions on resetting your password.');
    callback();
  });
};

users.forgot.usage = [
  'Sends the password reset email to the user with the specified `username`.',
  '',
  'jitsu users forgot <username>',
  '',
  'After you have recieved the email, you can run:',
  'jitsu users forgot <username> <shake>'
];

//
// ### function changepassword (username, callback)
// #### @callback {function} Continuation to pass control to when complete.
// Change the password for the user
//
users.changepassword = function (callback) {
  (function getPassword () {
    jitsu.prompt.get(['password', 'confirm password'], function (err, result) {
      if (result['password'] === result['confirm password'] && result['password'] !== "") {
        var options = { 
          password: result['password'] 
        };
        
        jitsu.users.update(jitsu.config.get('username'), options, function (err) {
          if(err) {
            callback(err)
          }
          else {
            jitsu.config.set('password', options.password);
            jitsu.config.save(callback);
          }
        });
      }
      else {
        if (result['password'] === '') {
          winston.error('You password must have characters in it');
        } 
        else {
          winston.error('The entered passwords do not match');
        }
        
        getPassword();
      }
    });
  })();
}

users.changepassword.usage = [
  'Used to change the user password',
  '',
  'jitsu users changepassword',
];

users.login = function(callback) {
  jitsu.setupUserNoWarn(callback);
};

users.login.usage = [
  'Allows the user to login',
  '',
  'jitsu users login',
  'jitsu login'
];

//
// ### function whoami (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Retrieves the name of the current logged in user
//
users.whoami = function (callback) {
  var username = jitsu.config.get('username') || 'not logged in'
  winston.info('You are: ' + username.magenta);
};

function forgotResetHelper (username, shake, callback) {
  var newPassword;
  jitsu.config.set('username', username);
  // jitsu.config.set('password', shake);
  jitsu.prompt.get(['password', 'confirm password'], function (err, results) {
    if (err) {
      return callback(err);
    }
    if (results['password'] === results['confirm password'] && results['password'] !== "") {
      newPassword = results['password'];
      jitsu.users.forgot(username, {
        'shake': shake,
        'new-password': newPassword
      }, function (err, res) {
        if (err) {
          winston.error('Unable to set new password for ' + username.magenta);
          winston.error(err.message);
          return callback(err);
        }
        jitsu.config.set('password', newPassword);
        jitsu.config.save(callback);
      });
    }
  });
}
