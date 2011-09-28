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

/**
 * @namespace Hext (short for Hemi Extensions) is a library of extensions to the
 * Hemi engine developed by the Kuda team.
 */
var hext = (function(hext) {
	hext.html = hext.html || {};
	
	/* Id of the HTML container for the Reset button */
	var containerId = 'hext-reset';
	/* Id of the HTML Reset button */
	var buttonId = 'hext-reset-button';
	/* jQuery object representing the HTML container for the Reset button */
	var container = null;
	/* jQuery object representing the HTML Reset button */
    var button = null;
	/* A function that uses the Octane loader to perform a reset */
	var octaneReset = null;
	/* Array of callback functions to execute on reset */
	var callbacks = [];
	
	/**
	 * @namespace A set of functions for setting up Reset behavior and
	 * displaying a button that allows the user to reset the World. In order for
	 * the Reset button to be displayed, you need to have a div with the
	 * container id in your viewer page. The default container id that Reset
	 * searches for is 'hext-reset', but you may change the id if you wish.
	 */
	hext.html.reset = {
		/**
		 * Display the Reset button in the Reset container.
		 */
		show: function() {
			if (button == null) {
				setupButton();
			}
			
			button.show();
		},
		
		/**
		 * Hide the Reset button in the Reset container.
		 */
		hide: function() {
			if (button == null) {
				setupButton();
			}
			
			button.hide();
		},
		
		/**
		 * Search for the HTML element with the given id. If one is found, use
		 * it as the Reset container. This will reinitialize the Reset container
		 * if it was already created with a different id.
		 * 
		 * @param {string} id the id of the HTML element to act as a container
		 *     for the Reset button
		 */
		setContainerId: function(id) {
			var showButton = false;
			
			if (button != null) {
				showButton = button.is(':visible');
			}
			
			containerId = id;
			setupContainer();
			
			if (button != null) {
				button.unbind("click");
				setupButton();
				
				if (showButton) {
					button.show();
				}
			}
		},
		
		/**
		 * Set the id of the Reset button. This can be useful for ensuring your
		 * own custom CSS is applied to the Reset button.
		 * 
		 * @param {string} id the new id for the Reset button
		 */
		setButtonId: function(id) {
			buttonId = id;
			
			if (button != null) {
				button.attr("id", buttonId);
			}
		},
		
		/**
		 * Create a reset callback function that will use the Octane loader to
		 * reset the World. This could be considered a "hard reset". This
		 * function will execute along with any other registered callbacks when
		 * the Reset button is clicked.
		 * 
		 * @param {string} filePath the path to the octane file which should be
		 *     loaded
		 */
		useOctaneReset: function(fileName) {
			octaneReset = function() {
				hemi.loader.loadOctane(fileName);
			};
		},
		
		/**
		 * Add the given function to the list of callback functions to execute
		 * when the Reset button is clicked.
		 *  
		 * @param {function(): void} callback the function to add
		 */
		addCallback: function(callback) {
			callbacks.push(callback);
		},
		
		/**
		 * Remove the given function from the list of callback functions to
		 * execute when the Reset button is clicked.
		 *  
		 * @param {function(): void} callback the function to remove
		 * @return {function(): void} the removed function or null
		 */
		removeCallback: function(callback) {
	    	var found = null;
			var ndx = callbacks.indexOf(callback);
			
			if (ndx != -1) {
				var spliced = callbacks.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		}
	};
	
	/*
	 * The actual reset function that is called when the Reset button is
	 * clicked. Execute all callback functions and the Octane loader reset
	 * function (if it was set up).
	 */
	var executeReset = function() {
		for (var ndx = 0, len = callbacks.length; ndx < len; ndx++) {
			callbacks[ndx]();
		}
		
		if (octaneReset != null) {
			octaneReset();
		}
	};
	
	/*
	 * Create the jQuery object for the HTML container that the Reset button is
	 * contained within.
	 */
	var setupContainer = function() {
		container = jQuery('#' + containerId);
	};
	
	/*
	 * Create the jQuery object for the Reset button.
	 */
	var setupButton = function() {
		if (container == null) {
			setupContainer();
		}
		
		button = jQuery('<button id="' + buttonId + '" title="Reset World" style="display:none;">Reset</button>');
		
		button.bind("click", function(event) {
			executeReset();
		});
		
		container.html(button);
	};
	
	return hext;
})(hext || {});
