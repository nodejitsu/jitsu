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

vows.describe('jitsu/commands/apps').addBatch({
  'apps list': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
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
  'apps view application2': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
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
  })
}).addBatch({
  'apps start application3': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .post('/apps/tester/application3/start', {})
        .reply(200, {}, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3')
        .reply(200, {
          app: {
            state: 'started',
            subdomain: 'application3'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps stop application3': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .post('/apps/tester/application3/stop', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3')
      .reply(200, {
          app: { state: 'stopped' }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
})
.addBatch({
  'apps view': shouldNodejitsuOk(function setup() {

    useAppFixture();

    nock('http://api.mockjitsu.com')
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

    nock('http://api.mockjitsu.com')
      .post('/apps/tester/example-app/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            state: 'started',
            subdomain: 'example-app'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'apps stop': shouldNodejitsuOk(function setup() {

    useAppFixture();

    nock('http://api.mockjitsu.com')
      .post('/apps/tester/example-app/stop', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app')
      .reply(200, {
          app: { state: 'stopped' }
      }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'apps deploy': shouldNodejitsuOk(function setup() {

    useAppFixture();

    jitsu.prompt.override.answer = 'yes';

    nock('http://api.mockjitsu.com')
      .filteringRequestBody(function (route) {
        return '*';
      })
      .post('/apps/tester/example-app/snapshots/0.0.0-2', '*')
        .reply(200, {
          app: { state: 'stopped' }
        }, { 'x-powered-by': 'Nodejitsu' })

    nock('http://api.mockjitsu.com')
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
          engines: { node: 'v0.6.x' }
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
            version: '0.0.0'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/example-app')
        .reply(200, {
          app: {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0-2'
          }
        }, { 'x-powered-by': 'Nodejitsu' });

  }, function assertion (err) {
    process.chdir(mainDirectory);
    console.error(err);
    assert.ok(!err);
  })
}).export(module);
