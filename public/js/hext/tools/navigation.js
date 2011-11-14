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

o3djs.require('hext.tools.baseTool');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A Navigation tool is the data model representation of a Camera
	 * control tool.
	 * @extends hext.tools.BaseTool
	 * 
	 * @param {hemi.view.Camera} camera the Camera to control
	 * @param {hemi.view.Viewpoint} originalViewpoint the default Viewpoint to
	 *     move the Camera to when zooming out
	 */
	hext.tools.Navigation = hext.tools.BaseTool.extend({
		init: function(camera, originalViewpoint) {
			this._super();
			
			/**
			 * The Camera to control.
			 * @type hemi.view.Camera
			 */
			this.camera = camera;
			
			/**
			 * The default Viewpoint to move the Camera to when zooming out.
			 * @type hemi.view.Viewpoint
			 */
			this.originalView = originalViewpoint;
			
			this.picking = false;
			this.areas = new Hashtable();
			this.zoomSelectTransforms = [];
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.Navigation',
		
		/**
		 * Send a cleanup Message and remove all references in the Navigation.
		 */
		cleanup: function() {
			this._super();
			this.camera = null;
			this.originalView = null;
			this.areas.clear();
			this.areas = null;
			this.zoomSelectTransforms = [];
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},
		
		/**
		 * Set the picking flag for the Navigation tool. This determines if the
		 * Navigation tool is enabled to move the Camera or not.
		 * 
		 * @param {boolean} pick flag indicating if picking should be set
		 */
		setPicking: function(pick) {
			this.picking = pick;
			
			for (var ndx = 0, len = this.zoomSelectTransforms.length; ndx < len; ndx++) {
				hemi.picking.setPickable(this.zoomSelectTransforms[ndx], pick, true);
			}
		},
		
		/**
		 * Add the given Transform to the list of selectable Transforms which
		 * direct the Camera to a Viewpoint.
		 * 
		 * @param {o3d.Transform} transform the Transform to add
		 */
		addZoomSelectTransform: function(transform) {
			this.zoomSelectTransforms.push(transform);
		},
		
		/**
		 * Move the Camera back to the default Viewpoint for the Navigation
		 * tool.
		 */
		zoomOut: function() {
			this.camera.moveToView(this.originalView);
		},
		
		/**
		 * Move the Camera to the Viewpoint associated with the given area
		 * name.
		 * 
		 * @param {string} areaName the name of the area
		 * @return {boolean} true if the Camera was moved to a Viewpoint
		 */
		zoomIn: function(areaName) {
			var viewpoint = this.areas.get(areaName);
			var zoomed = false;
			
			if (viewpoint) {
				this.camera.moveToView(viewpoint);
				zoomed = true;
			}
			
			return zoomed;
		},
		
		/**
		 * Associate the given Viewpoint with the given area name.
		 * 
		 * @param {string} areaName the name of the area
		 * @param {hemi.view.Viewpoint} viewpoint the Viewpoint to associate
		 */
		addArea: function(areaName, viewpoint) {
			this.areas.put(areaName, viewpoint);
		}
	});
	
	return hext;
})(hext || {});
