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
	hemi.utils.pointAsLocal = function(transform,point) {
		var m4 = hemi.core.math.matrix4;
		var W = m4.inverse(transform.getUpdatedWorldMatrix());
		return m4.transformPoint(W,point);
	};
	
	/**
	 * Interprets a point in local space into world space.
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		var m4 = hemi.core.math.matrix4;
		return m4.transformPoint(transform.getUpdatedWorldMatrix(),point);
	};
	
	/**
	 * Point the y axis of the given transform/matrix toward the given point.
	 *
	 * @param {o3d.Transform|number[4][4]} tran the transform/matrix to rotate
	 * @param {number[]} eye XYZ point from which to look (may be the origin)
	 * @param {number[]} target XYZ point at which to aim the y axis
	 * @return {o3d.Transform|number[4][4]} the rotated transform/matrix
	 */
	hemi.utils.pointYAt = function(tran, eye, target) {
		var dx = target[0] - eye[0],
			dy = target[1] - eye[1],
			dz = target[2] - eye[2],
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);
		
		if (tran.rotateY) {
			tran.rotateY(rotY);
			tran.rotateX(rotX);
		} else {
			hemi.core.math.matrix4.rotateY(tran, rotY);
			hemi.core.math.matrix4.rotateX(tran, rotX);
		}
		
		return tran;
	};
	
	/**
	 * Point the z axis of the given transform/matrix toward the given point.
	 *
	 * @param {o3d.Transform|number[4][4]} tran the transform/matrix to rotate
	 * @param {number[]} eye XYZ point from which to look (may be the origin)
	 * @param {number[]} target XYZ point at which to aim the z axis
	 * @return {o3d.Transform|number[4][4]} the rotated transform/matrix
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = hemi.core.math.subVector(target, eye),
			rotY = Math.atan2(delta[0], delta[2]),
			rotX = -Math.asin(delta[1] / hemi.core.math.length(delta));
		
		if (tran.rotateY) {
			tran.rotateY(rotY);
			tran.rotateX(rotX);
		} else {
			hemi.core.math.matrix4.rotateY(tran, rotY);
			hemi.core.math.matrix4.rotateX(tran, rotX);
		}
		
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
	
	return hemi;
})(hemi || {});
