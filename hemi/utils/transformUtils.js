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
		
		hemi.core.addToTransformTable(transform);
		return newTran;
	};
	
	/**
	 * Move all of the children and shapes off of the given foster Transform and
	 * back to the original parent Transform. Destroy the foster Transform
	 * 
	 * @param {o3d.Transform} transform the foster Transform previously created
	 * @param {o3d.Transform} opt_parent optional parent of the foster Transform
	 * @return {o3d.Transform} the original parent Transform
	 */
	hemi.utils.unfosterTransform = function(transform, opt_parent) {
		var children = transform.children,
			shapes = transform.shapes,
			tParent = opt_parent || hemi.core.getTransformParent(transform);
		
		hemi.core.removeFromTransformTable(transform);
		
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
		hemi.core.addToTransformTable(tParent);
		return tParent;
	};
	
	return hemi;
})(hemi || {});
