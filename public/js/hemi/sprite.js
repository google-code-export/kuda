/*
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 SRI International
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated  documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the  Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {

////////////////////////////////////////////////////////////////////////////////////////////////////
// Sprite class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Sprite can display a 2d image on a plane with several options. The image can be made
	 * to always face the camera, and it can scale to stay the same size in the viewer. It can also
	 * cycle through a series of frames to create an animation effect, for a number of cycles or
	 * indefinitely.
	 * 
	 * @param {number} width the width of the sprite
	 * @param {number} height the height of the sprite
	 * @param {string} opt_source the location of a source image to start with (not implemented)
	 */
	var Sprite = function(client, parameters) {
		// before super(), set up all the maps and then assign the first in the series as the map
		var maps = parameters.maps,
			count = 0;

		/*
		 * The current animation time for the Sprite.
		 * @type number
		 */
		this._clock = 0;
		/*
		 * The current animation cycle for the Sprite.
		 * @type number
		 */
		this._cycle = 0;
		/*
		 * Array of textures to display as animation frames.
		 */
		this._maps = [];
		/*
		 * The number of cycles to run for before the Sprite stops animating.
		 * @type number
		 */
		this._maxCycles = 0;
		/*
		 * Flag indicating if Sprite animation is currently running.
		 * @type boolean
		 */
		this._running = false;
		/**
		 * The Client that the Sprite is being rendered by.
		 * @type hemi.Client
		 */
		this.client = client;
		/**
		 * The period of time that each frame of the Sprite's animation will display, in seconds.
		 * @type number
		 */
		this.period = 1;

		for (var i = 0, il = maps.length; i < il; ++i) {
			var map = maps[i];

			if (map instanceof THREE.Texture) {
				this._maps.push(map);
				handleTexture();
			} else {
				this.addFrame(map, handleTexture);
			}

			if (i === 0) {
				parameters.map = this._maps[0];
				THREE.Sprite.call(this, parameters);
			}
		}

		function handleTexture() {
			if (++count >= maps.length && parameters.callback) {
				parameters.callback();
			}
		}

		client.scene.add(this);
	};

	Sprite.prototype = new THREE.Sprite({ map: new THREE.Texture(new Image()) });
	Sprite.prototype.constructor = Sprite;

	/**
	 * Add an image to be used as a frame in the animation, or as a standalone image.
	 *
	 * @param {string} path the path to the image source
	 */
	Sprite.prototype.addFrame = function(path, opt_callback) {
		var texture = hemi.loadTextureSync(path, function(texture) {
				if (opt_callback) {
					opt_callback(texture);
				}
			});

		this._maps.push(texture);
	};

	/**
	 * Function to call on every render cycle. Scale or rotate the Sprite if needed, and update the
	 * frame if needed.
	 *
	 *	@param {Object} e render event
	 */
	Sprite.prototype.onRender = function(e) {
		if (!this._running) return;

		this._clock += e.elapsedTime;

		if (this._clock >= this.period) {
			this._cycle++;

			if (this._cycle === this._maxCycles) {
				this.stop();
			} else {
				this.setFrame(this._cycle);
				this._clock %= this.period;
			}
		}
	};

	/**
	 * Start the Sprite animating, for a set number of cycles, or pass in -1 for infinite looping.
	 *
	 * @param {number} opt_cycles number of cycles, defaults to one loop through the frames
	 */
	Sprite.prototype.run = function(opt_cycles) {
		if (!this._running) {
			this._cycle = 0;
			this._maxCycles = opt_cycles || this.samplers.length;
			this._clock = 0;
			this.setFrame(0);
			this._running = true;
			hemi.addRenderListener(this);
		}
	};

	/**
	 * Set the Sprite to display one of its frames.
	 *
	 * @param {number} index index of desired frame
	 */
	Sprite.prototype.setFrame = function(index) {
		// set the map to the frame at the given index
		if (this._maps.length > 0) {
			var ndx = index % this._maps.length;
			this.map = this._maps[ndx];
		}
	};

	/**
	 * Stop the animating frames.
	 */
	Sprite.prototype.stop = function() {
		if (this._running) {
			this._running = false;
			hemi.removeRenderListener(this);
		}
	}; 

	hemi.makeCitizen(Sprite, 'hemi.Sprite', {
	});

})();
