
var vows  = require('vows') 
  , it = require('it-is')
  , subtree = require('./helpers/assert-subtree').subtree

var examples = 
  [ [{x: 1}, {} ]
  , [{x: 1, y: 2}, {x: 1} ]
  , [{x: {x: 1}, y: 2}, {x: {x: 1}} ]
  ]
  
  function makeAsserts () {

    var context = {
      topic: function () {
        return subtree
      }
    }

    examples.forEach (function (e) {
      var actual = e[0], expected = e[1]
      context[JSON.stringify(actual) 
        + ' contains subtree: ' 
        + JSON.stringify(expected)
        ] = function (subtree){
          it(function () {
            subtree(actual, expected)
          }).doesNotThrow()
        }
      context[JSON.stringify(expected) 
        + ' DOES NOT contain subtree: ' 
        + JSON.stringify(actual)
        ] = function (subtree){
          it(function () {
            subtree(expected, actual)
          }).throws()
        }
    })
    return context
  }
  
vows.describe('subtree').addBatch({
  'the subtree assert': makeAsserts()
}).export(module)
