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
		
		for (var i = 0, il = children.length; i < il; i++) {
			children[i].parent = newTran;
		};
		
		newTran.parent = transform;
		
		for (var i = 0, il = shapes.length; i < il; i++) {
			var shape = shapes[i];
			newTran.addShape(shape);
			transform.removeShape(shape);
		}
		
		return newTran;
	};
	
	/**
	 * Point the y-up axis of the given transform/matrix toward the given point.
	 *
	 * @param {o3d.Transform} tran the transform (or matrix) to rotate
	 * @param {number[]} mp XYZ point from which to look (may be the origin)
	 * @param {number[]} p0 XYZ point at which to aim the y axis
	 * @return {o3d.Transform} the rotated transform
	 */
	hemi.utils.pointYAt = function(tran, mp, p0) {
		var dx = p0[0] - mp[0],
			dy = p0[1] - mp[1],
			dz = p0[2] - mp[2],
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
		
		for (var i = 0, il = children.length; i < il; i++) {
			children[i].parent = tParent;
		};
	
		for (var i = 0, il = shapes.length; i < il; i++) {
			var shape = shapes[i];
			tParent.addShape(shape);
			transform.removeShape(shape);
		}
		
		transform.parent = null;
		hemi.core.mainPack.removeObject(transform);
		return tParent;
	};
	
	return hemi;
})(hemi || {});
