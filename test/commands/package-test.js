/*
 * package-test.js: Tests for `jitsu package *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    flatiron = require('flatiron'),
    nock = require('nock'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk;

var suite = vows.describe('jitsu/commands/package').addBatch({
  'package create': shouldNodejitsuOk(
    'should create the target tarball',
    function (_, err) {
      var tmproot = jitsu.config.get('tmproot'),
          targetPackage = path.join(tmproot, 'tester-example-app-0.0.0-1.tgz');

      try {
        fs.statSync(targetPackage);
      }
      catch (ex) {
        assert.isNull(ex);
      }
    },
    function setup() {
      var tmproot = jitsu.config.get('tmproot'),
          targetPackage = path.join(tmproot, 'tester-example-app-0.0.0-1.tgz'),
          packageFile = path.join(__dirname, '..', 'fixtures', 'example-app', 'package.json');;

      jitsu.argv.noanalyze = true;
      jitsu.prompt.override['invite code'] = 'f4387f4';

      //
      // Change directory to the sample app
      //
      process.chdir(path.join(__dirname, '..', 'fixtures', 'example-app'));

      var pkg = {
        name: 'example-app',
        subdomain: 'example-app',
        scripts: { start: 'server.js' },
        version: '0.0.0-1',
        engines: { node: '0.6.x' }
      };

      fs.writeFileSync(packageFile, JSON.stringify(pkg, true, 2))

      //
      // Attempt to remove any existing tarballs
      //
      try { fs.unlinkSync(targetPackage) }
      catch (ex) { }
    }
  ),
}).export(module);
