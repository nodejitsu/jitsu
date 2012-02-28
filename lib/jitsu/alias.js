/*
 * alias.js: Aliases commands for jitsu.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var jitsu = require('../jitsu');

//
// Alias the appropriate commands for simplier CLI usage
//
jitsu.alias('create', { resource: 'apps',   command: 'create' });
jitsu.alias('deploy', { resource: 'apps',   command: 'deploy' });
jitsu.alias('list',   { resource: 'apps',   command: 'list' });