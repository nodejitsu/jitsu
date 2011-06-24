
var assert = require('assert')

function deepObjectCheck(actual, expected) {

  if(expected && actual && (expected.length != actual.length)) return false;
  if(typeof actual != typeof expected) return false;

  for(var key in expected) {

    var actualType = typeof(actual[key]);
    var expectedType = typeof(expected[key]);
  
    if(actualType != expectedType) return false;
    if(actualType == "function") {
      continue;
    } else if(actualType == "object") {
      if(!deepObjectCheck(expected[key]	,actual[key])) return false;
    } else {
      if(actual[key] !== expected[key]) return false;
    }
  }
 
  return true;
};

exports.subtree = subtree

function subtree (actual, expected, message) {
  if (!deepObjectCheck(actual, expected)) {
//    throw new (assert.AssertionError)({actual: actual, expected: expected, opperator: 'subtree'})
      //getting weird error if I use the propper assert.fail()
      throw new Error(JSON.stringify({actual: actual, expected: expected, opperator: 'subtree'}))
  }
}
