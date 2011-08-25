var http = require('http');

//
// START NODE KNOCKOUT TRACKING CODE
//

    //
    // Remark: This code MUST be required ONCE somewhere in your application for,
    // node knockout tracking to work.
    //
    require('./vendor/nko')({{knockoutcode}}, function(err, res) {
      if (err) {
        console.error('Error contacting Node Knockout servers:');
        console.error(err.stack);
      }
    });

//
//  END NODE KNOCKOUT TRACKING CODE
//


//
// Start up an http server
//
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>I\'m gonna node knock you out.</h1>');
}).listen(8080);