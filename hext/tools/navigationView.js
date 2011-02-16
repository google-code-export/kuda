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

o3djs.require('hext.tools.toolbarView');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A NavigationToolbarViewConfig contains configuration options for
	 * a NavigationToolbarView.
	 * @extends hext.tools.ToolbarViewConfig
	 */
	hext.tools.NavigationToolbarViewConfig = function() {
		hext.tools.ToolbarViewConfig.call(this);
		
		/**
		 * @see hext.tools.ToolbarViewConfig#containerId
		 * @default 'navigateToolbarView'
		 */
		this.containerId = 'navigateToolbarView';
		
		/**
		 * The id for the HTML element containing the Navigation 'zoom in'
		 * toolbar button.
		 * @type string
		 * @default 'zoomInButtonId'
		 */
		this.zoomInButtonId = 'zoomInButtonId';
		
		/**
		 * The id for the HTML element containing the Navigation 'zoom out'
		 * toolbar button.
		 * @type string
		 * @default 'zoomOutButtonId'
		 */
		this.zoomOutButtonId = 'zoomOutButtonId';
	};
	
	/**
	 * @class A NavigationToolbarView is the toolbar view for a Navigation
	 * tool.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {hext.tools.NavigationToolbarViewConfig} config configuration
	 *     options
	 */
	hext.tools.NavigationToolbarView = function(config) {
		this.zoomInBtn = null;
		this.zoomOutBtn = null;
		config = jQuery.extend(new hext.tools.NavigationToolbarViewConfig(), config);
		hext.tools.ToolbarView.call(this, config);
	};
	
	hext.tools.NavigationToolbarView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.NavigationToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * NavigationToolbarView.
		 */
		cleanup: function() {
			hext.tools.ToolbarView.prototype.cleanup.call(this);
			
			if (this.zoomInBtn) {
				this.zoomInBtn.unbind();
				this.zoomInBtn = null;
			}
			if (this.zoomOutBtn) {
				this.zoomOutBtn.unbind();
				this.zoomOutBtn = null;
			}
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
	    },
		
    	/**
		 * Create the actual toolbar button elements for the
		 * NavigationToolbarView.
		 */
		layoutView: function() {
			this.zoomInBtn = jQuery('<button id="' + this.config.zoomInButtonId + '" title="Zoom In"><span>Zoom In</span></button>');
			this.zoomOutBtn = jQuery('<button id="' + this.config.zoomOutButtonId + '" title="Zoom Out"><span>Zoom Out</span></button>');
			this.container.append(this.zoomInBtn);
			this.container.append(this.zoomOutBtn);
		},
		
		/**
		 * Add or remove the clicked CSS class to the 'zoom in' button.
		 * 
		 * @param {boolean} clicked flag indicating if the
		 *     NavigationToolbarView was clicked
		 */
		setClickedState: function(clicked) {
			if (clicked) {
				this.zoomInBtn.addClass(this.config.clickClass);
			}
			else {
				this.zoomInBtn.removeClass(this.config.clickClass);
			}
		}
	};
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.NavigationToolbarViewConfig.inheritsFrom(hext.tools.ToolbarViewConfig);
	hext.tools.NavigationToolbarView.inheritsFrom(hext.tools.ToolbarView);
});