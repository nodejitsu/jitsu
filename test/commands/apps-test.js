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

var cloud = [{ drones: 2, provider: 'joyent', datacenter: 'us-east-1' }],
    endpoints = {
      "endpoints": {
        "joyent": {
          "us-east-1": "api.mockjitsu.com"
        }
      }
    };

var fixturesDir = path.join(__dirname, '..', 'fixtures'),
    loggedOutFile = path.join(fixturesDir, 'logged-out-jitsuconf'),
    loggedOutConf = fs.readFileSync(loggedOutFile, 'utf8');

//
// Test macro which calls `.addBatch` for every possible
// argv combination of `--ram` and `--drones`.
//
function shouldAcceptAllCloudOptions(suite, command) {
  var combinations = ['with no options',
   '--drones 2',
   '--ram 512',
   '--drones 2 --ram 512'
  ];

  if (/^deploy/.test(command)) {
    combinations.push('--provider joyent');
    combinations.push('--datacenter us-east-1');
    combinations.push('--provider joyent --datacenter us-east-1');
  }

  var setupFn  = (/^deploy/.test(command)) ? setupDeploy : setupCloud;

  combinations.forEach(function (argv) {
    var drones  = /--drones\s(\d{1})/.exec(argv),
        ram     = /--ram\s(\d{3})/.exec(argv),
        provider = /--provider\s(\w{6})/.exec(argv),
        datacenter = /--datacenter\s(\w{2}\-\w{4}\-\d{1})/.exec(argv),
        context = {},
        options;

    context[argv] = {};

    options = {
      datacenter: datacenter ? datacenter[1] : 'us-east-1',
      provider: provider ? provider[1] : 'joyent',
      drones: drones ? parseInt(drones[1], 10) : 1,
      ram:    ram    ? parseInt(ram[1], 10)    : 256
    };

    context[argv][command] = shouldNodejitsuOk(
      setupFn(options),
      'should show cloud info',
      function assertion (err, ignore) {
        process.chdir(mainDirectory);
        assert.isNull(err);
      }
    );

    suite.addBatch(context);
  });

  function setupCloud (options) {
    return function setup () {
      jitsu.argv.drones = options.drones;
      jitsu.argv.ram = options.ram;

      //
      // Accomodate for `cloud joyent us-east-1`.
      //
      if (jitsu.argv._[1] === 'joyent') {
        useAppFixture();
      }

      nock('https://api.mockjitsu.com')
        .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            name: 'example-app',
            maxDrones: options.drones,
            subdomain: 'example-app',
            config: {
              cloud: [{
                provider: 'joyent',
                datacenter: 'us-east-1',
                drones: options.drones,
                ram: 256
              }]
            }
          }
        }, { 'x-powered-by': 'Nodejitsu' })
        .get('/endpoints')
          .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
        .post('/apps/tester/example-app/cloud', [options]).reply(200, {
          datacenter: 'us-east-1',
          provider: 'joyent',
          drones: options.drones,
          ram: options.ram
        }, { 'x-powered-by': 'Nodejitsu' })
    }
  }

  function setupDeploy (options) {
    return function setup () {
      jitsu.argv.drones = options.drones;
      jitsu.argv.ram = options.ram;
      useAppFixture();

      nock('https://api.mockjitsu.com')
        .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            name: 'example-app',
            maxDrones: options.drones,
            subdomain: 'example-app',
            config: {
              cloud: [{
                provider: 'joyent',
                datacenter: 'us-east-1',
                drones: options.drones,
                ram: 256
              }]
            },
            version: '0.0.0'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
        .put('/apps/tester/example-app', {
          name: 'example-app',
          subdomain: 'example-app',
          scripts: {
            start: 'server.js'
          },
          version: '0.0.0-1',
          engines: { node: '0.6.x' },
          analyzed: true
        })
        .reply(200, {
          app: { state: 'stopped' }
        }, { 'x-powered-by': 'Nodejitsu' })

      nock('https://api.mockjitsu.com')
        .filteringRequestBody(function (route) {
          return '*';
        })
        .post('/apps/tester/example-app/snapshots/0.0.0-1', '*')
          .reply(200, {
            app: { state: 'stopped' }
          }, { 'x-powered-by': 'Nodejitsu' });

      nock('https://api.mockjitsu.com')
        .post('/apps/tester/example-app/snapshots/0.0.0-1/activate', {})
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0-1'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
        .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' });

      if (jitsu.argv._[1] === 'joyent')
        nock('https://api.mockjitsu.com')
          .post('/apps/tester/example-app/cloud', [options]).reply(200, {
            datacenter: 'us-east-1',
            provider: 'joyent',
            drones: options.drones,
            ram: options.ram
          }, { 'x-powered-by': 'Nodejitsu' });

      nock('https://api.mockjitsu.com')
        .post('/apps/tester/example-app/stop', {})
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0-1'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
        .post('/apps/tester/example-app/start', {})
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0-1'
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
        }, { 'x-powered-by': 'Nodejitsu' });
    }
  }

  return suite;
}

