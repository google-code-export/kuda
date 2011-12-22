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

(function (hemi) {

	/**
	 * @namespace A module for easily creating primitives in Kuda.
	 */
	hemi.shape = hemi.shape || {};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			  Constants				                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	hemi.shape.BOX = 'box';
	hemi.shape.CUBE = 'cube';
	hemi.shape.SPHERE = 'sphere';
	hemi.shape.CYLINDER = 'cylinder';
	hemi.shape.CONE = 'cone';
	hemi.shape.PLANE = 'plane';
	hemi.shape.ARROW = 'arrow';
	hemi.shape.TETRA = 'tetra';
	hemi.shape.OCTA = 'octa';
	hemi.shape.PYRAMID = 'pyramid';
	hemi.shape.CUSTOM = 'custom';
	hemi.shape.SHAPE_ROOT = "ShapeRoot";

	/**
	 * @class A TransformUpdate allows changes to the Transform in a Shape to be
	 * persisted through Octane.
	 */
	hemi.shape.TransformUpdate = function () {
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
	};

	hemi.shape.TransformUpdate.prototype = {
		/**
		 * Apply the changes in the TransformUpdate to the given Transform.
		 * 
		 * @param {THREE.Mesh} transform the Transform to update
		 */
		apply: function(transform) {
			if (this.localMatrix != null) {
				transform.localMatrix = this.localMatrix;
			}
			
			if (this.pickable != null) {
				hemi.picking.setPickable(transform, this.pickable, true);
			}
			
			if (this.visible != null) {
				transform.visible = this.visible;
			}
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
		 * Reset the TransformUpdate to its unmodified state.
		 */
		reset: function() {
			this.localMatrix = this.pickable = this.visible = null;
		},

		/**
		 * Get the Octane structure for the TransformUpdate.
		 *
		 * @return {Object} the Octane structure representing the TransformUpdate
		 */
		toOctane: function() {
			var octane = {
					type: 'hemi.shape.TransformUpdate',
					props: []
				},
				valNames = ['localMatrix', 'visible', 'pickable'];
			
			for (var i = 0, il = valNames.length; i < il; i++) {
				var name = valNames[i];
				octane.props.push({
					name: name,
					val: this[name]
				});
			};

			return octane;
		}
	};
	

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              		 Shape Prototype			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * @class A Shape is a wrapper class around basic geometric shapes such as
	 * cubes and spheres that allows them to interact with the World in complex
	 * ways.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {Object} opt_config optional configuration for the Shape
	 */
	var Shape = function(client, opt_config) {
		this.color = null;
		this.dim = {};
		this.shapeType = null;
		this.transform = null;
		this.client = client;
		
		if (opt_config != null) {
			this.loadConfig(opt_config);
		}
		if (this.color && this.shapeType) {
			this.create();
		}
	};
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
	Shape.prototype.citizenType = 'hemi.shape.Shape';
	
	/**
	 * Send a cleanup Message and remove all references in the Shape.
	 */
	Shape.prototype.cleanup = function() {
		this._super();
		
		if (this.transform !== null) {
			rootTransform.remove(this.transform);
		}
		
		this.color = null;
		this.dim = {};
		this.shapeType = null;
		this.transform = null;
		this.tranUp = null;
	};
	
	/**
	 * Get the Octane structure for the Shape.
     *
     * @return {Object} the Octane structure representing the Shape
	 */
//	Shape.prototype.toOctane = function(){
//		var octane = this._super(),
//			valNames = ['color', 'dim', 'shapeType'];
//		
//		for (var i = 0, il = valNames.length; i < il; i++) {
//			var name = valNames[i];
//			octane.props.push({
//				name: name,
//				val: this[name]
//			});
//		};
//		
//		if (this.tranUp.isModified()) {
//			octane.props.push({
//				name: 'tranUp',
//				oct: this.tranUp.toOctane()
//			});
//		}
//		
//		octane.props.push({
//			name: 'create',
//			arg: []
//		});
//		
//		return octane;
//	};
	
	/**
	 * Change the existing Shape to a new type of Shape using the given
	 * configuration.
	 * 
	 * @param {Object} cfg configuration options for the Shape
	 */
	Shape.prototype.change = function(cfg) {
		this.loadConfig(cfg);
		
		var config = hemi.utils.join({
					shape: this.shapeType,
					color: this.color
				},
				this.dim),
			newTran = hemi.shape.create(config),
			oldTran = this.transform;
		
		this.loadConfig(config);
		oldTran.geometry = newTran.geometry;
		
		this.transform.material.color = this.color;
		
		rootTransform.remove(newTran);
	};
	
	/**
	 * Create the actual shape and transform for the Shape.
	 */
	Shape.prototype.create = function() {
		var config = hemi.utils.join({
				shape: this.shapeType,
				color: this.color
			},
			this.dim);
		
		if (this.transform !== null) {
			rootTransform.remove(this.transform);
		}
		
		this.transform = hemi.shape.create(config);
		this.setName(this.name);
		this.ownerId = this.getId();
	};
	
	/**
	 * Load the given configuration object.
	 * 
	 * @param {Object} config configuration options for the Shape
	 */
	Shape.prototype.loadConfig = function(config) {
		this.dim = {};
		
		for (t in config) {
			if (t === 'color') {
				this.color = config[t];
			} else if (t === 'type') {
				this.shapeType = config[t];
			} else {
				this.dim[t] = config[t];
			}
		}
	};
	
	/**
	 * Overwrites Citizen.setId() so that the internal transform gets the
	 * new id as well.
	 * 
	 * @param {number} id the new id
	 */
	Shape.prototype.setId = function(id) {
		this._super(id);
		
		if (this.ownerId) {
			this.ownerId = id;
		}
	};
	
	/**
	 * Sets the transform and shape names as well as the overall name for
	 * this shape.
	 * 
	 * @param {string} name the new name
	 */
	Shape.prototype.setName = function(name) {
		this.name = name;
		this.transform.name = this.name + ' Transform';
		this.transform.geometry.name = this.name + ' Shape';
	};
	
	/**
	 * Get the transform for the Shape.
	 * 
	 * @return {THREE.Mesh} the transform for the Shape
	 */
	Shape.prototype.getTransform = function() {
		return this.transform;
	};
	
	/**
	 * Rotate the Transforms in the Shape.
	 * 
	 * @param {Object} config configuration options
	 */
	Shape.prototype.rotate = function(config) {
		var axis = config.axis.toLowerCase(),
			rad = config.rad;
		
		switch(axis) {
			case 'x':
				this.transform.rotateX(rad);
				break;
			case 'y':
				this.transform.rotateY(rad);
				break;
			case 'z':
				this.transform.rotateZ(rad);
				break;
		}
	};
	
	/**
	 * Scale the Transforms in the Shape.
	 * 
	 * @param {Object} config configuration options
	 */
	Shape.prototype.scale = function(config) {
		this.transform.scale(config.x, config.y, config.z);
	};

	/**
	 * Set the pickable flag for the Transforms in the Shape.
	 *
	 * @param {Object} config configuration options
	 */
	Shape.prototype.setPickable = function(config) {
		hemi.picking.setPickable(this.transform, config.pick, true);
	};

	/**
	 * Set the Shape Transform's matrix to the new matrix.
	 * 
	 * @param {number[4][4]} matrix the new local matrix
	 */
	Shape.prototype.setMatrix = function(matrix) {			
		this.transform.matrix = matrix;
	};
	
	/**
	 * Set the visible flag for the Transforms in the Shape.
	 *
	 * @param {Object} config configuration options
	 */
	Shape.prototype.setVisible = function(config) {
		this.transform.visible = config.vis;
	};
	
	/**
	 * Translate the Shape by the given amounts.
	 * 
	 * @param {number} x amount to translate on the x axis
	 * @param {number} y amount to translate on the y axis
	 * @param {number} z amount to translate on the z axis
	 */
	Shape.prototype.translate = function(x, y, z) {
		if (this.transform !== null) {
			this.transform.translate(x, y, z);
		}
	};


////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Hemi Citizenship		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	hemi.makeCitizen(Shape, 'hemi.Shape', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});


////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Private Variables		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  

	var rootTransform = new THREE.Object3D(),
		clients = {};
	
	// TODO: add to clients' scenes
	

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			  Global Methods		                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * Initialize a local root transform and pack.
	 */
	hemi.shape.init = function() {
		hemi.shape.root = hemi.core.mainPack.createObject('Transform');
		hemi.shape.root.name = hemi.shape.SHAPE_ROOT;
		hemi.shape.root.parent = hemi.picking.pickRoot;
		hemi.shape.pack = hemi.core.mainPack;
		hemi.shape.material = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			false);
		hemi.shape.transMaterial = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			true);
		
		hemi.world.addCamCallback(function(camera) {
			var pos = camera.light.position,
				param = hemi.shape.material.getParam('lightWorldPos');
			
			if (param) {
				param.bind(pos);
			}
			
			param = hemi.shape.transMaterial.getParam('lightWorldPos'); 
			if (param) {
				param.bind(pos);
			}
		});
	};
	
	/**
	 * Create a geometric shape with the given properties. Valid properties:
	 * shape: the type of shape to create
	 * color: the color of the shape to create
	 * mat: the Material to use for the shape (overrides color)
	 * height/h: height of the shape
	 * width/w: width of the shape
	 * depth/d: depth of the shape
	 * size: size of the shape
	 * radius/r: radius of the shape
	 * radiusB/r1: bottom radius of the shape
	 * radiusT/r2: top radius of the shape
	 * tail: length of the tail of the shape
	 * vertices/v: a series of vertices defining the shape
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {Object} shapeInfo properties of the shape to create
	 * @return {THREE.Mesh} the parent Transform of the created geometry
	 */
	hemi.shape.create = function(client, shapeInfo) {
		var transform = null,
			shapeType = shapeInfo.shape,
			color = null,
			material;
			
		checkClient(client);
		
		if (shapeInfo.mat != null) {
			material = shapeInfo.mat;
		} else {
			color = shapeInfo.color;
			material = new THREE.MeshPhongMaterial({
				color: color,
				opacity: shapeInfo.opacity,
				transparent: shapeInfo.opacity < 1
			});
		}
		
		switch (shapeType.toLowerCase()) {
			case hemi.shape.BOX:
				transform = hemi.shape.createBox(
					client,
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					shapeInfo.depth != null ? shapeInfo.depth :
						shapeInfo.d != null ? shapeInfo.d : 1,
					material);
				break;
			case hemi.shape.CUBE:
				transform = hemi.shape.createCube(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.SPHERE:
				transform = hemi.shape.createSphere(
					client,
					shapeInfo.radius != null ? shapeInfo.radius :
						shapeInfo.r != null ? shapeInfo.r : 1,
					material);
				break;
			case hemi.shape.CYLINDER:
				transform = hemi.shape.createCylinder(
					client,
					shapeInfo.radiusB != null ? shapeInfo.radiusB :
							shapeInfo.r1 != null ? shapeInfo.r1 :
							shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.radiusT != null ? shapeInfo.radiusT :
							shapeInfo.r2 != null ? shapeInfo.r2 :
							shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.CONE:
				transform = hemi.shape.createCone(
					client,
					shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.PLANE:
				transform = hemi.shape.createPlane(
					client,
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					material);
				break;
			case hemi.shape.ARROW:
				transform = hemi.shape.createArrow(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					shapeInfo.tail != null ? shapeInfo.tail : 1,
					material);
				break;
			case hemi.shape.TETRA:
				transform = hemi.shape.createTetra(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.OCTA:
				transform = hemi.shape.createOcta(
					client,
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.PYRAMID:
				transform = hemi.shape.createPyramid(
					client,
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					shapeInfo.depth != null ? shapeInfo.depth :
						shapeInfo.d != null ? shapeInfo.d : 1,
					material);
				break;
			case hemi.shape.CUSTOM:
				transform = hemi.shape.createCustom(
					client,
					shapeInfo.vertices != null ? shapeInfo.vertices :
						shapeInfo.v != null ? shapeInfo.v : [],
					shapeInfo.faces != null ? shapeInfo.faces :
						shapeInfo.f != null ? shapeInfo.f : [],
					shapeInfo.faceVertexUvs != null ? shapeInfo.faceVertexUvs :
						shapeInfo.uvs != null ? shapeInfo.uvs : [],
					material);
				break;
		}
		
		return transform;
	};
	
	/**
	 * Create a box.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} h height of box (along y-axis)
	 * @param {number} w width of box (along x-axis)
	 * @param {number} d depth of box (along z-axis)
	 * @param {THREE.Material} material material to use on box
	 * 
	 * @return {THREE.Mesh} the Transform containing the created box
	 */
	hemi.shape.createBox = function(client, h, w, d, material) {
		var transform = new THREE.Mesh(new THREE.CubeGeometry(w, h, d), 
			material);
			
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a cube.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size dimensions of cube
	 * @param {THREE.Material} material material to use on cube
	 * 
	 * @return {THREE.Mesh} the Transform containing the created cube
	 */
	hemi.shape.createCube = function(client, size, material) {
		var transform = new THREE.Mesh(new THREE.CubeGeometry(size, size, size), 
			material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a cylinder.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} r1 Radius at bottom
	 * @param {number} r2 Radius at top
	 * @param {number} h height (along y-axis)
	 * @param {THREE.Material} material material to use on cylinder
	 * 
	 * @return {THREE.Mesh} the Transform containing the created cylinder
	 */
	hemi.shape.createCylinder = function(client, r1, r2, h, material) {
		var transform = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 24), 
			material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a cone.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} r radius of the base
	 * @param {number} h height (along y-axis)
	 * @param {THREE.Material} material material to use on cone
	 * 
	 * @return {THREE.Mesh} the Transform containing the created cone
	 */
	hemi.shape.createCone = function(client, r, h, material) {
		var transform = new THREE.Mesh(new THREE.CylinderGeometry(0, r, h, 24), 
			material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a plane.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} h height (along y-axis)
	 * @param {number} w width (along x-axis)
	 * @param {THREE.Material} material material to use on plane
	 * 
	 * @return {THREE.Mesh} the Transform containing the created plane
	 */
	hemi.shape.createPlane = function(client, h, w, material) {
		var transform = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);

		checkClient(client);
		rootTransform.add(transform);

		return transform;
	};

	/**
	 * Create a sphere.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} r radius of sphere
	 * @param {THREE.Material} material material to use on sphere
	 * 
	 * @return {THREE.Mesh} the Transform containing the created sphere
	 */
	hemi.shape.createSphere = function(client, r, material) {
		var transform = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create an arrow.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size the scale of the arrow head on each axis
	 * @param {number} tail the length of the arrow tail
	 * @param {THREE.Material} material material to use on arrow
	 * 
	 * @return {THREE.Mesh} the Transform containing the created sphere
	 */
	hemi.shape.createArrow = function(client, size, tail, material) {
		var transform = new THREE.Mesh(new THREE.ArrowGeometry(size, size, tail, 
			size/2, size/2), material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a tetrahedron.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size size of cube in which tetrahedron will be inscribed
	 * @param {THREE.Material} material material to use on tetrahedron
	 * 
	 * @return {THREE.Mesh} the Transform containing the created tetrahedron
	 */
	hemi.shape.createTetra = function(client, size, material) {
		var halfSize = size / 2,
			v = [new THREE.Vertex(new THREE.Vector3(halfSize, halfSize, halfSize)),
				 new THREE.Vertex(new THREE.Vector3(-halfSize, -halfSize, halfSize)),
				 new THREE.Vertex(new THREE.Vector3(-halfSize, halfSize, -halfSize)),
				 new THREE.Vertex(new THREE.Vector3(halfSize, -halfSize, -halfSize))],
			f = [new THREE.Face3(0, 2, 1),
				 new THREE.Face3(0, 1, 3),
				 new THREE.Face3(0, 3, 2),
				 new THREE.Face3(1, 2, 3)],
			uvs = [[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)]];
		
		return hemi.shape.createCustom(client, v, f, uvs, material);
	};
	
	/**
	 * Create a stellated octahedron.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} size size of cube on which octahedron will be inscribed
	 * @param {THREE.Material} material material to use on octahedron
	 * 
	 * @return {THREE.Mesh} the Transform containing the created octahedron
	 */
	hemi.shape.createOcta = function(client, size, material) {
		var transform = new THREE.Mesh(new THREE.OctahedronGeometry(size/2, 0), material);
		
		checkClient(client);
		rootTransform.add(transform);
		
		return transform;
	};
	
	/**
	 * Create a pyramid.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {number} h height of pyramid (along z-axis)
	 * @param {number} w width of pyramid (along x-axis)
	 * @param {number} d depth of pyramid (along y-axis)
	 * @param {THREE.Material} material material to use on pyramid
	 * 
	 * @return {THREE.Mesh} the Transform containing the created pyramid
	 */
	hemi.shape.createPyramid = function(client, h, w, d, material) {
		var halfH = h / 2,
			halfW = w / 2,
			halfD = d / 2,
			v = [new THREE.Vertex(new THREE.Vector3(halfW, -halfH, halfD)),
		 		 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, halfD)),
		 		 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(0, halfH, 0))];
			f = [new THREE.Face3(0, 1, 2),
				 new THREE.Face3(0, 2, 3),
				 new THREE.Face3(1, 0, 4),
				 new THREE.Face3(2, 1, 4),
				 new THREE.Face3(3, 2, 4),
				 new THREE.Face3(0, 3, 4)],
			uvs = [[new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)], 
				   [new THREE.UV(0, 0), new THREE.UV(0, 1), new THREE.UV(1, 0)]];
		
		return hemi.shape.createCustom(client, v, f, uvs, material);
	};
	
	/**
	 * Create a custom shape from a list of vertices.
	 * 
	 * @param {hemi.Client} client the client to add the shape to
	 * @param {THREE.Vertex[]} verts list of vertices. 
	 * @param {THREE.Face3[]} faces list of faces. The normal is determined by 
	 * 	   right-hand rule (i.e. polygon will be visible from side from which 
	 *     vertices are listed in counter-clockwise order).
	 * @param {THREE.UV[3][]} faceUvs list of face vertex uvs. 
	 * @param {THREE.Material} material material to apply to custom shape.
	 * 
	 * @return {THREE.Mesh} the Transform containing the created custom shape
	 */
	hemi.shape.createCustom = function(client, verts, faces, faceUvs, material) {
		var transform, i, il, face, normal,
			geo = new THREE.Geometry();
			
		checkClient(client);
		geo.vertices = verts;	
		geo.faces = faces;
		geo.faceVertexUvs[0] = faceUvs;

		for (i = 0, il = faces.length; i < il; i++) {
			face = faces[i];
			normal = hemi.utils.computeNormal(verts[face.a], verts[face.b], verts[face.c]);
			face.normal.copy(normal);
			face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		}
		
		geo.computeCentroids();
		geo.mergeVertices();
		
		transform = new THREE.Mesh(geo, material);
		rootTransform.add(transform);
		
		return transform;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
//                              			Private Methods			                              //
////////////////////////////////////////////////////////////////////////////////////////////////////  
	
	/*
	 * Checks if the client's scene has rootTransform added to it and if not, adds it.
	 *   
	 * @param {hemi.Client} client the client to check for rootTransform
	 */
	function checkClient(client) {	
		if (!clients[client]) {
			client.scene.add(rootTransform);
			clients[client] = true;
		}
	}
	
})(hemi);