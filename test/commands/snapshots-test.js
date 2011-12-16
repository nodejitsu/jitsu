/*
 * snapshots.js: Tests for `jitsu snapshots *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    vows = require('vows'),
    mockRequest = require('mock-request'),
    jitsu = require('../../lib/jitsu'),
    helper = require('../helpers/mock-helpers');

var mockPrompt = helper.mockPrompt,
    mockPrompt2 = helper.mockPrompt2,
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/commans/snapshots').addBatch({
  'This test requires jitsu be unauthorized': function () {
    jitsu.skipAuth = false;
    assert.isFalse(jitsu.skipAuth);
  }
}).addBatch({
  'snapshots list application': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/auth')
      .get('/apps/mickey/application/snapshots')
      .respond({
        body: {
          snapshots: [{
            id: '0.0.0', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }] 
        }
      })
    )
}).addBatch({
  'snapshots list application2': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/application2/snapshots')
      .respond({
        body: {
          snapshots: [{
            id: '0.0.0', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }] 
        }
      })
    )
}).addBatch({
  'snapshots activate application2': runJitsuCommand(
    mockPrompt({'snapshot': '0.0.0-1'}),
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/application2/snapshots')
      .respond({
        body: {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }
      })
      .post('/apps/mickey/application2/snapshots/0.0.0-1/activate')
    )
}).addBatch({
  'snapshots destroy application3': runJitsuCommand([
      mockPrompt2({answer: 'yes'}),
      mockPrompt({'snapshot': '0.0.0-1'})
    ], mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/application3/snapshots')
      .respond({
        body: {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }
      })
      .del('/apps/mickey/application3/snapshots/0.0.0-1')
    )
}).export(module);
