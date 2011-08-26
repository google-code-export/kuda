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
	 * @class A ToolbarViewConfig contains configuration options for a
	 * ToolbarView.
	 */
	hext.tools.ToolbarViewConfig = function() {
		/**
		 * The id of the element containing the HTML content for the
		 * ToolbarView.
		 * @type string
		 * @default 'toolbarView'
		 */
		this.containerId = 'toolbarView';
		
		/**
		 * The CSS class to apply to the ToolbarView when it is clicked.
		 * @type string
		 * @default 'clicked'
		 */
		this.clickClass = 'clicked';
	};
	
	/**
	 * @class A ToolbarView represents the functionality common to toolbar views
	 * for all tools.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hext.tools.ToolbarViewConfig} config configuration options
	 */
	hext.tools.ToolbarView = function(config) {
		hemi.world.Citizen.call(this);
		this.config = hemi.utils.join(new hext.tools.ToolbarViewConfig(), config);
		
		/**
		 * The container for all HTML content.
		 * @type jQuery
		 */
		this.container = jQuery('<div id="' + this.config.containerId + '"></div>');
		
		this.layoutView();
	};
	
	hext.tools.ToolbarView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.ToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the ToolbarView.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.config = null;
			this.container = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			var octane = {
				wi: this.getId(),
				vt: this.type,
				ci: this.config.containerId
			};
			
			return octane;
		},
		
		/**
		 * Currently empty. Subclasses should override this to layout their
		 * components.
		 */
		layoutView: function() {
			
		},
		
		/**
		 * Add or remove the clicked CSS class to the ToolbarView.
		 * 
		 * @param {boolean} clicked flag indicating if the ToolbarView was
		 *     clicked
		 */
		setClickedState: function(clicked) {
			if (clicked) {
				this.container.addClass(this.config.clickClass);
			} else {
				this.container.removeClass(this.config.clickClass);
			}
		}
	};
	
	hext.tools.ToolbarView.inheritsFrom(hemi.world.Citizen);
	
	return hext;
})(hext || {});
