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
	/**
	 * @namespace A module for managing the string literals for Message types.
	 * @example
	 * The documentation for each Message type has an example of a typical
	 * Message body for that type (the 'data' property of a Message).
	 */
	editor.msg = {
		/**
		 * @type string
		 * @constant
		 * @example
		 * data = {
		 * 	   citizen: (hemi.world.Citizen) the newly created citizen
		 * }
		 */
		citizenCreated: 'editor.citCreated',
		/**
		 * @type string
		 * @constant
		 * @example
		 * data = {
		 *     citizen: (hemi.world.Citizen) the recently destroyed citizen
		 * }
		 */
		citizenDestroyed: 'editor.citDestroyed'
	};

	return editor;
})(editor || {});
