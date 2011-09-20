var lazyCallback = require('sk/core/lazy').callback,
nodefs = require('node-fs'),
fs = require('fs'),
ini = require('ini');



exports.init = function(beet, outputDir)
{
    try
    {
        nodefs.mkdirSync(outputDir, 0755, true);
    }
    catch(e)
    {
    }



    return {
        db: function(db)
        {

            db.addListener('collection', function(collection)
            {   
                var output = outputDir + '/'+ collection.name +'.conf',
                updates = { start: {}, stop: {} };


                //OH GOD WHY >.>
                var reload = function(groups, callback)
                {
                    beet.client.reloadConfig(function(err, result)
                    {

                        var numReloading = 1;

                        function onReloaded()
                        {
                            if(!(--numReloading)) callback();
                        }

                        for(var group in groups.stop)
                        {
                            numReloading++;


                            console.log('Removing ' + group);

                            //first we need to stop the process...
                            beet.client.stopProcessGroup(group, function(err, result)
                            {

                                //ugh... then we need to remove it
                                beet.client.removeProcessGroup(group, function(err, result)
                                {
                                    if(groups.start[group])
                                    {

                                        //THEN we can start the process!
                                        beet.client.addProcessGroup(group, function(err, result)
                                        {
                                            onReloaded(); 
                                        });
                                    }
                                    else
                                    {
                                        onReloaded();
                                    }
                                });                                
                            });
                        }

                        onReloaded();

                    });
                }

                var saveNow = function()
                {


                    //ALL the applications
                    var objects = collection.objects();


                    //this will be the config content
                    var buffer = [], 

                    //used to group programs
                    groupedPrograms = {};
        
                    //write out all the config data
                    for(var i = objects.length; i--;)
                    {
                        var script = objects[i];

                        //get the REAL directory for the config path
                        script.directory = fs.realpathSync(script.directory);

                        /*if(script.group)
                        {  
                            if(!groupedPrograms[script.group]) groupedPrograms[script.group] = [];
                            groupedPrograms[script.group].push(script.supervisordName);
                        }*/

                        buffer.push('[program:' + script.supervisordName + ']');

                        for(var property in script)
                        {
                            buffer.push(property + '=' + script[property]);
                        }

                        buffer.push('\n\n');
                    }


                    for(var groupName in groupedPrograms)
                    {
                        buffer.push('\n');
                        buffer.push('[group:' + groupName + ']');  
                        buffer.push('programs=' + groupedPrograms[groupName].join(','));
                        buffer.push('\n');
                    }

                    fs.writeFileSync(output, buffer.join('\n'));

                    console.log('reloading beet config');



                    reload(updates, function()
                    {
                        console.log('reloaded');


                        beet.emit('restart');
                    });

                    updates = { start: {}, stop: {} };
                }
                
                try
                {
                    var settings = ini.decode(fs.readFileSync(output, 'utf8').replace(/;[^\n]+/g,'')),
                    programs = {},
                    programsAr = [];


                    for(var section in settings)
                    {
                        var sectionParts = section.split(':'),
                        type = sectionParts[0],
                        sectionName = sectionParts[1],
                        sectionSettings = settings[section];



                        if(type == 'program')
                        {
                            var program = programs[sectionParts[1]] = sectionSettings;

                            programsAr.push(program);
                        }
                        /*else
                        if(type == 'group')
                        {
                            (sectionSettings.programs || '').split(',').forEach(function(program)
                            {
                               programs[program].group = sectionName;
                            });
                        }*/

                    }

                    collection.objects(programsAr);
                }
                catch(e)
                {
                }
                
                var save = lazyCallback(saveNow, 500);


                function addToStart(items)
                {
                    items.forEach(function(item)
                    {
                       updates.start[/*item.group || */item.supervisordName] = 1; 
                       updates.stop[/*item.group || */item.supervisordName] = 1;
                    });


                    save();
                }

                function addToStop(items)
                {
                    items.forEach(function(item)
                    {
                       updates.stop[/*item.group || */item.supervisordName] = 1; 
                    });

                    save();
                }
                
                collection.addListener("insert", addToStart);
                collection.addListener("update", addToStart);
                collection.addListener("remove", addToStop);
                //collection.addListener("findOne", save);
            });
        }
    };
       
}

