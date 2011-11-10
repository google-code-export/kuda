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
	
		/*
		 * The time of the last render in seconds.
		 * @type {number}
		 */
		lastRenderTime = 0,
	
		renderListeners = [],
		
		render = function() {
			requestAnimationFrame(render);
			
			var renderTime = new Date().getTime() * 0.001,
				elapsed = lastRenderTime === 0 ? 0 : renderTime - lastRenderTime,
				event = {
					elapsedTime: elapsed
				};
			
			lastRenderTime = renderTime;
			
			for (var i = 0; i < hemi.clients.length; ++i) {
				hemi.clients[i].onRender(event);
			}
			
			for (var i = 0; i < renderListeners.length; ++i) {
				renderListeners[i].onRender(event);
			}
		};
	
	/**
	 * The version of Hemi released: 10/11/11
	 * @constant
	 */
	hemi.version = '1.5.0';
	
	hemi.clients = [];
	
	hemi.makeClients = function() {
		var elements = document.getElementsByTagName('div'),
			clients = [];
		
		// TODO: test for WebGL and fallback to canvas renderer
		if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
		
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			
			if (element.id && element.id.match(/^kuda/)) {
				var renderer = new THREE.WebGLRenderer(),
					client = new hemi.Client(renderer);
				
				renderer.setSize(window.innerWidth, window.innerHeight);
				element.appendChild(renderer.domElement);
				hemi.clients.push(client);
				clients.push(client);
			}
		}
		
		render();
		return clients;
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
	 * Set the given function as the error handler for Hemi errors.
	 * 
	 * @param {function(string):void} callback error handling function
	 */
	hemi.setErrorCallback = function(callback) {
		errCallback = callback;
	};

	hemi.init = function() {
		hemi.picking.init();
		hemi.input.init();
		hemi.view.init();
		hemi.curve.init();
		hemi.model.init();
		hemi.effect.init();
		hemi.hud.init();
		hemi.shape.init();
		hemi.sprite.init();
		hemi.world.init();
	};
	
	return hemi;
})(hemi || {});
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

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var hemi = (function(hemi){
    var initializing = false, 
		fnTest = /xyz/.test(function(){
	        xyz;
	    }) ? /\b_super\b/ : /.*/;
    
    // The base Class implementation (does nothing)
    hemi.Class = function(){};
    
    // Create a new Class that inherits from this class
    hemi.Class.extend = function(prop){
        var _super = this.prototype;
        
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
            typeof _super[name] == "function" &&
            fnTest.test(prop[name]) ? (function(name, fn){
                return function(){
                    var tmp = this._super;
                    
                    // Add a new ._super() method that is the same method
                    // but on the super-class
                    this._super = _super[name];
                    
                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }
        
        // The dummy class constructor
        function Class(){
            // All construction is actually done in the init method
            if (!initializing && this.init) 
                this.init.apply(this, arguments);
        }
        
        // Populate our constructed prototype object
        Class.prototype = prototype;
        
        // Enforce the constructor to be what we expect
        Class.constructor = Class;
        
        // And make this class extendable
        Class.extend = arguments.callee;
        
        return Class;
    };
	
	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module to provide various utilities for Hemi.
	 */
	hemi.utils = hemi.utils || {};
	
	/*
	 * Here we extend Hashtable to allow it to be queried for Object attributes
	 * that are not the Hash key.
	 */
	hemi.utils.Hashtable = Hashtable;
	
	/**
	 * Search the Hashtable for values with attributes that match the given
	 * set of attributes. The attributes may be single values or arrays of
	 * values which are alternatives.
	 * @example
	 * query({
	 *     a: 1
	 *     b: [2, 3]
	 * });
	 * 
	 * will return any values that have a === 1 and b === 2 or b === 3
	 * 
	 * @param {Object} attributes a set of attributes to search for
	 * @return {Object[]} an array of matching values
	 */
	hemi.utils.Hashtable.prototype.query = function(attributes) {
		var values = this.values(),
			props = [],
			arrProps = [],
			results = [],
			value,
			propName,
			propVal,
			propArr,
			pN,
			aN,
			aL,
			match;
		
		// Copy the property names out of the attributes object just once
		// since this is less efficient than a simple array.
		for (x in attributes) {
			if (hemi.utils.isArray(attributes[x])) {
				arrProps.push(x);
			} else {
				props.push(x);
			}
		}
		
		var pLen = props.length,
			aLen = arrProps.length;
		
		for (var ndx = 0, len = values.length; ndx < len; ndx++) {
			value = values[ndx];
			match = true;
			// First test the single value properties.
			for (pN = 0; match && pN < pLen; pN++) {
				propName = props[pN];
				match = value[propName] === attributes[propName];
			}
			// Next test the array of value properties.
			for (pN = 0; match && pN < aLen; pN++) {
				match = false;
				propName = arrProps[pN];
				propVal = value[propName];
				propArr = attributes[propName];
				aL = propArr.length;
				// Search through the array until we find a match for the
				// Hashtable value's property.
				for (aN = 0; !match && aN < aL; aN++) {
					match = propVal === propArr[aN];
				}
			}
			// If it all matches up, we'll return it.
			if (match) {
				results.push(value);
			}
		}
		
		return results;
	};
	
	return hemi;
})(hemi || {});
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
	 * General function to convert from cartesian to spherical coordinates.
	 *
	 * @param {number[3]} coords XYZ cartesian coordinates
	 * @return {number[3]} Radius, Theta, Phi
	 */
	hemi.utils.cartesianToSpherical = function(coords) {
		var x = coords[0];
		var y = coords[1];
		var z = coords[2];
		var r = Math.sqrt(x*x + y*y + z*z);
		var theta = Math.acos(y/r);
		var phi = Math.atan2(x,z);
		return [r,theta,phi];	
	};
	
	/** 
	 * A choose function (also called the binomial coefficient).
	 *
	 * @param {number} n top input of choose
	 * @param {number} m bottom input of choose
	 * @return {number} choose output, (n!)/(m!*(n-m)!)
	 */
	hemi.utils.choose = function(n, m) {
		return hemi.utils.factorial(n, (n-m)+1) / hemi.utils.factorial(m);
	};
	
	/** 
	 * Clamp the given value between the given min and max.
	 *
	 * @param {number} val value to clamp
	 * @param {number} min minimum for value
	 * @param {number} max maximum for value
	 * @return {number} the clamped value
	 */
	hemi.utils.clamp = function(val, min, max) {
		return Math.min(max, Math.max(min, val));
	};

	/**
	 * Calculate the cubic hermite interpolation between two points with
	 * associated tangents.
	 *
	 * @param {number} t time (between 0 and 1)
	 * @param {number[3]} p0 the first waypoint
	 * @param {number[3]} m0 the tangent through the first waypoint
	 * @param {number[3]} p1 the second waypoint
	 * @param {number[3]} m1 the tangent through the second waypoint
	 * @return {number[3]} the interpolated point
	 */
	hemi.utils.cubicHermite = function(t,p0,m0,p1,m1) {;
		var t2 = t*t,
			t3 = t2*t,
			tp0 = 2*t3 - 3*t2 + 1,
			tm0 = t3 - 2*t2 + t,
			tp1 = -2*t3 + 3*t2,
			tm1 = t3 - t2;
		
		return tp0*p0 + tm0*m0 + tp1*p1 + tm1*m1;
	};
	
	/**
	 * Calculate the factorial of the given number.
	 *
	 * @param {number} num number to factorialize
	 * @param {number} opt_stop optional number to stop the factorial at (if it
	 *     should be stopped before 1
	 * @return {number} (num!) or (num! - opt_stop!)
	 */
	hemi.utils.factorial = function(num, opt_stop) {
		var f = 1,
			x = opt_stop ? opt_stop : 2;
		
		while (x <= num) {
			f *= x++;
		}
		
		return f;
	};
	
	/**
	 * Calculate the intersection between a ray and a plane.
	 * 
	 * @param {o3d.Ray} ray Ray described by a near xyz point and a far xyz point
	 * @param {number[3][3]} plane Array of 3 xyz coordinates defining a plane
	 * @return {number[3]} Array [t: Time value on ray, u: U-coordinate on plane,
	 *		v: V-coordinate on plane} of intersection point
	 */
	hemi.utils.intersect = function(ray, plane) {
		var P = plane,
			R = [ray.near,ray.far],
			A = hemi.core.math.inverse(
			[[R[0][0]-R[1][0],P[1][0]-P[0][0],P[2][0]-P[0][0]],
			 [R[0][1]-R[1][1],P[1][1]-P[0][1],P[2][1]-P[0][1]],
			 [R[0][2]-R[1][2],P[1][2]-P[0][2],P[2][2]-P[0][2]]]),
			B = [R[0][0]-P[0][0],R[0][1]-P[0][1],R[0][2]-P[0][2]],
			t = A[0][0]*B[0] + A[0][1]*B[1] + A[0][2]*B[2],
			u = A[1][0]*B[0] + A[1][1]*B[1] + A[1][2]*B[2],
			v = A[2][0]*B[0] + A[2][1]*B[1] + A[2][2]*B[2];
		
		return [t,u,v];
	};
	
	/**
	 * Convert the given linear interpolated value to a sinusoidal interpolated
	 * value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the sinusoidal value
	 */
	hemi.utils.linearToSine = function(val) {
		return (Math.sin(Math.PI * val - Math.PI / 2) + 1) / 2;
	};
	
	/**
	 * Convert the given linear interpolated value to a parabolic interpolated
	 * value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the parabolic value
	 */
	hemi.utils.linearToParabolic = function(val) {
		return val * val;
	};
	
	/**
	 * Convert the given linear interpolated value to a inverse parabolic
	 * interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the inverse parabolic value
	 */
	hemi.utils.linearToParabolicInverse = function(val) {
		return 1 - (1 - val) * (1 - val);
	};
	
	/**
	 * Convert the given linear interpolated value to an exponential
	 * interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the exponential value
	 */
	hemi.utils.linearToExponential = function(val, x) {
		return (Math.pow(x, val) - 1) / (x - 1);
	};
	
	/**
	 * Convert the given linear interpolated value to an inverse exponential
	 * interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the inverse exponential value
	 */
	hemi.utils.linearToExponentialInverse = function(val, x) {
		return 1 - hemi.utils.linearToExponential(1 - val, x);
	};
	
	/**
	 * A container for all the common penner easing equations - 
	 * 		linear
	 *		quadratic 
	 *		cubic
	 *		quartic
	 *		quintic
	 *		exponential
	 *		sinusoidal
	 *		circular
	 */
	hemi.utils.penner = {
	
		linearTween : function (t, b, c, d) {
			return c*t/d + b;
		},
		
		easeInQuad : function (t, b, c, d) {
			t /= d;
			return c*t*t + b;
		},
		
		easeOutQuad : function (t, b, c, d) {
			t /= d;
			return -c * t*(t-2) + b;
		},
		
		easeInOutQuad : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t + b;
			t--;
			return -c/2 * (t*(t-2) - 1) + b;
		},
	
		easeInCubic : function (t, b, c, d) {
			t /= d;
			return c*t*t*t + b;
		},
		
		easeOutCubic : function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t + 1) + b;
		},
		
		easeInOutCubic : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t + 2) + b;
		},
		
		easeInQuart : function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t + b;
		},
		
		easeOutQuart : function (t, b, c, d) {
			t /= d;
			t--;
			return -c * (t*t*t*t - 1) + b;
		},
		
		easeInOutQuart : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t + b;
			t -= 2;
			return -c/2 * (t*t*t*t - 2) + b;
		},
		
		easeInQuint : function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t*t + b;
		},
		
		easeOutQuint : function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t*t*t + 1) + b;
		},
		
		easeInOutQuint : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t*t*t + 2) + b;
		},
		
		easeInSine : function (t, b, c, d) {
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		
		easeOutSine : function (t, b, c, d) {
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		
		easeInOutSine : function (t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		},
		
		easeInExpo : function (t, b, c, d) {
			return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
		},
		
		easeOutExpo : function (t, b, c, d) {
			return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
		},
		
		easeInOutExpo : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
			t--;
			return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
		},
		
		easeInCirc : function (t, b, c, d) {
			t /= d;
			return -c * (Math.sqrt(1 - t*t) - 1) + b;
		},
		
		easeOutCirc : function (t, b, c, d) {
			t /= d;
			t--;
			return c * Math.sqrt(1 - t*t) + b;
		},
		
		easeInOutCirc : function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			t -= 2;
			return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
		}

	};
	
	hemi.utils.sphericalToCartesian = function(coords) {
		var r = coords[0];
		var t = coords[1];
		var p = coords[2];
		return [r*Math.sin(t)*Math.cos(p),	// x
				r*Math.sin(t)*Math.sin(p),  // y
				r*Math.cos(t)];				// z
	};
	
	/**
	 * Convert the given UV coordinates for the given plane into XYZ coordinates
	 * in 3D space.
	 * 
	 * @param {number[2]} uv uv coordinates on a plane
	 * @param {number[3][3]} plane array of 3 xyz coordinates defining the plane
	 * @return {number[3]} xyz coordinates of the uv location on the plane
	 */
	hemi.utils.uvToXYZ = function(uv, plane) {
		var hMath = hemi.core.math,
			uf = hMath.mulScalarVector(uv[0], hMath.subVector(plane[1], plane[0])),
			vf = hMath.mulScalarVector(uv[1], hMath.subVector(plane[2], plane[0]));
			pos = hMath.addVector(plane[0], hMath.addVector(uf, vf));
		return pos;
	};
	
	/**
	 * Calculate the screen coordinates from a 3d position in the world.
	 * @param {number[3]} p XYZ point to calculate from
	 * @return {number[2]} XY screen position of point
	 */
	hemi.utils.worldToScreen = function(p0) {
		var VM = hemi.view.viewInfo.drawContext.view,
			PM = hemi.view.viewInfo.drawContext.projection,
			w = hemi.view.clientSize.width,
			h = hemi.view.clientSize.height,
			m4 = hemi.core.math.matrix4,
			v = m4.transformPoint(VM,p0),
			z = v[2],
			p = m4.transformPoint(PM, v);
		
		if (z > 0) {
			p[0] = -p[0];
			p[1] = -p[1];
		}
		var x = (p[0]+1.0)*0.5*w;
		var y = (-p[1]+1.0)*0.5*h;
		return [Math.round(x),Math.round(y)];
	};
	
	/**
	 * Calculate the screen coordinates from a 3d position in the world.
	 * @param {number[3]} p XYZ point to calculate from
	 * @return {number[3]} XY screen position of point, plus z-distance,
	 *		where 0.0 = near clip and 1.0 = flar clip
	 */
	hemi.utils.worldToScreenFloat = function(p0) {
		var VM = hemi.view.viewInfo.drawContext.view,
			PM = hemi.view.viewInfo.drawContext.projection,
			w = hemi.view.clientSize.width,
			h = hemi.view.clientSize.height,
			m4 = hemi.core.math.matrix4,
			v = m4.transformPoint(VM,p0),
			z = v[2],
			p = m4.transformPoint(PM, v);
		
		if (z > 0) {
			p[0] = -p[0];
			p[1] = -p[1];
		}
		var x = (p[0]+1.0)*0.5*w;
		var y = (-p[1]+1.0)*0.5*h;
		return [x,y,p[2]];
	};
	
	return hemi;
})(hemi || {});
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
	 * Build a shader source string from the given parsed source structure.
	 * 
	 * @param {Object} parsed structure populated with parsed shader source:
	 *     (all fields are optional)
	 *     preHdr: source positioned before the header
	 *     hdr: header source
	 *     postHdr: source positioned after the header
	 *     preSprt: source positioned before the support
	 *     sprt: support source
	 *     postSprt: source positioned after the support
	 *     preBody: source positioned before the body
	 *     body: body source
	 *     postBody: source positioned after the body
	 *     preGlob: source positioned before the global
	 *     glob: global variable assignment source
	 *     postGlob: source positioned after the global
	 * @return {string} the new shader source string
	 */
	hemi.utils.buildSrc = function(parsed) {
		var src = (parsed.preHdr ? parsed.preHdr : '') +
			(parsed.hdr ? parsed.hdr : '') +
			(parsed.postHdr ? parsed.postHdr : '') +
			(parsed.preSprt ? parsed.preSprt : '') +
			(parsed.sprt ? parsed.sprt : '') +
			(parsed.postSprt ? parsed.postSprt : '') +
			parsed.main +
			(parsed.preBody ? parsed.preBody : '') +
			(parsed.body ? parsed.body : '') +
			(parsed.postBody ? parsed.postBody : '') +
			(parsed.preGlob ? parsed.preGlob : '') +
			(parsed.glob ? parsed.glob : '') +
			(parsed.postGlob ? parsed.postGlob : '') +
			parsed.end;
		
		return src;
	};
	
	/**
	 * Combine the given strings into one cohesive fragment shader source
	 * string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineFragSrc = function(src, cfg) {
		return this.combineSrc(src, cfg, 'gl_FragColor');
	};
	
	/**
	 * Combine the given strings into one cohesive shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @param {string} globName name of the global variable to set in main()
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineSrc = function(src, cfg, globName) {
		var parsed = this.parseSrc(src, globName);
		hemi.utils.join(parsed, cfg);
		return this.buildSrc(parsed);
	};
	
	/**
	 * Combine the given strings into one cohesive vertex shader source string.
	 * 
	 * @param {string} src the original shader source string
	 * @param {Object} cfg configuration object for how to build the new shader:
	 *     (all fields are optional)
	 *     preHdr: source to prepend to the existing header
	 *     hdr: source to replace the existing header
	 *     postHdr: source to append to the existing header
	 *     preSprt: source to prepend to the existing support
	 *     sprt: source to replace the existing support
	 *     postSprt: source to append to the existing support
	 *     preBody: source to prepend to the existing body
	 *     body: source to replace the existing body
	 *     postBody: source to append to the existing body
	 *     preGlob: source to prepend to the existing global
	 *     glob: source to replace the existing global variable assignment
	 *     postGlob: source to append to the existing global
	 * @return {string} the new shader source string
	 */
	hemi.utils.combineVertSrc = function(src, cfg) {
		return this.combineSrc(src, cfg, 'gl_Position');
	};
	
	/**
	 * Get the vertex and pixel shaders (as well as their source) for the given
	 * Material.
	 * 
	 * @param {o3d.Material} material the material to get shaders for
	 * @return {Object} object containing shaders and source strings
	 */
	hemi.utils.getShaders = function(material) {
		var gl = material.gl,
			program = material.effect.program_,
			shaders = gl.getAttachedShaders(program),
			source1 = gl.getShaderSource(shaders[0]),
			source2 = gl.getShaderSource(shaders[1]),
			obj;
		
		if (source1.search('gl_FragColor') > 0) {
			obj = {
				fragShd: shaders[0],
				fragSrc: source1,
				vertShd: shaders[1],
				vertSrc: source2
			};
		} else {
			obj = {
				fragShd: shaders[1],
				fragSrc: source2,
				vertShd: shaders[0],
				vertSrc: source1
			};
		}
		
		return obj;
	};
	
	/**
	 * Parse the given shader source into logical groupings as follows:
	 *   Header - uniform, attribute, and varying parameters
	 *   Support - support/utility functions
	 *   Body - all of the main function except Global
	 *   Global - where the shader's global variable is assigned
	 * 
	 * Example:
	 * (HEADER_START)
	 * #ifdef MYVAR
	 * #endif
	 * uniform mat4 worldViewProjection;
	 * attribute vec4 position;
	 * (HEADER_END)
	 * (SUPPORT_START)
	 * float getOne() {
	 *   return 1.0;
	 * }
	 * (SUPPORT_END)
	 * void main() {
	 *   (BODY_START)
	 *   float one = getOne();
	 *   vec4 realPos = worldViewProjection*position;
	 *   (BODY_END)
	 *   (GLOBAL_START)
	 *   gl_Position = realPos;
	 *   (GLOBAL_END)
	 * }
	 * 
	 * @param {string} src full shader source
	 * @param {string} global global variable assigned by shader
	 * @return {Object} structure populated with parsed shader source
	 */
	hemi.utils.parseSrc = function(src, global) {
		var hdrEnd = src.lastIndexOf(';', src.indexOf('{')) + 1,
			sprtEnd = src.indexOf('void main', hdrEnd),
			bodyStart = src.indexOf('{', sprtEnd) + 1,
			bodyEnd = src.indexOf(global, bodyStart),
			globEnd = src.lastIndexOf(';') + 1;
		
		if (src.charAt(hdrEnd) === '\n') {
			++hdrEnd;
		}
		if (src.charAt(bodyStart) === '\n') {
			++bodyStart;
		}
		if (src.charAt(bodyEnd) === '\n') {
			++bodyEnd;
		}
		if (src.charAt(globEnd) === '\n') {
			++globEnd;
		}
		
		var parsedSrc = {
			hdr: src.slice(0, hdrEnd),
			sprt: src.slice(hdrEnd, sprtEnd),
			main: src.slice(sprtEnd, bodyStart),
			body: src.slice(bodyStart, bodyEnd),
			glob: src.slice(bodyEnd, globEnd),
			end: src.slice(globEnd)
		};
		
		return parsedSrc;
	};
	
	return hemi;
})(hemi || {});
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
	
	/*
	 * Add a function to the Javascript string to remove whitespace from the
	 * beginning and end.
	 */
	String.prototype.trim = function() {
		return this.replace(/^\s*/, "").replace(/\s*$/, "");
	};
	
	/*
	 * Adds a method to the Javascript string to capitalize the first letter 
	 */
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	
	/**
	 * Test if the given string is numeric.
	 *  
	 * @param {string} str the string to test
	 * @return {boolean} true if the string can be converted directly to a number
	 */
	hemi.utils.isNumeric = function(str) {
		return !(str === null || isNaN(str) || str.length === 0);
	};
	
	
	/*
	 * A table of characters to break a line on (for text wrapping), weighted
	 * by preference.
	 */
	var breakable = new Hashtable();
	breakable.put(' ', 10);
	breakable.put(',', 20);
	breakable.put(';', 30);
	breakable.put('.', 10);
	breakable.put('!', 40);
	breakable.put('?', 40);
	
	/**
	 * Perform strict text wrapping on the given text. The returned text is
	 * guaranteed to be no wider than the specified target width, though it may
	 * be farther from that width than with loose text wrapping.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth maximum desired width for text in pixels
	 * @param {CanvasRenderingContext2D} canvas object used to measure text's
	 *     on-screen size
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapTextStrict = function(text, targetWidth, canvas) {
		var wrapLines = [],
			text = hemi.utils.cleanseText(text),
			textLength = text.length,
			metric = canvas.measureText(text),
			charWidth = metric.width / textLength,
			chars = Math.floor(targetWidth / charWidth),
			increment = Math.ceil(chars / 10),
			start = 0,
			end = chars,
			line, width;
		
		while (end < textLength) {
			line = text.substring(start, end).trim();
			metric = canvas.measureText(line);
			width = metric.width;
			
			while (width < targetWidth && end < textLength) {
				end += increment;
				
				if (end > textLength) {
					end = textLength;
				}
				
				line = text.substring(start, end).trim();
				metric = canvas.measureText(line);
				width = metric.width;
			}
			
			while (width > targetWidth) {
				end--;
				line = text.substring(start, end).trim();
				metric = canvas.measureText(line);
				width = metric.width;
			}
			
			var breakNdx = end - 1,
				ch = text.charAt(breakNdx);
			
			while (!breakable.containsKey(ch) && breakNdx > start) {
				breakNdx--;
				ch = text.charAt(breakNdx);
			}
			
			if (breakNdx > start) {
				end = breakNdx + 1;
			}
			
			line = text.substring(start, end).trim();
			wrapLines.push(line);
			start = end;
			end += chars;
		}
			
		if (start != textLength || wrapLines.length === 0) {
			line = text.substring(start, textLength).trim();
			wrapLines.push(line);
		}
		
		return wrapLines;
	};
	
	/**
	 * Perform loose text wrapping on the given text. The returned text will be
	 * close to the specified target width, but may be a little wider.
	 * 
	 * @param {string} text the string to perform text wrapping on
	 * @param {number} targetWidth desired width for text in pixels
	 * @param {number} charWidth average width of a character of the text in
	 *     pixels
	 * @return {string[]} array of wrapped text
	 */
	hemi.utils.wrapText = function(text, targetWidth, charWidth) {
		var wrapLines = [],
			text = hemi.utils.cleanseText(text),
			textLength = text.length,
			cols = parseInt(targetWidth / charWidth),
        	rows = Math.ceil(textLength / cols),
			start = cols,
			index = 0,
			last;
		
		for (var i = 0; i < rows - 1; i++) {
			last = index;
			index = bestBreak(text, start, 10);
			wrapLines.push(text.substring(last, index).trim());
			start = index + cols;
		}
		
		wrapLines.push(text.substring(index, textLength));
		return wrapLines;
	};
	
	/**
	 * Replace any newline characters in the text with spaces. This is used to
	 * prepare text for text wrapping.
	 * 
	 * @param {string} text string to clean
	 * @return {string} string with all newline characters replaced
	 */
	hemi.utils.cleanseText = function(text) {
		text = text.replace('\n', ' ');
		return text;
	};
	
	/*
	 * Internal function to calculate the "best" index to break a line of
	 * text at, given a certain weighted preference for characters to break on.
	 * 
	 * @param {string} text string of text to break into two lines
	 * @param {number} start estimated index the user would like to break at
	 * @param {number} radius maximum distance before and after the start index
	 *     to search for a "best" break
	 */
	function bestBreak(text, start, radius) {
		var bestIndex = start,
			bestWeight = 0,
			textLength = text.length,
			beginRadius = start - Math.max(start - radius, 0),
			endRadius = Math.min(start + radius, textLength - 1) - start,
			examWeight, weight;
		
		for (var i = parseInt(start - beginRadius); i <= start + endRadius; i++) {
			weight = breakable.get(text.charAt(i));
			if (weight === null) 
				continue;
			
			examWeight = weight / Math.abs(start - i);
			if (examWeight > bestWeight) {
				bestIndex = i;
				bestWeight = examWeight;
			}
		}
		
		return Math.min(bestIndex + 1, textLength - 1);
	};
	
	return hemi;
})(hemi || {});
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
	 * Check to see if the given Transform has key frame animations bound to it.
	 * 
	 * @param {o3d.Transform} transform the Transform to check
	 * @return {boolean} true if Transform has key frame animations
	 */
	hemi.utils.isAnimated = function(transform) {
		var lm = transform.getParam('o3d.localMatrix');
		
		return lm.inputConnection != null;
	};
	
	/**
	 * Create a new child Transform for the given Transform and move all of its
	 * current children and shapes onto the new child.
	 * 
	 * @param {o3d.Transform} transform the Transform to foster from
	 * @return {o3d.Transform} the created child Transform
	 */
	hemi.utils.fosterTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes,
			newTran = hemi.core.mainPack.createObject('Transform');
		
		while (children.length > 0) {
			children[0].parent = newTran;
		};
		
		newTran.parent = transform;
		
		while (shapes.length > 0) {
			var shape = shapes[0];
			newTran.addShape(shape);
			transform.removeShape(shape);
		}
		
		return newTran;
	};
	
	/**
	 * Interprets a point in world space into local space.
	 */
	hemi.utils.pointAsLocal = function(transform,point) {
		var m4 = hemi.core.math.matrix4;
		var W = m4.inverse(transform.getUpdatedWorldMatrix());
		return m4.transformPoint(W,point);
	};
	
	/**
	 * Interprets a point in local space into world space.
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		var m4 = hemi.core.math.matrix4;
		return m4.transformPoint(transform.getUpdatedWorldMatrix(),point);
	};
	
	/**
	 * Point the y axis of the given transform/matrix toward the given point.
	 *
	 * @param {o3d.Transform|number[4][4]} tran the transform/matrix to rotate
	 * @param {number[]} eye XYZ point from which to look (may be the origin)
	 * @param {number[]} target XYZ point at which to aim the y axis
	 * @return {o3d.Transform|number[4][4]} the rotated transform/matrix
	 */
	hemi.utils.pointYAt = function(tran, eye, target) {
		var dx = target[0] - eye[0],
			dy = target[1] - eye[1],
			dz = target[2] - eye[2],
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);
		
		if (tran.rotateY) {
			tran.rotateY(rotY);
			tran.rotateX(rotX);
		} else {
			hemi.core.math.matrix4.rotateY(tran, rotY);
			hemi.core.math.matrix4.rotateX(tran, rotX);
		}
		
		return tran;
	};
	
	/**
	 * Point the z axis of the given transform/matrix toward the given point.
	 *
	 * @param {o3d.Transform|number[4][4]} tran the transform/matrix to rotate
	 * @param {number[]} eye XYZ point from which to look (may be the origin)
	 * @param {number[]} target XYZ point at which to aim the z axis
	 * @return {o3d.Transform|number[4][4]} the rotated transform/matrix
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = hemi.core.math.subVector(target, eye),
			rotY = Math.atan2(delta[0], delta[2]),
			rotX = -Math.asin(delta[1] / hemi.core.math.length(delta));
		
		if (tran.rotateY) {
			tran.rotateY(rotY);
			tran.rotateX(rotX);
		} else {
			hemi.core.math.matrix4.rotateY(tran, rotY);
			hemi.core.math.matrix4.rotateX(tran, rotX);
		}
		
		return tran;
	};
	
	/**
	 * Move all of the children and shapes off of the given foster Transform and
	 * back to the original parent Transform. Destroy the foster Transform
	 * 
	 * @param {o3d.Transform} transform the foster Transform previously created
	 * @return {o3d.Transform} the original parent Transform
	 */
	hemi.utils.unfosterTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes,
			tParent = transform.parent;
		
		while (children.length > 0) {
			children[0].parent = tParent;
		};
	
		while (shapes.length > 0) {
			var shape = shapes[0];
			tParent.addShape(shape);
			transform.removeShape(shape);
		}
		
		transform.parent = null;
		hemi.core.mainPack.removeObject(transform);
		return tParent;
	};
	
	/**
	 * Rotate the transform by the given angle along the given world space axis.
	 *
	 * @param {number[]} axis rotation axis defined as an XYZ vector
	 * @param {number} angle amount to rotate by in radians
	 * @param {o3d.Transform} transform the transform to rotate
	 */
	hemi.utils.worldRotate = function(axis, angle, transform) {
		var m4 = hemi.core.math.matrix4,
			iW = m4.inverse(transform.getUpdatedWorldMatrix()),
			lA = m4.transformDirection(iW, axis);
		transform.axisRotate(lA, angle);
	};
	
	/**
	 * Scale the transform by the given scale amounts in world space.
	 *
	 * @param {number[]} scale scale factors defined as an XYZ vector
	 * @param {o3d.Transform} transform the transform to scale
	 */
	hemi.utils.worldScale = function(scale, transform) {
		var m4 = hemi.core.math.matrix4,
			newMatrix = m4.mul(
				m4.mul(
					m4.mul(
						transform.getUpdatedWorldMatrix(),
						m4.scaling(scale)),
					m4.inverse(transform.getUpdatedWorldMatrix())),
				transform.localMatrix);
		transform.localMatrix = newMatrix;
	};
	
	/**
	 * Translate the transform by the given world space vector.
	 *
	 * @param {number[]} v XYZ vector to translate by
	 * @param {o3d.Transform} transform the transform to translate
	 */
	hemi.utils.worldTranslate = function(v, transform) {
		var m4 = hemi.core.math.matrix4,
			iW = m4.inverse(transform.getUpdatedWorldMatrix()),
			lV = m4.transformDirection(iW, v);
		transform.translate(lV);
	};
	
	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for managing the string literals for Message types.
	 * @example
	 * The documentation for each Message type has an example of a typical
	 * Message body for that type (the 'data' property of a Message).
	 */
	hemi.msg = {
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.model.Model - the Model's animation time changes
		 * data = {
		 *     previous: (number) the previous animation time for the Model
		 *     time: (number) the new animation time for the Model
		 * }
		 */
		animate: 'hemi.animate',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.effect.Burst - the Burst effect is triggered
		 * data = {
		 *     position: (number[3]) the XYZ position the Burst was triggered at
		 * }
		 */
		burst: 'hemi.burst',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - the World is being cleaned up and emptied
		 * data = { }
		 * @example
		 * hemi.world.Citizen - the Citizen is being removed from the World
		 * data = { }
		 */
		cleanup: 'hemi.cleanup',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.manip.Draggable - the Draggable has been dragged
		 * data = {
		 *     drag: (number[3]) the change in XYZ position caused by the drag
		 * }
		 */
		drag: 'hemi.drag',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hext.tools.BaseTool - the tool is enabled or disabled
		 * data = {
		 *     enabled: (boolean) a flag indicating if the tool is enabled
		 * }
		 */
		enable: 'hemi.enable',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.audio.Audio - the Audio's media content is loaded
		 * data = {
		 *     src: (string) the URL of the audio file loaded
		 * }
		 * @example
		 * hemi.hud.HudImage - the HudImage's image data is loaded
		 * data = { }
		 * @example
		 * hemi.hud.HudVideo - the HudVideo's media content is loaded
		 * data = {
		 *     src: (string) the URL of the video file loaded
		 * }
		 * @example
		 * hemi.model.Model - the Model's 3D data is loaded
		 * data = { }
		 * @example
		 * hemi.scene.Scene - the Scene is set as the "current" Scene
		 * data = { }
		 */
		load: 'hemi.load',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - a shape is picked by a mouse click
		 * data = {
		 *     mouseEvent: (o3d.Event) the event generated by the mouse click
		 *     pickInfo: (o3djs.picking.PickInfo) the info generated by the pick
		 * }
		 */
		pick: 'hemi.pick',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - a task's progress data has been updated
		 * data = {
		 *     isTotal: (boolean) a flag indicating if percent is for a specific
		 *                        task or a total of all current tasks
		 *     percent: (number) the task's percentage complete, 0-100
		 *     task: (string) an id for the task, ex: url of a file being loaded
		 * }
		 */
		progress: 'hemi.progress',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.world - the World's resources are loaded and ready
		 * data = { }
		 */
        ready: 'hemi.ready',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.manip.Scalable - the Scalable has been scaled
		 * data = {
		 *     scale: (number) the new scale
		 * }
		 */
        scale: 'hemi.scale',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.animation.Animation - the Animation starts
		 * data = { }
		 * @example
		 * hemi.audio.Audio - the Audio starts playing
		 * data = { }
		 * @example
		 * hemi.effect.Trail - the Trail effect starts generating particles
		 * data = { }
		 * @example
		 * hemi.motion.Rotator - the Rotator starts rotating
		 * data = { }
		 * @example
		 * hemi.motion.Translator - the Translator starts translating
		 * data = { }
		 * @example
		 * hemi.time.Timer - the Timer starts counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer will count down for
		 * }
		 * @example
		 * hemi.view.Camera - the Camera starts moving to a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera is
		 *                                      moving to
		 * }
		 */
		start: 'hemi.start',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.animation.Animation - the Animation finishes or is stopped
		 * data = { }
		 * @example
		 * hemi.audio.Audio - the Audio finishes playing
		 * data = { }
		 * @example
		 * hemi.effect.Trail - the Trail effect stops generating particles
		 * data = { }
		 * @example
		 * hemi.motion.Rotator - the Rotator stops rotating
		 * data = { }
		 * @example
		 * hemi.motion.Translator - the Translator stops translating
		 * data = { }
		 * @example
		 * hemi.time.Timer - the Timer stops counting down
		 * data = {
		 *     time: (number) the milliseconds the Timer counted down
		 * }
		 * @example
		 * hemi.view.Camera - the Camera arrives at a Viewpoint
		 * data = {
		 *     viewpoint: (hemi.view.Viewpoint) the Viewpoint the Camera moved
		 *                                      to
		 * }
		 */
		stop: 'hemi.stop',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.audio.Audio - the Audio's media content is unloaded
		 * data = { }
		 * @example
		 * hemi.model.Model - the Model's 3D data is unloaded
		 * data = { }
		 * @example
		 * hemi.scene.Scene - the Scene is set to not be the "current" Scene
		 * data = { }
		 */
		unload: 'hemi.unload',
		/**
		 * @type string
		 * @constant
		 * @example
		 * hemi.effect.Emitter - the Emitter is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the Emitter is visible
		 * }
		 * @example
		 * hemi.hud.HudDisplay - the HudDisplay shows a page or is hidden
		 * data = {
		 *     page: (number) the page number being shown or 0 if the HudDisplay
		 *                    is hidden
		 * }
		 * @example
		 * hext.tools.BaseTool - the tool is shown or hidden
		 * data = {
		 *     visible: (boolean) a flag indicating if the tool is visible
		 * }
		 */
		visible: 'hemi.visible'
	};

	return hemi;
})(hemi || {});
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
	
	var createClass = function(clsCon, clsName) {
			var names = clsName.split('.'),
				il = names.length - 1,
				scope = window;
			
			for (var i = 0; i < il; ++i) {
				var name = names[i];
				
				if (!scope[name]) {
					scope[name] = {};
				}
				
				scope = scope[name];
			}
			
			scope[names[il]] = clsCon;
		},
	
		/*
		 * Send a Message with the given attributes from the Citizen to any
		 * registered MessageTargets.
		 * 
		 * @param {string} type type of Message
		 * @param {Object} data container for any and all information relevant
		 *        to the Message
		 */
		send = function(type, data) {
			hemi.dispatch.postMessage(this, type, data);
		},
	
		/*
		 * Register the given handler to receive Messages of the specified type
		 * from the Citizen. This creates a MessageTarget.
		 * 
		 * @param {string} type type of Message to handle
		 * @param {Object} handler either a function or an object
		 * @param {string} opt_func name of the function to call if handler is
		 *     an object
		 * @param {string[]} opt_args optional array of names of arguments to
		 *     pass to the handler. Otherwise the entire Message is just passed
		 *     in.
		 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
		 */
		subscribe = function(type, handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this.worldId, type, handler,
				opt_func, opt_args);
		},
	
		/*
		 * Register the given handler to receive Messages of all types from the
		 * Citizen. This creates a MessageTarget.
		 * 
		 * @param {Object} handler either a function or an object
		 * @param {string} opt_func name of the function to call if handler is
		 *     an object
		 * @param {string[]} opt_args optional array of names of arguments to
		 *     pass to the handler. Otherwise the entire Message is just passed
		 *     in.
		 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
		 */
		subscribeAll = function(handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this.worldId, hemi.dispatch.WILDCARD,
				handler, opt_func, opt_args);
		},
	
		/*
		 * Remove the given MessageTarget for Messages of the specified type for
		 * the Citizen.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
		 *     remove from the Dispatch
		 * @param {string} opt_type Message type the MessageTarget was
		 *     registered for
		 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
		 *     null
		 */
		unsubscribe = function(target, opt_type) {
			return hemi.dispatch.removeTarget(target, {
				src: this.worldId,
				msg: opt_type
			});
		};
	
	/**
	 * Take the given base class constructor and create a new class from it that
	 * has all of the required functionality of a Citizen.
	 *  
	 * @param {function} clsCon constructor function for the base class
	 * @param {string} clsName name for the new Citizen class
	 * @param {Object} opts options including:
	 *     cleanup - function to execute for cleanup
	 *     msgs - array of messages Citizen may send
	 *     toOctane - array of properties for octaning or function to execute
	 * @return {function} the constructor for the new Citizen class
	 */
	hemi.makeCitizen = function(clsCon, clsName, opts) {
		opts = opts || {};
		var cleanFunc = opts.cleanup,
			msgs = opts.msgs || [hemi.msg.cleanup];
		
		/*
		 * A Citizen is a uniquely identifiable member of a World that is
		 * able to send Messages through the World's dispatch. The Citizen's id is
		 * all that is necessary to retrieve the Citizen from its World, regardless
		 * of its type.
		 */
        function Citizen() {
        	clsCon.apply(this, arguments);
            
            /*
			 * The name of the Citizen.
			 * @type string
			 * @default ''
			 */
            this.name = this.name || '';
			/* The unique identifier for any Citizen of the World */
			this._worldId = null;
			hemi.world.addCitizen(this);
        }
        
        // Populate our constructed prototype object
        Citizen.prototype = clsCon.prototype;
        
		/*
		 * Array of Hemi Messages that the Citizen is known to send.
		 * @type string[]
		 */
        Citizen.prototype._msgSent = msgs;
        
		/*
		 * Get the Citizen's id.
		 * 
		 * @return {number} the id
		 */        
        Citizen.prototype._getId = function() {
        	return this._worldId;
        };
		
		/*
		 * Set the Citizen's id.
		 * 
		 * @param {number} id the id to set
		 */
        Citizen.prototype._setId = function(id) {
        	var oldId = this._worldId;
			this._worldId = id;
			
			if (oldId !== null) {
				hemi.world.citizens.remove(oldId);
				hemi.world.citizens.put(id, this);
			}
        };
        
        /*
		 * Send a cleanup Message and remove the Citizen from the World.
		 * Base classes should extend this so that it removes all references to
		 * the Citizen.
		 */
        Citizen.prototype.cleanup = function() {
        	this.send(hemi.msg.cleanup, {});
        	
        	if (cleanFunc) {
        		cleanFunc.apply(this, arguments);
        	}

			hemi.world.removeCitizen(this);
        };
        
        Citizen.prototype.send = send;
        Citizen.prototype.subscribe = subscribe;
        Citizen.prototype.subscribeAll = subscribeAll;
        Citizen.prototype.unsubscribe = unsubscribe;
        
        // Enforce the constructor to be what we expect
        Citizen.constructor = Citizen;
        
        hemi.makeOctanable(Citizen, clsName, opts.toOctane);
        createClass(Citizen, clsName);
        
        return Citizen;
	};
	
	/**
	 * @namespace A module for managing all elements of a 3D world. The World
	 * manages a set of Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};
	
	hemi.world.WORLD_ID = 0;
	
	/* The next id to assign to a Citizen requesting a world id */
	var nextId = 1;
	
	/* All of the Citizens of the World */
	hemi.world.citizens = new hemi.utils.Hashtable();
	
	/**
	 * Set the id for the World to assign to the next Citizen.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.world.setNextId = function(id) {
		nextId = id;
	};
	
	/**
	 * Get the next id to assign and increment the World's nextId token.
	 * 
	 * @return {number} the next id ready to assign to a Citizen
	 */
	hemi.world.getNextId = function() {
		return nextId++;
	};
	
	/**
	 * Check to see what the next id to assign will be without incrementing the
	 * World's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a Citizen
	 */
	hemi.world.checkNextId = function() {
		return nextId;
	};
	
	/**
	 * Get the id for the World.
	 * 
	 * @return {number} the id of the World
	 */
	hemi.world._getId = function() {
		return hemi.world.WORLD_ID;
	};
	
	/**
	 * Add the given Citizen to the World and give it a world id if it does not
	 * already have one.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen._getId();
		
		if (id == null) {
			id = this.getNextId();
			citizen._setId(id);
		}
		
		var toRemove = this.citizens.get(id);
		
		if (toRemove !== null) {
			hemi.console.log('Citizen with id ' + id + ' already exists.', hemi.console.ERR);
			toRemove.cleanup();
		}
		
		this.citizens.put(id, citizen);
	};
	
	/**
	 * Remove the given Citizen from the World.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to remove
	 * @return {boolean} true if the Citizen was found and removed
	 */
	hemi.world.removeCitizen = function(citizen) {
		var id = citizen._getId();
		var removed = this.citizens.remove(id);
		
		if (removed === null) {
			hemi.console.log('Unable to remove Citizen with id ' + id, hemi.console.WARN);
		}
		
		return removed !== null;
	};
	
	/**
	 * Get any Citizens with the given attributes. If no attributes are given,
	 * all Citizens will be returned. Valid attributes are:
	 * - name
	 * - citizenType
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Citizen): boolean} opt_filter optional filter function
	 *     that takes a Citizen and returns true if the Citizen should be
	 *     included in the returned array
	 * @return {hemi.world.Citizen[]} an array of Citizens with matching
	 *     attributes
	 */
	hemi.world.getCitizens = function(attributes, opt_filter) {
		var atts = {};
		
		if (attributes != undefined) {
			if (attributes.worldId !== undefined) {
				atts.worldId = attributes.worldId;
			}
			if (attributes.name !== undefined) {
				atts.name = attributes.name;
			}
			if (attributes.citizenType !== undefined) {
				atts.citizenType = attributes.citizenType;
			}
		}
		
		var matches = this.citizens.query(atts);
		
		if (opt_filter) {
			for (var ndx = 0, len = matches.length; ndx < len; ndx++) {
				if (!opt_filter(matches[ndx])) {
					matches.splice(ndx, 1);
					ndx--;
					len--;
				}
			}
		}
		
		return matches;
	};
	
	/**
	 * Get the Citizen with the given id and log an error if exactly one result
	 * is not returned.
	 * 
	 * @param {number} id world id of the Citizen to get
	 * @return {hemi.world.Citizen} the found Citizen or null
	 */
	hemi.world.getCitizenById = function(id) {
		var cit = this.citizens.get(id);
		
		if (cit === null) {
			hemi.console.log('Tried to get Citizen with id ' + id + ', returned null.', hemi.console.ERR);
		}
		
		return cit;
	};
	
	/**
	 * Get any Audio with the given attributes. If no attributes are given, all
	 * Audio will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Audio): boolean} opt_filter optional filter function
	 *     that takes an Audio and returns true if the Audio should be included
	 *     in the returned array
	 * @return {hemi.audio.Audio[]} an array of Audio with matching attributes
	 */
	hemi.world.getAudio = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.audio.Audio.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any CameraCurves with the given attributes. If no attributes are
	 * given, all CameraCurves will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(CameraCurve): boolean} opt_filter optional filter
	 *     function that takes a CameraCurve and returns true if the CameraCurve
	 *     should be included in the returned array
	 * @return {hemi.view.CameraCurve[]} an array of CameraCurves with matching
	 *     attributes
	 */
	hemi.world.getCamCurves = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.view.CameraCurve.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any HudDisplays with the given attributes. If no attributes are
	 * given, all HudDisplays will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(HudDisplay): boolean} opt_filter optional filter
	 *     function that takes a HudDisplay and returns true if the HudDisplay
	 *     should be included in the returned array
	 * @return {hemi.hud.HudDisplay[]} an array of HudDisplays with matching
	 *     attributes
	 */
	hemi.world.getHudDisplays = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.hud.HudDisplay.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any HudElements with the given attributes. If no attributes are
	 * given, all HudElements will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(HudElement): boolean} opt_filter optional filter
	 *     function that takes a HudElement and returns true if the HudElement
	 *     should be included in the returned array
	 * @return {hemi.hud.HudElement[]} an array of HudElements with matching
	 *     attributes
	 */
	hemi.world.getHudElements = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.hud.HudElement.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Models with the given attributes. If no attributes are given, all
	 * Models will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Model): boolean} opt_filter optional filter function
	 *     that takes a Model and returns true if the Model should be included
	 *     in the returned array
	 * @return {hemi.model.Model[]} an array of Models with matching attributes
	 */
	hemi.world.getModels = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.model.Model.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
    
	/**
	 * Get any Animations with the given attributes. If no attributes are given,
	 * all Animations will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Animation): boolean} opt_filter optional filter function
	 *     that takes a Animation and returns true if the Animation should be
	 *     included in the returned array
	 * @return {hemi.animation.Animation[]} an array of Animations with matching
	 *     attributes
	 */
    hemi.world.getAnimations = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.animation.Animation.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
    
	/**
	 * Get any Effects with the given attributes. If no attributes are given,
	 * all Effects will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Effect): boolean} opt_filter optional filter function
	 *     that takes a Effect and returns true if the Effect should be
	 *     included in the returned array
	 * @return {hemi.effect.Effect[]} an array of Effect with matching
	 *     attributes
	 */
    hemi.world.getEffects = function(attributes, opt_filter) {
		var retVal = [];
		
		attributes = attributes || {};
		attributes.citizenType = hemi.effect.Emitter.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));
		
		attributes.citizenType = hemi.effect.Burst.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));
		
		attributes.citizenType = hemi.effect.Trail.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));
		
		return retVal; 
	};
	
	/**
	 * Get any Viewpoints with the given attributes. If no attributes are given,
	 * all Viewpoints will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Viewpoint): boolean} opt_filter optional filter function
	 *     that takes a Viewpoint and returns true if the Viewpoint should be
	 *     included in the returned array
	 * @return {hemi.view.Viewpoint[]} an array of Viewpoints with matching
	 *     attributes
	 */
	hemi.world.getViewpoints = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.view.Viewpoint.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any PressureEngines with the given attributes. If no attributes are
	 * given, all PressureEngines will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(PressureEngine): boolean} opt_filter optional filter
	 *     function that takes a PressureEngine and returns true if the
	 *     PressureEngine should be included in the returned array
	 * @return {hext.engines.PressureEngine[]} an array of PressureEngines with
	 *     matching attributes
	 */
	hemi.world.getPressureEngines = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hext.engines.PressureEngine.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Draggables with the given attributes. If no attributes are given,
	 * all Draggables will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Draggable): boolean} opt_filter optional filter function
	 *     that takes a Draggable and returns true if the Draggable should be
	 *     included in the returned array
	 * @return {hemi.manip.Draggable[]} an array of Draggables with matching
	 *     attributes
	 */
	hemi.world.getDraggables = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.manip.Draggable.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Turnables with the given attributes. If no attributes are given,
	 * all Turnables will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Turnable): boolean} opt_filter optional filter function
	 *     that takes a Turnable and returns true if the Turnable should be
	 *     included in the returned array
	 * @return {hemi.manip.Turnable[]} an array of Turnables with matching
	 *     attributes
	 */
	hemi.world.getTurnables = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.manip.Turnable.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Rotators with the given attributes. If no attributes are given,
	 * all Rotators will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Rotator): boolean} opt_filter optional filter function
	 *     that takes a Rotator and returns true if the Rotator should be
	 *     included in the returned array
	 * @return {hemi.motion.Rotator[]} an array of Rotators with matching
	 *     attributes
	 */
	hemi.world.getRotators = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.motion.Rotator.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Scenes with the given attributes. If no attributes are given, all
	 * Scenes will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Scene): boolean} opt_filter optional filter function
	 *     that takes a Scene and returns true if the Scene should be included
	 *     in the returned array
	 * @return {hemi.scene.Scene[]} an array of Scenes with matching attributes
	 */
	hemi.world.getScenes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.scene.Scene.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Timers with the given attributes. If no attributes are given, all
	 * Timers will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Timer): boolean} opt_filter optional filter function
	 *     that takes a Timer and returns true if the Timer should be included
	 *     in the returned array
	 * @return {hemi.time.Timer[]} an array of Timers with matching attributes
	 */
	hemi.world.getTimers = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.time.Timer.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Translators with the given attributes. If no attributes are
	 * given, all Translators will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Translator): boolean} opt_filter optional filter
	 *     function that takes a Translator and returns true if the Translator
	 *     should be included in the returned array
	 * @return {hemi.motion.Translator[]} an array of Translators with matching
	 *     attributes
	 */
	hemi.world.getTranslators = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.motion.Translator.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Shapes with the given attributes. If no attributes are given, all
	 * Shapes will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Shape): boolean} opt_filter optional filter function
	 *     that takes a Shape and returns true if the Shape should be included
	 *     in the returned array
	 * @return {hemi.shape.Shape[]} an array of Shapes with matching attributes
	 */
	hemi.world.getShapes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.shape.Shape.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get the owning Citizen that the given transform is a part of.
	 * 
	 * @param {o3d.Transform} transform the transform to get the owner for
	 * @return {hemi.world.Citizen} the containing Citizen or null
	 */
	hemi.world.getTranOwner = function(transform) {
		var param = transform.getParam('ownerId'),
			owner = null;
		
		if (param !== null) {
			owner = this.getCitizenById(param.value);
		}
		
		return owner;
	};
	
	return hemi;
})(hemi || {});
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
	
	var isFunction = function(val) {
			return Object.prototype.toString.call(val) === '[object Function]';
		},
	
		parseProps = function(obj, propNames) {
			var oct = [];
			
			for (var i = 0; i < propNames.length; ++i) {
				var name = propNames[i],
					prop = obj[name],
					entry = {
						name: name	
					};
				
				if (isFunction(prop)) {
					entry.arg = [];
				} else if (prop._getId && prop._worldId) {
					entry.id = prop._getId();
				} else if (prop._toOctane) {
					entry.oct = prop._toOctane();
				} else {
					entry.val = prop;
				}
				
				oct.push(entry);
			}
			
			return oct;
		};
	
	hemi.makeOctanable = function(clsCon, clsName, octProps) {
		octProps = octProps || [];
		
		/*
         * Essentially a class name.
         * @type string
         */
		clsCon.prototype._citizenType = clsName;
		
		//TODO: Register constructor with hemi.octane
		
		/*
	     * Get the Octane structure for the class. The structure returned is:
	     * <pre>
	     * {
	     *     id: the Citizen's world id (optional)
	     *     type: the class name
	     *     props: the class properties (name and id/value) 
	     * }
	     * </pre>
	     *
	     * @return {Object} the Octane structure representing the class
	     */
		clsCon.prototype._toOctane = function() {
        	var octane = {
				type: this._citizenType,
				props: isFunction(octProps) ? octProps.call(this) : parseProps(this, octProps)
			};
        	
        	if (this._worldId != null) {
        		octane.id = this._worldId;
        	}
			
			if (this.name.length > 0 && !octane.props.name) {
	            octane.props.unslice({
	                name: 'name',
	                val: this.name
	            });
			}
			
			return octane;
        };
	};
	
	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for message dispatching and handling. The Dispatch
	 * receives Messages and sends them to MessageTargets that are registered
	 * with MessageSpecs.
	 */
	hemi.dispatch = hemi.dispatch || {};
	
	/* The next id to assign to a MessageTarget */
	var nextId = 0;
	
	/**
	 * String literal to indicate that all entries for a field are desired.
	 * @constant
	 */
	hemi.dispatch.WILDCARD = '*';
	
	/** 
	  * First part of an argument string indicating it is an id for the actual
	  * argument desired.
	  * @constant
	  * @example
	  * 'id:12' will execute: hemi.world.getCitizenById(12);
	  */ 
	hemi.dispatch.ID_ARG = 'id:';
	
	/** 
	  * First part of an argument string indicating it should be used to parse
	  * the actual message structure passed to the handler.
	  * @constant
	  * @example
	  * 'msg:data.shape.name' will parse: message.data.shape.name
	  */ 
	hemi.dispatch.MSG_ARG = 'msg:';
	
	/**
	 * @class A Message is sent whenever an event occurs.
	 */
	hemi.dispatch.Message = function() {
		/**
		 * The Message originator.
		 * @type hemi.world.Citizen
		 */
		this.src = null;
		
		/**
		 * The type of the Message.
		 * @type string
		 */
		this.msg = null;
		
		/**
		 * Container for any and all Message data.
		 * @type Object
		 */
		this.data = {};
	};
	
	/**
	 * @class A MessageSpec specifies a certain Message type and source and
	 * contains a set of MessageTargets that have registered to receive Messages
	 * with matching specs.
	 */
	hemi.dispatch.MessageSpec = function() {
		/**
		 * The id of the Message originator to handle Messages from. This can
		 * also be hemi.dispatch.WILDCARD to match all source ids.
		 * @type number
		 */
		this.src = null;
		
		/**
		 * The type of Message to handle. This can also be
		 * hemi.dispatch.WILDCARD to match all Message types.
		 * @type string
		 */
		this.msg = null;
		
		/**
		 * The MessageTargets to pass Messages with matching source ids and
		 * types.
		 * @type hemi.dispatch.MessageTarget[]
		 */
		this.targets = [];
	};
	
	hemi.dispatch.MessageSpec.prototype = {
		/**
		 * Clean up the MessageSpec so all references in it are removed.
		 */
		cleanup: function() {
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				this.targets[ndx].cleanup();
			}
			
			this.targets = [];
		},
		
		/**
		 * Get the Octane structure for the MessageSpec.
	     *
	     * @return {Object} the Octane structure representing the MessageSpec
		 */
		toOctane: function() {
			var targetsOct = [];
			
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				var oct = this.targets[ndx].toOctane();
				
				if (oct !== null) {
					targetsOct.push(oct);
				} else {
					hemi.console.log('Null Octane returned by MessageTarget', hemi.console.ERR);
				}
			}
			
			var props = [
				{
					name: 'src',
					val: this.src
				},{
					name: 'msg',
					val: this.msg
				},{
					name: 'targets',
					oct: targetsOct
				}
			];
			
			var octane = {
				type: 'hemi.dispatch.MessageSpec',
				props: props
			};
			
			return octane;
		},
		
		/**
		 * Register the given MessageTarget with the MessageSpec.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the target to add
		 */
		addTarget: function(target) {
			if (this.targets.indexOf(target) != -1) {
				hemi.console.log('MessageSpec already contains MessageTarget', hemi.console.WARN);
			}
			
			this.targets.push(target);
		},
		
		/**
		 * Remove the given MessageTarget from the MessageSpec.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the target to remove
		 * @return {hemi.dispatch.MessageTarget} the removed target or null
		 */
		removeTarget: function(target) {
			var found = null,
				ndx = this.targets.indexOf(target);
			
			if (ndx != -1) {
				var spliced = this.targets.splice(ndx, 1);
				
				if (spliced.length === 1) {
					found = spliced[0];
				}
			} else {
				hemi.console.log('MessageTarget not found in MessageSpec', hemi.console.WARN);
			}
	        
	        return found;
		},
		
		/**
		 * Get the unique hash key for the MessageSpec.
		 * 
		 * @return {string} the hash key
		 */
		getHash: function() {
			return this.msg + this.src;
		}
	};
	
	/**
	 * @class A MessageTarget registers with a MessageSpec to receive Messages
	 * that match its attributes.
	 * @example
	 * A MessageTarget with the following values:
	 * handler = myObj;
	 * func = 'myFunction';
	 * args = ['msg:src', 12];
	 * 
	 * will execute:
	 * myObj.myFunction(message.src, 12);
	 */
	hemi.dispatch.MessageTarget = function() {
		/**
		 * The id of the MessageTarget.
		 * @type number
		 */
		this.dispatchId = null;
		
		/**
		 * The name of the MessageTarget.
		 * @type string
		 * @default ''
		 */
		this.name = '';
		
		/**
		 * The handler for Messages passed through a MessageSpec. It may be an
		 * object or function.
		 * @type Object || function
		 */
		this.handler = null;
		
		/**
		 * The name of the object function to call if handler is an object.
		 * @type string
		 */
		this.func = null;
		
		/**
		 * Optional array to specify arguments to pass to the handler. Otherwise
		 * just pass it the Message.
		 * @type string[]
		 */
		this.args = null;
	};
	
	hemi.dispatch.MessageTarget.prototype = {
		/**
		 * Clean up the MessageTarget so all references in it are removed.
		 */
		cleanup: function() {
			this.handler = null;
		},
		
		/**
		 * Get the Octane structure for the MessageTarget.
	     *
	     * @return {Object} the Octane structure representing the MessageTarget
		 */
		toOctane: function() {
			if (!this.handler.getId) {
				hemi.console.log('Handler object in MessageTarget can not be saved to Octane', hemi.console.WARN);
				return null;
			}
			
			var names = ['dispatchId', 'name', 'func', 'args'],
				props = [{
					name: 'handler',
					id: this.handler.getId()
				}];
			
			for (var ndx = 0, len = names.length; ndx < len; ndx++) {
				var name = names[ndx];
				
				props.push({
					name: name,
					val: this[name]
				});
			}
			
			var octane = {
				type: 'hemi.dispatch.MessageTarget',
				props: props
			};
			
			return octane;
		}
	};
	
	/* All of the MessageSpecs (and MessageTargets) in the Dispatch */
	hemi.dispatch.msgSpecs = new hemi.utils.Hashtable();
	
	/**
	 * Set the id for the Dispatch to assign to the next MessageTarget.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.dispatch.setNextId = function(id) {
		nextId = id;
	};
	
	/**
	 * Get the next id to assign and increment the Dispatch's nextId token.
	 * 
	 * @return {number} the next id ready to assign to a MessageTarget
	 */
	hemi.dispatch.getNextId = function() {
		return nextId++;
	};
	
	/**
	 * Check to see what the next id to assign will be without incrementing the
	 * Dispatch's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a MessageTarget
	 */
	hemi.dispatch.checkNextId = function() {
		return nextId;
	};
	
    /**
	 * Load the given MessageSpec entries into the MessageSpec database.
	 * 
	 * @param {hemi.dispatch.MessageSpec[]} entries MessageSpecs to load into
	 *     the Dispatch
	 */
	hemi.dispatch.loadEntries = function(entries) {
		for (var ndx = 0, len = entries.length; ndx < len; ndx++) {
			var entry = entries[ndx];
			this.msgSpecs.put(entry.getHash(), entry);
		}
	};
	
	/**
	 * Empty the MessageSpec database of all entries.
	 */
	hemi.dispatch.cleanup = function() {
		this.msgSpecs.each(function(key, value) {
			value.cleanup();
		});
		
		this.msgSpecs.clear();
	};
	
	/**
	 * Get the Octane structure for the Dispatch.
     *
     * @return {Object} the Octane structure representing the MessageDispatcher
	 */
	hemi.dispatch.toOctane = function() {
		var octane = {
			nextId: nextId,
			ents: []
		};
		
		this.msgSpecs.each(function(key, value) {
			var oct = value.toOctane();
			
			if (oct !== null) {
				octane.ents.push(oct);
			} else {
				hemi.console.log('Null Octane returned by MessageSpec', hemi.console.ERR);
			}
		});
		
		return octane;
	};
	
	/**
	 * Get any MessageSpecs with the given attributes. If no attributes are
	 * given, all MessageSpecs will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of MessageSpecs with
	 *     matching attributes
	 */
	hemi.dispatch.getSpecs = function(attributes, wildcards) {
		var specs;
		
		if (attributes === undefined) {
			specs = this.msgSpecs.values();
		} else {
			var atts = {};
			
			if (wildcards) {
				if (attributes.src !== undefined) {
					if (attributes.src === hemi.dispatch.WILDCARD) {
						atts.src = hemi.dispatch.WILDCARD;
					} else {
						atts.src = [attributes.src, hemi.dispatch.WILDCARD];
					}
				}
				if (attributes.msg !== undefined) {
					if (attributes.msg === hemi.dispatch.WILDCARD) {
						atts.msg = hemi.dispatch.WILDCARD;
					} else {
						atts.msg = [attributes.msg, hemi.dispatch.WILDCARD];
					}
				}
			} else {
				if (attributes.src !== undefined) {
					atts.src = attributes.src;
				}
				if (attributes.msg !== undefined) {
					atts.msg = attributes.msg;
				}
			}
			
			specs = this.msgSpecs.query(atts);
		}
		
		return specs;
	};
	
	/**
	 * Get the MessageSpec with the given source id and Message type. If
	 * wildcards are allowed, search for wildcard sources and types as well.
	 * This is much faster than getSpecs.
	 * 
	 * @param {number} src id of the Message originator to search for
	 * @param {string} type type of Message to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results
	 * @return {hemi.dispatch.MessageSpec[]} an array of found MessageSpecs
	 */
	hemi.dispatch.getSpecsFast = function(src, msg, wildcards) {
		var specs = [],
			hash = msg + src,
			spec = this.msgSpecs.get(hash);
		
		if (spec !== null) {
			specs.push(spec);
		}
		
		if (wildcards) {
			var wildSrc = src === hemi.dispatch.WILDCARD;
			
			if (!wildSrc) {
				hash = msg + hemi.dispatch.WILDCARD;
				spec = this.msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
			}
			if (msg !== hemi.dispatch.WILDCARD) {
				hash = hemi.dispatch.WILDCARD + src;
				spec = this.msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
				
				if (!wildSrc) {
					hash = hemi.dispatch.WILDCARD + hemi.dispatch.WILDCARD;
					spec = this.msgSpecs.get(hash);
					if (spec !== null) {
						specs.push(spec);
					}
				}
			}
		}
		
		return specs;
	};
	
	/**
	 * Get any MessageTargets registered with the given attributes. If no
	 * attributes are given, all MessageTargets will be returned. Valid
	 * attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} an array of MessageTargets
	 *     registered with matching attributes
	 */
	hemi.dispatch.getTargets = function(attributes, wildcards) {
		var specs = this.getSpecs(attributes, wildcards),
			results = [],
			dispatchId,
			name,
			handler;
		
		if (attributes !== undefined) {
			dispatchId = attributes.dispatchId;
			name = attributes.name;
			handler = attributes.handler;
		}
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var targets = specs[ndx].targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var result = targets[t];
				var add = true;
				
				if (dispatchId !== undefined) {
					add = result.dispatchId === dispatchId;
				}
				if (add && name !== undefined) {
					add = result.name === name;
				}
				if (add && handler !== undefined) {
					add = result.handler === handler;
				}
				
				if (add) {
					results.push(result);
				}
			}
		}
		
		return results;
	};
	
	/**
	 * Get the MessageSpec that the given MessageTarget is currently
	 * registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to get
	 *     the MessageSpec for
	 * @return {hemi.dispatch.MessageSpec} the found MessageSpec or null
	 */
	hemi.dispatch.getTargetSpec = function(target) {
		var specs = this.getSpecs(),
			dispatchId = target.dispatchId;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx],
				targets = spec.targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				if (targets[t].dispatchId === dispatchId) {
					return spec;
				}
			}
		}
		
		return null;
	};
	
	/**
	 * Get the MessageSpec with the given attributes or create one if it does
	 * not already exist.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @return {hemi.dispatch.MessageSpec} the created/found MessageSpec
	 */
	hemi.dispatch.createSpec = function(src, msg) {
		var specs = this.getSpecsFast(src, msg, false),
			spec;
		
		if (specs.length === 0) {
			spec = new hemi.dispatch.MessageSpec();
			spec.src = src;
			spec.msg = msg;
			this.msgSpecs.put(spec.getHash(), spec);
		} else {
			if (specs.length > 1) {
				hemi.console.log('Found ' + specs.length + ' MessageSpecs with the same src and msg.', hemi.console.ERR);
			}
			
			spec = specs[0];
		}
		
		return spec;
	};
	
	/**
	 * Setup a MessageTarget with the given attributes and register it to
	 * receive Messages.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @param {Object} handler either a function that will take the Message as a
	 *     parameter, or an object that will receive it
	 * @param {string} opt_func name of the function to call if handler is an
	 *     object
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     opt_func. Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.dispatch.registerTarget = function(src, msg, handler, opt_func, opt_args) {
		var spec = this.createSpec(src, msg),
			msgTarget = new hemi.dispatch.MessageTarget();
		msgTarget.dispatchId = this.getNextId();
		msgTarget.handler = handler;
		
		if (opt_func) {
			msgTarget.func = opt_func;
		}
		if (opt_args) {
			msgTarget.args = opt_args;
		}
		
		spec.addTarget(msgTarget);
		return msgTarget;
	};
	
	/**
	 * Remove the given MessageTarget from the dispatch.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     remove
	 * @param {Object} opt_attributes optional structure with MessageSpec
	 *     attributes to search for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.dispatch.removeTarget = function(target, opt_attributes) {
		var specs = this.getSpecs(opt_attributes, false),
			removed = null;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx];
			removed = spec.removeTarget(target);
			
			if (removed !== null) {
				break;
			}
		}
		
		if (removed === null) {
			hemi.console.log('MessageTarget was not found and therefore not removed', hemi.console.WARN);
		}
		
		return removed;
	};
	
	/**
	 * Remove the given MessageTarget from its current MessageSpec and register
	 * it with the given specifications.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     register
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 */
	hemi.dispatch.setTargetSpec = function(target, src, msg) {
		var spec = this.getTargetSpec(target);
		
		if (spec !== null) {
			spec.removeTarget(target);
		} else {
			hemi.console.log('Previous MessageSpec for MessageTarget not found', hemi.console.WARN);
		}
		
		spec = this.createSpec(src, msg);
		spec.addTarget(target);
	};
	
	/**
	 * Create a Message from the given attributes and send it to all
	 * MessageTargets with matching source id and message type.
	 * 
	 * @param {hemi.world.Citizen} src the Message originator
	 * @param {string} msg type of Message to send
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.dispatch.postMessage = function(src, msg, data) {
		var message = new hemi.dispatch.Message(),
			id = src.getId();
		message.src = src;
		message.msg = msg;
		message.data = data;
		
		var specs = this.getSpecsFast(id, msg, true);
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			// Make a local copy of the array in case it gets modified while
			// sending the message (such as a MessageHandler unsubscribes itself
			// or another one as part of its handle).
			var targets = specs[ndx].targets.slice(0);
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var msgTarget = targets[t];
				var args, func;
				
				if (msgTarget.args !== null) {
					// Parse the specified arguments from the Message.
					args = this.getArguments(message, msgTarget.args);
				} else {
					// No arguments specified, so just pass the Message.
					args = [message];
				}
				
				if (msgTarget.func) {
					// The handler is an object. Use the specified function to
					// handle the Message.
					func = msgTarget.handler[msgTarget.func];
				}
				else {
					// The handler is a function. Just pass it the arguments.
					func = msgTarget.handler;
				}
				
				func.apply(msgTarget.handler, args);
			}
		}
	};

	/**
	 * Create an array of arguments from the given array of parameter strings. A
	 * string starting with 'id:' indicates the world id for a Citizen to
	 * retrieve. A string starting with 'msg:' indicates a period-delimited
	 * string of attributes to parse from within message. Otherwise the argument
	 * is passed through unmodified.
	 * For example:
	 * 'id:12' will fetch hemi.world.getCitizens({worldId:12})
	 * 'msg:data.shape.name' will parse message.data.shape.name
	 * 
	 * @param {hemi.dispatch.Message} message the Message to parse data from
	 * @param {Object[]} params the list of parameters to create arguments from
	 * @return {Object[]} array of arguments created
	 */
	hemi.dispatch.getArguments = function(message, params) {
		var arguments = [];
		
		for (var ndx = 0, len = params.length; ndx < len; ndx++) {
			var param = params[ndx];
			
			if (typeof param != 'string') {
				arguments[ndx] = param;
			} else if (param.substring(0,3) === hemi.dispatch.ID_ARG) {
				var id = parseInt(param.substring(3));
				arguments.push(hemi.world.getCitizenById(id));
			} else if (param.substring(0,4) === hemi.dispatch.MSG_ARG) {
				param = param.substring(4);
				var tokens = param.split('.');
				var arg = message;
				
				for (aNdx = 0, aLen = tokens.length; arg != null && aNdx < aLen; aNdx++) {
					arg = arg[tokens[aNdx]];
				}
				
				arguments.push(arg);
			} else {
				arguments[ndx] = param;
			}
		}
		
		return arguments;
	};

	// Wildcard functions
	var anon = {
		getId: function() {
			return hemi.dispatch.WILDCARD;
		}
	};
	
	/**
	 * Send a Message with the given attributes from an anonymous wildcard
	 * source to any registered MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.send = function(type, data) {
		hemi.dispatch.postMessage(anon, type, data);
	};
	
	/**
	 * Register the given handler to receive Messages of the specified type
	 * from any source. This creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is
	 *     an object
	 * @param {string[]} opt_args optional array of names of arguments to
	 *     pass to the handler. Otherwise the entire Message is just passed
	 *     in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.dispatch.WILDCARD, type,
			handler, opt_func, opt_args);
	};
	
	/**
	 * Remove the given MessageTarget for the specified Message type. Note
	 * that this removes a MessageTarget registered with the wildcard as the
	 * source id. It does not remove the MessageTarget from any Citizens it
	 * may be directly registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     remove from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was
	 *     registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
	 *     null
	 */
	hemi.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.dispatch.WILDCARD,
			msg: opt_type
		});
	};
	
	return hemi;
})(hemi || {});
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
	/**
	 * @namespace A module for handling all keyboard and mouse input.
	 */
	hemi.input = hemi.input || {};
	
	/**
	 * Setup the listener lists and register the event handlers.
	 */
	hemi.input.init = function(canvas) {
		hemi.input.mouseDownListeners = [];
		hemi.input.mouseUpListeners = [];
		hemi.input.mouseMoveListeners = [];
		hemi.input.mouseWheelListeners = [];
        hemi.input.keyDownListeners = [];
        hemi.input.keyUpListeners = [];
        hemi.input.keyPressListeners = [];

        this.canvas = canvas;

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
		addListener(hemi.input.keyDownListeners, listener);
    };
    
	/**
	 * Register the given listener as a "key up" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyUp()
	 */
    hemi.input.addKeyUpListener = function(listener) {
		addListener(hemi.input.keyUpListeners, listener);
    };
    
	/**
	 * Register the given listener as a "key press" listener.
	 *  
	 * @param {Object} listener an object that implements onKeyPress()
	 */
    hemi.input.addKeyPressListener = function(listener) {
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
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseDownListeners.length; ndx++) {
			hemi.input.mouseDownListeners[ndx].onMouseDown(newEvent);
		}
	};
	
	/**
	 * Handle the event generated by the user releasing a pressed mouse button.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse up" listeners
	 */
	hemi.input.mouseUp = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseUpListeners.length; ndx++) {
			hemi.input.mouseUpListeners[ndx].onMouseUp(newEvent);
		}
	};
	
	/**
	 * Handle the event generated by the user moving the mouse.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse move" listeners
	 */
	hemi.input.mouseMove = function(event) {
        var newEvent = getRelativeEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseMoveListeners.length; ndx++) {
			hemi.input.mouseMoveListeners[ndx].onMouseMove(newEvent);
		}
	};
	
	/**
	 * Handle the event generated by the user scrolling a mouse wheel.
	 * 
	 * @param {o3d.Event} event information about the event which is passed on
	 *                    to registered "mouse wheel" listeners
	 */
	hemi.input.scroll = function(event) {
        var newEvent = getRelativeEvent(event);
        newEvent.deltaY = event.detail ? -event.detail : event.wheelDelta;
        cancelEvent(event);
		for (var ndx = 0; ndx < hemi.input.mouseWheelListeners.length; ndx++) {
			hemi.input.mouseWheelListeners[ndx].onScroll(newEvent);
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

    var getRelativeXY = function(event) {
        var element = event.target ? event.target : event.srcElement;
        var xy = {x: 0, y: 0};
        for (var e = element; e; e = e.offsetParent) {
            xy.x += e.offsetLeft;
            xy.y += e.offsetTop;
        }

        xy.x = event.pageX - xy.x;
        xy.y = event.pageY - xy.y;

        return xy;
    };

    var getRelativeEvent = function(event) {
        var newEvent = hemi.utils.clone(event, false);
        var xy = getRelativeXY(newEvent);
        newEvent.x = xy.x;
        newEvent.y = xy.y;

        return newEvent;
    };

    var cancelEvent = function(event) {
        if (!event)
            event = window.event;
        event.cancelBubble = true;
        if (event.stopPropagation)
            event.stopPropagation();
        if (event.preventDefault)
            event.preventDefault();
    };

	return hemi;
})(hemi || {});
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

