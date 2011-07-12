Huh?
----

Beet keeps track of child processes (primarily node.js), and makes sure they stay alive. It also has a few hooks so that beet *itself* stays alive, even after the system restarts.

Why?
----

Because.

What's with the name?
---------------------

Beet (heart beet) is a vegetable. It makes sense since we're Spice Apps. Damn I love food...

Installation:
-------------

	npm install beet
	
Support:
-------

- Mac (launchctl)
- Linux (upstart + monit)

Node.js Usage:
------

make sure you have a package.json in the directory of your node.js app:

	beet start <process path> 
	
stop a process name

	beet stop <process name | PID>
		
list the running processes
	
	beet list
	
