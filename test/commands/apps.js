/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    vows = require('vows'),
    jitsu = require('jitsu'),
    it = require('it-is'),
    inspect = require('eyes').inspector({ stream: null }),
    helper = require('./lib/mock-helpers'),
    join = require('path').join,
    fs = require('fs');

/*
  calling:
  jitsu users create elvis
  should:
    prompt the user for email and password
    make POST request to server.
*/

var POST = 'POST', GET = 'GET'

var mockPrompt2 = helper.mockPrompt2
  , makeReq = helper.makeReq
  , res = helper.res
  , makeCommandTest = helper.makeCommandTest;
  
var mockRequest = require('./lib/mock-request'),
    runJitsuCommand = helper.runJitsuCommand;

vows.describe('jitsu/api/apps').addBatch({
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
    function () {
      var pkg = {
        name: 'example-app',
        subdomain: 'example-app',
        scripts: { start: 'server.js' },
        version: '0.0.0'
      }

      fs.writeFileSync(join(__dirname,'fixtures/example-app/package.json'), JSON.stringify(pkg))

      process.chdir(__dirname + '/fixtures/example-app')
      console.log(process.cwd())
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