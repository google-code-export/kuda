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
	/**
	 * @namespace A module to extend the Message types in Hemi to support new
	 * features in Hext.
	 * @example
	 * The documentation for each Message type has an example of a typical
	 * Message body for that type (the 'data' property of a Message).
	 */
	hext.msg = {
		/**
		 * The Message sent when the input for something changes.
		 * @type string
		 * @constant
		 * @example
		 * Sent by hext.tools.Manometer, data =
		 * {
		 *     left: (the type of the left manometer inputs)
		 *     right: (the type of the right manometer inputs)
		 * }
		 * @example
		 * Sent by hext.tools.ManometerView, data =
		 * {
		 *     elementId: (the id of the HTML element for the input tap)
		 *     selected: (flag indicating if the tap is selected or not)
		 * }
		 */
		input: 'hext.input',
		/**
		 * The Message sent when a pressure calculation is performed.
		 * @type string
		 * @constant
		 * @example
		 * Sent by hext.engines.Location, data =
		 * {
		 *     pressure: (the newly calculated pressure value)
		 * }
		 * @example
		 * Sent by hext.tools.Manometer, data =
		 * {
		 *     left: (the value of the left manometer inputs)
		 *     right: (the value of the right manometer inputs)
		 * }
		 * @example
		 * Sent by hext.engines.Portal, data =
		 * {
		 *     airFlow: (the newly calculated amount of airflow)
		 * }
		 */
		pressure: 'hext.pressure',
		/**
		 * The Message sent when the speed of something changes.
		 * @type string
		 * @constant
		 * @example
		 * Sent by hext.tools.BlowerDoor, data =
		 * {
		 *	   speed: (the current BlowerDoor fan speed)
		 * }
		 */
		speed: 'hext.speed'
	};

	return hext;
})(hext || {});
