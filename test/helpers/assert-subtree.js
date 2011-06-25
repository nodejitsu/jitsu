/*
 * assert-subtree.js: Custom deep object checking
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert')

function deepObjectCheck (actual, expected) {
  if (expected && actual && (expected.length != actual.length)
    || typeof actual != typeof expected) {
    return false;
  }

  for (var key in expected) {
    var actualType = typeof(actual[key]),
        expectedType = typeof(expected[key]);
  
    if (actualType != expectedType) {
      return false;
    }
    
    if (actualType == "function") {
      continue;
    } 
    else if (actualType == "object") {
      if (!deepObjectCheck(expected[key], actual[key])) {
        return false;
      }
    } 
    else if (actual[key] !== expected[key]) {
      return false;
    }
  }
 
  return true;
};


function subtree (actual, expected, message) {
  if (!deepObjectCheck(actual, expected)) {
    //
    // Remark: getting weird error if I use the propper `assert.fail()`.
    //
    // throw new (assert.AssertionError)({actual: actual, expected: expected, opperator: 'subtree'})
    //
    throw new Error(JSON.stringify({actual: actual, expected: expected, opperator: 'subtree'}))
  }
}

exports.subtree = subtree;