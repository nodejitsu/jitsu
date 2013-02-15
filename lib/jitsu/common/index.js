/*
 * index.js: Top-level include for the utils module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    flatiron = require('flatiron'),
    dateformat = require('dateformat'),
    async = flatiron.common.async,
    request = require('request'),
    semver = require('semver'),
    jitsu = require('../../jitsu');

var common = module.exports = flatiron.common.mixin({}, flatiron.common);

//
// ### function formatApp (app, exclude)
// #### @app {Object} Application document to format
// #### @exclude {Array} **Optional** List of additional properties to exclude
// Formats the specified `app` by removing unnecessary properties combined with
// any additional properties the caller wishes to `exclude`.
//
common.formatApp = function (app, exclude) {
  var snapshots = app.snapshots,
      remove = ['_id', '_rev', 'id', 'resource'];

  app.snapshots = !snapshots ? [] : snapshots.map(function (snap) {
    var created = new Date(snap.ctime);
    created = dateformat(created, "mm/dd HH:MM:ss Z");
    return {
      id: snap.id,
      created: created
    }
  });

  if (exclude) {
    remove = remove.concat(exclude);
  }

  //
  // TODO: won't work with current rendering of package.json
  //
  // app.state = common.formatAppState(app.state);

  //
  // Update the ctime and mtime of the document to a more human-readable format
  //
  app.ctime = dateformat(app.ctime, "mm/dd HH:MM:ss Z");
  app.mtime = dateformat(app.mtime, "mm/dd HH:MM:ss Z");

  //
  // Format ctime to more human-readable format for snapshots if they are available
  //
  if (app.active) {
    app.active.ctime = dateformat(app.active.ctime, "mm/dd HH:MM:ss Z");
  }

  if (app.running) {
    app.running.ctime = dateformat(app.running.ctime, "mm/dd HH:MM:ss Z");
  }


  remove.forEach(function (key) {
    delete app[key];
  });

  return app;
}

common.formatAppState = function (state) {

  var str;

  if (state === "started") {
    str = state.green;
  } else {
    str = (state || 'unknown').grey;
  }

  return str;

};

//
// ### function missingKeys (source, target)
// #### @source {Array} List of keys for the current object
// #### @target {Array} List of keys for the new object
// Returns the complement of the intersection of the two arrays.
//
// e.g. [1,2,3,5], [1,2,3,4,5] => [4]
//
common.missingKeys = function (source, target) {
  var missing = [];

  source.forEach(function (key) {
    if (target.indexOf(key) === -1) {
      missing.push(key);
    }
  });

  return missing;
};

//
// ### function objectDiff (current, update, level)
// #### @current {Object} Current representation of the object.
// #### @update {Object} Updated representation of the object.
// #### @level {Number} Level in the object we are diffing.
// Returns an incremental diff of the `current` object
// against the updated representation `update`
//
// e.g. { foo: 1, bar: 2 }, { foo: 2, bar: 2 } => { foo: 2 }
//
common.objectDiff = function (current, update, level) {
  var ckeys = Object.keys(current),
      ukeys = Object.keys(update),
      diff = {};

  //
  // Ignore changes on the first level of the object.
  //
  level = level || 0;
  if (level > 0) {
    common.missingKeys(ckeys, ukeys).forEach(function (key) {
      diff[key] = undefined;
    });
  }

  ukeys.forEach(function (key) {
    var nested, i;

    if (!current[key]) {
      diff[key] = update[key];
    }
    else if (Array.isArray(update[key])) {
      if (update[key].length !== current[key].length) {
        diff[key] = update[key];
      }
      else {
        for (i = 0; i < update[key]; i += 1) {
          if (current[key].indexOf(update[key][i]) === -1) {
            diff[key] = update[key];
            break;
          }
        }
      }
    }
    else if (typeof update[key] === 'object') {
      if ((nested = common.objectDiff(current[key], update[key], level + 1))) {
        diff[key] = update[key];
      }
    }
    else {
      if (current[key] !== update[key]) {
        diff[key] = update[key];
      }
    }
  });

  return Object.keys(diff).length > 0 ? diff : null;
};

common.checkVersion = function (callback) {
  var responded = false

  //
  // Check the GitHub tags for `jitsu` to see if the current
  // version is outdated. If it is not make sure to message the user at the end.
  //
  request({
    uri: 'http://registry.npmjs.org/jitsu/latest',
    timeout: 1000
  }, function (err, res, body) {
    if (!responded) {
      responded = true;

      try {
        var pkg = JSON.parse(body);

        if (semver.gt(pkg.version, jitsu.version)) {
          jitsu.log.warn('A newer version of ' + 'jitsu'.magenta + ' is available. ' + 'please update immediately');
          jitsu.log.help('To install the latest ' + 'jitsu'.magenta + ' type `[sudo] npm install jitsu -g`');
          jitsu.log.warn('To ' + 'continue'.bold + ' without an update ' + 'type'.cyan  + ' ' + '\'yes\''.magenta);

          jitsu.prompt.confirm('Continue without updating? Bad things might happen (no)', function (err, result) {
            return err ? callback() : callback(!result);
          });

          return;
        }

        callback();
      }
      catch (ex) {
        //
        // Ignore errors from GitHub. We will notify the user
        // of an upgrade at the next possible opportunity.
        //
        callback();
      }
    }
  });
};
