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

/**
 * @fileoverview The Sprite class allows for the easy creation of 2d animated sprites
 *		and billboards in the 3d world.
 */

(function() {
	/**
	 * @class A Sprite can display a 2d image on a plane with several options.
	 * The image can be made to always face the camera, and it can scale to
	 * stay the same size in the viewer. It can also cycle through a series of
	 * frames to create an animation effect, for a number of cycles or
	 * indefinitely.
	 * 
	 * @param {number} width the width of the sprite
	 * @param {number} height the height of the sprite
	 * @param {string} opt_source the location of a source image to start with (not implemented)
	 */
	var Sprite = function(client, parameters) {
		// before super(), set up all the maps and then assign the first in the series as the map
		var maps = parameters.maps, 
			i, il, map, count = 0;
			
		this.maps = [];
		
		for (i = 0, il = maps.length; i < il; i++) {
			map = maps[i];
			this.maps.push((parameters.map instanceof THREE.Texture) ? map : 
				THREE.ImageUtils.loadTexture(hemi.loadPath + map, null, function() {
					count++;
					if (count >= il && parameters.callback) {
						parameters.callback();
					}
				}));
		}
		
		parameters.map = this.maps[0];
		
		THREE.Sprite.call(this, parameters);
		
		this.cycle = 0;
		this.maxCycles = 0;
		this.clock = 0;
		this.period = 1;
		this.running = false;
		this.client = client;
		
		client.scene.add(this);
	};

	Sprite.prototype = new THREE.Sprite({ map: new THREE.Texture(new Image()) });
	Sprite.prototype.constructor = Sprite;
	Sprite.prototype.supr = THREE.Sprite.prototype;
	
	
	/**
	 * Add an image to be used as a frame in the animation, or as a
	 * standalone image.
	 *
	 * @param {string} path the path to the image source
	 */
	Sprite.prototype.addFrame = function(path, opt_callback) {
		this.maps.push(THREE.ImageUtils.loadTexture(hemi.loadPath + path, null, opt_callback));
	};

	/**
	 * Function to call on every render cycle. Scale or rotate the Sprite if
	 * needed, and update the frame if needed.
	 *
	 *	@param {o3d.RenderEvent} e Message describing this render loop
	 */
	Sprite.prototype.onRender = function(e) {
		if (!this.running) {
			return;
		}
		this.clock += e.elapsedTime;
		if (this.clock >= this.period) {
			this.cycle++;
			if (this.cycle == this.maxCycles) {
				this.stop();
			} else {
				this.setFrame(this.cycle);
				this.clock %= this.period;
			}
		}
	};

	/**
	 * Start the Sprite animating, for a set number of cycles, or pass in -1
	 * for infinite looping.
	 *
	 * @param {number} opt_cycles Number of cycles, defaults to one loop
	 *     through the frames
	 */
	Sprite.prototype.run = function(opt_cycles) {
		this.cycle = 0;
		this.maxCycles = opt_cycles || this.samplers.length;
		this.clock = 0;
		this.setFrame(0);
		this.running = true;
		hemi.addRenderListener(this);
	};

	/**
	 * Set the Sprite to display one of it's frames.
	 *
	 * @param {number} index Index of desired frame
	 */
	Sprite.prototype.setFrame = function(index) {
		// set the map to the frame at the given index
		if (this.maps.length > 0) {
			var ndx = index % this.maps.length;
			this.map = this.maps[ndx];
		}
	};

	/**
	 * Set the period of time, in seconds, that each frame of the Sprite's
	 * animation will display.
	 *
	 * @param {number} period Period, in seconds
	 */
	Sprite.prototype.setPeriod = function(period) {
		this.period = period;
	};

	/**
	 * Stop the animating frames.
	 */
	Sprite.prototype.stop = function() {
		this.running = false;
	};


////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Hemi Citizenship		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	hemi.makeCitizen(Sprite, 'hemi.Sprite', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
})();