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

	var mouseDownListeners = [],
		mouseUpListeners = [],
		mouseMoveListeners = [],
		mouseWheelListeners = [],
		keyDownListeners = [],
		keyUpListeners = [],
		keyPressListeners = [];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @namespace A module for handling all keyboard and mouse input.
	 */
	hemi.input = hemi.input || {};

	/**
	 * Setup the listener lists and register the event handlers.
	 */
	hemi.input.init = function(canvas) {
		canvas.addEventListener('mousedown', function(event) {
			hemi.input.mouseDown(event);
		}, true);
		canvas.addEventListener('mousemove', function(event) {
			hemi.input.mouseMove(event);
		}, true);
		canvas.addEventListener('mouseup', function(event) {
			hemi.input.mouseUp(event);
		}, true);
		canvas.addEventListener('mousewheel', function(event) {
			hemi.input.scroll(event);
		}, false);
		canvas.addEventListener('DOMMouseScroll', function(event) {
			hemi.input.scroll(event);
		}, false);

		document.addEventListener('keypress', function(event) {
			hemi.input.keyPress(event);
		}, true);
		document.addEventListener('keydown', function(event) {
			hemi.input.keyDown(event);
		}, true);
		document.addEventListener('keyup', function(event) {
			hemi.input.keyUp(event);
		}, true);
	};

	/**
	 * Register the given listener as a "mouse down" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseDown()
	 */
	hemi.input.addMouseDownListener = function(listener) {
		addListener(mouseDownListeners, listener);
	};

	/**
	 * Register the given listener as a "mouse up" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseUp()
	 */
	hemi.input.addMouseUpListener = function(listener) {
		addListener(mouseUpListeners, listener);
	};

	/**
	 * Register the given listener as a "mouse move" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseMove()
	 */
	hemi.input.addMouseMoveListener = function(listener) {
		addListener(mouseMoveListeners, listener);
	};

	/**
	 * Register the given listener as a "mouse wheel" listener.
	 *  
	 * @param {Object} listener an object that implements onScroll()
	 */
	hemi.input.addMouseWheelListener = function(listener) {
		addListener(mouseWheelListeners, listener);
	};
   
	/**
	 * Register the given listener as a "key down" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyDown()
	 */
    hemi.input.addKeyDownListener = function(listener) {
		addListener(keyDownListeners, listener);
    };

	/**
	 * Register the given listener as a "key up" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyUp()
	 */
    hemi.input.addKeyUpListener = function(listener) {
		addListener(keyUpListeners, listener);
    };

	/**
	 * Register the given listener as a "key press" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyPress()
	 */
    hemi.input.addKeyPressListener = function(listener) {
		addListener(keyPressListeners, listener);
    };

	/**
	 * Remove the given listener from the list of "mouse down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseDownListener = function(listener) {
		return removeListener(mouseDownListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "mouse up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseUpListener = function(listener) {
		return removeListener(mouseUpListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "mouse move" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseMoveListener = function(listener) {
		return removeListener(mouseMoveListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "mouse wheel" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseWheelListener = function(listener) {
		return removeListener(mouseWheelListeners, listener);
	};

	/**
	 * Remove the given listener from the list of "key down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyDownListener = function(listener) {
		return removeListener(keyDownListeners, listener);
    };

	/**
	 * Remove the given listener from the list of "key up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyUpListener = function(listener) {
		return removeListener(keyUpListeners, listener);
    };

	/**
	 * Remove the given listener from the list of "key press" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyPressListener = function(listener) {
		return removeListener(keyPressListeners, listener);
    };

	/**
	 * Handle the event generated by the user pressing a mouse button down.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse
	 *     down" listeners
	 */
	hemi.input.mouseDown = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < mouseDownListeners.length; ndx++) {
			mouseDownListeners[ndx].onMouseDown(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user releasing a pressed mouse button.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse up"
	 *     listeners
	 */
	hemi.input.mouseUp = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < mouseUpListeners.length; ndx++) {
			mouseUpListeners[ndx].onMouseUp(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user moving the mouse.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse
	 *     move" listeners
	 */
	hemi.input.mouseMove = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < mouseMoveListeners.length; ndx++) {
			mouseMoveListeners[ndx].onMouseMove(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user scrolling a mouse wheel.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "mouse
	 *     wheel" listeners
	 */
	hemi.input.scroll = function(event) {
        var newEvent = getRelativeEvent(event);
        newEvent.deltaY = event.detail ? -event.detail : event.wheelDelta;
        cancelEvent(event);
		for (var ndx = 0; ndx < mouseWheelListeners.length; ndx++) {
			mouseWheelListeners[ndx].onScroll(newEvent);
		}
	};

	/**
	 * Handle the event generated by the user pressing a key down.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "key down"
	 *     listeners
	 */
    hemi.input.keyDown = function(event) {
        for (var ndx = 0; ndx < keyDownListeners.length; ndx++) {
            keyDownListeners[ndx].onKeyDown(event);
        }
    };

	/**
	 * Handle the event generated by the user releasing a pressed key.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "key up"
	 *     listeners
	 */
    hemi.input.keyUp = function(event) {
        for (var ndx = 0; ndx < keyUpListeners.length; ndx++) {
            keyUpListeners[ndx].onKeyUp(event);
        }
    };

	/**
	 * Handle the event generated by the user pressing a key down and releasing it.
	 * 
	 * @param {Object} event information about the event which is passed on to registered "key
	 *     press" listeners
	 */
    hemi.input.keyPress = function(event) {
        for (var ndx = 0; ndx < keyPressListeners.length; ndx++) {
            keyPressListeners[ndx].onKeyPress(event);
        }
    };

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Add the given listener to the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to add to
	 * @param {Object} listener object to add
	 */
	function addListener(listenerSet, listener) {
		listenerSet.push(listener);
	}

	/*
	 * Remove the given listener from the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to remove from
	 * @param {Object} listener object to remove
	 * @return {Object} the removed listener if successful or null 
	 */
	function removeListener(listenerSet, listener) {
		var ndx = listenerSet.indexOf(listener),
			found = null;

		if (ndx !== -1) {
			found = listenerSet.splice(ndx, 1)[0];
		}

		return found;
	}

	function getRelativeXY(event) {
		var element = event.target ? event.target : event.srcElement,
			xy = {x: 0, y: 0};

		for (var e = element; e; e = e.offsetParent) {
			xy.x += e.offsetLeft;
			xy.y += e.offsetTop;
		}

		xy.x = event.pageX - xy.x;
		xy.y = event.pageY - xy.y;

		return xy;
	}

	function getRelativeEvent(event) {
		var newEvent = hemi.utils.clone(event, false),
			xy = getRelativeXY(newEvent);

		newEvent.x = xy.x;
		newEvent.y = xy.y;

		return newEvent;
	}

	function cancelEvent(event) {
		if (!event) event = window.event;

		event.cancelBubble = true;

		if (event.stopPropagation) event.stopPropagation();
		if (event.preventDefault) event.preventDefault();
	}

})();
