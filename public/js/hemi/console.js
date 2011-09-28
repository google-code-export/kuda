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

var hemi = (function(hemi) {
	/**
	 * @namespace A module for displaying log, warning, and error messages to a
	 * console element on a webpage.
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
	
	/* Flag indicating if the console should display log messages */
	var enabled = false;
	/* Flag indicating if timestamps should be added to log messages */
	var showTime = true;
	
	/*
	 * The actual function for logging a message.
	 * 
	 * @param {string} msg the message to log
	 * @param {string} level the priority level of the message
	 */
	var logMessage = function(msg, level) {
		level = level || hemi.console.LOG;
		
		if (testPriority(level)) {
			var fullMsg = level + ':\t' + msg;
			
			if (showTime) {
				var time = getTime();
				fullMsg = time + '\t' + fullMsg;
			}
			
			output(fullMsg);
		}
	};
	
	/*
	 * The default method for displaying a log message.
	 * 
	 * @param {string} msg the full log message to display
	 */
	var output = function(msg) {
		try {
			console.log(msg);
		} catch(e) { }
	};
	
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
	};
	
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
	
	/**
	 * Log the given message if the console is enabled or ignore the message if
	 * the console is disabled.
	 * 
	 * @param {string} msg the message to display
	 * @param {string} level the priority level of the message
	 */
	hemi.console.log = hemi.utils.noop;
	
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
			hemi.console.log = hemi.utils.noop;
		}
	};
	
	/**
	 * Set the function that will be used to display log messages.
	 * 
	 * @param {function(string):void} outFunc
	 */
	hemi.console.setOutput = function(outFunc) {
		output = outFunc;
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
	 * Enable or disable timestamping for received log messages.
	 * 
	 * @param {boolean} show flag indicating if messages should be timestamped
	 */
	hemi.console.setShowTime = function(show) {
		showTime = show;
	};
	
	return hemi;
})(hemi || {});