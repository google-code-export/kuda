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
		transform.updateMatrixWorld(true);
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
			_matrix.setRotationFromEuler(mesh.rotation, mesh.eulerOrder);
			delta = transformVector(_matrix, delta);
		}

		mesh.position.subSelf(delta);
		mesh.updateMatrix();
		mesh.updateMatrixWorld(true);
		// Do some magic since Three.js doesn't currently have a way to flush cached vertices
		updateVertices(mesh);
	};
	
	/**
	 * Clones the given material and returns the clone. Every prop is copied by reference.
	 * 
	 * @param {THREE.Material} material the material to clone
	 */
	hemi.utils.cloneMaterial = function(material) {
		var newMat = new material.constructor(),
			offLimits = ['fragmentShader', 'id', 'program', 'uniforms', 'uniformsList', 
				'vertexShader'];
				
		for (var prop in material) {
			var p = material[prop];
			if (!hemi.utils.isFunction(p) && offLimits.indexOf(prop) === -1) {
				newMat[prop] = p;
			}
		}
		
		newMat.name = newMat.name + '_clone';
		
		return newMat;
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
		tran.updateMatrixWorld(true);

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
		tran.updateMatrixWorld(true);

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
	 * Check for degenerate triangles (all three points are collinear) in the faces of the geometry
	 * of the given Transform and its children and remove those triangles.
	 *
	 * @param {hemi.Transform} transform Transform to begin scrubbing faces at
	 * @param {number} opt_precision the precision to use for floating point numbers
	 */
	hemi.utils.scrubTriangles = function(transform, opt_precision) {
		if (opt_precision === undefined) opt_precision = 0.00001;

		if (transform.geometry) {
			var geom = transform.geometry,
				vertices = geom.vertices,
				faces = geom.faces;

			for (var i = faces.length - 1; i >= 0; --i) {
				var face = faces[i];

				if (face instanceof THREE.Face3) {
					var a = vertices[face.a].position,
						b = vertices[face.b].position,
						c = vertices[face.c].position,
						area = THREE.GeometryUtils.triangleArea(a, b, c);

					if (area < opt_precision) {
						faces.splice(i, 1);

						for (var j = 0, jl = geom.faceUvs.length; j < jl; ++j) {
							var uvs = geom.faceUvs[j];

							if (i < uvs.length) {
								uvs.splice(i, 1);
							}
						}

						for (var j = 0, jl = geom.faceVertexUvs.length; j < jl; ++j) {
							var uvs = geom.faceVertexUvs[j];

							if (i < uvs.length) {
								uvs.splice(i, 1);
							}
						}
					}
				} else if (face instanceof THREE.Face4) {
					var a = vertices[face.a].position,
						b = vertices[face.b].position,
						c = vertices[face.c].position,
						d = vertices[face.d].position,
						area1 = THREE.GeometryUtils.triangleArea(a, b, d),
						area2 = THREE.GeometryUtils.triangleArea(b, c, d);

					if (area1 <= opt_precision) {
						if (area2 <= opt_precision) {
							// Remove the whole face
							faces.splice(i, 1);

							for (var j = 0, jl = geom.faceUvs.length; j < jl; ++j) {
								var uvs = geom.faceUvs[j];

								if (i < uvs.length) {
									uvs.splice(i, 1);
								}
							}

							for (var j = 0, jl = geom.faceVertexUvs.length; j < jl; ++j) {
								var uvs = geom.faceVertexUvs[j];

								if (i < uvs.length) {
									uvs.splice(i, 1);
								}
							}
						} else {
							// Remove the first triangle
							var newFace = new THREE.Face3(face.b, face.c, face.d, face.normal,
								face.color, face.materialIndex);

							if (face.vertexNormals.length > 0) {
								newFace.vertexNormals[0] = face.vertexNormals[1];
								newFace.vertexNormals[1] = face.vertexNormals[2];
								newFace.vertexNormals[2] = face.vertexNormals[3];
							}
							
							if (face.vertexColors.length > 0) {
								newFace.vertexColors[0] = face.vertexColors[1];
								newFace.vertexColors[1] = face.vertexColors[2];
								newFace.vertexColors[2] = face.vertexColors[3];
							}

							faces[i] = newFace;

							for (var j = 0, jl = geom.faceUvs.length; j < jl; ++j) {
								var uvs = geom.faceUvs[j];

								if (i < uvs.length) {
									uvs[i].shift();
								}
							}

							for (var j = 0, jl = geom.faceVertexUvs.length; j < jl; ++j) {
								var uvs = geom.faceVertexUvs[j];

								if (i < uvs.length) {
									uvs[i].shift();
								}
							}
						}
					} else if (area2 <= opt_precision) {
						// Remove the second triangle
						var newFace = new THREE.Face3(face.a, face.b, face.d, face.normal,
							face.color, face.materialIndex);
						
						if (face.vertexNormals.length > 0) {
							newFace.vertexNormals[0] = face.vertexNormals[0];
							newFace.vertexNormals[1] = face.vertexNormals[1];
							newFace.vertexNormals[2] = face.vertexNormals[3];
						}
						
						if (face.vertexColors.length > 0) {
							newFace.vertexColors[0] = face.vertexColors[0];
							newFace.vertexColors[1] = face.vertexColors[1];
							newFace.vertexColors[2] = face.vertexColors[3];
						}

						faces[i] = newFace;

						for (var j = 0, jl = geom.faceUvs.length; j < jl; ++j) {
							var uvs = geom.faceUvs[j];

							if (i < uvs.length) {
								uvs[i].splice(2, 1);
							}
						}

						for (var j = 0, jl = geom.faceVertexUvs.length; j < jl; ++j) {
							var uvs = geom.faceVertexUvs[j];

							if (i < uvs.length) {
								uvs[i].splice(2, 1);
							}
						}
					}
				}
			}
		}

		var children = transform.children;

		for (var i = 0, il = children.length; i < il; ++i) {
			this.scrubTriangles(children[i], opt_precision);
		}
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
		mesh.updateMatrixWorld(true);

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
	 * Convert the transform from using quaternions to manage its rotation to using Euler angles.
	 * 
	 * @param {hemi.Transform} transform the Transform to convert
	 */
	hemi.utils.useEuler = function(transform) {
		if (transform.useQuaternion) {
			_matrix.setRotationFromQuaternion(transform.quaternion);
			transform.rotation.setRotationFromMatrix(_matrix);
			transform.useQuaternion = false;
		}
	};

	/** 
	 * Check for degenerate triangles (all three points are collinear) in the faces of the geometry
	 * of the given Transform and its children.
	 *
	 * @param {hemi.Transform} transform Transform to begin checking faces at
	 */
	hemi.utils.validateTriangles = function(transform) {
		function toString(vec) {
			return '[' + vec.x + ', ' + vec.y + ', ' + vec.z + ']';
		}

		if (transform.geometry) {
			var vertices = transform.geometry.vertices,
				faces = transform.geometry.faces;

			for (var i = 0, il = faces.length; i < il; ++i) {
				var face = faces[i];

				if (face instanceof THREE.Face3) {
					var a = vertices[face.a].position,
						b = vertices[face.b].position,
						c = vertices[face.c].position,
						area = THREE.GeometryUtils.triangleArea(a, b, c);

					if (area < 0.0001) {
						console.log('Zero area triangle: face ' + i + ' of ' + transform.name);
						console.log('Verts: ' + toString(a) + ', ' + toString(b) + ', ' + toString(c));
					}
				} else if (face instanceof THREE.Face4) {
					var a = vertices[face.a].position,
						b = vertices[face.b].position,
						c = vertices[face.c].position,
						d = vertices[face.d].position,
						area = THREE.GeometryUtils.triangleArea(a, b, d);

					if (area < 0.0001) {
						console.log('Zero area triangle (in quad): face ' + i + ' of ' + transform.name);
						console.log('Verts: ' + toString(a) + ', ' + toString(b) + ', ' + toString(d));
					}

					area = THREE.GeometryUtils.triangleArea(b, c, d);

					if (area < 0.0001) {
						console.log('Zero area triangle (in quad): face ' + i + ' of ' + transform.name);
						console.log('Verts: ' + toString(b) + ', ' + toString(c) + ', ' + toString(d));
					}
				}
			}
		}

		var children = transform.children;

		for (var i = 0, il = children.length; i < il; ++i) {
			this.validateTriangles(children[i]);
		}
	};

	/*
	 * Determine if two vectors are equal.
	 * 
	 * @param {THREE.Vector3} vec1 the first vector
	 * @param {THREE.Vector3} vec2 the second vector
	 * @param {number} opt_precision optional precision float (default is 0)
	 * @return {boolean} true if the vectors are equal to the given precision, otherwise false
	 */
	hemi.utils.vector3Equals = function(vec1, vec2, opt_precision) {
		if (!opt_precision) {
			opt_precision = 0;
		}

		return Math.abs(vec1.x - vec2.x) <= opt_precision &&
			Math.abs(vec1.y - vec2.y) <= opt_precision &&
			Math.abs(vec1.z - vec2.z) <= opt_precision;
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
		transform.updateMatrixWorld(true);
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
		transform.updateMatrixWorld(true);
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
