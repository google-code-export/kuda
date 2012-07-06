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


	var progressTable = new Hashtable(),
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
	 * @param {Object} options load options for the COLLADA loader
	 */
	hemi.loadCollada = function(url, callback, options) {
		var loader = new THREE.ColladaLoader();

		if (options) {
			hemi.utils.join(loader.options, options);
		}

		url = hemi.getLoadPath(url);
		++taskCount;
		createTask(url);

		loader.load(url, function (collada) {
			if (callback) {
				callback(collada);
			}
			updateTask(url, 100);
			decrementTaskCount();
		}, function(progress) {
			if (progress.loaded !== null && progress.total !== null) {
				updateTask(url, (progress.loaded / progress.total) * 100);
			}
		});
	};

	hemi.loadUTF8 = function(url, callback, options) {
		var loader = new THREE.UTF8Loader();
		
		url = hemi.getLoadPath(url);
		++taskCount;
		createTask(url);

		loader.load(url, function(result) {
			if (callback) {
				callback(result);
			}
			updateTask(url, 100);
			decrementTaskCount();
		}, options);
	};

	hemi.loadJson = function(url, callback) {
		var loader = new THREE.JSONLoader();

		genericLoad(url, callback, loader);
	};

	hemi.loadBinary = function(url, callback) {
		var loader = new THREE.BinaryLoader();

		genericLoad(url, callback, loader);
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

				if (!data.type) {
					// Assume we are loading a full world from Octane
					hemi._makeRenderers();
					hemi.init();
				}

				var obj = hemi.fromOctane(data);

				if (!data.type) {
					hemi.ready();
				}

				if (opt_callback) {
					opt_callback(obj);
				}
			}
		}, 'application/json');
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
			updateTask(url, 100);
			var texture = new THREE.Texture(image);
			texture.needsUpdate = true;
			callback(texture);
		});

		createTask(url);
	};

	/**
	 * Load the texture at the given URL. If an error occurs, an alert is thrown. Otherwise the
	 * given callback is executed and passed the texture. This function return a created (but not
	 * yet loaded) texture synchronously.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda directory
	 * @param {function(THREE.Texture):void} callback a function to pass the loaded texture
	 * @return {THREE.Texture} the created (but not yet loaded) texture
	 */
	hemi.loadTextureSync = function(url, callback) {
		var img = new Image(),
			texture = new THREE.Texture(img);

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
			texture.needsUpdate = true;
			callback(texture);
			decrementTaskCount();
		};

		img.src = hemi.getLoadPath(url);
		return texture;
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
		taskCount = 1;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Create a new progress task with the given name. Initialize its
	 * progress to 0.
	 * 
	 * @param {string} name the unique name of the task
	 * @return {boolean} true if the task was created successfully, false if
	 *      another task with the given name already exists
	 */
	function createTask(name) {
		if (progressTable.get(name) !== null) {
			return false;
		}
		
		var obj = {
			percent: 0
		};
		
		progressTable.put(name, obj);
		updateTotal();
		return true;
	}

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

	/*
	 * Update the progress of the task with the given name to the given percent.
	 * 
	 * @param {string} name name of the task to update
	 * @param {number} percent percent to set the task's progress to (0-100)
	 * @return {boolean} true if the task was found and updated
	 */
	function updateTask(name, percent) {
		var task = progressTable.get(name),
			update = task !== null;
		
		if (update) {
			task.percent = percent;
			
			hemi.send(hemi.msg.progress, {
				task: name,
				percent: percent,
				isTotal: false
			});
			
			updateTotal();
		}
		
		return update;
	}
	
	/*
	 * Send an update on the total progress of all loading activities, and clear
	 * the progress table if they are all finished.
	 */
	function updateTotal() {
		var total = progressTable.size(),
			values = progressTable.values(),
			percent = 0;
			
		for (var ndx = 0; ndx < total; ndx++) {
			var fileObj = values[ndx];
			
			percent += fileObj.percent / total;
		}
		
		hemi.send(hemi.msg.progress, {
			task: 'Total Progress',
			isTotal: true,
			percent: percent
		});
		
		if (percent >= 99.9) {
			progressTable.clear();
		}
		
		return percent;
	}

	function genericLoad(url, callback, loader) {
		url = hemi.getLoadPath(url);
		++taskCount;
		createTask(url);

		loader.load(url, function(result) {
			if (callback) {
				callback(result);
			}
			updateTask(url, 100);
			decrementTaskCount();
		});
	}

})();
