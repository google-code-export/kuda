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

var hemi = (function(hemi) {
	/**
	 * @namespace A module for managing 3D models and their assets.
	 */
	hemi.model = hemi.model || {};

	/**
	 * The name of the root Transform for all loaded Models. All Transforms in
	 * a Model are a child or grandchild of the modelRoot.
	 * @type string
	 * @constant
	 */
	hemi.model.MODEL_ROOT = 'ModelRoot';

	/**
	 * @class A TransformUpdate allows changes to a Transform in a Model to be
	 * persisted through Octane.
	 */
	hemi.model.TransformUpdate = function() {
		/**
		 * The updated position, rotation, and scale of the Transform.
		 * @type number[4][4]
		 */
		this.localMatrix = null;
		/**
		 * A flag indicating if the Transform is visible.
		 * @type boolean
		 */
		this.visible = null;
		/**
		 * A flag indicating if the Transform is able to be picked.
		 * @type boolean
		 */
		this.pickable = null;
		/**
		 * The opacity of the Transform. 
		 * @type number
		 */
		this.opacity = null;
		
		this.transform = null;
		this.toLoad = null;
	};

	hemi.model.TransformUpdate.prototype = {
		/**
		 * Get the Octane structure for the TransformUpdate.
		 *
		 * @return {Object} the Octane structure representing the TransformUpdate
		 */
		toOctane: function() {
			var octane = {
					type: 'hemi.model.TransformUpdate',
					props: [{
						name: 'toLoad',
						val: this.transform.name
					}]
				},
				valNames = ['localMatrix', 'visible', 'pickable', 'opacity'];
			
			for (var i = 0, il = valNames.length; i < il; i++) {
				var name = valNames[i];
				octane.props.push({
					name: name,
					val: this[name]
				});
			};

			return octane;
		},

		/**
		 * Check if the TransformUpdate has been modified.
		 * 
		 * @return {boolean} true if the Transform has been changed
		 */
		isModified: function() {
			return this.localMatrix != null || this.pickable != null 
				|| this.visible != null || this.opacity != null;
		},

		/**
		 * Apply the changes in the TransformUpdate to its target Transform.
		 * 
		 * @param {hemi.model.Model} model the Model to get the Transform from
		 */
		apply: function(model) {
			if (this.toLoad !== null) {
				var transforms = model.getTransforms(this.toLoad);
				
				if (transforms.length === 1) {
					this.transform = transforms[0];
					this.toLoad = null;
				} else {
					hemi.console.log(transforms.length + ' transforms with name ' +
						this.toLoad + ' in model ' + model.name, hemi.console.ERR);
					return;
				}
			}
			
			if (this.localMatrix != null) {
				this.transform.localMatrix = this.localMatrix;
			}
			
			if (this.pickable != null) {
				hemi.picking.setPickable(this.transform, this.pickable, true);
			}
			
			if (this.visible != null) {
				this.transform.visible = this.visible;
			}
			
			if (this.opacity != null) {
				model.setTransformOpacity(this.transform, this.opacity, false);
			}
		}
	};

	/**
	 * @class A ModelConfig contains the pack, transform, and animation time
	 * attributes for a Model. The pack is filled with shapes, transforms, and
	 * materials loaded from a model file.
	 */
	hemi.model.ModelConfig = function() {
		this.pack = hemi.core.client.createPack();
		// Create a root transform for the model's shapes and transforms
		this.rootTransform = this.pack.createObject('Transform');
		this.rootTransform.parent = hemi.model.modelRoot;
		// Create a param to access animations. No need to worry about storing
		// it for cleanup, it will get destroyed with pack.
		var paramObject = this.pack.createObject('ParamObject');
		this.animationTime = paramObject.createParam('animTime', 'ParamFloat');
	};

	hemi.model.ModelConfig.prototype = {
		/**
		 * Get all materials loaded in the pack from the model file.
		 * 
		 * @return {o3d.Material[]} array of materials
		 */
		getMaterials: function() {
			return this.pack.getObjectsByClassName('o3d.Material');
		},

		/**
		 * Get all shapes loaded in the pack from the model file.
		 * 
		 * @return {o3d.Shape[]} array of shapes
		 */
		getShapes: function() {
			return this.pack.getObjectsByClassName('o3d.Shape');
		},

		/**
		 * Get all transforms loaded in the pack from the model file.
		 * 
		 * @return {o3d.Transform[]} array of tranforms
		 */
		getTransforms: function() {
			return this.pack.getObjectsByClassName('o3d.Transform');
		}
	};

	/**
	 * @class A Model is a Javascript representation of a 3D model.
	 * @extends hemi.world.Citizen
	 */
	hemi.model.Model = function() {
		hemi.world.Citizen.call(this);

		/**
		 * A flag that indicates if the Model is currently animating.
		 * @type boolean
		 * @default false
		 */
		this.isAnimating = false;
		this.fileName = '';
		this.root = null;
		this.materials = [];
		this.shapes = [];
		this.transforms = [];
		this.transformUpdates = [];
		this.animParam = null;
		this.pack = null;
	};

	hemi.model.Model.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hemi.model.Model',
		
		/**
		 * Send a cleanup Message and remove all references in the Model.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.unload();
		},

		/**
		 * Get the Octane structure for the Model.
		 *
		 * @return {Object} the Octane structure representing the Model
		 */
		toOctane: function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);

			octane.props.push({
				name: 'setFileName',
				arg: [this.fileName]
			});

			var upEntry = {
				name: 'transformUpdates',
				oct: []
			};

			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				
				if (update.isModified()) {
					// Only save the TransformUpdate if there is actually a
					// change to save.
					upEntry.oct.push(update.toOctane());
				}
			}

			octane.props.push(upEntry);

			return octane;
		},

		/**
		 * Set the file name and model name for the Model and then begin loading
		 * the file.
		 * 
		 * @param {string} fileName name of the file
		 */
		setFileName: function(fileName) {
			this.fileName = fileName;
			this.name = getModelName(fileName);
			this.load();
		},
		
		/**
		 * Load the Model. Once finished, populate the Model with transforms,
		 * shapes, and materials.
		 */
		load: function() {
			var config = new hemi.model.ModelConfig(),
				that = this;
			
			if (this.pack !== null) {
				this.unload();
			}
			
			try {
				hemi.loader.loadModel(
					this.fileName,
					config.pack,
					config.rootTransform,
					function(pack, parent) {
						hemi.core.loaderCallback(pack);
						that.loadConfig(config);
					},
					{opt_animSource: config.animationTime});
			} 
			catch (e) {
				alert('Loading failed: ' + e);
			}
		},

		/**
		 * Load the given configuration into the Model, populating it with
		 * transforms, shapes, and materials.
		 * 
		 * @param {hemi.model.ModelConfig} config configuration for the Model
		 */
		loadConfig: function(config) {
			var id = this.getId();
			
			this.name = getModelName(this.fileName);
			this.root = config.rootTransform;
			this.root.name = this.name;
			// The deserialization process sets bad values for bounding boxes of
			// transforms, so force them to be recalculated.
			this.root.recalculateBoundingBox(true);
			this.animParam = config.animationTime;
			this.materials = config.getMaterials();
			this.shapes = config.getShapes();
			this.transforms = config.getTransforms();
			this.pack = config.pack;
			
			for (var t = 0, len = this.transforms.length; t < len; ++t) {
				var transform = this.transforms[t],
					oid = transform.createParam('ownerId', 'o3d.ParamInteger');
				oid.value = id;
			}
			
			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				update.apply(this);
			}

			hemi.world.tranReg.distribute(this);
			
			this.send(hemi.msg.load, {});
		},

		/**
		 * Get the Model's animation parameter. It's value property can be
		 * set to update the Model to a specific keyframe.
		 *
		 * @return {o3d.ParamObject} the Model's animation parameter
		 */
		getAnimationParameter: function() {
			return this.animParam;
		},

		/**
		 * Get the Model's current animation time.
		 *
		 * @return {number} the Model's current animation time
		 */
		getAnimationTime: function() {
			var time = 0.0;
			
			if (this.animParam) {
				time = this.animParam.value;
			}
			
			return time;
		},
		
		/**
		 * Get the Model's max animation time value (in seconds).
		 * 
		 * @return {number} the Model's max animation time
		 */
		getMaxAnimationTime: function() {	
			var curves = this.pack.getObjectsByClassName('o3d.Curve'),
				max = 0;
			
			for (var ndx = 0; ndx < curves.length; ndx++) {
				var keys = curves[ndx].keys;
				
				for (var ndx2 = 0; ndx2 < keys.length; ndx2++) {
					var input = keys[ndx2].input;
					max = input > max ? input : max;
				}
			}
			
			return max;
		},

		/**
		 * Increment the Model's animation time by the given amount.
		 *
		 * @param {number} animateInc amount to increment animation time by
		 */
		incrementAnimationTime: function(animateInc) {
			if (this.animParam) {
				this.setAnimationTime(this.animParam.value + animateInc);
			}
		},

		/**
		 * Set the Model's animation time to the given amount.
		 *
		 * @param {number} animateTime amount to set the animation time to
		 */
		setAnimationTime: function(animateTime) {
			if (this.animParam) {
				var previous = this.animParam.value;
				this.animParam.value = animateTime;

				this.send(hemi.msg.animate,
					{
						previous: previous,
						time: animateTime
					});
			}
		},

		/**
		 * Get any Materials in the Model with the given name.
		 *
		 * @param {string} materialName the name of the desired Material
		 * @return {o3d.Material[]} array of Materials with the given name
		 */
		getMaterials: function(materialName) {
			var mats = [];
			
			for (var m = 0, len = this.materials.length; m < len; m++) {
				var material = this.materials[m];
				if (material.name === materialName) 
					mats.push(material);
			}
			
			return mats;
		},

		/**
		 * Get any Shapes in the Model with the given name.
		 *
		 * @param {string} shapeName the name of the desired Shape
		 * @return {o3d.Shape[]} array of Shapes with the given name
		 */
		getShapes: function(shapeName) {
			var shps = [];
			
			for (var s = 0, len = this.shapes.length; s < len; s++) {
				var shape = this.shapes[s];
				if (shape.name === shapeName) 
					shps.push(shape);
			}
			
			return shps;
		},

		/**
		 * Get any Transforms in the Model with the given name.
		 *
		 * @param {string} transformName the name of the desired Transform
		 * @return {o3d.Transform[]} array of Transforms with the given name
		 */
		getTransforms: function(transformName) {
			var tfms = [];
			
			for (var t = 0, len = this.transforms.length; t < len; t++) {
				var transform = this.transforms[t];
				if (transform.name === transformName) 
					tfms.push(transform);
			}
			
			return tfms;
		},

		/**
		 * Get the TransformUpdate for the given Transform, or create a new one
		 * if it does not already exist.
		 *
		 * @param {o3d.Transform} transform the Transform
		 * @return {hemi.model.TransformUpdate} the TransformUpdate for the
		 *		   Transform
		 */
		getTransformUpdate: function(transform) {
			var transUp = null;
			
			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				
				if (update.transform === transform) {
					transUp = update;
					break;
				}
			}

			if (transUp === null) {
				transUp = new hemi.model.TransformUpdate();
				transUp.transform = transform;
				this.transformUpdates.push(transUp);
			}
			
			return transUp;
		},
		
		/**
		 * Calculate the center point of the Model's bounding box.
		 * 
		 * @return {Array} [x,y,z] point in 3D space
		 */
		getCenterPoint: function() {
			var boundingBox = this.root.boundingBox;
			
			var xSpan = boundingBox.maxExtent[0] - boundingBox.minExtent[0];
			var ySpan = boundingBox.maxExtent[1] - boundingBox.minExtent[1];
			var zSpan = boundingBox.maxExtent[2] - boundingBox.minExtent[2]; 
 
			var center = [xSpan / 2, ySpan / 2, zSpan / 2];
			
			return center;
		},
		
		/**
		 * Get the bounding box of the Model's root Transform.
		 * 
		 * @return {o3d.BoundingBox} bounding box for the entire Model
		 */
		getBoundingBox : function(){
			return this.root.boundingBox;
		},
		
		/**
		 * Set the pickable flag for the Transforms in the Model.
		 *
		 * @param {Object} config configuration options
		 */
		setPickable: function(config) {
			var pick = config.pick,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				this.setTransformPickable(transforms[i], pick);
			}
		},
		
		/**
		 * Sets the opacity of the transform to the given value. 
		 * 
		 * @param {o3d.Transform} transform the transform to update
		 * @param {number} opacity the new opacity value
		 * @param {boolean} opt_trickle optional flag indicating if opacity
		 *     should also be set for the transform's children (default is true)
		 */
		setTransformOpacity: function(transform, opacity, opt_trickle) {
			var update = this.getTransformUpdate(transform),
				shapes = transform.shapes,
				o = transform.getParam('opacity'),
				trickle = opt_trickle == null ? true : opt_trickle;
			
			if (o == null) {
				for (var i = 0, il = shapes.length; i < il; i++) {
					var s = shapes[i],
						elements = s.elements;
					
					for (var j = 0, jl = elements.length; j < jl; j++) {
						hemi.fx.addOpacity(elements[j].material);
					}
				}
				
				o = transform.createParam('opacity','ParamFloat');
			}
			
			o.value = opacity;
			update.opacity = opacity === 1 ? null : opacity;
			
			if (trickle) {
				var children = transform.children;
				
				for (var i = 0, il = children.length; i < il; i++) {
					this.setTransformOpacity(children[i], opacity, true);
				}
			}
		},

		/**
		 * Set the pickable flag for the given Transform.
		 *
		 * @param {o3d.Transform} transform the Transform
		 * @param {boolean} pickable value to set for pickable
		 */
		setTransformPickable: function(transform, pickable) {
			var update = this.getTransformUpdate(transform);
			hemi.picking.setPickable(transform, pickable, true);
			update.pickable = pickable ? null : false;
		},
		
		/**
		 * Set the visible flag for the given Transform.
		 *
		 * @param {o3d.Transform} transform the Transform
		 * @param {boolean} visible value to set for visible
		 */
		setTransformVisible: function(transform, visible) {
			var update = this.getTransformUpdate(transform);
			transform.visible = visible;
			update.visible = visible ? null : false;
		},
		
		/**
		 * Set the visible flag for the Transforms in the Model.
		 *
		 * @param {Object} config configuration options
		 */
		setVisible: function(config) {
			var vis = config.vis,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				this.setTransformVisible(transforms[i], vis);
			}
		},
		
		/**
		 * Rotate the Transforms in the Model.
		 * 
		 * @param {Object} config configuration options
		 */
		rotate: function(config) {
			var axis = config.axis.toLowerCase(),
				rad = config.rad,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				switch(axis) {
					case 'x':
						this.rotateTransformX(transforms[i], rad);
						break;
					case 'y':
						this.rotateTransformY(transforms[i], rad);
						break;
					case 'z':
						this.rotateTransformZ(transforms[i], rad);
						break;
				}
			}
		},

		/**
		 * Rotate the given Transform along the x-axis by the amount provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformX: function(transform, amount) {
			var update = this.getTransformUpdate(transform);
			transform.rotateX(amount);
			update.localMatrix = hemi.utils.copyArray(transform.localMatrix);
		},

		/**
		 * Rotate the given Transform along the y-axis by the amount provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformY: function(transform, amount) {
			var update = this.getTransformUpdate(transform);
			transform.rotateY(amount);
			update.localMatrix = hemi.utils.copyArray(transform.localMatrix);
		},

		/**
		 * Rotate the given Transform along the z-axis by the amount provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformZ: function(transform, amount) {
			var update = this.getTransformUpdate(transform);
			transform.rotateZ(amount);
			update.localMatrix = hemi.utils.copyArray(transform.localMatrix);
		},
		
		/**
		 * Scale the Transforms in the Model.
		 * 
		 * @param {Object} config configuration options
		 */
		scale: function(config) {
			var x = config.x,
				y = config.y,
				z = config.z,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				this.scaleTransform(transforms[i], x, y, z);
			}
		},

		/**
		 * Scale the given Transform by the factors provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} xFactor the amount to scale along x
		 * @param {number} yFactor the amount to scale along y
		 * @param {number} zFactor the amount to scale along z
		 * @throws {Exception} If any of the scale factors are negative.
		 */
		scaleTransform: function(transform, xFactor, yFactor, zFactor) {
			if (xFactor < 0 || yFactor < 0 || zFactor < 0) {
				throw('Cannot scale with a negative number');
			} else {
				var update = this.getTransformUpdate(transform);
				transform.scale(xFactor, yFactor, zFactor);
				update.localMatrix = hemi.utils.copyArray(transform.localMatrix);
			}			
		},

		/**
		 * Set the given Transform's matrix to the new matrix.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {Vectormath.Aos.Matrix4} matrix the new local matrix
		 */
		setTransformMatrix: function(transform, matrix) {
			var update = this.getTransformUpdate(transform);			
			transform.localMatrix = matrix;
			update.localMatrix = hemi.utils.copyArray(transform.localMatrix);
		},
		
		/**
		 * Clean up any materials, shapes, and transforms contained in the
		 * Model.
		 */
		unload: function() {
			this.materials = [];
			this.shapes = [];
			this.transforms = [];
			this.transformUpdates = [];
			
			if (this.pack !== null) {
				// Remove this Model's transform tree from the client root
				// transform before destroying the resources.
				this.root.parent = null;
				this.pack.destroy();
				this.pack = null;
				this.root = null;
				this.animParam = null;
			}
			
			this.send(hemi.msg.unload, {});
		}
	};

	hemi.model.Model.inheritsFrom(hemi.world.Citizen);
	hemi.model.Model.prototype.msgSent =
		hemi.model.Model.prototype.msgSent.concat([hemi.msg.animate,
			hemi.msg.load, hemi.msg.unload]);

	/**
	 * Set up the modelRoot, the transform root that all Model transforms will
	 * be children of.
	 */
	hemi.model.init = function() {
		// A transform parent to hold model transform roots
		this.modelRoot = hemi.core.mainPack.createObject('Transform');
		this.modelRoot.name = hemi.model.MODEL_ROOT;
		this.modelRoot.parent = hemi.picking.pickRoot;
	};

	// Internal functions
	var getModelName = function(fileName) {
		// Currently, file names are of the form:
		// [path to directory]/[model name]/scene.json
		var end = fileName.lastIndexOf('/');
		
		if (end < 1) {
			end = fileName.length;
		}
		
		var start = fileName.lastIndexOf('/', end - 1) + 1;
		
		if (start >= end) {
			start = 0;
		}
		
		return fileName.substring(start, end);
	};

	return hemi;
})(hemi || {});
