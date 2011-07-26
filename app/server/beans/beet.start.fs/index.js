var fs = require('fs'),
	vine = require('vine');
	
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

exports.plugin = function(m)
{
	function getStartHandler(pull)
	{
		var handler = {
			test: function(script, callback)
			{
				var stat = lstat(script);
				
				callback((stat && stat.isDirectory()) || script.split('.').pop() == 'js');//false if doesn't exist on the fs.
			},
			load: function(script, callback)
			{
				var stat = lstat(script);
				
				if(stat.isDirectory())
				{
					var packagePath = script + '/package.json',
						pstat;

					console.log("G")
					if(pstat = lstat(packagePath))
					{
						var pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

							try
							{
								//abs path to the script
								pkg.main = fs.realpathSync(script + '/' + pkg.main);
							}catch(e)
							{
								return callback(vine.error('Unable to start %s', pkg.name));
							}
						console.log("CO")
							
						callback(vine.result({ name: pkg.name, path: script }));
					}
					else
					{
						callback(vine.error('A package.json file must be present.'));
					}
					return;
				}
				else
				{
					try
					{
						//abs path to the script
						script = fs.realpathSync(script);
					}catch(e)
					{
						return vine.error('Unable to start %s', pkg.name);
					}
					
					
					return callback(vine.result({ name: script.split('/').pop(), path: script }));
				}
				
				return callback(vine.error('The script must be a directory'));
			}
		}
		
		
		pull.end(handler);
	}
	
	m.on({
		'pull -multi beet/start/handler': getStartHandler
	})
}