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
	
	var colladaLoader = new THREE.ColladaLoader(),
		taskCount = 1,
	
		decrementTaskCount = function() {
			if (--taskCount === 0) {
				taskCount = 1;
				hemi.send(hemi.msg.ready, {});
			}
		},
		
		/*
		 * Get the correct path for the given URL. If the URL is absolute, then
		 * leave it alone. Otherwise prepend it with the load path.
		 * 
		 * @param {string} url the url to update
		 * @return {string} the udpated url
		 */
		getPath = function(url) {
			if (url.substr(0, 4) === 'http') {
				return url;
			} else {
				return hemi.loadPath + url;
			}
		};
		
	/**
	 * The relative path from the referencing HTML file to the Kuda directory.
	 * @type string
	 * @default ''
	 */
	hemi.loadPath = '';
	
	hemi.loadCollada = function(url, callback) {
		url = getPath(url);
		++taskCount;
		
		colladaLoader.load(url, function (collada) {
			if (callback) {
				callback(collada);
			}
			
			decrementTaskCount();
		});
	};
	
	hemi.ready = decrementTaskCount;
	
	return hemi;
})(hemi || {});
