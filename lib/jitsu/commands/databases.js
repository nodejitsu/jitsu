/*
 * databases.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('../../jitsu');

var databases = exports;

databases.usage = [
  '`jitsu databases *` commands allow you to work with the database api',
  '',
  'jitsu databases create <database type> <database name>',
  'jitsu databases list',
  'jitsu databases get <database name>',
  'jitsu databases destroy <database name>'
];

databases.create = function (databaseType, databaseName, callback) {
  //
  // Helper function to execute the database creation.
  //
  function executeCreate(databaseType, databaseName, callback) {
    // Make sure that the user is passing a valid database type
    if (['couch', 'redis', 'mongo'].indexOf(databaseType) === -1) {
      jitsu.log.error('Invalid database type ' + databaseType.red);
      jitsu.log.info('Expected: ' + 'couch'.magenta + ', ' + 'redis'.magenta + ' or ' + 'mongo'.magenta);
      return callback();
    }

    jitsu.databases.create(databaseType, databaseName, function (err, a, res) {
      if (err || res.statusCode >= 400) {
        if (err && err.statusCode === '409') {
          jitsu.log.error('You already created a database with that name.');
        }
        else {
          jitsu.log.error('Database could not be created.');
          jitsu.log.error(err || ('Unknown error code: ' + res.statusCode));
          jitsu.log.error('Try again and if it fails again, contact nodejitsu.');
          return callback(err);
        }
      }
      else {
        jitsu.log.info('Database ' + databaseName + ' was created.');
      }
      
      databases.get(databaseName, callback);
    });
  }

  var getProperties = [];
  
  if (!databaseName || !databaseType) {
    jitsu.log.warn('You need to pass a database name and type');
    jitsu.log.warn('jitsu databases create <database type> <database name>');
    
    if (!databaseName) {
      getProperties.push('database name');
    }

    if (!databaseType) {
      jitsu.log.warn('Valid database types are: ' + 'couch'.magenta + ', ' + 'redis'.magenta + ' or ' + 'mongo'.magenta);
      getProperties.push('database type');
    }
  }  
  
  if (!getProperties.length) {
    return executeCreate(databaseType, databaseName, callback);
  }
  
  jitsu.prompt.get(getProperties, function (err, result) {
    databaseType = result['database type'] || databaseType;
    databaseName = result['database name'] || databaseName;
    executeCreate(databaseType, databaseName, callback);
  });
};

databases.create.usage = [
  'Spins up a database for the user',
  '',
  'jitsu databases create couch <database name>',
  'jitsu databases create mongo <database name>',
  'jitsu databases create redis <database name>'
];

databases.get = function (databaseName, callback) {
  if (!databaseName) {
    jitsu.log.warn('You need to pass a database name');
    jitsu.log.warn('jitsu databases get <database name>');
    jitsu.log.warn('If you want to get a list of all the databases run:');
    jitsu.log.warn('jitsu databases list');
    return callback();
  }

  jitsu.databases.get(databaseName, function (err, results) {
    if (err) {
      if (err.statusCode === '404') {
        jitsu.log.error('Database does not exist');
      }
      else {
        jitsu.log.error('Unexpected Error: ' + err);
      }
    }
    else {
      printDatabase(results);
    }
    callback();
  });
};

databases.get.usage = [
  'Gets the metadata of a database',
  '',
  'jitsu databases get <database name>'
];

databases.list = function (callback) {
  jitsu.databases.list(function (err, results) {
    if (err) {
      jitsu.log.error('Unexpected Error: ' + err);
    }
    else {
      results.forEach(function (database) {
       jitsu.log.info('');
       printDatabase(database);
      });

      if (results.length === 0) {
        jitsu.log.info('You have no databases.');
      }
    }
    callback();
  });
};

databases.list.usage = [
  'Lists the dabases you currently have running',
  '', 
  'jitsu databases list'
];

databases.destroy = function (databaseName, callback) {
  if (!databaseName) {
    jitsu.log.error('You need to pass a database name');
    jitsu.log.error('jitsu databases destroy <database name>');
    return callback();
  }

  jitsu.databases.destroy(databaseName, function (err) {
    if (err) {
      jitsu.log.error('Database could not be destroyed.');
      jitsu.log.error(require('util').inspect(err.result.error));
    }
    else {
      jitsu.log.info('Database was deleted.');
    }
    callback();
  });
};

databases.destroy.destructive = true;
databases.destroy.usage = [
  'Deprovisions a database',
  'WARNING: this action is not reversible',
  '',
  'jitsu databases destroy <database name>'
];

var printDatabase = function (database) {
  switch (database.type) {
    case 'couch':
      var subdomain = database.metadata.id.split('/')[1];
      jitsu.log.info('Database name: ' + database.name);
      jitsu.log.info('Database type: ' + database.type);
      jitsu.log.info('Connection url: ' + ('http://' + subdomain + '.iriscouch.com:5984').grey);
      jitsu.log.info('SSL connection url: ' + ('https://' + subdomain + '.iriscouch.com:6984').grey);
      break;

    case 'mongo':
      jitsu.log.info('Database name: ' + database.name);
      jitsu.log.info('Database type: ' + database.type);
      jitsu.log.info('Connection url: ' + (database.metadata.config.MONGOHQ_URL).grey);
      break;

    case 'redis':
      var port = database.metadata.port,
          password = database.metadata.password,
          server = database.metadata.label.split('-')[0];

      jitsu.log.info('Database name: ' + database.name);
      jitsu.log.info('Database type: ' + database.type);
      jitsu.log.info('Connection url: ' + ('redis://nodejitsu:' +  password+ '@' + server + '.redistogo.com:' + port + '/').grey);
      break;

    default:
      jitsu.log.info('Database name: ' + database.name);
      jitsu.log.error('Unknown database type: ' + database.type);
      break;
  }
};
