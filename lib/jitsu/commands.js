/*
 * commands.js: Configuration for commands provided by flatiron plugins.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('../jitsu');

jitsu.use(require('flatiron-cli-users'), {
  before: {
    login: function (details) {
      if (!details || !details.username) {
        jitsu.log.warn('You will need to login to continue');
        jitsu.log.info('To login, you will need an activated nodejitsu account');
        jitsu.log.help('You can create an account using the ' + 'jitsu signup'.magenta + ' command');
      }
    }
  },
  after: {
    create: function (details) {
      jitsu.log.help('Your account has been created, but it is not yet active');
      jitsu.log.help('Please check the email we sent to ' + details.email.grey + ' for further instructions');
    }
  }
});