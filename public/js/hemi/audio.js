/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

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

	var Audio = function() {
			
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
		
	/**
	 * Add the given URL as a source for the audio file to load.
	 * 
	 * @param {string} url the URL of the audio file
	 * @param {string} type the type of the audio file (ogg, mpeg, etc)
	 */
	Audio.prototype.addUrl =  function(url, type) {
		var src = document.createElement('source'),
			loadUrl = hemi.getLoadPath(url);
		
		src.setAttribute('src', loadUrl);
		src.setAttribute('type', 'audio/' + type);
		this.audio.appendChild(src);
		this.urls.push({
			url: url,
			type: type,
			node: src
		});
	};
		
	/**
	 * Get the length of the current audio media.
	 * 
	 * @return {number} length of media in seconds
	 */
	Audio.prototype.getDuration = function() {
		if (this.audio) {
			return this.audio.duration;
		} else {
			return null;
		}
	};
		
	/**
	 * Get the current volume of the audio media. Volume ranges from 0.0 to
	 * 1.0.
	 * 
	 * @return {number} the current volume
	 */
	Audio.prototype.getVolume = function() {
		if (this.audio) {
			return this.audio.volume;
		} else {
			return null;
		}
	};
		
	/**
	 * Pause the audio media if it is currently playing.
	 */
	Audio.prototype.pause = function() {
		if (this.audio && !this.audio.paused) {
			this.audio.pause();
			this.startPlay = false;
		}
	};
		
	/**
	 * Play the audio media if it is not already doing so. If the media is
	 * in the middle of a seek operation, the Audio will wait until it
	 * finishes before playing.
	 */
	Audio.prototype.play = function() {
		if (this.audio) {
			if (this.seeking) {
				this.startPlay = true;
			} else if (this.audio.paused || this.audio.ended) {
				this.audio.play();
			}
		}
	};
		
	/**
	 * Remove the given URL as a source for the audio file to load.
	 * 
	 * @param {string} url the URL to remove
	 */
	Audio.prototype.removeUrl = function(url) {
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
	};
		
	/**
	 * Set the audio media's current time to the given time. If the media is
	 * currently playing, it will pause until the seek operation finishes.
	 * 
	 * @param {number} time the time to seek to in seconds
	 */
	Audio.prototype.seek = function(time) {
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
	};
		
	/**
	 * Set if the audio media should loop when it ends.
	 * 
	 * @param {boolean} looping flag to indicate if the media should loop
	 */
	Audio.prototype.setLoop = function(looping) {
		if (this.looping !== looping) {
			this.looping = looping;
			
			if (this.audio) {
//					this.setLoop_();	*see below*
			}
		}
	};
		
	/*
	 * This is the proper way to set looping for HTML5 audio tags.
	 * Unfortunately Firefox doesn't currently support this feature, so we
	 * have to hack it in the ended event.
	 */
	Audio.prototype.setLoop_ = function() {
		if (this.looping) {
			this.audio.setAttribute('loop', 'loop');
		} else {
			this.audio.removeAttribute('loop');
		}
	};
		
	/**
	 * Set the volume of the audio media. Volume ranges from 0.0 to 1.0.
	 * 
	 * @param {number} volume the volume to set
	 */
	Audio.prototype.setVolume = function(volume) {
		if (this.audio) {
			this.audio.volume = volume;
		}
	};
		
	/**
	 * Get the Octane structure for the Audio.
     *
     * @return {Object} the Octane structure representing the Audio
	 */
	Audio.prototype.toOctane = function() {
		var octane = this._super();
		
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
	};

	hemi.makeCitizen(Audio, 'hemi.Audio', {
		cleanup: function() {
			this.audio = null;
			this.urls = [];
		},
		msgs: [hemi.msg.load, hemi.msg.start, hemi.msg.stop, hemi.msg.unload],
		toOctane: []
	});


	return hemi;
})(hemi || {});