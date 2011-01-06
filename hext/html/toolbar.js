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
	hext.html = hext.html || {};
	
	/* Id of the HTML container for the Toolbar */
	var containerId = 'hext-toolbar';
	/* jQuery object representing the HTML container for the Toolbar */
	var container = null;
	/* Array of ToolbarViews added to the Toolbar */
	var views = [];
	
	/**
	 * @namespace A set of functions for displaying ToolbarViews. In order for
	 * the Toolbar to be displayed, you need to have a div with the container id
	 * in your viewer page. The default container id that Toolbar searches for
	 * is 'hext-toolbar', but you may change the id if you wish.
	 */
	hext.html.toolbar = {
		/**
		 * Add the given ToolbarView to the Toolbar.
		 *
		 * @param {hext.tools.ToolbarView} toolbarView the ToolbarView to add
		 * @return {boolean} true if the ToolbarView was added
		 */
		addView: function(toolbarView) {
			var added = false;
			
			if (toolbarView instanceof hext.tools.ToolbarView) {
				container.append(toolbarView.container);
				views.push(toolbarView);
				added = true;
			}
			
			return added;
		},
		
		/**
		 * Set the loaded Hext Toolbar to be hidden.
		 */
		hide: function() {
			if (container != null) {
				container.hide();
			}
		},
		/**
		 * Remove the given ToolbarView from the Toolbar.
		 *
		 * @param {hext.tools.ToolbarView} toolbarView the ToolbarView to remove
		 * @return {boolean} true if the ToolbarView was removed
		 */
		removeView: function(toolbarView) {
			var removed = false;
			
			if (toolbarView instanceof hext.tools.ToolbarView) {
				var ndx = views.indexOf(toolbarView);
				
				if (ndx != -1) {
					var spliced = views.splice(ndx, 1);
					
					if (spliced.length === 1) {
						toolbarView.container.detach();
						removed = true;
					}
				}
			}
			
			return removed;
		},
		
		/**
		 * Search for the HTML element with the given id. If one is found, use
		 * it as the Toolbar. This will reinitialize the Toolbar if it was
		 * already created with a different id.
		 * 
		 * @param {string} id the id of the HTML element to act as the Toolbar
		 */
		setContainerId: function(id) {
			containerId = id;
			setupContainer();
		},
		
		/**
		 * Set the loaded Hext Toolbar to be visible.
		 */
		show: function() {
			if (container != null) {
				container.show();
			}
		}
	};
	
	/*
	 * Create the jQuery object for the HTML container that the Toolbar is
	 * contained within.
	 */
	var setupContainer = function() {
		container = jQuery('#' + containerId);
		
		if (container.size() == 0) {
			// There is no DIV on the page for the Toolbar
			container = null;
		}
	};
	
	/*
	 * Wait until the DOM is fully loaded before setting up the elements.
	 */
	jQuery(window).ready(function() {
		setupContainer();
	});
	
	return hext;
})(hext || {});
