require('sk/node/log');


exports.start = function(name)
{
	require('./client').start(name);
}

exports.stop = function(name)
{
	require('./client').stop(name);
}

exports.add = function(path)
{
	require('./client').add(path);
}

exports.remove = function(name)
{
	require('./client').remove(name);
}


exports.list = function()
{
	require('./client').list();
}

exports.load = function()
{
	require('./server/upstart').start(__dirname + '/server/index.js', 59300, function()
	{
		
	});
}

exports.unload = function()
{
	require('./server/upstart').stop(function()
	{
		
	});
}