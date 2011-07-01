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
	 * @namespace A module for grouping world events and behavior into logical
	 * scenes.
	 */	
	hemi.scene = hemi.scene || {};
	
	/**
	 * @class A Scene represents a logical grouping of behavior, events, and
	 * interactions. It can be used to determine when various interactions are
	 * valid or if various events should be enabled.
	 * @extends hemi.world.Citizen
	 */
	hemi.scene.Scene = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * Flag indicating if the Scene is currently loaded.
		 * @type boolean
		 * @default false
		 */
		this.isLoaded = false;
		
		/**
		 * The next Scene to move to after this one.
		 * @type hemi.scene.Scene
		 */
		this.next = null;
		
		/**
		 * The previous Scene that occurred before this one.
		 * @type hemi.scene.Scene
		 */
		this.prev = null;
	};
	
	hemi.scene.Scene.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
        citizenType: 'hemi.scene.Scene',
		
		/**
		 * Send a cleanup Message and remove all references in the Scene.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			
			if (this.next !== null) {
				this.next.prev = this.prev;
			}
			if (this.prev !== null) {
				this.prev.next = this.next;
			}
			
			this.next = null;
			this.prev = null;
		},
	
		/**
		 * Get the Octane structure for the Scene.
	     *
	     * @return {Object} the Octane structure representing the Scene
		 */
		toOctane: function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			if (this.next === null) {
				octane.props.push({
					name: 'next',
					val: null
				});
			} else {
				octane.props.push({
					name: 'next',
					id: this.next.getId()
				});
			}
			
			if (this.prev === null) {
				octane.props.push({
					name: 'prev',
					val: null
				});
			} else {
				octane.props.push({
					name: 'prev',
					id: this.prev.getId()
				});
			}
			
			return octane;
		},
		
		/**
		 * Load the Scene.
		 */
		load: function() {
			if (!this.isLoaded) {
				this.isLoaded = true;
				
				this.send(hemi.msg.load, {});
			}
		},
		
		/**
		 * Unload the Scene.
		 */
		unload: function() {
			if (this.isLoaded) {
				this.isLoaded = false;
				
				this.send(hemi.msg.unload, {});
			}
		},
		
		/**
		 * Unload the Scene and move to the next Scene (if it has been set).
		 */
		nextScene: function() {
			if (this.isLoaded && this.next != null) {
				this.unload();
				this.next.load();
			}
		},
		
		/**
		 * Unload the Scene and move to the previous Scene (if it has been set).
		 */
		previousScene: function() {
			if (this.isLoaded && this.prev != null) {
				this.unload();
				this.prev.load();
			}
		}
	};
	
	hemi.scene.Scene.inheritsFrom(hemi.world.Citizen);
	hemi.scene.Scene.prototype.msgSent =
		hemi.scene.Scene.prototype.msgSent.concat([hemi.msg.load, hemi.msg.unload]);
	
	return hemi;
})(hemi || {});
