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

/**
 * Create the requestAnimationFrame function if needed. Each browser implements it as a different
 * name currently. Default to a timeout if not supported. Credit to
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
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
 * @version 2.0.0
 */
 var hemi = hemi || {};

(function() {

		/*
		 * The function to pass errors thrown using hemi.error. Default is to throw a new Error.
		 * @type function(string):void
		 */
	var errCallback = null,
		/*
		 * The current frames per second that are enforced by Hemi.
		 * @type number
		 * @default 60
		 */
		fps = 60,
		/*
		 * Cached inverse of the frames per second.
		 * @type number
		 */
		hz = 1 / fps,
		/*
		 * Cached inverse of the frames per millisecond. (Internal time is in milliseconds)
		 * @type number
		 */
		hzMS = hz * 1000,
		/*
		 * The time of the last render in milliseconds.
		 * @type {number}
		 */
		lastRenderTime = 0,
		/*
		 * Map of initialized renderers by the id of their DOM element's parent node.
		 * @type {Object}
		 */
		renderers = {},
		/*
		 * Array of render listener objects that all have an onRender function.
		 * @type Object[]
		 */
		renderListeners = [],
		/*
		 * The index of the render listener currently running onRender().
		 * @type number
		 */
		renderNdx = -1;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Conversion factor for degrees to radians.
	 * @type number
	 * @default Math.PI / 180
	 */
	hemi.DEG_TO_RAD = Math.PI / 180;

	/**
	 * Half of Pi
	 * @type number
	 * @default Math.PI / 2
	 */
	hemi.HALF_PI = Math.PI / 2;

	/**
	 * Conversion factor for radians to degrees.
	 * @type number
	 * @default 180 / Math.PI
	 */
	hemi.RAD_TO_DEG = 180 / Math.PI;

	/**
	 * The version of Hemi released: 2/14/2012
	 * @constant
	 */
	hemi.version = '2.0.0';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The list of Clients being rendered on the current webpage.
	 */
	hemi.clients = [];

	/*
	 * Get the renderer associated with the given DOM id. If no renderer matches the id, the first
	 * available renderer (if any) is returned.
	 * 
	 * @param {string} domId id of the parent node of the renderer DOM element
	 * @return {THREE.WebGLRenderer} a matching or available renderer, or null
	 */
	hemi._getRenderer = function(domId) {
		var renderer = renderers[domId];

		if (!renderer) {
			console.log('No rendererer matches id ' + domId);
			renderer = null;

			// If there's at least one renderer currently, just return that for convenience
			for (var id in renderers) {
				renderer = renderers[id];
				break;
			}
		}

		return renderer;
	};

	/*
	 * Search the webpage for any divs with an ID starting with "kuda" and create a canvas within
	 * each div that will be rendered to using WebGL.
	 */
	hemi._makeRenderers = function() {
		var elements = document.getElementsByTagName('div');

		for (var i = 0, il = elements.length; i < il; ++i) {
			var element = elements[i],
				id = element.id;

			if (id && id.match(/^kuda/)) {
				if (renderers[id]) {
					console.log('Renderer already exists for id ' + id);
				} else {
					var renderer = getRenderer(element);

					if (renderer) {
						var dom = renderer.domElement;
						element.appendChild(dom);
						dom.style.width = "100%";
						dom.style.height = "100%";
						hemi.input.init(dom);

						renderers[id] = renderer;
					}
				}
			}
		}
	};

	/**
	 * Utility function to reset the render listeners. This should typically not be used.
	 * 
	 * @param {Object[]} opt_listeners optional set of new render listeners
	 * @return {Object[]} the previous set of render listeners
	 */
	hemi._resetRenderListeners = function(opt_listeners) {
		var oldListeners = renderListeners;
		renderListeners = opt_listeners || [];
		return oldListeners;
	};

	/**
	 * Add the given render listener to hemi. A listener must implement the onRender function.
	 * 
	 * @param {Object} listener the render listener to add
	 */
	hemi.addRenderListener = function(listener) {
		if (renderListeners.indexOf(listener) === -1) {
			renderListeners.push(listener);
		}
	};

	/**
	 * Pass the given error message to the registered error handler or throw an Error if no handler
	 * is registered.
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
	 * Get the Client that is rendering the given Transform.
	 * 
	 * @param {hemi.Transform} transform the Transform to get the Client for
	 * @return {hemi.Client} the Client rendering the Transform, or null
	 */
	hemi.getClient = function(transform) {
		var scene = transform.parent;

		while (scene.parent !== undefined) {
			scene = scene.parent;
		}

		for (var i = 0, il = hemi.clients.length; i < il; ++i) {
			var client = hemi.clients[i];

			if (scene === client.scene) {
				return client;
			}
		}

		return null;
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
	 * Get the time that the specified animation frame occurs at.
	 *
	 * @param {number} frame frame number to get the time for
	 * @return {number} time that the frame occurs at in seconds
	 */
	hemi.getTimeOfFrame = function(frame) {
		return frame * hz;
	};

	/**
	 * Initialize hemi features. This does not need to be called if hemi.makeClients() is called,
	 * but it can be used on its own if you don't want to use hemi's client system.
	 * 
	 * @param {Object} opt_config optional configuration parameters
	 */
	hemi.init = function(opt_config) {
		var handler = opt_config && opt_config.resizeHandler ? opt_config.resizeHandler : resize;
		window.addEventListener('resize', handler, false);

		lastRenderTime = new Date().getTime();
		render(true);
	};

	/**
	 * Create a Client for each rendered canvas on the page.
	 * 
	 * @param {Object} opt_config optional configuration parameters
	 * @return {hemi.Client[]} array of all existing Clients
	 */
	hemi.makeClients = function(opt_config) {
		var shared = opt_config.shared;

		hemi._makeRenderers();

		for (var id in renderers) {
			var renderer = renderers[id];

			if (shared[id]) {
				var shareArr = shared[id],
					client = new hemi.SharedClient(true, shareArr[0]),
					scene = client.scene;

				renderer.enableScissorTest(true);
				client.setRenderer(renderer);

				for (var i = 1, il = shareArr.length; i < il; ++i) {
					client = new hemi.SharedClient(false, shareArr[i]);
					client.setCamera(new hemi.Camera());
					client.setScene(scene);
					client.setRenderer(renderer);
				}
			} else {
				var client = new hemi.Client(true);
				client.setRenderer(renderer);
			}
		}

		hemi.init(opt_config);
		return hemi.clients;
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

			if (ndx <= renderNdx) {
				// Adjust so that the next render listener will not get skipped.
				renderNdx--;
			}
		}

		return retVal;
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
	 * Set the current frames-per-second that will be enforced for rendering.
	 * 
	 * @param {number} newFps frames-per-second to enforce
	 */
	hemi.setFPS = function(newFps) {
		fps = newFps;
		hz = 1/fps;
		hzMS = hz * 1000;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the supported renderer for the browser (WebGL or canvas) If WebGL is not supported,
	 * display a warning message.
	 * 
	 * @param {Object} element DOM element to add warning message to if necessary
	 * @return {THREE.WebGLRenderer} the supported renderer or null
	 */
	function getRenderer(element) {
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
	}

	/*
	 * The render function to be executed on each animation frame. Calls onRender for each render
	 * listener and then for each Client.
	 * 
	 * @param {boolean} update flag to force Clients to render
	 */
	function render(update) {
		requestAnimationFrame(render);

		var renderTime = new Date().getTime(),
			event = {
				elapsedTime: hz
			};

		while (renderTime - lastRenderTime > hzMS) {
			update = true;
			lastRenderTime += hzMS;

			for (renderNdx = 0; renderNdx < renderListeners.length; ++renderNdx) {
				renderListeners[renderNdx].onRender(event);
			}
		}

		renderNdx = -1;

		if (update) {
			for (var i = 0, il = hemi.clients.length; i < il; ++i) {
				hemi.clients[i].onRender(event);
			}
		}
	}

	/*
	 * Window resize handler function.
	 */
	function resize() {
		for (var i = 0; i < hemi.clients.length; ++i) {
			hemi.clients[i]._resize();
		}
	}

})();
