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

o3djs.require('hemi.world');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for displaying log, warning, and error messages to a
	 * console element on a webpage. To display the console, just call
	 * hemi.console.addToPage(); 
	 * Until the console has been added, log messages are ignored.
	 */
	hemi.console = hemi.console || {};
	
	/**
	 * The priority level for an error message.
	 * @type string
	 * @constant
	 */
	hemi.console.ERR = 'ERR';
	
	/**
	 * The priority level for a warning message.
	 * @type string
	 * @constant
	 */
	hemi.console.WARN = 'WARN';
	
	/**
	 * The priority level for a log message.
	 * @type string
	 * @constant
	 */
	hemi.console.LOG = 'LOG';
	
	/* Id of the HTML container for the console */
	var containerId = 'hemi-console';
	/* Id of the HTML drop-down box for setting priority*/
	var priorityId = 'hemi-console-priority';
	/* Id of the HTML checkbox for enabling */
	var enableId = 'hemi-console-enable';
	/* Id of the HTML checkbox for timestamping messages */
	var timestampId = 'hemi-console-timestamp';
	/* Id of the HTML button for clearing messages */
	var clearId = 'hemi-console-clear';
	/* Id of the HTML area for log messages */
	var messageAreaId = 'hemi-console-msg';
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
	/* Flag indicating if the console should display log messages */
	var enabled = false;
	/* Flag indicating if timestamps should be added to log messages */
	var showTime = true;
	
	/*
	 * The actual function for displaying a log message on the console.
	 * 
	 * @param {string} msg the message to display
	 * @param {string} level the priority level of the message
	 */
	var logMessage = function(msg, level) {
		level = level || hemi.console.LOG;
		
		if (testPriority(level)) {
			var output = level + ':\t' + msg + '<br>';
			
			if (showTime) {
				var time = getTime();
				output = time + '\t' + output;
			}
			
			// If the scrollbar for the message area is at the bottom, scroll it
			// to the display the given log message.
			var scroll = (messageArea[0].scrollHeight - messageArea[0].scrollTop) == messageArea.height();
			
			messageArea.append(output);
			
			if (scroll) {
				messageArea.scrollTop(messageArea[0].scrollHeight);
			}
		}
	};
	
	/*
	 * An efficient way to ignore log messages while the console is disabled.
	 */
	var doNothing = function() { };
	
	/*
	 * Get a timestamp for the current time.
	 * 
	 * @return {string} the current timestamp
	 */
	var getTime = function() {
		var currentTime = new Date();
		var hours = currentTime.getHours();
		hours = hours < 10 ? '0' + hours : '' + hours;
		var minutes = currentTime.getMinutes();
		minutes = minutes < 10 ? ':0' + minutes : ':' + minutes;
		var seconds = currentTime.getSeconds();
		seconds = seconds < 10 ? ':0' + seconds : ':' + seconds;
		
		return hours + minutes + seconds;
	}
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to LOG priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var logTest = function(level) {
		return level === hemi.console.LOG ||
		       level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to WARN priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var warnTest = function(level) {
		return level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to ERR priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var errTest = function(level) {
		return level === hemi.console.ERR;
	};
	
	/*
	 * This function is aliased to the proper test function for the console's
	 * current priority level.
	 */
	var testPriority = logTest;
	
	/*
	 * Create the jQuery object for the HTML container that the console is
	 * contained within.
	 */
	var setupContainer = function() {
		container = jQuery('#' + containerId);
		
		if (container.size() == 0) {
			// There is no DIV on the page for the console
			container = null;
			return;
		}
		
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
			hemi.console.clearMessages();
		});
	};
	
	/**
	 * Manually add the console to the HTML page. This can be called at any
	 * point to enable logging without having to edit and reload the HTML page.
	 */
	hemi.console.addToPage = function() {
		if (container == null) {
			// First add the CSS
			var head = jQuery('head');
			head.append('\
				<style>\
					#hemi-console {\
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
					#hemi-console-msg {\
						background: #fff;\
						border: 1px solid #aaa;\
						font-family: monospace;\
						height: 150px;\
						width: 99%;\
						overflow: auto;\
						position: absolute;\
						bottom: 3px;\
					}\
					#hemi-console-priority {\
						position: absolute;\
						left: 3px;\
					}\
					#hemi-console-enable {\
						position: absolute;\
						left: 150px;\
					}\
					#hemi-console-timestamp {\
						position: absolute;\
						left: 230px;\
					}\
					#hemi-console-clear {\
						position: absolute;\
						right: 3px;\
					}\
				</style>');
			
			// Then create the DIV and load the elements
			jQuery('body').append('<div id="' + containerId + '"></div>');
			setupContainer();
		}
	};
	
	/**
	 * Clear all of the log messages from the console.
	 */
	hemi.console.clearMessages = function() {
		messageArea.text('');
	};
	
	/**
	 * Log the given message if the console is enabled or ignore the message if
	 * the console is disabled.
	 * 
	 * @param {string} msg the message to display
	 * @param {string} level the priority level of the message
	 */
	hemi.console.log = doNothing;
	
	/**
	 * Enable or disable the console to receive log messages.
	 * 
	 * @param {boolean} en flag indicating if the console should be enabled
	 */
	hemi.console.setEnabled = function(en) {
		if (en == enabled) {
			return;
		}
		
		enabled = en;
		
		if (enabled) {
			hemi.console.log = logMessage;
		} else {
			hemi.console.log = doNothing;
		}
	};
	
	/**
	 * Enable or disable timestamping for received log messages.
	 * 
	 * @param {boolean} show flag indicating if messages should be timestamped
	 */
	hemi.console.setShowTime = function(show) {
		showTime = show;
	};
	
	/**
	 * Set the current priority level of the console. Log messages at the given
	 * priority level or higher will be displayed. Log messages below the
	 * priority level will be ignored.
	 * 
	 * @param {string} priority the priority level to set the console to
	 */
	hemi.console.setPriority = function(priority) {
		switch (priority) {
			case hemi.console.LOG:
				testPriority = logTest;
				break;
			case hemi.console.WARN:
				testPriority = warnTest;
				break;
			case hemi.console.ERR:
				testPriority = errTest;
				break;
		}
	};
	
	/**
	 * Set the loaded Hemi console to be visible.
	 */
	hemi.console.show = function() {
		if (container != null) {
			container.show();
		}
	};
	
	/**
	 * Set the loaded Hemi console to be hidden.
	 */
	hemi.console.hide = function() {
		if (container != null) {
			container.hide();
		}
	};
	
	/*
	 * Wait until the DOM is fully loaded before setting up the elements.
	 */
	jQuery(window).ready(function() {
		setupContainer();
	});
	
	return hemi;
})(hemi || {});