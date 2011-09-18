var gumbo = require('gumbo'),
xmlrpc = require('xmlrpc'),
Structr = require('structr'),
supervisord = require('supervisord'),
EventEmitter = require('sk/core/events').EventEmitter,
Group = require('./group'),
ConfWriter = require('./conf/writer'),
fs = require('fs'),
ini = require('ini'),
nodefs = require('node-fs');


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
        };

        try
        {
            for(var type in this.dirs)
            nodefs.mkdirSync(this.dirs[type], 0755, true);
        }
        catch(e)
        {
            
        }
        
        //remove comments - breaks ini parser
        var config = ini.decode(fs.readFileSync('/etc/supervisord.conf', 'utf8').replace(/;[^\n]+/g,'')),
        inet_http_server = config.inet_http_server || {};
        
        
        
        //connection to supervisord
        this.client = supervisord.connect({
            host: 'localhost',
            user: inet_http_server.username,
            pass: inet_http_server.password,
            port: Number(inet_http_server.port.split(':').pop())
        });
        
        
        
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