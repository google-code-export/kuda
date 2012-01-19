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

		// Static helper objects
	var _matrix = new THREE.Matrix4(),
		_quaternion = new THREE.Quaternion(),
		_vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Rotate the given Transform about the given axis by the given amount.
	 * 
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {hemi.Transform} transform the transform to rotate
	*/
	hemi.utils.axisRotate = function(axis, angle, transform) {
		if (transform.useQuaternion) {
			_quaternion.setFromAxisAngle(axis, angle);
			transform.quaternion.multiplySelf(_quaternion);
		} else {
			_vector.copy(axis).multiplyScalar(angle);
			transform.rotation.addSelf(_vector);
		}

		transform.updateMatrix();
		transform.updateMatrixWorld();
	};

	/**
	 * Center the given Mesh's geometry about its local origin and update the Mesh so that the
	 * geometry stays in the same world position.
	 * 
	 * @param {hemi.Mesh} mesh the Mesh to center geometry for
	 */
	hemi.utils.centerGeometry = function(mesh) {
		var delta = THREE.GeometryUtils.center(mesh.geometry);
		delta.multiplySelf(mesh.scale);

		if (mesh.useQuaternion) {
			mesh.quaternion.multiplyVector3(delta);
		} else {
			_matrix.setRotationFromEuler(transform.rotation, transform.eulerOrder);
			delta = transformVector(_matrix, delta);
		}

		mesh.position.subSelf(delta);
		mesh.updateMatrix();
		mesh.updateMatrixWorld();
		// Do some magic since Three.js doesn't currently have a way to flush cached vertices
		updateVertices(mesh);
	};

	/**
	 * Interpret the given point from world space to local space. Note that this function converts
	 * the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Transform} transform the Transform whose local space the point will be in
	 * @param {THREE.Vector3} point the point to convert to local space
	 * @return {THREE.Vector3} the given point, now in local space
	 */
	hemi.utils.pointAsLocal = function(transform, point) {
		var inv = new THREE.Matrix4().getInverse(transform.matrixWorld);
	    return inv.multiplyVector3(point);
	};

	/**
	 * Interpret the given point from local space to world space. Note that this function converts
	 * the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Transform} transform the Transform whose local space the point is in
	 * @param {THREE.Vector3} point the point to convert to world space
	 * @return {THREE.Vector3} the given point, now in world space
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		return transform.matrixWorld.multiplyVector3(point);
	};

	/**
	 * Point the y axis of the given Transform toward the given point.
	 *
	 * @param {hemi.Transform} tran the Transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the y axis
	 * @return {hemi.Transform} the rotated Transform
	 */
	hemi.utils.pointYAt = function(tran, eye, target) {
		var dx = target.x - eye.x,
			dy = target.y - eye.y,
			dz = target.z - eye.z,
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);

		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		tran.updateMatrixWorld();

		return tran;
	};

	/**
	 * Point the z axis of the given Transform toward the given point.
	 *
	 * @param {hemi.Transform} tran the Transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the z axis
	 * @return {hemi.Transform} the rotated Transform
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = _vector.sub(target, eye),
			rotY = Math.atan2(delta.x, delta.z),
			rotX = -Math.asin(delta.y / delta.length());

		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		tran.updateMatrixWorld();

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
		updateUVs(geometry);
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
		updateUVs(geometry);
	};

	/**
	 * Translate the vertices of the given Mesh's geometry by the given amount and update the Mesh
	 * Mesh so that the geometry stays in the same world position.
	 * 
	 * @param {hemi.Mesh} mesh the Mesh to shift geometry for
	 * @param {THREE.Vector3} delta the XYZ amount to shift the geometry by
	 */
	hemi.utils.translateGeometry = function(mesh, delta) {
		// Shift geometry
		mesh.geometry.applyMatrix(_matrix.setTranslation(delta.x, delta.y, delta.z));
		mesh.geometry.computeBoundingBox();

		// Update mesh transform matrix
		delta.multiplySelf(mesh.scale);

		if (mesh.useQuaternion) {
			mesh.quaternion.multiplyVector3(delta);
		} else {
			_matrix.setRotationFromEuler(transform.rotation, transform.eulerOrder);
			delta = transformVector(_matrix, delta);
		}

		mesh.position.subSelf(delta);
		mesh.updateMatrix();
		mesh.updateMatrixWorld();

		// Do some magic since Three.js doesn't currently have a way to flush cached vertices
		updateVertices(mesh);
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
		updateUVs(geometry);
	};

	/**
	 * Rotate the Transform by the given angle along the given world space axis.
	 *
	 * @param {THREE.Vector3} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {hemi.Transform} transform the Transform to rotate
	 */
	hemi.utils.worldRotate = function(axis, angle, transform) {
		var invWorld = _matrix.getInverse(transform.parent.matrixWorld),
			localAxis = transformVector(invWorld, axis);

		hemi.utils.axisRotate(localAxis, angle, transform);
	};

	/**
	 * Scale the Transform by the given scale amounts in world space.
	 *
	 * @param {THREE.Vector3} scale scale factors defined as an XYZ vector
	 * @param {hemi.Transform} transform the Transform to scale
	 */
	hemi.utils.worldScale = function(scale, transform) {
		var invMat = THREE.Matrix4.makeInvert3x3(transform.parent.matrixWorld);

		_vector.copy(scale);
		transform.scale.multiplySelf(multiplyMat3(invMat, _vector));
		transform.updateMatrix();
		transform.updateMatrixWorld();
	};

	/**
	 * Translate the Transform by the given world space vector.
	 *
	 * @param {THREE.Vector3} delta XYZ vector to translate by
	 * @param {hemi.Transform} transform the Transform to translate
	 */
	hemi.utils.worldTranslate = function(delta, transform) {
		var invWorld = _matrix.getInverse(transform.parent.matrixWorld),
			localDelta = transformVector(invWorld, delta);

		transform.position.addSelf(localDelta);
		transform.updateMatrix();
		transform.updateMatrixWorld();
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Transform the given vector by the given 3x3 matrix.
	 * 
	 * @param {THREE.Matrix3} m the matrix
	 * @param {THREE.Vector3} v the vector
	 * @return {THREE.Vector3} the transformed vector
	 */
	function multiplyMat3(matrix, vector) {
		var vX = vector.x,
			vY = vector.y,
			vZ = vector.z;

		vector.x = matrix.m[0] * vX + matrix.m[3] * vY + matrix.m[6] * vZ;
		vector.y = matrix.m[1] * vX + matrix.m[4] * vY + matrix.m[7] * vZ;
		vector.z = matrix.m[2] * vX + matrix.m[5] * vY + matrix.m[8] * vZ;

		return vector;
	}

	/*
	 * Transform the given vector by the rotation and scale of the given matrix.
	 * 
	 * @param {THREE.Matrix4} matrix the matrix
	 * @param {THREE.Vector3} vector the vector
	 * @return {THREE.Vector3} the transformed vector
	 */
	function transformVector(matrix, vector) {
		var vX = vector.x,
			vY = vector.y,
			vZ = vector.z;

		return _vector.set(vX * matrix.n11 + vY * matrix.n21 + vZ * matrix.n31,
			vX * matrix.n12 + vY * matrix.n22 + vZ * matrix.n32,
			vX * matrix.n13 + vY * matrix.n23 + vZ * matrix.n33);
	}

	/*
	 * Perform magic to get the WebGLRenderer to update the geometry's UV buffer.
	 * 
	 * @param {THREE.Geometry} geometry geometry to update UVs for
	 */
	function updateUVs(geometry) {
		var groupList = geometry.geometryGroupsList;

		for (var i = 0, il = groupList.length; i < il; ++i) {
			var group = groupList[i],
				verts = group.faces3.length * 3 + group.faces4.length * 4;

			group.__uvArray = new Float32Array(verts * 2);
			group.__inittedArrays = true;
		}

		geometry.__dirtyUvs = true;
	}

	/*
	 * Perform magic to get the WebGLRenderer to update the mesh geometry's vertex buffer.
	 * 
	 * @param {hemi.Mesh} mesh Mesh containing geometry to update vertices for
	 */
	function updateVertices(mesh) {
		if (mesh.__webglInit) {
			var geometry = mesh.geometry,
				scene = mesh.parent;

			while (scene.parent !== undefined) {
				scene = scene.parent;
			}

			geometry.dynamic = true;
			delete geometry.geometryGroupsList[0].__webglVertexBuffer;
			mesh.__webglInit = false;
			scene.__objectsAdded.push(mesh);
		}
	}

})();
