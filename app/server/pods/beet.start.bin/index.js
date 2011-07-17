var fs = require('fs'),
	vine = require('vine'),
	exec = require('child_process').exec;
	
function lstat(path)
{
	try
	{
		return fs.lstatSync(path);
	}
	catch(e)
	{
		return false;
	}
}

exports.pod = function(m)
{
	function getStartHandler(pull)
	{
		var handler = {
			test: function(script, callback)
			{
				if((stat = lstat(script)) && stat.isFile()) return callback(script);
				
				exec('which '+script, function(err, script)
				{
					callback(!!script ? script.replace('\n','') : null);
				});
			},
			load: function(script, callback)
			{
				handler.test(script, function(script)
				{
					callback(vine.result({ name: script.split('/').pop(), path: __dirname + '/bin', binPath: script }));
				});
			}
		}
		
		
		pull.callback(handler);
	}
	
	m.on({
		'pull beet.start.handler': getStartHandler
	});
}