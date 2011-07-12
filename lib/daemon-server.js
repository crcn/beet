require('sk/node/log');

var upstart = require('./upstart'),
Structr = require('structr').Structr,
ws = require('websocket-server'),
fs = require('fs'),
wsmsg = require('./wsmsg'),
dirty = require('sk/node/settings/dirty').dirty,
_settings = dirty('/data/beet/config.json'),
sockPath = '/tmp/beet';

var Settings = {
	'start': function(server)
	{
		
	},
	'stop': function(server)
	{
		
	}
}


function spawn()
{
	var srv = ws.createServer({ debug: true });
	
	srv.addListener('connection', function(s)
	{
		wsh = wsmsg.build(s, {
			'start': function(data)
			{
				console.log(data)
				console.log("ADD SERVER");
				// Settings.addServer
			}
		})
		
		s.addListener('message', wsh.read)
	});
	
	try
	{
		fs.unlinkSync(sockPath);
	}
	catch(e)
	{
		
	}
	
	srv.listen(sockPath);
	
}


spawn();