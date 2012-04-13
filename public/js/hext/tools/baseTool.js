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
	/**
	 * @namespace A module for tools that allow the user to interact with the
	 * World in a controlled way. Note that most of the tools module follows the
	 * MVC design pattern.
	 */
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BaseTool represents the functionality common to data models for
	 * all tools. It can be visible or not and enabled or not.
	 * @extends hemi.world.Citizen
	 */
	var BaseTool = function() {
		/**
		 * Flag indicating if the BaseTool is enabled.
		 * @type boolean
		 * @default false
		 */
		this.enabled = false;
		
		/**
		 * Flag indicating if the BaseTool is visible.
		 * @type boolean
		 * @default false
		 */
		this.visible = false;
	};
		
		
	/*
	 * Not currently supported.
	 */
	BaseTool.prototype.toOctane = function() {
		var octane = {
			wi: this.getId(),
			tt: this.type
		};
		
		return octane;
	};
		
	/**
	 * Set the enabled flag for the BaseTool and send a notification
	 * Message.
	 * 
	 * @param {boolean} enabled flag to indicate if the BaseTool is enabled
	 */
	BaseTool.prototype.setEnabled = function(enabled) {
		if (this.enabled != enabled) {
			this.enabled = enabled;
			
			this.send(hemi.msg.enable,
			{
				enabled: this.enabled
			});
		}
	};
		
	/**
	 * Set the visible flag for the BaseTool and send a notification
	 * Message.
	 * 
	 * @param {boolean} visible flag to indicate if the BaseTool is visible
	 */
	BaseTool.prototype.setVisible = function(visible) {
		if (this.visible != visible) {
			this.visible = visible;
			
			this.send(hemi.msg.visible,
				{
					visible: this.visible
				});
		}
	};

	hemi.makeCitizen(BaseTool, 'hext.tools.BaseTool', {
		msgs: [hemi.msg.enable, hemi.msg.visible],
		toOctane: []
	});
	
	return hext;
})(hext || {});
