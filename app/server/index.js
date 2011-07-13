var brazln = require('brazln'),
	dirty = require('sk/node/settings/dirty').dirty;

brazln.params({'express.core':{ port: 59300}}).require(['glue.core','glue.http']).require(__dirname + '/pods').push('init', dirty('/data/beet/config.json'));