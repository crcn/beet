require('sk/node/log');

var util = require('util'),
	fs = require('fs');

exports.controller = {
	load: function(ops)
	{
		var oldConsole = console.log,
			appName = ops.name;
		
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
		
		var pkg = JSON.parse(fs.readFileSync(ops.path + '/package.json'));
		
		require(ops.path + '/' + pkg.main);
	}
}
