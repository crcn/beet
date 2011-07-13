var qs = require('querystring'),
	exec = require('child_process').exec,
	fs= require('fs');




exports.pod = function(m)
{
	function gitDir(appName)
	{
		return '/data/beet/git/'+(appName || '');
	}
	
	function cloneRepo(repo, callback)
	{
		// if(!directory) directory = 'init';
		
		//http? check to make sure a password is present- bash will ask for one.
		if(repo.indexOf('://') > -1)
		{
			var u = repo.split('@').shift();
			
			//blank? add a blank password :3
			if(u.search(/\w+:\w+/) == -1)
			{
				repo = repo.replace(u, u + ':pw');
			}
		}
		
		var projectName = repo.split('/').pop().split('.').shift();
		
		exec('rm -rf '+gitDir(projectName)+'; mkdir -p '+gitDir()+'; cd '+gitDir()+'; git clone '+repo+'; cd '+projectName+'; npm link;', function(err, result)
		{
			if(err) return callback(err);
			
			return callback(false, { path: '/data/beet/git/' + projectName, name: projectName, repo: repo });
		});
	}
	
	function pullRepo(appName)
	{
		console.ok('Pulling %s', appName);
		
		exec('cd '+gitDir(appName)+'; git pull; npm link;', function(err, result)
		{
			if(err) return console.error(err);
			
			m.pull('beet.restart', appName, function()
			{
				
			})
		});
	}
	
	function getStartHandler(pull)
	{
		var handler = {
			test: function(value)
			{
				return value.indexOf('.git') > -1;
			},
			load: function(value, callback)
			{
				cloneRepo(value, callback);
			}
		}
		
		pull.callback(handler);
	}
	
	
	function getRoutes(pull)
	{
		var routes = {
			post: [
			{
				uri: '/git/push/:appName',
				callback: function(req, res)
				{
					var buffer = '';

					req.on('data', function(data)
					{
						buffer += data;
					});

					req.on('end', function()
					{
						var q = qs.parse(buffer);
						
						try
						{
							var commit = JSON.parse(decodeURIComponent(q.payload));
						}catch(e)
						{

						}
						
						if(commit)
						{
							// console.log(commit)
						}
						
						pullRepo(req.params.appName);
						
						
						res.send({ message:'ok!' });
					});
				}
			}
			]
		}
		
		pull.callback(routes);
	}
	
	m.on({
		'pull beet.start.handler': getStartHandler,
		'pull express.routes': getRoutes
	})
}