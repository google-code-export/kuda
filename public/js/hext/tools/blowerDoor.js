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
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BlowerDoor is the data model representation of a blower door
	 * weatherization tool.
	 * @extends hext.tools.BaseTool
	 */
	var BlowerDoor = function() {
		hext.tools.BaseTool.call(this);
		/**
		 * The maximum fan speed.
		 * @type number
		 * @default 135
		 */
		this.max = 135;

		/**
		 * The minimum fan speed.
		 * @type number
		 * @default 0
		 */
		this.min = 0;
		
		/**
		 * The Location the BlowerDoor blows air to.
		 * @type hext.engines.Location
		 */
		this.toLocation = null;
		
		/**
		 * The Location the BlowerDoor blows air from.
		 * @type hext.engines.Location
		 */
		this.fromLocation = null;
		
		this.currentSpeed = 0;
	};

	BlowerDoor.prototype = new hext.tools.BaseTool();
	BlowerDoor.prototype.constructor = BlowerDoor;
		
	/**
	 * Send a cleanup Message and remove all references in the BlowerDoor.
	 */
	BlowerDoor.prototype.cleanup = function() {
		hext.tools.BaseTool.cleanup.call(this);
		this.toLocation = null;
		this.fromLocation = null;
	};

	/*
	 * Not currently supported.
	 */
	BlowerDoor.prototype.toOctane = function() {

	};

	/**
	 * Set the fan speed of the BlowerDoor and send a notification Message.
	 *
	 * @param {number} value the new fan speed
	 */
	BlowerDoor.prototype.setFanSpeed = function(value) {
		this.currentSpeed = value;

		this.send(hext.msg.speed,
			{
				speed: value
			});
	};

	/**
	 * Get the current fan speed of the BlowerDoor.
	 *
	 * @return {number} the current fan speed
	 */
	BlowerDoor.prototype.getFanSpeed = function() {
		return this.currentSpeed;
	};

	/**
	 * Update the "to" and "from" Locations with the airflow blown by the
	 * BlowerDoor. This allows the BlowerDoor to be treated like a Portal
	 * by the PressureEngine.
	 * @see hext.engines.Portal#updateAirFlow
	 */
	BlowerDoor.prototype.updateAirFlow = function() {
		var blownAir = 40.5 * this.currentSpeed;
		this.toLocation.addAirFlow(blownAir);
		this.fromLocation.addAirFlow(-1 * blownAir);
	};

	/**
	 * Ignore the call to sendUpdate from the PressureEngine (it will not
	 * pass an argument for airFlow). When the fan opening Portal sends its
	 * message here, send the BlowerDoor's message as a comparison between
	 * the two airFlows. This allows the BlowerDoor to be treated like a
	 * Portal by the PressureEngine.
	 * @see hext.engines.Portal#sendUpdate
	 * 
	 * @param {number} airFlow the airflow reported by the fan opening Portal
	 */
	BlowerDoor.prototype.sendUpdate = function(airFlow) {
		if (airFlow != undefined) {
			var blownAir = 40.5 * this.currentSpeed;
			
			this.send(hext.msg.pressure,
				{
					airFlow: blownAir - airFlow
				});
		}
	};

	hemi.makeCitizen(BlowerDoor, 'hext.tools.BlowerDoor', {
		msgs: [hext.msg.pressure, hext.msg.speed],
		toOctane: []
	});
	
	return hext;
})(hext || {});
