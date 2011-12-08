/*
 * databases.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var winston = require('winston'),
    jitsu = require('../../jitsu');

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


  // This gets called after the arguments are sorted out.
  var create = function (databaseType, databaseName, callback) {
    // Make sure that the user is passing a valid database type
    if (['couch', 'redis', 'mongo'].indexOf(databaseType) === -1) {
      winston.error('Invalid database type ' + databaseType.red);
      winston.info('Expected: ' + 'couch'.magenta + ', ' + 'redis'.magenta + ' or ' + 'mongo'.magenta);
      return callback();
    }

    jitsu.databases.create(databaseType, databaseName, function (err, a, res) {
      if (err || res.statusCode >= 400) {
        if (err && err.statusCode === '409') {
          winston.error('You already created a database with that name.');
        }
        else {
          winston.error('Database could not be created.');
          winston.error(err || ('Unknown error code: ' + res.statusCode));
          winston.error('Try again and if it fails again, contact nodejitsu.');
          return callback(err);
        }
      }
      else {
        winston.info('Database ' + databaseName + ' was created.');
      }
      
      databases.get(databaseName, callback);
    });
  }

  // If not all arguments are there, prompt the user for name and type.
  if (!callback) {
    var promptFor = ['database name'];

    winston.error('You need to pass a database name and type');
    winston.error('jitsu databases create <database type> <database name>');
    
    if (!databaseName) {
      callback = databaseType;
      promptFor = ['database type'].concat(promptFor);
      winston.error('Valid database types are: ' + 'couch'.magenta + ', ' + 'redis'.magenta + ' or ' + 'mongo'.magenta);
    }
    else {
      callback = databaseName;
      
    }

    jitsu.prompt.get(promptFor, function (err, result) {
      databaseType = result['database type'] || databaseType;
      databaseName = result['database name'] || databaseName;
      create(databaseType, databaseName, callback);
    });
    
    //return callback();
  } else {
    create(databaseType, databaseName, callback);
  }

};

databases.create.usage = [
  'Spins up a database for the user',
  '',
  'Example usage:',
  'jitsu databases create couch <database name>',
  'jitsu databases create mongo <database name>',
  'jitsu databases create redis <database name>'
]

databases.get = function (databaseName, callback) {
  if (!callback) {
    winston.error('You need to pass a database name');
    winston.error('jitsu databases get <database name>');
    winston.error('If you want to get a list of all the databases run:');
    winston.error('jitsu databases list');
    callback = databaseName;
    return callback();
  }

  jitsu.databases.get(databaseName, function (err, results) {
    if (err) {
      if (err.statusCode === '404') {
        winston.error('Database does not exist');
      }
      else {
        winston.error('Unexpected Error: ' + err);
      }
    }
    else {
      printDatabase(results);
    }
    callback();
  });
}

databases.get.usage = [
  'Gets the metadata of a database',
  '',
  'Example usage:',
  'jitsu databases get <database name>'
]

databases.list = function (callback) {
  jitsu.databases.list(function (err, results) {
    if (err) {
      winston.error('Unexpected Error: ' + err);
    }
    else {
      results.forEach(function (database) {
       winston.info('');
       printDatabase(database);
      });

      if (results.length === 0) {
        winston.info('You have no databases.');
      }
    }
    callback();
  });
}

databases.list.usage = [
  'Lists the dabases you currently have running',
  '', 
  'Example usage:',
  'jitsu databases list'
]

databases.destroy = function (databaseName, callback) {
  if (!callback) {
    winston.error('You need to pass a database name');
    winston.error('jitsu databases destroy <database name>');
    callback = databaseName;
    return callback();
  }

  jitsu.databases.destroy(databaseName, function (err) {
    if (err) {
      winston.error('Database could not be destroyed.');
      winston.error(err.result.error);
    }
    else {
      winston.info('Database was deleted.');
    }
    callback();
  });
}

databases.destroy.usage = [
  'Deprovisions a database',
  'WARNING: this action is not reversible',
  '',
  'Example usage:',
  'jitsu databases destroy <database name>'
]
databases.destroy.destructive = true

var printDatabase = function (database) {
  switch (database.type) {
    case 'couch':
      var subdomain = database.metadata.id.split('/')[1];
      winston.info('Database name: ' + database.name);
      winston.info('Database type: ' + database.type);
      winston.info('Connection url: ' + ('http://' + subdomain + '.couchone.com:5984').grey);
      break;

    case 'mongo':
      winston.info('Database name: ' + database.name);
      winston.info('Database type: ' + database.type);
      winston.info('Connection url: ' + (database.metadata.config.MONGOHQ_URL).grey);
      break;

    case 'redis':
      var port = database.metadata.port,
          password = database.metadata.password,
          server = database.metadata.label.split('-')[0];

      winston.info('Database name: ' + database.name);
      winston.info('Database type: ' + database.type);
      winston.info('Connection url: ' + ('redis://nodejitsu:' +  password+ '@' + server + '.redistogo.com:' + port + '/').grey);
      break;

    default:
      winston.info('Database name: ' + database.name);
      winston.error('Unknown database type: ' + database.type);
      break;
  }
}
