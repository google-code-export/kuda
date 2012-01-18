/*
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 SRI International
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated  documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the  Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {
	
	/**
	 * @class A State represents a logical grouping of behavior, events, and
	 * interactions. It can be used to determine when various interactions are
	 * valid or if various events should be enabled.
	 */
	var State = function() {
		/**
		 * Flag indicating if the State is currently loaded.
		 * @type boolean
		 * @default false
		 */
		this.isLoaded = false;
		
		/**
		 * The next State to move to after this one.
		 * @type hemi.State
		 */
		this.next = null;
		
		/**
		 * The previous State that occurred before this one.
		 * @type hemi.State
		 */
		this.prev = null;
        
        
	};
		
	/** 
     * Remove all references in the State
     */
     State.prototype._clean = function() {
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
    /**
	 * Octane properties for State.
	 * 
	 * @type String[]
	 */
	State.prototype._octane = ['next', 'prev'];
    
    /**
     * Message types sent by State.
     *
     * @return (Object[]} Array of message types sent.
     */
    State.prototype._msgSent = [hemi.msg.load, hemi.msg.unload];
    
	hemi.makeCitizen(State, 'hemi.State', {
		toOctane: State.prototype._octane,
        cleanup: State.prototype._clean
	});	
})();
