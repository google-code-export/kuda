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
// Shared functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Perform clean up on the Transform/Mesh.
	 */
	function _clean() {
		this.parent.remove(this);

		for (var i = 0, il = this.children.length; i < il; ++i) {
			this.children[i].cleanup();
		}
	}

	/**
	 * Get all of the children, grandchildren etc of the Transform/Mesh.
	 */
	function _getAllChildren(opt_arr) {
		opt_arr = opt_arr || [];

		for (var i = 0, il = this.children.length; i < il; ++i) {
			var child = this.children[i];
			opt_arr.push(child);
			child.getAllChildren(opt_arr);
		}

		return opt_arr;
	}

	/*
	 * Set all transform properties to their identity values.
	 */
	function _identity() {
		this.position.set(0, 0, 0);
		this.quaternion.set(0, 0, 0, 1);
		this.rotation.set(0, 0, 0);
		this.scale.set(1, 1, 1);
		this.matrix.identity();
		this.updateMatrixWorld();
	}

	/*
	 * Initialize Transform properties using the given Object3D.
	 */
	function _init(obj, toConvert) {
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
	}

		/*
		 * Shared Octane properties for hemi.Transform and hemi.Mesh.
		 */
	var octaneProps = ['name', 'children', 'pickable', 'visible', 'position', 'rotation',
			'quaternion', 'scale', 'useQuaternion'];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Transform class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Transform performs hierarchical matrix transformations.
	 */
	var Transform = function() {
		THREE.Object3D.call(this);

		this.pickable = true;
		// this.opacity?
	};

	Transform.prototype = new THREE.Object3D();
	Transform.constructor = Transform;

	Transform.prototype._clean = _clean;

	Transform.prototype._init = _init;

	Transform.prototype._octane = octaneProps;

	/**
	 * Get all of the child Transforms that are under the Transform.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Transform.prototype.getAllChildren = _getAllChildren;

	/**
	 * Use the given Object3D to initialize properties.
	 * 
	 * @param {THREE.Object3D} obj Object3D to use to initialize properties
	 * @param {Object} toConvert look-up structure to get the Transform equivalent of an Object3D
	 *     for animations
	 */
	Transform.prototype.identity = _identity;

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
		// this.opacity?
	};

	Mesh.prototype = new THREE.Mesh();
	Mesh.constructor = Mesh;

	Mesh.prototype._clean = _clean;

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

		_init.call(this, obj, toConvert);
	};

	Mesh.prototype._octane = octaneProps;

	/**
	 * Get all of the child Transforms that are under the Mesh.
	 *
	 * @param {hemi.Transform[]} opt_arr optional array to place Transforms in
	 * @return {hemi.Transform[]} array of all child/grandchild Transforms
	 */
	Mesh.prototype.getAllChildren = _getAllChildren;

	Mesh.prototype.identity = _identity;

	hemi.makeCitizen(Mesh, 'hemi.Mesh', {
		cleanup: Mesh.prototype._clean,
		toOctane: Mesh.prototype._octane
	});

// No extra functionality, but these are useful as Citizens/Octanable.

	hemi.makeCitizen(THREE.Scene, 'hemi.Scene');
	hemi.makeOctanable(THREE.Vector3, 'THREE.Vector3', ['x', 'y', 'z']);
	hemi.makeOctanable(THREE.Quaternion, 'THREE.Quaternion', ['x', 'y', 'z', 'w']);

})();
