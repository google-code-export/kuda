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
	 * @class A SmokePufferToolbarView is the toolbar view for a SmokePuffer.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {Object} config configuration options
	 */
	hext.tools.SmokePufferToolbarView = hext.tools.ToolbarView.extend({
		init: function(config) {
	        this.button = null;
	        config = hemi.utils.join({
	        	containerId: 'smokePufferToolbarView',
				buttonId: 'smokePufferButtonId'
	        }, config);
	        
	        this._super(config);
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.SmokePufferToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * SmokePufferToolbarView.
		 */
		cleanup: function() {
			this._super();
			
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
    });
	
	return hext;
})(hext || {});
