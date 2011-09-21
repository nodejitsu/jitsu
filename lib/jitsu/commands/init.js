

var jitsu     = require('../../jitsu'),
    winston   = require('winston'),
    ncp       = require('ncp'),
    rimraf    = require('rimraf'),
    path      = require('path'),
    fs        = require('fs'),
    npmModule = require('npm'),
    thisPath  = process.cwd();

var starters = {
  helloworld: 'helloworld',
  static: 'simple-static'
}

var init = module.exports = function (starterName, callback) {
  npmModule.load({exit:false}, function (err) {
    if (err) {
      return callback(err);
    }
    if(typeof callback === 'undefined') {
      callback = starterName;
    }
    if (typeof starterName === 'string') {
      return createStarter({starter: starterName}, callback);
    }
    promptforStarterName(callback);
  });

  function installStarter(starterName, cb) {
    npmModule.install(starterName, function(err, result){
      if (err) {
        return cb(err);
      }
      winston.info('Using starter: ' + starterName.magenta);
      ncp.ncp(thisPath + '/node_modules/' + starterName, thisPath, function (err) {
        if (err) {
          return cb(err);
        }
        rimraf(thisPath + '/node_modules', function (err) {
          cb(err, result);
        });
      });
    });
  }

  function promptforStarterName(cb) {

    winston.info('Please choose one of our starter apps so we can get you started.');
    winston.info('Available starter apps:');
    Object.keys(starters).forEach(function (starter) {
      winston.info(starter.cyan.bold);
    });

    jitsu.prompt.get(['starter'], function (err, results) {
      if (err) {
        return cb(err);
      }
      createStarter({ starter: results['starter'] }, callback);
    });
  }

  function createStarter(results, cb){

    if (Object.keys(starters).indexOf(results['starter']) === -1) {
      winston.error('Sorry, that\'s not a starter app.');
      return init(callback);
    }
    installStarter(starters[results['starter']], function (err, res) {
      if (err) {
        console.log(arguments)
        return cb(err);
      }
      winston.info('Jitsu will now help you create your package.json.');
      return jitsu.package.create(process.cwd(), function (err, result) {
        if (err) {
          return cb(err);
        }
        winston.info('Your app has been created successfully.  Deploying!');
        winston.info('You can run additional deployments using `jitsu deploy`');
        return jitsu.commands.run(['deploy'], callback);
      });
    });
  }
};

init.usage = [
  'jitsu init - helps you create a new server.js to use on Nodejitsu.',
  'jitsu init [starter name] - specifies the starter app you want to use.'
];