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
	 * @class An HtmlView represents the functionality common to HTML views for
	 * all tools.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {Object} config configuration options
	 */
	var HtmlView = function(config) {
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
		
		this.config = hemi.utils.join({
			contentFileName: ''
		}, config);
		this.callbacks = [];
	};
		
	/**
	 * Send a cleanup Message and remove all references in the HtmlView.
	 */
	HtmlView.prototype.cleanup = function() {
		this.config = null;
		this.callbacks = [];
		
		if (this.container) {
			this.container.unbind();
			this.container = null;
		}
	};
		
	/*
	 * Not currently supported.
	 */
	HtmlView.prototype.toOctane = function() {
		var octane = {
			
		};
		
		return octane;
	};
		
	/**
	 * Add the given callback function to the list of functions to execute
	 * once the HTML content has been loaded.
	 * 
	 * @param {function(): void} callback callback function to execute
	 */
	HtmlView.prototype.addLoadCallback = function(callback) {
		this.callbacks.push(callback);
	};
		
	/**
	 * Load the HTML content from the file specified by the config.
	 */
	HtmlView.prototype.loadConfig = function() {
		var that = this;
		
		if (this.config.contentFileName != '') {
			hemi.loadHtml(
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
	};
		
	/**
	 * Remove the current HTML content from the HtmlView.
	 * 
	 * @return {jQuery} the old HTML content
	 */
	HtmlView.prototype.removeContent = function() {
		var oldContent = this.container;
		this.container = null;
		oldContent.remove();
		return oldContent;
	};
		
	/**
	 * Get the HTML element in the HtmlView's container with the given id.
	 * 
	 * @param {string} elementId id of the element to find
	 * @return {jQuery} the found HTML element or null
	 */
	HtmlView.prototype.getElement = function(elementId) {
		var element = null;
		
		if (this.container) {
			element = this.container.find('#' + elementId);
		}
		
		return element;
	};
		
	/**
	 * Set the visible property for the HtmlView and hide/show its HTML
	 * content.
	 * 
	 * @param {boolean} visible flag indicating if the HtmlView should be
	 *     visible
	 */
	HtmlView.prototype.setVisible = function(visible) {
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
	};

	hemi.makeCitizen(HtmlView, 'hext.tools.HtmlView', {
		msgs: [],
		toOctane: []
	});
	
	return hext;
})(hext || {});
