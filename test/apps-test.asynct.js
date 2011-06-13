/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    jitsu = require('jitsu'),
    it = require('it-is'),
    inspect = require('eyes').inspector({ stream: null }),
    helper = require('./lib/mock-helpers'),
    join = require('path').join
    fs = require('fs');

/*
  calling:
  jitsu users create elvis
  should:
    prompt the user for email and password
    make POST request to server.
*/

var POST = 'POST', GET = 'GET'

var mockRequest = helper.mockRequest
  , mockPrompt2 = helper.mockPrompt2
  , makeReq = helper.makeReq
  , res = helper.res
  , makeCommandTest = helper.makeCommandTest

exports ['jitsu apps list'] = makeCommandTest(
    ['apps','list'],//command
    null,//no prompt //an auth is requested only once.
    res(makeReq(GET,'/auth'))
    .res(makeReq(GET,'/apps/mickey'),
        { apps:
          [ { name: 'application', 
              state: 'stopped', 
              subdomain:'application', 
              scripts: {start: './server.js'}, 
              snapshots: [{filename: 'FILENAME'}] } 
              ] }, // one snapshot
        200),
    assert.ifError )

exports ['jitsu apps view application2'] = makeCommandTest(
    ['apps','view', 'application2'],//command
    null,//no prompt //an auth is requested only once.
    res(makeReq(GET, '/apps/mickey/application2'),
        { app: //response body
          { name: 'application', 
            state: 'stopped', 
            subdomain:'application', 
            scripts: {start: './server.js'}, 
            snapshots: [{filename: 'FILENAME'}] } }, // one snapshot
        200 ),
    assert.ifError )

exports ['jitsu apps start'] = makeCommandTest(
    ['apps','start', 'application3'],//command
    null,//no prompt //an auth is requested only once.
    res(makeReq(POST,'/apps/mickey/application3/start'))
    .res(makeReq(GET,'/apps/mickey/application3'),
        { app: //response body
          { state: 'started', } },
        200),
    assert.ifError )

exports ['jitsu apps stop'] = makeCommandTest(
    ['apps','stop', 'application3'],//command
    null,//no prompt //an auth is requested only once.
    res(makeReq(POST,'/apps/mickey/application3/stop'))
    .res(makeReq(GET,'/apps/mickey/application3'),
        { app: //response body
          { state: 'stopped' } },
        200),
    assert.ifError )


exports ['jitsu apps deploy'] = function (test){

  var pkg = {
    name: 'example-app',
    subdomain: 'example-app',
    scripts: { start: 'server.js' },
    version: '0.0.0'
  }

  fs.writeFileSync(join(__dirname,'fixtures/example-app/package.json'), JSON.stringify(pkg))

  process.chdir(__dirname + '/fixtures/example-app')
  console.log(process.cwd())
  /*
    TODO: assert that upload content type is application/octet-stream !
  */

  makeCommandTest(
    ['apps','deploy'],//command
    mockPrompt2({answer: 'yes'}),//no prompt //an auth is requested only once.
      res(makeReq(GET, '/apps/mickey/example-app'),
        { app: //response body
          { name: 'example-app', 
            state: 'stopped', 
            subdomain:'example-app', 
            scripts: {start: './server.js'}, 
            snapshots: [{filename: 'FILENAME'}] } }, // one snapshot
        200 )
      .res(makeReq(POST,'/apps/mickey/example-app/snapshots/0.0.0-1'))
      .res(makeReq('PUT','/apps/mickey/example-app'),
          { app: //response body
            { state: 'stopped' } },
          200)
      .res(makeReq(POST,'/apps/mickey/example-app/snapshots/0.0.0-1/activate'))
      .res(makeReq(POST,'/apps/mickey/example-app/stop'))
      .res(makeReq(POST,'/apps/mickey/example-app/start'))
      .res(makeReq(GET,'/apps/mickey/example-app'),
        { app:{ 
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          } }, 200)
      ,
      assert.ifError )(test)

}
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