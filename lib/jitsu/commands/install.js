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
  }
};


/*

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

*/

module.exports = function (starterName, callback) {
  npmModule.load({ exit: false }, function (err) {
    if (err) {
      return callback(err);
    }

    if (typeof starterName === 'string') {
      return createApp({starter: starterName}, callback);
    }

    promptforAppName(callback);
  });

  function installApp(starterName, cb) {

    var thisPath = process.cwd();

    jitsu.log.info('Installing ' + starterName.magenta + ' locally.');
    jitsu.log.warn('Downloading packages from npm, this may take a moment...');
    npmModule.commands.install(starterName, [nodeapps[starterName].package], function (err, result) {
      if (err) {
        return cb(err);
      }
      
      cpr(path.join(thisPath + '/' + starterName, 'node_modules', nodeapps[starterName].package), thisPath + '/' + starterName, function (err) {

        if (err) {
          return cb(err);
        }

        //
        // Read current package.json
        //
        var pkg = JSON.parse(fs.readFileSync(thisPath + '/' + starterName + '/package.json').toString());

        //
        // Strip out any un-needed internal ids
        //
        for(var k in pkg) {
          if (k.search("_") !== -1) {
            delete pkg[k];
          }
        }

        //
        // Write modified package.json back out
        //
        fs.writeFileSync(thisPath + '/' + starterName + '/package.json', JSON.stringify(pkg, true, 2));

        return cb(err, result);
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

    jitsu.log.help('The ' + 'install'.magenta + ' command downloads pre-built node applications.');
    jitsu.log.help('To continue, you will need to select an application.');
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
    jitsu.log.info(starterName.magenta + ' installed.');
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

    jitsu.log.info(starterName.magenta + ' is now starting.')
    jitsu.log.help('To exit application, press CTRL-C \n');

    if (dest === "local") {
      return npmModule.start(process.cwd() + '/' + starterName, cb);
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
