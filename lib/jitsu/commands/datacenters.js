/*
 * datacenters.js: Commands related to use multiple datacenters
 *
 * (C) 2013, Nodejitsu Inc.
 *
 */

var jitsu      = require('../../jitsu'),
    utile      = jitsu.common;

var cloud = exports;

jitsu.alias('cloud',   { resource: 'datacenters',  command: 'set' });

cloud.usage = [
  'The `jitsu cloud` command enable management of multiple datacenters',
  'Valid commands are:',
  '',
  'jitsu cloud',
  'jitsu cloud <provider> <datacenter>',
  '',
  'In both cases, jitsu will attempt to read the package.json',
  'from the current directory.'
];

//
// ### function set (provider, datacenter, callback)
// #### @provider {string} **optional** Name of the provider to deploy
// #### @datacenter {string} **optional** Name of the datacenter to deploy
// #### @callback {function} Continuation to pass control to when complete.
// Deploy the last snapshot deployed into other datacenter.
//
cloud.set = function set (provider, datacenter, callback) {
  if (provider && datacenter) {
    // With parameters so we'll deploy to that datacener
    jitsu.package.get(process.cwd(), function (err, app) {
      if (err) return callback(err);
      //@todo daniel check and validate arguments
      jitsu.apps.datacenter(provider,  { provider: provider, datacenter:datacenter }, function (err, snaps) {
       console.log(arguments);
       console.log(snaps.pop().snapshot)
      });
    });
  } else if (provider && !datacenter) {
    // Otherwise we should show the actual datacenter
    jitsu.apps.view(provider, function (err, app) {
      console.log(arguments);
    });
  } else {
    jitsu.package.get(process.cwd(), showDatacenter);
  }

  function showDatacenter (err, app) {
    console.log(arguments);
    jitsu.log.info(app.name);
    jitsu.log.info(app.cloud);
    console.log(app.cloud);
    app.cloud.forEach(function (c) {
      console.log(c);
    });

  }
};