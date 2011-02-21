/*
 * jitsu.js: Top-level include for the jitsu module.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
require.paths.unshift(__dirname);

var jitsu = exports;

// Failure HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var failCodes jitsu.failCodes = {
  400: "Bad Request",
  404: "Item not found",
  500: "Internal Server Error"
};

// Success HTTP Response codes based
// off of `/lib/broodmother/slave/service.js`
var successCodes = jitsu.successCodes = {
  200: "OK",
  201: "Created"
};

jitsu.client = require('jitsu/client');
jitsu.apps   = require('jitsu/apps');