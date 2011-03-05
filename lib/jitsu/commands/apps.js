/*
 * apps.js: Commands related to app resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');

var apps = exports;

apps.list = function (callback) {
  jitsu.apps.list(function (err, apps) {
    var rows = [['name', 'state', 'subdomain', 'start', 'latest']],
        colors = ['underline', 'yellow', 'green', 'grey', 'red'];
    
    apps.forEach(function (app) {
      rows.push([
        app.name,
        app.state || 'stopped',
        app.subdomain,
        app.scripts.start || '---',
        app.snapshots && app.snapshots.length > 0 ? app.snapshots[0].filename : '---'
      ]);
    });
    
    jitsu.log.logRows('data', rows, colors);
  });
};

apps.create = function (name, callback) {
  jitsu.utils.readPackage(process.cwd(), function (err, pkg) {
    if (!callback) {
      callback = name;
      name = null;
    }

    pkg.name = name || pkg.name;
    //
    // TODO (indexzero): Configure this default value in nodejitsu APIs
    //
    pkg.state = 'stopped';
    winston.info('Validating package.json for ' + pkg.name.magenta);
    jitsu.prompt.addProperties(pkg, ['subdomain'], function (updated) {
      winston.info('Creating app ' + pkg.name.magenta);
      jitsu.apps.create(updated, function (err, res, result) {
        winston.silly('Done creating app ' + pkg.name.magenta);
        return err ? callback(err) : callback();
      });
    });
  });
};

apps.update = function (name, callback) {
  if (!callback) {
    callback = name;
  }
  
  
};

apps.destroy = function (name, callback) {
  
};

apps.start = function (name, callback) {
  
};

apps.stop = function (name, callback) {
  
};