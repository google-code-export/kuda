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
// Model class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Model represents a hierarchical set of transforms, geometry, and animations that
	 * make up a 3D object.
	 * 
	 * @param {hemi.Client} client the Client that will render the Model
	 */
	var Model = function(client) {
		/*
		 * The name of the file to load the Model's assets from.
		 * @type string
		 */
		this._fileName = null;
		/*
		 * Flag indicating if the Model's assets are loaded.
		 * @type boolean
		 * @default false
		 */
		this._loaded = false;

		/**
		 * Array of KeyFrameAnimations that the Model contains.
		 * @type THREE.KeyFrameAnimation[]
		 */
		this.animations = [];
		/**
		 * Flag indicating if the Model should load its assets when its file name is set.
		 * @type boolean
		 * @default true
		 */
		this.autoLoad = true;
		/**
		 * The Client that the Model is being rendered by.
		 * @type hemi.Client
		 */
		this.client = client;
		/**
		 * Array of Geometries that the Model contains.
		 * @type THREE.Geometry[]
		 */
		this.geometries = [];
		/**
		 * Array of Materials that the Model contains.
		 * @type THREE.Material[]
		 */
		this.materials = [];
		/**
		 * The root Transform of the Model
		 * @type hemi.Transform
		 */
		this.root = null;
	};

	/*
	 * Remove all references in the Model.
	 */
	Model.prototype._clean = function() {
		this.unload();
		this.client = null;
	};

	/*
	 * Array of Hemi Messages that Model is known to send.
	 * @type string[]
	 */
	Model.prototype._msgSent = [hemi.msg.load, hemi.msg.unload];

	/*
	 * Octane properties for Model.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Model.prototype._octane = function() {
		var names = ['autoLoad', 'client', 'root'],
			props = [];

		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		props.push({
			name: 'setFileName',
			arg: [this._fileName]
		});

		return props;
	};

	/**
	 * Get any Transforms with the given name in the Model.
	 * 
	 * @return {hemi.Transform[]} array of matching Transforms
	 */
	Model.prototype.getTransforms = function(name) {
		var trans = [];
		getTransformsRecursive(name, this.root, trans);
		return trans;
	};

	/**
	 * Load the Model's assets from its file.
	 */
	Model.prototype.load = function() {
		var that = this;

		if (this._loaded) this.unload();

		hemi.loadCollada(this._fileName, function (collada) {
			var animHandler = THREE.AnimationHandler,
				animations = collada.animations,
				toConvert = {};

			that._loaded = true;

			for (var i = 0, il = animations.length; i < il; ++i) {
				var node = animations[i].node;
				toConvert[node.id] = node;
			}

			if (that.root === null) {
				that.root = convertObject3Ds.call(that, collada.scene, toConvert);
			} else {
				that.root._init(collada.scene, toConvert);
			}

			that.client.scene.add(that.root);

			for ( var i = 0, il = collada.animations.length; i < il; i++ ) {
				var anim = animations[i];
				//Add to the THREE Animation handler to get the benefits of it's
				animHandler.add(anim);

				var kfAnim = new THREE.KeyFrameAnimation(toConvert[anim.node.id], anim.name);
				kfAnim.timeScale = 1;
				that.animations.push(kfAnim);
			}

			that.send(hemi.msg.load, {
				root: collada.scene
			});
		});
	};

	/**
	 * Set the given file name as the Model's file to load. If the autoLoad flag is set, load the
	 * Model now.
	 * 
	 * @param {string} the name of the file to load (relative to hemi.loadPath)
	 */
	Model.prototype.setFileName = function(fileName) {
		this._fileName = fileName;

		if (this.autoLoad) this.load();
	};

	/**
	 * Unload all of the Model's loaded transforms, geometries, etc.
	 */
	Model.prototype.unload = function() {
		this.send(hemi.msg.unload, {
			root: this.root
		});

		if (this.root) {
			this.root.cleanup();
			this.root = null;
		}


		this._loaded = false;
		this.animations = [];
		this.geometries = [];
		this.materials = [];
	};

// Private functions for Model

	/*
	 * Convert the loaded THREE.Object3Ds to hemi.Transforms so that they can be Citizens.
	 * 
	 * @param {THREE.Object3D} obj the root Object3D to start converting at
	 * @param {Object} toConvert mapping of Object3D id's to matching Transforms for animations to
	 *     use to connect with the newly created Transforms
	 * @return {hemi.Transform} the converted root Transform
	 */
	function convertObject3Ds(obj, toConvert) {
		var children = obj.children,
			newObj;

		if (obj.geometry) {
			newObj = new hemi.Mesh();
			newObj.geometry = obj.geometry;
			newObj.material = obj.material;
			newObj.boundRadius = obj.boundRadius;

			if (newObj.geometry.morphTargets.length) {
				newObj.morphTargetBase = obj.morphTargetBase;
				newObj.morphTargetForcedOrder = obj.morphTargetForcedOrder;
				newObj.morphTargetInfluences = obj.morphTargetInfluences;
				newObj.morphTargetDictionary = obj.morphTargetDictionary;
			}
			if (this.materials.indexOf(obj.material) === -1) {
				this.materials.push(obj.material);
			}
			if (this.geometries.indexOf(obj.geometry) === -1) {
				this.geometries.push(obj.geometry);
			}
		} else {
			newObj = new hemi.Transform();
		}

		newObj.name = obj.name;
		newObj.visible = obj.visible;
		newObj.position = obj.position;
		newObj.rotation = obj.rotation;
		newObj.quaternion = obj.quaternion;
		newObj.scale = obj.scale;
		newObj.useQuaternion = obj.useQuaternion;
		newObj.matrix = obj.matrix;
		newObj.matrixWorld = obj.matrixWorld;

		if (toConvert[obj.id] !== undefined) {
			toConvert[obj.id] = newObj;
		}

		for (var i = 0; i < children.length; ++i) {
			var newChild = convertObject3Ds.call(this, children[i], toConvert);
			newObj.add(newChild);
		}

		return newObj;
	}

	hemi.makeCitizen(Model, 'hemi.Model', {
		cleanup: Model.prototype._clean,
		toOctane: Model.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Recursive function to search through all Transform children for any Transforms with the given
	 * name.
	 * 
	 * @param {string} name the name to search for
	 * @param {hemi.Transform} transform the transform with children to check
	 * @param {hemi.Transform[]} returnTrans array of matching Transforms that is being populated
	 */
	function getTransformsRecursive(name, transform, returnTrans) {
		for (var i = 0; i < transform.children.length; ++i) {
			var child = transform.children[i];

			if (child.name === name) {
				returnTrans.push(child);
			}

			getTransformsRecursive(name, child, returnTrans);
		}
	}

})();
