

var jitsu = require('../../jitsu'),
    winston = require('winston'),
    path = require('path'),
    fs = require('fs');

var init = module.exports = function (appname, callback) {
  var starterPath = path.normalize(__dirname + '../../../../starters');
  if (typeof appname === 'function') {
    callback = appname;
    appname = 'server.js';
  }
  winston.info('Please choose one of our starter apps so we can get you started.');
  winston.info('Available starter apps:');
  fs.readdir(starterPath, function (err, files) {
    if (err) {
      return callback(err);
    }
    files.forEach(function (file) {
      winston.info(file.replace(/\.js/, '').cyan.bold);
    });
    jitsu.prompt.get(['starter'], function (err, results) {
      if (err) {
        return callback(err);
      }
      var starterFile = results['starter'] + '.js';
      if (files.indexOf(starterFile) === -1) {
        winston.error('Sorry, that\'s not a starter app.');
        return init(appname, callback);
      }
      winston.info('Using starter: ' + starterFile);
      fs.readFile(starterPath + '/' + starterFile, function (err, data) {
        if (err) {
          winston.error('Error reading starter:');
          return callback(err);
        }
        fs.writeFile(appname, data, function (err) {
          if (err) {
            winston.error('Error saving your new app...');
            return callback(err);
          }
          winston.info(appname.bold + ' has been saved successfully!');
          winston.info('Jitsu will now help you create your package.json.');
          return jitsu.package.create(process.cwd(), function (err, result) {
            if (err) {
              return callback(err);
            }
            winston.info('Your app has been created successfully.  You may now run `jitsu deploy`.');
            return callback();
          });
        });
      });
    });
  });
};

init.usage = [
  'jitsu init - helps you create a new server.js to use on Nodejitsu.',
  'jitsu init [filename] - saves your starter app with a custom filename.'
];