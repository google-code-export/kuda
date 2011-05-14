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
o3djs.require('hemi.core');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for defining animated sprites and billboards.
	 */
	hemi.sprite = hemi.sprite || {};

	/**
	 * @class A Sprite can display a 2d image on a plane with several options.
	 * The image can be made to always face the camera, and it can scale to
	 * stay the same size in the viewer. It can also cycle through a series of
	 * frames to create an animation effect, for a number of cycles or
	 * indefinitely.
	 * 
	 * @param {number} width The width of the sprite
	 * @param {number} height The height of the sprite
	 * @param {string} opt_source The location of a source image to start with (not implemented)
	 */
	hemi.sprite.Sprite = function(width,height,opt_source) {
		var core = hemi.core;
		var pack = core.mainPack;
		var viewInfo = hemi.view.viewInfo;
		this.material = pack.createObject('Material');
		this.material.createParam('emissiveSampler','o3d.ParamSampler');
		core.material.attachStandardEffect(pack,this.material,viewInfo,'constant');
		this.material.getParam('o3d.drawList').value = viewInfo.zOrderedDrawList;
		this.material.effect.createUniformParameters(this.material);
		this.plane = core.primitives.createPlane(pack,this.material,width,height,1,1);
		this.transform = pack.createObject('Transform');
		this.transform.addShape(this.plane);
		this.parent(core.client.root);
		this.cycle = 0;
		this.maxCycles = 0;
		this.clock = 0;
		this.period = 1;
		this.running = false;
		this.samplers = [];
		this.lookAtCam = false;
		this.constSize = false;
	};

	hemi.sprite.Sprite.prototype = {
		/**
		 * Add an image to be used as a frame in the animation, or as a standalone image.
		 *
		 * @param {string} path The path to the image source
		 * @param {function(number,hemi.sprite.Sprite):void} opt_callback a
		 * function to call and pass the index and sprite
		 */
		addFrame : function(path, opt_callback) {
			hemi.loader.loadTexture(path,
				function(texture) {
					var sampler = hemi.core.mainPack.createObject('Sampler');
					sampler.texture = texture;
					this.samplers.push(sampler);
					if (opt_callback) opt_callback(this.samplers.length - 1, this);
				}, this);
		},

		/**
		 * Set the sprite to be a constant size in the viewer.
		 *
		 * @param {boolean} enable If true, keep sprite size constant
		 */
		constantSize : function(enable) {
			this.constSize = enable;
		},

		/**
		 * Set the sprite to always look at the camera.
		 *
		 * @param {boolean} enable If true, always look at camera
		 */
		lookAtCamera : function(enable) {
			this.lookAtCam = enable;
		},

		/**
		 * Function to call on every o3d render cycle. Scale or rotate the sprite if needed,
		 *		and update the frame if needed.
		 *
		 *	@param {o3d.renderEvent} e Message describing this render loop
		 */
		onRender : function(e) {
			var p0 = this.transform.getUpdatedWorldMatrix()[3].slice(0,3);
			if (this.lookAtCam) {
				var localP = this.transform.localMatrix[3].slice(0,3);
				this.transform.identity();
				this.transform.translate(localP);
				hemi.utils.pointYAt(
						this.transform,
						p0,
						hemi.world.camera.getEye());
			}
			if (this.constSize) {
				var scale = hemi.core.math.distance(hemi.world.camera.getEye(),p0) *
							Math.asin(hemi.world.camera.fov.current);
				this.transform.scale([scale,1,scale]);
			}
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
		},

		/**
		 * Set the parent of this sprite to a transform.
		 *
		 * @param {o3d.transform} transform Transform to be the new parent
		 */
		parent : function(transform) {
			this.transform.parent = transform;
		},

		/**
		 * Start the sprite animating, for a set number of cycles, or pass in -1
		 *		for infinite looping.
		 *
		 * @param {number} opt_cycles Number of cycles, defaults to one loop through the frames
		 */
		run : function(opt_cycles) {
			this.cycle = 0;
			this.maxCycles = opt_cycles || this.samplers.length;
			this.clock = 0;
			this.setFrame(0);
			this.running = true;
			hemi.view.addRenderListener(this);
		},

		/**
		 * Set the sprite to display one of it's frames.
		 *
		 * @param {number} index Index of desired frame
		 */
		setFrame : function(index) {
			if (this.samplers.length > 0) {
				var ndx = index%this.samplers.length;
				var sampler = this.samplers[ndx];
				this.material.getParam('emissiveSampler').value = sampler;
			}
		},

		/**
		 * Set the period of time, in seconds, that each frame of an animation will display
		 *
		 * @param {number} period Period, in seconds
		 */
		setPeriod : function(period) {
			this.period = period;
		},

		/**
		 * Stop the animating frames.
		 */
		stop : function() {
			this.running = false;
		}
	};

	return hemi;
})(hemi || {});