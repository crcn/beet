var EventEmitter = require('sk/core/events').EventEmitter,
exec = require('child_process').exec,
Configuration = require('./models/configuration'),
supervisord = require('supervisord'),
nodefs = require('node-fs'),
crypto = require('crypto'),
fs = require('fs'),
_ = require('underscore');


var Beet = EventEmitter.extend({

    /**
     */

    'override __construct': function()
    {
        this._super();

        this.dirs = {
            available: '/etc/beet/available',
            enabled: '/etc/beet/enabled',
            logs: '/var/log/beet',
            
        };

        this.update = _.debounce(this.getMethod('_update'), 500);


        //make all the directories for the app 
        for(var type in this.dirs) nodefs.mkdirSync(this.dirs[type], 0755, true);


        //the root supervisord configuration file
        this.root = new Configuration(this, '/etc/supervisord.conf');
        
        this.scripts = this.configuration(this.dirs.available + '/scripts.conf'); 
        this.scripts.enable();

        //for the RPC interface - required
        var inet_http_server = this.root.get('inet_http_server');

        //connection to supervisord
        this.client = supervisord.connect({
            host: 'localhost',
            user: inet_http_server.username,
            pass: inet_http_server.password,
            port: Number(inet_http_server.port.split(':').pop())
        });


        //we don't want to touch the root config too much - include the beet config directory to scan
        this.root.include(this.dirs.enabled + '/*.conf');
            
        //remove any symlinks that don't exist anymore
        this.cleanEnabled();

    },
    
    /**
     * returns a configuration model
     */


    'configuration': function(configPath)
    {
        var config = new Configuration(this, configPath), self = this,

        //etc/beet/enabled/094j539nfdksnfs.conf
        enpath =  self.dirs.enabled + '/' + crypto.createHash('md5').update(configPath).digest("hex")+'.conf';
        
        //because of ow supervisord is configured, we need to create a symlink between the config path, and a path stored
        //in a directory where supervisord scans. We do NOT want to place this in the supervisord.conf file.
        config.onSave = function()
        {
            self.update();
        }


        //disables the configuration
        config.disable = function()
        {
            exec('rm ' + enpath + ';', function(err)
            {
                self.update();
            });
        }


        //enables the configuration
        config.enable = function()
        {

            //exists? skip.
            try
            {
                return fs.lstatSync(enpath);
            }
            catch(e) { }

            exec('rm ' + enpath + '; ln -s ' + configPath + ' ' + enpath, function(err)
            {

                self.update();
            });
        }
        
        return config;
    },

    /**
     */

    'processes': function(callback)
    {
        this.client.getAllProcessInfo(callback);
    },

    /**
     */

    'stop': function(processName, callback)
    {
        this.client.stopProcess(processName, callback);
    },

    /**
     */

    'start': function(processName, callback)
    {
        this.client.startProcess(processName, callback);
    },

    /**
     */

    'restart': function(processName, callback)
    {
        var self = this;

        this.stop(processName, function(err, result)
        {
            self.start(processName, callback);
        })
    },

    /**
     * updates supervisor. Have to resort to exec since there's no RPC interface for updating supervisord
     */

    '_update': function(callback)
    {
        console.log('reloading beet config');

        exec('sudo supervisorctl update', callback || function(){});
    },

    /** 
     * cleans any configurations which might have been removed
     */
     
    'cleanEnabled': function()
    {
        var self = this;
        
        fs.readdirSync(this.dirs.enabled).forEach(function(dirname)
        {
            var fullPath = self.dirs.enabled + '/' + dirname;
            
            
            fs.realpath(fullPath, function(err, result)
            {
                if(err) fs.unlinkSync(fullPath);
            });
        });
    }
    
});

module.exports = new Beet();