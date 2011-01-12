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

o3djs.require('o3djs.debug');
o3djs.require('o3djs.element');
o3djs.require('o3djs.event');
o3djs.require('o3djs.loader');
o3djs.require('o3djs.math');
o3djs.require('o3djs.pack');
o3djs.require('o3djs.particles');
o3djs.require('o3djs.picking');
o3djs.require('o3djs.rendergraph');
o3djs.require('o3djs.canvas');
o3djs.require('hemi.utils.hashtable');
o3djs.require('hemi.utils.transformUtils');
o3djs.require('hemi.msg');
o3djs.require('hemi.console');
o3djs.require('hemi.picking');
o3djs.require('hemi.audio');
o3djs.require('hemi.world');
o3djs.require('hemi.dispatch');
o3djs.require('hemi.input');
o3djs.require('hemi.view');
o3djs.require('hemi.model');
o3djs.require('hemi.effect');
o3djs.require('hemi.scene');
o3djs.require('hemi.hud');
o3djs.require('hemi.manip');
o3djs.require('hemi.curve');
o3djs.require('hemi.sprite');
o3djs.require('hemi.shape');
o3djs.require('hemi.fx');

/**
 * @namespace The core Hemi library used by Kuda.
 * @version 1.2.0
 */
var hemi = (function(hemi) {
	
	/**
	 * The version of Hemi released on Jan 3, 2011
	 * @constant
	 */
	hemi.version = '1.2.0';
	
	/**
	 * @namespace A module for handling low level functionality and wrapping
	 * calls to the underlying O3D library.
	 */
	hemi.core = hemi.core || {};
	
	/*
	 * Create our own inheritance for Javascript.
	 */
	Function.prototype.inheritsFrom = function(parentClassOrObject) {
		// First save the new and overridden properties of the subclass.
		var propNames = [];
		var props = [];
		
		for (var name in this.prototype) {
			propNames.push(name);
			props.push(this.prototype[name]);
		}
		
		// Then perform inheritance. This replaces all properties of
		// the subclass with those from the superclass.
		if (parentClassOrObject.constructor == Function) {	
			// Normal Inheritance		
			this.prototype = new parentClassOrObject;
			this.prototype.constructor = this;
			this.prototype.parent = parentClassOrObject.prototype;
		}
		else {
			// Pure Virtual Inheritance 
			this.prototype = parentClassOrObject;
			this.prototype.constructor = this;
			this.prototype.parent = parentClassOrObject;
		}
			
		// Finally add the subclass properties back in (or override those
		// of the superclass).
		for (var ndx = 0, len = props.length; ndx < len; ndx++) {
			this.prototype[propNames[ndx]] = props[ndx];
		}
		
		return this;
	};

	/*
	 * Because Internet Explorer does not support Array.indexOf(), we can add
	 * it in so that subsequent calls do not break.
	 *
	 * @param {Object} obj
	 */
	if (!Array.indexOf) {
		Array.prototype.indexOf = function(obj) {
			for (var i = 0; i < this.length; i++) {
				if (this[i] == obj) {
					return i;
				}
			}
			return -1;
		};
	}

	/**
	 * The Debug class holds utilites for debugging.
	 *
	 * @constructor
	 * @ignore
	 */
	hemi.core.Debug = function() {
		this.debugHelper = o3djs.debug.createDebugHelper(hemi.core.client.createPack(), hemi.view.viewInfo);
		this.debugLineGroup = this.debugHelper.createDebugLineGroup(hemi.core.client.root);
		this.debugLine = this.debugLineGroup.addLine();
		this.debugLine.setColor([0, 1, 0, 1]);
		this.drawingNormals = false;
		this.loggingPickInfo = false;
	};

	hemi.core.Debug.prototype = {
		/**
		 * Enable or disable logging pick info to the console.
		 *
		 * @param {boolean} log whether or not to log pick info
		 */
		logPickInfo: function(pickInfo) {
			if (pickInfo) {
				console.log(pickInfo);
			}
		},

		/**
		 * Draw a normal line from the point of intersection on the picked
		 * shape if there was one.
		 *
		 * @param {o3djs.picking.PickInfo} pickInfo information from the pick
		 */
		drawNormals: function(pickInfo) {
			if (pickInfo) {
				// Display the normal
				var normal = o3djs.element.getNormalForTriangle(pickInfo.element, pickInfo.rayIntersectionInfo.primitiveIndex);
				
				// Convert the normal from local to world space.
				normal = hemi.core.math.matrix4.transformNormal(pickInfo.shapeInfo.parent.transform.worldMatrix, normal);
				
				// Remove the scale from the normal.
				normal = hemi.core.math.normalize(normal);
				
				// Get the world position of the collision.
				var worldPosition = pickInfo.worldIntersectionPosition;
				
				// Add the normal to it to get a point in space above it with some
				// multiplier to scale it.
				var normalSpot = hemi.core.math.addVector(worldPosition, hemi.core.math.mulVectorScalar(normal, 50.0));
				
				this.debugLine.setVisible(true);
				this.debugLine.setEndPoints(worldPosition, normalSpot);
			}
			else {
				this.debugLine.setVisible(false);
			}
		},
		
		/**
		 * This function allows Debug to handle Pick messages.
		 *
		 * @param {o3djs.picking.PickInfo} pickInfo the data from the pick message
		 */
		onPick: function(pickInfo) {
			if (this.drawingNormals) {
				this.drawNormals(pickInfo);
			}
			
			if (this.loggingPickInfo) {
				this.logPickInfo(pickInfo);
			}
		},

		/**
		 * This function dumps the names of all of the materials for the given Model
		 * to the console.
		 *
		 * @param {hemi.model.Model} model the Model to log materials for
		 */
		logMaterialNames: function(model) {
			console.log("Material names for model: " + model.name);
			
			for (var m = 0; m < model.materials.length; m++) {
				var material = model.materials[m];
				console.log(material.name);
			}

			console.log("End of materials for model: " + model.name);
		},
		
		/**
		 * This function dumps the names of all of the shapes for the given Model
		 * to the console.
		 *
		 * @param {hemi.model.Model} model the Model to log shapes for
		 */
		logShapeNames: function(model) {
			console.log("Shape names for model: " + model.name);
			
			for (var s = 0; s < model.shapes.length; s++) {
				var shape = model.shapes[s];
				console.log(shape.name);
			}
			
			console.log("End of shapes for model: " + model.name);
		},
		
		/**
		 * This function dumps the names of all of the transforms for the given
		 * Model to the console.
		 *
		 * @param {hemi.model.Model} model the Model to log transforms for
		 */
		logTransformNames: function(model) {
			console.log("Transforms names for model: " + model.name);
			
			for (var t = 0; t < model.transforms.length; t++) {
				var transform = model.transforms[t];
				console.log(transform.name);
			}
			
			console.log("End of transforms for model: " + model.name);
		}
	};

	hemi.core.init = function(clientElement) {
		// Create aliases o3djs libraries
		this.event = o3djs.event;
		this.loader = o3djs.loader;
		this.math = o3djs.math;
		this.particles = o3djs.particles;
		this.renderGraph = o3djs.rendergraph;
		this.canvas = o3djs.canvas;
		this.material = o3djs.material;
		this.shape = o3djs.shape;
		this.picking = o3djs.picking;
		this.primitives = o3djs.primitives;
		this.io = o3djs.io;
		this.error = o3djs.error;

		this.o3dElement = clientElement;
		this.o3d = this.o3dElement.o3d;
		this.client = this.o3dElement.client;
		this.mainPack = this.client.createPack();
		this.transformTable = new Hashtable();

		hemi.picking.init();
		hemi.input.init();
		hemi.view.init();
		hemi.model.init();
		hemi.effect.init();
		hemi.hud.init();
		hemi.shape.init();
		hemi.world.init();

		this.debug = new hemi.core.Debug();
		this.addToTransformTable(this.client.root);
	};
	
	/**
	 * Update the child-to-parent Transform table with the given Transform and
	 * its parent Transform. Recurse through all of the given Transform's
	 * children to create entries for them as well.
	 * 
	 * @param {o3d.Transform} transform the child Transform
	 * @param {o3d.Transform} parent the parent Transform
	 */
	hemi.core.addToTransformTable = function(transform, opt_parent) {
		if (opt_parent) {
			this.transformTable.put(transform.clientId, opt_parent);
		}
		
		var children = transform.children;
		
		for (var ndx = 0; ndx < children.length; ndx++) {
			this.addToTransformTable(children[ndx], transform);
		}
	};
	
	/**
	 * Remove the given Transform's entry from the child-to-parent Transform
	 * table. Recurse through all of the given Transform's children to remove
	 * any entries for them as well.
	 * 
	 * @param {o3d.Transform} transform the root Transform to remove
	 */
	hemi.core.removeFromTransformTable = function(transform) {
		this.transformTable.remove(transform.clientId);
		var children = transform.children;
		
		for (var ndx = 0; ndx < children.length; ndx++) {
			this.removeFromTransformTable(children[ndx]);
		}
	};
	
	/**
	 * Get the parent Transform of the given child Transform. This makes use of
	 * the child-to-parent Transform table.
	 * 
	 * @param {o3d.Transform} transform the child Transform to get the parent
	 *	   of
	 */
	hemi.core.getTransformParent = function(transform) {
		return this.transformTable.get(transform.clientId);
	};
	
	/**
	 * Callback function for whenever a new model file is loaded. This function
	 * updates transform and picking trees and sets up materials.
	 *
	 * @param {o3d.Pack} pack the pack loaded with scene content
	 * @param {o3d.Transform} parentTransform the root transform for the loaded
	 *		  content
	 */
	hemi.core.loaderCallback = function(pack, parentTransform) {
		// Update transform and picking info
		hemi.core.addToTransformTable(parentTransform, hemi.model.modelRoot);
		hemi.picking.treeInfo.update();
		
		// Generate draw elements and setup material draw lists.
		o3djs.pack.preparePack(pack, hemi.view.viewInfo);
		
		var materials = pack.getObjectsByClassName('o3d.Material');
		
		for (var m = 0; m < materials.length; ++m) {
			var material = materials[m];
			// Connect each material's lightWorldPos param to the camera
			var param = material.getParam('lightWorldPos');
			
			if (param) {
				param.bind(hemi.world.camera.light.position);
			}
			
			param = material.getParam('ambientIntensity');
			
			if (param) {
				param.value = [0.3, 0.3, 0.3, 0.2];
			}
			
			param = material.getParam('ambient');
			
			if (param) {
				param.value = [0.3, 0.3, 0.3, 0.2];
			}
			
			param = material.getParam('lightColor');
			
			if (param) {
				param.bind(hemi.world.camera.light.color);
			}
			
			// For now, the Z-sorted draw list does not work well with
			// transparent shapes like particles. So stick them in the
			// performance list.
			if (material.drawList == hemi.view.viewInfo.zOrderedDrawList) {
				material.drawList = hemi.view.viewInfo.performanceDrawList;
			}
			
			if (hemi.world.fog !== null) {
				hemi.fx.addFog(material, hemi.world.fog);
			}
		}
	};
	
	return hemi;
})(hemi || {});
