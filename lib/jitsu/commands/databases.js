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

databases.available = ['couch', 'redis', 'mongo'];

//
// Micro aliasing for databases command
//
// Remark: This will allow for commands like:
//
//     jitsu databases create c mycouch
//
// .. and a couch db will be created.
//
databases.aliases = {
  couch : ['c', 'couchdb'],
  redis : ['r'],
  mongo : ['m', 'mongodb']
};

//
// Remark: This alias method is used to help alias sub-commands,
// I'd prefer to have this functionality be part of flatiron.
//
databases.alias = function (requestedDatabaseType) {
  var type = requestedDatabaseType;
  databases.available.forEach(function (dbType) {
    databases.aliases[dbType].forEach(function (al) {
      if (al === requestedDatabaseType) {
        type = dbType;
      }
    });
  });
  return type;
}

databases.create = function (requestedDatabaseType, requestedDatabaseName, callback) {

  var database = {
    name: requestedDatabaseName,
    type: requestedDatabaseType
  };

  //
  // Helper function to execute the database creation.
  //
  function createDatabase(database, callback) {

    database.type = databases.alias(database.type);

    //
    // Make sure that the user is passing in a valid database type
    //
    if (databases.available.indexOf(database.type) === -1) {
      jitsu.log.warn('Invalid database type ' + database.type.red);
      database.type = null;
      return promptForDatabase(callback);
    }

    jitsu.databases.create(database.type, database.name, function (err, a, res) {
      if (err || res.statusCode >= 400) {
        //
        // TODO: Refactor this error handling
        //
        if (err && err.statusCode === 409 || err.statusCode === 404) {
          jitsu.log.error('Database with name ' + database.name.magenta + ' already exists');
          jitsu.log.info('Try again with a new database name');
          database.name = null;
          return promptForDatabase(callback);
        }
        else {
          jitsu.log.error('Database could not be created');
          jitsu.log.error(err || ('Unknown error code: ' + res.statusCode));
          jitsu.log.error('Try again and if it still fails, please contact nodejitsu');
          return callback(err);
        }
      }
      else {
        jitsu.log.info('A new ' + database.type.magenta + ' has been created');
      }
      
      databases.get(database.name, callback);
    });
  }

  function promptForDatabase (callback) {
    var getProperties = [];

    if (!database.name || !database.type) {
      if (!database.name) {
        jitsu.log.warn('Database name is required');
        getProperties.push({
          name: 'database name',
          default: database.type
        });
      }

      if (!database.type) {
        jitsu.log.warn('Valid database types are: ' + 'couch'.magenta + ', ' + 'redis'.magenta + ', or ' + 'mongo'.magenta);
        getProperties.push('database type');
      }
    }

    if (!getProperties.length) {
      return createDatabase(database, callback);
    }

    jitsu.prompt.get(getProperties, function (err, result) {
      database.type = result['database type'] || database.type;
      database.name = result['database name'] || database.name;
      createDatabase(database, callback);
    });
  }

  promptForDatabase(callback);

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
      if (err.statusCode === 404) {
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

  function printBase (database) {
    jitsu.log.data('Database Type: ' + database.type.grey);
    jitsu.log.data('Database Name: ' + database.name.grey);
  }

  switch (database.type) {
    case 'couch':
      var subdomain = database.metadata.id.split('/')[1];
      printBase(database);
      jitsu.log.data('Connection url: ' + ('http://' + subdomain + '.iriscouch.com:5984').grey);
      jitsu.log.data('SSL connection url: ' + ('https://' + subdomain + '.iriscouch.com:6984').grey);
      break;

    case 'mongo':
      printBase(database);
      jitsu.log.data('Connection url: ' + (database.metadata.config.MONGOHQ_URL).grey);
      break;

    case 'redis':
      var port = database.metadata.port,
          password = database.metadata.password,
          server = database.metadata.label.split('-')[0];

      printBase(database);
      jitsu.log.data('Connection url: ' + ('redis://nodejitsu:' +  password+ '@' + server + '.redistogo.com:' + port + '/').grey);
      break;

    default:
      jitsu.log.info('Database name: ' + database.name);
      jitsu.log.error('Unknown database type: ' + database.type);
      break;
  }
};
