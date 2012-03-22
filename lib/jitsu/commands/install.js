/*
 * install.js: Commands for installing and deploying starter apps.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var fs = require('fs'),
    path = require('path'),
    common = require('../common'),
    cpr = common.cpr,
    rimraf = common.rimraf,
    npmModule = require('npm'),
    jitsu = require('../../jitsu');

var thisPath  = process.cwd();

//
// "nodeapps" is a hash of aliases and npm packages,
//  this mapping allows us to give short names to all node apps
//
var nodeapps = {
  "helloworld": {
    "package": "nodeapps-helloworld",
    "description": "demo `hello world` http server"
  },
  "http-server": {
    "package": "http-server",
    "description": "a robust and customizable http server"
  },
  "express": {
    "package": "nodeapps-express",
    "description": "express.js boilerplate"
  },
  "socket.io": {
    "package": "nodeapps-socket.io",
    "description": "socket.io boilerplate"
  },
  "dnode": {
    "package": "nodeapps-dnode",
    "description": "dnode boilerplate"
  },
  "web-http-client": {
    "package": "web-http-client",
    "description": "web based http-client ( with server-side proxy )"
  },
  "custom-vimeo-site": {
    "package": "custom-vimeo-site",
    "description": "custom homepage for your vimeo videos"
  },
  "my-nodeapps": {
    "package": "nodeapps-my-nodeapps",
    "description": "simple site to display your node apps"
  }
};

module.exports = function (starterName, callback) {
  npmModule.load({ exit: false }, function (err) {
    if (err) {
      return callback(err);
    }
    
    if (fs.readdirSync(thisPath).length !== 0) {
      return warnOverwrite(starterName, callback);
    }

    if (typeof starterName === 'string') {
      return createApp({starter: starterName}, callback);
    }

    promptforAppName(callback);
  });

  function installApp(starterName, cb) {
    jitsu.log.info('Installing ' + starterName.magenta + ' locally.');
    jitsu.log.warn('Downloading packages from npm, this may take a moment...');
    npmModule.commands.install(thisPath, [nodeapps[starterName].package], function (err, result) {
      if (err) {
        return cb(err);
      }
      
      cpr(path.join(thisPath, 'node_modules', nodeapps[starterName].package), thisPath, function (err) {
        return err ? cb(err) : cb(err, result);
      });
    });
  }

  function warnOverwrite(starterName, cb) {
    jitsu.log.warn(process.cwd().grey + ' is not empty.');
    jitsu.log.warn('Creating a node app in this directory may overwrite existing files.');
    jitsu.prompt.get(['proceed'], function (err, results) {
      if (err) {
        return cb(err);
      }
      if (results['proceed'] !== 'yes') {
        jitsu.log.info('Try switching to an empty directory to continue.');
        return cb(null);
      }
      
      return starterName 
        ? createApp({ starter: starterName }, cb) 
        : promptforAppName(cb);
    });
  } 

  function promptforAppName(cb) {
    jitsu.log.info('Please choose a node app so we can get you started.');
    jitsu.log.info('Available node apps:');
    Object.keys(nodeapps).forEach(function (starter) {
      jitsu.log.info(starter.magenta + ' ' + nodeapps[starter].description);
    });

    jitsu.prompt.get(['starter'], function (err, results) {
      return err ? cb(err) : createApp({ starter: results['starter'] }, callback);
    });
  }

  function createApp(results, cb) {
    if (Object.keys(nodeapps).indexOf(results['starter']) === -1) {
      jitsu.log.error('Sorry, ' + results['starter'].magenta + ' is not a node app.');
      return cb('err');
    } 
    
    installApp(results['starter'], function (err, res) {
      return err ? cb(err) : postInstall(results['starter'], cb);
    });
  }

  function postInstall(starterName, cb) {
    jitsu.log.info(starterName.magenta + ' installed.')
    jitsu.log.help('You can now ' + 'jitsu deploy'.magenta + ' this application')

    jitsu.prompt.get(['start_local'], function (err, results) {
      return results['start_local'] === 'yes'
        ? startApp('local', cb)
        : cb(null);
    });    
  }

  function configApp(cb) {
    // TODO
  }

  function startApp(dest, cb) {
    var spawn = require('child_process').spawn,
        app;

    if (dest === "local") {
      //
      //  Remark: It would be nice to use:
      //
      //     npmModule.start(starterName, cb);
      //
      //  but there is a conflict in package.json formats of `npm` versus `haibu`
      //  in the scripts.start property containing the word "node" in it
      //
      var pkg = JSON.parse(fs.readFileSync(process.cwd() + '/package.json').toString());

      jitsu.log.warn(('Outputting logs from: ' + pkg.name));
      console.log('\n');

      app  = spawn('node', [pkg.scripts.start.replace(/node /, '')]);
      app.stdout.on('data', function (data) {
        console.log(data.toString());
      });
      app.stderr.on('data', function (data) {
        console.log(data.toString());
      });
      app.on('exit', function (code) {
        console.log('Application exited ', code);
      });
    }
  }

  function deployApp(cb) { 
    jitsu.log.info('Jitsu will now help you create your package.json.');
    return jitsu.package.create(process.cwd(), function (err, result) {
      if (err) {
        return cb(err);
      }
      
      jitsu.log.info('Your app has been created successfully.  Deploying!');
      jitsu.log.info('You can run additional deployments using `jitsu deploy`');
      return jitsu.plugins.cli.executeCommand(['deploy'],callback);
    });
  }
};

module.exports.usage = [
  'Installs a pre-built node.js application locally',
  '',
  'jitsu install',
  'jitsu install <appname>'
];
