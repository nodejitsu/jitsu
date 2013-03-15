/*
 * package-test.js: Tests for `jitsu.package` functions.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var mainDirectory = process.cwd();

jitsu.init();
//jitsu.log.loggers.default.remove(app.log.loggers.default.transports.console); // make silent

function setupPackage (options) {
  options = options || {};
  return {
    name: options.name || 'example-app',
    subdomain: options.subdomain || 'example-app',
    scripts: { start: 'server.js' },
    version: '0.0.0-1',
    engines: { node: '0.6.x' }
  };
}

function isValid(property, value) {
  // Use package properties
  var properties = jitsu.package.properties(mainDirectory);

  // Filter by property name
  properties = properties.filter(function (el) {
    return el.name === property;
  });

  var desc = properties[0] || {};

  if (desc.validator) {
    if (desc.validator instanceof RegExp) {
      return desc.validator.test(value);
    }

    return desc.validator(value);
  }
  return false;
}

var suite = vows.describe('jitsu/lib/package').addBatch({
  'name': {
    'starting with .': {
      topic: setupPackage({ name: '.example-app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'starting with _': {
      topic: setupPackage({ name: '_example-app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing -': {
      topic: setupPackage(),

      'should be valid': function (topic) {
        assert.ok(isValid('name', topic.name));
      }
    },
    'containing spaces': {
      topic: setupPackage({ name: 'example app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing interior .': {
      topic: setupPackage({ name: 'example.app' }),

      'should be valid': function (topic) {
        assert.ok(isValid('name', topic.name));
      }
    },
    'containing %': {
      topic: setupPackage({ name: 'example%app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing @': {
      topic: setupPackage({ name: 'example@app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing :': {
      topic: setupPackage({ name: 'example:app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing +': {
      topic: setupPackage({ name: 'example+app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing /': {
      topic: setupPackage({ name: 'example/app' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'node_modules': {
      topic: setupPackage({ name: 'node_modules' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'favicon.ico': {
      topic: setupPackage({ name: 'favicon.ico' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('name', topic.name));
      }
    },
    'containing unicode(๛ಠ_ಠ☠☃❤⁂⍨⋙‽)': {
      topic: setupPackage({ name: '๛ಠ_ಠ☠☃❤⁂⍨⋙‽' }),

      'should be valid': function (topic) {
        assert.ok(isValid('name', topic.name));
      }
    }
  },
  'subdomain': {
    'starting with 9': {
      topic: setupPackage({ subdomain: '9example' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'starting with _': {
      topic: setupPackage({ subdomain: '_example' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'containing -': {
      topic: setupPackage(),

      'should be valid': function (topic) {
        assert.ok(isValid('subdomain', topic.subdomain));
      }
    },
    'containing spaces': {
      topic: setupPackage({ subdomain: 'example domain' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'containing .': { //will become invalid soon
      topic: setupPackage({ subdomain: 'example.domain' }),

      'should be valid': function (topic) {
        assert.ok(isValid('subdomain', topic.subdomain));
      }
    },
    'containing %': {
      topic: setupPackage({ subdomain: 'example%domain' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'containing @': {
      topic: setupPackage({ subdomain: 'example@domain' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'containing :': {
      topic: setupPackage({ subdomain: 'example:domain' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'end with number': {
      topic: setupPackage({ subdomain: 'c9' }),

      'should be valid': function (topic) {
        assert.ok(isValid('subdomain', topic.subdomain));
      }
    },
    'end with -': {
      topic: setupPackage({ subdomain: 'c9-' }),

      'should be invalid': function (topic) {
        assert.ok(!isValid('subdomain', topic.subdomain));
      }
    },
    'containing unicode(๛ಠ_ಠ☠☃❤⁂⍨⋙‽)': {
      topic: setupPackage({ subdomain: '๛ಠ_ಠ☠☃❤⁂⍨⋙‽' }),

      'should be valid': function (topic) {
        assert.ok(isValid('subdomain', topic.subdomain));
      }
    }
  }
});

suite.export(module);