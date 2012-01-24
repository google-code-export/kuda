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

		// Static helper objects shared by all motions
	var _vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Contants
////////////////////////////////////////////////////////////////////////////////////////////////////

	hemi.MotionType = {
		ROTATE: 'rotate',
		SCALE: 'scale',
		TRANSLATE: 'translate'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Test if the Rotator/Scalor/Translator should be a render listener or not.
	 */
	function shouldRender() {
		if (!this.enabled ||  (this.accel.isZero() && this.vel.isZero())) {
			hemi.removeRenderListener(this);
		} else {
			hemi.addRenderListener(this);
		}
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Rotator class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Rotator makes automated rotation easier by allowing simple calls such as setVel to
	 * begin the automated spinning of a Transform.
	 *
	 * @param {hemi.Transform} opt_tran optional transform that will be rotating
	 * @param {Object} opt_config optional configuration for the Rotator
	 */
	var Rotator = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this._transform = null;
		this.accel = cfg.accel || new THREE.Vector3();
		this.angle = cfg.angle || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.steadyRotate = false;
		this.mustComplete = false;
		this.startAngle = this.angle.clone();
		this.stopAngle = this.angle.clone();

		if (opt_tran !== undefined) {
			this.setTransform(opt_tran);
		}

		this.enable();
	};

	/*
	 * Octane properties for Rotator.
	 * @type string[]
	 */
	Rotator.prototype._octane = ['accel', 'angle', 'vel'];

	/**
	 * Clear properties like acceleration, velocity, etc.
	 */
	Rotator.prototype.clear = function() {
		this.accel.set(0, 0, 0);
		this.angle.set(0, 0, 0);
		this.vel.set(0, 0, 0);
	};

	/**
	 * Disable animation for the Rotator.
	 */
	Rotator.prototype.disable = function() {
		if (this.enabled) {
			hemi.removeRenderListener(this);
			this.enabled = false;
		}
	};

	/**
	 * Enable animation for the Rotator.
	 */
	Rotator.prototype.enable = function() {
		this.enabled = true;
		shouldRender.call(this);
	};

	/**
	 * Perform Newtonian calculations on the rotating object, starting with the angular velocity.
	 *
	 * @param {Object} event the render event
	 */
	Rotator.prototype.onRender = function(event) {
		if (!this._transform) return;

		var t = event.elapsedTime;

		if (this.steadyRotate) {
			this.time += t;

			if (this.time >= this.stopTime) {
				hemi.removeRenderListener(this);
				this.time = this.stopTime;
				this.angle.copy(this.stopAngle);
				this.steadyRotate = this.mustComplete = false;
				this._transform.send(hemi.msg.stop, {});
			} else {
				hemi.utils.lerpVec3(this.startAngle, this.stopAngle, this.time / this.stopTime,
					this.angle);
			}
		} else {
			this.vel.addSelf(_vector.copy(this.accel).multiplyScalar(t));
			this.angle.addSelf(_vector.copy(this.vel).multiplyScalar(t));
		}

		applyRotator.call(this);
	};

	/**
	 * Make the Rotator rotate the specified amount in the specified amount of time.
	 *
	 * @param {THREE.Vector3} theta XYZ amounts to rotate (in radians)
	 * @param {number} time number of seconds for the rotation to take
	 * @param {boolean} opt_mustComplete optional flag indicating that no other rotations can be
	 *     started until this one finishes
	 * @return {boolean} true if the Rotator will start turning, false if it will not
	 */
	Rotator.prototype.turn = function(theta, time, opt_mustComplete) {
		if (!this.enabled || this.mustComplete) return false;

		this.mustComplete = opt_mustComplete || false;
		this.time = 0;
		this.stopTime = time || 0.001;
		this.steadyRotate = true;
		this.startAngle.copy(this.angle);
		this.stopAngle.add(this.angle, theta);
		hemi.addRenderListener(this);
		this._transform.send(hemi.msg.start, {});
		return true;
	};

	/**
	 * Set the angular acceleration.
	 *
	 * @param {THREE.Vector3} acceleration XYZ angular acceleration (in radians)
	 */
	Rotator.prototype.setAcceleration = function(acceleration) {
		this.accel.copy(acceleration);
		shouldRender.call(this);
	};

	/**
	 * Set the current rotation angle.
	 *
	 * @param {THREE.Vector3} theta XYZ rotation angle (in radians)
	 */
	Rotator.prototype.setAngle = function(theta) {
		this.angle.copy(theta);
		applyRotator.call(this);
	};

	/**
	 * Set the given Transform for the Rotator to control rotating.
	 *
	 * @param {hemi.Transform} transform the Transform to rotate
	 */
	Rotator.prototype.setTransform = function(transform) {
		hemi.utils.useEuler(transform);
		this._transform = transform;
		this.angle.copy(transform.rotation);
	};

	/**
	 * Set the angular velocity.
	 *
	 * @param {THREE.Vector3} velocity XYZ angular velocity (in radians)
	 */
	Rotator.prototype.setVelocity = function(velocity) {
		this.vel.copy(velocity);
		shouldRender.call(this);
	};

// Private functions

	/*
	 * Apply the Rotator's calculated angle to its Transform's rotation.
	 */
	function applyRotator() {
		if (this._transform.useQuaternion) {
			this._transform.useQuaternion = false;
		}

		this._transform.rotation.copy(this.angle);
		this._transform.updateMatrix();
		this._transform.updateMatrixWorld();
	}

	hemi.Rotator = Rotator;
	hemi.makeOctanable(hemi.Rotator, 'hemi.Rotator', hemi.Rotator.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Translator class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Translator provides easy setting of linear velocity and acceleration of Transforms.
	 * 
	 * @param {hemi.Transform} opt_tran optional Transform that will be moving
	 * @param {Object} opt_config optional configuration for the Translator
	 */
	var Translator = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this._transform = null;
		this.pos = cfg.pos || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();
		this.accel = cfg.accel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.mustComplete = false;
		this.steadyMove = false;
		this.startPos = this.pos.clone();
		this.stopPos = this.pos.clone();

		if (opt_tran !== undefined) {
			this.setTransform(opt_tran);
		}

		this.enable();
	};

	/*
	 * Octane properties for Translator.
	 * @type string[]
	 */
	Translator.prototype._octane = ['accel', 'pos', 'vel'];

	/**
	 * Clear properties like acceleration, velocity, etc.
	 */
	Translator.prototype.clear = function() {
		this.pos.set(0, 0, 0);
		this.vel.set(0, 0, 0);
		this.accel.set(0, 0, 0);
	};

	/**
	 * Disable animation for the Translator. 
	 */
	Translator.prototype.disable = function() {
		if (this.enabled) {
			hemi.removeRenderListener(this);
			this.enabled = false;
		}
	};

	/**
	 * Enable animation for the Translator. 
	 */
	Translator.prototype.enable = function() {
		this.enabled = true;
		shouldRender.call(this);
	};

	/**
	 * Make the Translator translate the specified amount in the specified amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to translate
	 * @param {number} time number of seconds for the translation to take
	 * @param {boolean} opt_mustComplete optional flag indicating that no other translations can be
	 *     started until this one finishes
	 * @return {boolean} true if the Translator will start moving, false if it will not
	 */
	Translator.prototype.move = function(delta, time, opt_mustComplete) {
		if (!this.enabled || this.mustComplete) return false;

		this.mustComplete = opt_mustComplete || false;
		this.time = 0;
		this.stopTime = time || 0.001;
		this.steadyMove = true;
		this.startPos.copy(this.pos);
		this.stopPos.add(this.pos, delta);
		hemi.addRenderListener(this);
		this._transform.send(hemi.msg.start,{});
		return true;
	};

	/**
	 * Calculate the position of the Translator based on the acceleration and velocity.
	 * 
	 * @param {Object} event the render event
	 */
	Translator.prototype.onRender = function(event) {
		if (!this._transform) return;

		var t = event.elapsedTime;

		if (this.steadyMove) {
			this.time += t;

			if (this.time >= this.stopTime) {
				hemi.removeRenderListener(this);
				this.time = this.stopTime;
				this.pos.copy(this.stopPos);
				this.steadyMove = this.mustComplete = false;
				this._transform.send(hemi.msg.stop,{});
			} else {
				hemi.utils.lerpVec3(this.startPos, this.stopPos, this.time / this.stopTime,
					this.pos);
			}
		} else {
			this.vel.addSelf(_vector.copy(this.accel).multiplyScalar(t));
			this.pos.addSelf(_vector.copy(this.vel).multiplyScalar(t));
		}

		applyTranslator.call(this);
	};

	/**
	 * Set the acceleration.
	 * 
	 * @param {THREE.Vector3} acceleration XYZ acceleration vector
	 */
	Translator.prototype.setAcceleration = function(acceleration) {
		this.accel.copy(acceleration);
		shouldRender.call(this);
	};

	/**
	 * Set the position.
	 * 
	 * @param {THREE.Vector3} position XYZ position
	 */
	Translator.prototype.setPosition = function(position) {
		this.pos.copy(position);
		applyTranslator.call(this);
	};

	/**
	 * Set the given Transform for the Translator to control translating.
	 *
	 * @param {hemi.Transform} transform the Transform to translate
	 */
	Translator.prototype.setTransform = function(transform) {
		this._transform = transform;
		this.pos.copy(transform.position);
	};

	/**
	 * Set the velocity.
	 * 
	 * @param {THREE.Vector3} velocity XYZ velocity vector
	 */
	Translator.prototype.setVelocity = function(velocity) {
		this.vel.copy(velocity);
		shouldRender.call(this);
	};

// Private functions

	/*
	 * Apply the Translator's calculated position to its Transform's position.
	 */
	function applyTranslator() {
		this._transform.position.copy(this.pos);
		this._transform.updateMatrix();
		this._transform.updateMatrixWorld();
	}

	hemi.Translator = Translator;
	hemi.makeOctanable(hemi.Translator, 'hemi.Translator', hemi.Translator.prototype._octane);

})();
