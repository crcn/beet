var Structr = require('structr'),
path = require('path'),
fs = require('fs'),
EventEmitter = require('sk/core/events').EventEmitter;




module.exports = Structr({
   
   /**
    */
    
    '__construct': function(beet)
    {
        this._beet = beet;

        //where the supervisord config files live
        this.confDir = beet.dirs.conf;
        this.logDir  = beet.dirs.logs;

        //listen for inserts, deletes, updates
        beet._collection.addListener('change', this.getMethod('_save'));
    },
    
    /**
     */
     
    'writeGroup': function(groupName)
    {
        var self = this;
        
        self._beet._collection.find({ group: groupName }, function(err, items)
        {
            
            var buffer = [], scriptNames = [];
        
            for(var i = items.length; i--;)
            {
                var script = items[i];

                script.directory = fs.realpathSync(script.directory);

                scriptNames.push(script.name);

                buffer.push('[program:' + script.name + ']');
                buffer.push('command='+script.command);
                buffer.push('directory='+script.directory);
                buffer.push('stdout_logfile='+self.logDir+'/'+groupName+'-'+script.name+'.log');
                buffer.push('stderr_logfile='+self.logDir+'/'+groupName+'-'+script.name+'-err.log');
                buffer.push('\n\n');
            }

            buffer.push('[group:' + groupName + ']');  
            buffer.push('programs=' + scriptNames.join(','));
            
            fs.writeFileSync(self.confDir + '/' + groupName + '.conf', buffer.join('\n'));

            self._beet.client.restart(function(err, result)
            {
                self._beet.emit('restart');
            });
        });
    },
    
    
    /**
     */
     
    '_save': function(search)
    {
        var self = this;

        function onGroup(groupName)
        {
            self.writeGroup(groupName);
        }

        if(search.group) 
        {
            onGroup(item.group);
        }
        else
        {
            //maybe reduntant, but the search could be the query used - we everything.
            this._beet._collection.findOne(search instanceof Array ? search[0] : search, function(err, item)
            {
                if(!item) return console.warn('Unable to save supervisord.conf');

                onGroup(item.group);
            });
        }
    },
});





