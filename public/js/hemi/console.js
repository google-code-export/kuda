/*
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 SRI International
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated  documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the  Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {

		/*
		 * This function is aliased to the proper test function for the console's current priority
		 * level.
		 */
	var testPriority = logTest,
		/*
		 * Flag indicating if the console should display log messages.
		 * @type boolean
		 */
		enabled = false,
		/*
		 * Flag indicating if timestamps should be added to log messages.
		 * @type boolean
		 */
		showTime = true;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @namespace A module for displaying log, warning, and error messages to a console element on a
	 * webpage.
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Log the given message if the console is enabled or ignore the message if the console is
	 * disabled.
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
		enabled = en;
		hemi.console.log = enabled ? logMessage : hemi.utils.noop;
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
	 * Set the current priority level of the console. Log messages at the given priority level or
	 * higher will be displayed. Log messages below the priority level will be ignored.
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

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Test if the given priority level for a message is high enough to display when the console
	 * is set to ERR priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	function errTest(level) {
		return level === hemi.console.ERR;
	}

	/*
	 * Get a timestamp for the current time.
	 * 
	 * @return {string} the current timestamp
	 */
	function getTime() {
		var currentTime = new Date(),
			hours = currentTime.getHours(),
			minutes = currentTime.getMinutes(),
			seconds = currentTime.getSeconds();

		hours = hours < 10 ? '0' + hours : '' + hours;
		minutes = minutes < 10 ? ':0' + minutes : ':' + minutes;
		seconds = seconds < 10 ? ':0' + seconds : ':' + seconds;

		return hours + minutes + seconds;
	}

	/*
	 * The actual function for logging a message.
	 * 
	 * @param {string} msg the message to log
	 * @param {string} level the priority level of the message
	 */
	function logMessage(msg, level) {
		level = level || hemi.console.LOG;

		if (testPriority(level)) {
			var fullMsg = level + ':\t' + msg;

			if (showTime) {
				fullMsg = getTime() + '\t' + fullMsg;
			}

			output(fullMsg);
		}
	}

	/*
	 * Test if the given priority level for a message is high enough to display when the console
	 * is set to LOG priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	function logTest(level) {
		return level === hemi.console.LOG ||
		       level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	}

	/*
	 * The default method for displaying a log message.
	 * 
	 * @param {string} msg the full log message to display
	 */
	function output(msg) {
		try {
			console.log(msg);
		} catch(e) { }
	}

	/*
	 * Test if the given priority level for a message is high enough to display when the console
	 * is set to WARN priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	function warnTest(level) {
		return level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	}

})();
