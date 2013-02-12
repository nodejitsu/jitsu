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

vows.describe('jitsu/commands/tokens').addBatch({
  'tokens list': shouldNodejitsuOk(function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .get('/users/tester/tokens')
      .reply(200, {"apiTokens":{}}, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'tokens list adam': shouldNodejitsuOk( function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .get('/users/adam/tokens')
      .reply(200, {"apiTokens":{}}, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'tokens create': shouldNodejitsuOk( function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .post('/users/tester/tokens', {})
      .reply(201, {"operation":"insert"}, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'tokens create test-token': shouldNodejitsuOk(function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .put('/users/tester/tokens/test-token', {})
      .reply(201, {"operation":"insert"}, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'tokens list': shouldNodejitsuOk( function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .get('/users/tester/tokens')
      .reply(200, {"apiTokens":{"test-token":"bbe261ea-aa43-4f6d-a3cf-b971301d459b"}}, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'tokens destroy test-token': shouldNodejitsuOk(function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .delete('/users/tester/tokens/test-token', {})
      .reply(201, {"ok":true,"id":"test-token"}, { 'x-powered-by': 'Nodejitsu' });
  })
})/*.addBatch({
  'tokens create adam': shouldNodejitsuOk(function setup () {
    nock('https://api.mockjitsu.com')
      .post('/users/adam/tokens', {})
      .reply(201, {"operation":"insert"}, { 'x-powered-by': 'Nodejitsu' });
  })
})*/.addBatch({
  'tokens create adam test-token': shouldNodejitsuOk(function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .put('/users/adam/tokens/test-token', {})
      .reply(201, {"operation":"insert"}, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'tokens list adam': shouldNodejitsuOk( function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .get('/users/adam/tokens')
      .reply(200, {"apiTokens":{"test-token":"bbe261ea-aa43-4f6d-a3cf-b971301d459b"}}, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'tokens destroy adam test-token': shouldNodejitsuOk(function setup () {
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    nock('https://api.mockjitsu.com')
      .delete('/users/adam/tokens/test-token', {})
      .reply(201, {"ok":true,"id":"test-token"}, { 'x-powered-by': 'Nodejitsu' });
  })
}).export(module);
