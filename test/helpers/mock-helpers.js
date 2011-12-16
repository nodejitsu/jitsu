
var assert = require('assert'),
    http = require('http'),
    util = require('util'),
    eyes = require('eyes'),
    it = require('it-is'),
    inspect = eyes.inspector({ stream: null })
    nodemock = require('nodemock'),
    MockRequest = require('mock-request').MockRequest,
    optimist = require('optimist'),
    jitsu = require('../../lib/jitsu'),
    base64 = require('../../lib/jitsu/utils/base64');

var port = 90210,
    remoteHost = 'api.mockjitsu.com';
    
var username = optimist.argv.username = 'mickey',
    password = optimist.argv.password = 'poiuytrewq',
    auth = 'Basic ' + base64.encode(username + ':' + password);
    
exports.mockOptions = {
  host: remoteHost,
  port: port
};

exports.mockDefaults = {
  request: {
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json'
    }
  },
  response: {
    headers: {
      'x-powered-by': 'Nodejitsu'
    }
  }
};

function mockPrompt (expected, answer) {

  if (!answer) {
    answer = expected;
    expected  = Object.keys(expected);
  }

  var prompt = nodemock.mock('get').takes(expected,function (){}).calls(1,[null, answer]);
  
  prompt.pause = function (){return this};
  prompt.start = function (){return this};//TODO: check pause was called.

  prompt.addProperties = function (obj,properties,callback) {
    prompt.get(properties, function (err,answer) {
      for( var key in answer) {
        obj[key] = answer[key];
      }
      callback(null,obj);
    });
  }
  return prompt;
}

exports.mockPrompt = mockPrompt;

function makeProperties (answer) {
  var expected = [];
  
  for (var name in answer) {
    expected.push({name: name, default: answer[name]});
  }

  return expected;
}

function mockPrompt2 (/*variable arguments*/) {

  var prompt;

  [].slice.call(arguments).forEach(function (answer){
    var m;
    m = !prompt ? prompt = nodemock.mock('get') : prompt.mock('get');

    m.takes(makeProperties(answer),function(){}).calls(1,[null,answer]);
  
  });
  
  prompt.addProperties = function (obj, properties, callback) {
    prompt.get(properties, function (err, answer) {
      for(var key in answer) {
        //split key by . and then set key to that path.
        obj[key] = answer[key];
      }
      callback(null,obj);
    })
  }

  prompt.start = function (){return prompt};
  prompt.pause = function (){return prompt};

  return prompt;
}

exports.mockPrompt2 = mockPrompt2;

exports.runJitsuCommand = function () {
  var args = Array.prototype.slice.call(arguments),
      assertion = "should respond with no error",
      assertFn,
      setupFn,
      mockRequest,
      userPrompts;
      
  args.forEach(function (a) {
    if (typeof a === 'function' && a.name === 'setup') {
      setupFn = a;
    }
    else if (typeof a === 'function') {
      assertFn = a;
    }
    else if (typeof a === 'string') {
      assertion = a;
    }
    else if (a instanceof MockRequest) {
      mockRequest = a;
    }
    else if(a instanceof Array) {
      userPrompts = a;
    }
    else {
      userPrompts = [a];
    }
  });
  if(!userPrompts) {
    userPrompts = [mockPrompt([])];
  }
  if (!mockRequest) {
    console.log('Mock request is required for `runJitsuCommand`');
    process.exit(-1);
  }
  
  var context = {
    topic: function () {
      //
      // Remark: These are not documented.
      //
      optimist.argv.remoteHost = remoteHost;
      optimist.argv.port = port;
      
      var that = this,
          _setup = jitsu.setup, 
          _request = mockRequest.run(),
          argv;
          
      argv = {
        '_': this.context.name.split(' ')
      };  
      
      //
      // Mock the command-line prompt
      //
      var currentPrompt = null;
      function nextPrompt() {
        currentPrompt = userPrompts.shift();
        if(!currentPrompt) {
          jitsu.prompt = null;
        } else {
          var promptGet = currentPrompt.get;
          // Replace the prompt.get method with our own implementation
          // this way we know when the prompt was used so we set jitsu.prompt with the next prompt.
          currentPrompt.get = function(opts, cb) {
            // Call the original prompt.get implementation with our callback.
            promptGet.call(this, opts, function(err, result) {
              // now that this prompt was invoked, move to the next one(if any).
              nextPrompt();
              // then we finally let the command/test continue with the original flow.
              cb(err, result);
            });
          };
          jitsu.prompt = currentPrompt;
        }
      }
      nextPrompt(); // Initialize jitsu.prompt
      function mockClients () {
        ['users', 'apps', 'snapshots', 'databases'].forEach(function (client) {
          jitsu[client]._request = _request;
        });
      }

      if (!jitsu.started) {
        //
        // Mock the `_request` member in the API clients.
        //
        jitsu.setup = function (callback) {
          _setup(function () {
            mockClients();
            callback();
          });
        }
      }
      else {
        mockClients();
      }
       
      // Pad the output slightly
      console.log('');
      
      //
      // If there is a setup function then call it
      //
      if (setupFn) {
        setupFn();
      }
      
      //
      // Execute the target command and assert that no error
      // was returned.
      //
      jitsu.start(argv, function () {
        // Pad the output slightly
        console.log('');

        that.callback.apply(that, arguments);
      });
    }
  };

  context[assertion] = assertFn 
    ? assertFn 
    : function (err) { assert.isTrue(!err) };
  
  return context;
};
