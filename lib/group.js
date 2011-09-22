var Structr = require('structr'),
path = require('path'),
fs = require('fs');


module.exports = Structr({
    
    /**
     */
     
    '__construct': function(beet, groupName)
    {
        //the db collection to persist to
        this._collection = beet._collection;
        
        this._idGen = beet._collection.idGen;
        
        //controller for supervisord
        this.beet = beet;
        
        //name of the group
        this.name = groupName;

        //the logs directory
        this.logsDir = beet.dirs.logs;
    },
    
    /**
     * Lists all the processes under the given group
     */
     
     
    'all': function(callback)
    {
        var self = this;
        
        this.beet.client.getAllProcessInfo(function(err, processes)
        {
            if(processes)
            for(var i = processes.length; i--;)
            {
                var proc = processes[i],
                nameParts = proc.name.split('_');

                if(nameParts[0] != self.name)
                {
                    processes.splice(i, 1); 
                }
                else
                {
                    proc.group = nameParts[0];
                    proc.name = nameParts[1];
                }

            }   
            
            callback(err, processes);
        });
    },

    /**
     */

    'process': function(name, callback)
    {
        this.beet.client.getProcessInfo(this._group(name), callback);  
    },

    /**
     */

    '_group': function(name)
    {
        if(!this.name || true) return name;

        /*if(!name) name = '*';

        return this.name+':'+name;  */
    },


    /**
     */

    'start': function(name, callback)
    {
        if(typeof name == 'function')
        {
            callback = name;
            name = '*';
        }
        else
        {
            name = this._name(name);
        }
        
        if(!callback) callback = function(){};
        
        this.beet.client.startProcess(this._group(name), function(err, result)
        {
             if(err)
            {
                console.error('Cannot start app %s: %s', name, err.message);
            }
            else
            {
                console.log('Successfuly started app %s', name)
            }

            callback(err, result);
        });
    },

    /**
     */

    'exists': function(name, callback)
    {
        this._collection.findOne({ name: name, group: this.name }, function(err, item)
        {
            callback(!!item);
        })
    },

    /**
     */
    
    'stop': function(name, callback)
    {
        
        if(typeof name == 'function')
        {
            callback = name;
            name = '*';
        }
        else
        {
            name = this._name(name);
        }
        
        if(!callback) callback = function(){};

        console.log('stopping %s...', name);


        this.beet.client.stopProcess(this._group(name), function(err, item)
        {
            if(err)
            {
                console.error('Cannot stop app %s: %s', name, err.message);
            }
            else
            {
                console.log('Successfuly stopped app %s', name)
            }

            callback(err, item);
        });
    },

    /**
     */

    'restart': function(name, callback)
    {
        var self = this;

        this.stop(name, function()
        {
            self.start(name, callback);
        })
    },
    
    /**
     * addes a process to a given group
     */
     
    'add': function(ops, callback)
    {
        if(!callback) callback = function(){};

        //name of the script to run for supervisord
        if(!ops.name) ops.name = 'undefined';

        var supervisordName = this._name(ops.name);
        
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

            envStr = envBuffer.join(',');
        }


        //directory to script - chdir for supervisord
        if(!ops.directory) return callback('directory is not provided');

        //the command to use for running supervisord
        if(!ops.command) return callback('command not provided');
         
        var self = this;


        var update = this._query({
            supervisordName: supervisordName, 
            name: ops.name,
            directory: ops.directory, 
            command: ops.command,
            environment: envStr,
            stdout_logfile: this.logsDir + '/' + supervisordName + '.log',
            stderr_logfile: this.logsDir + '/' + supervisordName + '-err.log'
        });
        
        //insert into the beet db 
        this._collection.update({ _id: this._id(supervisordName) }, { $set: update }, { upsert: true }, function(err, result)
        {
            if(callback) callback(err, result);
        });
    },

    /**
     * Removes a script from supervisord
     */

    'remove': function(ops, callback)
    {
        var search = typeof ops == 'string' ? { name: ops } : ops,
        query = this._query(search),
        self = this;


        //stop the app in case...
        self.stop(search.name, function(err, result)
        {
            if(callback) callback(err, result); 
        });


        //remove the app
        self._collection.remove(query, function(err, result){ }); 
    },

    /**
     * adds group to the search
     */
     
    '_query': function(data)
    {
        data.group = this.name;
        return data;
    },
    
    /**
     */
     
    '_name': function(processName)
    {
        return this.name + '_' +processName;
    },
    
    /**
     * the ID of the process name
     */
     
    '_id': function(processName)
    {
        return this._idGen.hash(this._group(processName));
    }
});




