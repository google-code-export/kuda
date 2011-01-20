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

o3djs.require('hemi.core');
o3djs.require('hemi.view');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for picking shapes in a 3D space from a mouse click.
	 */
	hemi.picking = hemi.picking || {};
	
	/**
	 * The name of the root Transform that all picking is performed on. If a
	 * Transform should be pickable, it must be a child or grandchild of the
	 * pickRoot.
	 * @type string
	 * @constant
	 */
	hemi.picking.PICK_ROOT = 'PickRoot';
	
	/**
	 * Override O3D's createTransformInfo function so that it will construct
	 * our extended HemiTransformInfo instead.
	 * 
	 * @param {o3d.Transform} transform Transform to keep info about.
	 * @param {o3djs.picking.TransformInfo} parent Parent transform of the
	 *     transform. Can be null.
	 * @return {o3djs.picking.TransformInfo} The new TransformInfo.
	 */
	o3djs.picking.createTransformInfo = function(transform, parent) {
		return new hemi.picking.HemiTransformInfo(transform, parent);
	};
	
	/**
	 * Calculate the pick information to describe what shape was clicked in the
	 * 3D scene.
	 *  
	 * @param {o3d.Event} mouseEvent the "mouse down" event to pick with
	 * @return {o3djs.picking.PickInfo} information about the pick that was
	 *     calculated
	 */
	hemi.picking.getPickInfo = function(mouseEvent) {
		var pickInfo;
		
		if (hemi.picking.treeInfo) {
			var worldRay = hemi.core.picking.clientPositionToWorldRay(
				mouseEvent.x,
				mouseEvent.y,
				hemi.view.viewInfo.drawContext,
				hemi.core.client.width,
				hemi.core.client.height);
			
			hemi.picking.treeInfo.update();
			pickInfo = hemi.picking.treeInfo.pick(worldRay);
		}
		
		return pickInfo;
	};
	
	/**
	 * Find the HemiTransformInfo for the given Transform and set its pickable
	 * property.
	 * 
	 * @param {o3d.Transform} transform the Transform to set pickable for
	 * @param {boolean} pickable true to allow picks
	 * @param {boolean} recurse true to apply the change to any child
	 *     Transforms as well
	 */
	hemi.picking.setPickable = function(transform, pickable, recurse) {
		var info = this.transformInfoTable.get(transform.clientId);
		
		if (info) {
			info.setPickable(pickable, recurse);
		}
	};
	
	/**
	 * Set up the pickRoot, the transform root that all pickable Transforms
	 * need to be children of.
	 */
	hemi.picking.init = function() {
		this.transformInfoTable = new Hashtable();
		
		// A transform parent to hold pickable transform roots
		this.pickRoot = hemi.core.mainPack.createObject('Transform');
		this.pickRoot.name = hemi.picking.PICK_ROOT;
		this.pickRoot.parent = hemi.core.client.root;
		
		this.pickManager = hemi.core.picking.createPickManager(this.pickRoot);
		this.treeInfo = this.pickManager.rootTransformInfo;
	};
	
	/**
	 * @class A HemiTransformInfo extends O3D's TransformInfo to allow the user
	 * to specify if the referenced Transform should be pickable or not.
	 * @extends o3djs.picking.TransformInfo
	 * 
	 * @param {o3d.Transform} transform Transform to keep info about
	 * @param {o3djs.picking.TransformInfo} parent Parent transformInfo of the
	 *     transform. Can be null.
	 */
	hemi.picking.HemiTransformInfo = function(transform, parent) {		
		o3djs.picking.TransformInfo.call(this, transform, hemi.picking.pickManager);
		
		this.pickable = true;
		this.recorded = false;
	};
	
	hemi.picking.HemiTransformInfo.prototype = {
		/**
		 * Set the pickable property for the HemiTransformInfo.
		 * 
		 * @param {boolean} pickable true to allow picks
		 * @param {boolean} recurse true to apply the change to any child
		 *     Transforms as well
		 */
		setPickable: function(pickable, recurse) {
			this.pickable = pickable;
			
			if (recurse) {
				for (var key in this.childTransformInfos) {
					this.childTransformInfos[key].setPickable(pickable, recurse);
				}
			}
		},
		
		/**
		 * Override TransformInfo's pick function so that we can temporarily
		 * hide the TransformInfo's shapes if it is not pickable.
		 * 
		 * @param {o3djs.picking.Ray} worldRay A ray in world space to pick
		 *     against
		 * @return {o3djs.picking.PickInfo} Information about the picking.
		 *     null if the ray did not intersect any triangles.
		 */
		pick: function(worldRay) {
			var hiddenShapeInfos;
			
			if (!this.pickable) {
				hiddenShapeInfos = this.shapeInfos;
				this.shapeInfos = {};
			}
			
			var pickInfo = o3djs.picking.TransformInfo.prototype.pick.call(this, worldRay);
			
			if (!this.pickable) {
				this.shapeInfos = hiddenShapeInfos;
			}
			
			return pickInfo;
		},
		
		/**
		 * Override TransformInfo's update function so that we can also update
		 * our lookup table of HemiTransformInfos.
		 */
		update: function() {
			o3djs.picking.TransformInfo.prototype.update.call(this);
			
			if (!this.recorded) {
				hemi.picking.transformInfoTable.put(this.transform.clientId, this);
				this.recorded = true;
			}
		}
	};
	
	hemi.picking.HemiTransformInfo.inheritsFrom(o3djs.picking.TransformInfo);
	
	return hemi;
})(hemi || {});
