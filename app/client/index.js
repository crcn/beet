var brazln = require('brazln'),
	Queue = require('sk/core/queue').Queue,
	q = new Queue(true);
	

var m = brazln.require(['glue.core','glue.http']);

m.push('init');

q.add(function(){});

m.on({
	'push glue.connection': function()
	{
		// q.next();
		setTimeout(q.getMethod('next'), 100);
	}
});

//need to wait until established with server
var _q = function(callback)
{
	return function()
	{
		var args = arguments;
		
		q.add(function()
		{
			callback.apply(null, args);
		});
	}
}

var _pull = function(type, callback)
{
	if(!callback)
	{
		callback = function(msg)
		{
			if(msg.errors)
			{
				msg.errors.forEach(function(err)
				{
					console.error(err.message);
				})
			}
			else
			if(msg.message)
			{
				console.success(msg.message);
			}
			
		}
	}
	
	return _q(function(data)
	{
		m.pull(type, data, function()
		{
			callback.apply(null, arguments);
			process.exit();
		});
	});
}


exports.start = _pull('beet.start');
exports.stop = _pull('beet.stop');
exports.add = _pull('beet.add');
exports.remove = _pull('beet.remove');


exports.list = _pull('beet.list', function(scripts)
{	
	
	scripts.result.forEach(function(script)
	{
		console.log('%s: %s', script.name.blue, script.running ? 'running'.green : 'stopped'.red );
	})
});


