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
        jitsu.log.warn('Login is required to continue');
        jitsu.log.info('To login, an activated nodejitsu account is required');
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
      // Check if the user has webops token and replace the password with it
      //
      if (details && details.username) {
        jitsu.tokens.list(details.username, function(err, results) {
          if(!err && results && results.apiTokens && results.apiTokens.webops) {
            var token = results.apiTokens.webops;
            jitsu.config.set('password', token);
            jitsu.config.save();
            return next();
          }
        });
      }
    }
  }
});