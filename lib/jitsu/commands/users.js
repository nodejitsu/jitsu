/*
 * users.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    users = exports,
    utile = jitsu.common;

//
// ### function confirm (username, callback)
// #### @username {string} Desired username to confirm
// #### @callback {function} Continuation to pass control to when complete.
// Attempts to confirm the Nodejitsu user account with the specified `username`.
// Prompts the user for additional `inviteCode` information.
//
users.confirm = function (username, inviteCode, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args   = utile.args(arguments);
    callback   = args.callback;
    username   = args[0] || null;
    inviteCode = args[1] || null;
  }

  //
  // This is like setupUserNoWarn except that it only asks for your password.
  //
  function setupUserNoUsername(callback) {
    //
    // Attempt to get the password three times.
    //
    var tries = 0;

    function offerReset (username) {
      jitsu.prompt.get(['reset'], function (err, res) {
        if (err) {
          return callback(err);
        }
        if (/^y[es]+/i.test(res['request password reset'])) {
          return jitsu.plugins.cli.executeCommand(['users', 'forgot', username ], callback);
        }

        callback(new Error('Invalid username / password.'));
      });
    }

    (function setupAuth () {
      jitsu.prompt.get(['password'], function (err, result) {
        if (err) {
          return callback(err);
        }

        jitsu.config.set('username', username);
        jitsu.config.set('password', result.password);
        jitsu.setup(function () {
          jitsu.auth(function (err) {
            //
            // Increment the auth attempts
            //
            tries += 1;

            if (err) {
              if (tries >= 3) {
                jitsu.log.error('Three failed login attempts');
                jitsu.log.info('Reset the password?');
                return offerReset(username);
              }
              return setupAuth();
            }
            // once password is entered checkout a token and clear out password 
            jitsu.tokens.create(username, (jitsu.config.get('api-token-name')||'jitsu'), function(err, result) {
              if(!err && result) {
                var token = Object.getOwnPropertyNames(result).filter(function(n){return n !== 'operation'}).pop();
                jitsu.config.set('api-token', result[token]);
                jitsu.config.set('api-token-name', token);
                jitsu.config.clear('password');
                jitsu.config.save(function (err) {
                  return err ? callback(err) : callback();
                });
              }
            });
          });
        });
      });
    })();
  }

  function confirmUserHelper(username, inviteCode, callback) {
    jitsu.log.info('Confirming user ' + username.magenta);

    var user = {
      username: username,
      inviteCode: inviteCode
    };

    jitsu.users.confirm(user, function (err, response) {
      if (err) {
        return callback(err);
      }

      if (response.error) {
        jitsu.log.error(response.error);
        return callback(response.error);
      }

      jitsu.log.info('Great success! ' + username.magenta + ' is now confirmed.');
      if (!response.hasPassword) {
        (function getNewPass() {

          jitsu.log.help('Now that the account is confirmed, a password is required');
          jitsu.log.help('In the future, the password can be reset by running the' + ' jitsu users forgot'.magenta + ' command');
          jitsu.log.help('Set the new password below');

          jitsu.prompt.get(['set password', 'confirm password'], function (err, results) {
            if (err) {
              return callback(err);
            }
            if (results['set password'] !== results['confirm password']) {
              jitsu.log.error('The provided passwords do not match.');
              return getNewPass();
            }
            jitsu.users.forgot(username, {
              shake: response.shake,
              'new-password': results['set password']
            }, function (err, res) {
              jitsu.config.set('username', username);
              jitsu.config.set('password', results['set password']);
              // now that we have a new password lets checkout a new api token and clear out the password
              jitsu.tokens.create(username, (jitsu.config.get('api-token-name')||'jitsu'), function(err, result) {
                if(!err && result) {
                  var token = Object.getOwnPropertyNames(result).filter(function(n){return n !== 'operation'}).pop();
                  jitsu.config.set('api-token', result[token]);
                  jitsu.config.set('api-token-name', token);
                  jitsu.config.clear('password');
                  jitsu.config.save(function (err) {
                    return err ? callback(err) : callback(null, res);
                  });
                }
              });

              
            });
          });
        })();
      }
      else {
        jitsu.log.info('User ' + username.magenta + ' confirmed');
        jitsu.log.info('Log in now?');
        jitsu.prompt.get(['login'], function (err, result) {
          if (err) {
            return callback(err);
          }
          if (/^n.+/.test(result.login)) {
            return callback();
          }
          jitsu.log.info('Attempting to log in as '+username.magenta);
          setupUserNoUsername(callback);
        });
      }
    });
  }

  if (!username) {
    return callback(new Error('username is required'), true);
  }
  else if (inviteCode) {
    //
    // They are providing an inviteCode so lets reset the password
    //
    return confirmUserHelper(username, inviteCode, callback);
  }

  jitsu.prompt.get(['invite code'], function (err, result) {
    confirmUserHelper(username, result['invite code'], callback);
  });
};

//
// Usage for `jitsu users confirm`.
//
users.confirm.usage = [
  'Confirms a Nodejitsu user account',
  'Will prompt for a valid invite code for the account',
  '',
  'jitsu users confirm <username> <invitecode>'
];