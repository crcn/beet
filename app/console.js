require('sk/node/log');

exports.handle = function(ops)
{
	if(ops.start)
	{
		exports.start(ops.start, ops.args || []);
	}
	else
	if(ops.add)
	{
		exports.add(ops.add, ops.name, ops.args || []);
	}
}

exports.start = function(name, args)
{
	require('./client').start({ name: name, args: args });
}

exports.stop = function(name)
{
	require('./client').stop(name);
}

exports.add = function(path, name, args)
{
	require('./client').add({ path: path, name: name, args: args });
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
	require('./server/upstart').start(__dirname + '/server/index.js', 8730, function()
	{
		
	});
}

exports.debug = function()
{
	require('./server');
}

exports.unload = function()
{
	require('./server/upstart').stop(function()
	{
		
	});
}