/*
 * env.js: Tests for `jitsu env *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var path = require('path'),
    assert = require('assert'),
    vows = require('vows'),
    colors = require('colors'),
    spawn = require('child_process').spawn;

vows.describe('jitsu/commands/no-colors').addBatch({
  'when using the --no-colors flag': {
    topic: function () {
      var jitsu = spawn(path.join(__dirname, '..', '..', 'bin', 'jitsu'), [ '--no-colors' ]),
          text = '',
          callback = this.callback;



      jitsu.stdout.on('data', function (data) {
        text += data.toString();
      });

      jitsu.on('exit', function () {
        callback(null, text);
      });

    },
    'output does not contain ansi codes': function (text) {
      assert.equal(text, colors.stripColors(text));
    }
  }
}).export(module);
