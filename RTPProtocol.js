/*
    La lógica de RTPProtocol es sencilla, sólo requiere crear un paquete 
    RTP de tamaño adecuado new Buffer(RTP_HEADER_SIZE + RTP_FRAGMENTATION_HEADER_SIZE + payload.length)
    e introducir en él los campos como especifica la RFC3350 perfectamente calculados.

    NOTA:
    Notar que la RFC exige que el formato de los campos sea en orden de red (network byte order)
    o sea, el byte de mayor peso primero.
    Esto se le ha denominado en la Big Endian y se tiene en cuenta a la hora de usar las funciones del módulo Buffer

*/

var events = require('events');
var util = require('util');


// Standard and RFC set these values
var REFERENCE_CLOCK_FREQUENCY = 90000;

// RTP packet constants and masks
var RTP_HEADER_SIZE = 12;
var RTP_FRAGMENTATION_HEADER_SIZE = 4;

var SAMPLES_PER_FRAME = 1152; // ISO 11172-3
var SAMPLING_FREQUENCY = 44100;
var TIMESTAMP_DELTA = Math.floor(SAMPLES_PER_FRAME * REFERENCE_CLOCK_FREQUENCY / SAMPLING_FREQUENCY);
var SECONDS_PER_FRAME = SAMPLES_PER_FRAME / SAMPLING_FREQUENCY;

var RTPProtocol = function(){
    events.EventEmitter.call(this);
    this.setMarker = false;
    this.ssrc = Math.floor(Math.random() * 100000);
    this.seqNum = Math.floor(Math.random() * 1000);
    this.timestamp = Math.floor(Math.random() * 1000);
};

util.inherits(RTPProtocol, events.EventEmitter);

RTPProtocol.prototype.pack = function(payload) {

    ++this.seqNum;
    
    // RFC3550 says it must increase by the number of samples 
    // sent in a block in case of CBR audio streaming
    this.timestamp += TIMESTAMP_DELTA;

    if (!payload) {
        /*
            Tried to send a packet, but packet was not ready. 
            Timestamp and Sequence Number should be increased 
            anyway 'cause interval callback was called and 
            that's like sending silence
        */
        this.setMarker = true;
    }else{
        
        var RTPPacket = new Buffer(RTP_HEADER_SIZE + RTP_FRAGMENTATION_HEADER_SIZE + payload.length);
        // version = 2:   10
        // padding = 0:   0
        // extension = 0: 0
        // CRSCCount = 0: 0000
        
        //10000000 -> 128
        RTPPacket.writeUInt8(128, 0);
        
        //Marker Bit = 0
        //RFC 1890: RTP Profile for Audio and Video Conferences with Minimal Control
        // Payload = 14: (MPEG Audio Only)     0001110
        RTPPacket.writeUInt8(this.setMarker? 142 : 14, 1);
        this.setMarker = false;
        
        // el número de secuencia, inicializado en el constructor con un valor aleato-rio
        RTPPacket.writeUInt16BE(this.seqNum, 2);
        // el timestamp, cuyo valor inicial es aleatorio y se calcula en el constructor
        RTPPacket.writeUInt32BE(this.timestamp, 4);
        //el identificador de fuente SSRC.
        RTPPacket.writeUInt32BE(this.ssrc, 8);
        // RFC 2250: RTP Payload Format for MPEG1/MPEG2 Video
        // 3.5 MPEG Audio-specific header
        RTPPacket.writeUInt32BE(0, 12);
        
        //Completamos el paquete añadiendo el frame MP3 a continuación de las cabece-ras
        payload.copy(RTPPacket, 16);
        //return RTPPacket;
        this.emit('packet', RTPPacket);
        
    }

};

module.exports = RTPProtocol;