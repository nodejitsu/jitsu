/*
 * keys.js: Commands related to user keys
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    fs = require('fs');

var keys = exports;

//
// ### function create (keyName, file, callback)
// #### @keyName {string} Desired key name
// #### @file {string} Path to public key file
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to create a key on the user's behalf.
//
keys.create = function (keyName, file, callback) {
  var user = jitsu.config.get('username');
  var data = { name: keyName };

  function checkType() {
    jitsu.log.info('Type of key? ' + '(api/ssh)'.magenta);
    jitsu.prompt.get(['type'], function (err, result) {
      if (result.type === 'ssh') {
        jitsu.log.info('Please enter location of public key.');
        jitsu.log.info(
          '~/.ssh/id_rsa.pub'.magenta
          + ' will be used by default.');
        return jitsu.prompt.get(['file'], function (err, result) {
          if (err) return callback(err);
          file = result.file || jitsu.config.get('root') + '/.ssh/id_rsa.pub';
          return checkTTL(readKey);
        });
      }
      return checkTTL(function() {
        jitsu.log.info('Generating API key.');
        return createKey();
      });
    });
  }

  function checkTTL(next) {
    if (data.ttl == null) {
      jitsu.log.info('Time-to-live? Enter a date.');
      return jitsu.prompt.get(['ttl'], function(err, result) {
        if (err) return callback(err);

        var ttl = new Date(result.ttl);
        if (ttl + '' === 'Invalid Date'
            || isNaN(+ttl)
            || ttl < new Date) {
          return next();
        }

        data.ttl = ttl - new Date;

        return next();
      });
    }
    return next();
  }

  function readKey() {
    fs.readFile(file, 'utf8', function(err, val) {
      if (err) return callback(err);

      if (/private key/i.test(val)) {
        jitsu.log.error(
          'Private key detected. Stopping.'
          + ' Are you sure this is a'
          + ' public'.bold + ' key?');
        return callback(new Error(), true);
      }

      data.value = val;

      jitsu.log.info('Uploading public key.');
      return createKey();
    });
  }

  function createKey() {
    jitsu.keys.create(user + '/keys/' + keyName, data, function (err, response) {
      if (err) return callback(err);
      jitsu.log.info('Key successfully created.');
      return callback();
    });
  }

  if (!user) {
    return jitsu.commands.users.login(function (err) {
      if (err) return callback(err, true);
      return keys.create(keyName, file, callback);
    });
  }

  if (!keyName) {
    jitsu.log.info('Please enter a name for your key.');
    return jitsu.prompt.get(['name'], function(err, result) {
      return err
        ? callback(err)
        : keys.create(result.name, file, callback);
    });
  }

  // If there is a file path,
  // we can assume it is a public key.
  return file
    ? readKey()
    : checkType();
};

//
// Usage for `jitsu keys create`.
//
keys.create.usage = [
  'Adds a key to jitsu, if no file is specified, generate random API key.',
  '',
  'jitsu keys create',
  'jitsu keys create <name>',
  'jitsu keys create <name> <file>'
];

//
// ### function list (callback)
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to list all keys bound to the user.
//
keys.list = function (callback) {
  var user = jitsu.config.get('username');

  if (!user) {
    return jitsu.commands.users.login(function (err) {
      if (err) return callback(err, true);
      return keys.list(keyName, callback);
    });
  }

  jitsu.keys.list(user, function (err, keys) {
    if (err) return callback(err);

    var rows = [['name', 'type', 'value', 'ttl']],
        colors = ['underline', 'underline', 'underline', 'underline'];

    Object.keys(keys).forEach(function (k) {
      var key = keys[k];
      rows.push([
        k,
        key.type,
        key.value.substring(0, 40),
        key.ttl || 'none'
      ]);
    });

    jitsu.inspect.putRows('data', rows, colors);

    return callback();
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
// ### function view (keyName callback)
// #### @keyName {string} Name of the key
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to return a key.
//
keys.view = function (keyName, callback) {
  var user = jitsu.config.get('username');

  if (!user) {
    return jitsu.commands.users.login(function (err) {
      if (err) return callback(err, true);
      return keys.view(keyName, callback);
    });
  }

  if (!keyName) {
    jitsu.log.info('Please enter a name for your key.');
    return jitsu.prompt.get(['name'], function(err, result) {
      return err
        ? callback(err)
        : keys.view(result.name, callback);
    });
  }

  jitsu.keys.view(user + '/keys/' + keyName, function (err, key) {
    if (err) return callback(err);
    jitsu.inspect.putObject(key);
    return callback();
  });
};

//
// Usage for `jitsu keys view`.
//
keys.view.usage = [
  'View a specific API or SSH key by name.',
  '',
  'jitsu keys view',
  'jitsu keys view <name>'
];

//
// ### function delete (keyName, callback)
// #### @keyName {string} Name of the key
// #### @callback {function} Continuation to pass control to when complete.
// Attempt to return a key.
//
keys.delete = function (keyName, callback) {
  var user = jitsu.config.get('username');

  if (!user) {
    return jitsu.commands.users.login(function (err) {
      if (err) return callback(err, true);
      return keys.delete(keyName, callback);
    });
  }

  if (!keyName) {
    jitsu.log.info('Please enter a name for your key.');
    return jitsu.prompt.get(['name'], function(err, result) {
      return err
        ? callback(err)
        : keys.delete(result.name, callback);
    });
  }

  // fix this ins nodejitsu-api
  jitsu.keys.destroy(user + '/keys/' + keyName, function (err) {
    if (err) return callback(err);
    jitsu.log.help('Key deleted successfully.');
    return callback();
  });
};

//
// Usage for `jitsu keys delete`.
//
keys.delete.usage = [
  'Delete the specified API or SSH key.',
  '',
  'jitsu keys delete',
  'jitsu keys delete <name>'
];
