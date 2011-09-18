var gumbo = require('gumbo'),
xmlrpc = require('xmlrpc'),
Structr = require('structr'),
supervisord = require('supervisord'),
EventEmitter = require('sk/core/events').EventEmitter,
Group = require('./group'),
ConfWriter = require('./conf/writer'),
fs = require('fs'),
iniparser = require('iniparser');


var Beet = EventEmitter.extend({
    
    /**
     */
     
    'override __construct': function()
    {
        this._super();

        this.dirs = {
            conf: '/etc/beet/conf',
            logs: '/var/log/beet',
            db: '/etc/beet/db',
        }
        
        var config = iniparser.parseSync('/etc/supervisord.conf');
        
        console.log(config);
        
        
        
        //connection to supervisord
        this.client = supervisord.connect(/*{
            host: 'localhost',
            user: config.match(/username=(\w+)/)[1],
            pass: config.match(/password=(\w+)/)[1],
            port: Number(config.match(/port=([^\s]+)/g)[0].split(':').pop())
        }*/);
        
        
        
        this._collection = gumbo.db({
            persist: {
                fs: this.dirs.db
            }
        }).collection('scripts');

        this._writer = new ConfWriter(this);
    },
    
    
    /**
     * returns the given group handler for supervisord
     */
     
    'group': function(name)
    {
        if(!name) name = 'root';

        return new Group(this, name);
    },
    
    /**
     * returns all processes by supervisord
     */
     
    'allProcesses': function(callback)
    {
        this.client.getAllProcessInfo(callback);
    },

    /**
     */

    'restart': function(callback)
    {
        this.client.restart(callback);
    },

    /**
     */

    'writeGroupConfig': function(groupName)
    {
        this._writer.writeGroup(groupName);
    }
});

module.exports = new Beet();