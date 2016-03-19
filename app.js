var Mp3Library = require('./lib/Mp3Library');
var Mp3Source = require('./lib/Mp3Source.js');

var library = new Mp3Library({ basedir: './songs/' });

library.on("ready",function(){
    console.log("Mp3 ready");
    var mp3source = new Mp3Source(library);
    mp3source.on('track', function(){
        
    });
    mp3source.on('frame', function(frame){
        console.log("Frame ....");
        console.log(frame);
    });
});