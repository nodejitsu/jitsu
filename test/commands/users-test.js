/*
 * users-test.js: Tests for `jitsu users *` commands not included in cli-users.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    flatiron = require('flatiron'),
    nock = require('nock'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

var elvis = {
  username: 'elvis',
  email: 'e@mailinator.com',
  password: '12345'
};

var jimmy = { 
  username: "jimmy",
  email: "j@mailinator.com",
  password: "98765"
};

vows.describe('jitsu/commands/users').addBatch({
  'users confirm jimmy': shouldNodejitsuOk(
    'should respond with a 400 error',
    function assertion (ign, err) {
      err = ign;
      assert.equal(err.statusCode, '400');
    },
    function setup() {
      jitsu.prompt.override['invite code'] = 'f4387f4';
    
      nock('https://api.mockjitsu.com')
        .post('/users/jimmy/confirm', { username: 'jimmy', 'inviteCode': 'f4387f4' })
        .reply(400, {
          result: {
            error: 'Invalid Invite Code'
          }
        }, { 'x-powered-by': 'Nodejitsu' });
    }
  ),
}).addBatch({
  'users confirm elvis': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override['invite code'] = 'f4387f4';
    jitsu.prompt.override['login'] = 'no';
  
    nock('https://api.mockjitsu.com')
      .post('/users/elvis/confirm', { username: 'elvis', 'inviteCode': 'f4387f4' })
      .reply(200, {
        message: 'Ninja status has been confirmed!',
        hasPassword: true
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).export(module);
