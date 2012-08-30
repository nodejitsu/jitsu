/*
 * bad-test.js: Tests for intentionally broken command(s).
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

vows.describe('jitsu/commands/malformed').addBatch({
  'app list': shouldNodejitsuOk('should exit gracefully')
}).addBatch({
  'apps derploy': shouldNodejitsuOk('should exit gracefully')
}).addBatch({
  'env lost': shouldNodejitsuOk('should exit gracefully')
}).addBatch({
  'install socketio': shouldNodejitsuOk('should exit with an error',
  function setup() {
    useAppFixture();

    jitsu.prompt.override.confirm = 'yes';
  }, function assertion (err, ignore) {

    process.chdir(mainDirectory);
    assert.ok(err);
  })
}).export(module);
