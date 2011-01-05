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
	 * @class A SmokePufferToolbarViewConfig contains configuration options
	 * for a SmokePufferToolbarView.
	 * @extends hext.tools.ToolbarViewConfig
	 */
	hext.tools.SmokePufferToolbarViewConfig = function() {
        hext.tools.ToolbarViewConfig.call(this);
		
		/**
		 * @see hext.tools.ToolbarViewConfig#containerId
		 * @default 'smokePufferToolbarView'
		 */
		this.containerId = 'smokePufferToolbarView';
		
		/**
		 * The id for the HTML element containing the SmokePuffer toolbar
		 * button.
		 * @type string
		 * @default 'smokePufferButtonId'
		 */
		this.buttonId = 'smokePufferButtonId';
    };
	
	/**
	 * @class A SmokePufferToolbarView is the toolbar view for a SmokePuffer.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {hext.tools.SmokePufferToolbarViewConfig} config configuration
	 *     options
	 */
	hext.tools.SmokePufferToolbarView = function(config) {	
        this.button = null;	
        config = jQuery.extend(new hext.tools.SmokePufferToolbarViewConfig(), config);
        hext.tools.ToolbarView.call(this, config);
	};
	
    hext.tools.SmokePufferToolbarView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.SmokePufferToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * SmokePufferToolbarView.
		 */
		cleanup: function() {
			hext.tools.ToolbarView.prototype.cleanup.call(this);
			
			if (this.button) {
				this.button.unbind();
				this.button = null;
			}
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
	    },
		
    	/**
		 * Create the actual toolbar button element for the
		 * SmokePufferToolbarView.
		 */
	    layoutView: function() {
	        this.button = jQuery('<button id="' + this.config.buttonId + '" title="Smoke Puffer Tool">Smoke Puffer</button>');
			this.container.append(this.button);
		}
    };
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
    hext.tools.SmokePufferToolbarViewConfig.inheritsFrom(hext.tools.ToolbarViewConfig);
    hext.tools.SmokePufferToolbarView.inheritsFrom(hext.tools.ToolbarView);
});