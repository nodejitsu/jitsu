/*
 * databases-test.js: Tests for `jitsu databases *` command(s).
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var nock = require('nock'),
    vows = require('vows'),
    assert = require('assert'),
    path = require('path'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

vows.describe('jitsu/commands/databases').addBatch({
  'databases list': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/databases/tester')
      .reply(200, [{
        name: "test",
        type: "couch",
        user: "tester",
        metadata: {
          ok: true,
          id: "Server/nodejitsudb951231780457",
          created: true
        },
        id: "tester-test",
        resource: "Database"
      }], { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases list': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
      .get('/databases/tester')
      .reply(200, [{
        name: "test",
        type: "couch",
        user: "tester",
        metadata: {
          ok: true,
          id: "Server/nodejitsudb951231780457",
          created: true
        },
        id: "tester-test",
        resource: "Database"
      }], { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases get test': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/databases/tester/test')
      .reply(200, {
        name: "test",
        type: "couch",
        user: "tester",
        metadata: {
          ok: true,
          id: "Server/nodejitsudb951231780457",
          created: true
        },
        id: "tester-test",
        resource: "Database"
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases get test': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
      .get('/databases/tester/test')
      .reply(200, {
        name: "test",
        type: "couch",
        user: "tester",
        metadata: {
          ok: true,
          id: "Server/nodejitsudb951231780457",
          created: true
        },
        id: "tester-test",
        resource: "Database"
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases create couch test2': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .post('/databases/tester/test2', { type: 'couch' })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/databases/tester/test2')
        .reply(200, {
          name: "test2",
          type: "couch",
          user: "tester",
          metadata: {
            ok: true,
            id: "Server/nodejitsudb951231780457",
            created: true
          },
          id: "tester-test2",
          resource: "Database"
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases create': shouldNodejitsuOk(function setup() {

    jitsu.prompt.override['database name'] = 'test3';
    jitsu.prompt.override['database type'] = 'mongo';

    nock('http://api.mockjitsu.com')
      .post('/databases/tester/test3', { type: 'mongo' })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/databases/tester/test3')
        .reply(200, {
          name: "test3",
          type: "mongo",
          user: "tester",
          metadata: {
            ok: true,
            created: true,
            config: {
              MONGOHQ_URL: 'mongo://this.is.only.a.test.mongohq.com'
            }
          },
          id: "tester-test3",
          resource: "Database"
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases create couch test4': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
      .post('/databases/tester/test4', { type: 'couch' })
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/databases/tester/test4')
        .reply(200, {
          name: "test4",
          type: "couch",
          user: "tester",
          metadata: {
            ok: true,
            id: "Server/nodejitsudb951231780457",
            created: true
          },
          id: "tester-test4",
          resource: "Database"
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases destroy test3': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.destroy = 'yes';
    
    nock('http://api.mockjitsu.com')
      .delete('/databases/tester/test3', {})
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases destroy test4': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.destroy = 'yes';
    
    nock('http://api.mockjitsu.com')
      .delete('/databases/tester/test4', {})
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).export(module);
