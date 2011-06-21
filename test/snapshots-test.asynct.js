/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    jitsu = require('jitsu'),
    it = require('it-is'),
    inspect = require('eyes').inspector({ stream: null })
    helper = require('./lib/mock-helpers')

var POST = 'POST', GET = 'GET'

var mockRequest = helper.mockRequest
  , mockPrompt = helper.mockPrompt
  , makeReq = helper.makeReq
  , res = helper.res
  , makeCommandTest = helper.makeCommandTest


exports ['jitsu snapshots list application'] = makeCommandTest(
    ['snapshots','list','application'],//command
    null,//no prompt
    res(makeReq(GET,'/auth')) //first test has to authorize.
    .res(makeReq(GET,'/apps/mickey/application/snapshots')),
    assert.ifError )

exports ['jitsu snapshots list application2'] = makeCommandTest(
    ['snapshots','list','application2'],//command
    null,//no prompt //an auth is requested only once.
    res(makeReq(GET,'/apps/mickey/application2/snapshots'),
        {snapshots: [ {id: 'sadf', ctime: new Date(), md5: 'q34rq43r5t5g4w56t45t'} ] }, // one snapshot
        200 ),
    assert.ifError )
/*
  list applications
  prompt user for snapshot
  activate snapshot.
*/

exports ['jitsu snapshots activate application2'] = makeCommandTest(
    ['snapshots','activate','application2'],//command
    mockPrompt({'snapshot': '0.0.0-1'}),//no prompt //an auth is requested only once.
    res(makeReq(GET,'/apps/mickey/application2/snapshots'),
        {snapshots: [ {id: '0.0.0-1', ctime: new Date(), md5: 'q34rq43r5t5g4w56t45t'} ] }, // one snapshot
        200 )
    .res(makeReq(POST,'/apps/mickey/application2/snapshots/0.0.0-1/activate')),
    assert.ifError )

/*
  list snapshots for application
  prompt user for which snapshot to delete
  make DELETE request to api.
*/

exports ['jitsu snapshots destroy application3'] = makeCommandTest(
    ['snapshots','destroy','application3'],//command
    mockPrompt({'snapshot': '0.0.0-1'}),//no prompt //an auth is requested only once.
    res(makeReq(GET,'/apps/mickey/application3/snapshots'),
        {snapshots: [ {id: '0.0.0-1', ctime: new Date(), md5: 'q34rq43r5t5g4w56t45t'} ] }, // one snapshot
        200 )
    .res(makeReq('DELETE','/apps/mickey/application3/snapshots/0.0.0-1')),
    assert.ifError )

/*
  TODO: jitsu snapshots create
*/
