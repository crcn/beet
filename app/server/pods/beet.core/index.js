var Load = require('sk/node/balance').Load,
	vine = require('vine');
	

exports.pod = function(m)
{
	var handlers = [],
		settings,
		workers = {};
	
	function _scripts(v)
	{
		if(!v)
		return settings.get('scripts') || {};
		
		settings.set('scripts', v);
	}
	
	function stopWorker(name, callback)
	{
		var w = workers[name];
		if(w)
		{
			console.success('Stopping %s', name);
			
			w.terminate();
			
			delete workers[name];
			
			var s = _scripts();
			s[name].running = false;
			_scripts(s);
			
			setTimeout(callback, 500);
		}
		else
		{
			callback();
		}
	}
	
	function startWorker(name, path)
	{
		var w = workers[name] = Load.worker(__dirname + '/worker.js').load({ name: name, path: path })
		console.success('Running: %s', name);
		
		w.onError = function(e)
		{
			console.error(e);
		}
		
		var s = _scripts();
		s[name].running = true;
		_scripts(s);
		
		//start pinging the child and make sure it stays alive 
		w.keepAlive(function()
		{
			delete workers[name];
			
			startWorker(name, path);
		});
	}
	
	function runScript(name, path)
	{
		stopWorker(name, function()
		{
			startWorker(name, path);
		});
	}
	
	function addScript(pull)
	{
		for(var i = handlers.length; i--;)
		{
			var handler = handlers[i];
			
			if(handler.test(pull.data))
			{
				return handler.load(pull.data, function(data)
				{
					if(data.error()) return pull.callback(data);
					
					var scripts = _scripts(),
						info = data.result();
					
					info.name = info.name.toLowerCase();
					
					if(scripts[info.name] || scripts[info.path]) return pull.callback(vine.error('%s is already running', info.name));
					
					scripts[info.name] = info;
					
					settings.set('scripts', scripts);
					
					pull.callback(vine.message('Successfully added %s', info.name));
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
				
				runScript(app.name, app.path);
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
				
				console.ok('Removing %s', data.result().name);
				
				stopScript(pull);
				
				var sc = _scripts();
				delete sc[data.result().name];
				
				_scripts(sc);
				
				pull.callback(vine.message('Successfully removed %s', data.result().name));
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
		var scripts = _scripts(),
			batch = [];
	
		for(var scriptName in scripts)
		{
			var inf = scripts[scriptName];
			
			batch.push({ name: scriptName, path: inf.path, running: inf.running });
		}
		
		pull.callback(vine.result(batch));
	}
	
	
	function init(s)
	{
		settings = s;
		
		var scripts = _scripts();
		
		for(var scriptName in scripts)
		{
			if(scripts[scriptName].running)
			runScript(scriptName, scripts[scriptName].path);
		}
		
		m.pull('beet.start.handler', function(handler)
		{
			handlers.push(handler);
		});
	}
	
	function onConnection()
	{
		console.success('Client connected');
	}
	
	function getApp(pull)
	{
		var appName = pull.data,
			scripts = _scripts();
		
		
		for(var scriptName in scripts)
		{
			if(scriptName == appName) return pull.callback(vine.result(scripts[scriptName]));
		}
		
		return pull.callback(vine.error('%s does not exist', appName));
	}
	
	
	m.on({
		'push init': init,
		'push glue.connection': onConnection,
		'pull public beet.add': addScript,
		'pull public beet.app': getApp,
		'pull public beet.remove': removeScript,
		'pull public beet.start': startScript,
		'pull public beet.restart': restartScript,
		'pull public beet.stop': stopScript,
		'pull public beet.list': listScripts
	});
}