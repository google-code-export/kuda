/* 
 * Kuda includes a library and editor for authoring interactive 3D content for the web.
 * Copyright (C) 2011 SRI International.
 *
 * This program is free software; you can redistribute it and/or modify it under the terms
 * of the GNU General Public License as published by the Free Software Foundation; either 
 * version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; 
 * if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 * Boston, MA 02110-1301 USA.
 */

o3djs.require('hemi.core');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for supporting audio playback with HTML5's audio tag.
	 */
	hemi.audio = hemi.audio || {};

	/**
	 * @class An Audio contains an audio DOM element that can be played, paused,
	 * etc.
	 * @extends hemi.world.Citizen
	 */
	hemi.audio.Audio = function() {
		hemi.world.Citizen.call(this);
		
		/*
		 * The actual audio DOM element.
		 */
		this.audio = document.createElement('audio');
		/*
		 * Flag indicating if the Audio should loop when it ends.
		 */
		this.looping = false;
		/*
		 * Flag indicating if a seek operation is currently happening.
		 */
		this.seeking = false;
		/*
		 * Flag indicating if the Audio should start playing when the current
		 * seek operation finishes.
		 */
		this.startPlay = false;
		/*
		 * Array of objects containing source URLs, types, and DOM elements.
		 */
		this.urls = [];
		var that = this;
		
		// For now, onevent functions (like onemptied) are not supported for
		// media elements in Webkit browsers.
		this.audio.addEventListener('emptied', function(e) {
				that.send(hemi.msg.unload, { });
			}, true);
		this.audio.addEventListener('loadeddata', function(e) {
//				that.setLoop_();	*see below*
				that.send(hemi.msg.load, {
					src: that.audio.currentSrc
				});
			}, true);
		this.audio.addEventListener('playing', function(e) {
				that.send(hemi.msg.start, { });
			}, true);
		this.audio.addEventListener('ended', function(e) {
				if (that.looping) {
					that.play();
				}
				
				that.send(hemi.msg.stop, { });
			}, true);
	};
	
	hemi.audio.Audio.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.audio.Audio',
		
		/**
		 * Add the given URL as a source for the audio file to load.
		 * 
		 * @param {string} url the URL of the audio file
		 * @param {string} type the type of the audio file (ogg, mpeg, etc)
		 */
		addUrl: function(url, type) {
			var src = document.createElement('source'),
				loadUrl = hemi.loader.getPath(url);
			
			src.setAttribute('src', loadUrl);
			src.setAttribute('type', 'audio/' + type);
			this.audio.appendChild(src);
			this.urls.push({
				url: url,
				type: type,
				node: src
			});
		},
		
		/**
		 * Send a cleanup Message and remove all references in the Audio.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.audio = null;
			this.urls = [];
		},
		
		/**
		 * Get the length of the current audio media.
		 * 
		 * @return {number} length of media in seconds
		 */
		getDuration: function() {
			if (this.audio) {
				return this.audio.duration;
			} else {
				return null;
			}
		},
		
		/**
		 * Get the current volume of the audio media. Volume ranges from 0.0 to
		 * 1.0.
		 * 
		 * @return {number} the current volume
		 */
		getVolume: function() {
			if (this.audio) {
				return this.audio.volume;
			} else {
				return null;
			}
		},
		
		/**
		 * Pause the audio media if it is currently playing.
		 */
		pause: function() {
			if (this.audio && !this.audio.paused) {
				this.audio.pause();
				this.startPlay = false;
			}
		},
		
		/**
		 * Play the audio media if it is not already doing so. If the media is
		 * in the middle of a seek operation, the Audio will wait until it
		 * finishes before playing.
		 */
		play: function() {
			if (this.audio) {
				if (this.seeking) {
					this.startPlay = true;
				} else if (this.audio.paused || this.audio.ended) {
					this.audio.play();
				}
			}
		},
		
		/**
		 * Remove the given URL as a source for the audio file to load.
		 * 
		 * @param {string} url the URL to remove
		 */
		removeUrl: function(url) {
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				if (urlObj.url === url) {
					this.audio.removeChild(urlObj.node);
					this.urls.splice(i, 1);
					
					if (urlObj.node.src === this.audio.currentSrc) {
						this.audio.load();
					}
					
					break;
				}
			}
		},
		
		/**
		 * Set the audio media's current time to the given time. If the media is
		 * currently playing, it will pause until the seek operation finishes.
		 * 
		 * @param {number} time the time to seek to in seconds
		 */
		seek: function(time) {
			if (this.audio && time >= 0 && time < this.audio.duration) {
				var that = this,
					notify = function() {
						that.audio.removeEventListener('seeked', notify, true);
						that.seeking = false;
						
						if (that.startPlay) {
							that.startPlay = false;
							that.play();
						}
					};
				
				this.audio.addEventListener('seeked', notify, true);
				this.seeking = true;
				this.startPlay = !this.audio.paused;
				this.audio.currentTime = time;
			}
		},
		
		/**
		 * Set if the audio media should loop when it ends.
		 * 
		 * @param {boolean} looping flag to indicate if the media should loop
		 */
		setLoop: function(looping) {
			if (this.looping !== looping) {
				this.looping = looping;
				
				if (this.audio) {
//					this.setLoop_();	*see below*
				}
			}
		},
		
		/*
		 * This is the proper way to set looping for HTML5 audio tags.
		 * Unfortunately Firefox doesn't currently support this feature, so we
		 * have to hack it in the ended event.
		 */
		setLoop_: function() {
			if (this.looping) {
				this.audio.setAttribute('loop', 'loop');
			} else {
				this.audio.removeAttribute('loop');
			}
		},
		
		/**
		 * Set the volume of the audio media. Volume ranges from 0.0 to 1.0.
		 * 
		 * @param {number} volume the volume to set
		 */
		setVolume: function(volume) {
			if (this.audio) {
				this.audio.volume = volume;
			}
		},
		
		/**
		 * Get the Octane structure for the Audio.
	     *
	     * @return {Object} the Octane structure representing the Audio
		 */
		toOctane: function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'looping',
				val: this.looping
			});
			
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				octane.props.push({
					name: 'addUrl',
					arg: [urlObj.url, urlObj.type]
				});
			}
			
			return octane;
		}
	};

	hemi.audio.Audio.inheritsFrom(hemi.world.Citizen);
	hemi.audio.Audio.prototype.msgSent =
		hemi.audio.Audio.prototype.msgSent.concat([hemi.msg.load,
			hemi.msg.start, hemi.msg.stop, hemi.msg.unload]);

	return hemi;
})(hemi || {});