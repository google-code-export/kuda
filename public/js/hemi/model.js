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
		 * Array of morph controller morphs that the Model contains.
		 * @type THREE.Mesh[]
		 */
		this.morphs = [];
		/**
		 * Array of skin controller skins that the Model contains.
		 * @type THREE.SkinnedMesh[]
		 */
		this.skins = [];
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
		return [
				{
					name: 'autoLoad',
					val: this.autoLoad
				},
				{
					name: 'client',
					id: this.client._getId()
				},
				{
					name: 'root',
					id: this.root._getId()
				},
				{
					name: 'setFileName',
					arg: [this._fileName]
				}
			];
	};

	/**
	 * Calculate the maximum animation time (in seconds).
	 * 
	 * @return {number} max animation time in seconds.
	 */
	Model.prototype.getMaxAnimationTime = function() {
		var animations = this.animations,
			max = null;

		for (var i = 0, il = animations.length; i < il; ++i) {
			var time = animations[i].data.length;
			if (max === null || max < time) max = time;
		}

		return max;
	};

	/**
	 * Calculate the minimum animation time (in seconds).
	 * 
	 * @return {number} min animation time in seconds.
	 */
	Model.prototype.getMinAnimationTime = function() {
		var animations = this.animations,
			min = null;

		for (var i = 0, il = animations.length; i < il; ++i) {
			var hierarchy = animations[i].data.hierarchy;

			for (var j = 0, jl = hierarchy.length; j < jl; ++j) {
				var keys = hierarchy[j].keys;

				for (var k = 0, kl = keys.length; k < kl; ++k) {
					var time = keys[k].time;
					if (min === null || min > time) min = time;
				}
			}
		}

		return min;
	};

	/**
	 * Get any Transforms with the given name in the Model.
	 * 
	 * @param {string} name the name of the Transform to find
	 * @return {hemi.Transform[]} array of matching Transforms
	 */
	Model.prototype.getTransforms = function(name) {
		var trans = [];
		getTransformsRecursive(name, this.root, trans);
		return trans;
	};

	/**
	 * Get the first Transform found with the given name in the Model.
	 * 
	 * @param {string} name the name of the Transform to find
	 * @return {hemi.Transform} the first matching Transform or null
	 */
	Model.prototype.getTransform = function(name) {
		var trans = [],
			tran = null;

		getTransformsRecursive(name, this.root, trans);
		var length = trans.length;

		if (length > 0) {
			tran = trans[0];

			if (length > 1) {
				console.log('Warning: found ' + length + ' transforms with name ' + name);
			}
		}

		return tran;
	};

	/**
	 * Load the Model's assets from its file.
	 * 
	 * @param {Object} opt_loaderOptions optional loader options, ex. { convertUpAxis: true }
	 */
	Model.prototype.load = function(opt_loadOptions) {
		opt_loadOptions = opt_loadOptions || {};

		if (opt_loadOptions.modelFileName) this._fileName = opt_loadOptions.modelFileName;

		if (this._loaded) this.unload();

		var that = this,
			onFileLoad = function(obj) {
				var animHandler = THREE.AnimationHandler,
					animations = obj.animations || [],
					scene = obj.scene ? obj.scene : obj.materials.length > 0 ? 
						new hemi.Mesh(obj, new THREE.MeshFaceMaterial()) :
						new hemi.Mesh(obj, new THREE.MeshLambertMaterial({ 
							color: 0xffffff, 
							overdraw: true 
						})),
					toConvert = {};

				that.morphs = obj.morphs; // Added to the model to give hemi users access
				that.skins = obj.skins; // Added to the model to give hemi users access
				that._loaded = true;

				for (var i = 0, il = animations.length; i < il; ++i) {
					var node = animations[i].node;
					toConvert[node.id] = node;
				}

				if (that.root === null) {
					if (!(scene instanceof hemi.Mesh)) {
						that.root = convertObject3Ds.call(that, scene, toConvert);
					} else {
						that.root = scene;
					}
				} else {
					that.root._init(scene, toConvert, that);
				}

				that.client.scene.add(that.root);

				for (var i = 0, il = animations.length; i < il; ++i) {
					var anim = animations[i],
						kfAnim;

					//Add to the THREE Animation handler to get the benefits of it's control functions
					animHandler.add(anim);
					// Don't use anim.node! needs to be the converted to hemi reference
					kfAnim = new THREE.KeyFrameAnimation(toConvert[anim.node.id], anim.name);
					kfAnim.timeScale = 1;
					that.animations.push(kfAnim);
				}

                if (obj.dae) {
                    loadColladaModelViewpoints(obj);
                }

				that.send(hemi.msg.load, {
					root: scene
				});
			};

			// check type
		var fileType = this._fileName.split('.').pop();

		switch (fileType.toLowerCase()) {
			case 'utf8':
				hemi.loadUTF8(this._fileName, onFileLoad, opt_loadOptions);
				break;
			case 'dae':
				hemi.loadCollada(this._fileName, onFileLoad, opt_loadOptions);
				break;
			// default is .js format which includes jsonLoader and binLoader
			default:
				var scope = this;
				hemi.utils.get(hemi.getLoadPath(this._fileName), function(data, status) {
					var fileData = JSON.parse(data);

					if (fileData.buffers !== undefined) {
						hemi.loadBinary(scope._fileName, onFileLoad);
					} else {
						hemi.loadJson(scope._fileName, onFileLoad);
					}
				}, 'application/json');
				break;
		}
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

	Model.prototype.setVisible = function(visible) {
		var transforms = this.root.getAllChildren();
		for (var count = 0; count < transforms.length; ++count) {
			transforms[count].visible = visible;
		}
		this.root.visible = visible;
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
    /*
     * Generate hemi.viewpoints from viewpoints specified in COLLADA file.
     *
     * @param {Object} Object returned from Thre.loadCollada.
     *
     */
    function loadColladaModelViewpoints(obj) {
        var camerasObj = obj.dae.cameras,
            visualScenes = obj.dae.visualScenes;

        // Check all visual scenes for nodes containing cameras
        for (var visualScene in visualScenes) {
            for (var i = 0, il = visualScenes[visualScene].nodes.length; i < il; i++) {
                var node = visualScenes[visualScene].nodes[i];

                if (node.cameras.length > 0) {
                    var eye = new THREE.Vector3(),
                    	rotate = new THREE.Vector3(),
                    	target = new THREE.Vector3();

                    eye = eye.getPositionFromMatrix(node.matrix);
                    rotate = rotate.getRotationFromMatrix(node.matrix);

                    var x =  eye.x,
                        y =  eye.y,
                        z =  eye.z,
                        distanceToOrigin = eye.distanceTo(new THREE.Vector3()),
                        multiplier = distanceToOrigin < 1 ? 1 : distanceToOrigin,
                        cartesian;

                    // Adding and subtracting PI/2 used to create proper theta and phi angles based on rotations.
                    // This likely still needs work, especially when up-axis changes
                    cartesian = hemi.utils.sphericalToCartesian([multiplier, hemi.HALF_PI - rotate.x, hemi.HALF_PI - rotate.z]);
                    x += cartesian[0];
                    y += cartesian[2];
                    z -= cartesian[1];
                    target.set(x, y, z);

                    for (var k = 0, kl = node.cameras.length; k < kl; k++) {
                        var camera = node.cameras[k],
                        	vp;
                        vp = new hemi.Viewpoint();
                        vp.name = node.name + '_' + k;
                        vp.eye = eye;
                        vp.target = target;
                        vp.np = camerasObj[camera.url].znear;
                        vp.fp = camerasObj[camera.url].zfar;
                        // hemi is y-up so ignore the xfov
                        vp.fov = camerasObj[camera.url].yfov * hemi.DEG_TO_RAD;
                    }
                }
            }
        }
    };

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
