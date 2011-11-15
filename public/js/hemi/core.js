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


/*
 * Because Internet Explorer does not support Array.indexOf(), we can add
 * it in so that subsequent calls do not break.
 *
 * @param {Object} obj
 */
if (!Array.indexOf) {
	Array.prototype.indexOf = function(obj) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] == obj) {
				return i;
			}
		}
		return -1;
	};
}

/**
 * Create the requestAnimationFrame function if needed. Each browser implements
 * it as d different name currently. Default to a timeout if not supported.
 * Credit to http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * and others...
 */
if (!window.requestAnimationFrame) {
	window.requestAnimationFrame = (function() {
		return window.mozRequestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function(callback, element) {
				window.setTimeout(callback, 1000 / 60);
			};
	})();
}

/**
 * @namespace The core Hemi library used by Kuda.
 * @version 1.5.0
 */
var hemi = (function(hemi) {
	
	var errCallback = null,
	
		fps = 60,
		
		hz = 1 / fps,
	
		/*
		 * The time of the last render in seconds.
		 * @type {number}
		 */
		lastRenderTime = 0,
	
		renderListeners = [],
		
		getRenderer = function(element) {
			var renderer = null;
			
			if (Detector.webgl) {
				renderer = new THREE.WebGLRenderer();
			} else {
				if (Detector.canvas) {
					renderer = new THREE.CanvasRenderer();
				}
				
				Detector.addGetWebGLMessage({
					id: 'warn_' + element.id,
					parent: element
				});
				
				(function(elem) {
					setTimeout(function() {
						var msg = document.getElementById('warn_' + elem.id);
						elem.removeChild(msg);
					}, 5000);
				})(element);
			}
			
			return renderer;
		},
		
		render = function(update) {
			requestAnimationFrame(render);
			
			var renderTime = new Date().getTime() * 0.001,
				event = {
					elapsedTime: hz
				};
			
			while (renderTime - lastRenderTime > hz) {
				update = true;
				lastRenderTime += hz;
				
				for (var i = 0; i < renderListeners.length; ++i) {
					renderListeners[i].onRender(event);
				}
			}
			
			if (update) {
				for (var i = 0; i < hemi.clients.length; ++i) {
					hemi.clients[i].onRender(event);
				}
			}
		},
		
		resize = function() {
			for (var i = 0; i < hemi.clients.length; ++i) {
				hemi.clients[i].resize();
			}
		};
	
	/**
	 * The version of Hemi released: 10/11/11
	 * @constant
	 */
	hemi.version = '1.5.0';
	
	/**
	 * The list of Clients being rendered on the current webpage.
	 */
	hemi.clients = [];
	
	/**
	 * Search the webpage for any divs with an ID starting with "kuda" and
	 * create a Client and canvas within each div that will be rendered to using
	 * WebGL.
	 */
	hemi.makeClients = function() {
		var elements = document.getElementsByTagName('div'),
			clients = [];
		
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			
			if (element.id && element.id.match(/^kuda/)) {
				var renderer = getRenderer(element);
				
				if (renderer) {
					var client = new hemi.Client(renderer);
					
					element.appendChild(renderer.domElement);
					hemi.clients.push(client);
					clients.push(client);
				}
			}
		}
		
		hemi.init();
		return clients;
	};

	/**
	 * Initialize hemi features. This does not need to be called if
	 * hemi.makeClients() is called, but it can be used on its own if you don't
	 * want to use hemi's client system.
	 */
	hemi.init = function() {
		resize();
		window.addEventListener('resize', resize, false);
		lastRenderTime = new Date().getTime() * 0.001;
		render(true);
	};
	
	/**
	 * Add the given render listener to hemi. A listener must implement the
	 * onRender function.
	 * 
	 * @param {Object} listener the render listener to add
	 */
	hemi.addRenderListener = function(listener) {
		var ndx = renderListeners.indexOf(listener);
		
		if (ndx === -1) {
			renderListeners.push(listener);
		}
	};

	/**
	 * Remove the given render listener from hemi.
	 * 
	 * @param {Object} listener the render listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.removeRenderListener = function(listener) {
		var ndx = renderListeners.indexOf(listener),
			retVal = null;
		
		if (ndx !== -1) {
			retVal = renderListeners.splice(ndx, 1)[0];
		}

		return retVal;
	};
	
	/**
	 * Pass the given error message to the registered error handler or throw an
	 * Error if no handler is registered.
	 * 
	 * @param {string} msg error message
	 */
	hemi.error = function(msg) {
		if (errCallback) {
			errCallback(msg);
		} else {
			var err = new Error(msg);
			err.name = 'HemiError';
			throw err;
		}
	};

	/**
	 * Get the time that the specified animation frame occurs at.
	 *
	 * @param {number} frame frame number to get the time for
	 * @return {number} time that the frame occurs at
	 */
	hemi.getTimeOfFrame = function(frame) {
		return frame * hz;
	};
	
	/**
	 * Set the given function as the error handler for Hemi errors.
	 * 
	 * @param {function(string):void} callback error handling function
	 */
	hemi.setErrorCallback = function(callback) {
		errCallback = callback;
	};
	
	/**
	 * Get the current frames-per-second that will be enforced for rendering.
	 * 
	 * @return {number} current frames-per-second
	 */
	hemi.getFPS = function() {
		return fps;
	};

	/**
	 * Set the current frames-per-second that will be enforced for rendering.
	 * 
	 * @param {number} newFps frames-per-second to enforce
	 */
	hemi.setFPS = function(newFps) {
		fps = newFps;
		hz = 1/fps;
	};
	
	return hemi;
})(hemi || {});
