/*
 * databases-test.js: Tests for `jitsu databases *` command(s).
 *
 * (C) 2011, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    winston = require('winston').cli(),
    mockRequest = require('mock-request'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    helper = require('../helpers/mock-helpers');

var mockPrompt2 = helper.mockPrompt2,
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/commands/databases').addBatch({
  'This test requires jitsu be unauthorized': function () {
    jitsu.skipAuth = false;
    assert.isFalse(jitsu.skipAuth);
  }
}).addBatch({
  'databases list': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/auth')
      .get('/databases/mickey')
      .respond({
        body: [{
          "name": "test",
          "type": "couch",
          "user": "mickey",
          "metadata": {
            "ok": true,
            "id": "Server/nodejitsudb951231780457",
            "created": true
          },
          "id": "mickey-test",
          "resource": "Database"
        }]
      }))
}).addBatch({
  'databases get test': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/databases/mickey/test')
      .respond({
        body: {
          "name": "test",
          "type": "couch",
          "user": "mickey",
          "metadata": {
            "ok": true,
            "id": "Server/nodejitsudb951231780457",
            "created": true
          },
          "id": "mickey-test",
          "resource": "Database"
        }
      }))
}).addBatch({
  'databases create couch test2': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .post('/databases/mickey/test2')
      .get('/databases/mickey/test2')
      .respond({
        body: {
          "name": "test2",
          "type": "couch",
          "user": "mickey",
          "metadata": {
            "ok": true,
            "id": "Server/nodejitsudb951231780457",
            "created": true
          },
          "id": "mickey-test2",
          "resource": "Database"
        }
      }))
}).addBatch({
  'databases destroy test3': runJitsuCommand(
    mockPrompt2({answer: 'yes'}),
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .del('/databases/mickey/test3')
    )
}).export(module);
