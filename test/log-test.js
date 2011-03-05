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
    jitsu = require('jitsu');
    
vows.describe('jitsu/log').addBatch({
  "When using the log module": {
    "the columnMajor() method": {
      "should respond with rows in column major form": function () {
        var columns, rows = [
          ["1a", "2a", "3a", "4a"],
          ["1b", "2b", "3b", "4b"],
          ["1c", "2c", "3c", "4c"]
        ];
        
        columns = jitsu.log.columnMajor(rows);
        for (var i = 0; i < columns.length; i++) {
          columns[i].forEach(function (val) {
            assert.isTrue(val.indexOf(i + 1) !== -1);
          });
        }
      }
    },
    "the arrayLengths() method": {
      "should respond with a list of the longest elements": function () {
        var lengths, rows = [
          ["1a", "2a",  "3a",   "4a"],
          ["1b", "2bb", "3b",   "4b"],
          ["1c", "2c",  "3ccc", "4c"],
          ["1d", "2d",  "3dd",  "4dddd"]
        ];
        
        lengths = jitsu.log.arrayLengths(rows);
        assert.equal(lengths[0], 2);
        assert.equal(lengths[1], 3);
        assert.equal(lengths[2], 4);
        assert.equal(lengths[3], 5);
      }
    }
  }
}).export(module);