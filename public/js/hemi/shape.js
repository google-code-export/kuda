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

(function (hemi) {

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Enum for different geometry shape types.
	 */
	hemi.ShapeType = {
		ARROW: 'arrow',
		BOX: 'box',
		CONE: 'cone',
		CUBE: 'cube',
		CUSTOM: 'custom',
		CYLINDER: 'cylinder',
		OCTA: 'octa',
		PLANE: 'plane',
		PYRAMID: 'pyramid',
		SPHERE: 'sphere',
		TETRA: 'tetra'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shape class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Shape is a wrapper class around basic geometric shapes such as cubes and spheres
	 * that allows them to interact with the World in complex ways.
	 * 
	 * @param {hemi.Client} client the Client that will render the Shape
	 * @param {Object} opt_config optional configuration for the Shape
	 */
	var Shape = function(client, opt_config) {
		this.client = client;
		this.config = opt_config || {};
		this.mesh = null;

		if (this.config.shape) {
			this.create();
		}
	};

	/*
	 * Remove all references in the Shape.
	 */
	Shape.prototype._clean = function() {
		if (this.mesh !== null) {
			this.mesh.cleanup();
			this.mesh = null;
		}

		this.client = null;
		this.config = {};
	};

	/*
	 * Octane properties for Shape.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Shape.prototype._octane = ['client', 'config', 'mesh', 'create'];

	/**
	 * Create the actual geometry for the Shape.
	 */
	Shape.prototype.create = function() {
		if (this.mesh === null) {
			this.mesh = new hemi.Mesh();
		}

		hemi.createShape(this.config, this.mesh);
		this.setName(this.name);

		if (this.mesh.parent === undefined) {
			this.client.scene.add(this.mesh);
		}
	};

	/**
	 * Set the color of the Shape.
	 * 
	 * @param {number} color the new color (in hex)
	 */
	Shape.prototype.setColor = function(color) {
		if (this.config.material) {
			this.config.material.color = color;
		} else {
			this.config.color = color;
			this.mesh.material.color = color;
		}
	};

	/**
	 * Set the name for the Shape as well as its Mesh and geometry.
	 * 
	 * @param {string} name the new name
	 */
	Shape.prototype.setName = function(name) {
		this.name = name;
		this.mesh.name = this.name + ' Mesh';
		this.mesh.geometry.name = this.name + ' Geometry';
	};

	/**
	 * Set the opacity of the Shape.
	 * 
	 * @param {number} opacity the new opacity (0 to 1)
	 */
	Shape.prototype.setOpacity = function(opacity) {
		this.config.opacity = opacity;
		this.mesh.material.opacity = opacity;
		this.mesh.material.transparent = opacity < 1;
	};

	/**
	 * Set the shape type of the Shape.
	 * 
	 * @param {string} type the new shape type
	 */
	Shape.prototype.setType = function(type) {
		this.config.shape = type;
		this.create();
	};
	
	/**
	 * Convenience method for translating the mesh.
	 * 
	 * @param {number} x amount to translate in the x direction 
	 * @param {number} y amount to translate in the y direction
	 * @param {number} z amount to translate in the z direction
	 */
	Shape.prototype.translate = function(x, y, z) {
		this.mesh.translateX(x);
		this.mesh.translateY(y);
		this.mesh.translateZ(z);
	};

	hemi.makeCitizen(Shape, 'hemi.Shape', {
		cleanup: Shape.prototype._clean,
		toOctane: Shape.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create a geometric shape with the given properties. Valid properties:
	 * shape: the type of shape to create
	 * color: the color of the shape
	 * opacity: the opacity of the shape
	 * material: the Material to use for the shape (overrides color and opacity)
	 * height/h: height of the shape
	 * width/w: width of the shape
	 * depth/d: depth of the shape
	 * size: size of the shape
	 * radius/r: radius of the shape
	 * radiusB/r1: bottom radius of the shape
	 * radiusT/r2: top radius of the shape
	 * tail: length of the tail of the shape
	 * vertices/v: a series of vertices defining the shape
	 * faces/f: a series of faces referencing three vertices each
	 * faceVertexUvs/uvs: a series of uv coordinates
	 * 
	 * @param {Object} shapeInfo properties of the shape to create
	 * @param {hemi.Mesh} opt_mesh optional Mesh to contain the geometry
	 * @return {THREE.Mesh} the parent Mesh of the created geometry
	 */
	hemi.createShape = function(shapeInfo, opt_mesh) {
		var mesh = opt_mesh || new hemi.Mesh(),
			shapeType = shapeInfo.shape || hemi.ShapeType.Box;

		if (!mesh.material) {
			if (shapeInfo.material !== undefined) {
				mesh.material = shapeInfo.material;
			} else {
				var color = shapeInfo.color || 0x000000,
					opacity = shapeInfo.opacity === undefined ? 1 : shapeInfo.opacity;

				mesh.material = new THREE.MeshPhongMaterial({
					color: color,
					opacity: opacity,
					transparent: opacity < 1
				});
			}
		}

		switch (shapeType.toLowerCase()) {
			case hemi.ShapeType.BOX:
				var w = shapeInfo.width !== undefined ? shapeInfo.width :
						shapeInfo.w !== undefined ? shapeInfo.w : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1,
					d = shapeInfo.depth !== undefined ? shapeInfo.depth :
						shapeInfo.d !== undefined ? shapeInfo.d : 1;

				mesh.geometry = new THREE.CubeGeometry(w, h, d);
				break;
			case hemi.ShapeType.CUBE:
				var size = shapeInfo.size !== undefined ? shapeInfo.size : 1;

				mesh.geometry = new THREE.CubeGeometry(size, size, size);
				break;
			case hemi.ShapeType.SPHERE:
				var r = shapeInfo.radius !== undefined ? shapeInfo.radius :
						shapeInfo.r !== undefined ? shapeInfo.r : 1;

				mesh.geometry = new THREE.SphereGeometry(r, 24, 12);
				break;
			case hemi.ShapeType.CYLINDER:
				var r1 = shapeInfo.radiusB !== undefined ? shapeInfo.radiusB :
						shapeInfo.r1 !== undefined ? shapeInfo.r1 : 1,
					r2 = shapeInfo.radiusT !== undefined ? shapeInfo.radiusT :
						shapeInfo.r2 !== undefined ? shapeInfo.r2 : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1;

				mesh.geometry = new THREE.CylinderGeometry(r1, r2, h, 24);
				break;
			case hemi.ShapeType.CONE:
				var r = shapeInfo.radius !== undefined ? shapeInfo.radius :
						shapeInfo.r !== undefined ? shapeInfo.r : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1;

				mesh.geometry = new THREE.CylinderGeometry(0, r, h, 24);
				break;
			case hemi.ShapeType.PLANE:
				var w = shapeInfo.width !== undefined ? shapeInfo.width :
						shapeInfo.w !== undefined ? shapeInfo.w : 1,
					h = shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1;

				mesh.geometry = new THREE.PlaneGeometry(w, h);
				break;
			case hemi.ShapeType.ARROW:
				mesh.geometry = createArrow(
					shapeInfo.size !== undefined ? shapeInfo.size : 1,
					shapeInfo.tail !== undefined ? shapeInfo.tail : 1,
					shapeInfo.depth !== undefined ? shapeInfo.depth : 1);
				break;
			case hemi.ShapeType.TETRA:
				mesh.geometry = createTetra(shapeInfo.size !== undefined ? shapeInfo.size : 1);
				break;
			case hemi.ShapeType.OCTA:
				var size = shapeInfo.size !== undefined ? shapeInfo.size : 1;

				mesh.geometry = new THREE.OctahedronGeometry(size/2, 0);
				break;
			case hemi.ShapeType.PYRAMID:
				mesh.geometry = createPyramid(
					shapeInfo.height !== undefined ? shapeInfo.height :
						shapeInfo.h !== undefined ? shapeInfo.h : 1,
					shapeInfo.width !== undefined ? shapeInfo.width :
						shapeInfo.w !== undefined ? shapeInfo.w : 1,
					shapeInfo.depth !== undefined ? shapeInfo.depth :
						shapeInfo.d !== undefined ? shapeInfo.d : 1);
				break;
			case hemi.ShapeType.CUSTOM:
				mesh.geometry = createCustom(
					shapeInfo.vertices !== undefined ? shapeInfo.vertices :
						shapeInfo.v !== undefined ? shapeInfo.v : [],
					shapeInfo.faces !== undefined ? shapeInfo.faces :
						shapeInfo.f !== undefined ? shapeInfo.f : [],
					shapeInfo.faceVertexUvs !== undefined ? shapeInfo.faceVertexUvs :
						shapeInfo.uvs !== undefined ? shapeInfo.uvs : []);
				break;
		}

		mesh.geometry.computeBoundingSphere();
		mesh.boundRadius = mesh.geometry.boundingSphere.radius;
		return mesh;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Create arrow geometry.
	 * 
	 * @param {number} size the scale of the arrow head on each axis
	 * @param {number} tail the length of the arrow tail
	 * @param {number} depth the depth to extrude the arrow
	 * @return {THREE.Geometry} the arrow geometry
	 */
	function createArrow(size, tail, depth) {
		var totalWidth = size + tail,
			halfSize = size / 2,
			halfWidth = totalWidth / 2,
			heightDif = halfSize / 2,
			curX = 0,
			curY = halfWidth,
			points = [
				new THREE.Vector2(curX, curY),
				new THREE.Vector2(curX += halfSize, curY -= size),
				new THREE.Vector2(curX -= heightDif, curY),
				new THREE.Vector2(curX, curY -= tail),
				new THREE.Vector2(curX -= halfSize, curY),
				new THREE.Vector2(curX, curY += tail),
				new THREE.Vector2(curX -= heightDif, curY),
				new THREE.Vector2(curX += halfSize, curY += size)
			],
			shape = new THREE.Shape(points);

		return shape.extrude({amount: depth, bevelEnabled: false});
	}

	/**
	 * Create custom geometry from lists of vertices, faces, and uvs.
	 * 
	 * @param {THREE.Vertex[]} verts list of vertices
	 * @param {THREE.Face3[]} faces list of faces. The normal is determined by right-hand rule (i.e.
	 *     polygon will be visible from side from which vertices are listed in counter-clockwise
	 *     order)
	 * @param {THREE.UV[3][]} faceUvs list of face vertex uvs
	 * @return {THREE.Geometry} the custom geometry
	 */
	function createCustom(verts, faces, faceUvs) {
		var geo = new THREE.Geometry();

		geo.vertices = verts;	
		geo.faces = faces;
		geo.faceVertexUvs[0] = faceUvs;

		for (var i = 0, il = faces.length; i < il; ++i) {
			var face = faces[i],
				normal = hemi.utils.computeNormal(verts[face.a], verts[face.b], verts[face.c]);

			face.normal.copy(normal);
			face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
		}

		geo.computeCentroids();
		geo.mergeVertices();
		return geo;
	}

	/**
	 * Create pyramid geometry.
	 * 
	 * @param {number} h height of pyramid (along z-axis)
	 * @param {number} w width of pyramid (along x-axis)
	 * @param {number} d depth of pyramid (along y-axis)
	 * @return {THREE.Geometry} the pyramid geometry
	 */
	function createPyramid(h, w, d) {
		var halfH = h / 2,
			halfW = w / 2,
			halfD = d / 2,
			v = [new THREE.Vertex(new THREE.Vector3(halfW, -halfH, halfD)),
				 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, halfD)),
				 new THREE.Vertex(new THREE.Vector3(-halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(halfW, -halfH, -halfD)),
				 new THREE.Vertex(new THREE.Vector3(0, halfH, 0))],
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

		return createCustom(v, f, uvs);
	}

	/*
	 * Create tetrahedron geometry.
	 * 
	 * @param {number} size size of cube in which tetrahedron will be inscribed
	 * @return {THREE.Geometry} the tetrahedron geometry
	 */
	function createTetra(size) {
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

		return createCustom(v, f, uvs);
	}

})(hemi);
