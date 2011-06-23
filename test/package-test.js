/*
 * log-test.js: Tests for the jitsu log module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(require('path').join(__dirname, '..', 'lib'));

var assert = require('assert'),
    vows = require('vows'),
    eyes = require('eyes'),
    jitsu = require('jitsu'),
    join = require('path').join,
    nodemock = require('nodemock'),
    helper = require('./lib/mock-helpers'),
    analyzer = require('require-analyzer'),
    fs = require('fs'),
    optimist = require('optimist');

/*
//package.create prompts user to create package.json

//package.read reads the package from the dir

//package.validate checks the loaded package.json with package.properties(dir)
//    and if necessary, prompts the user for new settings.

//package.write prompts the user for 'ok' and then writes the new file.

//returns an array 

*/
function makeProperties (answer) {
  var expected = [];
  
  for(var name in answer){
    expected.push({name: name, default: answer[name]});
  }

  return expected;
}

var mockPrompt2 = helper.mockPrompt2

exports.__setup = function (test) { //config.load isn't called jitsu will break in many places
  jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', test.done)
}


function makePackageTest(useAnalyzer) {
  return function (test) {
    var dir = join(__dirname,'fixtures','example-app')
      , start = join(__dirname,'fixtures','example-app','server.js')
      , answer = {
          name: 'example-app', 
          subdomain: 'example-app', 
          'scripts.start': 'server.js', 
          version: '0.0.0'
        }
      , expected = makeProperties(answer)
      , analyzerMock;

    optimist.argv.noanalyze = !useAnalyzer;

    //prompt for package.json properties
    var promptMock = jitsu.prompt = mockPrompt2({
          name: 'example-app', //first prompt
          subdomain: 'example-app', 
          'scripts.start': 'server.js', 
          version: '0.0.0'
        }, {
        answer: 'yes' //second prompt
        });

    if(useAnalyzer){
      analyzerMock = nodemock.mock('analyze')
        .takes({target: start},function (){})
        .calls(1,[null,{}]); //err, deps
    } else {
      analyzerMock = nodemock.mock('analyze').fail();
    }
        
    analyzer.analyze = analyzerMock.analyze;
 
    jitsu.package.create(dir, function (err,pkg){
      promptMock.assert();
      analyzerMock.assert();
      test.done();
    });
  }
}


exports ['package.create'] = makePackageTest(true);
exports ['package.create : do not call require-analyzer if --noanalyze is set'] = makePackageTest(false);

function makeValidateTest (useAnalyzer){

  return function (test){

   optimist.argv.noanalyze = !useAnalyzer;

   var dir = join(__dirname,'fixtures','example-app')
      , start = join(__dirname,'fixtures','example-app','server.js')
      , pkg
      , answer = {
          name: 'example-app', 
          subdomain: 'example-app', 
          'scripts.start': 'server.js', 
          version: '0.0.0'
        }
      , pkg = {
          name: 'example-app', 
          subdomain: 'example-app', 
          'scripts': {'start': 'server.js'}, 
          version: '0.0.0'
        }
      , expected = makeProperties(answer)
      , analyzerMock;

    //prompt for package.json properties
    var promptMock = jitsu.prompt = mockPrompt2({
          'scripts.start': 'server.js', 
        }, {
        answer: 'yes' //second prompt
        });

    if(useAnalyzer){
      analyzerMock = nodemock.mock('analyze')
        .takes({target: start},function (){})
        .calls(1,[null,{}]); //err, deps
    } else {
      analyzerMock = nodemock.mock('analyze').fail();
    };

    analyzer.analyze = analyzerMock.analyze;
 
    jitsu.package.validate(pkg,dir, function (err,pkg){
      promptMock.assert();
      analyzerMock.assert();
      test.done();
    });

  }
}

exports ['package.validate'] = makeValidateTest (true);
exports ['package.validate : do not call require-analyzer if --noanalyze is set'] = makeValidateTest (false);


exports ['package.createTarball'] = function (test) {

  jitsu.package.createTarball(join(__dirname, 'fixtures/example-app'),function (err,  pgk,tarball) {
    fs.statSync(tarball); //will throw if file does not exist.
    test.done();
  });

}