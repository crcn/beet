An extension to the node.js [supervisord](https://github.com/spiceapps/supervisord) library with some additional candy. 

#### Features

- Installs supervisord if it's not already installed.
	- Adds an optional upstart script to run supervisord at runtime

- Ability to add processes to supervisord by group.
- Reads supervisord.conf file for authentication / port.    
- Ability to load/unload any supervisord.conf file.

                                     
### Notes
                                
- Beet modifies only one setting in supervisord.conf, which is `[includes]`. Beet adds a directory to scan which is `/etc/beet/enabled/*.conf`. Any configuration files
Are symlinked to this directory. 
- After modifications to supervisord, beet calls `supervisorctl update` to load / unload any changes, versus restarting supervisord.        

#### Installation

	npm install beet -g && beet --install

#### Examples

Easiest one is to add a program to the default scripts configuration. This is located in `/etc/beet/available/scripts.conf`, and
is enabled in `/etc/beet/enabled` 

```javascript

var beet = require('beet');


beet.scripts.addProgram({ script: __dirname + '/script.js', name: 'my script' }, function(err, result)
{
	//started!
});                    

```    

You can also specify commands:
   
```javascript                 

beet.scripts.addProgram({ command: '/bin/mongod' }, function(err, result)
{
	//started!
})            

````
                                
You can just as easily load any supervisord.conf:

```javascript
   
var beet = require('beet'),
config = beet.configuration('/path/to/my/custom/supervisord.conf');          
                    
config.addProgram({ script: '/my/script.js' }, function()
{
	
});

config.enable();//enable

```                     

If you want to disable any configuration file:

```javascript
   
require('beet').configuration('/path/to/config.conf').disable();

```        
                                            
