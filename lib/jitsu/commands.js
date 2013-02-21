/*
 * commands.js: Configuration for commands provided by flatiron plugins.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../jitsu');

jitsu.use(require('flatiron-cli-users'), {
  before: {
    login: function (details, next) {
      if (!details || !details.username) {
        jitsu.log.help('An activated nodejitsu account is required to login');
        jitsu.log.help('To create a new account use the ' + 'jitsu signup'.magenta + ' command');
      }
      next();
    }
  },
  after: {
    create: function (details) {
      jitsu.log.help('Please check for an email sent to ' + details.email.grey + ' for further activation instructions.');
    },
    login: function (details, next) {
      //
      // Retrieve a token and remove the password with it
      //
      if (details && details.username) {
        jitsu.tokens.create(details.username, (jitsu.config.get('api-token-name')||'jitsu'), function(err, result) {
          if(!err && result) {
            var token = Object.getOwnPropertyNames(result).filter(function(n){return n !== 'operation'}).pop();
            jitsu.config.set('api-token', result[token]);
            jitsu.config.set('api-token-name', token);
            jitsu.config.clear('password');
            jitsu.config.save();
            return next();
          }
        });
      }
    },
    logout: function(details, next){
      jitsu.config.clear('api-token');
      jitsu.config.save();
      return next();
    }
  }
});