Huh?
----

Beet keeps track of child processes (primarily node.js), and makes sure they stay alive. It also has a few hooks so that beet *itself* stays alive, even after the system restarts.

Why?
----

Because.

What's with the name?
---------------------

Beet (heart beat) is a vegetable. It makes sense since we're Spice Apps. Damn I love food...

Installation:
-------------

	npm install beet
	
Support:
-------

- Mac (launchctl)
- *soon* Linux (upstart + monit)


Goodies:
--------

- *soon* Git integration
	- listen for any commits -> restart app
	- dispatch commit to any other "glued" beet instances (cluster).
- Keeps apps running even after the system restarts. 
- checks health on running apps and restarts any which are non-responsive.
- Extendable thanks to [brazln](https://github.com/spiceapps/brazln). 
- *soon* use the beet pods in other [brazln](https://github.com/spiceapps/brazln)-based apps.


Terminal Usage:
-------------

make sure you have a package.json in the directory of your node.js app:

	beet add <process path > 
	
Once you've added your app:

	beet start <app name>
	
stop an app:

	beet stop <app name>
	
remove an app completely:
	
	beet remove <app name>
		
list the running apps:
	
	beet list
	
Node.js Usage:
--------------

Getting there...
	
To Do:
-----

- Need to debug on Linux.
- Ability to add github repos AND listen for commits + restart.
- Move config.json from global -> local OR assign beets to "collection" of running apps (yeah... that sounds better). This allows beet to be used in code. 
