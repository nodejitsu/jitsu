/*
 * keys.js: Commands related to user keys
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu');

var keys = exports;

//
// ### function create (username, keyName callback)
// #### @username {string} Username
// #### @data {string} Key data
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to create a key on the user's behalf.
//
keys.create = function (username, data, callback) {
  var user = {
    username: username,
    password: jitsu.config.get('password')
  };

  if (data.path) {
    fs.readFile(data.path, 'utf8', function(err, val) {
      if (err) return callback(err);
      val = val.split(/\s+/);
      data.value = val[1] || val[0];
      delete data.path;
      return next();
    });
  } else {
    return next();
  }

  function next() {
    jitsu.keys.create(user, data, function (err, response) {
      if (err) return callback(err);
      jitsu.log.help('Key successfully created.');
    });
  }
};

//
// Usage for `jitsu keys create`.
//
keys.create.usage = [
  'Adds a key to jitsu, if no path is specified, generate random API key.',
  '',
  'jitsu keys create <name> <path>'
];

//
// ### function list (username, callback)
// #### @username {string} Username
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to list all keys bound to the user.
//
keys.list = function (username, callback) {
  var user = {
    username: username,
    password: jitsu.config.get('password')
  };

  jitsu.keys.list(user, function (err, keys) {
    if (err) return callback(err);

    var rows = [['name', 'state', 'subdomain', 'start', 'latest']],
        colors = ['underline', 'underline', 'underline', 'underline', 'underline'];

    Object.keys(keys).forEach(function (k) {
      var key = keys[k];
      rows.push([
        k,
        key.type,
        key.value,
        key.ttl,
      ]);
    });

    jitsu.inspect.putRows('data', rows, colors);
  });
};

//
// Usage for `jitsu keys list`.
//
keys.list.usage = [
  'List all API and SSH keys.',
  '',
  'jitsu keys list'
];

//
// ### function view (username, keyName callback)
// #### @username {string} Username
// #### @keyName {string} Name of the key
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to return a key.
//
keys.view = function (username, keyName, callback) {
  var user = {
    username: username,
    password: jitsu.config.get('password')
  };

  jitsu.keys.view(user, keyName, function (err, key) {
    if (err) return callback(err);
    jitsu.inspect.putObject(key);
  });
};

//
// Usage for `jitsu keys view`.
//
keys.view.usage = [
  'View a specific API or SSH key by name.',
  '',
  'jitsu keys view <name>'
];

//
// ### function delete (username, keyName callback)
// #### @username {string} Username
// #### @keyName {string} Name of the key
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to return a key.
//
keys.delete = function (username, keyName, callback) {
  var user = {
    username: username,
    password: jitsu.config.get('password')
  };

  // fix this ins nodejitsu-api
  jitsu.keys.destroy(user, keyName, function (err) {
    if (err) return callback(err);
    jitsu.log.help('Key deleted successfully.');
  });
};

//
// Usage for `jitsu keys delete`.
//
keys.delete.usage = [
  'Delete the specified API or SSH key.',
  '',
  'jitsu keys delete <name>'
];