var suite = vows.describe('jitsu/commands/apps').addBatch({
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
})/*.addBatch({
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
          }, { 'x-powered-by': 'Nodejitsu' })
        .get('/endpoints')
          .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
        .get('/apps/tester/example-app/cloud')
          .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
    },
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.isNull(err);
      fs.writeFileSync(loggedOutFile, loggedOutConf, 'utf8');
    }
  )
})*/.addBatch({
  'cloud example-app': shouldNodejitsuOk(
    function setup() {
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            config: {
              cloud: [{
                provider: 'joyent',
                datacenter: 'us-east-1',
                drones: 2
              }]
            }
          }
        }, { 'x-powered-by': 'Nodejitsu' });
    },
    'should show cloud info',
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.isNull(err);
    }
  )
}).addBatch({
  'cloud': shouldNodejitsuOk(
    function setup() {
      useAppFixture();

      nock('https://api.mockjitsu.com')
        .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            config: {
              cloud: [{
                provider: 'joyent',
                datacenter: 'us-east-1',
                drones: 2
              }]
            }
          }
        }, { 'x-powered-by': 'Nodejitsu' });
    },
    'should show cloud info',
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.isNull(err);
    }
  )
}).addBatch({
  'cloud joyent': shouldNodejitsuOk(
    function setup() {
      useAppFixture();

      nock('https://api.mockjitsu.com')
        .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            config: {
              cloud: [{
                provider: 'joyent',
                datacenter: 'us-east-1',
                drones: 2
              }]
            }
          }
        }, { 'x-powered-by': 'Nodejitsu' });
    },
    'should show cloud info',
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.isNull(err);
    }
  )
}).addBatch({
  'cloud example-app joyent': shouldNodejitsuOk(
    function setup() {
      nock('https://api.mockjitsu.com')
        .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            name: 'example-app',
            config: {
              cloud: [{
                provider: 'joyent',
                datacenter: 'us-east-1',
                drones: 2
              }]
            }
          }
        }, { 'x-powered-by': 'Nodejitsu' });
    }
  )
}).addBatch({
  'cloud example-app unknow-provider somedc': shouldNodejitsuOk(
    function setup() {
      useAppFixture();

      nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
      .reply(200, {
        app: {
          name: 'example-app',
          maxDrones: 2,
          subdomain: 'example-app',
          config: {
            cloud: [{
              provider: 'joyent',
              datacenter: 'us-east-1',
              drones: 1
            }]
          }
        }
      }, { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app')
      .reply(200, {
        app: {
          name: 'example-app',
          maxDrones: 2,
          subdomain: 'example-app',
          config: {
            cloud: [{
              provider: 'joyent',
              datacenter: 'us-east-1',
              drones: 1
            }]
          }
        }
      }, { 'x-powered-by': 'Nodejitsu' });
    },
    'should fail',
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.ok(!!err);
    }
  )
}).addBatch({
  'cloud list': shouldNodejitsuOk(
    function setup() {
      nock('https://api.mockjitsu.com')
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' });
    },
    'should show the endpoints',
    function assertion (err, ignore) {
      process.chdir(mainDirectory);
      assert.isNull(err);
    }
  )
});

// shouldAcceptAllCloudOptions(
//   suite,
//   'cloud example-app joyent us-east-1'
// );

// shouldAcceptAllCloudOptions(
//   suite,
//   'cloud joyent us-east-1'
// );

// shouldAcceptAllCloudOptions(
//   suite,
//   'deploy'
// );

// shouldAcceptAllCloudOptions(
//   suite,
//   'deploy joyent us-east-1'
// );

suite.export(module);