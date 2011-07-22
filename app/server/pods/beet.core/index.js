var Load = require('sk/node/balance').Load,
	vine = require('vine'),
	Structr = require('structr'),
	Tiny = require('node-tiny'),
	Queue = require('sk/core/queue').Queue,
	log = require('sk/node/log');

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

	function _stop(appName, callback)
	{
		
	}
	
	function stopWorker(appName, callback)
	{
		var i, stopped = [];

		function onDone()
		{
			if(!(--i)) setTimeout(function()
			{
				callback(stopped.join(','));
			}, 500);
		}
		_getApps(appName, function(apps)
		{
			i = apps.length;

			if(!i) return callback();

			apps.forEach(function(app)
			{
				stopped.push(app.name);

				var w = workers[app.name];

				if(w)
				{
					console.success('Stopping %s', app.name);
						
					w.exit(function()
					{
						w.terminate(1);

						delete workers[app.name];

						toggleRunning(app.name, false, onDone);
					});
				}
				else
				{
					toggleRunning(app.name, false, onDone);
				}
			})
		})
	}
	
	function startWorker(app)
	{
		app = JSON.parse(JSON.stringify(app));
		
		// if(app.argv) app.argv = JSON.parse(app.argv);
		
		app.logPath = '/data/beet/logs/'+app.name+'/';
		
		var w = workers[app.name] = Load.worker(__dirname + '/worker.js').load(app),
			wlogger = log.logger({ path: app.logPath }).logger;
			
		console.success('Running: %s', app.name);
		
		w.onError = function(e)
		{
			//since the child is unable to write to disc, do it the favor :3
			wlogger.error(e.stack.toString());
			
			delete workers[app.name];
		}
		
		
		toggleRunning(app.name, true);
		
		//start pinging the child and make sure it stays alive 
		w.keepAlive(function()
		{
			console.warn('Looks like worker has crashed, restarting.');
			
			delete workers[app.name];
			
			//what if the app was stopped? This will go on forever if it keeps crashing :/
			getApp({
				data: app.name,
				callback: function(result)
				{
					if(result.data.errors) return console.error('Unable to start app. This shouldn\'t happen: %s', result.data.errors[0])
					if(result.result().running) return runScript(result.result());
					console.ok('Or not...');
				}
			})
			
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
		
		
		function load(handler)
		{
			handler.load(toAdd.path, function(data)
			{
				if(data.error()) return pull.callback(data);
				
				var info = data.result();
					
				info.name = (toAdd.name || info.name).toLowerCase().replace(/\./g,'-');
				
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
					
					info = Structr.copy(info, toAdd);
														
					
					db.set(info.name, info, function(err, ret)
					{ 
						pull.callback(vine.message('Successfully added %s, starting', info.name));
						start();
					});
				});
			});
		}
		
		var q = new Queue(true);
		
		handlers.forEach(function(handler)
		{
			q.add(function()
			{	
				handler.test(toAdd.path, function(success)
				{
					if(success)
					{
						load(handler)
						return q.stop();
					}
					
					q.next();
				})
			})
		});
		
		q.add(function()
		{
			pull.callback(vine.error('unable to parse'));
		})
	}
	
	function startScript(pull)
	{
		getApps({
			data: pull.data,
			callback: function(data)
			{
				if(data.error()) return pull.callback(data);
				
				var running = [];

				data.result().forEach(function(app)
				{
					running.push(app.name);

					runScript(app);
				});
				
				
				pull.callback(vine.message('Successfully started %s', running.join(',')));
			}
		});
	}
	
	function restartScript(pull)
	{
		console.ok('Trying to restart %s', pull.data);
		
		getApp({
			data: (pull.data || '').replace(/\./g,''),
			callback: function(data)
			{
				if(data.error())
				{
					console.warn('Cannot restart %s', pull.data);
					
					return pull.callback(data);
				}
				
				if(!data.result().running) return pull.callback(vine.error('%s is not running', data.result().name));
				
				startScript(pull);
			}
		});
	}
	
	function removeScript(pull)
	{
		getApps({
			data: pull.data,
			callback: function(data)
			{
				if(data.error()) return pull.callback(data);
				
				var q = new Queue(),
					removed = [];

				data.result().forEach(function(app)
				{
					console.ok('Removing %s', app.name);


					q.add(function()
					{
						db.remove(app.name, function()
						{
							removed.push(app.name);

							q.next();
						});	

						stopWorker(app.name);
					});
					

				});

				q.add(function()
				{
					pull.callback(vine.message('Successfully removed %s', removed.join(',')));
				});

				q.start();
				
				
			}
		});
	}
	
	function stopScript(pull)
	{
		var scriptName = pull.data;
		
		console.ok('stopping %s', scriptName);
		
		stopWorker(scriptName, function(scriptName)
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
			
			
			//broken.
			d.all(function(err, results)
			{
				results.forEach(function(app)
				{
					// if(app.running) runScript(app);
					
					//fixed.
					d.find({ name: app.name }, function(err,apps)
					{
						var app = apps[0];
						if(app && app.running) runScript(app);
					})
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

	function getAppSearch(name)
	{
		if(!name) name = '';

		return name.indexOf('*') > -1 ? new RegExp('^'+name.split('*').shift(),'gi') : new RegExp('^'+name+'$','gi');
	}

	function _getApps(name, callback)
	{
		var search = getAppSearch(name),
		apps = [];

		db.all(function(err, results)
		{
			for(var i = results.length; i--;)
			{
				var app = results[i];

				if(app.name && app.name.toString().match(search))
				{
					apps.push(app);
				}

			}
		});

		callback(apps)
	}

	function getApps(pull)
	{
		console.log(pull.data);

		var name = pull.data ? pull.data.name || pull.data : 'undefined';

		_getApps(name, function(apps)
		{
			if(!apps.length) return pull.callback(vine.error('The app %s does not exist', name));
			pull.callback(vine.result(apps));
		});
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