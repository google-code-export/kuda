var hemi = (function(hemi) {

	/**
	 * @namespace A module for easily creating primitives in Kuda.
	 */
	hemi.shape = hemi.shape || {};
	
	hemi.shape.BOX = 'box';
	hemi.shape.CUBE = 'cube';
	hemi.shape.SPHERE = 'sphere';
	hemi.shape.CYLINDER = 'cylinder';
	hemi.shape.CONE = 'cone';
	hemi.shape.ARROW = 'arrow';
	hemi.shape.TETRA = 'tetra';
	hemi.shape.OCTA = 'octa';
	hemi.shape.PYRAMID = 'pyramid';
	hemi.shape.CUSTOM = 'custom';
	
	/**
	 * @class A Shape is a wrapper class around basic geometric shapes such as
	 * cubes and spheres that allows them to interact with the World in complex
	 * ways.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {Object} opt_config optional configuration for the Shape
	 */
	hemi.shape.Shape = function(opt_config) {
		hemi.world.Citizen.call(this);
		this.color = null;
		this.dim = {};
		this.shapeType = null;
		this.transform = null;
		
		var cfg = opt_config || {};
		for (t in cfg) {
			if (t === 'color') {
				this.color = cfg[t];
			} else if (t === 'type') {
				this.shapeType = cfg[t];
			} else {
				this.dim[t] = cfg[t];
			}
		}
		
		if (this.color && this.shapeType) {
			this.create();
		}
	};
	
	hemi.shape.Shape.prototype =  {
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         */
        citizenType: 'hemi.shape.Shape',
		
		/**
		 * Send a cleanup Message and remove all references in the Shape.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			
			if (this.transform !== null) {
				destroyTransform(this.transform);
			}
			
			this.color = null;
			this.dim = {};
			this.shapeType = null;
			this.transform = null;
		},
		
		/**
		 * Get the Octane structure for the Shape.
	     *
	     * @return {Object} the Octane structure representing the Shape
		 */
		toOctane: function(){
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'color',
				val: this.color
			});
			
			octane.props.push({
				name: 'dim',
				val: this.dim
			});
			
			octane.props.push({
				name: 'shapeType',
				val: this.shapeType
			});
			
			octane.props.push({
				name: 'create',
				arg: [this.transform.localMatrix, this.transform.visible]
			});
			
			return octane;
		},
		
		/**
		 * Create the actual shape and transform for the Shape.
		 *
		 * @param {number[4][4]} opt_matrix optional local matrix for the Shape
		 * @param {boolean} opt_visible optional flag for setting the shape 
		 * 			visibility.
		 */
		create: function(opt_matrix, opt_visible) {
			var config = jQuery.extend({
					shape: this.shapeType,
					color: this.color
				},
				this.dim);
			
			if (this.transform !== null) {
				destroyTransform(this.transform);
			}
			
			this.transform = hemi.shape.create(config);
			this.setName(this.name);
			
			if (opt_visible != null) {
				this.transform.visible = opt_visible;
			}
			
			if (opt_matrix != null) {
				this.transform.localMatrix = opt_matrix;
			}
			
			this.ownerId = this.transform.createParam('ownerId', 'o3d.ParamInteger');
			this.ownerId.value = this.getId();
			hemi.world.tranReg.distribute(this);
		},
		
		/**
		 * Overwrites Citizen.setId() so that the internal transform gets the
		 * new id as well.
		 * 
		 * @param {number} id the new id
		 */
		setId: function(id) {
			this.parent.setId.call(this, id);
			
			if (this.ownerId) {
				this.ownerId.value = id;
			}
		},
		
		/**
		 * Sets the transform and shape names as well as the overall name for
		 * this shape.
		 * 
		 * @param {string} name the new name
		 */
		setName: function(name) {
			this.name = name;
			this.transform.name = this.name + ' Transform';
			this.transform.shapes[0].name = this.name + ' Shape';
		},
		
		/**
		 * Get the transform for the Shape.
		 * 
		 * @return {o3d.Transform} the transform for the Shape
		 */
		getTransform: function() {
			return this.transform;
		},
		
		/**
		 * Rotate the Transforms in the Shape.
		 * 
		 * @param {Object} config configuration options
		 */
		rotate: function(config) {
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
		},
		
		/**
		 * Scale the Transforms in the Shape.
		 * 
		 * @param {Object} config configuration options
		 */
		scale: function(config) {
			this.transform.scale(config.x, config.y, config.z);
		},

		/**
		 * Set the pickable flag for the Transforms in the Shape.
		 *
		 * @param {Object} config configuration options
		 */
		setPickable: function(config) {
			hemi.picking.setPickable(this.transform, config.pick, true);
		},
		
		/**
		 * Set the visible flag for the Transforms in the Shape.
		 *
		 * @param {Object} config configuration options
		 */
		setVisible: function(config) {
			// TODO: need to have the TransformUpdate object like in model to
			// save changes to octane
			this.transform.visible = config.vis;
		},
		
		/**
		 * Translate the Shape by the given amounts.
		 * 
		 * @param {float} x amount to translate on the x axis
		 * @param {float} y amount to translate on the y axis
		 * @param {float} z amount to translate on the z axis
		 */
		translate: function(x, y, z) {
			if (this.transform !== null) {
				this.transform.translate(x, y, z);
			}
		}
	};

	hemi.shape.Shape.inheritsFrom(hemi.world.Citizen);
	
	/**
	 * Initialize a local root transform and pack.
	 */
	hemi.shape.init = function() {
		hemi.shape.root = hemi.picking.pickRoot;
		hemi.shape.pack = hemi.core.mainPack;
		hemi.shape.material = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			true);
		
		hemi.world.addCamCallback(function(camera) {
			var param = hemi.shape.material.getParam('lightWorldPos'); 
			if (param) {
				param.bind(camera.light.position);
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
	 * @param {Object} shapeInfo properties of the shape to create
	 * @return {o3d.Transform} the parent Transform of the created geometry
	 */
	hemi.shape.create = function(shapeInfo) {
		var transform = null,
			shapeType = shapeInfo.shape,
			color = null,
			material;
		
		if (shapeInfo.mat != null) {
			material = shapeInfo.mat;
			
			var param = material.getParam('lightWorldPos'); 
			if (param) {
				param.bind(hemi.world.camera.light.position);
			}
		} else {
			color = shapeInfo.color;
			material = hemi.shape.material;
		}
		
		switch (shapeType.toLowerCase()) {
			case hemi.shape.BOX:
				transform = hemi.shape.createBox(
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
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.SPHERE:
				transform = hemi.shape.createSphere(
					shapeInfo.radius != null ? shapeInfo.radius :
						shapeInfo.r != null ? shapeInfo.r : 1,
					material);
				break;
			case hemi.shape.CYLINDER:
				transform = hemi.shape.createCylinder(
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
					shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.ARROW:
				transform = hemi.shape.createArrow(
					shapeInfo.size != null ? shapeInfo.size : 1,
					shapeInfo.tail != null ? shapeInfo.tail : 1,
					material);
				break;
			case hemi.shape.TETRA:
				transform = hemi.shape.createTetra(
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.OCTA:
				transform = hemi.shape.createOcta(
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.PYRAMID:
				transform = hemi.shape.createPyramid(
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
					shapeInfo.vertices != null ? shapeInfo.vertices :
						shapeInfo.v != null ? shapeInfo.v : [[0,0,0]],
					material);
				break;
		}
		
		if (transform !== null && color != null) {
			applyColor(transform, color);
		}
		
		return transform;
	};
	
	/**
	 * Create a box.
	 * 
	 * @param {float} h height of box (along y-axis)
	 * @param {float} w width of box (along x-axis)
	 * @param {float} d depth of box (along z-axis)
	 * @param {o3d.Material} material material to use on box
	 * @return {o3d.Transform} the Transform containing the created box
	 */
	hemi.shape.createBox = function(h, w, d, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createBox(pack, material, w, h, d);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a cube.
	 * 
	 * @param {float} size dimensions of cube
	 * @param {o3d.Material} material material to use on cube
	 * @return {o3d.Transform} the Transform containing the created cube
	 */
	hemi.shape.createCube = function(size, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createBox(pack, material, size, size,
				size);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a cylinder.
	 * 
	 * @param {float} r1 Radius at bottom
	 * @param {float} r2 Radius at top
	 * @param {float} h height (along y-axis)
	 * @param {o3d.Material} material material to use on cylinder
	 * @return {o3d.Transform} the Transform containing the created cylinder
	 */
	hemi.shape.createCylinder = function(r1, r2, h, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createTruncatedCone(pack, material, r1,
				r2, h, 24, 1);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a cone.
	 * 
	 * @param {float} r radius of the base
	 * @param {float} h height (along y-axis)
	 * @param {o3d.Material} material material to use on cone
	 * @return {o3d.Transform} the Transform containing the created cone
	 */
	hemi.shape.createCone = function(r, h, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createTruncatedCone(pack, material, r,
					0, h, 24, 1);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a sphere.
	 * 
	 * @param {float} r radius of sphere
	 * @param {o3d.Material} material material to use on sphere
	 * @return {o3d.Transform} the Transform containing the created sphere
	 */
	hemi.shape.createSphere = function(r, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createSphere(pack, material, r, 24, 12);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create an arrow.
	 * 
	 * @param {float} size the scale of the arrow head on each axis
	 * @param {float} tail the length of the arrow tail
	 * @param {o3d.Material} material material to use on arrow
	 * @return {o3d.Transform} the Transform containing the created sphere
	 */
	hemi.shape.createArrow = function(size, tail, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			halfSize = size / 2,
			shape = hemi.core.primitives.createPrism(pack, material, [[0, size],
				[-size, 0], [-halfSize, 0], [-halfSize, -tail],
				[halfSize, -tail], [halfSize, 0], [size, 0]], size);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a tetrahedron.
	 * 
	 * @param {float} size size of cube in which tetrahedron will be inscribed
	 * @param {o3d.Material} material material to use on tetrahedron
	 * @return {o3d.Transform} the Transform containing the created tetrahedron
	 */
	hemi.shape.createTetra = function(size, material) {
		var halfSize = size / 2,
			v = [[halfSize, halfSize, halfSize],
				 [-halfSize, -halfSize, halfSize],
				 [-halfSize, halfSize, -halfSize],
				 [halfSize, -halfSize, -halfSize]],
			verts = [[v[0], v[2], v[1]],
					 [v[0], v[1], v[3]],
					 [v[0], v[3], v[2]],
					 [v[1], v[2], v[3]]];
			trans = hemi.shape.createCustom(verts, material);
		
		return trans;
	};
	
	/**
	 * Create a stellated octahedron.
	 * 
	 * @param {float} size size of cube on which octahedron will be inscribed
	 * @param {o3d.Material} material material to use on octahedron
	 * @return {o3d.Transform} the Transform containing the created octahedron
	 */
	hemi.shape.createOcta = function(size, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			t1 = hemi.shape.createTetra(size, material),
			t2 = hemi.shape.createTetra(size, material);
		
		t1.parent = trans;
		t2.parent = trans;
		t2.rotateY(Math.PI/2);
		trans.parent = hemi.shape.root;
		
		return trans;
	};
	
	/**
	 * Create a pyramid.
	 * 
	 * @param {float} h height of pyramid (along z-axis)
	 * @param {float} w width of pyramid (along x-axis)
	 * @param {float} d depth of pyramid (along y-axis)
	 * @param {o3d.Material} material material to use on pyramid
	 * @return {o3d.Transform} the Transform containing the created pyramid
	 */
	hemi.shape.createPyramid = function(h, w, d, material) {
		var halfH = h / 2,
			halfW = w / 2,
			halfD = d / 2,
			v = [[halfW, -halfH, halfD],
				[-halfW, -halfH, halfD],
				[-halfW, -halfH, -halfD],
				[halfW, -halfH, -halfD],
				[0, halfH, 0]];
			verts = [[v[0],v[1],v[2]],
					 [v[0],v[2],v[3]],
					 [v[1],v[0],v[4]],
					 [v[2],v[1],v[4]],
					 [v[3],v[2],v[4]],
					 [v[0],v[3],v[4]]];
			trans = hemi.shape.createCustom(verts, material);
		
		return trans;
	};
	
	/**
	 * Create a custom shape from a list of vertices.
	 * 
	 * @param {float[][][]} verts list of triples of xyz coordinates. Each
	 *     triple represents a polygon, with the normal determined by right-hand
	 *     rule (i.e. polygon will be visible from side from which vertices are
	 *     listed in counter-clockwise order).
	 * @param {o3d.Material} material material to apply to custom shape. Note -
	 *     UV mapping is a simple [0,0],[0,1],[1,0], so most complicated
	 *     textures will not look good
	 * @return {o3d.Transform} the Transform containing the created custom shape
	 */
	hemi.shape.createCustom = function(verts, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			vertexInfo = hemi.core.primitives.createVertexInfo(),
			positionStream = vertexInfo.addStream(3, o3djs.base.o3d.Stream.POSITION),
			normalStream = vertexInfo.addStream(3, o3djs.base.o3d.Stream.NORMAL),
			texCoordStream = vertexInfo.addStream(2, o3djs.base.o3d.Stream.TEXCOORD, 0);

		for (var i = 0, il = verts.length; i < il; i++) {
			var normal = hemi.core.math.cross(
				hemi.core.math.normalize([verts[i][1][0] - verts[i][0][0],
										  verts[i][1][1] - verts[i][0][1],
										  verts[i][1][2] - verts[i][0][2]]),
				hemi.core.math.normalize([verts[i][2][0] - verts[i][0][0],
										  verts[i][2][1] - verts[i][0][1],
										  verts[i][2][2] - verts[i][0][2]]));
			positionStream.addElementVector(verts[i][0]);
			normalStream.addElementVector(normal);
			texCoordStream.addElement(0, 1);
			positionStream.addElementVector(verts[i][1]);
			normalStream.addElementVector(normal);
			texCoordStream.addElement(1, 0);
			positionStream.addElementVector(verts[i][2]);
			normalStream.addElementVector(normal);
			texCoordStream.addElement(0, 0);
			vertexInfo.addTriangle(i*3,i*3+1,i*3+2);
		}
		
		var shape = vertexInfo.createShape(pack, material);
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	// Internal functions
	
	/*
	 * Apply the given color to the given transform.
	 * 
	 * @param {o3d.Transform} transform transform to apply color to
	 * @param {number[4]} color RGBA color to apply
	 */
	var applyColor = function(transform, color) {
		var children = transform.children;
		
		transform.createParam('diffuse', 'o3d.ParamFloat4').value = color;
		
		for (var i = 0, il = children.length; i < il; i++) {
			applyColor(children[i], color);
		}
	};
	
	/*
	 * Remove the given transform and any child transforms or shapes from the
	 * shape pack.
	 * 
	 * @param {o3d.Transform} transform transform to destroy
	 */
	var destroyTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes;
		
		transform.parent = null;
		
		for (var i = 0, il = children.length; i < il; i++) {
			destroyTransform(children[i]);
		}
		
		for (var i = 0, il = shapes.length; i < il; i++) {
			hemi.shape.pack.removeObject(shapes[i]);
		}
		
		hemi.shape.pack.removeObject(transform);
	};
	
	return hemi;
})(hemi || {});