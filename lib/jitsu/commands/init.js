

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
      promptforStarterName(callback);
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
      ncp.ncp(starterPath + '/' + results['starter'], process.cwd(), function (err) {
        if (err) {
          return callback(err);
        }

        //
        // TODO: Remove this hack, it's only being used for doing NKO's custom CODE,
        // in the future, we could make this part of a starters configuration
        //

          //
          // Swap out placeholder for {{knockoutcode}}
          //
          var knockoutServer = process.cwd() + '/server.js';
          var nkoModule = fs.readFileSync(knockoutServer).toString();

          nkoModule = nkoModule.replace('{{knockoutcode}}', "'" + jitsu.config.get('knockoutcode') + "'");
          fs.writeFileSync(knockoutServer, nkoModule);

        winston.info('Jitsu will now help you create your package.json.');
        return jitsu.package.create(process.cwd(), function (err, result) {
          if (err) {
            return callback(err);
          }

          winston.info('Your app has been created successfully.  Deploying!');
          winston.info('You can run additional deployments using `jitsu deploy`');
          return jitsu.commands.run(['deploy'], callback);

        });
      });

    };

  });
};





init.usage = [
  'jitsu init - helps you create a new server.js to use on Nodejitsu.',
  'jitsu init [filename] - saves your starter app with a custom filename.'
];