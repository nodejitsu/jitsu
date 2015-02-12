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
  jitsu.log.help('We are excited to join GoDaddy to help spearhead their largest Node.js product:');
  jitsu.log.help('Website Builder. As a part of this Nodejitsu will help existing customers');
  jitsu.log.help('transition onto new solutions for their hosting needs until early August 2015.');
  jitsu.log.help('Be sure you have migrated your applications off of Nodejitsu before the end of');
  jitsu.log.help('the transition period or you may encounter permenant data loss.');
  jitsu.log.help();
  jitsu.log.help('I am an existing Nodejitsu customer. What does this mean for me?');
  jitsu.log.help();
  jitsu.log.help('As an operations company, we know that our services are critical to the');
  jitsu.log.help('operation of our customers’ businesses. Because of this, we are doing two');
  jitsu.log.help('things:');
  jitsu.log.help();
  jitsu.log.help('1. Continuing to operate all of our products for seven months to ensure everyone');
  jitsu.log.help('   has adequate time for any and all changes related to the transition.');
  jitsu.log.help('2. Devoting the necessary support resources during the transition period to ensure');
  jitsu.log.help('   all of our customers can have their questions answered.');
  jitsu.log.help();
  jitsu.log.help('Read more at:  ' + 'https://nodejitsu.com/godaddy'.bold.green);
  jitsu.log.help('Press release: ' + 'https://www.nodejitsu.com/company/press/2015/02/10/nodejitsu-joins-godaddy/'.bold.green);
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
