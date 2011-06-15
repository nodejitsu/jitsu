/*
 * databases.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('jitsu');

var databases = exports;

databases.usage = [
  '`jitsu databases *` commands allow you to work with the database api',
  '',
  'jitsu databases create <database type> <database name>',
  'jitsu databases list',
  'jitsu databases get <database name>',
  'jitsu databases delete <database name>'
];

databases.create = function (databaseType, databaseName, callback) {
  // Make sure that the user is passing a valid database type
  if ( ['couch', 'redis', 'mongo'].indexOf(databaseType) === -1 ) {
    winston.error('Invalid database type ' + databaseType.red);
    winston.info('Expected: `couch`, `redis` or `mongo`');
    return callback();
  }

  jitsu.databases.create(databaseType, databaseName, function (err) {
    if (err) {
      if (err.statusCode === '409' ) {
        winston.error('You already created a database with that name');
      }
      else {
        winston.error(err);
        return callback(err);
      }
    }
    else {
      winston.info('Database ' + databaseName + ' was created.');
    }
    databases.get(databaseName, callback);
  });
};

databases.create.usage = [
  'Spins up a database for the user',
  '',
  'example usage:',
  'jitsu databases create couch <database name>',
  'jitsu databases create mongo <database name>',
  'jitsu databases create redis <database name>'
]

databases.get = function (databaseName, callback) {
  jitsu.databases.get(databaseName, function (err, results) {
    if (err) {
      winston.error('Unexpected Error: ' + err);
    }
    else {
      winston.info('Database name: ' + results.name);
      winston.info('Database type: ' + results.type);
      winston.info('Id: ' + results.metadata.id);
    }
    callback();
  });
}

databases.list = function (callback) {
  jitsu.databases.list(function (err, results) {
    if (err) {
      winston.error('Unexpected Error: ' + err);
    }
    else {
      results.forEach(function (database) {
       winston.info('');
       winston.info('Database name: ' + database.name);
       winston.info('Database type: ' + database.type);
       winston.info('Id: ' + database.metadata.id);
      });

      if (results.length === 0) {
        winston.info('You have no databases');
      }
    }
    callback();
  });
}

databases.delete = function (databaseName, callback) {
  jitsu.databases.delete(databaseName, function (err) {
    if (err) {
      winston.error('Database could not be deleted');
    }
    else {
      winston.info('Database was deleted.');
    }
    callback();
  });
}
