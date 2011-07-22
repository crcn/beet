require('sk/node/log');

var util = require('util'),
	fs = require('fs'),
	pt = require('path'),
	brazln = require('brazln'),
	utils = require('sk/node/utils'),
	pt = require('path'),
	log = require('sk/node/log');
	
function readFileSync(path)
{
	try
	{
		return fs.readFileSync(path);
	}
	catch(e)
	{
		return null;
	}
}

var oldProcessExit = process.exit;

process.exit = function()
{
	brazln.mediator.push('exit')
	
	//give some time to shut down
	setTimeout(oldProcessExit, 500);
}

//kill the process if an uncaught error has occurred 
process.on('uncaughtException', function(err) {
	
	console.log("UNCAUGHT")
	console.log(err.stack)
	//give time to output the log
	// console.error(err.stack);
	
	//timeou
	/*setTimeout(function()
	{
		process.exit();
	},3000);*/
	process.exit();
});

var exitHandlers = [];
	
exports.controller = {
	load: function(ops)
	{
		
		var appName = ops.name,
			path = ops.path,
			logPath = ops.logPath,
			pkg = JSON.parse(readFileSync(ops.path + '/package.json') || '{}'),
			args = ops.args || [];
			args = args.length ? args : (pkg.slug ? pkg.slug.args || [] : []);
		
		
		process.chdir(fs.lstatSync(ops.path).isDirectory() ? ops.path : pt.dirname(ops.path));
				
		process.argv = process.argv.splice(0,2).concat(args);
		
		var logger = log.logger({ target: console });
		
		logger.path = logPath;
		logger.prefix = (appName + ': ').blue;
		
		function getLogFiles()
		{
			var toWatch = [];
			
			logger.logPaths().forEach(function(path)
			{
				toWatch.push({
					name: appName + ' - ' + path.split('/').pop().split('.').shift(),
					path: path
				});
			});
			
			return toWatch;
		}
		
		var logioUp = false;
		
		brazln.require(['glue.core','glue.http']);
		
		brazln.mediator.on({
			'pull beet.app.ops': function(pull)
			{
				pull.callback(ops);
			},
			'pull add.exit.handler': function(handlers)
			{
				var eh = {
					exit: function(callback)
					{
						if(!logioUp) return callback();
						
						brazln.mediator.pull('log.io.unwatch', getLogFiles(), function(pull)
						{
							callback();
						})
						
						setTimeout(callback,1000);
					}
				};
				
				handlers.push(eh);
			},
			'push init': function()
			{
				brazln.mediator.push('add.exit.handler', exitHandlers);
			},
			'push andPull log.io.ready': function()
			{
				console.success('Log.io is up, sending stuff to watch');
				
				logioUp = true;
				
				
				brazln.mediator.pull('log.io.watch', getLogFiles(), function()
				{
					
				});
			}
		});
		
		
		require(path);
	},
	exit: function(data, callback)
	{
		var i = exitHandlers.length;
		
		if(!i) return callback();
		
		exitHandlers.forEach(function(handler)
		{
			handler.exit(function()
			{
				if(!(--i)) callback();
			});
		});
	}
}
