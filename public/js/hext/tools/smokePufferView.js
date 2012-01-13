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
	 * @class A SmokePufferToolbarView is the toolbar view for a SmokePuffer.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {Object} config configuration options
	 */
	var SmokePufferToolbarView = function(config) {
        this.button = null;
        config = hemi.utils.join({
        	containerId: 'smokePufferToolbarView',
			buttonId: 'smokePufferButtonId'
        }, config);
        
        hext.tools.ToolbarView.call(this, config);
	};

	SmokePufferToolbarView.prototype = new hext.tools.ToolbarView();
	SmokePufferToolbarView.prototype.constructor = SmokePufferToolbarView;
		
	/**
	 * Send a cleanup Message and remove all references in the
	 * SmokePufferToolbarView.
	 */
	SmokePufferToolbarView.prototype.cleanup =function() {
		hext.tools.ToolbarView.cleanup.call();
		
		if (this.button) {
			this.button.unbind();
			this.button = null;
		}
	};
		
	/*
	 * Not currently supported.
	 */
	SmokePufferToolbarView.prototype.toOctane = function() {
		
    };
		
	/**
	 * Create the actual toolbar button element for the
	 * SmokePufferToolbarView.
	 */
    SmokePufferToolbarView.prototype.layoutView = function() {
        this.button = jQuery('<button id="' + this.config.buttonId + '" title="Smoke Puffer Tool">Smoke Puffer</button>');
		this.container.append(this.button);
	};

	hemi.makeCitizen(SmokePufferToolbarView, 'hext.tools.SmokePufferToolbarView', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
