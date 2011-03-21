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

o3djs.require('hemi.loader');
o3djs.require('hemi.world');

var hext = (function(hext) {

	hext.tools = hext.tools || {};
	
	/**
	 * @class An HtmlViewConfig contains configuration options for an HtmlView.
	 */
	hext.tools.HtmlViewConfig = function() {
		/**
		 * The name of the HTML file with content for the HtmlView.
		 * @type string
		 */
		this.contentFileName = '';
	};
	
	/**
	 * @class An HtmlView represents the functionality common to HTML views for
	 * all tools.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hext.tools.HtmlViewConfig} config configuration options
	 */
	hext.tools.HtmlView = function(config) {
		hemi.world.Citizen.call(this);
		
		/**
		 * The container for all HTML content.
		 * @type jQuery
		 */
        this.container = jQuery('<div></div>');
		
		/**
		 * Flag indicating if the HtmlView is visible.
		 * @type boolean
		 * @default false
		 */
		this.visible = false;
		
		this.config = hemi.utils.join(new hext.tools.HtmlViewConfig(), config);
		this.callbacks = [];
	};
	
	hext.tools.HtmlView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.HtmlView',
		
		/**
		 * Send a cleanup Message and remove all references in the HtmlView.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.config = null;
			this.callbacks = [];
			
			if (this.container) {
				this.container.unbind();
				this.container = null;
			}
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			var octane = {
				
			};
			
			return octane;
		},
		
		/**
		 * Add the given callback function to the list of functions to execute
		 * once the HTML content has been loaded.
		 * 
		 * @param {function(): void} callback callback function to execute
		 */
		addLoadCallback: function(callback) {
			this.callbacks.push(callback);
		},
		
		/**
		 * Load the HTML content from the file specified by the HtmlViewConfig.
		 */
		loadConfig: function() {
			var that = this;
			
			if (this.config.contentFileName != '') {
				hemi.loader.loadHtml(
					this.config.contentFileName,
					function(data) {
						that.container.html(data);
						
						if (!that.visible) {
							that.container.hide();
						}
						
						for (var ndx = 0, len = that.callbacks.length; ndx < len; ndx++) {
			                that.callbacks[ndx]();
			            }
					});
			}
		},
		
		/**
		 * Remove the current HTML content from the HtmlView.
		 * 
		 * @return {jQuery} the old HTML content
		 */
		removeContent: function() {
			var oldContent = this.container;
			this.container = null;
			oldContent.remove();
			return oldContent;
		},
		
		/**
		 * Get the HTML element in the HtmlView's container with the given id.
		 * 
		 * @param {string} elementId id of the element to find
		 * @return {jQuery} the found HTML element or null
		 */
		getElement: function(elementId) {
			var element = null;
			
			if (this.container) {
				element = this.container.find('#' + elementId);
			}
			
			return element;
		},
		
		/**
		 * Set the visible property for the HtmlView and hide/show its HTML
		 * content.
		 * 
		 * @param {boolean} visible flag indicating if the HtmlView should be
		 *     visible
		 */
		setVisible: function(visible) {
			if (this.visible != visible) {
				this.visible = visible;
				
				if (this.container) {
					if (visible) {
						this.container.show();
					} else {
	                    this.container.hide();
					}
				}
			}
		}
	};
	
	hext.tools.HtmlView.inheritsFrom(hemi.world.Citizen);
	
	return hext;
})(hext || {});
