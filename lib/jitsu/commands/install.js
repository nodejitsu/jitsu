'use strict';

/*
 * install.js: Commands for installing and deploying starter apps.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var canihaz = require('canihaz')('jitsu'),
    fs = require('fs'),
    path = require('path'),
    exists = fs.exists || path.exists,
    common = require('../common'),
    cpr = common.cpr,
    wizard = require('wizard'),
    jitsu = require('../../jitsu'),
    utile = jitsu.common,
    npm;

//
// "nodeapps" is a hash of aliases and npm packages,
//  this mapping allows us to give short names to all node apps
//
var nodeapps = {
  "helloworld": {
    "package": "nodeapps-helloworld",
    "description": "   demo `hello world` http server"
  },
  "express": {
    "package": "nodeapps-express",
    "description": "      express.js boilerplate"
  },
  "socket.io": {
    "package": "nodeapps-socket.io",
    "description": "    socket.io boilerplate"
  },
  "http-server": {
    "package": "http-server",
    "description": "  a robust and customizable http server"
  },
  "ghost": {
    "package": "persistent-ghost",
    "description": "        the ghost blogging platform with MongoDB persistence"
  }
};

module.exports = function (requestedApp, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if (arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    requestedApp  = args[0] || null;
  }

  var app = {
    name : requestedApp,
    config: {
      path: null,
      schemaPath: null,
      schema : null
    }
  };

  canihaz.npm(function fetch(err, module) {
    if (err) {
      return callback(err);
    }

    npm = module;
    npm.load({ exit: false }, function (err) {
      if (err) {
        return callback(err);
      }

      if (typeof app.name === 'string') {
        return createApp({starter: app.name}, callback);
      }

      promptforAppName(callback);
    });
  });

  function createApp(results, cb) {
    if (Object.keys(nodeapps).indexOf(results.starter) === -1) {
      jitsu.log.error('Sorry, ' + results.starter.magenta + ' is not a node app');
      return cb('err');
    }

    installApp(results.starter, function (err, res) {
      return err ? cb(err) : postInstall(results.starter, cb);
    });
  }

  function installApp(appName, cb) {
    var thisPath = process.cwd();

    jitsu.log.info('Installing ' + appName.magenta + ' locally');
    jitsu.log.warn('Downloading packages from npm, this may take a moment...');
    npm.commands.install(appName, [nodeapps[appName].package], function (err, result) {
      if (err) {
        return cb(err);
      }

      cpr(path.join(thisPath + '/' + appName, 'node_modules', nodeapps[appName].package), thisPath + '/' + appName, function (err) {
        if (err) {
          return cb(err);
        }

        //
        // Read current package.json
        //
        var pkg = JSON.parse(fs.readFileSync(thisPath + '/' + appName + '/package.json').toString()),
            installhook = pkg['jitsu-install'];

        //
        // Strip out any un-needed internal ids and our custom `jitsu-install`
        // hook.
        //
        delete pkg['jitsu-install'];
        for(var k in pkg) {
          if (k.search("_") !== -1) {
            delete pkg[k];
          }
        }

        //
        // Write modified package.json back out
        //
        fs.writeFileSync(thisPath + '/' + appName + '/package.json', JSON.stringify(pkg, true, 2));

        if (!installhook) return cb(err, result);

        //
        // We got a custom `jitsu install` hook that needs to be ran.
        //
        require(thisPath + '/' + appName + '/'+ installhook)(jitsu, function (err) {
          cb(err, result);
        });
      });
    });
  }

  function promptforAppName(cb) {
    jitsu.log.help('The ' + 'install'.magenta + ' command downloads pre-built node apps');
    jitsu.log.info('Please select a node app to get started');
    jitsu.log.info('Available node apps:');

    Object.keys(nodeapps).forEach(function (starter) {
      jitsu.log.info(starter.magenta + ' ' + nodeapps[starter].description);
    });

    jitsu.prompt.get(['starter'], function (err, results) {
      if (err) {
        jitsu.log.warn('Cancelled');
        return cb(null, 'Cancelled');
      }
      return createApp({ starter: results.starter }, callback);
    });
  }

  function postInstall(appName, cb) {
    app.name = appName;

    jitsu.log.info(app.name.magenta + ' installed');

    //
    // Check if the app provides any configuration schema
    //
    app.config.schemaPath = './' + app.name + '/config/schema.json';
    exists(app.config.schemaPath, function (exists) {
      if (exists) {
        try {
          app.config.schema = JSON.parse(fs.readFileSync(app.config.schemaPath).toString());
          app.config.path = './' + app.name + '/config/development.json';
          configureApp(app.config.schema, cb);
        } catch (err) {
          cb(err);
        }
      } else {
        promptStart(cb);
      }
    });
  }

  function configureApp (schema, cb) {
    jitsu.log.info('Attempting to configure app based on ' + './config/schema.json'.grey);
    jitsu.log.help('Prompting for ' + app.name.magenta + ' configuration data');
    jitsu.log.help('Press ' + '[ENTER]'.grey + ' to specify default values');

    wizard.cli.run(schema, function (err, config) {

      //
      // Remark: Now that we have the configuration data,
      // we will push it to various sources ( like ENV and file-system )
      //

      //
      // TODO: set ENV values based on config, either package.json so it gets picked up by NJ API
      //

      //
      // Write configuration data to *.json files on file-system
      //
      writeConfiguration(config, function () {
        promptStart(cb);
      });

    });
  }

  function writeConfiguration (config, cb) {
    return fs.writeFile(app.config.path, JSON.stringify(config, true, 2), cb);
  }

  function promptStart (cb) {
    jitsu.log.help('To deploy type: ');
    jitsu.log.help('');
    jitsu.log.help(('  cd ' + app.name).grey);
    jitsu.log.help('  ' + 'jitsu deploy'.grey);
    jitsu.log.help('');

    //
    // Prompt to see if the user wants to start the application
    //
    jitsu.prompt.get(['start_local'], function (err, results) {
      if (err) {
        jitsu.log.warn('Cancelled');
        return cb(null, 'Cancelled');
      }
      return results.start_local === 'yes'
        ? startApp('local', cb)
        : cb(null);
    });
  }

  function startApp(dest, cb) {
    var spawn = require('child_process').spawn;

    jitsu.log.info(app.name.magenta + ' is now starting');
    jitsu.log.help('To exit the app, press CTRL-C \n');

    if (dest === "local") {
      return npm.start(process.cwd() + '/' + app.name, cb);
    }
  }

  function deployApp(cb) {
    jitsu.log.info('Jitsu will now help create a package.json');
    return jitsu.package.create(process.cwd(), function (err, result) {
      if (err) {
        return cb(err);
      }

      jitsu.log.info('The app has been created successfully. Deploying!');
      jitsu.log.info('Run additional deployments using `jitsu deploy`');
      return jitsu.plugins.cli.executeCommand(['deploy'],callback);
    });
  }
};

module.exports.usage = [
  'Installs a pre-built node.js app locally',
  '',
  'jitsu install',
  'jitsu install <appname>'
];
