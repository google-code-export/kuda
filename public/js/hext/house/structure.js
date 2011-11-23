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
	 * @namespace A module for pre-defined household objects, with standard
	 * 		behaviors attached.
	 */
	hext.house = hext.house || {};

	/**
	 * @class Window is a pre-defined window that slides to a given point when clicked on
	 * @extends hemi.world.Citizen
	 * @param {THREE.Object3D} transform The transform containing the window shape
	 * @param {float} openPoint [x,y,z] point at which the window will be open
	 * @param {float} opt_time How many seconds the slide shall take by default
	 */	
	hext.house.Window = function(transform,openPoint,opt_time) {
		this.translator = new hemi.Translator(transform);
		this.openPoint = openPoint;
		this.time = opt_time || 1;
		this.closed = true;
		var that = this;
		hemi.subscribe(hemi.msg.pick, function(msg) {
				that.pickCallback.call(that, msg);
			});		
	};

	hext.house.Window.prototype = {

		/** 
		 * Open the window.
		 * @param {float} opt_time How many seconds the slide open shall take
		 */
		open : function(opt_time) {
			var time = opt_time || this.time;
			if (this.closed) {
				this.closed = false;
				if(!this.translator.move(new THREE.Vector3(this.openPoint[0], this.openPoint[1], this.openPoint[2]),
					time,true)) {
					this.closed = true;
				}
			}
		},

		/**
		 * Close the window.
		 * @param {float} opt_time How many seconds the closing slide shall take
		 */
		close : function(opt_time) {
			var time = opt_time || this.time;
			if (!this.closed) {
				this.closed = true;
				var reverse = new THREE.Vector3(this.openPoint[0], this.openPoint[1], this.openPoint[2]);
				reverse.multiplyScalar(-1);
				if(!this.translator.move(reverse, time, true)) {
					this.closed = false;
				}
			}		
		},

		/**
		 * Slide the window, toggling the open/closed state.
		 * @param {float} opt_time How many seconds the slide shall take
		 */
		slide : function(opt_time) {
			if (this.closed) {
				this.open(opt_time);
			} else {
				this.close(opt_time);
			}
		},

		/**
		 * Set the callback to be executed when the window begins opening.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */
		onOpening : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.start, function(msg) {
				if (!that.closed) callback(msg);
				});
		},

		/**
		 * Set the callback to be executed when the window finishes opening.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onOpen : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.stop, function(msg) {
				if (!that.closed) callback(msg);
			});		
		},

		/**
		 * Set the callback to be executed when the window begins closing.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onClosing : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.start, function(msg) {
				if (that.closed) callback(msg);
			});	
		},

		/**
		 * Set the callback to be executed when the window finishes closing.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */		
		onClosed : function(callback) {
			var that = this;
			this.translator.subscribe(hemi.stop, function(msg) {
				if (that.closed) callback(msg);
			});
		},

		/**
		 * Set the callback to be executed when a pick message comes in from the world.
		 * @param {function(hemi.dispatch.Message)} callback Function to execute
		 */
		onPick : function(callback) {
			this.pickCallback = callback;
		},

		/**
		 * Default pick message callback, slides the window if the translator transform has been picked.
		 * @param {hemi.dispatch.Message} msg Message generated describing a pick event
		 */
		pickCallback : function(msg) {
			if (msg.data.pickedMesh ==
				this.translator.transformObjs[0]) {
					this.slide();
			}
		}		

	};

	return hext;
})(hext || {});
