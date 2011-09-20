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

                var output = outputDir + '/'+ collection.name +'.conf';

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

                        if(!groupedPrograms[script.group]) groupedPrograms[script.group] = [];

                        groupedPrograms[script.group].push(script.supervisordName);

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

                    
                    beet.client.reloadConfig(function(err, result)
                    {
                        beet.emit('restart');
                    });
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
                        else
                        if(type == 'group')
                        {
                            (sectionSettings.programs || '').split(',').forEach(function(program)
                            {
                               programs[program].group = sectionName;
                            });
                        }

                    }

                    collection.objects(programsAr);
                }
                catch(e)
                {
                }
                
                var save = lazyCallback(saveNow, 500);
                
                collection.addListener("insert", save);
                collection.addListener("remove", save);
                collection.addListener("update", save);
                //collection.addListener("findOne", save);
            });
        }
    };
       
}

