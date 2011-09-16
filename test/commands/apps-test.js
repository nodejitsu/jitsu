/*
 * apps.js: Tests for `jitsu apps *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    winston = require('winston').cli(),
    mockRequest = require('mock-request'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    helper = require('../helpers/mock-helpers');

var mockPrompt2 = helper.mockPrompt2,
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/commands/apps').addBatch({
  'This test requires jitsu be unauthorized': function () {
    jitsu.skipAuth = false;
    assert.isFalse(jitsu.skipAuth);
  }
}).addBatch({
  'apps list': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/auth')
      .get('/apps/mickey')
      .respond({
        body: {
          apps:[{ 
            name: 'application', 
            state: 'stopped', 
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }]
        }
      }))
}).addBatch({
  'apps view application2': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .get('/apps/mickey/application2')
      .respond({
        body: {
          app: { 
            name: 'application', 
            state: 'stopped', 
            subdomain:'application', 
            scripts: { start: './server.js' }, 
            snapshots: [{ filename: 'FILENAME' }] 
          }
        }
      }))
}).addBatch({
  'apps start application3': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .post('/apps/mickey/application3/start')
      .get('/apps/mickey/application3')
      .respond({
        body: { 
          app: { state: 'started' }
        }
      }))
}).addBatch({
  'apps stop application3': runJitsuCommand(
    mockRequest.mock(helper.mockOptions, helper.mockDefaults)
      .post('/apps/mickey/application3/stop')
      .get('/apps/micke/application3')
      .respond({
        body: {
          app: { state: 'stopped' }
        }
      })
    )
}).addBatch({
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
}).export(module);

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