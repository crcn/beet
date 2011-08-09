var beanpole = require('beanpole'),
	child_process = require('child_process'),
	path = require('path');
	
	
var oldExit = process.exit,
	cp;


	
function spawn(ops)
{
	var binPath = ops.binPath.replace(/\s/g,'');
	
	var args = ops.args || [];
	
	// args.unshift('./'+binPath.split('/').pop());
	
	
	
	// cp = child_process.spawn('sudo', ops.args, { cwd: path.dirname(binPath) });
	cp = child_process.spawn(binPath, args, { cwd: path.dirname(binPath) });
	cp.stdout.on('data', function(data)
	{
		data.toString().split(/[\n\r]/g).forEach(function(msg)
		{
			if(msg.length)
			console.log(msg);
		})
	});
	
	cp.stderr.on('data', function(err)
	{
		console.error(err.toString());
	});
	
	cp.on('exit', function(code)
	{
		cp = null;
		
		if(code) setTimeout(function()
		{
			spawn(ops)
		},5000);
	})
}

beanpole.pull('beet/app/ops', spawn);

beanpole.on({
	'pull -multi add/exit/handler': function(pull)
	{
		pull.end({
			exit: function(callback)
			{
				if(!cp) return callback();
				
				cp.on('exit', function()
				{
					callback();
				});
				
				cp.kill('SIGHUP');
			}
		});
	}
})

beanpole.push('init');
