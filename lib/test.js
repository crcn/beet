var http = require('http');

var port = process.argv.pop();

console.log(port);

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
  console.log("HELLO WORLD!");
}).listen(port, "127.0.0.1");
