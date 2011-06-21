
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
//    vows = require('vows'),
    eyes = require('eyes'),
    jitsu = require('jitsu'),
    http = require('http'),
    optimist = require('optimist'),
    it = require('it-is'),
    nodemock = require('nodemock'),
    inspect = require('eyes').inspector({ stream: null })
    base64 = require('jitsu/utils/base64');

  var port = 90210,
      remoteHost = 'api.mockjitsu.com';

function mockPrompt(expected,answer){

  if(!answer) {
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
  
  for(var name in answer){
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

var username = optimist.argv.username = 'mickey',
    password = optimist.argv.password = 'poiuytrewq',
    auth = 'Basic ' + base64.encode(username + ':' + password);

//TODO: i've since realised that nodemock actually supports this stuff.

function stubStream (){
  return {
    on: function (){console.log('*on')}, 
    emit: function (){console.log('*emit')}, 
    removeListener: function (){console.log('*emit')}, 
    end: function (){console.log('*end')} 
  };
}

function mockRequest(requests){
  function mockOneRequest(expected,result,status){
    expected.headers.Authorization = auth //authorization is always set.
    var mocked = nodemock.mock('request')
      .takes(expected,function (){})
      .returns(stubStream())//will be called if it uploads
      .calls(1,[null, {statusCode: status}, JSON.stringify(result)]);
    return mocked.request;
  }

  var mocked = requests.map(function (e){return mockOneRequest.apply(null,e)}), 
      calls = mocked.length, 
      count = 0;

  return function (expected,callback){
    var next = mocked.shift();
    if (next) {
      count ++;
      return next.call(null,expected,callback);
    } else {
      throw new Error('expected ' + calls + ' but got ' + (++count) + ' calls to request\n called with:' + inspect(expected) );
    }
  }  
}

exports.mockRequest = mockRequest;

function makeReq (method, path, json){
  var req = { method:method, //request
      uri:'http://api.mockjitsu.com:90210' + path,
      headers:{ } //'Content-Type':"application/json" },
    };
  if(json)
    req.body = JSON.stringify(json);
//      body: (json ? JSON.stringify(json) : null) //'{"email":"e@mailinator.com","password":"12345","username":"elvis"}'
  return req;
}

exports.makeReq = makeReq

function res(req,res,status, headers){
  var list = [];
  list.push([req,res || {}, status || 200]);
  list.res = function (req,res,status){
    list.push([req,res || {}, status || 200]);
    return list;
  };
  return list;
}

exports.res = res;

function makeCommandTest(command, userPrompt, checkRequest ,done){
    
  optimist.argv.remoteHost = remoteHost;//currently undocumented
  optimist.argv.port = port; //currently undocumented 

  return function (test){
    console.log(("TESTING COMMAND> jitsu " + command.join (' ')).bold.underline);
      console.log("MOCK COMMAND:",command);

    //mock server is ready, connect to it.

      jitsu.prompt = userPrompt || mockPrompt([]);

      jitsu.api.Client.__requestHook = mockRequest(checkRequest);

      var argv = {'_': command };//setup command optimist style.

      jitsu.start(argv,function (err,data){
        done(err,data);
        test.done();
      });
  }
}

exports.makeCommandTest = makeCommandTest