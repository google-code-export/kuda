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
	 * @class A NavigationToolbarView is the toolbar view for a Navigation
	 * tool.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {Object} config configuration options
	 */
	var NavigationToolbarView = function(config) {
		this.zoomInBtn = null;
		this.zoomOutBtn = null;
		config = hemi.utils.join({
			containerId: 'navigateToolbarView',
			zoomInButtonId: 'zoomInButtonId',
			zoomOutButtonId: 'zoomOutButtonId'
		}, config);
		
		hext.tools.ToolbarView.call(this, config);
	};

	NavigationToolbarView.prototype = new hext.tools.ToolbarView();
	NavigationToolbarView.prototype.constructor = NavigationToolbarView;
		
	/**
	 * Send a cleanup Message and remove all references in the
	 * NavigationToolbarView.
	 */
	NavigationToolbarView.prototype.cleanup = function() {
		hext.tools.ToolbarView.cleanup(this);
		
		if (this.zoomInBtn) {
			this.zoomInBtn.unbind();
			this.zoomInBtn = null;
		}
		if (this.zoomOutBtn) {
			this.zoomOutBtn.unbind();
			this.zoomOutBtn = null;
		}
	};
		
	/*
	 * Not currently supported.
	 */
	NavigationToolbarView.prototype.toOctane = function() {
		
    };
		
	/**
	 * Create the actual toolbar button elements for the
	 * NavigationToolbarView.
	 */
	NavigationToolbarView.prototype.layoutView = function() {
		this.zoomInBtn = jQuery('<button id="' + this.config.zoomInButtonId + '" title="Zoom In">Zoom In</button>');
		this.zoomOutBtn = jQuery('<button id="' + this.config.zoomOutButtonId + '" title="Zoom Out">Zoom Out</button>');
		this.container.append(this.zoomInBtn);
		this.container.append(this.zoomOutBtn);
	};
		
	/**
	 * Add or remove the clicked CSS class to the 'zoom in' button.
	 * 
	 * @param {boolean} clicked flag indicating if the
	 *     NavigationToolbarView was clicked
	 */
	NavigationToolbarView.prototype.setClickedState = function(clicked) {
		if (clicked) {
			this.zoomInBtn.addClass(this.config.clickClass);
		}
		else {
			this.zoomInBtn.removeClass(this.config.clickClass);
		}
	};

	hemi.makeCitizen(NavigationToolbarView, 'hext.tools.NavigationToolbarView', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
