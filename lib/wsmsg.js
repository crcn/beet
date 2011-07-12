exports.build = function(ws, args)
{
	if(!args) args = {};
	
	var calls = {};
	
	args.__response = function(ops)
	{
		var callback = calls[ops.cid];
		
		if(callback) callback(ops);
		
		delete calls[ops.cid];
	}
	
	
	var ret = {
		read: function(msg)
		{
			var data = JSON.parse(msg);
			
			var callback = args[data.name];
			
			if(callback)
			{
				
				data.callback = function(d)
				{
					ret.response(data.cid, d);
				}
				
				callback(data);
			}
			else
			{
				console.error('cannot handle %s', data.name);
			}
		},
		send: function(msg, data, callback)
		{
			if(callback)
			{
				var cid = new Date().getTime()+'.'+Math.round(Math.random()*99999);
				
				calls[cid] = callback;
			}
			
			ws.send(JSON.stringify({ name: msg, data: data, cid: cid}));
		},
		response: function(cid, data)
		{
			ws.send(JSON.stringify({ name: '__response', data: data, cid: cid }));
		}
	}
	
	return ret;
}
