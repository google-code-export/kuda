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

o3djs.require('hext.msg');
o3djs.require('hext.tools.baseController');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BlowerDoorController handles interactions between the
	 * BlowerDoor and its views.
	 * @extends hext.tools.BaseController
	 */
	hext.tools.BlowerDoorController = hext.tools.BaseController.extend({
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hext.tools.BlowerDoorController',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BlowerDoorController.
		 */
		cleanup: function() {
			this._super();
			jQuery('body').unbind('mouseup');
		},

		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},

		/**
		 * Connect the BlowerDoor data model to the knob HTML view so that they
		 * respond to each other.
		 * @see hext.tools.BaseController#setupView
		 */
		setupView: function() {
			this._super();
		
			this.model.subscribe(hext.msg.speed,
				this.view,
				'rotateKnob',
				[hemi.dispatch.MSG_ARG + 'data.speed']);
			
			var toolModel = this.model;
			var toolView = this.view;
			var lastX = 0;

			this.view.addLoadCallback(function() {
				toolView.knob.rotate({
					maxAngle: toolModel.max,
					minAngle: toolModel.min,
					bind: [{
						'mousedown': function(event) {
							lastX = event.pageX;
							toolView.canvasKnob = jQuery(this);
							jQuery('body').bind('mousemove', function(event) {
								var deltaX = (lastX - event.pageX) * -2;
								var newValue = toolModel.currentSpeed + deltaX;
								if (newValue >= 0 && newValue <= toolModel.max) {
									toolModel.setFanSpeed(newValue);
								}
								lastX = event.pageX;
							});
						}
					}]
				});
			});
			
			// Should this be added to the bind in the load callback above?
			jQuery('body').bind('mouseup', function(event) {
				jQuery(this).unbind('mousemove');
			});
		}
	});

	return hext;
})(hext || {});
