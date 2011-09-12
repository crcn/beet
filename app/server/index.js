var beanpole = require('beanpole');

beanpole.params({'express.core':{ port: 8730 }}).
require(['hook.core','hook.http.mesh']).
require(__dirname + '/beans').
push('init', '/data/beet/scripts.db');