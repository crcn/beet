var beanpole = require('beanpole'),
	Queue = require('sk/core/queue').Queue,
	q = new Queue(true),
	beet = require('../index');
	

var m = beanpole.require(['hook.core','hook.http']);

m.push('init');

q.add(function(){});

m.on({
	'push -public beet/ready': function()
	{
		setTimeout(q.getMethod('next'), 100);
	}
});

//need to wait until established with server
var _q = function(org, callback)
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
	
	return function()
	{
		var args = arguments;
		
		q.add(function()
		{
			org(args[0], function()
			{
				callback.apply(null, arguments);
				process.exit();
			});
		});
	}
}


exports.start = _q(beet.start);
exports.stop = _q(beet.stop);
exports.add = _q(beet.add);
exports.remove = _q(beet.remove);


exports.list = _q(beet.list, function(scripts)
{	
	scripts.result.forEach(function(script)
	{
		console.log('%s: %s', script.name.blue, script.running ? 'running'.green : 'stopped'.red );
	})
});


