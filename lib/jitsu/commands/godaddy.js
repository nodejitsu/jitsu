'use strict';

/*
 * godaddy.js: Output the details about our GoDaddy acquisition
 *
 *
 * (C) 2015, Nodejitsu Inc.
 *
 */

var godaddy = module.exports = function go(callback) {
  var jitsu = this;

  jitsu.log.help();
  jitsu.log.help('All the things');
  jitsu.log.help();
  jitsu.log.info('Nodejitsu'.grey + ' ok'.green.bold);
};

godaddy.usage = [
  'Learn what the godaddy acquisitions means for you',
  '',
  'jitsu godaddy',
];

//
// The shutdown date of all the things.
//
godaddy.shutdown = '01 August 2015';

//
// ### function notice(jitsu)
// Prints the notice on top of each command
//
godaddy.notice = function notice(jitsu) {
  jitsu.log.warn();
  jitsu.log.warn('Nodejitsu has been acquired by '.bold + 'GoDaddy'.green.bold);
  jitsu.log.warn();
  jitsu.log.warn('Read more at: ' + 'https://nodejitsu.com/godaddy'.bold);
  jitsu.log.warn('Or run:       ' + 'jitsu godaddy'.bold);
  jitsu.log.warn();
};

//
// ### function disabled(jitsu)
// This method has been disabled.
//
godaddy.disabled = function disabled(jitsu, command) {
  jitsu.log.error();
  jitsu.log.error('The command `jitsu '+ command+'` has been disabled as we\'ve');
  jitsu.log.error('been acquired by GoDaddy. Run '+ 'jitsu godaddy'.cyan +' for more');
  jitsu.log.error('information or visit: https://nodejitsu.com/godaddy');
  jitsu.log.error();
  jitsu.log.info('Nodejitsu '.grey + 'not ok'.red.bold);
};
