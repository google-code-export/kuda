/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var hemi = (function(hemi) {
	
	/**
	 * @class A Scene represents a logical grouping of behavior, events, and
	 * interactions. It can be used to determine when various interactions are
	 * valid or if various events should be enabled.
	 * @extends hemi.world.Citizen
	 */
	var State = function() {
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
		
	/**
	 * Send a cleanup Message and remove all references in the State.
	 */
	State.prototype.cleanup = function() {
		if (this.next !== null) {
			this.next.prev = this.prev;
		}
		if (this.prev !== null) {
			this.prev.next = this.next;
		}
		
		this.next = null;
		this.prev = null;
	};
	
	/**
	 * Get the Octane structure for the State.
     *
     * @return {Object} the Octane structure representing the State
	 */
	State.prototype.toOctane = function() {
		var octane = this._super();
		
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
	};
		
	/**
	 * Load the State.
	 */
	State.prototype.load = function() {
		if (!this.isLoaded) {
			this.isLoaded = true;
			
			this.send(hemi.msg.load, {});
		}
	};
	
	/**
	 * Unload the State.
	 */
	State.prototype.unload = function() {
		if (this.isLoaded) {
			this.isLoaded = false;
			
			this.send(hemi.msg.unload, {});
		}
	};
		
	/**
	 * Unload the State and move to the next State (if it has been set).
	 */
	State.prototype.nextState = function() {
		if (this.isLoaded && this.next != null) {
			this.unload();
			this.next.load();
		}
	};
	
	/**
	 * Unload the State and move to the previous State (if it has been set).
	 */
	State.prototype.previousState = function() {
		if (this.isLoaded && this.prev != null) {
			this.unload();
			this.prev.load();
		}
	};
	
	hemi.makeCitizen(State, 'hemi.State', {
		msgs: [hemi.msg.load, hemi.msg.unload],
		toOctane: []
	});
	
	return hemi;
})(hemi || {});
