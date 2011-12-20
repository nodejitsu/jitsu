/*
 * prompt.js: Tools for interacting with a prompt in the jitsu CLI.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var properties = exports;

properties.properties = {
  email: {
    name: 'email',
    validator: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
    warning: 'Must be a valid email address'
  },
  password: {
    name: 'password',
    hidden: true
  },
  'set password': {
    name: 'set password',
    hidden: true
  },
  'confirm password': {
    name: 'confirm password',
    hidden: true
  },
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
  username: {
    name: 'username',
    validator: /^[\w|\-]+$/,
    warning: 'Username can only be letters, numbers, and dashes'
  },
  reset: {
    name: 'request password reset',
    validator: /y[es]?|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no'
  },
  destroy: {
    name: 'destroy',
    message: 'This operation cannot be undone, Would you like to proceed?',  
    default: 'yes'
  },
  yesno: {
    name: 'are you sure?',
    validator: /y[es]?|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'no'
  },
  "start_local": {
    name: 'start_local',
    message: 'Would you like to start this application locally?',
    validator: /y[es]?|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'yes'
  },
  login: {
    name: 'login',
    message: '(yes/no)',
    validator: /^y[yes]+|n[no]+/,
    warning: 'Must answer yes or no.',
    default: 'yes'
  }
};
