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
	 * @class A NavigationController handles interactions between the
	 * Navigation tool and its views.
	 * @extends hext.tools.BaseController
	 */
	var NavigationController = function() {
	};

	NavigationController.prototype = new hext.tools.BaseController();
	NavigationController.prototype.constructor = NavigationController;
		
	/*
	 * Not currently supported.
	 */
	NavigationController.prototype.toOctane = function() {
		
	};
		
	/**
	 * Connect the Navigation data model to the toolbar view so that they
	 * respond to each other.
	 * @see hext.tools.BaseController#setupToolbar
	 */
	NavigationController.prototype.setupToolbar = function() {
		var toolModel = this.model;
		var toolbarView = this.toolbarView;
		var that = this;
		
		toolbarView.zoomInBtn.bind('click', function(evt) {
			// change the cursor
			// change the mode by setting the pickgrabber
			if (!toolModel.picking) {
				document.getElementById('kuda').style.cursor = 'pointer';
				hemi.setPickGrabber(that);
				toolModel.setPicking(true);
				toolbarView.setClickedState(true);
			}
			else {
				that.cleanupAfterPick();
			}
		});
		
		toolbarView.zoomOutBtn.bind('click', function(evt) {
			toolModel.zoomOut();
			toolbarView.zoomInBtn.removeAttr('disabled');
		});
	};
		
	/**
	 * Check the shape from the pick to see if there is an associated
	 * Viewpoint to zoom to.
	 * 
	 * @param {picking.PickInfo} pickInfo pick event information
	 */
	NavigationController.prototype.onPick = function(pickInfo) {
		var shapeName = pickInfo.pickedMesh.name;
		
		if (this.model.zoomIn(shapeName)) {
			this.cleanupAfterPick();
            this.toolbarView.zoomInBtn.attr('disabled', 'disabled');
		}
	};
	
	/**
	 * Clean up pick Message interception and view styling.
	 */
	NavigationController.prototype.cleanupAfterPick = function() {
		document.getElementById('kuda').style.cursor = 'default';
		hemi.world.removePickGrabber();
		this.model.setPicking(false);
		this.toolbarView.setClickedState(false);
	};

	hemi.makeCitizen(NavigationController, 'hext.tools.NavigationController', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
