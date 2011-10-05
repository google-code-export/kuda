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
	 * @namespace A module for simulation engines.
	 */
	hext.engines = hext.engines || {};

	var INFINITE_VOLUME = -1;

	/**
	 * @class A Portal represents an opening between two Locations that air
	 * can flow through.
	 * @extends hemi.world.Citizen
	 */
	hext.engines.Portal = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The Location on one side of the Portal.
			 * @type hext.engines.Location
			 */
			this.locationA = null;
			
			/**
			 * The Location on the other side of the Portal.
			 * @type hext.engines.Location
			 */
			this.locationB = null;
			
			this.closedPosition = [0, 0, 0];
			this.position = [0, 0, 0];
			this.airFlow = 0;
			this.area = 0;
			
			/**
			 * The length of the Portal opening.
			 * @type number
			 * @default 0
			 */
			this.length = 0;
			
			/**
			 * The width of the Portal opening.
			 * @type number
			 * @default 0
			 */
			this.width = 0;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hext.engines.Portal',
		
		/**
		 * Send a cleanup Message and remove all references in the Portal.
		 */
		cleanup: function() {
			this._super();
			this.locationA = null;
			this.locationB = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			var octane = {
				wi: this.getId(),
				ln: this.length,
				wd: this.width,
				po: this.closedPosition,
				la: this.locationA.getId(),
				lb: this.locationB.getId()
			};
			
			return octane;
		},
		
		/**
		 * Get the current amount of air flowing through the Portal.
		 * 
		 * @return {number} the currently calculated air flow
		 */
		getAirFlow: function() {
			return this.airFlow;
		},
		
		/**
		 * Get the width of the Portal.
		 * 
		 * @return {number} width of the Portal
		 */
		getWidth: function() {
			return this.width;
		},
		
		/**
		 * Set the width of the Portal and calculate its area.
		 * 
		 * @param {number} width width of the Portal
		 */
		setWidth: function(width) {
			this.width = width;
			this.area = this.width * this.length;
		},
		
		/**
		 * Get the length of the Portal.
		 * 
		 * @return {number} length of the Portal
		 */
		getLength: function() {
			return this.length;
		},
		
		/**
		 * Set the length of the Portal and calculate its area.
		 * 
		 * @param {number} length length of the Portal
		 */
		setLength: function(length) {
			this.length = length;
			this.area = this.width * this.length;
		},
		
		/**
		 * Get the area of the Portal.
		 * 
		 * @return {number} area of the Portal
		 */
		getArea: function(){
			return this.area;
		},
		
		/**
		 * Set the closed position of the Portal. This is used to calculate the
		 * length of Portals that can be 'opened' such as windows. This will
		 * also set the current position of the Portal.
		 * 
		 * @param {number[3]} position the XYZ position of the Portal when it is
		 *	   'closed'
		 */
		setClosedPosition: function(position) {
			this.closedPosition = position;
			this.position = position;
		},
		
		/**
		 * Set the current open position of the Portal and calculate its length
		 * based upon its known closed position.
		 * 
		 * @param {number[3]} openPosition current xyz position
		 */
		setOpening: function(openPosition) {
			this.position = openPosition;
			var length = hemi.core.math.distance(this.closedPosition, this.position);
			this.setLength(length / 4);
		},
		
		/**
		 * Adjust the current open position of the Portal by the given vector
		 * and calculate its length based upon its known closed position.
		 * 
		 * @param {number[3]} delta change in xyz position to apply
		 */
		adjustOpening: function(delta) {
			this.position = hemi.core.math.addVector(this.position, delta);
			var length = hemi.core.math.distance(this.closedPosition, this.position);
			this.setLength(length / 4);
		},
		
		/**
		 * Calculate the current airflow for this Portal based upon its two
		 * Locations. Add/subtract the airflow from those Locations.
		 */
		updateAirFlow: function() {
			if (!this.locationA || !this.locationB) {
				return;
			}
			
			var pressureA = this.locationA.getPressure();
			var pressureB = this.locationB.getPressure();
			var pressureDiff = pressureA - pressureB;
			var dir = (pressureDiff >= 0) ? -1 : 1;
			this.airFlow = dir * this.area * Math.pow(Math.abs(pressureDiff), 0.65) * 0.589;
			this.locationA.addAirFlow(this.airFlow);
			this.locationB.addAirFlow(-1 * this.airFlow);
		},
		
		/**
		 * Send an update Message with the most recent airflow calculation.
		 */
		sendUpdate: function(){
			this.send(hext.msg.pressure,
				{
					airFlow: this.airFlow
				});
		}
	});
	
	hext.engines.Portal.prototype.msgSent =
		hext.engines.Portal.prototype.msgSent.concat([hext.msg.pressure]);
	
	/**
	 * @class A Location represents a discrete volume of space with a distinct
	 * pressure value.
	 * @extends hemi.world.Citizen
	 */
	hext.engines.Location = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The volume of the Location.
			 * @type number
			 * @default 0
			 */
			this.volume = 0;
			
			this.pressure = 0;
			this.airFlow = 0;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hext.engines.Location',
		
		/*
		 * Not currently supported.
		 */
		toOctane: function(){
			var octane = {
				wi: this.getId(),
				vo: this.volume
			};
			
			return octane;
		},
		
		/**
		 * Get the current pressure of the Location.
		 * 
		 * @return {number} the currently calculated pressure
		 */
		getPressure: function(){
			return this.pressure;
		},
		
		/**
		 * Get the current amount of air flowing into the Location.
		 * 
		 * @return {number} the currently calculated air flow
		 */
		getAirFlow: function(){
			return this.airFlow;
		},
		
		/**
		 * Add the specified amount of airflow to the Location.
		 * 
		 * @param {number} airFlow amount of air flowing into the Location
		 */
		addAirFlow: function(airFlow){
			this.airFlow += airFlow;
		},
		
		/**
		 * Calculate the Location's new pressure based upon its current airflow
		 * value and the specified amount of time for the air to flow at that
		 * rate.
		 * 
		 * @param {number} increment time increment to calculate pressure for
		 */
		updatePressure: function(increment){
			if (this.volume > 0) {
				this.pressure += increment * this.airFlow * 47.8224 / this.volume;
			}
			
			this.airFlow = 0;
		},
		
		/**
		 * Send an update Message with the most recent pressure calculation.
		 */
		sendUpdate: function(){
			this.send(hext.msg.pressure,
				{
					pressure: this.pressure
				});
		}
	});
	
	hext.engines.Location.prototype.msgSent =
		hext.engines.Location.prototype.msgSent.concat([hext.msg.pressure]);
	
	// TEMPORARY! Until we can figure out a better way to tie a Location to the
	// shapes that act as select objects for it.
	hext.engines.LocationSelector = function(){
		this.location = null;
		this.shapeName = '';
	};
	
	hext.engines.LocationSelector.prototype = {
		toOctane: function(){
			var octane = {
				lo: this.location.getId(),
				sn: this.shapeName
			};
			
			return octane;
		}
	};
	
	/**
	 * @class A PressureEngine calculates pressure changes over time across a
	 * system of Locations connected by Portals.
	 * @extends hemi.world.Citizen
	 */
	hext.engines.PressureEngine = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The time increment to perform differential calculations for.
			 * @type number
			 * @default 0.001
			 */
			this.increment = 0.001;
			
			this.locations = [];
			this.portals = [];
			this.time = 0;
			// TEMPORARY
			this.selectors = [];
			
			hemi.view.addRenderListener(this);
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hext.engines.PressureEngine',
		
		/**
		 * Send a cleanup Message and remove all references in the Portal.
		 */
		cleanup: function() {
			hemi.view.removeRenderListener(this);
			this._super();
			this.locations = [];
			this.portals = [];
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function(){
			var octane = {
				wi: this.getId(),
				ic: this.increment,
				lo: [],
				po: [],
				// TEMPORARY
				se: []
			};
			
			for (var ndx = 0; ndx < this.locations.length; ndx++) {
				var location = this.locations[ndx];
				octane.lo.push(location.toOctane());
			}
			
			for (var ndx = 0; ndx < this.portals.length; ndx++) {
				var portal = this.portals[ndx];
				octane.po.push(portal.toOctane());
			}
			
			// TEMPORARY
			for (var ndx = 0; ndx < this.selectors.length; ndx++) {
				var selector = this.selectors[ndx];
				octane.se.push(selector.toOctane());
			}
			
			return octane;
		},
		
		// TEMPORARY
		addLocationSelector: function(selector){
			this.selectors.push(selector);
		},
		
		// TEMPORARY
		getLocationByShapeName: function(shapeName) {
			var location = null;
			
			for (var ndx = 0; ndx < this.selectors.length; ndx++) {
				var selector = this.selectors[ndx];
				
				if (selector.shapeName == shapeName) {
					location = selector.location;
					break;
				}
			}
			
			return location;
		},
		
		/**
		 * Use the elapsed time from the render event to perform pressure and
		 * airflow calculations on all Portals and Locations.
		 * 
		 * @param {o3d.RenderEvent} event the event containing the elapsed time
		 */
		onRender: function(event){
			this.time += event.elapsedTime;
			
			while (this.time > this.increment) {
				for (var ndx = 0; ndx < this.portals.length; ndx++) {
					this.portals[ndx].updateAirFlow();
				}
				
				for (var ndx = 0; ndx < this.locations.length; ndx++) {
					this.locations[ndx].updatePressure(this.increment);
				}
				
				this.time -= this.increment;
			}
			
			for (var ndx = 0; ndx < this.portals.length; ndx++) {
				this.portals[ndx].sendUpdate();
			}
			
			for (var ndx = 0; ndx < this.locations.length; ndx++) {
				this.locations[ndx].sendUpdate();
			}
		},
		
		/**
		 * Add the given Location to the PressureEngine's array of Locations.
		 * 
		 * @param {hext.engines.Location} location the Location to add
		 */
		addLocation: function(location){
			var ndx = this.locations.indexOf(location);
			
			if (ndx == -1) {
				this.locations.push(location);
			}
		},
		
		/**
		 * Remove the specified Location from the PressureEngine's array of
		 * Locations.
		 * 
		 * @param {hext.engines.Location} location the Location to remove
		 * @return {hext.engines.Location} the removed Location or null
		 */
		removeLocation: function(location){
			var found = null;
			var ndx = this.locations.indexOf(location);
			
			if (ndx != -1) {
				var spliced = this.locations.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},
		
		/**
		 * Add the given Portal to the PressureEngine's array of Portals.
		 * 
		 * @param {hext.engines.Portal} portal the Portal to add
		 */
		addPortal: function(portal){
			var ndx = this.portals.indexOf(portal);
			
			if (ndx == -1) {
				this.portals.push(portal);
			}
		},
		
		/**
		 * Remove the specified Portal from the PressureEngine's array of
		 * Portals.
		 * 
		 * @param {hext.engines.Portal} portal the Portal to remove
		 * @return {hext.engines.Portal} the removed Portal or null
		 */
		removePortal: function(portal){
			var found = null;
			var ndx = this.portals.indexOf(portal);
			
			if (ndx != -1) {
				var spliced = this.portals.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		}
	});
	
	/**
	 * Create a Location that represents the outside world with an infinite
	 * volume.
	 * 
	 * @return {hext.engines.Location} the newly created Location
	 */
	hext.engines.createOutsideLocation = function(){
		var outside = new hext.engines.Location();
		outside.volume = INFINITE_VOLUME;

		return outside;
	};

	return hext;
})(hext || {});
