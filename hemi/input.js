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

o3djs.require('hemi.core');

var hemi = (function(hemi) {	
	/**
	 * @namespace A module for handling all keyboard and mouse input.
	 */
	hemi.input = hemi.input || {};
	
	/**
	 * Setup the listener lists and register the event handlers.
	 */
	hemi.input.init = function() {
		hemi.input.mouseDownListeners = [];
		hemi.input.mouseUpListeners = [];
		hemi.input.mouseMoveListeners = [];
		hemi.input.mouseWheelListeners = [];
        hemi.input.keyDownListeners = [];
        hemi.input.keyUpListeners = [];
        hemi.input.keyPressListeners = [];
		
		hemi.core.event.addEventListener(hemi.core.o3dElement, 'mousedown', hemi.input.mouseDown);
		hemi.core.event.addEventListener(hemi.core.o3dElement, 'mousemove', hemi.input.mouseMove);
		hemi.core.event.addEventListener(hemi.core.o3dElement, 'mouseup', hemi.input.mouseUp);
		hemi.core.event.addEventListener(hemi.core.o3dElement, 'wheel', hemi.input.scroll);
//        hemi.core.event.addEventListener(hemi.core.o3dElement, 'keypress', hemi.input.keyPress);
//        hemi.core.event.addEventListener(hemi.core.o3dElement, 'keydown', hemi.input.keyDown);
//        hemi.core.event.addEventListener(hemi.core.o3dElement, 'keyup', hemi.input.keyUp);
	};
	
	/**
	 * Register the given listener as a "mouse down" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseDown()
	 */
	hemi.input.addMouseDownListener = function(listener) {
		addListener(hemi.input.mouseDownListeners, listener);
	};
	
	/**
	 * Register the given listener as a "mouse up" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseUp()
	 */
	hemi.input.addMouseUpListener = function(listener) {
		addListener(hemi.input.mouseUpListeners, listener);
	};
	
	/**
	 * Register the given listener as a "mouse move" listener.
	 *  
	 * @param {Object} listener an object that implements onMouseMove()
	 */
	hemi.input.addMouseMoveListener = function(listener) {
		addListener(hemi.input.mouseMoveListeners, listener);
	};
	
	/**
	 * Register the given listener as a "mouse wheel" listener.
	 *  
	 * @param {Object} listener an object that implements onScroll()
	 */
	hemi.input.addMouseWheelListener = function(listener) {
		addListener(hemi.input.mouseWheelListeners, listener);
	};
    
	/**
	 * Register the given listener as a "key down" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyDown()
	 */
    hemi.input.addKeyDownListener = function(listener) {
		if (!this.hasKeyDownListener) {
			jQuery(document).bind("keydown.coreInput", function(event) {
				hemi.input.keyDown(event);
			});
			this.hasKeyDownListener = true;
		}
		addListener(hemi.input.keyDownListeners, listener);
    };
    
	/**
	 * Register the given listener as a "key up" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyUp()
	 */
    hemi.input.addKeyUpListener = function(listener) {
		if (!this.hasKeyUpListener) {
			jQuery(document).bind("keyup.coreInput", function(event) {
				hemi.input.keyUp(event);
			});
			this.hasKeyUpListener = true;
		}
		addListener(hemi.input.keyUpListeners, listener);
    };
    
	/**
	 * Register the given listener as a "key press" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyPress()
	 */
    hemi.input.addKeyPressListener = function(listener) {
		if (!this.hasKeyPressListener) {
			jQuery(document).bind("keypress.coreInput", function(event) {
				hemi.input.keyPress(event);
			});
			this.hasKeyPressListener = true;
		}
		addListener(hemi.input.keyPressListeners, listener);
    };
	
	/**
	 * Remove the given listener from the list of "mouse down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseDownListener = function(listener) {
		return removeListener(hemi.input.mouseDownListeners, listener);
	};
	
	/**
	 * Remove the given listener from the list of "mouse up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseUpListener = function(listener) {
		return removeListener(hemi.input.mouseUpListeners, listener);
	};
	
	/**
	 * Remove the given listener from the list of "mouse move" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseMoveListener = function(listener) {
		return removeListener(hemi.input.mouseMoveListeners, listener);
	};
	
	/**
	 * Remove the given listener from the list of "mouse wheel" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.input.removeMouseWheelListener = function(listener) {
		return removeListener(hemi.input.mouseWheelListeners, listener);
	};
    
	/**
	 * Remove the given listener from the list of "key down" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyDownListener = function(listener) {
		return removeListener(hemi.input.keyDownListeners, listener);
    };
    
	/**
	 * Remove the given listener from the list of "key up" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyUpListener = function(listener) {
		return removeListener(hemi.input.keyUpListeners, listener);
    };
    
	/**
	 * Remove the given listener from the list of "key press" listeners.
	 * 
	 * @param {Object} listener the listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
    hemi.input.removeKeyPressListener = function(listener) {
		return removeListener(hemi.input.keyPressListeners, listener);
    };
	
	/**
	 * Handle the event generated by the user pressing a mouse button down.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse down" listeners
	 */
	hemi.input.mouseDown = function(event) {
		for (var ndx = 0; ndx < hemi.input.mouseDownListeners.length; ndx++) {
			hemi.input.mouseDownListeners[ndx].onMouseDown(event);
		}
	};
	
	/**
	 * Handle the event generated by the user releasing a pressed mouse button.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse up" listeners
	 */
	hemi.input.mouseUp = function(event) {
		for (var ndx = 0; ndx < hemi.input.mouseUpListeners.length; ndx++) {
			hemi.input.mouseUpListeners[ndx].onMouseUp(event);
		}
	};
	
	/**
	 * Handle the event generated by the user moving the mouse.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse move" listeners
	 */
	hemi.input.mouseMove = function(event) {
		for (var ndx = 0; ndx < hemi.input.mouseMoveListeners.length; ndx++) {
			hemi.input.mouseMoveListeners[ndx].onMouseMove(event);
		}
	};
	
	/**
	 * Handle the event generated by the user scrolling a mouse wheel.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse wheel" listeners
	 */
	hemi.input.scroll = function(event) {
		for (var ndx = 0; ndx < hemi.input.mouseWheelListeners.length; ndx++) {
			hemi.input.mouseWheelListeners[ndx].onScroll(event);
		}
	};
    
	/**
	 * Handle the event generated by the user pressing a key down.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "key down" listeners
	 */
    hemi.input.keyDown = function(event) {
        for (var ndx = 0; ndx < hemi.input.keyDownListeners.length; ndx++) {
            hemi.input.keyDownListeners[ndx].onKeyDown(event);
        }
    };
    
	/**
	 * Handle the event generated by the user releasing a pressed key.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "key up" listeners
	 */
    hemi.input.keyUp = function(event) {
        for (var ndx = 0; ndx < hemi.input.keyUpListeners.length; ndx++) {
            hemi.input.keyUpListeners[ndx].onKeyUp(event);
        }
    };
    
	/**
	 * Handle the event generated by the user pressing a key down and releasing
	 * it.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "key press" listeners
	 */
    hemi.input.keyPress = function(event) {
        for (var ndx = 0; ndx < hemi.input.keyPressListeners.length; ndx++) {
            hemi.input.keyPressListeners[ndx].onKeyPress(event);
        }
    };
	
	// Internal functions
	
	/*
	 * Add the given listener to the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to add to
	 * @param {Object} listener object to add
	 */
	var addListener = function(listenerSet, listener) {
		listenerSet.push(listener);
	};
	
	/*
	 * Remove the given listener from the given set of listeners.
	 * 
	 * @param {Object[]} listenerSet list to remove from
	 * @param {Object} listener object to remove
	 * @return {Object} the removed listener if successful or null 
	 */
	var removeListener = function(listenerSet, listener) {
        var found = null;
		var ndx = listenerSet.indexOf(listener);
		
		if (ndx != -1) {
			var spliced = listenerSet.splice(ndx, 1);
			
			if (spliced.length == 1) {
				found = spliced[0];
			}
		}
        
        return found;
	};
	
	return hemi;
})(hemi || {});
