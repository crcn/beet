var beanpole = require('beanpole');

var _pull = function(type)
{
	return function(data, callback)
	{
		beanpole.pull(type, data, function()
		{
			callback.apply(null, arguments);
		});
	};
}

exports.add    = _pull('beet/add');
exports.remove = _pull('beet/remove');
exports.start  = _pull('beet/start');
exports.stop   = _pull('beet/stop');
exports.list   = _pull('beet/list');
