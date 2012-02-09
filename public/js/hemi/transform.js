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
	var manips = [],
		motions = [],
		// Mapping of previous manip parameters for Transforms and Meshes to enable quick swapping
		// of cancelInteraction and setMovable (for example).
		savedParams = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Contants
////////////////////////////////////////////////////////////////////////////////////////////////////

	hemi.MotionType = {
		MOVE: 'move',
		RESIZE: 'resize',
		TURN: 'turn'
	};

	// We intentionally use the MotionType enum for both manips and motions.
	manips[hemi.MotionType.MOVE] = {
		create: function() { return new hemi.Movable(); },
		storage: []
	};
	manips[hemi.MotionType.RESIZE] = {
		create: function() { return new hemi.Resizable(); },
		storage: []
	};
	manips[hemi.MotionType.TURN] = {
		create: function() { return new hemi.Turnable(); },
		storage: []
	};

	motions[hemi.MotionType.MOVE] = {
		create: function() { return new hemi.Translator(); },
		storage: []
	};
	motions[hemi.MotionType.RESIZE] = {
		create: function() { return new hemi.Scalor(); },
		storage: []
	};
	motions[hemi.MotionType.TURN] = {
		create: function() { return new hemi.Rotator(); },
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
		 * The Rotator that is currently moving the Transform.
		 * @type hemi.Rotator
		 */
		this._rotator = null;

		/*
		 * The Translator that is currently moving the Transform.
		 * @type hemi.Translator
		 */
		this._translator = null;

		/**
		 * Flag indicating if the Transform should be pickable by mouse clicks.
		 * @type boolean
		 * @default true
		 */
		this.pickable = true;
		// this.opacity?

		// Improve performance by having autoupdate default to false
		this.matrixAutoUpdate = false;
	};

	Transform.prototype = new THREE.Object3D();
	Transform.constructor = Transform;

	/*
	 * Remove all references in the Transform.
	 */
	Transform.prototype._clean = function() {
		this.cancelInteraction();
		this.cancelMoving();
		this.cancelResizing();
		this.cancelTurning();

		if (this.parent) {
			this.parent.remove(this);
		}

		var children = [].concat(this.children);

		for (var i = 0, il = children.length; i < il; ++i) {
			children[i].cleanup();
		}

		savedParams[this._getId()] = undefined;
	};

	/*
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
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Transform.prototype._octane = function() {
		var names = ['pickable', 'visible', 'useQuaternion'],
			props = [],
			childArr = [];

		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		for (var i = 0, il = this.children.length; i < il; ++i) {
			childArr[i] = this.children[i]._getId();
		}

		props.push({
			name: 'children',
			id: childArr
		});

		names = ['_manip', '_rotator', '_translator', 'position', 'scale'];

		names.push(this.useQuaternion ? 'quaternion' : 'rotation');

		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			if (this[name]) {
				props.push({
					name: name,
					oct: this[name]._toOctane()
				});
			}
		}

		return props;
	};

	/**
	 * Cancel the current interaction that is enabled for the Transform (movable, resizable or
	 * turnable).
	 */
	Transform.prototype.cancelInteraction = function() {
		if (this._manip) {
			// We will save the manip's current state before we remove it (in case it is restored).
			var params = getParams(this._getId()),
				type;

			if (this._manip instanceof hemi.Movable) {
				type = hemi.MotionType.MOVE;
				params.uv = this._manip._uv.slice(0);
				params.angle = params.scale = undefined;
			} else if (this._manip instanceof hemi.Resizable) {
				type = hemi.MotionType.RESIZE;
				params.scale = this._manip._scale;
				params.angle = params.uv = undefined;
			} else if (this._manip instanceof hemi.Turnable) {
				type = hemi.MotionType.TURN;
				params.angle = this._manip._angle;
				params.scale = params.uv = undefined;
			}

			removeManip(this._manip, type);
			this._manip = null;
		}
	};

	/**
	 * Cancel any translating motion that is currently enabled for the Transform.
	 */
	Transform.prototype.cancelMoving = function() {
		if (this._translator) {
			removeMotion(this._translator, hemi.MotionType.MOVE);
			this._translator = null;
		}
	};

	/**
	 * Cancel any scaling motion that is currently enabled for the Transform.
	 */
	Transform.prototype.cancelResizing = function() {
		// TODO
	};

	/**
	 * Cancel any rotating motion that is currently enabled for the Transform.
	 */
	Transform.prototype.cancelTurning = function(type) {
		if (this._rotator) {
			removeMotion(this._rotator, hemi.MotionType.TURN);
			this._rotator = null;
		}
	};

	/**
	 * Get the current acceleration of the given motion type for the Transform.
	 * 
	 * @param {hemi.MotionType} type the type of motion acceleration to get
	 * @param {THREE.Vector3} opt_accel optional vector to receive acceleration data
	 * @return {THREE.Vector3} the current acceleration of the given motion type
	 */
	Transform.prototype.getAcceleration = function(type, opt_accel) {
		var motion;
		opt_accel = opt_accel || new THREE.Vector3();

		switch (type) {
			case hemi.MotionType.TURN:
				motion = this._rotator;
				break;
			case hemi.MotionType.RESIZE:
				// TODO
				break;
			case hemi.MotionType.MOVE:
				motion = this._translator;
				break;
			default:
				console.log('Unrecognized motion type: ' + type);
				break;
		}

		if (motion) {
			opt_accel.copy(motion.accel);
		} else {
			opt_accel.set(0, 0, 0);
		}

		return opt_accel;
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
	 * Get the current velocity of the given motion type for the Transform.
	 * 
	 * @param {hemi.MotionType} type the type of motion velocity to get
	 * @param {THREE.Vector3} opt_vel optional vector to receive velocity data
	 * @return {THREE.Vector3} the current velocity of the given motion type
	 */
	Transform.prototype.getVelocity = function(type, opt_vel) {
		var motion;
		opt_vel = opt_vel || new THREE.Vector3();

		switch (type) {
			case hemi.MotionType.TURN:
				motion = this._rotator;
				break;
			case hemi.MotionType.RESIZE:
				// TODO
				break;
			case hemi.MotionType.MOVE:
				motion = this._translator;
				break;
			default:
				console.log('Unrecognized motion type: ' + type);
				break;
		}

		if (motion) {
			opt_vel.copy(motion.vel);
		} else {
			opt_vel.set(0, 0, 0);
		}

		return opt_vel;
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
	 * Animate the Transform moving by the given amount over the given amount of time.
	 * 
	 * @param {THREE.Vector3} delta XYZ amount to move the Transform by
	 * @param {number} time the amount of time for the motion to take (in seconds)
	 * @param {boolean} opt_mustComplete optional flag indicating this move cannot be interrupted by
	 *     a different move before it finishes
	 * @return {boolean} true if the Transform will start moving, false if it will not
	 */
	Transform.prototype.move = function(delta, time, opt_mustComplete) {
		if (!this._translator) {
			this._translator = getMotion(hemi.MotionType.MOVE);
			this._translator.setTransform(this);
		}

		return this._translator.move(delta, time, opt_mustComplete);
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
		// TODO
	};

	/**
	 * Allow the Transform to be moved (translated) through mouse interaction along the given plane.
	 * 
	 * @param {hemi.Plane} opt_plane optional 2D plane to enable movement along (default is XZ)
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make movable
	 *     as one group with the Transform
	 */
	Transform.prototype.setMovable = function(opt_plane, opt_limits, opt_transforms) {
		var params = getParams(this._getId()),
			restore = opt_plane == null && opt_limits == null && opt_transforms == null;

		if (this._manip instanceof hemi.Movable) {
			this._manip.clearTransforms();
		} else {
			this.cancelInteraction();
			this._manip = getManip(hemi.MotionType.MOVE);
		}

		if (params.uv === undefined) {
			// Previous manip was not a Movable, so restoring is not possible.
			restore = false;
		} else if (restore) {
			this._manip._uv[0] = params.uv[0];
			this._manip._uv[1] = params.uv[1];
		}

		if (opt_plane !== undefined) {
			this._manip.setPlane(opt_plane);
			params.plane = opt_plane;
		} else if (restore && params.plane) {
			this._manip.setPlane(params.plane);
		}

		if (opt_limits !== undefined) {
			this._manip.setLimits(opt_limits);
			params.limits = opt_limits;
		} else if (restore && params.limits) {
			this._manip.setLimits(params.limits);
		}

		if (opt_transforms !== undefined) {
			opt_transforms = opt_transforms.slice(0);
			opt_transforms.unshift(this);
			params.transforms = opt_transforms;
		} else if (restore && params.transforms) {
			opt_transforms = params.transforms;
		} else {
			opt_transforms = [this];
		}

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Set the Transform to translate with the given velocity and/or acceleration.
	 * 
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for moving
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for moving
	 */
	Transform.prototype.setMoving = function(opt_velocity, opt_acceleration) {
		if (!this._translator) {
			this._translator = getMotion(hemi.MotionType.MOVE);
			this._translator.setTransform(this);
		}

		if (opt_acceleration != null) {
			this._translator.setAcceleration(opt_acceleration);
		}
		if (opt_velocity != null) {
			this._translator.setVelocity(opt_velocity);
		}
	};

	/**
	 * Set the pickable flag for the Transform. NOTE: This is here temporarily for the Editor and
	 * will be going away soon.
	 * 
	 * @param {boolean} pickable flag indicating if the Transform should be pickable
	 */
	Transform.prototype.setPickable = function(pickable) {
		this.pickable = pickable;
	};

	/**
	 * Allow the Transform to be resized (scaled) through mouse interaction along the given axis.
	 * 
	 * @param {hemi.Axis} opt_axis optional axis to enable resizing along (default is Y)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make resizable
	 *     as one group with the Transform
	 */
	Transform.prototype.setResizable = function(opt_axis, opt_transforms) {
		var params = getParams(this._getId()),
			restore = opt_axis == null && opt_transforms == null;

		if (this._manip instanceof hemi.Resizable) {
			this._manip.clearTransforms();
		} else {
			this.cancelInteraction();
			this._manip = getManip(hemi.MotionType.RESIZE);
		}

		if (params.scale === undefined) {
			// Previous manip was not a Resizable, so restoring is not possible.
			restore = false;
		} else if (restore) {
			this._manip._scale = params.scale;
		}

		if (opt_axis !== undefined) {
			this._manip.setAxis(opt_axis);
			params.axis = opt_axis;
		} else if (restore && params.axis) {
			this._manip.setAxis(params.axis);
		}

		if (opt_transforms !== undefined) {
			opt_transforms = opt_transforms.slice(0);
			opt_transforms.unshift(this);
			params.transforms = opt_transforms;
		} else if (restore && params.transforms) {
			opt_transforms = params.transforms;
		} else {
			opt_transforms = [this];
		}

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Set the Transform to scale with the given velocity and/or acceleration.
	 * 
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for resizing
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for resizing
	 */
	Transform.prototype.setResizing = function(opt_velocity, opt_acceleration) {
		// TODO
	};

	/**
	 * Allow the Transform to be turned (rotated) through mouse interaction about the given axis.
	 * 
	 * @param {hemi.Axis} axis optional axis to enable turning about (default is Y)
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make turnable
	 *     as one group with the Transform
	 */
	Transform.prototype.setTurnable = function(opt_axis, opt_limits, opt_transforms) {
		var params = getParams(this._getId()),
			restore = opt_axis == null && opt_limits == null && opt_transforms == null;

		if (this._manip instanceof hemi.Turnable) {
			this._manip.clearTransforms();
		} else {
			this.cancelInteraction();
			this._manip = getManip(hemi.MotionType.TURN);
		}

		if (params.angle === undefined) {
			// Previous manip was not a Turnable, so restoring is not possible.
			restore = false;
		} else if (restore) {
			this._manip._angle = params.angle;
		}

		if (opt_axis !== undefined) {
			this._manip.setAxis(opt_axis);
			params.axis = opt_axis;
		} else if (restore && params.axis) {
			this._manip.setAxis(params.axis);
		}

		if (opt_limits !== undefined) {
			this._manip.setLimits(opt_limits);
			params.limits = opt_limits;
		} else if (restore && params.limits) {
			this._manip.setLimits(params.limits);
		}

		if (opt_transforms !== undefined) {
			opt_transforms = opt_transforms.slice(0);
			opt_transforms.unshift(this);
			params.transforms = opt_transforms;
		} else if (restore && params.transforms) {
			opt_transforms = params.transforms;
		} else {
			opt_transforms = [this];
		}

		for (var i = 0, il = opt_transforms.length; i < il; ++i) {
			this._manip.addTransform(opt_transforms[i]);
		}
	};

	/**
	 * Set the Transform to rotate with the given velocity and/or acceleration.
	 * 
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for turning
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for turning
	 */
	Transform.prototype.setTurning = function(opt_velocity, opt_acceleration) {
		if (!this._rotator) {
			this._rotator = getMotion(hemi.MotionType.TURN);
			this._rotator.setTransform(this);
		}

		if (opt_acceleration != null) {
			this._rotator.setAcceleration(opt_acceleration);
		}
		if (opt_velocity != null) {
			this._rotator.setVelocity(opt_velocity);
		}
	};

	/**
	 * Set the visible flag for the Transform. NOTE: This is here temporarily for the Editor and
	 * will be going away soon.
	 * 
	 * @param {boolean} visible flag indicating if the Transform should be visible
	 */
	Transform.prototype.setVisible = function(visible) {
		this.visible = visible;
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
		if (!this._rotator) {
			this._rotator = getMotion(hemi.MotionType.TURN);
			this._rotator.setTransform(this);
		}

		return this._rotator.turn(theta, time, opt_mustComplete);
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
	var Mesh = function(geometry, material) {
		THREE.Mesh.call(this, geometry, material);

		/*
		 * The Manipulator that allows the user to control the Mesh through mouse interaction.
		 * @type Manipulator
		 */
		this._manip = null;

		/*
		 * The Rotator that is currently moving the Mesh.
		 * @type hemi.Rotator
		 */
		this._rotator = null;

		/*
		 * The Translator that is currently moving the Mesh.
		 * @type hemi.Translator
		 */
		this._translator = null;

		/**
		 * Flag indicating if the Mesh should be pickable by mouse clicks.
		 * @type boolean
		 * @default true
		 */
		this.pickable = true;
		// this.opacity?

		// Improve performance by having autoupdate default to false
		this.matrixAutoUpdate = false;
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
		this.material = obj.opacity != null ? hemi.utils.cloneMaterial(obj.material) : obj.material;
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
	 * @return {Object[]} array of Octane properties
	 */
	Mesh.prototype._octane = function() {
		var props = Transform.prototype._octane.call(this);
		
		props.push({
			name: 'opacity',
			val: this.opacity
		});
		
		return props;
	};
	
	/**
	 * Cancel the current interaction that is enabled for the Mesh (movable, resizable or turnable).
	 */
	Mesh.prototype.cancelInteraction = Transform.prototype.cancelInteraction;

	/**
	 * Cancel any translating motion that is currently enabled for the Mesh.
	 */
	Mesh.prototype.cancelMoving = Transform.prototype.cancelMoving;

	/**
	 * Cancel any scaling motion that is currently enabled for the Mesh.
	 */
	Mesh.prototype.cancelResizing = Transform.prototype.cancelResizing;

	/**
	 * Cancel any rotating motion that is currently enabled for the Mesh.
	 */
	Mesh.prototype.cancelTurning = Transform.prototype.cancelTurning;

	/**
	 * Get the current acceleration of the given motion type for the Mesh.
	 * 
	 * @param {hemi.MotionType} type the type of motion acceleration to get
	 * @param {THREE.Vector3} opt_accel optional vector to receive acceleration data
	 * @return {THREE.Vector3} the current acceleration of the given motion type
	 */
	Mesh.prototype.getAcceleration = Transform.prototype.getAcceleration;

	/**
	 * Get all of the child Transforms that are under the Mesh.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Mesh.prototype.getAllChildren = Transform.prototype.getAllChildren;

	/**
	 * Get the bounding box of the Mesh's geometry in world-space coordinates.
	 * 
	 * @return {hemi.BoundingBox} the world-space bounding box
	 */
	Mesh.prototype.getBoundingBox = function() {
		var box = this.geometry.boundingBox,
			wm = this.matrixWorld;

		if (!box) {
			this.geometry.computeBoundingBox();
			box = this.geometry.boundingBox;
		}

		return new hemi.BoundingBox(wm.multiplyVector3(box.min.clone()),
			wm.multiplyVector3(box.max.clone()));
	};

	/**
	 * Get the current velocity of the given motion type for the Mesh.
	 * 
	 * @param {hemi.MotionType} type the type of motion velocity to get
	 * @param {THREE.Vector3} opt_vel optional vector to receive velocity data
	 * @return {THREE.Vector3} the current velocity of the given motion type
	 */
	Mesh.prototype.getVelocity = Transform.prototype.getVelocity;

	/**
	 * Set all of the Transform's properties to their identity values.
	 */
	Mesh.prototype.identity = Transform.prototype.identity;

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
	 * Allow the Mesh to be moved (translated) through mouse interaction along the given plane.
	 * 
	 * @param {hemi.Plane} plane the 2D plane to enable movement along
	 * @param {number[4]} opt_limits optional array of movement limits within the plane:
	 *     [min on u, max on u, min on v, max on v]
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make movable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.setMovable = Transform.prototype.setMovable;

	/**
	 * Set the Mesh to translate with the given velocity and/or acceleration.
	 * 
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for moving
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for moving
	 */
	Mesh.prototype.setMoving = Transform.prototype.setMoving;

	/**
	 * Set the pickable flag for the Mesh. NOTE: This is here temporarily for the Editor and will be
	 * going away soon.
	 * 
	 * @param {boolean} pickable flag indicating if the Mesh should be pickable
	 */
	Mesh.prototype.setPickable = Transform.prototype.setPickable;

	/**
	 * Allow the Mesh to be resized (scaled) through mouse interaction along the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable resizing along
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make resizable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.setResizable = Transform.prototype.setResizable;

	/**
	 * Set the Mesh to scale with the given velocity and/or acceleration.
	 * 
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for resizing
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for resizing
	 */
	Mesh.prototype.setResizing = Transform.prototype.setResizing;

	/**
	 * Allow the Mesh to be turned (rotated) through mouse interaction about the given axis.
	 * 
	 * @param {hemi.Axis} axis the axis to enable turning about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 * @param {hemi.Transform[]} opt_transforms optional array of extra Transforms to make turnable
	 *     as one group with the Mesh
	 */
	Mesh.prototype.setTurnable = Transform.prototype.setTurnable;

	/**
	 * Set the Mesh to rotate with the given velocity and/or acceleration.
	 * 
	 * @param {THREE.Vector3} opt_velocity optional XYZ velocity to set for turning
	 * @param {THREE.Vector3} opt_acceleration optional XYZ acceleration to set for turning
	 */
	Mesh.prototype.setTurning = Transform.prototype.setTurning;

	/**
	 * Set the visible flag for the Mesh. NOTE: This is here temporarily for the Editor and will be
	 * going away soon.
	 * 
	 * @param {boolean} visible flag indicating if the Mesh should be visible
	 */
	Mesh.prototype.setVisible = Transform.prototype.setVisible;

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
	 * Get a manip object of the given type. This may be a newly constructed one or a cached one
	 * that was no longer being used.
	 * 
	 * @param {hemi.MotionType} type the type of manip to get
	 * @return {Manip} the newly constructed or cached manip object
	 */
	function getManip(type) {
		var obj = manips[type],
			manip;

		if (obj) {
			manip = obj.storage.length > 0 ? obj.storage.pop() : obj.create();
		} else {
			console.log('Unrecognized manipulation type: ' + type);
		}

		manip.enable();
		return manip;
	}

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

		motion.enable();
		return motion;
	}

	/*
	 * Get the previous manip params for the Transform/Mesh with the given id.
	 * 
	 * @param {number} id world id of the Transform/Mesh
	 * @return {Object} previous manip params
	 */
	function getParams(id) {
		var params = savedParams[id];

		if (!params) {
			savedParams[id] = params = {};
		}

		return params;
	}

	/*
	 * Clear the given manipulation object of its attributes and cache it for future use (unless the
	 * cache is full).
	 * 
	 * @param {Manip} manip the manipulation object to clear and cache
	 * @param {hemi.MotionType} type the type of motion
	 */
	function removeManip(manip, type) {
		var obj = manips[type];
		manip.clear();

		if (obj) {
			obj.storage.length > 10 ? manip.cleanup() : obj.storage.push(manip);
		} else {
			console.log('Unrecognized manipulation type: ' + type);
		}
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

})();
