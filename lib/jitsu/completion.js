/**
 * completion.js: Bash completion for jitsu
 * (C) 2010, Nodejitsu Inc.
 */

var fs = require('fs');

var complete = require('complete'),
    output = complete.output;

/**
 * Jitsu Commands
 */

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
// jitsu login
// jitsu logout
// jitsu deploy
// jitsu conf

/**
 * Dynamic Completion
 */

var echo = {
  apps: function (words, prev, cur) {
    var apps = cache.read('apps');
    if (apps) {
      output(cur, apps);
      return;
    }

    var username = jitsu().config.get('username');

    jitsu().apps.list(username, function (err, apps) {
      if (err || !apps || !apps.length) {
        cache.write('apps', []);
        return;
      }

      apps = apps.map(function (app) {
        return app.name;
      });

      output(cur, apps);
      cache.write('apps', apps);
    });
  },
  app: function (words, prev, cur) {
    var name = cache.read('pkg');
    if (name) {
      output(cur, [name]);
      return;
    }

    return jitsu().package.get(process.cwd(), function (err, pkg) {
      if (err) {
        cache.write('pkg', '');
        return;
      }

      output(cur, [pkg.name]);
      cache.write('pkg', pkg.name);
    });
  },
  env: function (words, prev, cur) {
    var env = cache.read('env');
    if (env) {
      output(cur, env);
      return;
    }

    jitsu().package.read(process.cwd(), function (err, pkg) {
      if (err) {
        cache.write('env', {});
        return;
      }

      jitsu().apps.view(pkg.name, function (err, app) {
        if (err || !app || !app.env) {
          cache.write('env', {});
          return;
        }

        output(cur, app.env);
        cache.write('env', app.env);
      });
    });
  },
  db: function (words, prev, cur) {
    var db = cache.read('database');
    if (db) {
      output(cur, db);
      return;
    }

    jitsu().databases.list(function (err, db) {
      if (err) {
        cache.write('database', []);
        return;
      }

      db = db.map(function (db) {
        return db.name;
      });

      output(cur, db);
      cache.write('database', db);
    });
  }
};

/**
 * Dynamic Completion Switch
 */

if (!process.env.JITSU_COMPLETION) {
  echo = { apps: {}, app: {}, env: {}, db: {} };
}

/**
 * Caching
 */

var cache = {
  file: '/tmp/.jitsu-completion',
  time: 2 * 60 * 1000,
  read: function (name) {
    var mtime, data;

    try {
      mtime = +fs.statSync(cache.file).mtime;
    } catch (e) {
      return;
    }

    if (mtime < new Date - cache.time) {
      return fs.unlinkSync(cache.file);
    }

    try {
      data = JSON.parse(fs.readFileSync(cache.file, 'utf8'));
      return name ? data[name] : data;
    } catch (e) {
      return;
    }
  },
  write: function (name, data) {
    var data = data || {},
        stale = cache.read() || {};

    stale[name] = data;

    try {
      stale = JSON.stringify(stale);
      fs.writeFileSync(cache.file, stale);
    } catch (e) {
      ;
    }
  }
};

/**
 * Lazy Loading
 */

function jitsu() {
  if (!jitsu.module) {
    jitsu.module = require('../../');
    jitsu.module.setup(function () {});
  }

  return jitsu.module;
}

/**
 * Commands
 */

var commands = {
  'apps': {
    'create': {},
    'list': {},
    'deploy': {},
    'view': echo.apps,
    'update': echo.apps,
    'destroy': echo.apps,
    'start': echo.apps,
    'restart': echo.apps,
    'stop': echo.apps
  },

  'databases': {
    'create': function (words, prev, cur) {
      var types = ['couch', 'redis', 'mongo'],
          last = words[words.length-3];

      if (~types.indexOf(prev) || last === 'create') {
        echo.db(words, prev, cur);
      } else {
        output(cur, types);
      }
    },
    'list': {},
    'get': echo.db,
    'destroy': function (words, prev, cur) {
      return echo.db(words, prev, cur);
    }
  },

  'env': {
    'list': echo.apps,
    'set': function (words, prev, cur) {
      if (prev !== 'set') return;
      return echo.env(words, prev, cur);
    },
    'get': function (words, prev, cur) {
      if (prev !== 'get') return;
      return echo.env(words, prev, cur);
    },
    'delete': function (words, prev, cur) {
      if (prev !== 'delete') return;
      return echo.env(words, prev, cur);
    },
    'clear': {}
  },

  'install': {},

  'logs': {
    'all': {},
    'app': function (words, prev, cur) {
      if (prev !== 'app') return;
      return echo.apps(words, prev, cur);
    }
  },

  'package': {
    'create': {}
  },

  'snapshots': {
    'create': {},
    'list': echo.apps,
    'activate': echo.apps,
    'destroy': echo.apps
  },

  'users': {
    'confirm': function (words, prev, cur) {
      var username = jitsu().config.get('username') || '';
      output(cur, [username]);
    }
  },

  'wizard': {},
  'whoami': {},

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

  'signup': {},
  'login': {},
  'logout': {},
  'deploy': {},
  'conf': {}
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
  '--raw': {},
  '-c': {},
  '--confirm': {}
};

/**
 * Aliases
 */

commands.db = commands.databases;

/**
 * Execute
 */

complete({
  program: 'jitsu',
  commands: commands,
  options: options
});
