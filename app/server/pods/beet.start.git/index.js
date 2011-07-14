var qs = require('querystring'),
	exec = require('child_process').exec,
	fs= require('fs'),
	vine = require('vine');




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
			var bauth = repo.split('@');
			var u = bauth.shift();
			
			if(!bauth.length)
			{
				repo = repo.replace('://','://u:p@')
			}
			else
			if(u.search(/\w+:\w+/) == -1)
			{
				repo = repo.replace(u, u + ':p');
			}
		}
		
		var projectName = repo.split('/').pop().split('.').shift();
		
		console.log(repo)
		
		
		exec('sudo rm -rf '+gitDir(projectName)+'; mkdir -p '+gitDir()+'; cd '+gitDir()+'; git clone '+repo+'; cd '+projectName+';', function(err, result)
		{
			exec('sudo cd '+ gitDir(projectName)+'; npm link;', function()
			{
				if(err) return callback(vine.error(err));
				
				return callback(vine.result({ path: '/data/beet/git/' + projectName, name: projectName, repo: repo }));
			})
		});
	}
	
	function pullRepo(appName)
	{
		console.ok('Pulling %s', appName);
		
		console.log(gitDir(appName));
		
		exec('sudo git pull; npm link;', { cwd: gitDir(appName) }, function(err, result)
		{
			console.log(result);
			console.log(err);
			
			m.pull('beet.restart', appName, function()
			{
				
			})
			
			if(err) return console.error(err);
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