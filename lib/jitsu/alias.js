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
jitsu.alias('cloud',   { resource: 'apps',   command: 'cloud' });
jitsu.alias('destroy', { resource: 'apps',   command: 'destroy' });
jitsu.alias('deploy',  { resource: 'apps',   command: 'deploy' });
jitsu.alias('publish', { resource: 'apps',   command: 'deploy' });
jitsu.alias('d',       { resource: 'apps',   command: 'deploy' });
jitsu.alias('push',    { resource: 'apps',   command: 'deploy' });
jitsu.alias('list',    { resource: 'apps',   command: 'list' });
jitsu.alias('ls',      { resource: 'apps',   command: 'list' });
jitsu.alias('l',       { resource: 'apps',   command: 'list' });
jitsu.alias('view',    { resource: 'apps',   command: 'view' });
jitsu.alias('v',       { resource: 'apps',   command: 'view' });
jitsu.alias('stop',    { resource: 'apps',   command: 'stop' });
jitsu.alias('start',   { resource: 'apps',   command: 'start' });
jitsu.alias('restart', { resource: 'apps',   command: 'restart' });
jitsu.alias('forgot',  { resource: 'users',  command: 'forgot' });
