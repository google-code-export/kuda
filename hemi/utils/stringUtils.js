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
	hemi.utils = hemi.utils || {};
	
	/*
	 * Add a function to the Javascript string to remove whitespace from the
	 * beginning and end.
	 */
	String.prototype.trim = function() {
		return this.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	
	/**
	 * Test if the given string is numeric.
	 *  
	 * @param {string} str the string to test
	 * @return {boolean} true if the string can be converted directly to a number
	 */
	hemi.utils.isNumeric = function(str) {
		return !(str === null || isNaN(str) || str.length === 0);
	}
	
	
	/*
	 * A table of characters to break a line on (for text wrapping), weighted
	 * by preference.
	 */
	var breakable = new Hashtable();
	breakable.put(' ', 10);
	breakable.put(',', 20);
	breakable.put(';', 30);
	breakable.put('.', 10);
	breakable.put('!', 40);
	breakable.put('?', 40);
	
	/**
	 * Perform strict text wrapping on the given text. The returned text is
	 * guaranteed to be no wider than the specified target width, though it may
	 * be farther from that width than with loose text wrapping.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth maximum desired width for text in pixels
	 * @param {o3d.CanvasPaint} paint paint object used to measure text's
	 *     on-screen size
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapTextStrict = function(text, targetWidth, paint) {
		var wrapLines = [];
		var text = hemi.utils.cleanseText(text);
		var textLength = text.length;
		var textSize = paint.measureText(text);
		var avgCharWidth = (textSize[2] - textSize[0]) / textLength;
		
		var chars = Math.floor(targetWidth / avgCharWidth);
		var increment = Math.ceil(chars / 10);
		var start = 0;
		var end = chars;
		var line, lineSize, width;
		
		while (end < textLength) {
			line = text.substring(start, end).trim();
			lineSize = paint.measureText(line);
			width = lineSize[2] - lineSize[0];
			
			while (width < targetWidth && end < textLength) {
				end += increment;
				
				if (end > textLength) {
					end = textLength;
				}
				
				line = text.substring(start, end).trim();
				lineSize = paint.measureText(line);
				width = lineSize[2] - lineSize[0];
			}
			
			while (width > targetWidth) {
				end--;
				line = text.substring(start, end).trim();
				lineSize = paint.measureText(line);
				width = lineSize[2] - lineSize[0];
			}
			
			var breakNdx = end - 1;
			var ch = text.charAt(breakNdx);
			
			while (!breakable.containsKey(ch) && breakNdx > start) {
				breakNdx--;
				ch = text.charAt(breakNdx);
			}
			
			if (breakNdx > start) {
				end = breakNdx + 1;
			}
			
			line = text.substring(start, end).trim();
			wrapLines.push(line);
			start = end;
			end += chars;
		}
			
		if (start != textLength || wrapLines.length == 0) {
			line = text.substring(start, textLength).trim();
			wrapLines.push(line);
		}
		
		return wrapLines;
	};
	
	/**
	 * Perform loose text wrapping on the given text. The returned text will be
	 * close to the specified target width, but may be a little wider.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth desired width for text in pixels
	 * @param {number} charWidth average width of a character of the text in
	 *     pixels
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapText = function(text, targetWidth, charWidth) {
		var wrapLines = [];
		var text = hemi.utils.cleanseText(text);
		var textLength = text.length;
		
		var cols = parseInt(targetWidth / charWidth);
        var rows = Math.ceil(textLength / cols);
		var start = cols;
		var index = 0;
		var last;
		
		for (var i = 0; i < rows - 1; i++) {
			last = index;
			index = bestBreak(text, start, 10);
			wrapLines.push(text.substring(last, index).trim());
			start = index + cols;
		}
		
		wrapLines.push(text.substring(index, textLength));
		return wrapLines;
	};
	
	/**
	 * Replace any newline characters in the text with spaces. This is used to
	 * prepare text for text wrapping.
	 * 
	 * @param {string} text string to clean
	 * @return {string} string with all newline characters replaced
	 */
	hemi.utils.cleanseText = function(text) {
		text = text.replace('\n', ' ');
		return text;
	};
	
	/*
	 * Internal function to calculate the "best" index to break a line of
	 * text at, given a certain weighted preference for characters to break on.
	 * 
	 * @param {string} text string of text to break into two lines
	 * @param {number} start estimated index the user would like to break at
	 * @param {number} radius maximum distance before and after the start index
	 *     to search for a "best" break
	 */
	function bestBreak(text, start, radius) {
		var bestIndex = start;
		var bestWeight = 0;
		var examWeight;
		var textLength = text.length;
		
		var beginRadius = start - Math.max(start - radius, 0);
		var endRadius = Math.min(start + radius, textLength - 1) - start;
		for (var i = parseInt(start - beginRadius); i <= start + endRadius; i++) {
			var weight = breakable.get(text.charAt(i));
			if (weight == null) 
				continue;
			
			examWeight = weight / Math.abs(start - i);
			if (examWeight > bestWeight) {
				bestIndex = i;
				bestWeight = examWeight;
			}
		}
		
		return Math.min(bestIndex + 1, textLength - 1);
	};
	
	return hemi;
})(hemi || {});
