/*
 * config-test.js: Tests for `jitsu.config`.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    vows = require('vows'),
    eyes = require('eyes'),
    jitsu = require('../lib/jitsu'),
    optimist = require('optimist'),
    it = require('it-is');

vows.describe('jitsu/lib/jitsu/config').addBatch({
  "When using jitsu.config module": {
    "the load() method" : {
      topic: function (){
        jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', this.callback);
      },
      "should return store object": function (err, store) {
        it(store).has({
          "protocol": "http",
          "remoteHost": "api.mockjitsu.com",
          "port": "90210",
          "userconfig": it.typeof('string'),
          "loglevel": "silly",
          "tmproot": "/tmp",
          "tar": "tar",
          "gzipbin": "gzip",
          "username": "EXAMPLE-USER",
          "password": "EXAMPLE-PASSWORD"
        });
      },
      "the get() method": {
        "should have remoteUri": function () {    
          it(jitsu.config.get('remoteUri')).equal('http://api.mockjitsu.com:90210');
        },
        "should default to optimist.argv": function () {
          optimist.argv.remoteHost = 'example.com';
          optimist.argv.port = 2369;
          it(jitsu.config.get('remoteUri')).equal('http://example.com:2369');
        }
      }
    }
  }
}).export(module);