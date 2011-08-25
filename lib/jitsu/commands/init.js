

var jitsu = require('../../jitsu'),
    winston = require('winston'),
    ncp = require('ncp'),
    path = require('path'),
    fs = require('fs');

var init = module.exports = function (starterName, callback) {

  if(typeof callback === 'undefined') {
    callback = starterName;
  }

  var starterPath = path.normalize(__dirname + '../../../../starters');
  fs.readdir(starterPath, function (err, starters) {
    if (err) {
      return callback(err);
    }

    if(typeof starterName === 'string') {
      //  Don't prompt for starter name
      createStarter({starter: starterName}, callback);
    } else {
      //  Prompt for starter name
      promptforStartername(callback);
    }

    function promptforStarterName(callback){
      winston.info('Please choose one of our starter apps so we can get you started.');
      winston.info('Available starter apps:');
      starters.forEach(function (starter) {
        winston.info(starter.cyan.bold);
      });

      jitsu.prompt.get(['starter'], function (err, results) {
        if (err) {
          return callback(err);
        }
        createStarter(results, callback);
      });

    };

    function createStarter(results, callback){

      // var starterFile = results['starter'] + '.js';
      if (starters.indexOf(results['starter']) === -1) {
        winston.error('Sorry, that\'s not a starter app.');
        return init(appname, callback);
      }

      winston.info('Using starter: ' + results['starter'].magenta);
      jitsu.prompt.get(['appname'], function (err, res) {
        if (err) {
          return callback(err);
        }
        ncp.ncp(starterPath + '/' + results['starter'], process.cwd() + '/' + res['appname'], function (err) {
          if (err) {
            return callback(err);
          }
          winston.info(res['appname'].bold + ' has been saved successfully!');
          winston.info('Jitsu will now help you create your package.json.');
          process.chdir(res['appname']);
          return jitsu.package.create(process.cwd(), function (err, result) {
            if (err) {
              return callback(err);
            }
            winston.info('Your app has been created successfully.  You may now run `jitsu deploy`.');
            return callback();
          });
        });
      });

    };

  });
};





init.usage = [
  'jitsu init - helps you create a new server.js to use on Nodejitsu.',
  'jitsu init [filename] - saves your starter app with a custom filename.'
];