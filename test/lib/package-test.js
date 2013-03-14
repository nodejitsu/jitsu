/*
 * apps-test.js: Tests for `jitsu apps *` command(s).
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    vows = require('vows'),
    jitsu = require('../../lib/jitsu');

var mainDirectory = process.cwd();

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

var suite = vows.describe('jitsu/package').addBatch({
  'name': {
    'starting with .': {
      topic: setupPackage({ name: '.example-app' }),

      'should be invalid': function (topic) {
        assert.ok(isValid('name', topic.name));
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
    'containing .': {
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
    }
  }
});

suite.export(module);