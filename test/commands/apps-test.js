/*
 * apps-test.js: Tests for `jitsu apps *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    nock = require('nock'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk,
    useAppFixture = macros.useAppFixture;

var mainDirectory = process.cwd();

var cloud = [{ drones: 0, provider: 'jitsu', datacenter: 'foobar' }],
    endpoints = {
      "endpoints": {
        "jitsu": {
          "foobar": "api.mockjitsu.com"
        }
      }
    };

var fixturesDir = path.join(__dirname, '..', 'fixtures'),
    loggedOutFile = path.join(fixturesDir, 'logged-out-jitsuconf')
    loggedOutConf = fs.readFileSync(loggedOutFile, 'utf8');  

vows.describe('jitsu/commands/apps').addBatch({
  'apps list': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester')
      .reply(200, {
        apps:[{
          name: 'application',
          state: 'stopped',
          subdomain:'application',
          scripts: { start: './server.js' },
          snapshots: [{ filename: 'FILENAME' }]
        }]
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps list': shouldNodejitsuOk(
    'should prompt for credentials',
    function setup() {
      jitsu.config.stores.file.file = loggedOutFile;
      jitsu.config.stores.file.loadSync();

      jitsu.prompt.override.username = 'tester';
      jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

      nock('https://api.mockjitsu.com')
        .get('/apps/tester')
        .reply(200, {
          apps:[{
            name: 'application',
            state: 'stopped',
            subdomain:'application',
            scripts: { start: './server.js' },
            snapshots: [{ filename: 'FILENAME' }]
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
    },
    function (err) {
      assert.isTrue(!err);
      fs.writeFileSync(loggedOutFile, loggedOutConf, 'utf8');
    }
  )
}).addBatch({
  'apps view application2': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application2')
      .reply(200, {
        app: {
          _id: 'tester/application2',
          name: 'application2',
          state: 'stopped',
          subdomain:'application2',
          scripts: { start: './server.js' },
          snapshots: [{
            id: '0.0.0',
            filename: 'FILENAME',
            ctime: 1234567898765,
          }]
        }
      }, { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
      .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2/cloud')
      .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps view application2': shouldNodejitsuOk(
    'should prompt for credentials',
    function setup() {
      jitsu.config.stores.file.file = loggedOutFile;
      jitsu.config.stores.file.loadSync();

      jitsu.prompt.override.username = 'tester';
      jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

      nock('https://api.mockjitsu.com')
        .get('/apps/tester/application2')
        .reply(200, {
          app: {
            _id: 'tester/application2',
            name: 'application2',
            state: 'stopped',
            subdomain:'application2',
            scripts: { start: './server.js' },
            snapshots: [{
              id: '0.0.0',
              filename: 'FILENAME',
              ctime: 1234567898765,
            }]
          }
        }, { 'x-powered-by': 'Nodejitsu' })
    },
    function (err) {
      assert.isTrue(!err);
      fs.writeFileSync(loggedOutFile, loggedOutConf, 'utf8');
    }
  )
}).addBatch({
  'apps start application3': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .post('/apps/tester/application3/start', {})
        .reply(200, {}, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3')
        .reply(200, {
          app: {
            state: 'started',
            subdomain: 'application3'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps start application3': shouldNodejitsuOk(
    'should prompt for credentials',
    function setup() {
      jitsu.config.stores.file.file = loggedOutFile;
      jitsu.config.stores.file.loadSync();

      jitsu.prompt.override.username = 'tester';
      jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

      nock('https://api.mockjitsu.com')
        .post('/apps/tester/application3/start', {})
          .reply(200, {}, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/application3')
          .reply(200, {
            app: {
              state: 'started',
              subdomain: 'application3'
            }
          }, { 'x-powered-by': 'Nodejitsu' })
        .get('/endpoints')
          .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/application3/cloud')
          .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
    },
    function (err) {
      assert.isTrue(!err);
      fs.writeFileSync(loggedOutFile, loggedOutConf, 'utf8');
    }
  )
}).addBatch({
  'apps stop application3': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .post('/apps/tester/application3/stop', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3')
        .reply(200, {
          app: { state: 'stopped' }
        }, { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps stop application3': shouldNodejitsuOk(
    'should prompt for credentials',
    function setup() {
      jitsu.config.stores.file.file = loggedOutFile;
      jitsu.config.stores.file.loadSync();

      jitsu.prompt.override.username = 'tester';
      jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

      nock('https://api.mockjitsu.com')
        .post('/apps/tester/application3/stop', {})
          .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/application3')
        .reply(200, {
            app: { state: 'stopped' }
        }, { 'x-powered-by': 'Nodejitsu' })
        .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/application3/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
    },
    function (err) {
      assert.isTrue(!err);
      fs.writeFileSync(loggedOutFile, loggedOutConf, 'utf8');
    }
  )
}).addBatch({
  'apps view': shouldNodejitsuOk(function setup() {
    useAppFixture();

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
      .reply(200, {
        app: {
          _id: 'tester/example-app',
          name: 'application',
          state: 'stopped',
          subdomain: 'application',
          scripts: { start: './server.js' },
          snapshots: [{
            id: '0.0.0-1',
            filename: 'FILENAME',
            ctime: 1234567898765,
          }]
        }
      }, { 'x-powered-by': 'Nodejitsu' })

  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'apps start': shouldNodejitsuOk(function setup() {
    useAppFixture();

    nock('https://api.mockjitsu.com')
      .post('/apps/tester/example-app/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            state: 'started',
            subdomain: 'example-app'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'apps stop': shouldNodejitsuOk(function setup() {
    useAppFixture();

    nock('https://api.mockjitsu.com')
      .post('/apps/tester/example-app/stop', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })

  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'apps deploy': shouldNodejitsuOk(function setup() {

    // Test for trying to use a taken subdomain
    useAppFixture({
      "name": "example-app",
      "subdomain": "taken",
      "scripts": {
        "start": "server.js"
      },
      "version": "0.0.0",
      "engines": {
        "node": "0.6.x"
      }
    });

    jitsu.prompt.override.confirm = 'yes';
    jitsu.prompt.override.subdomain = 'example-app';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
        .reply(500, {
          error: 'not_found',
          reason: 'missing'
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app/available', {
        name: 'example-app',
        subdomain: 'taken',
        scripts: {
          start: 'server.js'
        },
        version: '0.0.0',
        engines: {
          node: '0.6.x'
        },
        analyzed: true,
        state: 'stopped'
      })
        .reply(200, {
          available: false,
          subdomain: false,
          appname: true
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app/available', {
        name: 'example-app',
        scripts: {
          start: 'server.js'
        },
        version: '0.0.0',
        engines: {
          node: '0.6.x'
        },
        analyzed: true,
        state: 'stopped',
        subdomain: 'example-app'
      })
        .reply(200, {
          available: true,
        }, { 'x-powered-by': 'Nodejitsu' })
      .put('/apps/tester/example-app', {
          name: 'example-app',
          scripts: {
            start: 'server.js'
          },
          version: '0.0.0',
          engines: { node: '0.6.x' },
          analyzed: true,
          state: 'stopped',
          subdomain: 'example-app'
        })
        .reply(200, {
          app: { state: 'stopped' }
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app', {
        name: 'example-app',
        scripts: {
          start: 'server.js'
        },
        version: '0.0.0',
        engines: { node: '0.6.x' },
        analyzed: true,
        state: 'stopped',
        subdomain: 'example-app'
      })
        .reply(201, "", { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })

    nock('https://api.mockjitsu.com')
      .filteringRequestBody(function (route) {
        return '*';
      })
      .post('/apps/tester/example-app/snapshots/0.0.0', '*')
        .reply(200, {
          app: { state: 'stopped' }
        }, { 'x-powered-by': 'Nodejitsu' });

    nock('https://api.mockjitsu.com')
      .post('/apps/tester/example-app/snapshots/0.0.0/activate', {})
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app/stop', {})
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app/start', {})
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          }
        }, { 'x-powered-by': 'Nodejitsu' });

  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'apps deploy': shouldNodejitsuOk(
    'should display an error on broken package.json',
    function setup() {
      //
      // Simulate a broken package.json
      //
      useAppFixture('{ "name": "example-app", "subdomain": "example-app", }');
    }, function assertion (err, _) {
      process.chdir(mainDirectory);
      assert.ok(!!err);
    }
  )
}).addBatch({
  'apps deploy': shouldNodejitsuOk(
    'should prompt for credentials',
    function setup() {
      useAppFixture();

      jitsu.config.stores.file.file = loggedOutFile;
      jitsu.config.stores.file.loadSync();

      jitsu.prompt.override.username = 'tester';
      jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

      jitsu.prompt.override.confirm = 'yes';

      nock('https://api.mockjitsu.com')
        .filteringRequestBody(function (route) {
          return '*';
        })
        .post('/apps/tester/example-app/snapshots/0.0.0-2', '*')
          .reply(200, {
            app: { state: 'stopped' }
          }, { 'x-powered-by': 'Nodejitsu' })

      // Test access denied behavior.
      nock('https://api.mockjitsu.com')
        .post('/apps/tester/example-app/available', {
          name: 'example-app',
          subdomain: 'example-app',
          scripts: {
            start: 'server.js'
          },
          version: '0.0.0-1',
          engines: {
            node: '0.6.x'
          }
        })
          .reply(200, {
            available: true,
          }, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/example-app')
          .reply(403, {
            error: "Authorization failed with the provided credentials."
          }, { 'x-powered-by': 'Nodejitsu' })
        .get('/auth')
          .reply(200, {
            user: 'tester',
            authorized: true,
            role: 'user'
          }, { 'x-powered-by': 'Nodejitsu 0.6.14' })
        .put('/users/tester/tokens/jitsu', {})
          .reply(201, {"operation":"insert"}, { 'x-powered-by': 'Nodejitsu' })
        .post('/apps/tester/example-app/available', {
          name: 'example-app',
          subdomain: 'example-app',
          scripts: {
            start: 'server.js'
          },
          version: '0.0.0-1',
          engines: {
            node: '0.6.x'
          }
        })
          .reply(200, {
            available: true,
          }, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/example-app')
          .reply(200, {
            app: {
              name: 'example-app',
              state: 'stopped',
              subdomain:'example-app',
              scripts: { start: './server.js' },
              snapshots: [{ filename: 'FILENAME' }]
            }
          }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/example-app', {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: {
              start: 'server.js'
            },
            version: '0.0.0-1',
            engines: {
              node: '0.6.x'
            }
          })
            .reply(200, {
              available: true,
            }, { 'x-powered-by': 'Nodejitsu' })
          .get('/apps/tester/example-app')
            .reply(403, {
              error: "Authorization failed with the provided credentials."
            }, { 'x-powered-by': 'Nodejitsu' })
          .get('/auth')
            .reply(200, {
              user: 'tester',
              authorized: true,
              role: 'user'
            }, { 'x-powered-by': 'Nodejitsu 0.6.14' })
          .post('/apps/tester/example-app/available', {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: {
              start: 'server.js'
            },
            version: '0.0.0-1',
            engines: {
              node: '0.6.x'
            }
          })
            .reply(200, {
              available: true,
            }, { 'x-powered-by': 'Nodejitsu' })
          .get('/apps/tester/example-app')
            .reply(200, {
              app: {
                name: 'example-app',
                state: 'stopped',
                subdomain:'example-app',
                scripts: { start: './server.js' },
                snapshots: [{ filename: 'FILENAME' }]
              }
            }, { 'x-powered-by': 'Nodejitsu' })
          .put('/apps/tester/example-app', {
              name: 'example-app',
              subdomain: 'example-app',
              scripts: {
                start: 'server.js'
              },
              version: '0.0.0-2',
              engines: { node: '0.6.x' }
            })
            .reply(200, {
              app: { state: 'stopped' }
            }, { 'x-powered-by': 'Nodejitsu' })
          .post('/apps/tester/example-app/snapshots/0.0.0-2/activate', {})
            .reply(200, {
              app: {
                name: 'example-app',
                subdomain: 'example-app',
                scripts: { start: 'server.js' },
                version: '0.0.0-2'
              }
            }, { 'x-powered-by': 'Nodejitsu' })
          .post('/apps/tester/example-app/stop', {})
            .reply(200, {
              app: {
                name: 'example-app',
                subdomain: 'example-app',
                scripts: { start: 'server.js' },
                version: '0.0.0-2'
              }
            }, { 'x-powered-by': 'Nodejitsu' })
          .post('/apps/tester/example-app/start', {})
            .reply(200, {
              app: {
                name: 'example-app',
                subdomain: 'example-app',
                scripts: { start: 'server.js' },
                version: '0.0.0-2'
              }
            }, { 'x-powered-by': 'Nodejitsu' })
          .get('/apps/tester/example-app')
            .reply(200, {
              app: {
                name: 'example-app',
                subdomain: 'example-app',
                scripts: { start: 'server.js' },
                version: '0.0.0-1'
              }
            }, { 'x-powered-by': 'Nodejitsu' })
          .get('/endpoints')
            .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
          .get('/apps/tester/example-app/cloud')
            .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' });
    },
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.isNull(err);
      fs.writeFileSync(loggedOutFile, loggedOutConf, 'utf8');
    }    
  )
}).export(module);