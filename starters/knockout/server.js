
var http = require('http');

require('./vendor/nko')({{knockoutcode}}, function(err, res) {
  if (err) {
    console.error('Error contacting Node Knockout servers:');
    console.error(err.stack);
  }
});

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>I know Nodejitsu!</h1>');
}).listen(8080);