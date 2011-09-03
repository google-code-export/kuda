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

var editor = (function(editor) {
	editor.utils = editor.utils || {};
	
	editor.utils.roundNumber = function(num, dec) {
	    var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	    return result;
	};
	
	/**
	 * Returns the list of parameters for a function. Note that if the function
	 * has been minified, the parameter names will most likely be different
	 * than what may be expected.
	 */
	editor.utils.getFunctionParams = function(func) {
		return func.toString().match(/\((.*?)\)/)[1].match(/[\w]+/g) || [];
    };
	
	return editor;
})(editor || {}, jQuery);
