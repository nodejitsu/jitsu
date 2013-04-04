/*
 * package.js: Command related to creating tarballs to send to jitsu
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    utile = jitsu.common;

var package = exports;

package.usage = [
  'The `jitsu package` command manages the tarballs',
  'which are automatically created by jitsu',
  'Valid commands are: ',
  '',
  'jitsu package create',
];

//
// function create (callback)
// #### @callback {function} Continuation to respond to when complete.
// Creates a tarball in the `tmproot` directory for app in the current directory
//
package.create = function (callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    callback = utile.args(arguments).callback;
  }

  jitsu.package.get(process.cwd(), function (err, pkg) {
    if (err) {
      return callback(err, true);
    }

    jitsu.log.info('Creating tarball for ' + pkg.name.magenta);
    jitsu.package.createTarball(process.cwd(), pkg.version, function (err, ign, file) {
      if (err) {
        return callback(err);
      }

      jitsu.log.info('Tarball for ' + pkg.name.magenta + ' at ' + file.magenta);
      callback();
    });
  });
};

package.create.usage = [
  'Creates a tarball in the `tmproot` directory for app in the current directory',
  '',
  'jitsu package create'
];
