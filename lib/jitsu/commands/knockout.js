

var winston = require('winston'),
    request = require('request'),
    jitsu = require('../../jitsu');

var knockout = module.exports = function (callback) {
  winston.info('Please enter your Node Knockout ID code so that we can tell Node Knockout when you deploy!');
  jitsu.prompt.get(['knockout code'], function (err, result) {
    if (err) {
      winston.error('Prompt error:');
      return callback(err);
    }
    jitsu.config.set('knockoutcode', result['knockout code']);

    request({
      uri: 'http://nodeknockout.com/teams/' + result['knockout code'] + '/deploys'
    },
    function (err, res, body) {
      if (err) {
        winston.error('Error contacting nodeknockout.com:');
        return callback(err);
      }
      if (res.statusCode !== 200) {
        winston.error('Error: your Node Knockout code was not accepted.  Please re-enter.');
        return knockout(callback);
      }
      winston.info('Node Knockout code confirmed! Saving your code...');
      jitsu.config.save(function (err) {
        if (err) {
          winston.error('Error saving your configuration:');
          return callback(err);
        }
        winston.info('Your knockout code has been saved!');
        callback();  
      });
      
    });
  });
};

knockout.usage = [
  'jitsu knockout - configure your Node Knocout code for deployments'
];