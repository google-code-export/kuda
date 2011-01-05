o3djs.require('hemi.core');
o3djs.require('hemi.loader');
o3djs.require('hemi.msg');
o3djs.require('hemi.picking');
o3djs.require('hemi.world');

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
		
		this.transformName = null;
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
				props: []
			};

			octane.props.push({
				name: 'transformName',
				val: this.transformName
			});

			octane.props.push({
				name: 'localMatrix',
				val: this.localMatrix
			});

			octane.props.push({
				name: 'visible',
				val: this.visible
			});

			octane.props.push({
				name: 'pickable',
				val: this.pickable
			});

			return octane;
		},

		/**
		 * Check if the TransformUpdate has been modified.
		 * 
		 * @return {boolean} true if the Transform has been changed
		 */
		isModified: function() {
			return this.localMatrix != null || this.pickable != null || this.visible != null;
		},

		/**
		 * Set the target Transform for the TransformUpdate.
		 * 
		 * @param {o3d.Transform} transform the Transform to track changes for
		 */
		setTransform: function(transform) {
			this.transformName = transform.name;
		},

		/**
		 * Apply the changes in the TransformUpdate to its target Transform.
		 * 
		 * @param {hemi.model.Model} model the Model to get the Transform from
		 */
		apply: function(model) {
			var transform = model.getTransform(this.transformName);
			
			if (transform) {
				if (this.localMatrix != null) {
					transform.localMatrix = this.localMatrix;
				}
				
				if (this.pickable != null) {
					hemi.picking.setPickable(transform, this.pickable, true);
				}
				
				if (this.visible != null) {
					transform.visible = this.visible;
				}
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
				
				// Only save the TransformUpdate if there is actually a change
				// to save.
				if (update.isModified()) {
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
						hemi.core.loaderCallback(pack, parent);
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
		 * @param {hemi.model.ModelConfig} modelConfig configuration for the Model
		 */
		loadConfig: function(modelConfig) {
			var config = jQuery.extend(new hemi.model.ModelConfig(), modelConfig),
				id = this.getId();
			
			this.name = getModelName(this.fileName);
			this.root = config.rootTransform;
			this.root.name = this.name;
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
		 * Get the Material in the Model with the given name.
		 *
		 * @param {string} materialName the name of the desired Material
		 * @return {o3d.Material} the found Material or null
		 */
		getMaterial: function(materialName) {
			for (var m = 0, len = this.materials.length; m < len; m++) {
				var material = this.materials[m];
				if (material.name == materialName) 
					return material;
			}
			return null;
		},

		/**
		 * Get the Shape in the Model with the given name.
		 *
		 * @param {string} shapeName the name of the desired Shape
		 * @return {o3d.Shape} the found Shape or null
		 */
		getShape: function(shapeName) {
			for (var s = 0, len = this.shapes.length; s < len; s++) {
				var shape = this.shapes[s];
				if (shape.name == shapeName) 
					return shape;
			}
			return null;
		},

		/**
		 * Get the Transform in the Model with the given name.
		 *
		 * @param {string} transformName the name of the desired Transform
		 * @return {o3d.Transform} the found Transform or null
		 */
		getTransform: function(transformName) {
			for (var t = 0, len = this.transforms.length; t < len; t++) {
				var transform = this.transforms[t];
				if (transform.name == transformName) 
					return transform;
			}
			return null;
		},

		/**
		 * Get the TransformUpdate for the Transform with the given name, or
		 * create a new one if it does not already exist.
		 *
		 * @param {string} transformName the name of the Transform
		 * @return {hemi.model.TransformUpdate} the TransformUpdate for the
		 *		   Transform
		 */
		getTransformUpdate: function(transformName) {
			var transUp = null;
			
			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				
				if (update.transformName == transformName) {
					transUp = update;
					break;
				}
			}

			if (transUp == null) {
				transUp = new hemi.model.TransformUpdate();
				transUp.transformName = transformName;
				this.transformUpdates.push(transUp);
			}
			
			return transUp;
		},

		/**
		 * Set the pickable flag for the Transforms in the Model.
		 *
		 * @param {Object} config configuration options
		 */
		setPickable: function(config) {
			var pick = config.pick,
				names;
			
			if (config.names instanceof Array) {
				names = config.names;
			} else {
				names = [config.names];
			}
			
			for (var i = 0, il = names.length; i < il; i++) {
				this.setTransformPickable(names[i], pick);
			}
		},

		/**
		 * Set the pickable flag for the Transform in the Model with the given
		 * name.
		 *
		 * @param {string} transformName the name of the Transform
		 * @param {boolean} pickable value to set for pickable
		 */
		setTransformPickable: function(transformName, pickable) {
			var transform = this.getTransform(transformName);
			var update = this.getTransformUpdate(transformName);
			
			hemi.picking.setPickable(transform, pickable, true);
			update.pickable = pickable ? null : false;
		},
		
		/**
		 * Set the visible flag for the Transform in the Model with the given
		 * name.
		 *
		 * @param {string} transformName the name of the Transform
		 * @param {boolean} visible value to set for visible
		 */
		setTransformVisible: function(transformName, visible) {
			var transform = this.getTransform(transformName);
			var update = this.getTransformUpdate(transformName);
			
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
				names;
			
			if (config.names instanceof Array) {
				names = config.names;
			} else {
				names = [config.names];
			}
			
			for (var i = 0, il = names.length; i < il; i++) {
				this.setTransformVisible(names[i], vis);
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
				names;
			
			if (config.names instanceof Array) {
				names = config.names;
			} else {
				names = [config.names];
			}
			
			for (var i = 0, il = names.length; i < il; i++) {
				switch(axis) {
					case 'x':
						this.rotateTransformX(names[i], rad);
						break;
					case 'y':
						this.rotateTransformY(names[i], rad);
						break;
					case 'z':
						this.rotateTransformZ(names[i], rad);
						break;
				}
			}
		},

		/**
		 * Rotate the Transform along the x-axis with the given name by the 
		 * amount provided.
		 * 
		 * @param {string} transformName the name of the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformX: function(transformName, amount) {
			var transform = this.getTransform(transformName);
			var update = this.getTransformUpdate(transformName);			
			
			transform.rotateX(amount);
			update.localMatrix = transform.localMatrix;
		},

		/**
		 * Rotate the Transform along the y-axis with the given name by the 
		 * amount provided.
		 * 
		 * @param {string} transformName the name of the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformY: function(transformName, amount) {
			var transform = this.getTransform(transformName);
			var update = this.getTransformUpdate(transformName);			
			
			transform.rotateY(amount);
			update.localMatrix = transform.localMatrix;			   
		},

		/**
		 * Rotate the Transform along the z-axis with the given name by the 
		 * amount provided.
		 * 
		 * @param {string} transformName the name of the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformZ: function(transformName, amount) {
			var transform = this.getTransform(transformName);
			var update = this.getTransformUpdate(transformName);			
			
			transform.rotateZ(amount);
			update.localMatrix = transform.localMatrix;
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
				names;
			
			if (config.names instanceof Array) {
				names = config.names;
			} else {
				names = [config.names];
			}
			
			for (var i = 0, il = names.length; i < il; i++) {
				this.scaleTransform(names[i], x, y, z);
			}
		},

		/**
		 * Scale the Transform with the given name by the factors provided.
		 * 
		 * @param {string} transformName the name of the Transform
		 * @param {number} xFactor the amount to scale along x
		 * @param {number} yFactor the amount to scale along y
		 * @param {number} zFactor the amount to scale along z
		 * @throws {Exception} If any of the scale factors are negative.
		 */
		scaleTransform: function(transformName, xFactor, yFactor, zFactor) {
			if (xFactor < 0 || yFactor < 0 || zFactor < 0) {
				throw('Cannot scale with a negative number');
			}
			else {
				var transform = this.getTransform(transformName);
				var update = this.getTransformUpdate(transformName);
				
				transform.scale(xFactor, yFactor, zFactor);
				update.localMatrix = transform.localMatrix;
			}			
		},

		/**
		 * Set the Transform with the given name's matrix to the new matrix.
		 * 
		 * @param {string} transformName the name of the Transform
		 * @param {Vectormath.Aos.Matrix4} matrix the new local matrix
		 */
		setTransformMatrix: function(transformName, matrix) {
			var transform = this.getTransform(transformName);
			var update = this.getTransformUpdate(transformName);			
			
			transform.localMatrix = matrix;
			update.localMatrix = transform.localMatrix;
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
				// Clean up the Transform table
				hemi.core.removeFromTransformTable(this.root);
				this.pack.destroy();
				this.pack = null;
				this.root = null;
				this.animParam = null;
			}
		}
	};

	hemi.model.Model.inheritsFrom(hemi.world.Citizen);
	hemi.model.Model.prototype.msgSent =
		hemi.model.Model.prototype.msgSent.concat([
			hemi.msg.animate,
			hemi.msg.load]);

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
		var name = '';
		var slash = fileName.lastIndexOf('/') + 1;
		var dot = fileName.lastIndexOf('.');
		
		if (slash >= 0 && dot >= 0) {
			name = fileName.substring(slash, dot);
		}
		
		return name;
	};

	return hemi;
})(hemi || {});
