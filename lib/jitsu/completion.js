/**
 * completion.js: Bash completion for jitsu
 *
 */

var completed = require('complete')
  , echo = completed.echo
  , match = completed.match;

// Jitsu Commands:
// jitsu apps [<command>]
//   jitsu apps create
//   jitsu apps list
//   jitsu apps deploy
//   jitsu apps view    [<name>]
//   jitsu apps update  [<name>]
//   jitsu apps destroy [<name>]
//   jitsu apps start   [<name>]
//   jitsu apps restart [<name>]
//   jitsu apps stop    [<name>]

// jitsu databases [<commands>]
//   jitsu databases create <database type> <database name>
//   jitsu databases list
//   jitsu databases get <database name>
//   jitsu databases destroy <database name>

// jitsu env [<commands>]
//   jitsu env list   <app>
//   jitsu env set    <key> <value>
//   jitsu env get    <key>
//   jitsu env delete <key>
//   jitsu env clear

// jitsu install [<commands>]
//   jitsu install <appname>

// jitsu logs [<commands>]
//   jitsu logs all <number of lines to show>
//   jitsu logs app <app name>
//   jitsu logs app <app name> <number of lines to show>

// jitsu package [<commands>]
//   jitsu package create

// jitsu snapshots [<commands>]
//   jitsu snapshots create
//   jitsu snapshots list
//   jitsu snapshots list <app-name>
//   jitsu snapshots activate
//   jitsu snapshots activate <app-name>
//   jitsu snapshots destroy
//   jitsu snapshots destroy <app-name>

// jitsu users [<commands>]
//   jitsu users confirm <username> <invitecode>

// jitsu wizard [<commands>]
//   jitsu wizard

// jitsu help [<commands>]
//   jitsu help apps
//   jitsu help databases
//   jitsu help env
//   jitsu help install
//   jitsu help logs
//   jitsu help package
//   jitsu help snapshots
//   jitsu help users
//   jitsu help wizard

// jitsu signup

/**
 * Commands
 */

var commands = {
  'apps': {
    'create': {},
    'list': {},
    'deploy': {},
    'view': function(words, prev, cur) {
      var username = jitsu().config.get('username');
      jitsu().apps.list(username, function(err, apps) {
        if (err) return process.exit(1);
        if (!apps || !apps.length) return;
        apps = apps.map(function(app) {
          return app.name;
        });
        echo(match(cur, apps));
      });
    },
    'update': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    },
    'destroy': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    },
    'start': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    },
    'restart': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    },
    'stop': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    }
  },

  'databases': {
    'create': function(words, prev, cur) {
      var types = ['couch', 'redis', 'mongo'];
      if (~types.indexOf(prev) || words[words.length-3] === 'create') {
        // Database Name
        commands.databases.get(words, prev, cur);
      } else {
        // Database Type
        echo(match(cur, types));
      }
    },
    'list': {},
    'get': function(words, prev, cur) {
      // Database Name
      jitsu().databases.list(function(err, db) {
        if (err) return process.exit(1);
        db = db.map(function(db) {
          return db.name;
        });
        echo(match(cur, db));
      });
    },
    'destroy': function(words, prev, cur) {
      return commands.databases.get(words, prev, cur);
    }
  },

  'env': {
    // List env variables for app.
    // Optionally specify an app name.
    'list': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur)
    },
    // Set an cwd app's env variable.
    'set': function(words, prev, cur) {
      if (prev !== 'set'
          && prev !== 'get'
          && prev !== 'delete') return;

      // From jitsu/commands/env.js
      function view(cb, done) {
        jitsu().package.tryRead(process.cwd(), cb, function(pkg) {
          jitsu().apps.view(pkg.name, function(err, app) {
            return err ? cb(err) : done(null, app);
          });
        });
      }

      function cb(err) {
        if (err) process.exit(1);
      }

      view(cb, function(err, app) {
        if (err || !app || !app.env) return;
        echo(match(cur, app.env));
      });
    },
    'set': function(words, prev, cur) {
      return commands.env.set(words, prev, cur)
    },
    'get': function(words, prev, cur) {
      return commands.env.set(words, prev, cur)
    },
    'delete': function(words, prev, cur) {
      return commands.env.set(words, prev, cur)
    },
    'clear': {}
  },

  'install': function(words, prev, cur) {
    // MOCK API - most likely impossible/insane
    // if we're checking an npm server
    npm().getAllPackageNames(function(err, apps) {
      apps = apps.map(function(app) {
        return app.name;
      });
      echo(match(cur, apps));
    });
  },

  'logs': {
    // No sense in having dynamic completion for 'all'
    'all': {},
    // We need app names.
    'app': function(words, prev, cur) {
      if (prev === 'app') {
        return commands.apps.view(words, prev, cur);
      }

      // POSSIBLY just complete for cwd
      return jitsu.package.tryRead(process.cwd(), callback, function(pkg) {
        echo(match(cur, [name]));
      });
    }
  },

  'package': {
    'create': {}
  },

  'snapshots': {
    'create': {},
    'list': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);

      // POSSIBLY just complete for cwd
      return jitsu.package.tryRead(process.cwd(), callback, function(pkg) {
        echo(match(cur, [name]));
      });
    },
    'activate': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    },
    'destroy': function(words, prev, cur) {
      return commands.apps.view(words, prev, cur);
    }
  },

  'users': {
    // Probably shouldn't complete username ?
    'confirm': function(words, prev, cur) {
      var username = jitsu().config.get('username') || '';
      echo(match(cur, [username]));
    }
  },

  'wizard': {},

  'help': {
    'apps': {},
    'databases': {},
    'env': {},
    'install': {},
    'logs': {},
    'package': {},
    'snapshots': {},
    'users': {},
    'wizard': {}
  },

  'signup': {}
};

var options = {
  '--version': {},
  '-v': {},
  '--localconf': {},
  '--jitsuconf': {},
  '-j': {},
  '--noanalyze': {},
  '--colors': {},
  '--release': {},
  '-r': {},
  '--raw': {}
};

// Alias
commands.db = commands.databases;

completed({
  program: 'jitsu',
  commands: commands,
  options: options
});

/**
 * Helpers
 */

// Lazy loading

// Could possibly access the
// nodejitsu api directly for
// some things. Avoid overhead,
// avoids hacky call to .setup().
function jitsu() {
  if (!jitsu.module) {
    jitsu.module = require('../../');
    jitsu.module.setup(function() {});
  }
  return jitsu.module;
}

function npm() {
  if (!npm.module) {
    npm.module = { getAllPackageNames: function() {} };
  }
  return npm.module;
}
