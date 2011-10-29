

var jitsu     = require('../../jitsu'),
    winston   = require('winston'),
    ncp       = require('ncp'),
    rimraf    = require('rimraf'),
    path      = require('path'),
    fs        = require('fs'),
    npmModule = require('npm'),
    mkdirp    = require('mkdirp'),
    thisPath  = process.cwd();

var starters = {
  helloworld: 'helloworld',
  static: 'simple-static'
}

var install = module.exports = function (starterName, callback) {
  npmModule.load({exit:false}, function (err) {
    if (err) {
      return callback(err);
    }
    if(typeof callback === 'undefined') {
      callback = starterName;
      starterName = null;
    } 
    if (fs.readdirSync(thisPath).length !== 0) {
      return warnOverwrite(starterName, callback);
    }
    if (typeof starterName === 'string') {
      return createApp({starter: starterName}, callback);
    }
    promptforAppName(callback);
  });

  function installApp(starterName, cb) {
    npmModule.install(starterName, function(err, result){
      if (err) {
        return cb(err);
      }
      winston.info('Using node app: ' + starterName.magenta);
      ncp.ncp(thisPath + '/node_modules/' + starterName, thisPath, function (err) {
        if (err) {
          return cb(err);
        }
        rimraf(thisPath + '/node_modules', function (err) {
          if (err) {
            return cb(err);
          }
          mkdirp('./node_modules/' + starterName, 0755, function (err) {
            cb(err, result);
          });
        });
      });
    });
  }

  function warnOverwrite(starterName, cb) {
    winston.warn('The current directory is not empty.');
    winston.warn('Creating a node app in' + process.cwd() + ' this directory may overwrite the existing files.');
    jitsu.prompt.get(['proceed'], function (err, results) {
      if (err) {
        return cb(err);
      }
      if (results['proceed'] !== 'yes') {
        winston.info('Try switching to an empty directory to continue.');
        return cb(null);
      }
      return starterName ? createApp({ starter: starterName }, cb) : promptforAppName(cb);
    });
  } 

  function promptforAppName(cb) {
    winston.info('Please choose one of our starter apps so we can get you started.');
    winston.info('Available starter apps:');
    Object.keys(starters).forEach(function (starter) {
      winston.info(starter.cyan.bold);
    });

    jitsu.prompt.get(['starter'], function (err, results) {
      if (err) {
        return cb(err);
      }
      createApp({ starter: results['starter'] }, callback);
    });
  }

  function createApp(results, cb) {
    if (Object.keys(starters).indexOf(results['starter']) === -1) {
      winston.error('Sorry, that\'s not a starter app.');
      return install(callback);
    } 
    installApp(starters[results['starter']], function (err, res) {
      if (err) {
        return cb(err);
      }
      //return deployApp(cb);
      return postInstall(cb);
    });
  }

  function postInstall(cb) {

    winston.info('Node App has installed.')

    jitsu.prompt.get(['start_local'], function(err, results){
      if (results['start_local'] !== 'yes') {
        return cb(null);
      }
      return startApp('local', cb);
    });
    
  }

  function configApp(cb) {

  }


  function startApp(dest, cb) {
    cb(null);
  }

  function deployApp(cb) { 
    winston.info('Jitsu will now help you create your package.json.');
    return jitsu.package.create(process.cwd(), function (err, result) {
      if (err) {
        return cb(err);
      }
      winston.info('Your app has been created successfully.  Deploying!');
      winston.info('You can run additional deployments using `jitsu deploy`');
      return jitsu.commands.run(['deploy'], callback);
    });
  }

};

install.usage = [
  'jitsu install - helps you create a new server.js to use on Nodejitsu.',
  'jitsu install [node app name] - specifies the starter app you want to use.'
];
