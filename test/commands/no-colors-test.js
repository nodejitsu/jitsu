/*
 * env.js: Tests for `jitsu env *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    vows = require('vows'),
    colors = require('colors'),
    spawn = require('child_process').spawn;

vows.describe('jitsu/commands/no-colors').addBatch({
  'when using the --no-colors flag': {
    topic: function () {
      var jitsu = spawn('jitsu', [ '--no-colors' ]),
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
