/*
 * snapshots.js: Tests for `jitsu snapshots *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', '..', 'lib'));

var assert = require('assert'),
    jitsu = require('jitsu'),
    vows = require('vows'),
    helper = require('../helpers/mock-helpers'),
    mockRequest = require('../helpers/mock-request');

var mockPrompt = helper.mockPrompt,
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/commans/snapshots').addBatch({
  'snapshots list application': runJitsuCommand(
    mockRequest.mock(helper.requestOptions)
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
    mockRequest.mock(helper.requestOptions)
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
    mockRequest.mock(helper.requestOptions)
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
  'snapshots destroy application3': runJitsuCommand(
    mockPrompt({'snapshot': '0.0.0-1'}),
    mockRequest.mock(helper.requestOptions)
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