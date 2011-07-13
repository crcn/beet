var Load = require('sk/node/balance').Load;

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
				return handler.load(pull.data, function(err, info)
				{
					if(err) return pull.callback(err);
					
					var scripts = _scripts();
					
					if(scripts[info.name] || scripts[info.path]) return pull.callback('Script already running.');
					
					scripts[info.name] = info;
					
					settings.set('scripts', scripts);
					
					pull.callback('Successfuly started script.');
				});
			}
		}
		
		pull.callback('unable to parse');
	}
	
	function startScript(pull)
	{
		getApp({
			data: pull.data,
			callback: function(app)
			{
				if(!app) return pull.callback('app does not exist');
				
				runScript(app.name, app.path);
				pull.callback('success');
			}
		});
	}
	
	function restartScript(pull)
	{
		console.ok('Trying to restart %s', pull.data);
		
		getApp({
			data: pull.data,
			callback: function(app)
			{
				if(!app) return pull.callback('app does not exist');
				if(!app.running) return pull.callback('app is not running');
				
				startScript(pull);
			}
		});
	}
	
	function removeScript(pull)
	{
		getApp({
			data: pull.data,
			callback: function(app)
			{
				if(!app) return pull.callback('App does not exist');
				console.ok('removing %s', scriptName);
				
				stopScript(pull);
				
				var sc = _scripts();
				delete sc[app.name];
				
				_scripts(sc);
			}
		});
	}
	
	function stopScript(pull)
	{
		var scriptName = pull.data;
		
		console.ok('stopping %s', scriptName);
		
		stopWorker(scriptName, function()
		{
			pull.callback('Stopped');
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
		
		pull.callback(batch);
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
			if(scriptName == appName) return pull.callback(scripts[scriptName]);
		}
		
		return pull.callback(null);
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