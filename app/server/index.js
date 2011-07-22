var brazln = require('brazln');

brazln.params({'express.core':{ port: 8730 }}).
require(['glue.core','glue.http']).
require(__dirname + '/pods').push('init', '/data/beet/scripts.tiny');