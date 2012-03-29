/**
 * completion.js: Bash completion for jitsu
 * (C) 2010, Nodejitsu Inc.
 */

var fs = require('fs');

var complete = require('../../vendor/complete'),
    echo = complete.echo,
    match = complete.match;

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
 * Commands
 */

var commands = {
  'apps': {
    'create': {},
    'list': {},
    'deploy': {},
    'view': echoApps,
    'update': echoApps,
    'destroy': echoApps,
    'start': echoApps,
    'restart': echoApps,
    'stop': echoApps
  },

  'databases': {
    'create': function(words, prev, cur) {
      var types = ['couch', 'redis', 'mongo'],
          last = words[words.length-3];

      if (~types.indexOf(prev) || last === 'create') {
        commands.databases.get(words, prev, cur);
      } else {
        echo(match(cur, types));
      }
    },
    'list': {},
    'get': function(words, prev, cur) {
      var db = cache.read('database');
      if (db) {
        return echo(match(cur, db));
      }

      jitsu().databases.list(function(err, db) {
        if (err) {
          cache.write('database', []);
          return;
        }

        db = db.map(function(db) {
          return db.name;
        });

        echo(match(cur, db));
        cache.write('database', db);
      });
    },
    'destroy': function(words, prev, cur) {
      return commands.databases.get(words, prev, cur);
    }
  },

  'env': {
    'list': echoApps,
    'set': function(words, prev, cur) {
      if (prev !== 'set') return;
      return echoEnv(words, prev, cur);
    },
    'get': function(words, prev, cur) {
      if (prev !== 'get') return;
      return echoEnv(words, prev, cur);
    },
    'delete': function(words, prev, cur) {
      if (prev !== 'delete') return;
      return echoEnv(words, prev, cur);
    },
    'clear': {}
  },

  // Dynamic completion not likely
  // ever possible for this.
  'install': {},

  'logs': {
    'all': {},
    'app': function(words, prev, cur) {
      if (prev === 'app') {
        return echoApps(words, prev, cur);
      }
    }
  },

  'package': {
    'create': {}
  },

  'snapshots': {
    'create': {},
    'list': echoApps,
    'activate': echoApps,
    'destroy': echoApps
  },

  'users': {
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
  '--raw': {}
};

// Alias
commands.db = commands.databases;

/**
 * Dynamic Commands
 */

function echoApps(words, prev, cur) {
  var apps = cache.read('apps');
  if (apps) {
    return echo(match(cur, apps));
  }

  var username = jitsu().config.get('username');

  jitsu().apps.list(username, function(err, apps) {
    if (err || !apps || !apps.length) {
      cache.write('apps', []);
      return;
    }

    apps = apps.map(function(app) {
      return app.name;
    });

    echo(match(cur, apps));
    cache.write('apps', apps);
  });
}

function echoEnv(words, prev, cur) {
  var env = cache.read('env');
  if (env) {
    return echo(match(cur, env));
  }

  jitsu().package.read(process.cwd(), function(err, pkg) {
    if (err) {
      cache.write('env', {});
      return;
    }

    jitsu().apps.view(pkg.name, function(err, app) {
      if (err || !app || !app.env) {
        cache.write('env', {});
        return;
      }

      echo(match(cur, app.env));
      cache.write('env', app.env);
    });
  });
}

function echoApp(words, prev, cur) {
  var name = cache.read('pkg');
  if (name) {
    return echo(match(cur, [name]));
  }

  return jitsu().package.get(process.cwd(), function(err, pkg) {
    if (err) {
      cache.write('pkg', '');
      return;
    }

    echo(match(cur, [pkg.name]));
    cache.write('pkg', pkg.name);
  });
}

/**
 * Lazy Loading
 */

// Could possibly access the
// nodejitsu api directly for
// some things. Avoid overhead,
// avoids hacky call to .setup().

function jitsu() {
  // Disable dynamic completion for now.
  if (!process.env.JITSU_COMPLETION) {
    return;
  }

  if (!jitsu.module) {
    jitsu.module = require('../../');
    jitsu.module.setup(function() {});
  }

  return jitsu.module;
}

/**
 * Caching
 */

function cache(name, data) {
  return data
    ? cache.write(name, data)
    : cache.read(name);
}

cache.file = '/tmp/.jitsu-completion';
cache.time = 2 * 60 * 1000;

cache.read = function(name) {
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
};

cache.write = function(name, data) {
  var data = data || {},
      stale = cache.read() || {};

  stale[name] = data;

  try {
    stale = JSON.stringify(stale);
    fs.writeFileSync(cache.file, stale);
  } catch (e) {
    ;
  }
};

/**
 * Execute
 */

complete({
  program: 'jitsu',
  commands: commands,
  options: options
});
