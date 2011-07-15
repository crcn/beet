var Load = require('sk/node/balance').Load,
	vine = require('vine'),
	Structr = require('structr').Structr,
	Tiny = require('node-tiny');

exports.pod = function(m)
{
	var handlers = [],
		db,
		workers = {},
		ready = false;

	function toggleRunning(app, running, callback)
	{
		db.update(app, { running: running }, callback || function(){});
	}
	
	function stopWorker(appName, callback)
	{
		var w = workers[appName];
		
		
		if(w)
		{
			console.success('Stopping %s', appName);
			
			w.terminate(1);
			
			delete workers[appName];
			
			toggleRunning(appName, false, function()
			{
				setTimeout(callback, 500);
			})
			
		}
		else
		{
			callback();
		}
	}
	
	function startWorker(app)
	{
		var w = workers[app.name] = Load.worker(__dirname + '/worker.js').load(app);
		
		console.success('Running: %s', app.name);
		
		w.onError = function(e)
		{
			console.error(e);
		}
		
		toggleRunning(app.name, true);
		
		//start pinging the child and make sure it stays alive 
		if(false)
		w.keepAlive(function()
		{
			console.warning('Looks like worker has crashed, restarting.');
			
			delete workers[app.name];
			
			runScript(app);
		});
	}
	
	function runScript(app)
	{
		
		stopWorker(app.name, function()
		{
			startWorker(app);
		});
	}
	
	function addScript(pull)
	{
		var pullData = pull.data,
			toAdd = {};
		
		if(typeof pullData == 'string')
		{
			toAdd.path = pullData;
		}
		else
		{
			toAdd = { path: pullData.path || '', name: pullData.name, args: pullData.args };
		}
		
		for(var i = handlers.length; i--;)
		{
			var handler = handlers[i];
			
			if(handler.test(toAdd.path))
			{
				return handler.load(toAdd.path, function(data)
				{
					if(data.error()) return pull.callback(data);
					
					var info = data.result();
						
					info.name = (toAdd.name || info.name).toLowerCase();
					
					db.find({ name: info.name }, function(err, results)
					{
						function start()
						{
							startScript({ data: info.name, callback: function(){}});
						}
						
						if(results.length)
						{
							pull.callback(vine.warning('%s is already running, restarting', info.name));
							start();
						}
						
						if(typeof pullData == 'object')
						{
							info = Structr.copy(info, pullData);
						}
												
						db.set(info.name, info, function(err, ret)
						{ 
							pull.callback(vine.message('Successfully added %s, starting', info.name));
							start();
						});
					});
				});
			}
		}
		
		pull.callback(vine.error('unable to parse'));
	}
	
	function startScript(pull)
	{
		getApp({
			data: pull.data,
			callback: function(data)
			{
				if(data.error()) return pull.callback(data);
				
				var app = data.result();
				
				runScript(app);
				
				pull.callback(vine.message('Successfully started %s', app.name));
			}
		});
	}
	
	function restartScript(pull)
	{
		console.ok('Trying to restart %s', pull.data);
		
		getApp({
			data: pull.data,
			callback: function(data)
			{
				if(data.error()) return pull.callback(result);
				
				if(data.result().running) return pull.callback(vine.error('%s is not running', data.result().name));
				
				startScript(pull);
			}
		});
	}
	
	function removeScript(pull)
	{
		getApp({
			data: pull.data,
			callback: function(data)
			{
				if(data.error()) return pull.callback(data);
				
				var appName = data.result().name;
				
				console.ok('Removing %s', appName);
				
				stopScript(pull);
				
				db.remove(appName, function()
				{
					pull.callback(vine.message('Successfully removed %s', appName));
				})
			}
		});
	}
	
	function stopScript(pull)
	{
		var scriptName = pull.data;
		
		console.ok('stopping %s', scriptName);
		
		stopWorker(scriptName, function()
		{
			pull.callback(vine.message('Stopped %s', scriptName));
		})
	}
	
	function listScripts(pull)
	{
		db.all(function(err, results)
		{
			for(var i = results.length; i--;)
			{
				if(!results[i].name) results.splice(i,1);
			}
			
			pull.callback(vine.result(results));
		});
		
		/*var scripts = _scripts(),
			batch = [];
	
		for(var scriptName in scripts)
		{
			var inf = scripts[scriptName];
			
			batch.push({ name: scriptName, path: inf.path, running: inf.running });
		}
		
		pull.callback(vine.result(batch));*/
	}
	
	
	function init(dbPath)
	{
		
		Tiny(dbPath, function(err, d)
		{
			if(err) return console.error(err.stack);
			
			db = d;
			
			ready = true;
			
			m.push('beet.ready', true);
			
			
			d.all(function(err, results)
			{
				results.forEach(function(app)
				{
					if(app.running) runScript(app);
				})
			});
			
			
			m.pull('beet.start.handler', function(handler)
			{
				handlers.push(handler);
			});
		});
		
	}
	
	function onConnection(connection)
	{
		console.success('Client connected');
		connection.push('beet.ready');
	}
	
	function getApp(pull)
	{
		var s = pull.data,
		search;
		
		
		if(typeof s == 'string')
		{
			search = { name: s };
		}
		else
		if(s)
		{
			search = { name: s.name, $in : { 'tags': s.tags || [] }};
		}
		else
		return pull.callback(vine.error('app name not present'));
		
		db.find(search, function(err, results)
		{
			if(!results.length) return pull.callback(vine.error('%s does not exist', search.name));
			pull.callback(vine.result(results[0]));
		});
		
		/*var appName = pull.data,
			scripts = _scripts();
		
		for(var scriptName in scripts)
		{
			if(scriptName == appName) return pull.callback(vine.result(scripts[scriptName]));
		}*/
		
	}
	
	function isBeetReady(pull)
	{
		pull.callback(ready);
	}
	
	
	m.on({
		'push init': init,
		'push glue.connection': onConnection,
		'pull public beet.ready': isBeetReady,
		'pull public beet.add': addScript,
		'pull public beet.app': getApp,
		'pull public beet.remove': removeScript,
		'pull public beet.start': startScript,
		'pull public beet.restart': restartScript,
		'pull public beet.stop': stopScript,
		'pull public beet.list': listScripts
	});
}