/*
 * ui.js: Simple alias to jitsu-ui.
 *
 * (C) 2012, Nodejitsu Inc.
 *
 */

module.exports = function (callback) {
  var spawn = require('child_process').spawn;

  process.stdin.pause();

  //
  // TODO: Do some more searching here.
  //
  var ps = spawn('jitsu-ui', process.argv.slice(3), {
    cwd: process.cwd(),
    env: process.env,
    setsid: false,
    customFds: [0, 1, 2]
  });

  ps.on('exit', function (code) {
    process.stdin.resume();
    return callback();
  });
};

module.exports.usage = [
  'Runs jitsu-ui if installed.',
  '',
  'jitsu ui',
];
