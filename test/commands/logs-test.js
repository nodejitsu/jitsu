/*
 * logs-test.js: Tests for `jitsu logs *` commands.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var nock = require('nock'),
    assert = require('assert'),
    vows = require('vows'),
    path = require('path'),
    fs = require('fs'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk,
    useAppFixture = macros.useAppFixture;

var mainDirectory = process.cwd();

// Snapshots tests with specified app names
vows.describe('jitsu/commands/logs').addBatch({
  'logs': shouldNodejitsuOk(function setup() {

    useAppFixture();
    
    nock('http://api.mockjitsu.com')
      .post('/logs/tester/example-app', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'jesusabdullah'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'jesusabdullah'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'jesusabdullah'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:example-app',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).export(module);
