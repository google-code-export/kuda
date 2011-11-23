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
