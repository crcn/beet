var WebSocket = require('websocket-client').WebSocket,
	wsmsg = require('./wsmsg');

require('sk/node/log');

exports.start = function()
{
	var ws = new WebSocket('ws+unix:///tmp/beet','boffo'),
		wsh = wsmsg.build(ws);
		
	
	ws.addListener('message', wsh.read);
	
	ws.addListener('open', function()
	{
		wsh.send('start', __dirname + '/test.js');
	});
	
	ws.addListener('wserror', function(e)
	{
		console.error('Cannot connect to beet.');
	})
}

exports.start()
