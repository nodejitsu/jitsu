var assert = require('assert')
  , subtree = require('./assert-subtree').subtree;
var MockRequest = exports.MockRequest = function (options) {
  options = options || {};
  
  this.mocks    = [];
  this.current  = null;
  this.protocol = options.protocol || 'http';
  this.port     = options.port || 80; 
  this.host     = this.protocol + '://' + (options.host || 'mock-request');
  this.defaults = {
    statusCode: 200,
    headers: options.headers || {}
  }
  
  if (this.port !== 433 && this.port !== 80) {
    this.host += ':' + this.port
  }
};

exports.mock = function (options) {
  return new MockRequest(options);
};

MockRequest.prototype.request = function (method, path, body, headers) {
  if (this.current && !this.current.response) {
    this.respond();
  }
  else if (this.current) {
    this.mocks.push(this.current);
    this.current = null;
  }
  
  if (!path.slice(0) === '/') {
    path = '/' + path;
  }
  
  var current = {
    request: {
      method: method,
      uri: this.host + path
    }
  };
  
  if (body) {
    current.request.body = JSON.stringify(body);
  }
  
  function addHeaders (target) {
    current.request.headers = current.request.headers || {};
    Object.keys(target).forEach(function (header) {
      current.request.headers[header] = target[header];
    });
  }
  
  if (this.defaults['headers']) {
    addHeaders(this.defaults['headers']);
  }
  
  if (headers) {
    addHeaders(headers);
  }
  
  this.current = current;
  
  return this;
};

MockRequest.prototype.get = function (path, headers) {
  return this.request('GET', path, null, headers);
};

MockRequest.prototype.post = function (path, body, headers) {
  return this.request('POST', path, body, headers);
};

MockRequest.prototype.put = function (path, body, headers) {
  return this.request('PUT', path, body, headers);
};

MockRequest.prototype.del = function (path, body, headers) {
  return this.request('DELETE', path, body, headers);
};

MockRequest.prototype.respond = function (response) {
  var self = this;
  
  //
  // Setup the defaults in the mock response
  //
  response = response || {};
  response.statusCode = response.statusCode || this.defaults.statusCode;
  
  if (response.body) {
    response.body = JSON.stringify(response.body);
  }
  
  if (!this.current) {
    throw new Error('Cannot mock response without a request');
  }
  
  this.current.response = response;
  this.mocks.push(this.current);
  this.current = null;
  
  return this;
};

MockRequest.prototype.run = function () {
  var self = this,
      length = this.mocks.length,
      count = 0;
  
  if (this.current && !this.current.response) {
    this.respond();
  }

  return function (actual, callback) {
    //
    // Grab the next mock request / response object.
    //
    var next = self.mocks.shift();
    
    if (!next) {
      throw new Error('Too many calls to _request. Expected: ' + length + ' Got: ' + count);
    }
    
    //
    // Increment the number of mock calls
    //
    count += 1;

    try {
      assert.equal(actual.uri, next.request.uri);
      //
      // Check that request was made with at least the required headers.
      // extra headers do not cause the test to fail.
      //
      subtree(actual.headers, next.request.headers);

    }
    catch (ex) {
      console.log('\nmismatch in remote request :\n')
      console.dir(actual);
      console.dir(next.request);
      throw ex;
    }
    
    callback(null, { statusCode: next.response.statusCode }, next.response.body);
    
    return {
      on: function () { }, 
      emit: function () { }, 
      removeListener: function () { }, 
      end: function () { } 
    };
  }
};