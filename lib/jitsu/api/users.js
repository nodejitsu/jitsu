/*
 * users.js: Client for the Nodejitsu users API.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var util = require('util'),
    winston = require('winston'),
    jitsu = require('jitsu');
    
//
// ### function Users (options)
// #### @options {Object} Options for this instance
// Constructor function for the Users resource responsible
// with Nodejitsu's Users API
//
var Users = exports.Users = function (options) {
  jitsu.api.Client.call(this, options);
};

// Inherit from Client base object
util.inherits(Users, jitsu.api.Client);

//
// ### function auth (callback)
// #### @callback {function} Continuation to pass control to when complete
// Tests the authentication of the user identified in this process.
//
Users.prototype.auth = function (callback) {
  this.request('GET', ['auth'], callback, function (res, body) {
    callback(null, true);
  });
};

//
// ### function create (user, callback) 
// #### @user {Object} Properties for the new user.
// #### @callback {function} Continuation to pass control to when complete
// Creates a new user with the properties specified by `user`.
//
Users.prototype.create = function (user, callback) {
  this.request('POST', ['users', user.username], user, callback, function (res, result) {
    callback();
  });
};

//
// ### function available (username, callback) 
// #### @username {string} Username to check availability for.
// #### @callback {function} Continuation to pass control to when complete
// Checks the availability of the specified `username`.
//
Users.prototype.available = function (username, callback) {
  this.request('GET', ['users', username, 'available'], callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function create (user, callback) 
// #### @user {Object} Properties for the user to confirm.
// #### @callback {function} Continuation to pass control to when complete
// Confirms the specified `user` by sending the invite code in the `user` specified.
//
Users.prototype.confirm = function (user, callback) {
  this.request('POST', ['users', user.username, 'confirm'], user, callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function forgot (username, callback) 
// #### @user {Object} username requesting password reset.
// #### @callback {function} Continuation to pass control to when complete
// request an password reset email.
//
Users.prototype.forgot = function (username, callback) {
  this.request('POST', ['users', username, 'forgot'], {}, callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function isAvailable (username, callback)
// #### @user {String} the username to check if its available
// #### @callback {function} Continuation to pass control to when complete
// check if the username is available
//
Users.prototype.isAvailable = function (username, callback) {
  this.request('GET', ['users', username, 'available'], null, callback, function (res, result) {
    callback(null, result);
  });
};

//
// ### function submit (username, email, password, callback)
// #### @user {String} the username to create
// #### @email {String} the user's email
// #### @password {String} the user's password
// #### @callback {function} Continuation to pass control to when complete
// try and create a username
//
Users.prototype.submit = function (username, email, password, callback) {
  var options =  {
    username: username,
    email: email,
    password: password
  };

  this.request('POST', ['users', username], options, callback, function (res, result) {
    callback(null, result);
  });
};
