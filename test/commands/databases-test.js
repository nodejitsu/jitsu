/*
 * databases-test.js: Tests for `jitsu databases *` command(s).
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */

var nock = require('nock'),
    vows = require('vows'),
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
        user: "mickey",
        metadata: {
          ok: true,
          id: "Server/nodejitsudb951231780457",
          created: true
        },
        id: "mickey-test",
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
        user: "mickey",
        metadata: {
          ok: true,
          id: "Server/nodejitsudb951231780457",
          created: true
        },
        id: "mickey-test",
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
          user: "mickey",
          metadata: {
            ok: true,
            id: "Server/nodejitsudb951231780457",
            created: true
          },
          id: "mickey-test2",
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
}).export(module);
