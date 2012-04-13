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
		 * A table of characters to break a line on (for text wrapping), weighted by preference.
		 */
	var breakable = {
			' ': 10,
			',': 20,
			';': 30,
			'.': 10,
			'!': 40,
			'?': 40
		};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Capitalize the first letter of the given string.
	 * 
	 * @param {string} str the string to capitalize
	 * @return {string} the capitalized string
	 */
	hemi.utils.capitalize = function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	/**
	 * Test if the given string is numeric.
	 * 
	 * @param {string} str the string to test
	 * @return {boolean} true if the string can be converted directly to a number
	 */
	hemi.utils.isNumeric = function(str) {
		return !(str === null || isNaN(str) || str.length === 0);
	};

	/**
	 * Remove any whitespace from the beginning and end of the given string.
	 * 
	 * @param {string} str the string to trim
	 * @return {string} the trimmed string
	 */
	hemi.utils.trim = function(str) {
		return str.replace(/^\s*/, "").replace(/\s*$/, "");
	};

	/**
	 * Perform loose text wrapping on the given text. The returned text will be close to the
	 * specified target width, but may be a little wider.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth desired width for text in pixels
	 * @param {number} charWidth average width of a character of the text in pixels
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapText = function(text, targetWidth, charWidth) {
		text = cleanseText(text);

		var wrapLines = [],
			textLength = text.length,
			cols = parseInt(targetWidth / charWidth, 10),
			rows = Math.ceil(textLength / cols),
			start = cols,
			index = 0,
			last;

		for (var i = 0; i < rows - 1; ++i) {
			last = index;
			index = bestBreak(text, start, 10);
			wrapLines.push(hemi.utils.trim(text.substring(last, index)));
			start = index + cols;
		}

		wrapLines.push(text.substring(index, textLength));
		return wrapLines;
	};

	/**
	 * Perform strict text wrapping on the given text. The returned text is guaranteed to be no
	 * wider than the specified target width, though it may be farther from that width than with
	 * loose text wrapping.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth maximum desired width for text in pixels
	 * @param {CanvasRenderingContext2D} canvas object used to measure text's on-screen size
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapTextStrict = function(text, targetWidth, canvas) {
		text = cleanseText(text);

		var wrapLines = [],
			textLength = text.length,
			metric = canvas.measureText(text),
			charWidth = metric.width / textLength,
			chars = Math.floor(targetWidth / charWidth),
			increment = Math.ceil(chars / 10),
			start = 0,
			end = chars,
			line, width;

		while (end < textLength) {
			line = hemi.utils.trim(text.substring(start, end));
			metric = canvas.measureText(line);
			width = metric.width;

			while (width < targetWidth && end < textLength) {
				end += increment;

				if (end > textLength) {
					end = textLength;
				}

				line = hemi.utils.trim(text.substring(start, end));
				metric = canvas.measureText(line);
				width = metric.width;
			}

			while (width > targetWidth) {
				end--;
				line = hemi.utils.trim(text.substring(start, end));
				metric = canvas.measureText(line);
				width = metric.width;
			}

			var breakNdx = end - 1,
				ch = text.charAt(breakNdx);

			while (breakable[ch] === undefined && breakNdx > start) {
				breakNdx--;
				ch = text.charAt(breakNdx);
			}

			if (breakNdx > start) {
				end = breakNdx + 1;
			}

			line = hemi.utils.trim(text.substring(start, end));
			wrapLines.push(line);
			start = end;
			end += chars;
		}

		if (start !== textLength || wrapLines.length === 0) {
			line = hemi.utils.trim(text.substring(start, textLength));
			wrapLines.push(line);
		}

		return wrapLines;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Calculate the "best" index to break a line of text at, given a certain weighted preference
	 * for characters to break on.
	 * 
	 * @param {string} text string of text to break into two lines
	 * @param {number} start estimated index the user would like to break at
	 * @param {number} radius maximum distance before and after the start index to search for a
	 *     "best" break
	 * @return {number} the calculated break index
	 */
	function bestBreak(text, start, radius) {
		var bestIndex = start,
			bestWeight = 0,
			textLength = text.length,
			beginRadius = start - Math.max(start - radius, 0),
			endRadius = Math.min(start + radius, textLength - 1) - start,
			examWeight, weight;

		for (var i = parseInt(start - beginRadius, 10); i <= start + endRadius; ++i) {
			weight = breakable[text.charAt(i)];

			if (weight === undefined) 
				continue;

			examWeight = weight / Math.abs(start - i);

			if (examWeight > bestWeight) {
				bestIndex = i;
				bestWeight = examWeight;
			}
		}

		return Math.min(bestIndex + 1, textLength - 1);
	}

	/*
	 * Replace any newline characters in the text with spaces.
	 * 
	 * @param {string} text string to clean
	 * @return {string} string with all newline characters replaced
	 */
	function cleanseText(text) {
		return text.replace('\n', ' ');
	}

})();
