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
	 * @namespace A module for creating timers that can be used for scripting
	 * and behavior.
	 */	
	hemi.time = hemi.time || {};
	
	/**
	 * @class A Timer is a simple countdown timer that can be used to script
	 * behavior and sequence events.
	 * @extends hemi.world.Citizen
	 */
	hemi.time.Timer = hemi.world.Citizen.extend({
		init: function() {
			this._super();
		
			/*
			 * The epoch time that this Timer was last started (or resumed)
			 * @type number
			 */
			this._started = null;
			/*
			 * The elapsed time (not including any currently running JS timer)
			 * @type number
			 */
			this._time = 0;
			/*
			 * The id of the current JS timer
			 * @type number
			 */
			this._timeId = null;
			/**
			 * The time the timer will start counting down from (milliseconds).
			 * @type number
			 * @default 1000
			 */
			this.startTime = 1000;
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
        citizenType: 'hemi.time.Timer',
		
		/**
		 * Send a cleanup Message and remove all references in the Timer.
		 */
		cleanup: function() {
			this._super();
			
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				this._started = null;
			}
		},
		
		/**
		 * Pause the Timer if it is currently running.
		 */
		pause: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				
				var stopped = (new Date()).getTime();
				this._time += (stopped - this._started);
			}
		},
		
		/**
		 * Reset the Timer so it is ready to count down again.
		 */
		reset: function() {
			this._started = null;
			this._time = 0;
			this._timeId = null;
		},
		
		/**
		 * Resume the Timer's count down if it is currently paused.
		 */
		resume: function() {
			if (this._timeId === null && this._started !== null) {
				this._timeId = setTimeout(handleTimeout,
					this.startTime - this._time, this);
				this._started = (new Date()).getTime();
			}
		},
		
		/**
		 * Start the Timer's count down. If it is currently running, restart the
		 * Timer from its initial count down value.
		 */
		start: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
			}
			
			this._time = 0;
			this.send(hemi.msg.start, {
				time: this.startTime
			});
			this._timeId = setTimeout(handleTimeout, this.startTime, this);
			this._started = (new Date()).getTime();
		},
		
		/**
		 * Stop the Timer if it is currently running or paused. This resets any
		 * currently elapsed time on the Timer.
		 */
		stop: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				var stopped = (new Date()).getTime();
				this._time += (stopped - this._started);
			}
			
			if (this._started !== null) {
				var elapsed = this._time;
				this.reset();
				this.send(hemi.msg.stop, {
					time: elapsed
				});
			}
		},
		
		/**
		 * Get the Octane structure for the Timer.
	     *
	     * @return {Object} the Octane structure representing the Timer
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'startTime',
				val: this.startTime
			});
			
			return octane;
		}
	});
	
	hemi.time.Timer.prototype.msgSent =
		hemi.time.Timer.prototype.msgSent.concat([hemi.msg.start, hemi.msg.stop]);
	
	/*
	 * Utility to handle the Timer naturally finishing its countdown.
	 */
	var handleTimeout = function(timer) {
		timer.reset();
		timer.send(hemi.msg.stop, {
			time: timer.startTime
		});
	};
	
	return hemi;
})(hemi || {});
