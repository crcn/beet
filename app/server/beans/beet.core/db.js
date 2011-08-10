var fs = require('fs');



function db(file, onOpen)
{

	var _db = {}, self = this;
	
	this.set = function(key, value, callback)
	{
		if(value)
		{
			_db[key] = value;
		}
		else
		{
			delete _db[key];
		}

		if(callback) callback();

		save();
	}

	this.rm = function(key, callback)
	{
		this.set(key, undefined, callback);
	}

	this.forEach = function(callback)
	{
		for(var key in _db)
		{
			callback(key, _db[key]);
		}
	}

	this.update = function(key, value, callback)
	{
		var copyTo = _db[key] || {};

		for(var k in value)
		{
			copyTo[k] = value[k];	
		}

		this.set(key, copyTo, callback);
	}

	this.find = function(search, callback)
	{
		if(!callback)
		{
			callback = search;
			search = undefined;
		}

		var found = [];

		self.forEach(function(key, value)
		{
			if(search)
			for(var prop in search)
			{
				if(search[prop] != value[prop]) return;
			}

			found.push(value);
		});

		callback(found);
	}



	function open()
	{
		try
		{
			_db = JSON.parse(fs.readFileSync(file, 'utf8'));
		}catch(e)
		{
			
		}

		onOpen(self);
	}

	function save()
	{

		fs.writeFileSync(file, JSON.stringify(_db));
	}


	open();
}

process.on('exit', function()
{
	console.log("GG")
});


module.exports = function(file, callback)
{
	return new db(file, callback);
};