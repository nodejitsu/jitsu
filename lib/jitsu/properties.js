/*
 * properties.js: Properties for the prompts in jitsu
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

module.exports = {
  inviteCode: {
    name: 'invite code',
    message: 'Invite Code',
    validator: /^\w+$/,
    warning: 'Invite code can only be letters, and numbers'
  },
  askstarter: {
    name: 'askstarter',
    message: 'Would you like to use a node app? (recommended)',
    default: 'yes'
  },
  appname: {
    name: 'appname',
    message: 'Please enter the name you would like to use for your app',
    default: 'myapp'
  },
  snapshot: {
    name: 'snapshot',
    message: 'Snapshot Name',
    validator: /^[\w|\-|\.]+$/,
    warning: 'Snapshot can only be letters, numbers, dashes, and dots',
    default: (function () {
      return '';
    })()
  },
  starter: {
    name: 'starter',
    message: 'Which node app would you like to install?',
    default: 'helloworld'
  },
  proceed: {
    name: 'proceed',
    message: 'Proceed anyway?',
    default: 'no',
    validator: /^y[es]*|n[o]?$/
  },
  yesno: {
    name: 'yesno',
    message: 'are you sure?',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no'
  },
  "start_local": {
    name: 'start_local',
    message: 'Would you like to start this application locally?',
    validator: /y[es]?|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'yes'
  }
};
