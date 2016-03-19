var events = require('events');
var util = require('util');

/*
    MP3Source debe emitir el evento ’frame’ a la frecuencia que se emitiría un frame
    si fuera una fuente auténtica de audio en tiempo real. 
*/

// El estándar MP3 fija por definición que un frame consta de 1152 muestras.
var SAMPLES_PER_FRAME = 1152; // from ISO11172
// Cada segundo se generan 44100 muestras
var SAMPLING_FREQUENCY = 44100;

var SECONDS_PER_FRAME = SAMPLES_PER_FRAME / SAMPLING_FREQUENCY;

function Mp3Source(library){

	events.EventEmitter.call(this);

	this.library = library;
	this.playlist = library.getPlaylist();

	this.trackNumber = 0;
	this.frameNumber = 0;
	this.paused = false;
	//Retornamos cada frame a 26 milisegundos
	setInterval(function(){
		if (this.paused) return;
		var frame = library.songsDB[this.playlist[this.trackNumber]][this.frameNumber++];
		if (frame) {
			this.emit('frame', frame);
		} else {
			this.next();
		}
	}.bind(this), SECONDS_PER_FRAME * 1000);
}

util.inherits(Mp3Source, events.EventEmitter);

Mp3Source.prototype.play = function(){
	this.paused = false;
	this.emit('track', this.playlist[this.trackNumber]);
}

Mp3Source.prototype.pause = function(){
	this.paused = true;
	this.emit('pause', this.playlist[this.trackNumber]);
}

Mp3Source.prototype.stop = function(){
	this.paused = true;
    // It would be desirable that 'stop'
    // destroyed SetInterval to destroy
    // the source later
}

Mp3Source.prototype.next = function(){
	this.frameNumber = 0;
	if (++this.trackNumber > this.playlist.length - 1) {
		this.pause();
		this.trackNumber = 0;
		this.emit('listEnd');
	}else{
        this.emit('track', this.playlist[this.trackNumber]);
    }
	
}

Mp3Source.prototype.prev = function(){
	this.frameNumber = 0;
	if (--this.trackNumber < 0) {
		this.trackNumber = 0;
		this.emit('listBegining');
	}else{
        this.emit('track', this.playlist[this.trackNumber]);
    }
}

Mp3Source.prototype.list = function(){
	return this.playlist;
}

Mp3Source.prototype.currentTrack = function(){
	return this.playlist[this.trackNumber];
}

module.exports = Mp3Source;