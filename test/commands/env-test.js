/*
 * env.js: Tests for `jitsu env *` command(s).
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
}).export(module);
