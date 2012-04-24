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
jitsu.alias('create',  { resource: 'apps',   command: 'create' });
jitsu.alias('deploy',  { resource: 'apps',   command: 'deploy' });
jitsu.alias('list',    { resource: 'apps',   command: 'list' });
jitsu.alias('forgot',  { resource: 'users',  command: 'forgot' });
jitsu.alias('view',    { resource: 'apps',   command: 'view' });
jitsu.alias('stop',    { resource: 'apps',   command: 'stop' });
jitsu.alias('start',   { resource: 'apps',   command: 'start' });
jitsu.alias('restart', { resource: 'apps',   command: 'restart' });