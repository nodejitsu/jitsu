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
      data.value = val.split(/\s+/)[1];
      delete data.path;
      return next();
    });
  } else {
    return next();
  }

  function next() {
    jitsu.users.createKey(user, data.name, function (err, response) {
      if (err) return callback(err);
      jitsu.log.help('Key successfully created.');
    });
  }
};

//
// Usage for `jitsu keys create`.
//
keys.create.usage = [
  'Confirms the Nodejitsu user account for the specified username.',
  'You will be prompted to supply a valid invite code for the account.',
  '',
  'jitsu keys confirm <username> <invitecode>'
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

  jitsu.users.listKeys(user, function (err, keys) {
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
  'Confirms the Nodejitsu user account for the specified username.',
  'You will be prompted to supply a valid invite code for the account.',
  '',
  'jitsu keys confirm <username> <invitecode>'
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

  jitsu.users.getKey(user, keyName, function (err, key) {
    if (err) return callback(err);
    jitsu.inspect.putObject(key);
  });
};

//
// Usage for `jitsu keys view`.
//
keys.view.usage = [
  'Confirms the Nodejitsu user account for the specified username.',
  'You will be prompted to supply a valid invite code for the account.',
  '',
  'jitsu keys confirm <username> <invitecode>'
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

  jitsu.users.deleteKey(user, keyName, function (err) {
    if (err) return callback(err);
    jitsu.log.help('Key deleted successfully.');
  });
};

//
// Usage for `jitsu keys delete`.
//
keys.delete.usage = [
  'Confirms the Nodejitsu user account for the specified username.',
  'You will be prompted to supply a valid invite code for the account.',
  '',
  'jitsu keys confirm <username> <invitecode>'
];

