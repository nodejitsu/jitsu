/*
 * users.js: Tests for `jitsu users *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', '..', 'lib'));

var assert = require('assert'),
    jitsu = require('jitsu'),
    vows = require('vows'),
    helper = require('../helpers/mock-helpers'),
    mockRequest = require('mock-request');

var mockPrompt = helper.mockPrompt,
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/commands/users').addBatch({
  'users create elvis': runJitsuCommand(
    mockPrompt({email: 'e@mailinator.com', password: '12345'}),
    mockRequest.mock(helper.requestOptions)
      .post('/users/elvis', {
        email: 'e@mailinator.com',
        password: '12345',
        username: 'elvis'
      }))
}).addBatch({
  'users create elvis': runJitsuCommand(
    'should respond with a 400 error',
    function assertion (ign, err) {
      err = ign;
      assert.equal(err.statusCode, '400');
    },
    mockPrompt({email: 'e@mailinator.com', password: '12345'}),
    mockRequest.mock(helper.requestOptions)
      .post('/users/elvis', {
        email: 'e@mailinator.com',
        password: '12345',
        username: 'elvis'
      })
      .respond({
        statusCode: 400
      }))
}).addBatch({
  'users create elvis': runJitsuCommand(
    'should respond with a 403 error',
    function assertion (ign, err) {
      err = ign;
      assert.equal(err.statusCode, '403');
    },
    mockPrompt({ email: 'e@mailinator.com', password: '12345' }),
    mockRequest.mock(helper.requestOptions)
      .post('/users/elvis', {
        email: 'e@mailinator.com',
        password: '12345',
        username: 'elvis'        
      })
      .respond({
        statusCode: 403
      }))
}).addBatch({
  'users create elvis': runJitsuCommand(
    'should respond with a 500 error',
    function assertion (ign, err) {
      err = ign;
      assert.equal(err.statusCode, '500');
    },
    mockPrompt({ email: 'e@mailinator.com', password: '12345' }),
    mockRequest.mock(helper.requestOptions)
      .post('/users/elvis', {
        email: 'e@mailinator.com',
        password: '12345',
        username: 'elvis'        
      })
      .respond({
        statusCode: 500
      }))
}).addBatch({
  'users create jimmy': runJitsuCommand(
    mockPrompt({ email: 'j@mailinator.com', password: '98765' }),
    mockRequest.mock(helper.requestOptions)
      .post('/users/jimmy', { 
        email: "j@mailinator.com",
        password: "98765",
        username: "jimmy"
      }))
}).addBatch({
  'users available jimmy': runJitsuCommand(
    mockRequest.mock(helper.requestOptions)
      .get('/users/jimmy/available')
      .respond({
        body: { available: true }
      }))
}).addBatch({
  'users confirm jimmy': runJitsuCommand(
    mockPrompt({'Invite code': 'f4387f4'}),
    mockRequest.mock(helper.requestOptions)
      .post('/users/jimmy/confirm')
      .respond({
        body: {
          username: 'jimmy',
          inviteCode: 'f4387f4'
        }
      }))
}).addBatch({
  'users confirm jimmy': runJitsuCommand(
    mockPrompt({ 'Invite code': 'f4387f4' }),
    mockRequest.mock(helper.requestOptions)
      .post('/users/jimmy/confirm')
      .respond({
        body: {
          error: 'username jimmy is taken'
        }
      })
    )
}).addBatch({
  'users forgot jimmy': runJitsuCommand(
    mockRequest.mock(helper.requestOptions)
      .post('/users/jimmy/forgot'))
}).export(module);
