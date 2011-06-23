/*
 * apps.js: Tests for `jitsu apps *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', '..', 'lib'));

var fs = require('fs'),
    path = require('path'),
    assert = require('assert'),
    vows = require('vows'),
    jitsu = require('jitsu'),
    helper = require('../helpers/mock-helpers'),
    mockRequest = require('../helpers/mock-request');

var mockPrompt2 = helper.mockPrompt2,
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/commands/apps').addBatch({
  'apps list': runJitsuCommand(
    mockRequest.mock(helper.requestOptions)
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
    mockRequest.mock(helper.requestOptions)
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
    mockRequest.mock(helper.requestOptions)
      .post('/apps/mickey/application3/start')
      .get('/apps/mickey/application3')
      .respond({
        body: { 
          app: { state: 'started' }
        }
      }))
}).addBatch({
  'apps stop application3': runJitsuCommand(
    mockRequest.mock(helper.requestOptions)
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
    mockRequest.mock(helper.requestOptions)
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
      .post('/apps/mickey/example-app/snapshots/0.0.0-1')
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