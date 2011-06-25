/*
 * assert-subtree-test.js: Tests for the jitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var vows  = require('vows'), 
    it = require('it-is'),
    subtree = require('./helpers/assert-subtree').subtree;

var examples = [ 
  [{ x: 1 }, {}],
  [{ x: 1, y: 2 }, { x: 1 }],
  [{ x: { x: 1 }, y: 2 }, { x: { x: 1} }]
];
  
function makeAsserts () {
  var context = {
    topic: function () {
      return subtree;
    }
  };

  examples.forEach(function (e) {
    var actual = e[0], 
        expected = e[1],
        json = [JSON.stringify(actual), JSON.stringify(expected)];
    
    json.splice(1, -1, 'contains subtree:')
    context[json.join(' ')] = function (subtree) {
      it(function () {
        subtree(actual, expected);
      }).doesNotThrow();
    };
    
    json.splice(1, 1);
    json.splice(1, -1, 'DOES NOT contain subtree:');
    context[json.join(' ')] = function (subtree) {
      it(function () {
        subtree(expected, actual);
      }).throws();
    };
  });
  
  return context;
}
  
vows.describe('subtree').addBatch({
  'the subtree assert': makeAsserts()
}).export(module);