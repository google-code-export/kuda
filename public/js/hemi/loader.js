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

var hemi = (function(hemi) {

	var colladaLoader = new THREE.ColladaLoader(),
		resetCB = null,
		taskCount = 1;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * The relative path from the referencing HTML file to the Kuda directory.
	 * @type string
	 * @default ''
	 */
	hemi.loadPath = '';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the correct path for the given URL. If the URL is absolute, then leave it alone.
	 * Otherwise prepend it with the load path.
	 * 
	 * @param {string} url the url to update
	 * @return {string} the udpated url
	 */
	hemi.getLoadPath = function(url) {
		if (url.substr(0, 4) === 'http') {
			return url;
		} else {
			return hemi.loadPath + url;
		}
	};

	/**
	 * Load the HTML file at the given url and pass it to the given callback
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(string):void} callback a function to pass the loaded HTML data
	 */
	hemi.loadHtml = function(url, callback) {
		url = hemi.getLoadPath(url);

		hemi.utils.get(url, function(data, status) {
			if (data === null) {
				hemi.error(status);
			} else {
				callback(data);
			}
		});
	};

	/**
	 * Load the COLLADA file at the given url and pass it to the given callback
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(Object):void} callback a function to pass the loaded COLLADA data
	 */
	hemi.loadCollada = function(url, callback) {
		url = hemi.getLoadPath(url);
		++taskCount;

		colladaLoader.load(url, function (collada) {
			if (callback) {
				callback(collada);
			}

			decrementTaskCount();
		});
	};

	/**
	 * Load the image file at the given URL. If an error occurs, it is logged. Otherwise the given
	 * callback is executed and passed the loaded image.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(Image):void} callback a function to pass the loaded image
	 */
	hemi.loadImage = function(url, callback) {
		var img = new Image();
		++taskCount;

		img.onabort = function() {
			hemi.error('Aborted loading: ' + url);
			decrementTaskCount();
		};
		img.onerror = function() {
			hemi.error('Error loading: ' + url);
			decrementTaskCount();
		};
		img.onload = function() {
			callback(img);
			decrementTaskCount();
		};

		img.src = hemi.getLoadPath(url);
	};

	/**
	 * Load the Octane file at the given URL. If an error occurs, an alert is  thrown. Otherwise the
	 * loaded data is decoded into JSON and passed to the Octane module. If the Octane is for an
	 * object, it is created and passed to the given optional callback. If the Octane is for a
	 * World, the current World is cleaned up and the new World is created. The given optional
	 * callback is then executed after hemi.ready().
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function([Object]):void} opt_callback an optional function to either pass the Object
	 *     created or execute after the created World's ready function is called
	 */
	hemi.loadOctane = function(url, opt_callback) {
		url = hemi.getLoadPath(url);
		++taskCount;

		hemi.utils.get(url, function(data, status) {
			decrementTaskCount();

			if (data === null) {
				hemi.error(status);
			} else {
				if (typeof data === 'string') {
					data = JSON.parse(data);
				}

				var obj = hemi.fromOctane(data);

				if (!data.type) {
					hemi.makeClients();
					hemi.ready();
				}

				if (opt_callback) {
					opt_callback(obj);
				}
			}
		});
	};

	/**
	 * Load the texture at the given URL. If an error occurs, an alert is thrown. Otherwise the
	 * given callback is executed and passed the texture.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(THREE.Texture):void} callback a function to pass the loaded texture
	 */
	hemi.loadTexture = function(url, callback) {
		hemi.loadImage(url, function(image) {
			var texture = new THREE.Texture(image);
			texture.needsUpdate = true;
			callback(texture);
		});
	};

	/**
	 * Activate the World once all resources are loaded. This function should
	 * only be called after all scripting and setup is complete.
	 */
	hemi.ready = decrementTaskCount;

	/**
	 * Make sure all outstanding load tasks are completed and then reset the
	 * load task count.
	 *
	 * @param {function():void} opt_callback an optional function to call when
	 *     the load tasks have been reset
	 */
	hemi.resetLoadTasks = function(opt_callback) {
		resetCB = opt_callback;
		decrementTaskCount();
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	function decrementTaskCount() {
		if (--taskCount === 0) {
			taskCount = 1;
			hemi.send(hemi.msg.ready, {});

			if (resetCB) {
				resetCB();
				resetCB = null;
			}
		}
	}

	return hemi;
})(hemi || {});
