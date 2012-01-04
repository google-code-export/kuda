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

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A ShapeView represents the functionality common to 3D shape views
	 * for all tools.
	 * @extends hemi.world.Citizen
	 */
	var ShapeView = function() {
		this._super();
		
        this.transforms = [];
	};
		
	/**
	 * Send a cleanup Message and remove all references in the ShapeView.
	 */
	ShapeView.prototype.cleanup = function() {
		this._super();
		this.transforms = [];
	};
		
	/*
	 * Not currently supported.
	 */
	ShapeView.prototype.toOctane = function() {
		var octane = {
			
		};
		
		for (var ndx = 0, len = this.transforms.length; ndx < len; ndx++) {
			octane.ts.push(this.transforms[ndx]);
		}
		
		return octane;
	};
		
	/**
	 * Add the given Transform to the ShapeView's list of Transforms.
	 * 
	 * @param {THREE.Object3D} transform the Transform to add
	 */
	ShapeView.prototype.addTransform = function(transform) {
		this.transforms.push(transform);
	};
		
	/**
	 * Remove the given Transform from the ShapeView's list of Transforms.
	 * 
	 * @param {THREE.Object3D} transform the Transform to remove
	 * @return {boolean} true if the Transform was removed
	 */
	ShapeView.prototype.removeTransform = function(transform) {
        var ndx = this.transforms.indexOf(transform);
		var removed = false;
        
        if (ndx != -1) {
            this.transforms.splice(ndx, 1);
			removed = true;
        }
		
		return removed;
	};
		
	/**
	 * Set the visibility (and pickability) for all of the ShapeView's
	 * Transforms.
	 * 
	 * @param {boolean} visible flag indicating if the Transforms should be
	 *     visible
	 */
	ShapeView.prototype.setVisible = function(visible) {
		for (var ndx = 0, len = this.transforms.length; ndx < len; ndx++) {
			var transform = this.transforms[ndx];
			transform.visible = visible;
			transform.pickable = visible;
		}
	};

	hemi.makeCitizen(ShapeView, 'hext.tools.ShapeView', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
