var beanpole = require('beanpole');

beanpole.params({'express.core':{ port: 8730 }}).
require(['glue.core','glue.http']).
require(__dirname + '/beans').
push('init', '/data/beet/scripts.tiny');