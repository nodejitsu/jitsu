/*
 * env.js: Tests for `jitsu env *` command(s).
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

vows.describe('jitsu/commands/users')/*.addBatch({
  'users confirm jimmy': runJitsuCommand(
    mockPrompt({ 'Invite code': 'f4387f4' }),
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .post('/users/jimmy/confirm')
      .respond({
        body: {
          error: 'username jimmy is taken'
        }
      })
    )
})*/.export(module);
