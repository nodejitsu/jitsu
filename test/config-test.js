
var assert = require('assert'),
    vows = require('vows'),
    eyes = require('eyes'),
    jitsu = require('jitsu'),
    optimist = require('optimist')
    it = require('it-is');

vows.describe('jitsu/lib/jitsu/config').addBatch({

  "when you call config.load" : {
    topic: function (){
      jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf',this.callback)
    },
    "returns store object" : function (err,store){
    
      it(store).has({
        "protocol": "http",
        "remoteHost": "localhost",
        "port": "7000",
        "userconfig": it.typeof('string'),
        "loglevel": "silly",
        "tmproot": "/tmp",
        "tar": "tar",
        "gzipbin": "gzip",
        "username": "EXAMPLE-USER",
        "password": "EXAMPLE-PASSWORD"
      })
    
    },
    "when you call get": {
      "getter for remoteUri": function (){    
        it(jitsu.config.get('remoteUri')).equal('http://localhost:7000')
      },
      "default to optimist.argv": function (){    
        optimist.argv.remoteHost = 'example.com'
        optimist.argv.port = 2369
          it(jitsu.config.get('remoteUri')).equal('http://example.com:2369')
      }
    }
  }
}).export(module)