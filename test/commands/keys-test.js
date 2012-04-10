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

vows.describe('jitsu/commands/keys').addBatch({
  'keys list': shouldNodejitsuOk(function setup() {
    jitsu.config.stores.file.file =
      path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
      //path.join(__dirname, '..', 'fixtures', 'dot-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';

    nock('http://api.mockjitsu.com')
      .get('/users/tester/keys')
      .reply(200, {
        'hello': { type: 'api', value: 'asdas90d8208rhkhfh92yur3932' },
        'world': { type: 'ssh', value: 'asdasd8028390328iffusrehfh439' },
        'testing': { type: 'api', value: 'asdasdasdasdasdasdasdasdas' }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'keys view test1': shouldNodejitsuOk(function setup() {
    jitsu.config.stores.file.file =
      path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.name = 'test1';

    nock('http://api.mockjitsu.com')
      .get('/users/tester/keys/test1')
      .reply(200,
        { type: 'api', name: 'test1', value: 'asdas90d8208rhkhfh92yur3932' }
      , { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'keys create test2': shouldNodejitsuOk(function setup() {
    jitsu.config.stores.file.file =
      path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.type = 'api';
    jitsu.prompt.override.name = 'test2';

    nock('http://api.mockjitsu.com')
      .post('/users/tester/keys/test2', { type: 'api', name: 'test2' })
      .reply(200,
        { type: 'api', name: 'test2', value: 'asdas90d8208rhkhfh92yur3932' }
      , { 'x-powered-by': 'Nodejitsu' })
      .get('/users/tester/keys/test2')
      .reply(200,
        { type: 'api', name: 'test2', value: 'asdas90d8208rhkhfh92yur3932' }
      , { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'keys delete test3': shouldNodejitsuOk(function setup() {
    jitsu.config.stores.file.file =
      path.join(__dirname, '..', 'fixtures', 'logged-out-jitsuconf');
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    jitsu.prompt.override.name = 'test3';

    nock('http://api.mockjitsu.com')
      .delete('/users/tester/keys/test3')
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/users/tester/keys/test3')
      .reply(500,
        { error: 'not_found', reason: 'missing' }
      , { 'x-powered-by': 'Nodejitsu' })
  })
}).export(module);
