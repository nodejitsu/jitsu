/*
 * apps.js: Tests for `jitsu apps *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    nock = require('nock'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

vows.describe('jitsu/commands/apps').addBatch({
  'apps list': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/apps/tester')
      .reply(200, {
        apps:[{ 
          name: 'application', 
          state: 'stopped', 
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }]
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps view application2': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .get('/apps/tester/application2')
      .reply(200, {
        app: { 
          name: 'application', 
          state: 'stopped', 
          subdomain:'application', 
          scripts: { start: './server.js' }, 
          snapshots: [{ filename: 'FILENAME' }] 
        }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps start application3': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .post('/apps/tester/application3/start', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/tester/application3')
        .reply(200, {
          app: { state: 'started' }
        }, { 'x-powered-by': 'Nodejitsu' })
  })
}).addBatch({
  'apps stop application3': shouldNodejitsuOk(function setup() {
    nock('http://api.mockjitsu.com')
      .post('/apps/tester/application3/stop', {})
        .reply(200, '', { 'x-powered-by': 'Nodejitsu' })
      .get('/apps/micke/application3')
      .reply(200, {
          app: { state: 'stopped' }
      }, { 'x-powered-by': 'Nodejitsu' })
  })
})/*.addBatch({
  'apps deploy': runJitsuCommand(
    function setup () {
      var packageFile = path.join(__dirname, '..', 'fixtures', 'example-app', 'package.json');
      var pkg = {
        name: 'example-app',
        subdomain: 'example-app',
        scripts: { start: 'server.js' },
        version: '0.0.0'
      };

      fs.writeFileSync(packageFile, JSON.stringify(pkg))
      process.chdir(path.join(__dirname, '..', 'fixtures', 'example-app'));
    },
    mockPrompt2({answer: 'yes'}),
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/example-app')
      .respond({
        body: {
          app: {
            name: 'example-app', 
            state: 'stopped', 
            subdomain:'example-app', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      })
      .post('/apps/mickey/example-app/snapshots/0.0.0-1',null,{'Content-Type' : 'application/octet-stream'})
      .put('/apps/mickey/example-app')
      .respond({
        body: {
          app: { state: 'stopped' }
        }
      })
      .post('/apps/mickey/example-app/snapshots/0.0.0-1/activate')
      .post('/apps/mickey/example-app/stop')
      .post('/apps/mickey/example-app/start')
      .get('/apps/mickey/example-app')
      .respond({
        body: {
          app: { 
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          }
        }
      })
    )
})*/.export(module);

/*exports ['jitsu apps create'] = makeCommandTest(
    ['apps','create', 'application3'],//command
    mockPrompt(jitsu.package.properties(__dirname), {}),//no prompt //an auth is requested only once.
    [ [ { method:'POST', //post request to start app
          uri:'http://api.mockjitsu.com:90210/apps/mickey/application3/stop',
          headers:{ 'Content-Type':"application/json" },
          //body: '{}' //not really necessary to send the body.
        },
        {  }, // one snapshot
        200 ],
      [ { method:'GET', //get request to view app status.
          uri:'http://api.mockjitsu.com:90210/apps/mickey/application3',
          headers:{ 'Content-Type':"application/json" },
          //body: '{}' //not really necessary to send the body.
        },
        { app: //response body
          { state: 'stopped' } },
        200 ]
    ],
    assert.ifError )
*/