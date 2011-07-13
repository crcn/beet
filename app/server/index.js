var brazln = require('brazln'),
	dirty = require('sk/node/settings/dirty').dirty;

brazln.require(['glue.core','glue.http']).require(__dirname + '/pods').push('init', dirty('/data/beet/config.json'));