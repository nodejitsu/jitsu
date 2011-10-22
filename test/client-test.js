/*
 * users-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    optimist = require('optimist'),
    mockRequest = require('mock-request'),
    vows = require('vows'),
    jitsu = require('../lib/jitsu'),
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
                .mock(helper.mockOptions, helper.mockDefaults)
                .get('/auth');
          var client = new jitsu.api.Client({
            username: jitsu.config.get('username'),
            password: jitsu.config.get('password'),
            remoteUri: [
              jitsu.config.get('protocol'), 
              '://', 
              jitsu.config.get('remoteHost'), 
              ':' + jitsu.config.get('port')
            ].join('')
          });

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
                .mock(helper.mockOptions, helper.mockDefaults)
                .get('/whatever')
                .respond({statusCode:400});

          var client = new jitsu.api.Client({
            username: jitsu.config.get('username'),
            password: jitsu.config.get('password'),
            remoteUri: [
              jitsu.config.get('protocol'), 
              '://', 
              jitsu.config.get('remoteHost'), 
              ':' + jitsu.config.get('port')
            ].join('')
          });
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