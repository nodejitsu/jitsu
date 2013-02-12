/*
 * snapshots-test.js: Tests for `jitsu snapshots *` command(s).
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
    
var cloud = [{ drones: 0, provider: 'jitsu', datacenter: 'foobar' }],
    endpoints = {
      "endpoints": {
        "jitsu": {
          "foobar": "api.mockjitsu.com"
        }
      }
    };    

// Snapshots tests with specified app names
vows.describe('jitsu/commands/snapshots').addBatch({
  'snapshots list application': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application/snapshots')
      .reply(200, {
        snapshots: [{
          id: '0.0.0', 
          ctime: new Date(), 
          md5: 'q34rq43r5t5g4w56t45t'
        }] 
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots list application': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application/snapshots')
      .reply(200, {
        snapshots: [{
          id: '0.0.0', 
          ctime: new Date(), 
          md5: 'q34rq43r5t5g4w56t45t'
        }] 
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots list application2': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application2/snapshots')
      .reply(200, {
        snapshots: [{
          id: '0.0.0', 
          ctime: new Date(), 
          md5: 'q34rq43r5t5g4w56t45t'
        }] 
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots activate application2': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.snapshot = '0.0.0-1';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application2/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2', '')
        .reply(200, { app: {
          subdomain: "tester.application2"
        }
      }, { 'x-powered-by': 'Nodejitsu' });

  })
}).addBatch({
  'snapshots activate application2': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.snapshot = '0.0.0-1';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application2/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2', '')
        .reply(200, { app: {
          subdomain: "tester.application2"
        }
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots activate application2': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.snapshot = '0.0.0-1';

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application2/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application2', '')
        .reply(200, { app: {
          subdomain: "tester.application2"
        }
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots destroy application3': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.snapshot = '0.0.0-1';
    jitsu.prompt.override.destroy = 'yes';
    
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application3/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .delete('/apps/tester/application3/snapshots/0.0.0-1', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots destroy application3': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.snapshot = '0.0.0-1';
    jitsu.prompt.override.destroy = 'yes';
    
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/application3/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .delete('/apps/tester/application3/snapshots/0.0.0-1', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  // This tests jitsu's ability to infer the app name.
  'snapshots list': shouldNodejitsuOk(function setup() {

    useAppFixture();

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app/snapshots')
      .reply(200, {
        snapshots: [{
          id: '0.0.0', 
          ctime: new Date(), 
          md5: 'q34rq43r5t5g4w56t45t'
        }] 
      }, { 'x-powered-by': 'Nodejitsu' });
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'snapshots activate': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.snapshot = '0.0.0-1';

    useAppFixture();

    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/endpoints')
        .reply(200, endpoints, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app/cloud')
        .reply(200, cloud, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/example-app/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app', '')
        .reply(200, { app: {
          subdomain: "tester.example-app"
        }
      }, { 'x-powered-by': 'Nodejitsu' });

  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'snapshots destroy': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.snapshot = '0.0.0-1';
    jitsu.prompt.override.destroy = 'yes';

    useAppFixture();
    
    nock('https://api.mockjitsu.com')
      .get('/apps/tester/example-app/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .delete('/apps/tester/example-app/snapshots/0.0.0-1', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).export(module);