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
    optimist = require('optimist'),
    mockRequest = require('mock-request'),
    helper = require('./helpers/mock-helpers');

var port = 90210, 
    remoteHost = 'api.mockjitsu.com', 
    config, 
    server;

//
// TODO: This usage is currently undocumented
//
optimist.argv.remoteHost = remoteHost;
optimist.argv.port = port;  

vows.describe('jitsu/lib/client').addBatch({
  'When using jitsu.config.load': {
    topic: function () {
      jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', this.callback);
    },
    'it should not respond with an error': function (err,store) {
      assert.isTrue(!err);
    }
  }
}).addBatch({
  'When using an instance of jitsu.api.Client': {
    'the request() method': {
      'when successful': {
        topic : function () {
          var that = this,
              requestMock = mockRequest
                .mock(helper.requestOptions)
                .get('/auth');

          var client = new jitsu.api.Client(jitsu.config);
          client._request = requestMock.run();
          client.request('GET', ['auth'], { payload: "JSON" }, this.callback, function (response) {
            that.callback(null, response);
          });
        },
        'should not respond with an error': function (err, reponse) {
          assert.isTrue(!err);
        },
        'should respond with 200': function (err, response) {
          assert.equal(response.statusCode, 200);
        }
      },
      'when unsuccessful (400)': {
        topic : function () {
          var that = this,
              requestMock = mockRequest
                .mock(helper.requestOptions)
                .get('/whatever')
                .respond({statusCode:400});

          var client = new jitsu.api.Client(jitsu.config);
          client._request = requestMock.run();
          client.request('GET', ['whatever'], { payload: "JSON" }, this.callback, function (response) {
            that.callback(null, response);
          });
        },
        'should respond with an error': function (err, reponse) {
          assert.ok(err instanceof Error);
        }
      }
    }
  }
}).export(module);