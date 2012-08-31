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
    message: 'Use a node app? (recommended)',
    default: 'yes'
  },
  appname: {
    name: 'appname',
    message: 'Name of the app',
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
    message: 'Which node app to install?',
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
    message: 'Start this application locally?',
    validator: /y[es]?|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'yes'
  }
};
