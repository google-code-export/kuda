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
		};
		
		newTran.parent = transform;
		
		while (shapes.length > 0) {
			var shape = shapes[0];
			newTran.addShape(shape);
			transform.removeShape(shape);
		}
		
		return newTran;
	};
	
	/**
	 * Interprets a point in world space into local space.
	 */
	hemi.utils.pointAsLocal = function(transform, point) {
		var inv = THREE.Matrix4.makeInvert(transform.matrixWorld);
	    return inv.multiplyVector3(point.clone());
	};
	
	/**
	 * Interprets a point in local space into world space.
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		return transform.matrixWorld.multiplyVector3(point.clone());
	};
	
	/**
	 * Point the y axis of the given matrix toward the given point.
	 *
	 * @param {THREE.Matrix4} matrix the matrix to rotate
	 * @param {number[]} eye XYZ point from which to look (may be the origin)
	 * @param {number[]} target XYZ point at which to aim the y axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointYAt = function(matrix, eye, target) {
		var dx = target[0] - eye[0],
			dy = target[1] - eye[1],
			dz = target[2] - eye[2],
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);
		
//		tran.rotation.y += rotY;
//		tran.rotation.x += rotX;
//		tran.updateMatrix();
		matrix.rotateX(rotX);
		matrix.rotateY(rotY);
		
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
		};

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
	 * @param {number[]} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {o3d.Transform} transform the transform to rotate
	 */
	hemi.utils.worldRotate = function(axis, angle, transform) {
		var m4 = hemi.core.math.matrix4,
			iW = m4.inverse(transform.getUpdatedWorldMatrix()),
			lA = m4.transformDirection(iW, axis);
		transform.axisRotate(lA, angle);
	};
	
	/**
	 * Scale the transform by the given scale amounts in world space.
	 *
	 * @param {number[]} scale scale factors defined as an XYZ vector
	 * @param {o3d.Transform} transform the transform to scale
	 */
	hemi.utils.worldScale = function(scale, transform) {
		var m4 = hemi.core.math.matrix4,
			newMatrix = m4.mul(
				m4.mul(
					m4.mul(
						transform.getUpdatedWorldMatrix(),
						m4.scaling(scale)),
					m4.inverse(transform.getUpdatedWorldMatrix())),
				transform.localMatrix);
		transform.localMatrix = newMatrix;
	};
	
	/**
	 * Translate the transform by the given world space vector.
	 *
	 * @param {number[]} v XYZ vector to translate by
	 * @param {o3d.Transform} transform the transform to translate
	 */
	hemi.utils.worldTranslate = function(v, transform) {
		var m4 = hemi.core.math.matrix4,
			iW = m4.inverse(transform.getUpdatedWorldMatrix()),
			lV = m4.transformDirection(iW, v);
		transform.translate(lV);
	};

    hemi.utils.identity = function(object3d) {
        object3d.position = new THREE.Vector3(0, 0, 0);
        object3d.rotation = new THREE.Vector3(0, 0, 0);
        object3d.scale = new THREE.Vector3(1, 1, 1);
        object3d.updateMatrix();
    }
	
	return hemi;
})(hemi || {});
