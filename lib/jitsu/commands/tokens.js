/*
 * tokens.js: Commands related to tokens from Nodejitsu.
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var jitsu = require('../../jitsu'),
    fs = require('fs'),
    utile = jitsu.common;

var tokens = exports;

tokens.usage = [
  '`jitsu tokens *` commands enable management of tokens',
  'Valid commands are:',
  '',
  'jitsu tokens list',
  'jitsu tokens create [<named-token>]',
  'jitsu tokens delete <tokenID>',
];



tokens.delete = function (tokenID, callback) {
  //
  // Allows arbitrary amount of arguments
  //
  if(arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    key      = args[0] || null;
  }

  if (key === null) {
    jitsu.log.error('No token ID specified.');
    return callback();
  } else {
    //delete key
  }
};

//
// Usage for `jitsu tokens delete <key>`
//
tokens.delete.usage = [
  'Deletes the specified token ID',
  '',
  'jitsu tokens delete <tokenID>'
];


tokens.create = function (username, tokenName, callback) {
  var authuser = jitsu.config.get('username') || '';

  if(arguments.length) {
    var args  = utile.args(arguments);
    callback  = args.callback;
    tokenName = args[1] || args[0];
    username = args[0] || authuser;
    if(tokenName === args[0]){
      username = authuser;
    }
  }
  
  if (authuser === '') {
    return jitsu.commands.users.login(function (err) {
      if (err) {
        return callback(err);
      }

      jitsu.commands.tokens.create(username, tokenName, callback);
    });
  }

  jitsu.log.info('Creating a token for ' + username.magenta);

  jitsu.tokens.create(username, tokenName,function cb(err, result) {
    if(err){
      callback(err);
    } else {
      //result = JSON.stringify(result);
      var token = Object.getOwnPropertyNames(result).filter(function(n){return n !== 'operation'}).pop();
      jitsu.log.info( 'Token Created: ');
      jitsu.log.data( token + ' : ' +  result[token]);
      callback();
    }
  });
};

//
// Usage for `jitsu tokens delete <key>`
//
tokens.create.usage = [
  'Creates the a token , optionally with a token name',
  '',
  'jitsu tokens create [<token-name>]'
];


tokens.list = function (username, callback) {
  var authuser = jitsu.config.get('username') || '';

  if(arguments.length) {
    var args = utile.args(arguments);
    callback = args.callback;
    username = args[0] || authuser;
  }

  if (authuser === '') {
    return jitsu.commands.users.login(function (err) {
      if (err) {
        return callback(err);
      }

      jitsu.commands.tokens.list(username, callback);
    });
  }

  jitsu.log.info('Listing all tokens for ' + username.magenta);

  jitsu.tokens.list(username, function cb(err, result) {
    if(err){
      callback(err);
    } else {
      var tokens = result.apiTokens;
      if (!tokens || Object.keys(tokens).length === 0) {
        jitsu.log.warn('No tokens exist.');
        jitsu.log.help('Try creating one with ' + 'jitsu tokens create'.magenta);
        return callback();
      }

      var rows = [['name', 'token']],
          colors = ['underline', 'underline'];
      Object.getOwnPropertyNames(tokens).sort().forEach(function (tokenName) {

        rows.push([
          tokenName,
          tokens[tokenName]
        ]);
      });

      jitsu.inspect.putRows('data', rows, colors);
      callback();
    }
  });

};


//
// Usage for `jitsu tokens list`
//
tokens.list.usage = [
  'Lists all tokens in the current user account',
  '',
  'jitsu tokens list'
];

