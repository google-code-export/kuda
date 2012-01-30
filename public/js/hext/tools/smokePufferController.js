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
	 * @class A SmokePufferController handles interactions between the
	 * SmokePuffer and its views.
	 * @extends hext.tools.BaseController
	 */
	var SmokePufferController = function(client) {
		this.client = client;
	};

	SmokePufferController.prototype = new hext.tools.BaseController();
	SmokePufferController.prototype.constructor = SmokePufferController;
		
	/*
	 * Not currently supported.
	 */
	SmokePufferController.prototype.toOctane = function() {
	};

	/**
	 * Connect the SmokePuffer data model to the toolbar view so that they
	 * respond to each other.
	 * @see hext.tools.BaseController#setupToolbar
	 */
	SmokePufferController.prototype.setupToolbar = function() {
		var toolModel = this.model;
		var toolbarView = this.toolbarView;
		var that = this;

		this.toolbarView.button.bind('click', function(evt) {
			var enabled = !toolModel.enabled;
			toolModel.setEnabled(enabled);
			
			if (enabled) {
				that.client.picker.setPickGrabber(that);
			} else {
			    that.client.picker.removePickGrabber();
			}

			toolbarView.setClickedState(enabled);
		});
	};

	/**
	 * Check the shape from the pick to see if there is an associated
	 * smoke puff particle Effect. If so, trigger it. Otherwise, generate a
	 * 'default' puff at the picked world position.
	 * 
	 * @param {PickInfo} pickInfo pick event information
	 */
    SmokePufferController.prototype.onPick = function(pickInfo) {
		if (pickInfo && this.model.enabled) {
			var puff = this.model.pickNames.get(pickInfo.pickedMesh.name);

			if (puff == null) {
				var wi = pickInfo.worldIntersectionPosition;
				var ci = this.client.camera.getEye();
				puff = this.model.defaultPuff;
				var puffPos = hemi.utils.lerp([ci.x, ci.y, ci.z], [wi.x, wi.y, wi.z], 0.9);
				puff.params.position = puffPos;
			}

			puff.trigger();
		}
	};

	hemi.makeCitizen(SmokePufferController, 'hext.tools.SmokePufferController', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
