
var jitsu     = require('../../jitsu'),
    winston   = require('winston'),
    ncp       = require('ncp'),
    rimraf    = require('rimraf'),
    path      = require('path'),
    fs        = require('fs'),
    npmModule = require('npm'),
    thisPath  = process.cwd();


//
// "nodeapps" is a hash of aliases and npm packages,
//  this mapping allows us to give short names to all node apps
//
var nodeapps = {
  "helloworld" : {
    "package"     : "nodeapps-helloworld",
    "description" : "demo `hello world` http server"
  },
  "http-server" : {
    "package"     : "http-server",
    "description" : "a robust and customizable http server"
  },
  "express" : {
    "package"     : "nodeapps-express",
    "description" : "express.js boilerplate"
  },
  "socket.io" : {
    "package"     : "nodeapps-socket.io",
    "description" : "socket.io boilerplate"
  },
  "dnode" : {
    "package"     : "nodeapps-dnode",
    "description" : "dnode boilerplate"
  },
  "web-http-client" : {
    "package"     : "web-http-client",
    "description" : "web based http-client ( with server-side proxy )"
  },
  "custom-vimeo-site" : {
    "package"     : "custom-vimeo-site",
    "description" : "custom homepage for your vimeo videos"
  },
  "my-nodeapps" : {
    "package"     : "nodeapps-my-nodeapps",
    "description" : "simple site to display your node apps"
  }
};

var install = module.exports = function (starterName, callback) {

  npmModule.load({exit:false}, function (err) {
    if (err) {
      return callback(err);
    }
    if(typeof callback === 'undefined') {
      callback = starterName;
      starterName = null;
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
    winston.info('Installing ' + starterName.magenta + ' locally.');
    winston.warn('Downloading packages from npm, this may take a moment...');
    npmModule.commands.install(thisPath, [nodeapps[starterName].package], function(err, result){
      if (err) {
        return cb(err);
      }
      ncp.ncp(path.join(thisPath, 'node_modules', nodeapps[starterName].package), thisPath, function (err) {
        if (err) {
          return cb(err);
        }
        cb(err, result);
      });
    });
  }

  function warnOverwrite(starterName, cb) {
    winston.warn(process.cwd().grey + ' is not empty.');
    winston.warn('Creating a node app in this directory may overwrite existing files.');
    jitsu.prompt.get(['proceed'], function (err, results) {
      if (err) {
        return cb(err);
      }
      if (results['proceed'] !== 'yes') {
        winston.info('Try switching to an empty directory to continue.');
        return cb(null);
      }
      return starterName ? createApp({ starter: starterName }, cb) : promptforAppName(cb);
    });
  } 

  function promptforAppName(cb) {
    winston.info('Please choose a node app so we can get you started.');
    winston.info('Available node apps:');
    Object.keys(nodeapps).forEach(function (starter) {
      winston.info(starter.magenta + ' ' + nodeapps[starter].description);
    });

    jitsu.prompt.get(['starter'], function (err, results) {
      if (err) {
        return cb(err);
      }
      createApp({ starter: results['starter'] }, callback);
    });
  }

  function createApp(results, cb) {
    if (Object.keys(nodeapps).indexOf(results['starter']) === -1) {
      winston.error('Sorry, ' + results['starter'].magenta + ' is not a node app.');
      return cb('err');
    } 
    installApp(results['starter'], function (err, res) {
      if (err) {
        return cb(err);
      }
      return postInstall(results['starter'], cb);
    });
  }

  function postInstall(starterName, cb) {

    winston.info(starterName.magenta + ' installed.')
    winston.help('You can now ' + 'jitsu deploy'.magenta + ' this application')

    jitsu.prompt.get(['start_local'], function(err, results){
      if (results['start_local'] !== 'yes') {
        return cb(null);
      }
      return startApp('local', cb);
      //return deployApp(cb);
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

      winston.warn(('Outputting logs from: ' + starterName));
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
    winston.info('Jitsu will now help you create your package.json.');
    return jitsu.package.create(process.cwd(), function (err, result) {
      if (err) {
        return cb(err);
      }
      winston.info('Your app has been created successfully.  Deploying!');
      winston.info('You can run additional deployments using `jitsu deploy`');
      return jitsu.commands.run(['deploy'], callback);
    });
  }

};

install.usage = [
  'Installs a pre-built node.js application locally',
  '',
  'jitsu install',
  'jitsu install <appname>'
];
