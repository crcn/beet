var fs = require('fs');

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
			test: function(script)
			{
				return lstat(script);//false if doesn't exist on the fs.
			},
			load: function(script, callback)
			{
				var stat = lstat(script);
				
				if(stat.isDirectory())
				{
					var packagePath = script + '/package.json',
						pstat;

					if(pstat = lstat(packagePath))
					{
						var pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

							//abs path to the script
							pkg.main = fs.realpathSync(script + '/' + pkg.main);
							
						callback(false, { name: pkg.name, path: script });
					}
					else
					{
						callback('A package.json file must be present.');
					}
					return;
				}
				
				return callback('The script must be a directory');
			}
		}
		
		
		pull.callback(handler);
	}
	
	m.on({
		'pull beet.start.handler': getStartHandler
	})
}