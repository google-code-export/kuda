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
	 * @class KeyDispatcher allows keyboard events to be sent out using the hemi dispatch system
	 * and allows the listeners of keyboard events to be octanned
	 * 
	 */
	var KeyDispatcher = function() {
		/*
		 * A mapping of citizen id to callback function name for keydown events
		 * @type hemi.utils.Hashtable
		 */
		this._keyDownListeners = new hemi.utils.Hashtable();
		/*
		 * A mapping of citizen id to callback function name for keyup events
		 * @type hemi.utils.Hashtable
		 */
		this._keyUpListeners = new hemi.utils.Hashtable();
		/*
		 * A mapping of citizen id to callback function name for keypress events
		 * @type hemi.utils.Hashtable
		 */
		this._keyPressListeners = new hemi.utils.Hashtable();
	};

	KeyDispatcher.prototype._msgSent = [hemi.msg.keyUp, hemi.msg.keyDown, hemi.msg.keyPress];

	/**
	 * Register for keyboard events in hemi.input 
	 */
	KeyDispatcher.prototype.init = function() {
		hemi.input.addKeyDownListener(this);
		hemi.input.addKeyUpListener(this);
		hemi.input.addKeyPressListener(this);

		hemi.keyDispatch = this;
	};

	/**
	 * Register for key down events
	 * 
	 * @param {hemi.citizen} the citizen to receive the event
	 * @param {string} the funciton to be called back
	 */
	KeyDispatcher.prototype.addKeyDownListener = function(listener, callbackName) {
		this._keyDownListeners.put(listener._getId(), callbackName);
		hemi.subscribe(hemi.msg.keyDown, listener, callbackName);
	};
 
 	/**
	 * Register for key up events
	 * 
	 * @param {hemi.citizen} the citizen to receive the event
	 * @param {string} the funciton to be called back
	 */
	KeyDispatcher.prototype.addKeyUpListener = function(listener, callbackName) {
		this._keyUpListeners.put(listener._getId(), callbackName);
		hemi.subscribe(hemi.msg.keyUp, listener, callbackName);
	};

	/**
	 * Register for key press events
	 * 
	 * @param {hemi.citizen} the citizen to receive the event
	 * @param {string} the funciton to be called back
	 */
	KeyDispatcher.prototype.addKeyPressListener = function(listener, callbackName) {
		this._keyPressListeners.put(listener._getId(), callbackName);
		hemi.subscribe(hemi.msg.keyPress, listener, callbackName);
	};

	/**
	 * Remove registration for key down events
	 * 
	 * @param {hemi.citizen} the citizen to stop receive the events
	 */
	KeyDispatcher.prototype.removeKeyDownListener = function(listener) {
		hemi.unsubscribe(listener, hemi.msg.keyDown);
		this._keyDownListeners.remove(listener._getId());
	};

	/**
	 * Remove registration for key up events
	 * 
	 * @param {hemi.citizen} the citizen to stop receive the events
	 */
	KeyDispatcher.prototype.removeKeyUpListener = function(listener) {
		hemi.unsubscribe(listener, hemi.msg.keyUp);
		this._keyUpListeners.remove(listener._getId());
	};

	/**
	 * Remove registration for key press events
	 * 
	 * @param {hemi.citizen} the citizen to stop receive the events
	 */
	KeyDispatcher.prototype.removeKeyPressListener = function(listener) {
		hemi.unsubscribe(listener, hemi.msg.keyDown);
		this._keyDownListeners.remove(listener._getId());
	};

	/**
	 * Keydown callback
	 * 
	 */
	KeyDispatcher.prototype.onKeyDown = function(event) {
		this.send(hemi.msg.keyDown, event);
	};

	/**
	 * Keyup callback
	 * 
	 */
	KeyDispatcher.prototype.onKeyUp = function(event) {
		this.send(hemi.msg.keyUp, event);
	};

	/**
	 * Keypress callback
	 * 
	 */
	KeyDispatcher.prototype.onKeyPress = function(event) {
		this.send(hemi.msg.keyPress, event);
	};

	/**
	 * Octane properties for KeyDispatcher.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	KeyDispatcher.prototype._octane = function() {
		return [{
			name: 'loadListeners',
			arg: [{
				keyDown: {citizens: this._keyDownListeners.keys(), callbacks: this._keyDownListeners.values()},
				keyUp: {citizens: this._keyUpListeners.keys(), callbacks: this._keyUpListeners.values()},
				keyPress: {citizens: this._keyPressListeners.keys(), callbacks: this._keyPressListeners.values()}
			}]
		},	{
			name: 'init',
			arg: []
		}];
	};

	/**
	 * Cleanup KeyDispatcher
	 * 
	 */
	KeyDispatcher.prototype._cleanup = function() {
		hemi.KeyDispatch = null;
		hemi.input.removeKeyDownListener(this);
		hemi.input.removeKeyUpListener(this);
		hemi.input.removeKeyPressListener(this);
	};

	/**
	 * Setup listeners after being restored from octane
	 * 
	 */
	KeyDispatcher.prototype.loadListeners = function(listeners) {
		for (var count = 0; count < listeners.keyDown.citizens.length; ++count) {
			this.addKeyDownListener(hemi.world.getCitizenById(listeners.keyDown.citizens[count]), listeners.keyDown.callbacks[count]);
		}
		for (var count = 0; count < listeners.keyUp.citizens.length; ++count) {
			this.addKeyUpListener(hemi.world.getCitizenById(listeners.keyUp.citizens[count]), listeners.keyUp.callbacks[count]);
		}
		for (var count = 0; count < listeners.keyPress.citizens.length; ++count) {
			this.addKeyPressListener(hemi.world.getCitizenById(listeners.keyPress.citizens[count]), listeners.keyPress.callbacks[count]);
		}
	};

	hemi.makeCitizen(KeyDispatcher, 'hemi.KeyDispatcher', {
		toOctane: KeyDispatcher.prototype._octane
	});

	/**
	 * Create a KeyDispatcher singleton
	 * 
	 */
	var keyDispatch = new hemi.KeyDispatcher();
	keyDispatch.init();
})();