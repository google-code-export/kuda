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
 
 o3djs.require('hemi.hud');

var hext = (function(hext) {
	/**
	 * @namespace A module for pre-built HTML containers and elements that
	 * interact with the 3D scene.
	 */
	hext.html = hext.html || {};
	
	/* Id of the HTML container for the Hint button */
	var containerId = 'hext-hint';
	/* Id of the HTML Hint button */
	var buttonId = 'hext-hint-button';
	/* jQuery object representing the HTML container for the Hint button */
	var container = null;
	/* jQuery object representing the HTML Hint button */
    var button = null;
	/* The current Hint message to display */
	var message = [];
	/* The HudDisplay used to display the Hint messages */
	var hudDisplay = new hemi.hud.HudDisplay();
	hudDisplay.setId(-1);
	
	/**
	 * @namespace A set of functions for creating hint messages and displaying a
	 * button that allows the user to show/hide those messages. In order for the
	 * Hint button to be displayed, you need to have a div with the container id
	 * in your viewer page. The default container id that Hint searches for is
	 * 'hext-hint', but you may change the id if you wish.
	 */
	hext.html.hint = {
		/**
		 * Display the Hint button in the Hint container.
		 */
		show: function() {
			if (button == null) {
				setupButton();
			}
			
			button.show();
		},
		
		/**
		 * Hide the Hint button in the Hint container.
		 */
		hide: function() {
			if (button == null) {
				setupButton();
			}
			
			button.hide();
		},
		
		/**
		 * Force the current Hint message to be displayed. This can be used if
		 * you have a message that you want displayed whether or not the user
		 * clicks on the Hint button.
		 */
		displayMessage: function() {
			if (!hudDisplay.isVisible()) {
				toggleHint();
			}
		},
		
		/**
		 * Force the current Hint message to be hidden. This can be used if
		 * there is no longer a relevant message to display.
		 */
		removeMessage: function() {
			if (hudDisplay.isVisible()) {
				toggleHint();
			}
		},
		
		/**
		 * Search for the HTML element with the given id. If one is found, use
		 * it as the Hint container. This will reinitialize the Hint container
		 * if it was already created with a different id.
		 * 
		 * @param {string} id the id of the HTML element to act as a container
		 *     for the Hint button
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
		 * Set the id of the Hint button. This can be useful for ensuring your
		 * own custom CSS is applied to the Hint button.
		 * 
		 * @param {string} id the new id for the Hint button
		 */
		setButtonId: function(id) {
			buttonId = id;
			
			if (button != null) {
				button.attr("id", buttonId);
			}
		},
		
		/**
		 * Set the current Hint message that will be displayed when the user
		 * clicks the Hint button. If the given array contains more than one
		 * string, they will each be displayed on different HudPages and paging
		 * navigation will be added. If a Hint message is currently visible, it
		 * will be updated to the given message.
		 * 
		 * @param {string[]} hintMsg an array of textual messages to display
		 */
		setMessage: function(hintMsg) {
			if (hintMsg instanceof Array) {
				message = hintMsg;
			} else {
				message = [hintMsg];
			}
			
			var multiPage = message.length > 1;
			var show = hudDisplay.isVisible();
			hudDisplay.clearPages();
			hudDisplay.addPagingInfo = multiPage;
			
			for (var ndx = 0, len = message.length; ndx < len; ndx++) {
				var page = createHudPage(message[ndx], multiPage);
				hudDisplay.addPage(page);
			}
			
			if (show) {
				hudDisplay.show();
			}
		}
	};
	
	/*
	 * Create a single HudPage from the given text and position it to be at the
	 * bottom of the 3D scene.
	 * 
	 * @param {string} hudText the text to create a HudPage with
	 * @param {boolean} addPageNav flag indicating if there will be page
	 *     navigation added to the bottom of the HudPage
	 * @return {hemi.hud.HudPage} the created HudPage
	 */
	var createHudPage = function(hudText, addPageNav) {
		var text = new hemi.hud.HudText();
		text.setText(hudText);
		text.setWidth(hemi.core.client.width);
		
		var height = text.wrappedHeight + (addPageNav ? 25 : 0);
		text.x = hemi.core.client.width / 2;
		text.y = hemi.core.client.height - height;
		
		var page = new hemi.hud.HudPage();
		page.addElement(text);
		return page;
	};
	
	/*
	 * The actual display function that is called when the Hint button is
	 * clicked. Toggle the Hint message so it is now shown or hidden.
	 */
	var toggleHint = function() {
		if (hudDisplay.isVisible()) {
			if (hudDisplay.pages.length > 0) {
				hudDisplay.hide();
			}
			
			button.text('Show Hint');
		} else {
			if (hudDisplay.pages.length > 0) {
				hudDisplay.show();
			}
			
			button.text('Hide Hint');
		}
	};
	
	/*
	 * Create the jQuery object for the HTML container that the Hint button is
	 * contained within.
	 */
	var setupContainer = function() {
		container = jQuery('#' + containerId);
	};
	
	/*
	 * Create the jQuery object for the Hint button.
	 */
	var setupButton = function() {
		if (container == null) {
			setupContainer();
		}
		
		button = jQuery('<button id="' + buttonId + '" title="Hint" style="display:none;">Show Hint</button>');
		
		button.bind("click", function(event) {
			toggleHint();
		});
		
		container.html(button);
	};
	
	return hext;
})(hext || {});
