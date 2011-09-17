var gumbo = require('gumbo'),
xmlrpc = require('xmlrpc'),
Structr = require('structr'),
supervisord = require('supervisord'),
EventEmitter = require('sk/core/events').EventEmitter,
Group = require('./group'),
ConfWriter = require('./conf/writer'),
fs = require('fs');


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
        
        var config = fs.readFileSync('/etc/supervisord.conf', 'utf8');
        
        config = config.substr(config.indexOf('inet_http_server]'));
        
        
        //connection to supervisord
        this.client = supervisord.connect({
            host: 'localhost',
            user: config.match(/username=(\w+)/)[1],
            pass: config.match(/password=(\w+)/)[1],
            port: Number(config.match(/port=([^\s]+)/g)[0].split(':').pop())
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


var beet = new Beet(),
hablar = beet.group('hablar'),
hamar = beet.group('hamar');

beet.client.getAllProcessInfo(function(err, result)
{
    console.log(result);
});

return;
hablar.start('google', function(err, result)
{
    console.log(result);
});

hablar.add({ name: 'google2', script: __dirname + '/test.js', args: [9003]});




