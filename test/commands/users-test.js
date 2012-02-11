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

vows.describe('jitsu/commands/users').addBatch({
  'users create elvis': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override = flatiron.common.clone(elvis);
    jitsu.prompt.override['confirm password'] = elvis.password;
    
    nock('http://api.mockjitsu.com')
      .post('/users/elvis', elvis)
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'users create elvis': shouldNodejitsuOk(
    'should respond with a 400 error',
    function assertion (ign, err) {
      err = ign;
      assert.equal(err.statusCode, '400');
    },
    function setup() {
      jitsu.prompt.override = flatiron.common.clone(elvis);
      jitsu.prompt.override['confirm password'] = elvis.password;

      nock('http://api.mockjitsu.com')
        .post('/users/elvis', elvis)
        .reply(400, '', { 'x-powered-by': 'Nodejitsu' })
    })
}).addBatch({
  'users create elvis': shouldNodejitsuOk(
    'should respond with a 500 error',
    function assertion (ign, err) {
      err = ign;
      assert.equal(err.statusCode, '500');
    },
    function setup() {
      jitsu.prompt.override = flatiron.common.clone(elvis);
      jitsu.prompt.override['confirm password'] = elvis.password;

      nock('http://api.mockjitsu.com')
        .post('/users/elvis', elvis)
        .reply(500, '', { 'x-powered-by': 'Nodejitsu' })
    })
}).addBatch({
  'users create jimmy': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override = flatiron.common.clone(jimmy);
    jitsu.prompt.override['confirm password'] = jimmy.password;
    
    nock('http://api.mockjitsu.com')
      .post('/users/jimmy', jimmy)
      .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'users available jimmy': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/users/jimmy/available')
      .reply(200, { available: true }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'users confirm jimmy': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override['invite code'] = 'f4387f4';
    jitsu.prompt.override['set password'] = '123456';
    jitsu.prompt.override['confirm password'] = '123456';
    
    var testConf = path.join(__dirname, '..', 'fixtures', 'test-jitsuconf'),
        conf = path.join(__dirname, '..', 'fixtures', 'dot-jitsuconf');
        
    fs.writeFileSync(
      testConf, 
      fs.readFileSync(conf, 'utf8'),
      'utf8'
    );
    
    jitsu.config.stores.file.file = testConf;
    jitsu.config.stores.file.loadSync();
    
    nock('http://api.mockjitsu.com')
      .post('/users/jimmy/confirm', { username: 'jimmy', inviteCode: 'f4387f4'})
        .reply(200, {
          username: 'jimmy',
          inviteCode: 'f4387f4'
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/users/jimmy/forgot', { 'new-password': '123456' })
        .reply(200, { 'set-password': '123456' }, { 'x-powered-by': 'Nodejitsu' })
  })
})/*.addBatch({
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
}).addBatch({
  'users forgot jimmy': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .post('/users/jimmy/forgot'))
})*/.export(module);
