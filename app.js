var Mp3Library = require('./lib/Mp3Library');


var library = new Mp3Library({ basedir: './songs/' });


library.on("ready",function(){
    console.log("Mp3 ready");
});