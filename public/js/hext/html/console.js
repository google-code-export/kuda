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
	hext.html = hext.html || {};
	
	/* Id of the HTML container for the console */
	var containerId = 'hext-console';
	/* Id of the HTML drop-down box for setting priority*/
	var priorityId = 'hext-console-priority';
	/* Id of the HTML checkbox for enabling */
	var enableId = 'hext-console-enable';
	/* Id of the HTML checkbox for timestamping messages */
	var timestampId = 'hext-console-timestamp';
	/* Id of the HTML button for clearing messages */
	var clearId = 'hext-console-clear';
	/* Id of the HTML area for log messages */
	var messageAreaId = 'hext-console-msg';
	/* jQuery object representing the HTML container for the console */
	var container = null;
	/* jQuery object representing the HTML drop-down box for the priority level */
	var priorityDropDown = jQuery('<select name="priority"><option value="' + hemi.console.LOG + '">Log</option><option value="' + hemi.console.WARN + '">Warning</option><option value="' + hemi.console.ERR + '">Error</option></select>');
	/* jQuery object representing the HTML checkbox for enabling the console */
	var enabledCheckBox = jQuery('<input type="checkbox" name="enable" value="enable" />');
	/* jQuery object representing the HTML checkbox for adding timestamps */
	var timeCheckBox = jQuery('<input type="checkbox" name="showTime" value="showTime" />');
	/* jQuery object representing the HTML button for clearing the console */
	var clearButton = jQuery('<button title="Clear messages">Clear</button>');
	/* jQuery object representing the HTML area for log messages */
	var messageArea = jQuery('<div id="' + messageAreaId + '"></div>');
	
	/*
	 * Create the jQuery object for the HTML container that the Hext console is
	 * contained within.
	 */
	var setupContainer = function() {
		container = jQuery('#' + containerId);
		
		if (container.size() == 0) {
			// There is no DIV on the page for the console
			container = null;
			return;
		}
		
		hemi.console.setOutput(function(msg) {
			// If the scrollbar for the message area is at the bottom, scroll it
			// to the display the given log message.
			var scroll = (messageArea[0].scrollHeight - messageArea[0].scrollTop) == messageArea.height();
			messageArea.append(output);
			
			if (scroll) {
				messageArea.scrollTop(messageArea[0].scrollHeight);
			}
		});
		hemi.console.setEnabled(true);
		
		var div1 = jQuery('<div id="' + priorityId + '"></div>');
		div1.append('Priority: ');
		div1.append(priorityDropDown);
		container.append(div1);
		
		var div2 = jQuery('<div id="' + enableId + '"></div>');
		div2.append(enabledCheckBox);
		div2.append(' Enable');
		container.append(div2);
		
		var div3 = jQuery('<div id="' + timestampId + '"></div>');
		div3.append(timeCheckBox);
		div3.append(' Timestamp');
		container.append(div3);
		
		var div4 = jQuery('<div id="' + clearId + '"></div>');
		div4.append(clearButton);
		container.append(div4);
		
		// Initialize the options
		timeCheckBox[0].checked = showTime;
		enabledCheckBox[0].checked = enabled;
		
		container.append(messageArea);
		
		// Bind the Javascript handlers
		priorityDropDown.change(function(event) {
			hemi.console.setPriority(event.target.value);
		});
		
		enabledCheckBox.change(function(event) {
			hemi.console.setEnabled(event.target.checked);
		});
		
		timeCheckBox.change(function(event) {
			hemi.console.setShowTime(event.target.checked);
		});
		
		clearButton.click(function() {
			hext.html.console.clearMessages();
		});
	};
	
	/**
	 * @namespace A module for displaying the Hemi console messages within an
	 * HTML element on the bottom of the page. To display the HTML console, just
	 * call hext.html.console.addToPage();
	 */
	hext.html.console = {
		/**
		 * Clear all of the log messages from the Hext console.
		 */
		clearMessages: function() {
			messageArea.text('');
		},
		
		/**
		 * Set the loaded Hext console to be hidden.
		 */
		hide: function() {
			if (container != null) {
				container.hide();
			}
		},
		
		/**
		 * Manually add the Hext console to the HTML page. This can be called at
		 * any point to enable logging without having to edit and reload the
		 * HTML page.
		 */
		addToPage: function() {
			if (container == null) {
				// First add the CSS
				var head = jQuery('head');
				head.append('\
					<style>\
						#hext-console {\
							background: #cdcdcd;\
						    border: 1px solid #ddd;\
						    border-radius: 3px;\
						    -moz-border-radius: 3px;\
						    -webkit-border-radius: 3px;\
							height: 180px;\
							width: 98%;\
							padding: 3px;\
							position: fixed;\
							bottom: 0px;\
						}\
						#hext-console-msg {\
							background: #fff;\
							border: 1px solid #aaa;\
							font-family: monospace;\
							height: 150px;\
							width: 99%;\
							overflow: auto;\
							position: absolute;\
							bottom: 3px;\
						}\
						#hext-console-priority {\
							position: absolute;\
							left: 3px;\
						}\
						#hext-console-enable {\
							position: absolute;\
							left: 150px;\
						}\
						#hext-console-timestamp {\
							position: absolute;\
							left: 230px;\
						}\
						#hext-console-clear {\
							position: absolute;\
							right: 3px;\
						}\
					</style>');
				
				// Then create the DIV and load the elements
				jQuery('body').append('<div id="' + containerId + '"></div>');
				setupContainer();
			}
		},
		
		/**
		 * Set the loaded Hext console to be visible.
		 */
		show: function() {
			if (container != null) {
				container.show();
			}
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