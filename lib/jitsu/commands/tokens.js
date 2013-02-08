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
  'jitsu tokens list [<user>]',
  'jitsu tokens create [[<user>] <token name>]',
  'jitsu tokens destroy [<user>] <token name>',
];



tokens.destroy = function (username, tokenName, callback) {
  var authuser = jitsu.config.get('username') || '';

  if(arguments.length) {
    var args  = utile.args(arguments);
    callback  = args.callback;
    tokenName = args[1] || args[0];
    username = args[0] || authuser;
    if(tokenName === args[0]){
      username = authuser;
    }
    if(tokenName === null || tokenName === undefined){
      jitsu.log.warn("You need to specify a token ID or name.")
      return callback();
    }
  }
  
  if (authuser === '') {
    return jitsu.commands.users.login(function (err) {
      if (err) {
        return callback(err);
      }

      jitsu.commands.tokens.destroy(username, tokenName, callback);
    });
  }

  jitsu.log.info('Deleting token '+ tokenName.yellow +' for ' + username.magenta);

  jitsu.prompt.get([{name:'password', hidden:true}], function(err, result){
    if (err) {
      jitsu.log.error('Prompt error:');
      return callback(err);
    }
    jitsu.config.set('password', result['password']);
    jitsu.tokens.destroy(username, tokenName,function cb(err, result) {
      if(err){
        callback(err);
      } else {
        jitsu.config.clear('password');
        jitsu.log.info( 'Token '+ tokenName.yellow +' Destroyed!');
        callback(null, tokenName);
      }
    });
  });
};

//
// Usage for `jitsu tokens delete <key>`
//
tokens.destroy.usage = [
  'Deletes the specified token ID',
  '',
  'jitsu tokens destroy [<user>] <token name>'
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

  jitsu.prompt.get([{name:'password', hidden:true}], function(err, result){
    if (err) {
      jitsu.log.error('Prompt error:');
      return callback(err);
    }
    jitsu.config.set('password', result['password']);
    jitsu.tokens.create(username, tokenName,function cb(err, result) {
      if(err){
        callback(err);
      } else {
        jitsu.config.clear('password');
        var token = Object.getOwnPropertyNames(result).filter(function(n){return n !== 'operation'}).pop();
        jitsu.log.info( 'Token Created: ');
        jitsu.log.data( token + ' : ' +  result[token]);
        callback(null, token, result[token]);
      }
    });
  });
};

//
// Usage for `jitsu tokens create [[<user>] <token name>]`
//
tokens.create.usage = [
  'Creates a token , optionally with a token name',
  '',
  'jitsu tokens create [[<user>] <token name>]'
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
  jitsu.prompt.get([{name:'password', hidden:true}], function(err, result){
    if (err) {
      jitsu.log.error('Prompt error:');
      return callback(err);
    }
    jitsu.config.set('password', result['password']);
    jitsu.tokens.list(username, function cb(err, result) {
      if(err){
        callback(err);
      } else {
        jitsu.config.clear('password');
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
  });

};


//
// Usage for `jitsu tokens list`
//
tokens.list.usage = [
  'Lists all tokens in the user account',
  '',
  'jitsu tokens list [<user>]'
];

