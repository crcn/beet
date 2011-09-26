var Structr = require('structr'),
ini = require('ini'),
yaconfig = require('yaconfig'),
fs = require('fs');



var iniPersist = {
	
	decode: function(string)
	{
                                                                   	
		var iniConfig = ini.decode(string.replace(/;[^\n]+/g,'').replace(/\](\s+)/g,']\n')),

		//the config we'll copy to
		newConfig = {};

		
		for(var setting in iniConfig)
		{

			var settingParts = setting.split(':'),
			type = settingParts[0],
			name = settingParts[1];


			//name exists? looks something like: [program:name], or [eventlistener:name]
			if(name)
			{
				if(!newConfig[type]) newConfig[type] = {};

				newConfig[type][name] = iniConfig[setting];
			}
			else
			{
				newConfig[type] = iniConfig[setting];
			}
		}


		return newConfig;
	},


	writeSettings: function(target, type)
	{
		var settings = [], buffer = [], skip = false, hasSettings;

		buffer.push('[' + type + ']');

		for(var property in target)
		{
			var value = target[property];

			if(!value) continue;

			hasSettings = true;

			//we must go deeper...
			if(typeof value == 'object')
			{
				settings = settings.concat(iniPersist.writeSettings(value, type + ':' + property));
				skip = true;
			}

			//this jappens for some odd reason...
			else
			if(property.length)
			{
				buffer.push(property + '=' + value);
			}
		}

		buffer.push('\n');

		if(!skip && hasSettings)
		{
			settings = buffer.concat(settings);
		}

		return settings;
	},

	encode: function(object)
	{
		var buffer = [];

		for(var type in object)
		{
			buffer = buffer.concat(iniPersist.writeSettings(object[type], type));
		}

		return buffer.join('\n');
	}

}





var Configuration = module.exports = Structr({
	
	/**
	 */

	'__construct': function(beet, path, parent)
	{

		//controls the root config / updates supervisord
		this.beet = beet;

		//the path to the configuration
		this.path = path;

		//the parent collection which is including this configuration
		this.parent = parent;

		//saves / loads the config file
		this._config = yaconfig.file(path, iniPersist); 


		var self = this;

		//update on save ~ reloads supervisord
		this._config.on('save', function()
		{
			self.onSave();
		});


		this.logsDir = beet.dirs.logs;

		//check to make the the included files exist
		//this.cleanIncludes();
	},

	/**
	 */

	'enable': function() { },

	/**
	 */

	'disable': function() { },

	/**
	 */

	'onSave': function() { },

	/**
	 * includes a path into the supervisord config file
	 */

	'include': function(path)
	{
		var inc = this.included();

		if(inc.indexOf(path) == -1)
		{
			inc.push(path);
			this._config.set('include:files', inc.join(','));
		}
	},

	/**
	 * removes an item under [include]
	 */

	'uninclude': function(path)
	{
		var inc = this.included(), index = inc.indexOf(path);

		if(inc.indexOf(path) == -1)
		{
			inc.splice(index, 1);
			this._config.set('include:files', inc.join(','));
		}
	},

	/**
	 * returns the included config files. only works in root supervisord.
	 */
	
	'included': function()
	{
		var files = this._config.get('include:files');

		return files ? files.split(',') : [];
	},

	/**
	 * returns a configuration value
	 */

	'get': function(key)
	{
		return this._config.get(key);
	},


	/**
	 * sets a config value
	 */

	'set': function(key, property)
	{
		this._config.set(key, property);
	},

	/**
	 * saves the configuration to disc
	 */


	'save': function()
	{
		this._config.save();
	},

	/**
	 */

	'addProgram': function(ops, callback)
	{

		 if(!callback) callback = function(){};

        //name of the script to run for supervisord
        if(!ops.name) ops.name = 'undefined';

        
        //script exists? split it apart
        if(ops.script)
        {
             ops.directory =  ops.script.split('.').length == 1 ? ops.script :path.dirname(ops.script);

            try
            {
                var package = JSON.parse(fs.readFileSync(ops.directory + '/package.json'));

                if(!package.main && package.bin)
                {
                    for(var binName in package.bin)
                    {
                        ops.command = ops.directory + '/' + package.bin[binName];
                    }
                }
            }
            catch(e)
            {
                
            }
            
            if(!ops.command) ops.command = 'node ' + ops.script +' '+ (ops.args || []).join(' ');
        }

        var envStr;

        if(ops.environment)
        {
            var envBuffer = [];

            for(var property in ops.environment)
            {
                envBuffer.push(property + '=' + ops.environment[property]);
            }

            ops.environment = envBuffer.join(',');
        }

        //directory to script - chdir for supervisord
        //if(!ops.directory) return callback('directory is not provided');

        //the command to use for running supervisord
        if(!ops.command) return callback('command not provided');
        
        if(!ops.name) return callback('Name not provided');
         
        var self = this;

        ops.stdout_logfile = this.logsDir + '/' + ops.name + '.log';
        ops.stderr_logfile = this.logsDir + '/' + ops.name + '-err.log';


		this._config.set('program:' + ops.name, ops);
	},


	/**
	 */

	'removeProgram': function(name)
	{
		this._config.set('program:' + name, undefined);
	},

	/**
	 * removes any files that don't exist in [include]
	 */

	'cleanIncludes': function()
	{
		var self = this;

		this.included().forEach(function(path)
		{
			if(path.indexOf('*') > -1) return;//wildcard

			try
			{
				fs.lstatSync(path);
			}
			catch(e)
			{
				self.uninclude(path);
			}
		})
	}
});