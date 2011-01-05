o3djs.require('hext.msg');
o3djs.require('hext.tools.baseTool');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BlowerDoor is the data model representation of a blower door
	 * weatherization tool.
	 * @extends hext.tools.BaseTool
	 */
	hext.tools.BlowerDoor = function() {
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

	hext.tools.BlowerDoor.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: "hext.tools.BlowerDoor",
		
		/**
		 * Send a cleanup Message and remove all references in the BlowerDoor.
		 */
		cleanup: function() {
			hext.tools.BaseTool.prototype.cleanup.call(this);
			this.toLocation = null;
			this.fromLocation = null;
		},

		/*
		 * Not currently supported.
		 */
		toOctane: function() {

		},

		/**
		 * Set the fan speed of the BlowerDoor and send a notification Message.
		 *
		 * @param {number} value the new fan speed
		 */
		setFanSpeed: function(value) {
			this.currentSpeed = value;

			this.send(hext.msg.speed,
				{
					speed: value
				});
		},

		/**
		 * Get the current fan speed of the BlowerDoor.
		 *
		 * @return {number} the current fan speed
		 */
		getFanSpeed: function() {
			return this.currentSpeed;
		},

		/**
		 * Update the "to" and "from" Locations with the airflow blown by the
		 * BlowerDoor. This allows the BlowerDoor to be treated like a Portal
		 * by the PressureEngine.
		 * @see hext.engines.Portal#updateAirFlow
		 */
		updateAirFlow: function() {
			var blownAir = 40.5 * this.currentSpeed;
			this.toLocation.addAirFlow(blownAir);
			this.fromLocation.addAirFlow(-1 * blownAir);
		},

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
		sendUpdate: function(airFlow) {
			if (airFlow != undefined) {
				var blownAir = 40.5 * this.currentSpeed;
				
				this.send(hext.msg.pressure,
					{
						airFlow: blownAir - airFlow
					});
			}
		}
	};

	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.BlowerDoor.inheritsFrom(hext.tools.BaseTool);
	hext.tools.BlowerDoor.prototype.msgSent =
		hext.tools.BlowerDoor.prototype.msgSent.concat([
			hext.msg.pressure,
			hext.msg.speed]);
});
