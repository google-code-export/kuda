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
