var winston = require('winston'),
    request = require('request'),
    jitsu = require('../../jitsu');

var knockout = module.exports = function (callback) {
  winston.info('This command is reserved for competitors of ' + 'NODE KNOCKOUT!'.grey);
  winston.info('Please enter your ' + 'node knockout secret code'.grey + ' to get started.');
  winston.info('If you need a secret code, go to ' + 'http://nodeknockout.com/teams/mine'.grey);

  jitsu.prompt.get(['knockout secret code'], function (err, result) {
    if (err) {
      winston.error('Prompt error:');
      return callback(err);
    }
    jitsu.config.set('knockoutcode', result['knockout secret code']);
    request({
      uri: 'http://nodeknockout.com/teams/' + encodeURIComponent(result['knockout secret code']) + '/deploys?nop'
    },
    function (err, res, body) {
      if (err) {
        winston.error('Error contacting nodeknockout.com:');
        return callback(err);
      }
      if (res.statusCode !== 200) {
        winston.error('Error: your ' + 'Node Knockout secret code'.grey + ' was not accepted.  Please re-enter.');
        return knockout(callback);
      }
      winston.info('node knockout secret code'.grey + ' confirmed! Saving your code...');
      jitsu.config.save(function (err) {
        if (err) {
          winston.error('Error saving your configuration:');
          return callback(err);
        }
        winston.info('Your node knockout secret code has been saved!');
        jitsu.prompt.get(['askstarter'], function (err, results) {
          if (err) {
            return callback(err);
          }
          if (/^[no]+/.test(results['askstarter'])) {
            return callback();
          }
          return jitsu.commands.run(['init', 'knockout'], callback);
        });
      });
    });
  });
};

knockout.usage = [
  'jitsu knockout - configure your Node Knocout secret code and get ready to deploy in one command.'
];