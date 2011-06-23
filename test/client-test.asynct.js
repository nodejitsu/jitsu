/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    eyes = require('eyes'),
    jitsu = require('jitsu'),
    http = require('http'),
    optimist = require('optimist'),
    it = require('it-is');

var port = 8081,
    remoteHost = 'localhost',
    config, server;

optimist.argv.remoteHost = remoteHost;//currently undocumented
optimist.argv.port = port; //currently undocumented 

exports.__setup = function (test){
  jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', test.done)
}

//
// adds auth performs request to options.remoteUri + uri.
// calls back error if it was a fail code.
// body of error may be a json object
// calls success with response if it worked.
//

//
// ###Request to Mock Server.
// test that client actually makes http request. 
// for later tests of API will mock out client.
// 

exports ['request to mock server, callback success when status 200'] = function (test){
  var called = false
    , server = 
  http.createServer(function (req,res){
    called = true
    //check that request has the right auth parameters set. & is application/json
  
    it(req).has({
      headers: 
       { authorization: 'Basic ' 
            + jitsu.utils.base64.encode(jitsu.config.get('username') 
            + ':' 
            + jitsu.config.get('password')) ,
         'content-type': 'application/json',
         host: 'localhost:8081'}
    })

    var body = JSON.stringify({ok: true})

    res.writeHead(200,{'Content-Type': 'application/json', 'Content-Length': body.length})
    res.write(body)
    res.end()
  })
  
  server.listen(port, remoteHost,function (){
    client = new jitsu.api.Client(jitsu.config)

    it(client).has({
      _request: it.function (),
      _upload: it.function ()
    })

    client._request('GET',['path','to','example'], {
      payload: "JSON"
    }, function (err){ //error callback
      throw err
    }, function (response,result){
      it(called).equal(true)
      it(result).deepEqual({ok: true})

      server.close()
      test.done()
    })
  })
}


function makeStatusTest (status){

  return function (test){
    var called = false
      , server = 
    http.createServer(function (req,res){
      called = true
      //check that request has the right auth parameters set. & is application/json
  
      //check that body was actually sent.
  
      it(req).has({
        headers: 
         { authorization: 'Basic ' 
              + jitsu.utils.base64.encode(jitsu.config.get('username') 
              + ':' 
              + jitsu.config.get('password')) ,
           'content-type': 'application/json',
           host: 'localhost:8081'}
      })

      var body = JSON.stringify({ok: true})

      res.writeHead(status,{'Content-Type': 'application/json', 'Content-Length': body.length})
      res.write(body)
      res.end()
    })
  
    server.listen(port, remoteHost,function (){
      client = new jitsu.api.Client(jitsu.config)

      client._request('GET',['path','to','example'], {
        payload: "JSON"
      }, function (err){ //error callback
        it(called).equal(true)
        it(err).instanceof(Error)
        it(err).property('statusCode', status)
        console.log(err)

        server.close()
        test.done()
      }, function (response,result){
        throw new Error('expected error callback to be called')
      })
    })
  }

}

exports ['request to mock server, callback success when status 400'] = makeStatusTest(400)
exports ['request to mock server, callback success when status 403'] = makeStatusTest(403)
exports ['request to mock server, callback success when status 403'] = makeStatusTest(403)
exports ['request to mock server, callback success when status 500'] = makeStatusTest(500)
