/*
    La UDPSender maneja la comunicación con la red. 
    Se encarga de enviar los paquetes que genera el protocolo RTP a la dirección multicast
    empleando UDP. Por tanto, se hará que responda a los eventos ’packet’ que genera el
    módulo RTPProtocol
*/

var dgram = require('dgram');

var UDPSender = function(options){

	var options = options || {}
	this.port = options.port || 5000;
	this.broadcastAddress = options.broadcastAddress || '224.0.0.14';
    console.log("Broadcasting in", this.broadcastAddress, "port", this.port);
	
    /*
        Recaba información sobre la cantidad de paquetes y bytes enviados con propósitos 
        estadísticos que cualquier cliente puede consultar enviándole un datagrama.
    */
    
    this.stats = {
        txPackets : 0,
        txBytes : 0
    };
    
    /*
        Por esta doble función que desempeña entonces, esta clase consta de dos sockets:
        - txSocket -> Para emitir al grupo multicast.
        - rxScoket -> Para recibir las peticiones de datos estadísticos.
    */

    this.txSocket = dgram.createSocket('udp4');
    this.rxSocket = dgram.createSocket('udp4');
};

UDPSender.prototype.start = function(){

    this.rxSocket.bind(5001);
};

UDPSender.prototype.broadcast = function(packet){

    this.txSocket.send(packet, 0, packet.length, this.port, this.broadcastAddress, function(err, bytes){
        ++this.stats.txPackets;
        this.stats.txBytes += bytes;
    }.bind(this));
};

UDPSender.prototype.enableStats = function(enable){


    if (enable){
        this.rxSocket.on("message", function(msg, rinfo){
            var stats = new Buffer(JSON.stringify(this.stats));
            this.rxSocket.send(stats, 0, stats.length, rinfo.port, rinfo.address);
        }.bind(this))
    }else{
        this.rxSocket.removeAllListeners();
    }

};

UDPSender.prototype.end = function(){
    this.rxSocket.close();
    this.txSocket.close();
}

module.exports = UDPSender;
