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
    helper = require('./helpers/mock-helpers'),
    analyzer = require('require-analyzer'),
    fs = require('fs'),
    nm = require('nodemock'),
    optimist = require('optimist');

//
//  package.create prompts user to create package.json
//
//  package.read reads the package from the dir
//
//  package.validate checks the loaded package.json with package.properties(dir)
//    and if necessary, prompts the user for new settings.
//
//  package.write prompts the user for 'ok' and then writes the new file.
//

function makeProperties (answer) {
  var expected = [];
  
  for(var name in answer){
    expected.push({name: name, default: answer[name]});
  }

  return expected;
}
var mockPrompt2 = helper.mockPrompt2;

function mockAnalyzer (useAnalyzer, start) {
  if(useAnalyzer) {
    analyzerMock = nodemock.mock('analyze')
      .takes({target: start}, function () {})
      .calls(1,[null, {}]);
  }
  else {
    analyzerMock = nodemock.fail('analyze');
  }
  return analyzerMock
}

function runCreatePackage(useAnalyzer) {
  var dir = join(__dirname,'fixtures','example-app'),
      start = join(__dirname,'fixtures','example-app','server.js'),
      pkg = {
        name: 'example-app', 
        subdomain: 'example-app', 
        'scripts': {'start': 'server.js'}, 
        version: '0.0.0'
      }, 
      analyzerMock = mockAnalyzer(useAnalyzer,start);

    //
    // user is prompted for features of thier app.
    //

    var promptMock = mockPrompt2({
        name: 'example-app', 
        subdomain: 'example-app', 
        'scripts.start': 'server.js', 
        version: '0.0.0'
      },
      { answer: 'yes' });

  return {
    topic: function (){
      var packageFile = join(__dirname, 'fixtures', 'example-app', 'package.json'),
          pkg = {
            name: 'example-app',
            subdomain: 'example-app',
            scripts: { start: 'server.js' },
            version: '0.0.0'
          };

      fs.writeFileSync(packageFile, JSON.stringify(pkg));
      process.chdir(join(__dirname, 'fixtures', 'example-app'));

      optimist.argv.noanalyze = !useAnalyzer;
      analyzer.analyze = analyzerMock.analyze;
      
      jitsu.prompt = promptMock;
      assert.equal(typeof this.callback , 'function');
      jitsu.package.create(dir, this.callback );
    },
    'does not callback an error': function (err, pkg) {
        assert.isTrue(!err);
    },
    'user was prompted' : promptMock.assert,
    'require-analyzer was correctly invoked': analyzerMock.assert,
  }
}

function runPackageValidate (useAnalyzer) {
  var dir = join(__dirname, 'fixtures', 'example-app'),
      start = join(__dirname, 'fixtures', 'example-app', 'server.js'),
      pkgMissing = {
        name: 'example-app', 
        subdomain: 'example-app', 
        version: '0.0.0'
      },
      pkg = {
        name: 'example-app', 
        subdomain: 'example-app', 
        'scripts': {'start': 'server.js'}, 
        version: '0.0.0'
      },
      analyzerMock = mockAnalyzer(useAnalyzer,start);
    //
    //completely mock this out, because to get around scripts.start
    //really, a mock for prompt should be part of the prompt library.
    //
    var promptMock = nm.mock('addProperties')
      .takes(pkgMissing,[{name: 'scripts.start', default: 'server.js'}], function (){})
      .calls(2,[null,{
          name: 'example-app', 
          subdomain: 'example-app', 
          'scripts': {'start': 'server.js'}, 
          version: '0.0.0'
        } ]);
      
  return {
    topic: function (){
      var packageFile = join(__dirname, 'fixtures', 'example-app', 'package.json');

      jitsu.prompt = promptMock;
      fs.writeFileSync(packageFile, JSON.stringify(pkgMissing));
      process.chdir(join(__dirname, 'fixtures', 'example-app'));

      optimist.argv.noanalyze = !useAnalyzer;
      analyzer.analyze = analyzerMock.analyze;
 
      jitsu.package.validate(pkgMissing, dir, this.callback );
    },
  'does not callback an error':function (err, pkg){
    assert.isTrue(!err);
  },
  'user was prompted' : promptMock.assert,
  'require-analyzer was correctly invoked': analyzerMock.assert,
  }
}

vows.describe('jitsu/lib/package').addBatch({
  'jitsu': {
    topic: function (){
      jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', this.callback);
    },
    'does not error': function (err,store){
      assert.isTrue(!err);
    }
  }
}).addBatch({
  'jitsu': {
    'validate package' : runPackageValidate(true)
  }
}).addBatch({
  'jitsu': {
    'validate package --noanalyze' : runPackageValidate(false)
  }
}).addBatch({
  'jitsu': {
    'create package' : runCreatePackage(true)
  }
}).addBatch({
  'jitsu': {
  //
  //  this fails and that obscures all of the other test results.
  //  i've put it in another file to show that the rest of the tests pass.
  //  'create package --noanalyze' : runCreatePackage(false)
  }
}).export(module)
