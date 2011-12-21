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
 * and rotating objects in the scene.
 */

var hemi = (function(hemi) {

    hemi = hemi || {};

    /**
     * @class A Rotator makes automated rotation easier by allowing simple
     * calls such as setVel to begin the automated spinning of a Transform.
     * @extends hemi.world.Citizen
     *
     * @param {THREE.Object3d} opt_tran optional transform that will be spinning
     * @param {Object} opt_config optional configuration for the Rotator
     */
    hemi.RotatorBase = function(opt_tran, opt_config) {
        var cfg = opt_config || {};

        this.accel = cfg.accel || new THREE.Vector3();
        this.angle = cfg.angle || new THREE.Vector3();
        this.vel = cfg.vel || new THREE.Vector3();

        this.time = 0;
        this.stopTime = 0;
        this.steadyRotate = false;
        this.mustComplete = false;
        this.startAngle = this.angle.clone();
        this.stopAngle = this.angle.clone();
        this.toLoad = {};
        this.transformObjs = [];

        if (opt_tran != null) {
            this.addTransform(opt_tran);
        }

        this.enable();
    };

    hemi.RotatorBase.prototype = {
        /**
         * Add a Transform to the list of Transforms that will be spinning. A
         * child Transform is created to allow the Rotator to spin about an
         * arbitray axis.
         *
         * @param {THREE.Object3D} transform the Transform to add
         */
        addTransform : function(transform) {
            this.transformObjs.push(transform);
            applyRotator.call(this, [transform]);
        },

        /**
         * Clear properties like acceleration, velocity, etc.
         */
        clear: function() {
            this.accel = new THREE.Vector3(0,0,0);
            this.angle =  new THREE.Vector3(0,0,0);
            this.vel =  new THREE.Vector3(0,0,0);
        },

        /**
         * Clear the list of spinning Transforms.
         */
        clearTransforms: function() {
            while (this.transformObjs.length > 0) {
                removeRotateTransforms.call(this, this.transformObjs[0]);
            }
        },

        /**
         * Disable mouse interaction for the Rotator.
         */
        disable: function() {
            if (this.enabled) {
                hemi.removeRenderListener(this);
                this.enabled = false;
            }
        },

        /**
         * Enable mouse interaction for the Rotator.
         */
        enable: function() {
            this.enabled = true;
            shouldRender.call(this);
        },

        /**
         * Get the Transforms that the Rotator currently contains.
         *
         * @return {THREE.Object3D[]} array of Transforms
         */
        getTransforms: function() {
            return this.transformObjs.slice();
        },

        /**
         * Make the Rotator rotate the specified amount in the specified amount
         * of time.
         *
         * @param {THREE.Vecto3} theta XYZ amounts to rotate (in radians)
         * @param {number} time number of seconds for the rotation to take
         * @param {boolean} opt_mustComplete optional flag indicating that no
         *     other rotations can be started until this one finishes
         */
        rotate: function(theta,time,opt_mustComplete) {
            if (!this.enabled || this.mustComplete) return false;
            this.time = 0;
            this.stopTime = time || 0.001;
            this.steadyRotate = true;
            this.startAngle = this.angle.clone();
            this.mustComplete = opt_mustComplete || false;
            this.stopAngle.add(this.angle, theta);
            hemi.addRenderListener(this);
            this.send(hemi.msg.start,{});
            return true;
        },

        /**
         * Render event listener - Perform Newtonian calculations on the
         * rotating object, starting with the angular velocity.
         *
         * @param {o3d.Event} event message describing the render event
         */
        onRender: function(event) {
            if (this.transformObjs.length > 0) {
                var t = event.elapsedTime;
                if (this.steadyRotate) {
                    this.time += t;
                    if (this.time >= this.stopTime) {
                        this.time = this.stopTime;
                        this.steadyRotate = this.mustComplete = false;
                        hemi.removeRenderListener(this);
                        this.send(hemi.msg.stop,{});
                    }
                    var t1 = this.time/this.stopTime;
                    var newAngle = hemi.utils.lerp(
                        [this.startAngle.x, this.startAngle.y, this.startAngle.z],
                        [this.stopAngle.x, this.stopAngle.y, this.stopAngle.z],
                        t1);
                    this.angle.x = newAngle[0];
					this.angle.y = newAngle[1];
					this.angle.z = newAngle[2];
                } else {
                    this.vel.addSelf(this.accel.clone().multiplyScalar(t));
                    this.angle.addSelf(this.vel.clone().multiplyScalar(t));
                }

                applyRotator.call(this);
            }
        },

		removeTransforms : function(tranObj) {
			var ndx = this.transformObjs.indexOf(tranObj);

			if (ndx > -1) {
				this.transformObjs.splice(ndx, 1);
			}
		},

        /**
         * Set the angular acceleration.
         *
         * @param {THREE.Vector3} accel XYZ angular acceleration (in radians)
         */
        setAccel: function(accel) {
            this.accel = accel.clone();
            shouldRender.call(this);
        },

        /**
         * Set the current rotation angle.
         *
         * @param {THREE.Vector3} theta XYZ rotation angle (in radians)
         */
        setAngle: function(theta) {
            this.angle = theta.clone();
            applyRotator.call(this);
        },
		
		/**
		 * Set the origin of the Rotator transform.
		 * 
		 * @param {number[3]} origin amount to shift the origin by
		 */
		setOrigin: function(origin) {
			var originVec = new THREE.Vector3().set(-origin[0], -origin[1], -origin[2]),
				tranMat = new THREE.Matrix4().setTranslation(-origin[0], -origin[1], -origin[2]);

			for (var i = 0, il = this.transformObjs.length; i < il; ++i) {
				var transform = this.transformObjs[i],
					geometry = transform.geometry,
					scene = transform.parent,
					world = transform.matrixWorld,
					delta = new THREE.Vector3().multiply(originVec, transform.scale),
					dx = delta.x,
					dy = delta.y,
					dz = delta.z;

				while (scene.parent != null) {
					scene = scene.parent;
				}

				// Re-center geometry around given origin
				hemi.utils.shiftGeometry(transform, tranMat, scene);

				// Offset local position so geometry's world position doesn't change
				delta.x = dx * world.n11 + dy * world.n12 + dz * world.n13;
				delta.y = dx * world.n21 + dy * world.n22 + dz * world.n23;
				delta.z = dx * world.n31 + dy * world.n32 + dz * world.n33;
				transform.position.subSelf(delta);
				transform.updateMatrix();
				transform.updateMatrixWorld();
			}
		},

        /**
         * Set the angular velocity.
         *
         * @param {THREE.Vector3} vel XYZ angular velocity (in radians)
         */
        setVel: function(vel) {
            this.vel = vel.clone();
            shouldRender.call(this);
        },

        /**
         * Get the Octane structure for the Rotator.
         *
         * @return {Object} the Octane structure representing the Rotator
         */
        toOctane: function() {
            var octane = this._super(),
                valNames = ['accel', 'angle', 'vel'];

            for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
                var name = valNames[ndx];

                octane.props.push({
                    name: name,
                    val: this[name]
                });
            }

            octane.props.push({
                name: 'setOrigin',
                arg: [this.origin]
            });

            // Save the local matrices of the transforms so we can restore them
            var tranOct = {};

            for (var i = 0, il = this.transformObjs.length; i < il; i++) {
                var tranObj = this.transformObjs[i],
                    origTran = tranObj.offTran,
                    rotTran = tranObj.rotTran;

                // Note: this will break if the Rotator has more than one
                // transform with the same name
                tranOct[origTran.name] = [
                    tranObj.parent.localMatrix,
                    rotTran.localMatrix,
                    origTran.localMatrix
                ];
            }

            octane.props.push({
                name: 'toLoad',
                val: tranOct
            });

            return octane;
        }
    };

    hemi.makeCitizen(hemi.RotatorBase, 'hemi.Rotator', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
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
		    return this.transformObjs.slice();
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
			this.startPos = this.pos.clone();
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
	};

	applyTranslator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];

			transform.position = this.pos.clone();
			transform.updateMatrix();
			transform.updateMatrixWorld();
		}
	};

	
	applyRotator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];

			if (transform.useQuaternion) {
				transform.quaternion.setFromEuler(new THREE.Vector3(
				 this.angle.x * hemi.RAD_TO_DEG, this.angle.y * hemi.RAD_TO_DEG, this.angle.z * hemi.RAD_TO_DEG));
			} else {
				transform.rotation.copy(this.angle);
			}

			transform.updateMatrix();
			transform.updateMatrixWorld();
		}
	};

	return hemi;
})(hemi || {});