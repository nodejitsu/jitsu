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
jitsu.alias('login',  { resource: 'users',  command: 'login' });
jitsu.alias('logout', { resource: 'users',  command: 'logout' });
jitsu.alias('signup', { resource: 'users',  command: 'create' });
jitsu.alias('whoami', { resource: 'users',  command: 'whoami' });
