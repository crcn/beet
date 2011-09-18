An extension to the node.js [supervisord](https://github.com/spiceapps/supervisord) with some additional candy.

#### Features

- Installs supervisord if it's not already installed.
	- Adds an optional upstart script to run supervisord at runtime

- Ability to add processes to supervisord by group.
- Reads supervisord.conf file for authentication / port.

#### Example

```javascript

var beet = require('beet');


beet.group('hello').add({ script: __dirname + '/script.js', name: 'my script' }, function(err, result)
{
	//started!
});


```
