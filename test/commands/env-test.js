/*
 * env-test.js: Tests for `jitsu env *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    async = require('flatiron').common.async,
    nock = require('nock'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

var fixturesDir = path.join(__dirname, '..', 'fixtures'),
    loggedOutFile = path.join(fixturesDir, 'logged-out-jitsuconf')
    loggedOutConf = fs.readFileSync(loggedOutFile, 'utf8');

vows.describe('jitsu/commands/env').addBatch({
  'env list': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
      .reply(200, {
        app: { 
          name: 'application', 
          state: 'stopped', 
          env: { foo: 'bar', baz: 'buzz' },
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env list': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
      .reply(200, {
        app: { 
          name: 'application', 
          state: 'stopped', 
          env: { foo: 'bar', baz: 'buzz' },
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env list foobar': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/foobar')
      .reply(200, {
        app: { 
          name: 'application', 
          state: 'stopped', 
          env: { foo: 'bar', baz: 'buzz' },
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env list barbaz': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/barbaz')
      .reply(200, {
        app: { 
          name: 'barbaz', 
          state: 'stopped', 
          env: { ping: 'fizz', pong: 'buzz' },
          subdomain:'barbaz',
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env get foo': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
      .reply(200, {
        app: { 
          name: 'application', 
          state: 'stopped', 
          env: { foo: 'bar', baz: 'buzz' },
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env get foo': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
      .reply(200, {
        app: { 
          name: 'application', 
          state: 'stopped', 
          env: { foo: 'bar', baz: 'buzz' },
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env get barbaz ping': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/barbaz')
      .reply(200, {
        app: { 
          name: 'barbaz', 
          state: 'stopped', 
          env: { ping: 'fizz', pong: 'buzz' },
          subdomain: 'barbaz', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'env set': shouldNodejitsuOk(
    'Should exit with an error',
    function assertion (ign, err) {
      err = ign;
      assert.isTrue(!!err);
    }
  )
}).addBatch({
  'env set test truthy': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
        .reply(200, {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });    
  })
}).addBatch({
  'env set test truthy': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
        .reply(200, {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });    
  })
}).addBatch({
  'env set barbaz delete test': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/barbaz')
        .reply(200, {
          app: { 
            name: 'barbaz', 
            state: 'stopped', 
            env: { ping: 'fizz', pong: 'buzz' },
            subdomain:'barbaz', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/barbaz', { env: { ping: 'fizz', pong: 'buzz', delete: 'test' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });    
  })
}).addBatch({
  'env set delete test': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
        .reply(200, {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy', delete: 'test' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'env delete delete': shouldNodejitsuOk(function setup () {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
        .reply(200, {
          app: { 
            name: 'application',
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz', test: 'truthy', delete: 'test' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'env delete delete': shouldNodejitsuOk('should prompt for credentials', function setup () {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';


    nock('https://api.mockjitsu.com')
      .get('/apps/tester/jitsu')
        .reply(200, {
          app: { 
            name: 'application',
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz', test: 'truthy', delete: 'test' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'env delete barbaz delete': shouldNodejitsuOk(function setup () {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/barbaz')
        .reply(200, {
          app: { 
            name: 'barbaz',
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz', test: 'truthy', delete: 'test' },
            subdomain:'barbaz', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/barbaz', { env: { foo: 'bar', baz: 'buzz', test: 'truthy' } })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'env clear': shouldNodejitsuOk('The current app should have an empty env',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/jitsu')
          .reply(200, {
              app: { 
                name: 'application',
                state: 'stopped', 
                env: { foo: 'bar', baz: 'buzz', test: 'truthy', delete: 'test' },
                subdomain:'application', 
                scripts: { start: './server.js' }, 
                snapshots: [{ filename: 'FILENAME' }] 
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/application', { env: {} })
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  'env clear barbaz': shouldNodejitsuOk('The specified app should have an empty env',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/barbaz')
          .reply(200, {
              app: {
                name: 'barbaz',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'barbaz', 
                scripts: { start: './server.js' }, 
                snapshots: [{ filename: 'FILENAME' }] 
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/barbaz', { env: {} })
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  'env save': shouldNodejitsuOk('The current app should save enviroment variables',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/jitsu')
          .reply(200, {
              app: {
                name: 'application',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'application',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' });
    },
    function assertion (err) {
      assert.ok(!err && fs.existsSync('env.json'));
    })
}).addBatch({
  'env save barbaz': shouldNodejitsuOk('The specified app should save enviroment variables',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/barbaz')
          .reply(200, {
              app: {
                name: 'barbaz',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'barbaz',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' });
    },
    function assertion (err) {
      assert.ok(!err && fs.existsSync('env.json'));
    }
  )
}).addBatch({
  'env save env_vars.json': shouldNodejitsuOk('The current app should save enviroment variables to the specified filename',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/env_vars.json')
          .reply(400, {
              result: {
                error: 'not_found'
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/jitsu')
          .reply(200, {
              app: {
                name: 'application',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'application',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' });
    },
    function assertion (err) {
      assert.ok(!err && fs.existsSync('env_vars.json'));
    }
  )
}).addBatch({
  'env save barbaz env_vars.json': shouldNodejitsuOk('The specified app should save enviroment variables to the specified filename',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/barbaz')
          .reply(200, {
              app: {
                name: 'barbaz',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'barbaz',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' });
    },
    function assertion (err) {
      assert.ok(!err && fs.existsSync('env_vars.json'));
    }
  )
}).addBatch({
  'env load': shouldNodejitsuOk('The current app should load enviroment variables from env.json',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      fs.writeFileSync('env.json', JSON.stringify({ foo: 'bar', baz: 'buzz', test: 'truthy1' }, null, 2), 'utf8');
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/jitsu')
          .reply(200, {
              app: {
                name: 'application',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'application',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy1' }  })
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  'env load barbaz': shouldNodejitsuOk('The specified app should load enviroment variables from env.json',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      fs.writeFileSync('env.json', JSON.stringify({ foo: 'bar', baz: 'buzz', test: 'truthy1' }, null, 2), 'utf8');
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/barbaz')
          .reply(200, {
              app: {
                name: 'barbaz',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
                subdomain:'barbaz',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/barbaz', { env: { foo: 'bar', baz: 'buzz', test: 'truthy1' }  })
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  'env load env_vars.json': shouldNodejitsuOk('The current app should load enviroment variables from the specified file',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      fs.writeFileSync('env_vars.json', JSON.stringify({ foo: 'bar', baz: 'buzz', test: 'truthy2' }, null, 2), 'utf8');
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/env_vars.json')
          .reply(400, {
              result: {
                error: 'not_found'
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/jitsu')
          .reply(200, {
              app: {
                name: 'application',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy1' },
                subdomain:'application',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/application', { env: { foo: 'bar', baz: 'buzz', test: 'truthy2' } })
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  'env load barbaz env_vars.json': shouldNodejitsuOk('The specified app should load enviroment variables from the specified file',
    function setup() {
      jitsu.prompt.override.confirm = 'yes';
      fs.writeFileSync('env_vars.json', JSON.stringify({ foo: 'bar', baz: 'buzz', test: 'truthy2' }, null, 2), 'utf8');
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/barbaz')
          .reply(200, {
              app: {
                name: 'barbaz',
                state: 'stopped',
                env: { foo: 'bar', baz: 'buzz', test: 'truthy1' },
                subdomain:'barbaz',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/barbaz', { env: { foo: 'bar', baz: 'buzz', test: 'truthy2' }  })
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  "Remove": {
    topic: function () {
      async.forEach(
        ['env.json', 'env_vars.json'],
        fs.unlink,
        this.callback
      );
    },
    "test envvar .json files": function (err, _) {
      assert.isNull(err);
    }
  }
}).export(module);
