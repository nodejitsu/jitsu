/*
 * apps.js: Tests for `jitsu apps *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
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
vows.describe('jitsu/commands/env').addBatch({
  'This test requires jitsu be unauthorized': function () {
    jitsu.skipAuth = false;
    assert.isFalse(jitsu.skipAuth);
  }
}).addBatch({
  'env list': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/auth')
      .get('/apps/mickey/jitsu')
      .respond({
        body: {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      }))
})
.addBatch({
  'env list foobar': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/foobar')
      .respond({
        body: {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      }))
}).addBatch({
  'env get foo': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/jitsu')
      .respond({
        body: {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      }))
}).addBatch({
  'env set test truthy': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/jitsu')
      .respond({
        body: {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      })
      .put('/apps/mickey/application'))
}).addBatch({
  'env set delete test': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/jitsu')
      .respond({
        body: {
          app: { 
            name: 'application', 
            state: 'stopped', 
            env: { foo: 'bar', baz: 'buzz', test: 'truthy' },
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      })
      .put('/apps/mickey/application'))
}).export(module);
