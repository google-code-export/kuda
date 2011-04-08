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
	hemi.utils = hemi.utils || {};
	
	/**
	 * Create a copy of the given Object (or array).
	 * 
	 * @param {Object} src an Object (or array) to clone
	 * @param {boolean} opt_deep optional flag to indicate if deep copying
	 *     should be performed (default is deep copying)
	 * @return {Object} the created Object (or array)
	 */
	hemi.utils.clone = function(src, opt_deep) {
		var dest = hemi.utils.isArray(src) ? [] : {},
			opt_deep = opt_deep == null ? true : opt_deep;
		
		hemi.utils.join(dest, src, opt_deep);
		return dest;
	};
	
	/**
	 * Compare the two given arrays of numbers. The arrays should be the same
	 * length.
	 * 
	 * @param {number[]} a the first array
	 * @param {number[]} b the second array
	 * @return {boolean} true if the arrays are equal
	 */
	hemi.utils.compareArrays = function(a, b) {
		var eq = a.length === b.length;
		
		for (var i = 0; eq && i < a.length; i++) {
			if (a[i] instanceof Array) { 
				eq = hemi.utils.compareArrays(a[i], b[i]);
			} else {
				eq = Math.abs(a[i] - b[i]) <= 0.001;
			}
		}
		
		return eq;
	};
	
	/**
	 * Create a deep copy of the given array, even if it has nested arrays.
	 * 
	 * @param {number[]} a the array to copy
	 * @return {number[]} the created array
	 */
	hemi.utils.copyArray = function(a) {
		var b = [a.length];
		
		for (var i = 0, il = a.length; i < il; i++) {
			if (a[i] instanceof Array) { 
				b[i] = hemi.utils.copyArray(a[i]);
			} else {
				b[i] = a[i];
			}
		}
		
		return b;
	};
	
	/**
	 * Perform an asynchronous AJAX GET for the resource at the given URL.
	 * 
	 * @param {string} url url of the resource to get
	 * @param {function(string, string):void)} callback function to pass the
	 *     data retrieved from the URL as well as the status text of the request
	 */
	hemi.utils.get = function(url, callback) {
		var xhr = new window.XMLHttpRequest();
		
		xhr.onreadystatechange = function() {
			if (this.readyState === 4) {
				this.onreadystatechange = hemi.utils.noop;
				var data = null;
				
				if (this.status === 200 || window.location.href.indexOf('http') === -1) {
					var ct = this.getResponseHeader('content-type');
					
					if (ct && ct.indexOf('xml') >= 0) {
						data = this.responseXML;
					} else {
						data = this.responseText;
					}
				}
				
				callback(data, this.statusText);
			}
		};
		xhr.open('GET', url, true);
		
		try {
			xhr.send(null);
		} catch (err) {
			callback(null, err.name + ': ' + err.message);
		}
	};
	
	/** 
	 * The "best" way to test if a value is an array or not.
	 *
	 * @param {Object} val value to test
	 * @return {boolean} true if the value is an array
	 */
	hemi.utils.isArray = Array.isArray || function(val) {
		return Object.prototype.toString.call(val) === '[object Array]';
	};
	
	/**
	 * Merge all of the properties of the given objects into the first object.
	 * If any of the objects have properties with the same name, the later
	 * properties will overwrite earlier ones. The exception to this is if both
	 * properties are objects or arrays and the merge is doing a deep copy. In
	 * that case, the properties will be merged recursively.
	 * 
	 * @param {Object} obj1 the first object which will receive all properties
	 * @param {Object} objN any number of objects to copy properties from
	 * @param {boolean} opt_deep optional flag to indicate if deep copying
	 *     should be performed (default is deep copying)
	 * @return {Object} the first object now merged with all other objects
	 */
	hemi.utils.join = function() {
		var target = arguments[0],
			il = arguments.length,
			lastArg = arguments[il - 1],
			deep = true;
		
		if (typeof lastArg === 'boolean') {
			deep = lastArg;
			--il;
		}
		
		for (var i = 1; i < il; i++) {
			var obj = arguments[i];
			
			for (var j in obj) {
				var src = obj[j];
				
				if (deep && src != null && typeof src === 'object') {
					var dest = target[j],
						srcArr = hemi.utils.isArray(src);
					
					if (dest == null || typeof dest !== 'object' || hemi.utils.isArray(dest) !== srcArr) {
						dest = srcArr ? [] : {};
					}
					
					target[j] = hemi.utils.join(dest, src);
				} else {
					target[j] = src;
				}
			}
		}
		
		return target;
	};
	
	/**
	 * A no-operation function for utility use.
	 */
	hemi.utils.noop = function() {};
	
	return hemi;
})(hemi || {});
