/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var hemi = (function(hemi) {
	hemi.utils = hemi.utils || {};
	
	/**
	 * Check to see if the given Transform has key frame animations bound to it.
	 * 
	 * @param {o3d.Transform} transform the Transform to check
	 * @return {boolean} true if Transform has key frame animations
	 */
	hemi.utils.isAnimated = function(transform) {
		var lm = transform.getParam('o3d.localMatrix');
		
		return lm.inputConnection != null;
	};
	
	/**
	 * Create a new child Transform for the given Transform and move all of its
	 * current children and shapes onto the new child.
	 * 
	 * @param {o3d.Transform} transform the Transform to foster from
	 * @return {o3d.Transform} the created child Transform
	 */
	hemi.utils.fosterTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes,
			newTran = hemi.core.mainPack.createObject('Transform');
		
		while (children.length > 0) {
			children[0].parent = newTran;
		}
		
		newTran.parent = transform;
		
		while (shapes.length > 0) {
			var shape = shapes[0];
			newTran.addShape(shape);
			transform.removeShape(shape);
		}
		
		return newTran;
	};
	
	/**
	 * Interprets a point in world space into local space. Note that this function converts the
	 * actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Transform} transform the transform whose local space the point will be in
	 * @param {THREE.Vector3} point the point to convert to local space
	 * @return {THREE.Vector3} the given point, now in local space
	 */
	hemi.utils.pointAsLocal = function(transform, point) {
		var inv = new THREE.Matrix4().getInverse(transform.matrixWorld);
	    return inv.multiplyVector3(point);
	};
	
	/**
	 * Interprets a point in local space into world space. Note that this function converts the
	 * actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Transform} transform the transform whose local space the point is in
	 * @param {THREE.Vector3} point the point to convert to world space
	 * @return {THREE.Vector3} the given point, now in world space
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		return transform.matrixWorld.multiplyVector3(point);
	};
	
	/**
	 * Point the y axis of the given matrix toward the given point.
	 *
	 * @param {THREE.Matrix4} matrix the matrix to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the y axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointYAt = function(matrix, eye, target) {
		var dx = target.x - eye.x,
			dy = target.y - eye.y,
			dz = target.z - eye.z,
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);
		
//		tran.rotation.y += rotY;
//		tran.rotation.x += rotX;
//		tran.updateMatrix();
		matrix.rotateY(rotY);
		matrix.rotateX(rotX);

		
		return matrix;
	};
	
	/**
	 * Point the z axis of the given transform toward the given point.
	 *
	 * @param {THREE.Object3D} tran the transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the z axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = new THREE.Vector3().sub(target, eye),
			rotY = Math.atan2(delta.x, delta.z),
			rotX = -Math.asin(delta.y / delta.length());
		
		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		
		return tran;
	};

	/**
	 * Rotate the texture UV coordinates of the given Geometry.
	 * 
	 * @param {THREE.Geometry} geometry the Geometry to translate the texture for
	 * @param {number} theta amount to rotate the UV coordinates (in radians)
	 */
	hemi.utils.rotateUVs = function(geometry, theta) {
		var uvSet = geometry.faceVertexUvs[0],
			cosT = Math.cos(theta),
			sinT = Math.sin(theta);

		for (var i = 0, il = uvSet.length; i < il; ++i) {
			var uvs = uvSet[i];

			for (var j = 0, jl = uvs.length; j < jl; ++j) {
				var uv = uvs[j],
					u = uv.u,
					v = uv.v;

				uv.u = u * cosT - v * sinT;
				uv.v = u * sinT + v * cosT;
			}
		}

		// Magic to get the WebGLRenderer to update the vertex buffer
		for (var i = 0, il = geometry.geometryGroupsList.length; i < il; ++i) {
			var group = geometry.geometryGroupsList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	};

	/**
	 * Scale the texture UV coordinates of the given Geometry.
	 * 
	 * @param {THREE.Geometry} geometry the Geometry to translate the texture for
	 * @param {number} uScale amount to scale the U coordinate
	 * @param {number} vScale amount to scale the V coordinate
	 */
	hemi.utils.scaleUVs = function(geometry, uScale, vScale) {
		var uvSet = geometry.faceVertexUvs[0];

		for (var i = 0, il = uvSet.length; i < il; ++i) {
			var uvs = uvSet[i];

			for (var j = 0, jl = uvs.length; j < jl; ++j) {
				uvs[j].u *= uScale;
				uvs[j].v *= vScale;
			}
		}

		// Magic to get the WebGLRenderer to update the vertex buffer
		for (var i = 0, il = geometry.geometryGroupsList.length; i < il; ++i) {
			var group = geometry.geometryGroupsList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	};

	/**
	 * Apply the given transform matrix to the vertices of the given transform's
	 * geometry as well as the geometry of any child transforms.
	 * 
	 * @param {THREE.Object3D} transform the transform to start shifting at
	 * @param {THREE.Matrix4} matrix the transform matrix to apply
	 * @param {THREE.Scene} scene the transform's scene
	 */
	hemi.utils.shiftGeometry = function(transform, matrix, scene) {
		var geometry = transform.geometry,
			children = transform.children;

		if (geometry) {
			// Shift geometry
			geometry.applyMatrix(matrix);
			geometry.computeBoundingBox();

			// Do some magic since Three.js doesn't currently have a way to flush cached vertices
			if (transform.__webglInit) {
				geometry.dynamic = true;
				transform.__webglInit = false;
				delete geometry.geometryGroupsList[0].__webglVertexBuffer;
				scene.__objectsAdded.push(transform);
			}
		}

		// Shift geometry of all children
		for (var i = 0, il = children.length; i < il; ++i) {
			var child = children[i];
			hemi.utils.shiftGeometry(child, matrix, scene);
		}
	};

	/**
	 * Translate the texture UV coordinates of the given Geometry.
	 * 
	 * @param {THREE.Geometry} geometry the Geometry to translate the texture for
	 * @param {number} uDelta amount to translate the U coordinate
	 * @param {number} vDelta amount to translate the V coordinate
	 */
	hemi.utils.translateUVs = function(geometry, uDelta, vDelta) {
		var uvSet = geometry.faceVertexUvs[0];

		for (var i = 0, il = uvSet.length; i < il; ++i) {
			var uvs = uvSet[i];

			for (var j = 0, jl = uvs.length; j < jl; ++j) {
				uvs[j].u += uDelta;
				uvs[j].v += vDelta;
			}
		}

		// Magic to get the WebGLRenderer to update the vertex buffer
		for (var i = 0, il = geometry.geometryGroupsList.length; i < il; ++i) {
			var group = geometry.geometryGroupsList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	};

	/**
	 * Move all of the children and shapes off of the given foster Transform and
	 * back to the original parent Transform. Destroy the foster Transform
	 *
	 * @param {o3d.Transform} transform the foster Transform previously created
	 * @return {o3d.Transform} the original parent Transform
	 */
	hemi.utils.unfosterTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes,
			tParent = transform.parent;

		while (children.length > 0) {
			children[0].parent = tParent;
		}

		while (shapes.length > 0) {
			var shape = shapes[0];
			tParent.addShape(shape);
			transform.removeShape(shape);
		}

		transform.parent = null;
		hemi.core.mainPack.removeObject(transform);
		return tParent;
	};
	
	/**
	 * Rotate the transform by the given angle along the given world space axis.
	 *
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {THREE.Object3D} transform the transform to rotate
	 */
	hemi.utils.worldRotate = function(axis, angle, transform) {
		var iW = new THREE.Matrix4().getInverse(transform.matrixWorld),
			lA = hemi.utils.transformDirection(iW, axis);

		hemi.utils.axisRotate(lA, angle, transform);
	};
	
	/**
	 * Scale the transform by the given scale amounts in world space.
	 *
	 * @param {THREE.Vector3} scale scale factors defined as an XYZ vector
	 * @param {THREE.Object3D} transform the transform to scale
	 */
	hemi.utils.worldScale = function(scale, transform) {
		var matrix3x3 = THREE.Matrix4.makeInvert3x3(transform.parent.matrixWorld);
		transform.scale.multiplySelf(hemi.utils.multiplyVector3(matrix3x3, scale.clone()));
		transform.updateMatrix();
	};
	
	/**
	 * Translate the transform by the given world space vector.
	 *
	 * @param {THREE.Vector3} v XYZ vector to translate by
	 * @param {THREE.Object3D} transform the transform to translate
	 */
	hemi.utils.worldTranslate = function(v, transform) {
		var iW = new THREE.Matrix4().getInverse(transform.matrixWorld),
			lV = hemi.utils.transformDirection(iW, v);
		
		transform.translateX(lV.x);
		transform.translateY(lV.y);
		transform.translateZ(lV.z);
		transform.updateMatrix();
	};

	/**
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {THREE.Object3D} transform the transform to rotate
	*/
	hemi.utils.axisRotate = function(axis, angle, transform) {
		if (!transform.useQuaternion) {
			transform.useQuaternion = true;
			transform.quaternion.setFromEuler(THREE.Vector3(hemi.utils.radToDeg(transform.rotation.x),
			 hemi.utils.radToDeg(transform.rotation.y),
			 hemi.utils.radToDeg(transform.rotation.z)));
		}						
		transform.quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle).multiplySelf(transform.quaternion);
		transform.updateMatrix();
	};

	/**
	 * Return the Object3D to the identity matrix
	 *
	 * @param {THREE.Object3D} object3D the Object3D to modify
	 */
    hemi.utils.identity = function(object3d) {
        object3d.position = new THREE.Vector3(0, 0, 0);
        object3d.rotation = new THREE.Vector3(0, 0, 0);
        object3d.scale = new THREE.Vector3(1, 1, 1);
        object3d.updateMatrix();
    };

	/**
	 * Get all of the child Object3Ds of an Object3D
	 *
	 * @param {THREE.Object3D} object3D The parent of the Object3Ds to find
	 * @param {Object3D[]} an array where the child Object3Ds will be placed 
	 */
    hemi.utils.getChildren = function(parent, returnObjs) {
		for (var i = 0; i < parent.children.length; ++i) {
			var child = parent.children[i];
			returnObjs.push(child);
			hemi.utls.getChildren(child, returnObjs);
		}
	};


	/**
	 * Takes a 4-by-4 matrix and a vector with 3 entries, interprets the vector as a
	 * direction, transforms that direction by the matrix, and returns the result;
	 * assumes the transformation of 3-dimensional space represented by the matrix
	 * is parallel-preserving, i.e. any combination of rotation, scaling and
	 * translation, but not a perspective distortion. Returns a vector with 3
	 * entries.
	 * @param {THREE.Matrix4} m The matrix.
	 * @param {THREE.Vector3} v The direction.
	 * @return {THREE.Vector3} The transformed direction.
	 */
	hemi.utils.transformDirection = function(m, v) {
	  return new THREE.Vector3(v.x * m.n11 + v.y * m.n21 + v.z * m.n31,
	    v.x * m.n12 + v.y * m.n22 + v.z * m.n32,
	    v.x * m.n13 + v.y * m.n23 + v.z * m.n33);
	};


	hemi.utils.multiplyVector3 = function (matrix, vector) {

		var vx = vector.x, vy = vector.y, vz = vector.z;

		vector.x = matrix.m[0] * vx + matrix.m[3] * vy + matrix.m[6] * vz;
		vector.y = matrix.m[1] * vx + matrix.m[4] * vy + matrix.m[7] * vz;
		vector.z = matrix.m[2] * vx + matrix.m[5] * vy + matrix.m[8] * vz;

		return vector;
	};

	return hemi;
})(hemi || {});
