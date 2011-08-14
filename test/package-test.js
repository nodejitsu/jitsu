/*
 * package-test.js: Tests for the jitsu package module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    fs = require('fs'),
    join = require('path').join,
    vows = require('vows'),
    analyzer = require('require-analyzer'),
    eyes = require('eyes'),
    optimist = require('optimist'),
    nodemock = require('nodemock'),
    nm = require('nodemock'),
    jitsu = require('../lib/jitsu'),
    helper = require('./helpers/mock-helpers');

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
var mockPrompt2 = helper.mockPrompt2;

function makeProperties (answer) {
  var expected = [];
  for (var name in answer) {
    expected.push({ name: name, default: answer[name] });
  }

  return expected;
}

function mockAnalyzer (useAnalyzer, start) {
  return !useAnalyzer ? nodemock.fail('analyze') : nodemock.mock('analyze')
    .takes({ target: start }, function () {})
    .calls(1, [null, {}]);
}

function assertCreatePackage (useAnalyzer) {
  var dir = join(__dirname,'fixtures','example-app'),
      start = join(__dirname,'fixtures','example-app','server.js'),
      pkg = {
        name: 'example-app', 
        subdomain: 'example-app', 
        'scripts': {'start': 'server.js'}, 
        version: '0.0.0'
      }, 
      analyzerMock = mockAnalyzer(useAnalyzer, start);

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
    topic: function () {
      var packageFile = join(__dirname, 'fixtures', 'example-app', 'package.json'),
          pkg;
          
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
      assert.equal(typeof this.callback, 'function');
      jitsu.package.create(dir, this.callback);
    },
    'should not respond with an error': function (err, pkg) {
      assert.isTrue(!err);
    },
    'should prompt the user' : promptMock.assert,
    'should invoke the require-analyzer correctly': analyzerMock.assert
  }
}

function assertValidatePackage (useAnalyzer) {
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
      analyzerMock = mockAnalyzer(useAnalyzer, start);
      
    //
    // completely mock this out, because to get around scripts.start
    // really, a mock for prompt should be part of the prompt library.
    //
    var promptMock = nm.mock('addProperties')
      .takes(pkgMissing, [{ name: 'scripts.start', default: 'server.js' }], function () {})
      .calls(2, [null, {
          name: 'example-app', 
          subdomain: 'example-app', 
          'scripts': { 'start': 'server.js' }, 
          version: '0.0.0'
        }]);
      
  return {
    topic: function () {
      var packageFile = join(__dirname, 'fixtures', 'example-app', 'package.json');

      jitsu.prompt = promptMock;
      fs.writeFileSync(packageFile, JSON.stringify(pkgMissing));
      process.chdir(join(__dirname, 'fixtures', 'example-app'));

      optimist.argv.noanalyze = !useAnalyzer;
      analyzer.analyze = analyzerMock.analyze;
 
      jitsu.package.validate(pkgMissing, dir, this.callback);
    },
    'should not respond with an error': function (err, pkg) {
      assert.isTrue(!err);
    },
    'should prompt the user' : promptMock.assert,
    'should invoke the require-analyzer correctly': analyzerMock.assert,
  }
}

vows.describe('jitsu/lib/package').addBatch({
  /*'When using jitsu.config.load': {
    topic: function () {
      jitsu.config.load(__dirname + '/fixtures/dot-jitsuconf', this.callback);
    },
    'it should not respond with an error': function (err, store) {
      assert.isTrue(!err);
    }
  }*/
}).addBatch({
  /*'When using the jitsu package modules': {
   'validating a package': assertValidatePackage(true),
   'validate a package --noanalyze': assertValidatePackage(false),
   'creating a package': assertCreatePackage(true),
  }*/
}).addBatch({
  'jitsu': {
  //
  //  this fails and that obscures all of the other test results.
  //  i've put it in another file to show that the rest of the tests pass.
  //  'create package --noanalyze' : runCreatePackage(false)
  }
}).export(module)
