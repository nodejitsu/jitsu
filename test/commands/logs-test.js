/*
 * logs-test.js: Tests for `jitsu logs *` commands.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var nock = require('nock'),
    assert = require('assert'),
    vows = require('vows'),
    path = require('path'),
    fs = require('fs'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk,
    useAppFixture = macros.useAppFixture;

var mainDirectory = process.cwd();


var fixturesDir = path.join(__dirname, '..', 'fixtures'),
    loggedOutFile = path.join(fixturesDir, 'logged-out-jitsuconf')
    loggedOutConf = fs.readFileSync(loggedOutFile, 'utf8');

var exampleApp = { app: { _id: 'tester/example-app', config: { cloud: [] } } },
    application = { app: { _id: 'tester/application', config: { cloud: [] } } };

// Snapshots tests with specified app names
vows.describe('jitsu/commands/logs').addBatch({
  'logs': shouldNodejitsuOk(function setup() {

    useAppFixture();

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
        .reply(200, exampleApp, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/example-app')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs': shouldNodejitsuOk('should prompt for credentials', function setup() {

    useAppFixture();

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
        .reply(200, exampleApp, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/example-app')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app': shouldNodejitsuOk(function setup() {

    useAppFixture();

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
        .reply(200, exampleApp, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/example-app')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app': shouldNodejitsuOk('should prompt for credentials', function setup() {

    useAppFixture();

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app')
        .reply(200, exampleApp, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/example-app')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/example-app' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app application': shouldNodejitsuOk(function setup() {

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application')
        .reply(200, application, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/application')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app application': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application')
        .reply(200, application, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/application')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/teste/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
 }).addBatch({
  'logs app application 10': shouldNodejitsuOk(function setup() {

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application')
        .reply(200, application, { 'x-powered-by': 'Nodejitsu' })
      .get('/logs/tester/application/10')
        .reply(200, [
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          },
          {
            metric: 1,
            time: 1375831673,
            host: '10.0.0.1',
            description: 'This is a log message\n',
            service: 'logs/stdout',
            meta: { peers: 1, key: 'logs/tester/application' }
          }
        ], { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).export(module);
