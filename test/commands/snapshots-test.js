/*
 * snapshots.js: Tests for `jitsu snapshots *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var nock = require('nock'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

vows.describe('jitsu/commans/snapshots').addBatch({
  'snapshots list application': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/apps/tester/application/snapshots')
      .reply(200, {
        snapshots: [{
          id: '0.0.0', 
          ctime: new Date(), 
          md5: 'q34rq43r5t5g4w56t45t'
        }] 
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots list application2': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/apps/tester/application2/snapshots')
      .reply(200, {
        snapshots: [{
          id: '0.0.0', 
          ctime: new Date(), 
          md5: 'q34rq43r5t5g4w56t45t'
        }] 
      }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots activate application2': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.snapshot = '0.0.0-1';

    nock('http://api.mockjitsu.com')
      .get('/apps/tester/application2/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .post('/apps/tester/application2/snapshots/0.0.0-1/activate', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'snapshots destroy application3': shouldNodejitsuOk(function setup() {
    jitsu.prompt.override.answer = 'yes';
    jitsu.prompt.override.snapshot = '0.0.0-1';
    
    nock('http://api.mockjitsu.com')
      .get('/apps/tester/application3/snapshots')
        .reply(200, {
          snapshots: [{
            id: '0.0.0-1', 
            ctime: new Date(), 
            md5: 'q34rq43r5t5g4w56t45t'
          }]
        }, { 'x-powered-by': 'Nodejitsu' })
      .delete('/apps/tester/application3/snapshots/0.0.0-1', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' });
  })
}).export(module);
