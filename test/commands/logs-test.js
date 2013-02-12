/*
 * logs-test.js: Tests for `jitsu logs *` commands.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var nock = require('nock'),
    assert = require('assert'),
    vows = require('vows'),
    path = require('path'),
    fs = require('fs'),
    jitsu = require('../../lib/jitsu'),
    macros = require('../helpers/macros');

var shouldNodejitsuOk = macros.shouldNodejitsuOk,
    useAppFixture = macros.useAppFixture;

var mainDirectory = process.cwd();


var fixturesDir = path.join(__dirname, '..', 'fixtures'),
    loggedOutFile = path.join(fixturesDir, 'logged-out-jitsuconf')
    loggedOutConf = fs.readFileSync(loggedOutFile, 'utf8');

// Snapshots tests with specified app names
vows.describe('jitsu/commands/logs').addBatch({
  'logs': shouldNodejitsuOk(function setup() {

    useAppFixture();
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/example-app', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:example-app',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs': shouldNodejitsuOk('should prompt for credentials', function setup() {

    useAppFixture();

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/example-app', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:example-app',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app': shouldNodejitsuOk(function setup() {

    useAppFixture();
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/example-app', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:example-app',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app': shouldNodejitsuOk('should prompt for credentials', function setup() {

    useAppFixture();

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/example-app', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'example-app',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:example-app',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' })
  }, function assertion (err) {
    process.chdir(mainDirectory);
    assert.ok(!err);
  })
}).addBatch({
  'logs app application': shouldNodejitsuOk(function setup() {
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/application', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:application',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'logs app application': shouldNodejitsuOk('should prompt for credentials', function setup() {

    jitsu.config.stores.file.file = loggedOutFile;
    jitsu.config.stores.file.loadSync();

    jitsu.prompt.override.username = 'tester';
    jitsu.prompt.override.password = 'EXAMPLE-PASSWORD';
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/application', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: 100
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:application',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).addBatch({
  'logs app application 10': shouldNodejitsuOk(function setup() {
    
    nock('https://api.mockjitsu.com')
      .post('/logs/tester/application', {
        from: "NOW-1DAY",
        until: "NOW",
        rows: "10"
      })
        .reply(200, {
          data: [
            {
              isjson: true,
              timestamp: '2012-12-21T02:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is a message on stderr',
                level: 'info',
                event: 'drone:stderr',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T01:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is also a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },
            {
              isjson: true,
              timestamp: '2012-12-21T00:00:00.000z',
              inputid: '5656',
              json: {
                app: 'application',
                message: 'This is a message',
                level: 'info',
                event: 'drone:stdout',
                user: 'tester'
              }
            },

          ],
          numFound: 3,
          context: {
            rows: '50',
            from: 'NOW-1DAY',
            until: 'NOW',
            start: 0,
            query: 'json.user:tester AND json.app:application',
            order: 'desc'
          }
        }, { 'x-powered-by': 'Nodejitsu' });
  })
}).export(module);
