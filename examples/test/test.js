var express = require('express'),
	qs  = require('querystring');


var srv = express.createServer();


srv.get('/', function(req, res)
{
	res.send('hello world!');
})


srv.post('/git/push/:name', function(req, res)
{
	var buffer = '';
	
	req.on('data', function(data)
	{
		buffer += data;
	});
	
	req.on('end', function()
	{
		var q = qs.parse(buffer);
		console.log();
		try
		{
			var commit = JSON.parse(decodeURIComponent(q.payload));
		}catch(e)
		{
			
		}
		
		
		console.log(commit)
	})
})


srv.listen(8888);