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

/**
 * @fileoverview Motion describes classes for automatically translating
 * 		and rotating objects in the scene.
 */

var hemi = (function(hemi) {

	/**
	 * @class A Translator provides easy setting of linear velocity and
	 * acceleration of shapes and transforms in the 3d scene.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {THREE.Object3D} opt_tran optional Transform that will be moving
	 * @param {Object} opt_config optional configuration for the Translator
	 */
	hemi.TranslatorBase = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this.pos = cfg.pos || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();
		this.accel = cfg.accel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.mustComplete = false;
		this.steadyMove = false;
		this.startPos = this.pos.clone();
		this.stopPos = this.pos.clone();
		this.toLoad = {};
		this.transformObjs = [];

		if (opt_tran != null) {
			this.addTransform(opt_tran);
		}

		this.enable();
	};


	hemi.TranslatorBase.prototype = {
		/**
		 * Add the Transform to the list of Transforms that will be moving.
		 *
		 * @param {THREE.Object3D} transform the Transform to add
		 */
		addTransform: function(transform) {
			this.transformObjs.push(transform);
			applyTranslator.call(this, [transform]);
		},

		/**
		 * Send a cleanup Message and remove all references in the Translator.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
		},

		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.pos = new THREE.Vector3();
			this.vel = new THREE.Vector3();
			this.accel = new THREE.Vector3();
		},

		/**
		 * Clear the list of translating Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				this.removeTransform(this.transformObjs[0]);
			}
		},

		/**
		 * Disable mouse interaction for the Translator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.removeRenderListener(this);
				this.enabled = false;
			}
		},

		/**
		 * Enable mouse interaction for the Translator. 
		 */
		enable: function() {
			this.enabled = true;
			shouldRender.call(this);
		},

		/**
		 * Get the Transforms that the Translator currently contains.
		 * 
		 * @return {THREE.Object3D[]} array of Transforms
		 */
		getTransforms: function() {
			var trans = [];

			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				trans.push(this.transformObjs[i]);
			}

			return trans;
		},

		/**
		 * Make the Translator translate the specified amount in the specified
		 * amount of time.
		 * 
		 * @param {THREE.Vector3} delta XYZ amount to translate
		 * @param {number} time number of seconds for the translation to take
		 * @param {boolean} opt_mustComplete optional flag indicating that no
		 *     other translations can be started until this one finishes
		 */
		move : function(delta,time,opt_mustComplete) {
			if (!this.enabled || this.mustComplete) return false;
			this.time = 0;
			this.stopTime = time || 0.001;
			this.steadyMove = true;
			this.startPos = this.pos;
			this.mustComplete = opt_mustComplete || false;
			this.stopPos.add(this.pos, delta);
			hemi.addRenderListener(this);
			this.send(hemi.msg.start,{});
			return true;
		},

		/**
		 * Render event listener - calculate the position of the Translator,
		 * based on the acceleration and velocity.
		 * 
		 * @param {o3d.Event} event message describing render event
		 */
		onRender : function(event) {
			if (this.transformObjs.length > 0) {
				var t = event.elapsedTime;
				if (this.steadyMove) {
					this.time += t;
					if (this.time >= this.stopTime) {
						this.time = this.stopTime;
						this.steadyMove = this.mustComplete = false;
						hemi.removeRenderListener(this);
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.time/this.stopTime;
					var newPos = hemi.utils.lerp(
						[this.startPos.x, this.startPos.y, this.startPos.z],
						[this.stopPos.x, this.stopPos.y, this.stopPos.z],
						t1);
					this.pos.x = newPos[0];
					this.pos.y = newPos[1];
					this.pos.z = newPos[2];
				} else {
					this.vel.addSelf(this.accel.clone().multiplyScalar(t));
					this.pos.addSelf(this.vel.clone().multiplyScalar(t));
				}

				applyTranslator.call(this);
			}
		},

		removeTransforms : function(tranObj) {
			var ndx = this.transformObjs.indexOf(tranObj);

			if (ndx > -1) {
				this.transformObjs.splice(ndx, 1);
			}
		},

		/**
		 * Set the acceleration.
		 * 
		 * @param {THREE.Vector3} a XYZ acceleration vector
		 */
		setAccel: function(a) {
			this.accel = a.clone();
			shouldRender.call(this);
		},

		/**
		 * Set the position.
		 * 
		 * @param {THREE.Vector3} x XYZ position
		 */
		setPos: function(x) {
			this.pos = x.clone();
			applyTranslator.call(this);
		},

		/**
		 * Set the velocity.
		 * @param {THREE.Vector3} v XYZ velocity vector
		 */
		setVel: function(v) {
			this.vel = v.clone();
			shouldRender.call(this);
		}
	};


	hemi.makeCitizen(hemi.TranslatorBase, 'hemi.Translator', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});

	///////////////////////////////////////////////////////////////////////////
	// Private functions
	///////////////////////////////////////////////////////////////////////////
	shouldRender = function() {
		if (!this.enabled ||  (this.accel.isZero() && this.vel.isZero())) {
			hemi.removeRenderListener(this);
		} else {
			hemi.addRenderListener(this);
		}
	},

	applyTranslator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];
			hemi.utils.identity(transform);
			transform.position = this.pos.clone();
			transform.updateMatrix();
		}
	};

	return hemi;
})(hemi || {});