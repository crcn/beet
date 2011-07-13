require('sk/node/log');

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
		
		
		require(ops.path);
	}
}
