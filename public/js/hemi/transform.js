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

		// Containers for motions and manips to allow them to be reused and save some memory
		// allocation costs.
	var movables = [],
		motions = [],
		resizables = [],
		turnables = [];

	motions[hemi.MotionType.ROTATE] = {
		create: function() { return new hemi.Rotator(); },
		storage: []
	};
	motions[hemi.MotionType.SCALE] = {
		create: function() { return new hemi.Scalor(); },
		storage: []
	};
	motions[hemi.MotionType.TRANSLATE] = {
		create: function() { return new hemi.Translator(); },
		storage: []
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Transform class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Transform performs hierarchical matrix transformations.
	 */
	var Transform = function() {
		THREE.Object3D.call(this);

		/*
		 * The Manipulator that allows the user to control the Transform through mouse interaction.
		 * @type Manipulator
		 */
		this._manip = null;

		/*
		 * A container of any Motions that are currently animating the Transform.
		 * @type Object
		 */
		this._motions = {};

		/**
		 * Flag indicating if the Transform should be pickable by mouse clicks.
		 * @type boolean
		 * @default true
		 */
		this.pickable = true;
		// this.opacity?
	};

	Transform.prototype = new THREE.Object3D();
	Transform.constructor = Transform;

	/*
	 * Remove all references in the Transform.
	 */
	Transform.prototype._clean = function() {
		this.cancelInteraction();
		this.cancelMotion(hemi.MotionType.ROTATE);
		this.cancelMotion(hemi.MotionType.SCALE);
		this.cancelMotion(hemi.MotionType.TRANSLATE);
		this.parent.remove(this);
		
		var children = [].concat(this.children);

		for (var i = 0, il = children.length; i < il; ++i) {
			children[i].cleanup();
		}
	};

	/**
	 * Use the given Object3D to initialize properties.
	 * 
	 * @param {THREE.Object3D} obj Object3D to use to initialize properties
	 * @param {Object} toConvert look-up structure to get the Transform equivalent of an Object3D
	 *     for animations
	 */
	Transform.prototype._init = function(obj, toConvert) {
		var children = this.children;
		// This is important since THREE.KeyFrameAnimation relies on updating a shared reference to
		// the matrix.
		this.matrix = obj.matrix;
		this.matrixWorld = obj.matrixWorld;
		this.updateMatrix();
		this.updateMatrixWorld();
		this.children = [];

		if (toConvert[obj.id] !== undefined) {
			toConvert[obj.id] = this;
		}

		for (var i = 0, il = children.length; i < il; ++i) {
			var child = children[i],
				childObj = obj.getChildByName(child.name, false);

			this.add(child);
			child._init(childObj, toConvert);
		}
	};

	/*
	 * Array of Hemi Messages that Transform is known to send.
	 * @type string[]
	 */
	Transform.prototype._msgSent = [hemi.msg.move, hemi.msg.resize, hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Transform.
	 * @type string[]
	 */
	Transform.prototype._octane = ['name', 'children', 'pickable', 'visible', 'position',
			'rotation', 'quaternion', 'scale', 'useQuaternion'];

	/**
	 * Add the given motion type to the Transform with the given velocity and/or acceleration.
	 * 
	 * @param {hemi.MotionType} type the type of motion to add
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for the motion
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for the motion
	 */
	Transform.prototype.addMotion = function(type, opt_velocity, opt_acceleration) {
		var motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		if (motion) {
			if (opt_acceleration !== undefined) {
				motion.setAcceleration(opt_acceleration);
			}
			if (opt_velocity !== undefined) {
				motion.setVelocity(opt_velocity);
			}
		}
	};

	/**
	 * Cancel the current interaction that is enabled for the Transform (movable, resizable or
	 * turnable).
	 */
	Transform.prototype.cancelInteraction = function() {
		if (this._manip) {

			if (this._manip instanceof hemi.Movable) {
				removeMovable(this._manip);
			} else if (this._manip instanceof hemi.Resizable) {
				removeResizable(this._manip);
			} else if (this._manip instanceof hemi.Turnable) {
				removeTurnable(this._manip);
			} else {
				console.log('Unrecognized manip type: ' + this._manip);
			}

			this._manip = null;
		}
	};

	/**
	 * Cancel any motion of the given type that is currently enabled for the Transform.
	 * 
	 * @param {hemi.MotionType} type the type of motion to cancel
	 */
	Transform.prototype.cancelMotion = function(type) {
		var motion = this._motions[type];

		if (motion) {
			removeMotion(motion, type);
			this._motions[type] = undefined;
		}
	};

	/**
	 * Get all of the child Transforms that are under the Transform.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Transform.prototype.getAllChildren = function(opt_arr) {
		opt_arr = opt_arr || [];

		for (var i = 0, il = this.children.length; i < il; ++i) {
			var child = this.children[i];
			opt_arr.push(child);
			child.getAllChildren(opt_arr);
		}

		return opt_arr;
	};

	/**
	 * Set all of the Transform's properties to their identity values.
	 */
	Transform.prototype.identity = function() {
		this.position.set(0, 0, 0);
		this.quaternion.set(0, 0, 0, 1);
		this.rotation.set(0, 0, 0);
		this.scale.set(1, 1, 1);
		this.matrix.identity();
		this.updateMatrixWorld();
	};

	/**
	 * Allow the Transform to be moved (translated) through mouse interaction along the given plane.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make movable
	 *     as one group with the Transform
	 */
	Transform.prototype.makeMovable = function(plane, opt_limits, opt_transforms) {
		if (this._manip) {
			removeMovable(this._manip);
		}

		this._manip = getMovable(plane, opt_limits);
		opt_transforms = opt_transforms || [];
		opt_transforms.unshift(this);

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Allow the Transform to be resized (scaled) through mouse interaction along the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make resizable
	 *     as one group with the Transform
	 */
	Transform.prototype.makeResizable = function(axis, opt_transforms) {
		if (this._manip) {
			removeResizable(this._manip);
		}

		this._manip = getResizable(axis);
		opt_transforms = opt_transforms || [];
		opt_transforms.unshift(this);

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Allow the Transform to be turned (rotated) through mouse interaction about the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make turnable
	 *     as one group with the Transform
	 */
	Transform.prototype.makeTurnable = function(axis, opt_limits, opt_transforms) {
		if (this._manip) {
			removeTurnable(this._manip);
		}

		this._manip = getTurnable(axis, opt_limits);
		opt_transforms = opt_transforms || [];
		opt_transforms.unshift(this);

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Animate the Transform moving by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to move the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this move cannot be interrupted by
	 *     a different move before it finishes
	 * @return {boolean} true if the Transform will start moving, false if it will not
	 */
	Transform.prototype.move = function(delta, time, opt_mustComplete) {
		var type = hemi.MotionType.TRANSLATE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		return motion.move(delta, time, opt_mustComplete);
	};

	/**
	 * Animate the Transform resizing by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} scale XYZ amount to scale the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this resize cannot be interrupted
	 *     by a different resize before it finishes
	 * @return {boolean} true if the Transform will start resizing, false if it will not
	 */
	Transform.prototype.resize = function(scale, time, opt_mustComplete) {
		var type = hemi.MotionType.SCALE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		return motion.resize(scale, time, opt_mustComplete);
	};

	/**
	 * Animate the Transform turning by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to turn the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this turn cannot be interrupted by
	 *     a different turn before it finishes
	 * @return {boolean} true if the Transform will start turning, false if it will not
	 */
	Transform.prototype.turn = function(theta, time, opt_mustComplete) {
		var type = hemi.MotionType.ROTATE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		return motion.turn(theta, time, opt_mustComplete);
	};

	hemi.makeCitizen(Transform, 'hemi.Transform', {
		cleanup: Transform.prototype._clean,
		toOctane: Transform.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Mesh class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Mesh performs hierarchical matrix transformations and contains geometry and
	 * rendering materials.
	 */
	var Mesh = function() {
		THREE.Mesh.call(this);

		/*
		 * The Manipulator that allows the user to control the Mesh through mouse interaction.
		 * @type Manipulator
		 */
		this._manip = null;

		/*
		 * A container of any Motions that are currently animating the Mesh.
		 * @type Object
		 */
		this._motions = {};

		/**
		 * Flag indicating if the Mesh should be pickable by mouse clicks.
		 * @type boolean
		 * @default true
		 */
		this.pickable = true;
		// this.opacity?
	};

	Mesh.prototype = new THREE.Mesh();
	Mesh.constructor = Mesh;

	/*
	 * Remove all references in the Mesh.
	 */
	Mesh.prototype._clean = Transform.prototype._clean;

	/*
	 * Use the given Mesh to initialize properties.
	 * 
	 * @param {THREE.Mesh} obj Mesh to use to initialize properties
	 * @param {Object} toConvert look-up structure to get the hemi.Mesh equivalent of a THREE.Mesh
	 *     for animations
	 */
	Mesh.prototype._init = function(obj, toConvert) {
		this.geometry = obj.geometry;
		this.material = obj.material;
		this.boundRadius = obj.boundRadius;

		if (this.geometry.morphTargets.length) {
			this.morphTargetBase = obj.morphTargetBase;
			this.morphTargetForcedOrder = obj.morphTargetForcedOrder;
			this.morphTargetInfluences = obj.morphTargetInfluences;
			this.morphTargetDictionary = obj.morphTargetDictionary;
		}

		Transform.prototype._init.call(this, obj, toConvert);
	};

	/*
	 * Array of Hemi Messages that Mesh is known to send.
	 * @type string[]
	 */
	Mesh.prototype._msgSent = Transform.prototype._msgSent;

	/*
	 * Octane properties for Mesh.
	 * @type string[]
	 */
	Mesh.prototype._octane = Transform.prototype._octane;

	/**
	 * Add the given motion type to the Mesh with the given velocity and/or acceleration.
	 * 
	 * @param {hemi.MotionType} type the type of motion to add
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for the motion
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for the motion
	 */
	Mesh.prototype.addMotion = Transform.prototype.addMotion;

	/**
	 * Cancel the current interaction that is enabled for the Mesh (movable, resizable or turnable).
	 */
	Mesh.prototype.cancelInteraction = Transform.prototype.cancelInteraction;

	/**
	 * Cancel any motion of the given type that is currently enabled for the Mesh.
	 * 
	 * @param {hemi.MotionType} type the type of motion to cancel
	 */
	Mesh.prototype.cancelMotion = Transform.prototype.cancelMotion;

	/**
	 * Get all of the child Transforms that are under the Mesh.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Mesh.prototype.getAllChildren = Transform.prototype.getAllChildren;

	/**
	 * Set all of the Transform's properties to their identity values.
	 */
	Mesh.prototype.identity = Transform.prototype.identity;

	/**
	 * Allow the Mesh to be moved (translated) through mouse interaction along the given plane.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make movable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.makeMovable = Transform.prototype.makeMovable;

	/**
	 * Allow the Mesh to be resized (scaled) through mouse interaction along the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make resizable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.makeResizable = Transform.prototype.makeResizable;

	/**
	 * Allow the Mesh to be turned (rotated) through mouse interaction about the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make turnable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.makeTurnable = Transform.prototype.makeTurnable;

	/**
	 * Animate the Mesh moving by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to move the Mesh by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this move cannot be interrupted by
	 *     a different move before it finishes
	 * @return {boolean} true if the Mesh will start moving, false if it will not
	 */
	Mesh.prototype.move = Transform.prototype.move;

	/**
	 * Animate the Mesh resizing by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} scale XYZ amount to scale the Mesh by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this resize cannot be interrupted
	 *     by a different resize before it finishes
	 * @return {boolean} true if the Mesh will start resizing, false if it will not
	 */
	Mesh.prototype.resize = Transform.prototype.resize;

	/**
	 * Animate the Mesh turning by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to turn the Mesh by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this turn cannot be interrupted by
	 *     a different turn before it finishes
	 * @return {boolean} true if the Mesh will start turning, false if it will not
	 */
	Mesh.prototype.turn = Transform.prototype.turn;

	hemi.makeCitizen(Mesh, 'hemi.Mesh', {
		cleanup: Mesh.prototype._clean,
		toOctane: Mesh.prototype._octane
	});

// No extra functionality, but these are useful as Citizens/Octanable.

	hemi.makeCitizen(THREE.Scene, 'hemi.Scene');
	hemi.makeOctanable(THREE.Vector3, 'THREE.Vector3', ['x', 'y', 'z']);
	hemi.makeOctanable(THREE.Quaternion, 'THREE.Quaternion', ['x', 'y', 'z', 'w']);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get a motion object of the given type. This may be a newly constructed one or a cached one
	 * that was no longer being used.
	 * 
	 * @param {hemi.MotionType} type the type of motion to get
	 * @return {Motion} the newly constructed or cached motion object
	 */
	function getMotion(type) {
		var obj = motions[type],
			motion;

		if (obj) {
			motion = obj.storage.length > 0 ? obj.storage.pop() : obj.create();
		} else {
			console.log('Unrecognized motion type: ' + type);
		}

		return motion;
	}

	/*
	 * Get a Movable of the given type. This may be a newly constructed one or a cached one that was
	 * no longer being used.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @return {hemi.Movable} the newly constructed or cached Movable
	 */
	function getMovable(plane, opt_limits) {
		var movable;

		if (movables.length > 0) {
			movable = movables.pop();
			movable.setPlane(plane);
			movable.enable();
		} else {
			movable = new hemi.Movable(plane);
		}

		if (opt_limits !== undefined) {
			movable.setLimits(opt_limits);
		}

		return movable;
	}

	/*
	 * Get a Resizable of the given type. This may be a newly constructed one or a cached one that
	 * was no longer being used.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @return {hemi.Resizable} the newly constructed or cached Resizable
	 */
	function getResizable(axis) {
		var resizable;

		if (resizables.length > 0) {
			resizable = resizables.pop();
			resizable.setAxis(axis);
			resizable.enable();
		} else {
			resizable = new hemi.Resizable(axis);
		}

		return resizable;
	}

	/*
	 * Get a Turnable of the given type. This may be a newly constructed one or a cached one that
	 * was no longer being used.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @return {hemi.Turnable} the newly constructed or cached Turnable
	 */
	function getTurnable(axis, opt_limits) {
		var turnable;

		if (turnables.length > 0) {
			turnable = turnables.pop();
			turnable.setAxis(axis);
			turnable.enable();
		} else {
			turnable = new hemi.Turnable(axis);
		}

		if (opt_limits !== undefined) {
			turnable.setLimits(opt_limits);
		}

		return turnable;
	}

	/*
	 * Clear the given motion object of its attributes and cache it for future use (unless the cache
	 * is full).
	 * 
	 * @param {Motion} motion the motion object to clear and cache
	 * @param {hemi.MotionType} type the type of motion
	 */
	function removeMotion(motion, type) {
		var obj = motions[type];
		motion.clear();

		if (obj) {
			obj.storage.length > 10 ? motion.cleanup() : obj.storage.push(motion);
		} else {
			console.log('Unrecognized motion type: ' + type);
		}
	}

	/*
	 * Clear the given Movable of its attributes and cache it for future use (unless the cache is
	 * full).
	 * 
	 * @param {hemi.Movable} movable the movable to clear and cache
	 */
	function removeMovable(movable) {
		movable.clear();
		movables.length > 10 ? movable.cleanup() : movables.push(movable);
	}

	/*
	 * Clear the given Resizable of its attributes and cache it for future use (unless the cache is
	 * full).
	 * 
	 * @param {hemi.Resizable} resizable the resizable to clear and cache
	 */
	function removeResizable(resizable) {
		resizable.clear();
		resizables.length > 10 ? resizable.cleanup() : resizables.push(resizable);
	}

	/*
	 * Clear the given Turnable of its attributes and cache it for future use (unless the cache is
	 * full).
	 * 
	 * @param {hemi.Turnable} turnable the turnable to clear and cache
	 */
	function removeTurnable(turnable) {
		turnable.clear();
		turnables.length > 10 ? turnable.cleanup() : turnables.push(turnable);
	}

})();