/**
 * @fileoverview Classes used for setting viewpoints, controlling the camera,
 *		and setting camera view options are defined here.
 */

var hemi = (function(hemi) {
	hemi.viewDefaults = {
		MOUSE_SPEED : 0.005,
		MOUSE_DELTA : 0.0015,
		TRUCK_SPEED : 0.02,
		FOV         : 0.707107,
		NP          : 1,
		FP          : 10000,
		MOVE_TIME   : 72,
		MIN_FOV     : 0.05,
		MAX_FOV     : Math.PI/3,
		MIN_TILT    : -Math.PI/2.001,
		MAX_TILT    : Math.PI/2.001
	};
	
	hemi.viewProjection = {
		PERSPECTIVE : 0,
		XY          : 1,
		XZ          : 2,
		YZ          : 3
	};

	/**
	 * @class A Camera controls the point of view and perspective when viewing a
	 * 3D scene.
	 * @extends hemi.world.Citizen
	 */
	hemi.CameraBase = function() {
		    //var tween = hemi.utils.penner.linearTween;
            //PABNOTE Move back to library code
            var tween = function(t, b, c, d) {
                return c*t/d + b;
            };
            this.pan = new THREE.Object3D();
            this.pan.name = 'pan';
            this.tilt = new THREE.Object3D();
            this.tilt.name = 'tilt';
            this.cam = new THREE.Object3D();
            this.cam.name = 'cam';
            this.target = new THREE.Object3D();
            this.target.name = 'target';
            this.pan.add(this.tilt);
            this.tilt.add(this.cam);
            this.cam.add(this.target);

			this.vd = { current: null, last: null };
			this.light = new THREE.PointLight( 0xffffff, 1.35 );
            this.maxPan = null;
            this.minPan = null;
            this.maxTilt = null;
            this.minTilt = null;

	        this.fov = {
				current : hemi.viewDefaults.FOV,
				min     : hemi.viewDefaults.MIN_FOV,
				max     : hemi.viewDefaults.MAX_FOV
			};
			this.camPan = { current : 0, min: null, max: null };
			this.camTilt = { current: 0, min: null, max: null };
	        this.distance = 1;
	        this.up = [0, 1, 0];
			this.mode = {
				scroll     : true,
				scan       : true,
				fixed      : false,
				frames     : true,
				control    : false,
				projection : hemi.viewProjection.PERSPECTIVE,
                fixedLight : true
			};	
			this.state = {
				moving : false,
				curve  : null,
				time   : { current: 0.0, end: 0.0 },
				mouse  : false,
				xy     : { current: [-1,-1], last: [-1,-1] },
				shift  : false,
				update : false,
				vp     : null
			};
			this.clip = {
				near : hemi.viewDefaults.NP,
				far  : hemi.viewDefaults.FP
			};
            this.FPS = 24;
            this.threeCamera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );

			this.easeFunc = [tween,tween,tween];
			this.update();
			this.updateProjection();

            hemi.addRenderListener(this);
		};

	hemi.CameraBase.prototype = {
		/**
		 * Clamp the pan and tilt angles to the Camera's limits.
		 */
	    clampPanTilt : function() {
			var p = this.camPan, t = this.camTilt;
			p.current = ( p.min!=null && p.current<=p.min ) ? p.min : 
					    ( p.max!=null && p.current>=p.max ) ? p.max : p.current;
			t.current = ( t.min!=null && t.current<=t.min ) ? t.min : 
					    ( t.max!=null && t.current>=t.max ) ? t.max : t.current;
		},
		
		/**
		 * Send a cleanup Message and remove all references in the Camera.
		 */
		cleanup: function() {
			hemi.removeRenderListener(this);
			this.disableControl();
		},
		
		/**
		 * Disable control of the Camera through the mouse and keyboard.
		 */
		disableControl : function() {
			if (!this.mode.control) {
				return false;
			} else {
				hemi.input.removeMouseDownListener(this);
				hemi.input.removeMouseUpListener(this);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseWheelListener(this);
				hemi.input.removeKeyDownListener(this);
				hemi.input.removeKeyUpListener(this);	
				this.mode.control = false;
				this.state.mouse = false;
				return true;
			}
		},
		
		/**
		 * Disable the shiftkey scanning functionality.
		 */
		disableScan : function() {
			this.mode.scan = false;
		},
		
		/**
		 * Disable the scroll wheel zooming functionality.
		 */
		disableZoom : function() {
			this.mode.scroll = false;
		},
			
		/**
		 * Enable control of the Camera through the mouse and keyboard.
		 */
		enableControl : function(element) {
			if (this.mode.control) {
				return false;
			} else {
				hemi.input.addMouseDownListener(this);
				hemi.input.addMouseUpListener(this);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseWheelListener(this);
				hemi.input.addKeyDownListener(this);
				hemi.input.addKeyUpListener(this);
				this.mode.control = true;
				return true;
			}
		},
		
		/**
		 * Enable the shiftkey dragging functionality.
		 */
		enableScan : function() {
			this.mode.scan = true;
		},
		
		/**
		 * Enable the camera to zoom with the mouse scroll.
		 */
		enableZoom : function() {
			this.mode.scroll = true;
		},
		
		/**
		 * Fix the eye to current spot, and use mouse movements to look around.
		 */
		fixEye : function() {
			this.mode.fixed = true;
			this.update();
			return this;
		},
		
		/**
		 * Attach the light source to the Camera.
		 */
		lightOnCam : function() {
			this.fixedLight = true;
			this.update();
			return this;
		},
		
		/**
		 * Allow the eye to rotate about a fixed target. This is the default mode.
		 */
		freeEye : function() {
			this.mode.fixed = false;
			if (!this.mode.projection) {
				identity(this.cam);
				cam.translateZ(this.distance);
                cam.updateMatrix();
			}
			this.update();
			return this;
		},
		
		/**
		 * Set the light source to be at the given position.
		 * 
		 * @param {Vector3} position XYZ position of the light source
		 */
		lightAtPosition : function(position) {
			this.light.position = position;
            this.light.updateMatrix();
			this.mode.fixedLight = false;
			this.update();
			return this;
		},

		/**
		 * Get the current position of the Camera eye.
		 *
		 * @return {Vector3} XYZ coordinates of the eye
		 */
		getEye : function() {
			return this.cam.matrixWorld.getPosition();
		},

		/**
		 * Get the current position of the Camera target.
		 *
		 * @return {Vector3} XYZ coordinates of the target
		 */
		getTarget : function() {
			if (this.mode.fixed) {
				return this.target.matrixWorld.getPosition();
			} else {
				return this.pan.matrixWorld.getPosition();
			}
		},
		
		/**
		 * Set the Camera's movement to be measured in frames.
		 */
		moveInFrames : function() {
			this.mode.frames = true;
		},
		
		/**
		 * Set the Camera's movement to be measured in seconds.
		 */
		moveInSeconds : function() {
			this.mode.frames = false;
		},
		
		/**
		 * Move the Camera along the specified curve.
		 *
		 * @param {hemi.CameraCurve} curve curve for the Camera eye and
		 *     target to follow
		 * @param {number} opt_time the number of seconds for the Camera to take
		 *     to move along the curve (0 is instant)
		 */
		moveOnCurve : function(curve, opt_time) {
			if (this.vd.current !== null) {
				this.vd.last = this.vd.current;
			} else {
				this.vd.last = hemi.createViewData(this);
			}
			
			this.vd.current = new hemi.ViewData({
				eye: curve.eye.getEnd(),
				target: curve.target.getEnd(),
				up: this.up,
				fov: this.fov.current,
				np: this.clip.near,
				fp: this.clip.far
			});
			this.state.curve = curve;
			this.state.moving = true;
			this.state.vp = null;
			this.state.time.end = (opt_time == null) ? 1.0 : (opt_time > 0) ? opt_time : 0.001;
			this.state.time.current = 0.0;
			//this.send(hemi.msg.start, { viewdata: this.vd.current });
		},
		
		/**
		 * Move the Camera when the Camera is in orthographic viewing mode.
		 *
		 * @param {number} xMovement The mouse movement, in pixels, along the x-axis
		 * @param {number} yMovement The mouse movement, in pixels, along the y-axis
		 */
		moveOrthographic : function(xMovement,yMovement) {
			var xDis = xMovement * 2 * this.distance / hemi.core.client.width;
			var yDis = yMovement * 2 * this.distance / hemi.core.client.width;
			switch(this.mode.projection) {
				case hemi.viewProjection.XY:
				case hemi.viewProjection.YZ:
					this.pan.translateX(-xDis);
                    this.pan.translateY(yDis);
                    this.pan.updateMatrix();
					break;
				case hemi.viewProjection.XZ:
				    this.pan.translateX(xDis);
                    this.pan.translateZ(yDis);
                    this.pan.updateMatrix();
					break;
			}
		},

		/**
		 * Move the Camera when the Camera is in perspective viewing mode.
		 *
		 * @param {number} xMovement The mouse movement, in pixels, along the x-axis
		 * @param {number} yMovement The mouse movement, in pixels, along the y-axis
		 */		
		movePerspective : function(xMovement,yMovement) {
			if (this.state.shift && this.mode.scan) {
				var deltaX = hemi.viewDefaults.MOUSE_DELTA * this.distance
					* (xMovement);
				var deltaY = hemi.viewDefaults.MOUSE_DELTA * this.distance
					* (yMovement);
				this.pan.translateX(-deltaX);
				this.pan.translateY(deltaY * Math.cos(this.tilt.current));
				this.pan.translateZ(deltaY * Math.sin(this.tilt.current));
                this.pan.updateMatrix();
				this.update();
			} else {
				if (this.mode.fixed) {
					this.rotate(
						-xMovement * hemi.viewDefaults.MOUSE_SPEED,
						-yMovement * hemi.viewDefaults.MOUSE_SPEED);
				} else {
					this.orbit(
						-xMovement * hemi.viewDefaults.MOUSE_SPEED,
						-yMovement * hemi.viewDefaults.MOUSE_SPEED);
				}		
			}
		},
		
		/**
		 * Move the Camera to the given Viewpoint.
		 *
		 * @param {hemi.Viewpoint} view Viewpoint to move to
		 * @param {number} opt_time the number of seconds for the Camera to take
		 *     to move to the Viewpoint (0 is instant)
		 */
		moveToView : function(view, opt_time) {
			var t = (opt_time == null) ? 1.0 : opt_time,
				pkg;
			
			if (view.getData != null) {
				this.vd.current = view.getData();
				this.state.vp = view;
				pkg = {viewpoint: view};
			} else {
				this.vd.current = view;
				this.state.vp = null;
				pkg = {viewdata: view};
			}
			
			this.vd.last = hemi.createViewData(this);
			this.state.curve = null;
			this.state.time.end = (t > 0) ? t : 0.001;
			this.state.time.current = 0.0;
			this.state.moving = true;
			//this.send(hemi.msg.start, pkg);
		},
		
		/**
		 * Keyboard key-down listener.
		 *
		 * @param {o3d.Event} keyEvent Message describing key down
		 */
		onKeyDown : function(keyEvent) {
			this.state.shift = (keyEvent.keyCode == 16);
		},

		/**
		 * Keyboard key-up listener.
		 *
		 * @param {o3d.Event} keyEvent Message describing key up
		 */
		onKeyUp : function(keyEvent) {
			if (keyEvent.keyCode == 16) this.state.shift = false;
		},

		/**
		 * Mouse-down listener - set parameters to reflect that fact.
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse down
		 */
		onMouseDown : function(mouseEvent) {
			this.state.mouse = true;
			this.state.xy.current[0] = this.state.xy.last[0] = mouseEvent.x;
			this.state.xy.current[1] = this.state.xy.last[1] = mouseEvent.y;
		},

		/**
		 * Mouse-move listener - move the camera if the mouse is down.
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse move
		 */
		onMouseMove : function(mouseEvent) {
			if (this.state.mouse) {
				this.state.xy.last[0] = this.state.xy.current[0];
				this.state.xy.last[1] = this.state.xy.current[1];
				this.state.xy.current[0] = mouseEvent.x;
				this.state.xy.current[1] = mouseEvent.y;
				var xMovement = this.state.xy.current[0] - this.state.xy.last[0];
				var yMovement = this.state.xy.current[1] - this.state.xy.last[1];
					if (this.mode.projection) {
						this.moveOrthographic(xMovement,yMovement);			
					} else {
						this.movePerspective(xMovement,yMovement);
					}	
			}
		},

		/**
		 * Mouse-up listener
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse up
		 */
		onMouseUp : function(mouseEvent) {
			this.state.mouse = false;
		},
		
		/**
		 * Render listener - check mouse and camera parameters and decide if the
		 * Camera needs to be updated.
		 *
		 * @param {o3d.Event} renderEvent Message desribing render loop
		 */
		onRender : function(renderEvent) {
			var state = this.state,
				xy = state.xy;	
			
			if ((state.mouse && (xy.current[0] !== xy.last[0] ||
				                 xy.current[1] !== xy.last[1])) ||
				state.moving ||
				state.update) {
				this.update(renderEvent.elapsedTime);
			}
			state.update = false;
		},
		
		/**
		 * Mouse-scroll listener - zoom the camera in or out.
		 *
		 * @param {o3d.Event} mouseEvent Message describing mouse behavior
		 */
		onScroll : function(mouseEvent) {
			if (!this.mode.scroll) {
				return;
			}
			if (this.state.shift) {
				var dis = this.distance * hemi.viewDefaults.TRUCK_SPEED,
					dir = (mouseEvent.deltaY > 0) ? 1 : -1;
				this.truck(dis*dir);
			} else {
				if (this.mode.fixed) {
					var breakpoint = (this.fov.max + this.fov.min)/2;
					if (mouseEvent.deltaY > 0) {
						if (this.fov.current < breakpoint) {
							this.fov.current = this.fov.min + (this.fov.current - this.fov.min)*11/12;
						} else {
							this.fov.current = this.fov.max - (this.fov.max - this.fov.current)*13/12;
						}
					} else {
						if (this.fov.current < breakpoint) {
							this.fov.current = this.fov.min + (this.fov.current - this.fov.min)*13/12;
						} else {
							this.fov.current = this.fov.max - (this.fov.max - this.fov.current)*11/12;
						}
					}
					this.updateProjection();
					this.state.update = true;
					return;
				} else {
					var t = (mouseEvent.deltaY > 0) ? 11/12 : 13/12;
					this.distance = this.lerpScalar(0, this.distance, t);
					if (!this.mode.projection) {
						this.identity(this.cam);
						this.cam.translateZ(this.distance);
                        this.cam.updateMatrix();
					}
					this.updateProjection();
					this.state.update = true;
				}
			}
		},


        /**
         * Performs linear interpolation on two scalars.
         * Given scalars a and b and interpolation coefficient t, returns
         * (1 - t) * a + t * b.
         * @param {number} a Operand scalar.
         * @param {number} b Operand scalar.
         * @param {number} t Interpolation coefficient.
         * @return {number} The weighted sum of a and b.
         */
        lerpScalar : function(a, b, t) {
          return (1 - t) * a + t * b;
        },
		
		/**
		 * Orbit the Camera about the target point it is currently looking at.
		 * 
		 * @param {number} pan amount to pan around by (in radians)
		 * @param {number} tilt amount to tilt up and down by (in radians)
		 */
		orbit : function(pan,tilt) {
			if (tilt == null) tilt = 0;
			var lastTilt = this.tilt.rotation.x;
            var newPan = this.pan.rotation.y += pan;
			var newTilt = lastTilt + tilt;
            newTilt = newTilt >= this.tiltMax ? this.tiltMax : (newTilt <= this.tiltMin ? this.tiltMin : newTilt);
			this.pan.rotation.setY(newPan);
			this.tilt.rotation.setX(newTilt);
            this.pan.updateMatrix();
            this.tilt.updateMatrix();
			this.update();
		},
		
		/**
		 * Rotate the Camera in place so that it looks in a new direction. Note
		 * that this has no effect if the Camera is not in fixed-eye mode.
		 * 
		 * @param {number} pan amount to pan (in radians)
		 * @param {number} tilt amount to tilt (in radians)
		 */
		rotate : function(pan,tilt) {
			if (tilt == null) tilt = 0;
			this.camPan.current += pan;
			this.camTilt.current += tilt;
            this.clampPanTilt();
			this.identity(this.cam);
			this.cam.translateZ(this.distance);
			this.cam.rotation.y = this.camPan.current;
			this.cam.rotation.x = this.camTilt.current;
            this.cam.updateMatrix();
			this.update();
		},

		/**
		 * Set the limits on the Camera pan and tilt in fixed eye mode.
		 * 
		 * @param {number} panMin minimum pan angle (in radians)
		 * @param {number} panMax maximum pan angle (in radians)
		 * @param {number} tiltMin minimum tilt angle (in radians)
		 * @param {number} tiltMax maximum tilt angle (in radians)
		 */
		setLookAroundLimits : function(panMin, panMax, tiltMin, tiltMax) {
			this.camPan.min = panMin;
			this.camPan.max = panMax;
			this.camTilt.min = tiltMin;
			this.camTilt.max = tiltMax;
			return this;
		},
		
		/**
		 * Set the function used to ease the Camera in and out of moves.
		 *
		 * @param {function|Object} easeFunc Either the function which will be
		 *     used for easing on all 3 axes, or a simple object containing x,
		 *     y, or z fields specifying a different function for each axis.
		 * @return {hemi.Camera} This Camera, for chaining
		 */
		setEasing : function(easeFunc) {
			if (typeof(easeFunc) == 'function') {
				this.easeFunc = [easeFunc,easeFunc,easeFunc];
			} else {
				this.easeFunc = [
					easeFunc.x || this.easeFunc[0],
					easeFunc.y || this.easeFunc[1],
					easeFunc.z || this.easeFunc[2]
				];
			}
			return this;
		},
		
		/**
		 * Set the eye and target of the Camera. 
		 *
		 * @param {Vector3} eye XYZ position of camera eye
		 * @param {Vector3} target XYZ position of camera target
		 */
		setEyeTarget : function(eye,target) {
			var offset = new THREE.Vector3(eye.x - target.x,eye.y - target.y ,eye.z -target.z),
				rtp = this.cartesianToSpherical(offset);

			this.distance = rtp.x;

			this.identity(this.pan);
			this.pan.position = target;
            this.pan.rotation.y = rtp.z;
            this.pan.updateMatrix();

			this.identity(this.tilt);
            this.tilt.rotation.x = rtp.y - Math.PI/2;
            this.tilt.updateMatrix();
			
			var camPos = new THREE.Vector3(0, 0, this.distance);
			this.identity(this.cam);
			this.cam.translateZ(this.distance);
            this.cam.updateMatrix();

            this.updateWorldMatrices();

			this.pointZAt(this.cam, camPos, this.pointAsLocal(this.cam,target));
			this.cam.rotation.y = this.cam.rotation.y + Math.PI;
            this.cam.updateMatrix();
			this.camPan.current = 0;
			this.camTilt.current = 0;
		},

        //PABNOTE Move back to library code
        /**
         * General function to convert from cartesian to spherical coordinates.
         *
         * @param {Vector3} coords XYZ cartesian coordinates
         * @return {Vector3} Radius, Theta, Phi
         */
        cartesianToSpherical : function(coords) {
            var r = Math.sqrt(coords.x * coords.x + coords.y * coords.y + coords.z * coords.z);
            var theta = Math.acos(coords.y / r);
            var phi = Math.atan2(coords.x, coords.z);
            return new THREE.Vector3(r,theta,phi);
        },

        //PABNOTE Move back to library code
        /**
         * Point the z axis of the given transform/matrix toward the given point.
         *
         * @param {Object3D} tran the transform/matrix to rotate
         * @param {Vector3} eye XYZ point from which to look (may be the origin)
         * @param {Vector3} target XYZ point at which to aim the z axis
         * @return {Object3D} the rotated transform/matrix
         */
        pointZAt : function(tran, eye, target) {
            var delta = new THREE.Vector3().sub(target, eye),
                rotY = Math.atan2(delta.x, delta.z),
                rotX = -Math.asin(delta.y / delta.length());


            tran.rotation.y = tran.rotation.y + rotY;
            tran.rotation.x = tran.rotation.x + rotX;
            tran.updateMatrix();
            return tran;
        },

        //PABNOTE Move back to library code
        pointAsLocal : function(transform,point) {
		    var W = THREE.Matrix4.makeInvert(transform.matrixWorld);
		    return W.multiplyVector3(point.clone());
	    },
		
		/**
		 * Set the color of the Camera's light source.
		 * 
		 * @param {number[3]} rgb rgb value of the color
		 */
		setLight : function(rgb) {
			this.light.color.value = [rgb[0],rgb[1],rgb[2],1];
			return this;
		},
		
		/**
		 * Set the Camera view to render with an orthographic projection.
		 *
		 * @param {number} axis Enum for xy, xz, or yz plane to look at
		 */
		setOrthographic : function(axis) {
			this.mode.projection = axis;
			this.updateProjection();
		},
		
		/**
		 * Set the Camera view to render with a perspective projection.
		 */
		setPerspective : function() {
			this.mode.projection = 0;
			this.updateProjection();
		},
		
		/**
		 * Set the zooming limits in fixed-eye mode.
		 *
		 * @param {number} min zoom-in limit (in radians)
		 * @param {number} max zoom-out limit (in radians)
		 */
		setZoomLimits : function(min,max) {
			this.fov.min = min;
			this.fov.max = max;
			if (this.fov.current > this.fov.max) {
				this.fov.current = this.fov.max;
			}
			if (this.fov.current < this.fov.min) {
				this.fov.current = this.fov.min;
			}
		},
		
		/**
		 * Get the Octane structure for this Camera.
	     *
	     * @return {Object} the Octane structure representing this Camera
		 */
		toOctane: function() {
			var octane = this._super(),
				curView = hemi.createViewData(this);
			
			octane.props.push({
				name: this.mode.control ? 'enableControl' : 'disableControl',
				arg: []
			});
			octane.props.push({
				name: 'mode',
				val: this.mode
			});
			octane.props.push({
				name: 'moveToView',
				arg: [curView, 0]
			});

			return octane;
		},
		
		/**
		 * Move the Camera towards or away from its current target point by the
		 * given distance.
		 * 
		 * @param {number} distance the distance to move the Camera
		 */
		truck : function(distance) {

			this.pan.rotation.x = this.pan.rotation.x + this.tilt.rotation.x;
            this.pan.updateMatrix();
			this.pan.translateZ(-distance);
            this.pan.updateMatrix();
			this.pan.rotate.x = this.pan.rotate.x - this.tilt.rotate.x;
            this.pan.updateMatrix();
			this.update();
		},
		
		/**
		 * Set up the Camera to interpolate between the two given time values.
		 * 
		 * @param {number} current current time
		 * @param {number} end end time
		 */
		interpolateView : function(current,end) {
			var eye = new THREE.Vector3(), target = new THREE.Vector3(),
				last = this.vd.last,
				cur = this.vd.current,
				upProj = false;
			
			if (this.state.curve) {
				var t = this.easeFunc[0](current,0,1,end);
				eye = this.state.curve.eye.interpolate(t);
				target = this.state.curve.target.interpolate(t);
			} else {
			    eye.x = this.easeFunc[0](current, last.eye.x, cur.eye.x - last.eye.x, end);
                eye.y = this.easeFunc[1](current, last.eye.y, cur.eye.y - last.eye.y, end);
                eye.z = this.easeFunc[2](current, last.eye.z, cur.eye.z - last.eye.z, end);
				target.x = this.easeFunc[0](current, last.target.x, cur.target.x - last.target.x, end);
                target.y = this.easeFunc[1](current, last.target.y, cur.target.y - last.target.y, end);
                target.z = this.easeFunc[2](current, last.target.z ,cur.target.z - last.target.z,end);
			}
			if (cur.fov !== last.fov) {
				this.fov.current = this.easeFunc[0](current,last.fov,cur.fov-last.fov,end);
				upProj = true;
			}
			if (cur.np !== last.np) {
				this.clip.near = this.easeFunc[0](current,last.np,cur.np-last.np,end);
				upProj = true;
			}
			if (cur.fp !== last.fp) {
				this.clip.far = this.easeFunc[0](current,last.fp,cur.fp-last.fp,end);
				upProj = true;
			}	
			if (upProj) {
				this.updateProjection();
			}
			
			this.setEyeTarget(eye,target);
		},
		
		/**
		 * Update the Camera.
		 */
		update : function(delta) {
			var time = this.state.time;
			if (this.state.moving) {
				this.interpolateView(time.current,time.end);
				if (delta != undefined) {
					var d = this.mode.frames ? 1.0/this.FPS : delta;
					if (time.current >= time.end) {
						this.state.moving = false;
						this.state.curve = null;
						
						if (this.state.vp !== null) {
							//this.send(hemi.msg.stop, { viewpoint:this.state.vp });
							this.state.vp = null;
						} else {
							//this.send(hemi.msg.stop, { viewdata:this.vd.current });
						}
					}
					time.current += d;
					if (time.current >= time.end) {
						time.current = time.end;
					}				
				}
			}
            this.identity(this.target);
            this.target.translateZ(-this.distance);
            this.target.updateMatrix();
            //force an update of the transforms so we can get the correct world matricies
            this.updateWorldMatrices();
            var camPosition = this.cam.matrixWorld.getPosition();
            var targetPosition = this.target.matrixWorld.getPosition();
            this.threeCamera.position = camPosition;
            this.threeCamera.updateMatrix();
            this.threeCamera.update(null, true, null);
            this.threeCamera.lookAt(targetPosition);
            if (this.mode.fixedLight) {
				this.light.position = this.threeCamera.position;
                this.light.rotation = this.threeCamera.rotation;
                this.light.scale = this.threeCamera.scale;
                this.light.updateMatrix();
			}
		},
		
		/**
		 * Update the Camera view projection.
		 */
		updateProjection : function() {
			/*var aspect = hemi.view.clientSize.width / hemi.view.clientSize.height;
			if (this.mode.projection) {
				var scale = this.distance;
				hemi.view.viewInfo.drawContext.projection = hemi.core.math.matrix4.orthographic(
					-scale,scale,-scale/aspect,scale/aspect,0,this.clip.far);			
			} else {
				hemi.view.viewInfo.drawContext.projection = hemi.core.math.matrix4.perspective(
					this.fov.current,aspect,this.clip.near,this.clip.far);
			}*/
		},

        /**
         * Changes an object's matrix to the identity matrix
         * This should be moved to Object3D if possible
         * @param object3D Three>
         */
        identity : function(object3D) {
			object3D.position.set(0, 0, 0);
			object3D.rotation.set(0, 0, 0);
			object3D.scale.set(1, 1, 1);
			object3D.updateMatrix();
		},

        updateWorldMatrices : function() {
            this.pan.update(null, true, null);
        }
	};

    hemi.makeCitizen(hemi.CameraBase, 'hemi.Camera', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
	/**
	 * @class A CameraCurve contains an "eye" Curve and a "target" Curve that
	 * allow a Camera to follow a smooth path through several waypoints.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.curve.Curve} eye Curve for camera eye to follow
	 * @param {hemi.curve.Curve} target Curve for camera target to follow
	 */
	hemi.CameraCurve = function(eye, target) {
			this.eye = eye;
			this.target = target;
		};

    hemi.CameraCurve.prototype = {
        constructor : hemi.CameraCurve,
		/**
		 * Send a cleanup Message and remove all references in the CameraCurve.
		 */
		cleanup: function() {
			this._super();
			this.eye = null;
			this.target = null;
		},

		/**
		 * Get the Octane structure for this CameraCurve.
	     *
	     * @return {Object} the Octane structure representing this CameraCurve
		 */
		toOctane: function() {
			var octane = this._super();

			octane.props.push({
				name: 'eye',
				oct: this.eye.toOctane()
			});
			octane.props.push({
				name: 'target',
				oct: this.target.toOctane()
			});

			return octane;
		}
	};

	hemi.ViewData = function(config) {
		var cfg = config || {};
		this.eye = cfg.eye || new THREE.Vector3(0,0,-1);
		this.target = cfg.target || new THREE.Vector3(0,0,0);
		this.up = cfg.up || new THREE.Vector3(0,1,0);
		this.fov = cfg.fov || hemi.viewDefaults.FOV;
		this.np = cfg.np || hemi.viewDefaults.NP;
		this.fp = cfg.fp ||hemi.viewDefaults.FP;
	};

	/**
	 * @class A Viewpoint describes everything needed for a view - eye, target,
	 * up axis, field of view, near plane, and far plane.
	 * @extends hemi.world.Citizen
	 */
	hemi.Viewpoint = function(config) {
        var cfg = config || {};
        this.name = cfg.name || '';
        this.eye = cfg.eye || new THREE.Vector3(0,0,-1);
        this.target = cfg.target || new THREE.Vector3(0,0,0);
        this.up = cfg.up || new THREE.Vector3(0,1,0);
        this.fov = cfg.fov || hemi.viewDefaults.FOV;
        this.np = cfg.np || hemi.viewDefaults.NP;
        this.fp = cfg.fp ||hemi.viewDefaults.FP;
    };

    hemi.Viewpoint.prototype = {
		/**
		 * Get the data contained within the Viewpoint.
		 *
		 * @return {hemi.ViewData} the ViewData for the Viewpoint
		 */
		getData: function() {
			return new hemi.ViewData(this);
		},

		/**
		 * Set the data for the Viewpoint.
		 *
		 * @param {hemi.ViewData} viewData data to set for the Viewpoint
		 */
		setData: function(viewData) {
			this.eye = viewData.eye;
			this.target = viewData.target;
			this.up = viewData.up;
			this.fov = viewData.fov;
			this.np = viewData.np;
			this.fp = viewData.fp;
		},

		/**
		 * Get the Octane structure for this Viewpoint.
	     *
	     * @return {Object} the Octane structure representing this Viewpoint
		 */
		toOctane: function() {
			var octane = this._super();

			var names = ['eye', 'target', 'up', 'fov', 'np', 'fp'];

			for (var ndx = 0, len = names.length; ndx < len; ndx++) {
				var name = names[ndx];

				octane.props.push({
					name: name,
					val: this[name]
				});
			}

			return octane;
		}
	};

	/**
	 * Get the time that the specified animation frame occurs at.
	 *
	 * @param {number} frame frame number to get the time for
	 * @return {number} time that the frame occurs at
	 */
	hemi.getTimeOfFrame = function(frame) {
		return frame / this.FPS;
	};

	/**
	 * Create a new ViewData with the given Camera's current viewing parameters.
	 *
	 * @param {hemi.Camera} camera the Camera to create the Viewpoint from
	 * @return {hemi.ViewData} the newly created ViewData
	 */
	hemi.createViewData = function(camera) {
		return new hemi.ViewData({
			eye: camera.getEye(),
			target: camera.getTarget(),
			up: camera.up,
			fov: camera.fov.current,
			np: camera.clip.near,
			fp: camera.clip.far
		});
	};

	/**
	 * Create a new Viewpoint with the given name and the given Camera's current
	 * viewing parameters.
	 *
	 * @param {string} name the name of the new Viewpoint
	 * @param {hemi.Camera} camera the Camera to create the Viewpoint from
	 * @return {hemi.Viewpoint} the newly created Viewpoint
	 */
	hemi.createViewpoint = function(name, camera) {
		var viewpoint = new hemi.Viewpoint({name: name});
		viewpoint.setData(this.createViewData(camera));
		return viewpoint;
	};

	/**
	 * Create a new Viewpoint with the given name and the given viewing
	 * parameters.
	 *
	 * @param {string} name the name of the new Viewpoint
	 * @param {Vector3} eye the coordinates of the eye
	 * @param {Vector3} target the coordinates of the target
	 * @param {Vector3} up the coordinates of the up direction
	 * @param {number} fov angle of the field-of-view
	 * @return {hemi.Viewpoint} the newly created Viewpoint
	 */
	hemi.createCustomViewpoint = function(name, eye, target, up, fov,
			np, fp) {
		var viewPoint = new hemi.Viewpoint({
			name: name,
			eye: eye,
			target: target,
			up: up,
			fov: fov,
			np: np,
			fp: fp
		});

		return viewPoint;
	};

	return hemi;

})(hemi || {});
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
	
	hemi.ModelBase = function(client) {
		this.client = client;
		this.fileName = null;
	};
	
	hemi.ModelBase.prototype = {
		load: function(callback) {
			var that = this;
			
			hemi.loadCollada(this.fileName, function (collada) {
				var dae = collada.scene;
				that.client.scene.add(dae);
				
				if (callback) {
					callback(dae);
				}
			});
		},
		
		setFileName: function(fileName, callback) {
			this.fileName = fileName;
			this.load(callback);
		}
	};
	
	hemi.makeCitizen(hemi.ModelBase, 'hemi.Model', {
		msgs: ['hemi.load'],
		toOctane: ['fileName', 'load']
	});

	return hemi;
})(hemi || {});
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
	
	hemi.Client = function(renderer) {
		this.camera = new hemi.Camera();
		//this.light = new THREE.DirectionalLight(0xffffff);
		this.renderer = renderer;
		this.scene = new THREE.Scene();
		this.scene.add(this.camera.light);
		//this.scene.add(this.light);
        hemi.input.init(renderer.domElement);
	};
	
	hemi.Client.prototype = {
		addGrid: function() {
			var line_material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } ),
				geometry = new THREE.Geometry(),
				floor = -0.04, step = 1, size = 14;

			for ( var i = 0; i <= size / step * 2; i ++ ) {

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( - size, floor, i * step - size ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3(   size, floor, i * step - size ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor, -size ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( i * step - size, floor,  size ) ) );

			}

			var line = new THREE.Line( geometry, line_material, THREE.LinePieces );
			this.scene.add(line);
		},
		
		onRender: function() {
			this.renderer.render(this.scene, this.camera.threeCamera);
		},
		
		setBGColor: function(hex, opt_alpha) {
			this.renderer.setClearColorHex(hex, opt_alpha == null ? 1 : opt_alpha);
		}
	};
	
	return hemi;
})(hemi || {});
