/*
 * base64.js: An extremely simple implementation of base64 encoding / decoding using node.js Buffers
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */

var base64 = exports;

//
// ### function encode (unencoded)
// #### @unencoded {string} The string to base64 encode
// Encodes the specified string to base64 using node.js Buffers.
//
base64.encode = function (unencoded) {
  return new Buffer(unencoded || '').toString('base64');
};

//
// ### function decode (encoded)
// #### @encoded {string} The string to base64 decode
// Decodes the specified string from base64 using node.js Buffers.
//
base64.decode = function (encoded) {
  return new Buffer(encoded || '', 'base64').toString('utf8');
};