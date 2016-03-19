var Promise = require("bluebird");
var events = require('events'); 
var util = require('util');
var fs = Promise.promisifyAll(require("fs"));

// MP3 frames constants and masks
var DEFAULT_BITRATE = 128 * 1000;
var MP3_FRAME_HEADER_SIZE = 4;
var SYNC_MASK = 0xFFF00000;
var MP3_SIGNATURE = 0x000A0000;

function Mp3Library(options){
	
	events.EventEmitter.call(this);
	
	this.basedir = options.basedir || './songs/';
	this.songsDB = {};
    
	fs.readdirAsync(this.basedir)
    .then(function(files){
        this.playlist = files;
		this.tracks = this.playlist.length;
		this._generateTracks();
    }.bind(this))
    .catch(function(err){
        console.log("Readdir Error !!!");
        console.log(err);
    });
}


util.inherits(Mp3Library, events.EventEmitter);

Mp3Library.prototype._generateTrackFor = function(songName){
    
   return fs.readFileAsync(this.basedir + songName)
   .then(function(song){
       if (!this.songsDB[songName]) {
           var framedSong = [];
           var currentSongOffset = 0;
           while(currentSongOffset < song.length){
               var frameHeader;
               var synced = false;
               try{
                   while (~synced) {
                       frameHeader = song.readUInt32BE(currentSongOffset++);
                       synced = (frameHeader & SYNC_MASK) >> 20;
                       var mp3 = (frameHeader & MP3_SIGNATURE) >> 17;
                       if (mp3 != 5) synced = false;
                   }
               } catch(e){
                  /* 
                    Out of Bounds Error: sync not found in whole file so trying with next one
                    Maybe last frame is not synced and when trying to read it, it generates an OoBE
                    but the whole song has been read correctly. Checking it here.
                  */
                  if ( currentSongOffset + 2 < song.length) {
                      console.log("Cannot sync whole file, next one, please.\n", e)
                      return; // Out from outer loop
                  }
              }
              
              var hasPadding = (frameHeader & 0x0000200) >> 9;
              // Explain 417 here
              var frameSize = 417 + (hasPadding? 1 : 0);
              var frame;
              try{
                  frame = song.slice(currentSongOffset - 1, currentSongOffset - 1 + frameSize);
                  framedSong.push(frame);
                  currentSongOffset += frameSize - 1;
              } catch(e) {
                  // Out of Bounds Error: it was the last frame in file, so finished
                  return;
              }       
          }
          
          this.songsDB[songName] = framedSong;
         
        }
       
     }.bind(this));
}


Mp3Library.prototype._generateTracks = function(){
    
    Promise
    .all(this.playlist.map(this._generateTrackFor.bind(this)))
    .then(function(){
        console.log("Mp3 Library Ready ....");
        console.log(this.songsDB);
        this.emit("ready", this.playlist);
    }.bind(this));
    
}

Mp3Library.prototype.getPlaylist = function(){
	return this.playlist;
}

Mp3Library.prototype.getFrameFromTrack = function(frameNumber, trackNumber){
	return this.songsDB[ this.playlist[trackNumber] ][frameNumber];
}

module.exports = Mp3Library;