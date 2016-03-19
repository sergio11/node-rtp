var Mp3Library = require('./lib/Mp3Library');
var Mp3Source = require('./lib/Mp3Source.js');
var RTPProtocol = require('./RTPProtocol.js');

var library = new Mp3Library({ basedir: './songs/' });

library.on("ready",function(){
    console.log("Mp3 ready");
    var mp3source = new Mp3Source(library);
    var rtpprotocol = new RTPProtocol();
    mp3source.on('track', function(){
        /*
            El marker bit se actives para señalizar de esta manera al receptor
            que empieza una nueva canción.
        */
        
        
    });
    
    /*
        Los frames que la fuente MP3 emite deben ser encapsulados en un paquete RTP 
        con su cabecera perfectamente formada antes de ser enviados al grupo multicast.
        Por este motivo se hará que el objeto RTPProtocol atienda los eventos ’frame’ 
        que emite MP3Source.
    */
    mp3source.on('frame', function(frame){
        console.log("Packing ...");
        rtpprotocol.pack(frame);
    });
    
    rtpprotocol.on('packet', function(packet){
        console.log("RTP Package");
        console.log(packet);
    });
});