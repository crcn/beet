var express = require('express');

exports.pod = function(m, params)
{
	
	function init()
	{
		var srv = express.createServer();
		
		m.pull('express.routes', function(routes)
		{
			for(var method in routes)
			{
				var meth = srv[method];
				
				routes[method].forEach(function(route)
				{
					meth.apply(srv, [route.uri, route.callback]);
				})
				
			}
		});
		
		
		srv.listen((params || {}).port || 8888);
	}
	
	
	m.on({
		'push init': init
	})
}