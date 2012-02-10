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
	 * @class A ToolbarView represents the functionality common to toolbar views
	 * for all tools.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {Object} config configuration options
	 */
	var ToolbarView = function(config) {
		this.config = hemi.utils.join({
			containerId: 'toolbarView',
			clickClass: 'clicked'
		}, config);
		
		/**
		 * The container for all HTML content.
		 * @type jQuery
		 */
		this.container = jQuery('<div id="' + this.config.containerId + '"></div>');
		
		this.layoutView();
	};
		
	/**
	 * Send a cleanup Message and remove all references in the ToolbarView.
	 */
	ToolbarView.prototype.cleanup = function() {
		this._super();
		this.config = null;
		this.container = null;
	};
		
	/*
	 * Not currently supported.
	 */
	ToolbarView.prototype.toOctane = function() {
		var octane = {
			wi: this.getId(),
			vt: this.type,
			ci: this.config.containerId
		};
		
		return octane;
	};
		
	/**
	 * Currently empty. Subclasses should override this to layout their
	 * components.
	 */
	ToolbarView.prototype.layoutView = function() {
		
	};
		
	/**
	 * Add or remove the clicked CSS class to the ToolbarView.
	 * 
	 * @param {boolean} clicked flag indicating if the ToolbarView was
	 *     clicked
	 */
	ToolbarView.prototype.setClickedState = function(clicked) {
		if (clicked) {
			this.container.addClass(this.config.clickClass);
		} else {
			this.container.removeClass(this.config.clickClass);
		}
	};

	hemi.makeCitizen(ToolbarView, 'hext.tools.ToolbarView', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
