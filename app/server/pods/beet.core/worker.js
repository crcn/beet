require('sk/node/log');

var util = require('util'),
	fs = require('fs');

exports.controller = {
	load: function(ops)
	{
		
		var oldConsole = console.log,
			appName = ops.name,
			path = ops.path,
			pkg = JSON.parse(fs.readFileSync(ops.path + '/package.json')),
			args = ops.args || [];
			args = args.length ? args : (pkg.slug ? pkg.slug.args || [] : []);
		
		process.chdir(ops.path);
				
		process.argv = process.argv.splice(0,2).concat(args);
		
		console.log = function()
		{
			var msg = arguments[0];

			if(typeof msg == 'object')
			{
				msg = util.inspect(msg, false, null);
			}

			arguments[0] = (appName + ': ').blue + msg;

			oldConsole.apply(null, arguments);
		}
		
		
		
		require(path + '/' + pkg.main);
	}
}
