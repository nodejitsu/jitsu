/*
 * databases.js: Commands related to user resources
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('../../jitsu');

var databases = exports;

databases.usage = [
  'The `jitsu databases` commands manages databases',
  '',
  'jitsu databases create <database type> <database name>',
  'jitsu databases list',
  'jitsu databases get <database name>',
  'jitsu databases destroy <database name>',
  '',
  'Valid database types are: ' + 'couch'.magenta + ', ' + 'redis'.magenta + ', or ' + 'mongo'.magenta
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
        jitsu.log.error('Database name is required');
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
    jitsu.log.warn('Database name required');
    jitsu.log.warn('jitsu databases get <database name>');
    jitsu.log.warn('To list all the databases run:');
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
      printDbHelp(results);
    }
    callback();
  });
};

databases.get.usage = [
  'Gets the metadata of a database',
  '',
  'jitsu databases get <database name>'
];

databases.list = function (username, callback) {
  function responseHandler (err, results) {
    if (err) {
      if (err.statusCode === 403) {
        jitsu.log.error('Not authorised.');
      }
      else jitsu.log.error('Unexpected Error: ' + err);
    }
    else {
      results.forEach(function (database) {
       jitsu.log.info('');
       printDatabase(database);
      });

      if (results.length === 0) {
        jitsu.log.info('No databases found');
      }
    }
    callback();
  }
  
  if (arguments.length === 1) {
    callback = username;
    username = null;
  }
  
  if (!username) {
   jitsu.databases.list(responseHandler);
  } else {
   jitsu.databases.list(username, responseHandler);
  }
};

databases.list.usage = [
  'Lists the dabases you currently have running',
  '', 
  'jitsu databases list'
];

databases.destroy = function (databaseName, callback) {
  if (!databaseName) {
    jitsu.log.warn('Database name is required');
    jitsu.log.error('jitsu databases destroy <database name>');
    return callback();
  }

  jitsu.databases.destroy(databaseName, function (err) {
    if (err) {
      jitsu.log.error('Database could not be destroyed');
      jitsu.log.error(require('util').inspect(err.result.error));
    }
    else {
      jitsu.log.info('Database was deleted');
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

      var connUrl = 'http://' + subdomain + '.iriscouch.com:5984',
          sslConnUrl = 'https://' + subdomain + '.iriscouch.com:6984';

      jitsu.log.data('Connection url: ' + connUrl.grey);
      jitsu.log.data('SSL connection url: ' + sslConnUrl.grey);
      break;

    case 'mongo':
      printBase(database);
      jitsu.log.data('Connection url: ' + (database.metadata.config.MONGOHQ_URL).grey);
      break;

    case 'redis':
      var port = database.metadata.port,
          password = database.metadata.password,
          server = database.metadata.label.split('-')[0] + '.redistogo.com';

      printBase(database);
      jitsu.log.data('Connection host: ' + server.grey);
      jitsu.log.data('Connection port: ' + String(port).grey);
      jitsu.log.data('Connection auth: ' + password.grey);
      break;

    default:
      jitsu.log.info('Database name: ' + database.name);
      jitsu.log.error('Unknown database type: ' + database.type);
      break;
  }
};

var printDbHelp = function (database) {

  switch (database.type) {
    case 'couch':
      var subdomain = database.metadata.id.split('/')[1];

      var connUrl = 'http://' + subdomain + '.iriscouch.com:5984',
          sslConnUrl = 'https://' + subdomain + '.iriscouch.com:6984';

      // TODO: Only write this if in some "verbose" mode.
      [
        '',
        'Connect with `' + 'curl'.magenta + '`:',
        '',
        '    $ curl ' + connUrl,
        '',
        'Connect with the `' + 'futon'.magenta + '` web app (' + 'open in a web browser'.cyan + '):',
        '',
        '    ' + connUrl + '/_utils',
        '',
        'Connect with the `' + 'nano'.magenta + '` module:',
        '',
        '    var nano = require(\'nano\')(\'' + connUrl + '\');',
        ''
      ].forEach(printHelp);

      break;

    case 'mongo':
      var parsed = require('url').parse(database.metadata.config.MONGOHQ_URL),
          auth = parsed.auth.split(':');

      // TODO: Only write this if in some "verbose" mode.
      [
        '',
        'Connect with the `' + 'mongo'.magenta + '` cli client:',
        '',
        '    $ mongo ' + parsed.host + parsed.path + ' -u ' + auth[0] + ' -p ' + auth[1],
        '',
        'Connect with the `' + 'mongodb-native'.magenta + ' module`:',
        '',
        '    var mongodb = require(\'mongodb\');',
        '    var db = new mongodb.Db(\'' + parsed.path.substr(1) + '\',',
        '      new mongodb.Server(\'' + parsed.hostname + '\', ' + parsed.port +', {})',
        '    );',
        '    db.open(function (err, db_p) {',
        '      if (err) { throw err; }',
        '      db.authenticate(\'' + auth[0] + '\', \'' + auth[1] + '\', function (err, replies) {',
        '        // You are now connected and authenticated.',
        '      });',
        '    });',
        '',
        'Connect with the `' + 'mongoose'.magenta + '` module:',
        '',
        '    var mongoose = require(\'mongoose\');',
        '    mongoose.connect(\'' + database.metadata.config.MONGOHQ_URL + '\');',
        ''
      ].forEach(printHelp);

      break;

    case 'redis':
      var port = database.metadata.port,
          password = database.metadata.password,
          server = database.metadata.label.split('-')[0] + '.redistogo.com';

      [
        '',
        'Connect with the `' + 'redis-cli'.magenta + '` cli tool:',
        '',
        '    $ redis-cli -h ' + server + ' -p ' + port + ' -a ' + password,
        '',
        'Connect with the `' + 'redis'.magenta + '` module:',
        '',
        '    var redis = require(\'redis\');',
        '    var client = redis.createClient(' + port + ', \'' + server + '\');',
        '    client.auth(\'' + password + '\', function (err) {',
        '      if (err) { throw err; }',
        '      // You are now connected to your redis.',
        '    });',
        '',
      ].forEach(printHelp);

      break;

    default:
      break;
  }

  function printHelp(l) {
    var lvl = 0,
        helplvl = 6;

    if (l.substr(0, 4) == '    ') {
      // Only print help if the logger is configured such that help lvls
      // should show
      try {
        lvl = jitsu.log.loggers.default.levels[
          jitsu.log.loggers.default.level
        ];
        helplvl = jitsu.log.loggers.default.levels['help'];
      }
      finally {
        if (lvl <= helplvl) {
          console.log('         ' + l);
        }
      }
    }
    else {
      jitsu.log.help(l);
    }
  }
};
