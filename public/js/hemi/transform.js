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

		this._manip = null;
		this._motions = {};
		this.pickable = true;
		// this.opacity?
	};

	Transform.prototype = new THREE.Object3D();
	Transform.constructor = Transform;

	/*
	 * Remove all references in the Transform.
	 */
	Transform.prototype._clean = function() {
		this.parent.remove(this);

		for (var i = 0, il = this.children.length; i < il; ++i) {
			this.children[i].cleanup();
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
	Transform.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Transform.
	 * @type string[]
	 */
	Transform.prototype._octane = ['name', 'children', 'pickable', 'visible', 'position',
			'rotation', 'quaternion', 'scale', 'useQuaternion'];

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

	Transform.prototype.cancelInteraction = function() {
		if (this._manip) {
			this._manip.cleanup(); // return to pile?
			this._manip = null;
		}
	};

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

	Transform.prototype.makeDraggable = function() {
		if (this._manip) {
			this._manip.cleanup(); // return to pile?
		}

		this._manip = getDraggable();
		this._manip.addTransform(this);
	};

	Transform.prototype.makeScalable = function() {
		if (this._manip) {
			this._manip.cleanup(); // return to pile?
		}

		this._manip = getScalable();
		this._manip.addTransform(this);
	};

	Transform.prototype.makeTurnable = function() {
		if (this._manip) {
			this._manip.cleanup(); // return to pile?
		}

		this._manip = getTurnable();
		this._manip.addTransform(this);
	};

	Transform.prototype.move = function(delta, time, opt_mustComplete) {
		var type = hemi.MotionType.TRANSLATE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		motion.move(delta, time, opt_mustComplete);
	};

	Transform.prototype.resize = function(scale, time, opt_mustComplete) {
		var type = hemi.MotionType.SCALE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		motion.resize(scale, time, opt_mustComplete);
	};

	Transform.prototype.turn = function(theta, time, opt_mustComplete) {
		var type = hemi.MotionType.ROTATE,
			motion = this._motions[type];

		if (!motion) {
			motion = getMotion(type);
			motion.setTransform(this);
			this._motions[type] = motion;
		}

		motion.turn(theta, time, opt_mustComplete);
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

		this.pickable = true;
		this._manip = null;
		this._motions = {};
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

	Mesh.prototype.addMotion = Transform.prototype.addMotion;

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

	Mesh.prototype.move = Transform.prototype.move;

	Mesh.prototype.resize = Transform.prototype.resize;

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

	function getMotion(type) {
		var obj = motions[type],
			motion;

		if (obj) {
			motion = obj.storage.length > 0 ? obj.storage.pop() : obj.create();
		} else {
			hemi.console.log('Unrecognized motion type: ' + type, hemi.console.WARN);
		}

		return motion;
	}

	function removeMotion(motion, type) {
		var obj = motions[type];
		motion.clear();

		if (obj) {
			obj.storage.length > 10 ? motion.cleanup() : obj.storage.push(motion);
		} else {
			hemi.console.log('Unrecognized motion type: ' + type, hemi.console.WARN);
		}
	}

})();
