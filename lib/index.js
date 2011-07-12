require('sk/node/log');

var daemonServer = require('./daemon-server'),
	daemonClient = require('./daemon-client'),
	upstart = require('./upstart');


exports.start = function(script)
{
	// daemon.start();
}

exports.stop = function(nameOrPID)
{
	
}

exports.load = function()
{
	upstart.start(__dirname + '/daemon-server.js', 80425, function()
	{
		
	});
}

exports.unload = function()
{
	upstart.stop();
}

exports.list = function()
{
	
}