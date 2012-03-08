/*
 * env-test.js: Tests for `jitsu env *` command(s).
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

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

vows.describe('jitsu/commands/env').addBatch({
  'env list': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
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

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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
  'env set test truthy': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
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

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';


    nock('http://api.mockjitsu.com')
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
    nock('http://api.mockjitsu.com')
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
      jitsu.prompt.override['yesno'] = 'yes';
      nock('http://api.mockjitsu.com')
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
      jitsu.prompt.override['yesno'] = 'yes';
      nock('http://api.mockjitsu.com')
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
}).export(module);
