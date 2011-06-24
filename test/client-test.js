/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    vows = require('vows'),
    eyes = require('eyes'),
    jitsu = require('jitsu'),
    http = require('http'),
    optimist = require('optimist'),
    it = require('it-is'),
    mockRequest = require('./helpers/mock-request'),
    helper = require('./helpers/mock-helpers');

var port = 90210, remoteHost = 'api.mockjitsu.com', config, server;

optimist.argv.remoteHost = remoteHost;//currently undocumented
optimist.argv.port = port; //currently undocumented 

vows.describe('jitsu/lib/client').addBatch({
  'jitsu': {
    topic: function (){
      jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', this.callback);
    },
    'does not error': function (err,store){
      assert.isTrue(!err);
    }
  }
}).addBatch({
  'client calls request - success': {
    'topic' : function (){
      var requestMock = mockRequest.mock(helper.requestOptions).get('/auth')
        , that = this

      client = new jitsu.api.Client(jitsu.config)
      client._request = requestMock.run()
      client.request('GET', 
        ['auth'],
        { payload: "JSON" }, 
        this.callback,
        function (response){
          that.callback(null,response)
        })
    },
    'does not error': function (err,reponse){
      if(err) throw err
    },
    'status is 200': function (err,response){
      assert.equal(response.statusCode,200)
    }
  },
  'client calls request - 400 error': {
    'topic' : function (){
      var requestMock = mockRequest.mock(helper.requestOptions)
          .get('/whatever').respond({statusCode:400})
        , that = this

      client = new jitsu.api.Client(jitsu.config)
      client._request = requestMock.run()
      client.request('GET', 
        ['whatever'],
        { payload: "JSON" }, 
        this.callback,
        function (response){
          that.callback(null,response)
        })
    },
    'calls back with error': function (err,reponse){
      assert.ok(err instanceof Error)
    }
  }
}).export(module)
