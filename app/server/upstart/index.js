var child_process = require('child_process'),
	exec = child_process.exec,
	Process = require('sk/node/process').Process;


var upstartRoot = '/data/beet/upstart';

exports.start = function(script, port, callback)
{
	new Process(__dirname + '/start', ['node', script, upstartRoot, 'beet', port], { cwd: __dirname }).onExit = callback;
}

exports.stop = function(callback)
{
	new Process(upstartRoot + '/stop', ['purge'], { cwd: upstartRoot }).onExit = callback || function(){};
}

