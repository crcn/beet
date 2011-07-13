var express = require('express');


var srv = express.createServer();

srv.get('/', function(req, res)
{
	res.send('hello world!');
})


srv.listen(3004);