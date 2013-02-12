/*
 * databases-test.js: Tests for `jitsu databases *` command(s).
 *
 * (C) 2011, Nodejitsu Inc.
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

var fixturesDir = path.join(__dirname, '..', 'fixtures'),
    loggedOutFile = path.join(fixturesDir, 'logged-out-jitsuconf')
    loggedOutConf = fs.readFileSync(loggedOutFile, 'utf8');

vows.describe('jitsu/commands/databases').addBatch({
  'databases list': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/databases/tester')
      .reply(200, {
        databases: [{
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
        }]
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases list': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/databases/tester')
      .reply(200, {
        databases: [{
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
        }]
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases get test': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .get('/databases/tester/test')
      .reply(200, {
        database: {
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
        }
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases get test': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .get('/databases/tester/test')
      .reply(200, {
        database: {
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
        }
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases create couch test2': shouldNodejitsuOk(function setup() {
    nock('https://api.mockjitsu.com')
      .post('/databases/tester/test2', { type: 'couch' })
        .reply(200, { database: {} }, { 'x-powered-by': 'Nodejitsu' })
      .get('/databases/tester/test2')
        .reply(200, {
          database: {
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
          }
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases create': shouldNodejitsuOk(function setup() {

    jitsu.prompt.override['database name'] = 'test3';
    jitsu.prompt.override['database type'] = 'mongo';

    nock('https://api.mockjitsu.com')
      .post('/databases/tester/test3', { type: 'mongo' })
        .reply(200, { database: {} }, { 'x-powered-by': 'Nodejitsu' })
      .get('/databases/tester/test3')
        .reply(200, {
          database: {
            name: "test3",
            type: "mongo",
            user: "tester",
            metadata: {
              id: 63562,
              port: 10039,
              host: 'this.is.only.a.test.mongohq.com',
              uri: 'mongo://nodejitsu:pass@this.is.only.a.test.mongohq.com:10039',
              username: 'nodejitsu',
              password: 'pass',
              dbname: '/path'
            },
            id: "tester-test3",
            resource: "Database"
          }
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases create couch test4': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('https://api.mockjitsu.com')
      .post('/databases/tester/test4', { type: 'couch' })
        .reply(200, { database: {} }, { 'x-powered-by': 'Nodejitsu' })
      .get('/databases/tester/test4')
        .reply(200, {
          database: {
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
          }
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases destroy test3': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.destroy = 'yes';
    
    nock('https://api.mockjitsu.com')
      .delete('/databases/tester/test3', {})
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'databases destroy test4': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.destroy = 'yes';
    
    nock('https://api.mockjitsu.com')
      .delete('/databases/tester/test4', {})
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).export(module);
