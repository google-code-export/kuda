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

o3djs.base.o3d = o3d;
/**
 * @namespace The core Hemi library used by Kuda.
 * @version 1.4.2
 */
var hemi = (function(hemi) {
	
	/**
	 * The version of Hemi released: 8/19/11
	 * @constant
	 */
	hemi.version = '1.4.2';

	/**
	 * @namespace A module for handling low level functionality and wrapping
	 * calls to the underlying O3D library.
	 */
	hemi.core = hemi.core || {};

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
	 * Pass the given error message to the registered error handler or throw an
	 * Error if no handler is registered.
	 * 
	 * @param {string} msg error message
	 */
	hemi.core.error = function(msg) {
		if (this.errCallback) {
			this.errCallback(msg);
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
	hemi.core.setErrorCallback = function(callback) {
		this.errCallback = callback;
	};

	hemi.core.init = function(clientElement) {
		// Create aliases o3djs libraries
		this.event = o3djs.event;
		this.loader = o3djs.loader;
		this.math = o3djs.math;
		this.particles = o3djs.particles;
		this.renderGraph = o3djs.rendergraph;
		this.canvas = o3djs.canvas;
		this.material = o3djs.material;
		this.shape = o3djs.shape;
		this.picking = o3djs.picking;
		this.primitives = o3djs.primitives;
		this.io = o3djs.io;
		this.debug = o3djs.debug;

		this.o3dElement = clientElement;
		this.o3d = this.o3dElement.o3d;
		this.client = this.o3dElement.client;
		this.mainPack = this.client.createPack();
		this.errCallback = null;

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
	
	/**
	 * Callback function for whenever a new model file is loaded. This function
	 * updates the picking tree and sets up materials.
	 *
	 * @param {o3d.Pack} pack the pack loaded with scene content
	 */
	hemi.core.loaderCallback = function(pack) {
		// Update picking info
		hemi.picking.pickManager.update();
		
		// Generate draw elements and setup material draw lists.
		o3djs.pack.preparePack(pack, hemi.view.viewInfo);
		
		var materials = pack.getObjectsByClassName('o3d.Material'),
			worldFog = hemi.world.fog;
		
		for (var m = 0; m < materials.length; ++m) {
			var material = materials[m];
			// Connect each material's lightWorldPos param to the camera
			var param = material.getParam('lightWorldPos');
			
			if (param) {
				param.bind(hemi.world.camera.light.position);
			}
			
			param = material.getParam('ambientIntensity');
			
			if (param) {
				param.value = [0.3, 0.3, 0.3, 0.2];
			}
			
			param = material.getParam('ambient');
			
			if (param) {
				param.value = [0.3, 0.3, 0.3, 0.2];
			}
			
			param = material.getParam('lightColor');
		
			if (param) {
				param.bind(hemi.world.camera.light.color);
			}
			
			// For now, the Z-sorted draw list does not work well with
			// transparent shapes like particles. So stick them in the
			// performance list.
			if (material.drawList == hemi.view.viewInfo.zOrderedDrawList) {
				material.drawList = hemi.view.viewInfo.performanceDrawList;
			}
			
			if (worldFog !== null) {
				var fogPrms = hemi.fx.addFog(material);
				fogPrms.start.value = worldFog.start;
				fogPrms.end.value = worldFog.end;
				fogPrms.color.value = worldFog.color;
			}
		}
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
		visible: 'hemi.visible',
		
		// Wildcard functions
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
		subscribe: function(type, handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(hemi.dispatch.WILDCARD, type,
				handler, opt_func, opt_args);
		},
		
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
		unsubscribe: function(target, opt_type) {
			return hemi.dispatch.removeTarget(target, {
				src: hemi.dispatch.WILDCARD,
				msg: opt_type
			});
		}
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
	 * @namespace A module for displaying log, warning, and error messages to a
	 * console element on a webpage.
	 */
	hemi.console = hemi.console || {};
	
	/**
	 * The priority level for an error message.
	 * @type string
	 * @constant
	 */
	hemi.console.ERR = 'ERR';
	
	/**
	 * The priority level for a warning message.
	 * @type string
	 * @constant
	 */
	hemi.console.WARN = 'WARN';
	
	/**
	 * The priority level for a log message.
	 * @type string
	 * @constant
	 */
	hemi.console.LOG = 'LOG';
	
	/* Flag indicating if the console should display log messages */
	var enabled = false;
	/* Flag indicating if timestamps should be added to log messages */
	var showTime = true;
	
	/*
	 * The actual function for logging a message.
	 * 
	 * @param {string} msg the message to log
	 * @param {string} level the priority level of the message
	 */
	var logMessage = function(msg, level) {
		level = level || hemi.console.LOG;
		
		if (testPriority(level)) {
			var fullMsg = level + ':\t' + msg;
			
			if (showTime) {
				var time = getTime();
				fullMsg = time + '\t' + fullMsg;
			}
			
			output(fullMsg);
		}
	};
	
	/*
	 * The default method for displaying a log message.
	 * 
	 * @param {string} msg the full log message to display
	 */
	var output = function(msg) {
		try {
			console.log(msg);
		} catch(e) { }
	};
	
	/*
	 * Get a timestamp for the current time.
	 * 
	 * @return {string} the current timestamp
	 */
	var getTime = function() {
		var currentTime = new Date();
		var hours = currentTime.getHours();
		hours = hours < 10 ? '0' + hours : '' + hours;
		var minutes = currentTime.getMinutes();
		minutes = minutes < 10 ? ':0' + minutes : ':' + minutes;
		var seconds = currentTime.getSeconds();
		seconds = seconds < 10 ? ':0' + seconds : ':' + seconds;
		
		return hours + minutes + seconds;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to LOG priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var logTest = function(level) {
		return level === hemi.console.LOG ||
		       level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to WARN priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var warnTest = function(level) {
		return level === hemi.console.WARN ||
		       level === hemi.console.ERR;
	};
	
	/*
	 * Test if the given priority level for a message is high enough to display
	 * when the console is set to ERR priority.
	 * 
	 * @param {string} level the priority level to check
	 * @return {boolean} true if the level is high enough to display
	 */
	var errTest = function(level) {
		return level === hemi.console.ERR;
	};
	
	/*
	 * This function is aliased to the proper test function for the console's
	 * current priority level.
	 */
	var testPriority = logTest;
	
	/**
	 * Log the given message if the console is enabled or ignore the message if
	 * the console is disabled.
	 * 
	 * @param {string} msg the message to display
	 * @param {string} level the priority level of the message
	 */
	hemi.console.log = hemi.utils.noop;
	
	/**
	 * Enable or disable the console to receive log messages.
	 * 
	 * @param {boolean} en flag indicating if the console should be enabled
	 */
	hemi.console.setEnabled = function(en) {
		if (en == enabled) {
			return;
		}
		
		enabled = en;
		
		if (enabled) {
			hemi.console.log = logMessage;
		} else {
			hemi.console.log = hemi.utils.noop;
		}
	};
	
	/**
	 * Set the function that will be used to display log messages.
	 * 
	 * @param {function(string):void} outFunc
	 */
	hemi.console.setOutput = function(outFunc) {
		output = outFunc;
	};
	
	/**
	 * Set the current priority level of the console. Log messages at the given
	 * priority level or higher will be displayed. Log messages below the
	 * priority level will be ignored.
	 * 
	 * @param {string} priority the priority level to set the console to
	 */
	hemi.console.setPriority = function(priority) {
		switch (priority) {
			case hemi.console.LOG:
				testPriority = logTest;
				break;
			case hemi.console.WARN:
				testPriority = warnTest;
				break;
			case hemi.console.ERR:
				testPriority = errTest;
				break;
		}
	};
	
	/**
	 * Enable or disable timestamping for received log messages.
	 * 
	 * @param {boolean} show flag indicating if messages should be timestamped
	 */
	hemi.console.setShowTime = function(show) {
		showTime = show;
	};
	
	return hemi;
})(hemi || {});/* 
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
	 * @namespace A module for picking shapes in a 3D space from a mouse click.
	 */
	hemi.picking = hemi.picking || {};
	
	/**
	 * The name of the root Transform that all picking is performed on. If a
	 * Transform should be pickable, it must be a child or grandchild of the
	 * pickRoot.
	 * @type string
	 * @constant
	 */
	hemi.picking.PICK_ROOT = 'PickRoot';
	
	/**
	 * Calculate the pick information to describe what shape was clicked in the
	 * 3D scene.
	 *  
	 * @param {o3d.Event} mouseEvent the "mouse down" event to pick with
	 * @return {o3djs.picking.PickInfo} information about the pick that was
	 *     calculated
	 */
	hemi.picking.getPickInfo = function(mouseEvent) {
		var worldRay = hemi.core.picking.clientPositionToWorldRay(
			mouseEvent.x,
			mouseEvent.y,
			hemi.view.viewInfo.drawContext,
			hemi.core.client.width,
			hemi.core.client.height);
		
		this.pickManager.update();
		return this.pickManager.pick(worldRay);
	};
	
	/**
	 * Find the TransformInfo for the given Transform and set its pickable
	 * property.
	 * 
	 * @param {o3d.Transform} transform the Transform to set pickable for
	 * @param {boolean} pickable true to allow picks
	 * @param {boolean} recurse true to apply the change to any child
	 *     Transforms as well
	 */
	hemi.picking.setPickable = function(transform, pickable, recurse) {
		var info = this.pickManager.getTransformInfo(transform);
		
		if (info) {
			info.setPickable(pickable, recurse);
		}
	};
	
	/**
	 * Set up the pickRoot, the transform root that all pickable Transforms
	 * need to be children of.
	 */
	hemi.picking.init = function() {
		// A transform parent to hold pickable transform roots
		this.pickRoot = hemi.core.mainPack.createObject('Transform');
		this.pickRoot.name = hemi.picking.PICK_ROOT;
		this.pickRoot.parent = hemi.core.client.root;
		
		this.pickManager = hemi.core.picking.createPickManager(this.pickRoot);
		/*
		 * Override PickManager's createTransformInfo function so that it will
		 * construct our extended TransformInfo instead. Allows the user to
		 * specify if the referenced Transform should be pickable or not. 
		 */
		this.pickManager.createTransformInfo = function(transform, parent) {
			var info = new o3djs.picking.TransformInfo(transform, parent, this);
			// Add the pickable property
			info.pickable = true;
			// Override the default value for this TransformInfo property
			info.pickableEvenIfInvisible = true;
			
			this.addTransformInfo(info);
			return info;
		};
	};
	
	/**
	 * Set the pickable property for the TransformInfo.
	 * 
	 * @param {boolean} pickable true to allow picks
	 * @param {boolean} recurse true to apply the change to any child
	 *     Transforms as well
	 */
	o3djs.picking.TransformInfo.prototype.setPickable = function(pickable, recurse) {
		this.pickable = pickable;
		
		if (recurse) {
			for (var key in this.childTransformInfos) {
				this.childTransformInfos[key].setPickable(pickable, recurse);
			}
		}
	};
	
	var pickFunc = o3djs.picking.TransformInfo.prototype.pick;
	
	/**
	 * Override TransformInfo's pick function so that we can temporarily
	 * hide the TransformInfo's shapes if it is not pickable.
	 * 
	 * @param {o3djs.picking.Ray} worldRay A ray in world space to pick
	 *     against
	 * @return {o3djs.picking.PickInfo} Information about the picking.
	 *     null if the ray did not intersect any triangles.
	 */
	o3djs.picking.TransformInfo.prototype.pick = function(worldRay) {
		var hiddenShapeInfos = null;
		
		if (!this.pickable) {
			hiddenShapeInfos = this.shapeInfos;
			this.shapeInfos = {};
		}
		
		var pickInfo = pickFunc.call(this, worldRay);
		
		if (!this.pickable) {
			this.shapeInfos = hiddenShapeInfos;
		}
		
		return pickInfo;
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
	 * @namespace A module for loading resources (Octane, models, images, etc).
	 */
	hemi.loader = hemi.loader || {};
	
	/**
	 * The relative path from the referencing HTML file to the Kuda directory.
	 * @type string
	 * @default ''
	 */
	hemi.loader.loadPath = '';
	
	var progressTable = new Hashtable();
	
	var syncedIntervalFcn = function(url, loadInfo) {
		var created = hemi.loader.createTask(url, loadInfo);
		
		if (created) {
			attachProgressListener(url, loadInfo);
		}
	};
	
	var attachProgressListener = function(url, loadInfo) {
		loadInfo.request_.addProgressListener(function(evt) {
			var pct = evt.loaded / evt.total * 100;
			hemi.loader.updateTask(url, pct);
		});
	};
	
	/**
	 * Load the HTML (or HTM) file at the given URL. If an error occurs, an
	 * alert is thrown. Otherwise the given callback is executed and passed the
	 * loaded data.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda
	 *     directory
	 * @param {function(string):void} callback a function to pass the string of
	 *     data that was loaded
	 */
	hemi.loader.loadHtml = function(url, callback) {
		url = hemi.loader.getPath(url);
		
		hemi.utils.get(url, function(data, status) {
			if (data == null) {
				hemi.core.error(status);
			} else {
				callback(data);
			}
		});
	};

	/**
	 * Load the bitmap file at the given URL into the given Pack. If an error
	 * occurs, an alert is thrown. Otherwise the given callback is executed and
	 * passed an array of the loaded bitmaps.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda
	 *     directory
	 * @param {o3d.Pack} pack the Pack to load bitmaps into
	 * @param {function(o3d.Bitmap[]):void} callback a function to pass an array
	 *     of the loaded bitmaps
	 */
	hemi.loader.loadBitmap = function(url, pack, callback) {
		url = hemi.loader.getPath(url);

		hemi.world.loader.loadBitmaps(pack, url,
			function(bitmaps, exception){
				if (exception) {
					hemi.core.error(exception);
				} else {
					callback(bitmaps);
				}
				
				hemi.loader.updateTask(url, 100);
			});
		
		var list = hemi.world.loader.loadInfo.children_,
			loadInfo = list[list.length - 1];
		
		syncedIntervalFcn(url, loadInfo);
	};

	/**
	 * Load the image file at the given URL. If an error occurs, it is logged.
	 * Otherwise the given callback is executed and passed the loaded image.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda
	 *     directory
	 * @param {function(Image):void} callback a function to pass the loaded
	 *     image
	 */
	hemi.loader.loadImage = function(url, callback) {
		++hemi.world.loader.count_;
		var img = new Image();
		
		img.onabort = function() {
			hemi.core.error('Aborted loading: ' + url);
			hemi.world.loader.countDown_();
		};
		img.onerror = function() {
			hemi.core.error('Error loading: ' + url);
			hemi.world.loader.countDown_();
		};
		img.onload = function() {
			callback(img);
			hemi.world.loader.countDown_();
		};
		
		img.src = hemi.loader.getPath(url);
	};

	/**
	 * Load the texture at the given URL. If an error occurs, an alert is
	 * thrown. Otherwise the given callback is executed and passed the texture.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda
	 *     directory
	 * @param {function(o3d.Texture):void} onLoadTexture a function to pass the
	 *     loaded texture
	 * @param {thisArg} opt_this the value for this inside the onLoadTexture
	 *     function 
	 * @param {o3d.Pack} opt_pack the Pack to load bitmaps into
	 */
	hemi.loader.loadTexture = function(url, onLoadTexture, opt_this, opt_pack) {
		url = hemi.loader.getPath(url);
		var pack = opt_pack || hemi.core.mainPack;

		hemi.world.loader.loadTexture(pack, url,
			function(texture, exception) {
				if (exception) {
					hemi.core.error(exception);
				} else {
					onLoadTexture.call(opt_this, texture);
				}

				hemi.loader.updateTask(url, 100);
			});
		
		var list = hemi.world.loader.loadInfo.children_,
			loadInfo = list[list.length - 1];
		
		syncedIntervalFcn(url, loadInfo);
	};

	/**
	 * Load the model file at the given URL into the given Pack and set the
	 * given Transform as the parent of the loaded Transforms. If an error
	 * occurs, an alert is thrown. Otherwise the given optional callback is
	 * executed and passed the pack and parent Transform loaded with data from
	 * the file.
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda
	 *     directory
	 * @param {o3d.Pack} pack the Pack to load textures, shapes, etc into
	 * @param {o3d.Transform} parent the Transform to parent the Model under
	 * @param {function(o3d.Pack, o3d.Transform):void} opt_callback a function
	 *     to pass the Pack and Transform loaded with data from the file
	 * @param {o3djs.serialization.Options} opt_options options for the loader
	 */
	hemi.loader.loadModel = function(url, pack, parent, opt_callback, opt_options) {
		url = hemi.loader.getPath(url);
		opt_options = opt_options || {};

		hemi.world.loader.loadScene(hemi.core.client, pack, parent, url,
			function(pack, parent, exception) {
				if (exception) {
					hemi.core.error(exception);
				} else if (opt_callback) {
					opt_callback(pack, parent);
				}
				
				hemi.loader.updateTask(url, 100);
			}, opt_options);
		
		var list = hemi.world.loader.loadInfo.children_,
			loadInfo = list[list.length - 1];
		
		syncedIntervalFcn(url, loadInfo);
	};

	/**
	 * Load the Octane file at the given URL. If an error occurs, an alert is
	 * thrown. Otherwise the loaded data is decoded into JSON and passed to the
	 * Octane module. If the Octane is for an object, it is created and passed
	 * to the given optional callback. If the Octane is for a World, the current
	 * World is cleaned up and the new World is created. The given optional
	 * callback is then executed, followed by hemi.world.ready().
	 * 
	 * @param {string} url the url of the file to load relative to the Kuda
	 *     directory
	 * @param {function([Object]):void} opt_callback an optional function to
	 *     either pass the Object created or execute before the created World's
	 *     ready function is called
	 */
	hemi.loader.loadOctane = function(url, opt_callback) {
		url = hemi.loader.getPath(url);

		hemi.utils.get(url, function(data, status) {
			if (data == null) {
				hemi.core.error(status);
			} else {
				if (typeof data === 'string') {
					data = JSON.parse(data);
				}
				
				if (data.type) {
					var obj = hemi.octane.createObject(data);
					
					if (opt_callback) {
						opt_callback(obj);
					}
				} else {
					hemi.octane.createWorld(data);
				
					if (opt_callback) {
						opt_callback();
					}
					
					hemi.world.ready();
				}
			}
		});
	};
	
	/**
	 * Get the correct path for the given URL. If the URL is absolute, then
	 * leave it alone. Otherwise prepend it with the load path.
	 * 
	 * @param {string} url the url to update
	 * @return {string} the udpated url
	 */
	hemi.loader.getPath = function(url) {
		if (url.substr(0, 4) === 'http') {
			return url;
		} else {
			return hemi.loader.loadPath + url;
		}
	};
	
	/**
	 * Create a new progress task with the given name and data. Initialize its
	 * progress to 0.
	 * 
	 * @param {string} name the unique name of the task
	 * @param {Object} data any data updated by the task
	 * @return {boolean} true if the task was created successfully, false if
	 *      another task with the given name already exists
	 */
	hemi.loader.createTask = function(name, data) {
		if (progressTable.get(name) !== null) {
			return false;
		}
		
		var obj = {
			percent: 0,
			data: data
		};
		
		progressTable.put(name, obj);
		this.updateTotal();
		return true;
	};
	
	/**
	 * Update the progress of the task with the given name to the given percent.
	 * 
	 * @param {string} name name of the task to update
	 * @param {number} percent percent to set the task's progress to (0-100)
	 * @return {boolean} true if the task was found and updated
	 */
	hemi.loader.updateTask = function(name, percent) {
		var task = progressTable.get(name),
			update = task !== null;
		
		if (update) {
			task.percent = percent;
			
			hemi.world.send(hemi.msg.progress, {
				task: name,
				percent: percent,
				isTotal: false
			});
			
			hemi.loader.updateTotal();
		}
		
		return update;
	};
	
	/**
	 * Send an update on the total progress of all loading activities, and clear
	 * the progress table if they are all finished.
	 */
	hemi.loader.updateTotal = function() {
		var total = progressTable.size(),
			values = progressTable.values(),
			percent = 0;
			
		for (var ndx = 0; ndx < total; ndx++) {
			var fileObj = values[ndx];
			
			percent += fileObj.percent / total;
		}
		
		hemi.world.send(hemi.msg.progress, {
			task: 'Total Progress',
			isTotal: true,
			percent: percent
		});
		
		if (percent >= 99.9) {
			progressTable.clear();
		}
		
		return percent;
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
	 * @namespace A module for managing all elements of a 3D world. The World
	 * manages a set of Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};
	
	/* The reserve ids, which belong to Hemi library modules */
	var reserveIds = 50;
	hemi.world.WORLD_ID = 0;
	
	/* The next id to assign to a Citizen requesting a world id */
	var nextId = reserveIds;
	
	/*
	 * Create a loader that will:
	 * 1) Send out a ready message once all resources are loaded.
	 * 2) Replace itself with a loader that will call this function again when
	 *    the World is cleaned up.
	 */
	var createWorldLoader = function() {
		return hemi.core.loader.createLoader(function() {
			// Reset the loader so that the other modules can continue
			// loading things after the World has been initialized.
			hemi.world.loader = hemi.core.loader.createLoader(function() {
				hemi.console.log('Backup world loader is finished.');
			});
			
			hemi.world.send(hemi.msg.ready, {});
		});
	};
	
	/*
	 * Get the library module with the given reserve id.
	 * 
	 * @param {number} id the id of the module to get
	 * @return {Object} the matching module or null
	 */
	var getReserve = function(id) {
		var reserve;
		
		switch(id) {
			case hemi.world.WORLD_ID:
				reserve = hemi.world;
				break;
			default:
				reserve = null;
		}
		
		return reserve;
	};
	
	/**
	 * @class A Citizen is a uniquely identifiable member of a World that is
	 * able to send Messages through the World's dispatch. The Citizen's id is
	 * all that is necessary to retrieve the Citizen from its World, regardless
	 * of its type.
	 */
	hemi.world.Citizen = hemi.Class.extend({
		init: function() {
			/**
			 * The name of the Citizen.
			 * @type string
			 * @default ''
			 */
			this.name = '';
			/* The unique identifier for any Citizen of the World */
			this.worldId = null;
			hemi.world.addCitizen(this);
		},
		
        /**
         * Essentially a class name for Citizens.
         * @type string
         */
        citizenType: 'hemi.world.Citizen',
		
		/**
		 * Array of Hemi Messages that the Citizen is known to send.
		 * @type string[]
		 */
		msgSent: [
			hemi.msg.cleanup
		],
		
		/**
		 * Get the Citizen's type (similar to class in Java).
		 * 
		 * @return {string} the type
		 */
		getCitizenType: function() {
			return this.citizenType;
		},
		
		/**
		 * Set the Citizen's type (similar to class in Java).
		 * 
		 * @param {string} type the type to set
		 */
		setCitizenType: function(type) {
			this.citizenType = type;
		},
		
		/**
		 * Get the Citizen's id.
		 * 
		 * @return {number} the id
		 */
		getId: function() {
			return this.worldId;
		},
		
		/**
		 * Set the Citizen's id.
		 * 
		 * @param {number} id the id to set
		 */
		setId: function(id) {
			var oldId = this.worldId;
			this.worldId = id;
			
			if (oldId !== null) {
				hemi.world.citizens.remove(oldId);
				hemi.world.citizens.put(id, this);
			}
		},
		
		/**
		 * Send a cleanup Message and remove the Citizen from the World.
		 * Subclasses should extend this so that it removes all references to
		 * the Citizen.
		 */
		cleanup: function() {
			this.send(hemi.msg.cleanup, {});
			hemi.world.removeCitizen(this);
		},
		
		/**
		 * Receive the given Transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 */
		receiveTransform: function(transform) {
			hemi.console.log('Transform ignored by Citizen with id ' + this.worldId, hemi.console.WARN);
		},
		
		/**
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
		subscribe: function(type, handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this.worldId, type, handler,
				opt_func, opt_args);
		},
		
		/**
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
		subscribeAll: function(handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this.worldId, hemi.dispatch.WILDCARD,
				handler, opt_func, opt_args);
		},
		
		/**
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
		unsubscribe: function(target, opt_type) {
			return hemi.dispatch.removeTarget(target, {
				src: this.worldId,
				msg: opt_type
			});
		},
		
		/**
		 * Send a Message with the given attributes from the Citizen to any
		 * registered MessageTargets.
		 * 
		 * @param {string} type type of Message
		 * @param {Object} data container for any and all information relevant
		 *        to the Message
		 */
		send: function(type, data) {
			hemi.dispatch.postMessage(this, type, data);
		},
		
	    /**
	     * Get the Octane structure for the Citizen. The structure returned is:
	     * <pre>
	     * {
	     *     id: the Citizen's world id
	     *     type: the Citizen's type
	     *     props: the Citizen's properties (name and id/value)
	     *     init: a function of the Citizen to execute after it is loaded 
	     * }
	     * </pre>
	     *
	     * @return {Object} the Octane structure representing the Citizen
	     */
		toOctane: function() {
			var octane = {
				id: this.worldId,
				type: this.citizenType,
				props: []
			};
			
			if (this.name.length > 0) {
	            octane.props.push({
	                name: 'name',
	                val: this.name
	            });
			}
			
			return octane;
		}
	});
	
	/**
	 * @class A TransformOwner contains a Citizen that owns at least one
	 * Transform and entries of other Citizens that need to be given any of
	 * those Transforms as they become available during Octane loading.
	 */
	hemi.world.TransformOwner = hemi.Class.extend({
		init: function() {
			this.citizen = null;
			this.entries = new Hashtable();
			this.toLoad = null;
		},
		
		/**
		 * Distribute the Transforms of the owning Citizen to any other Citizens
		 * that have registered interest in those Transforms.
		 */
		distribute: function() {
			if (this.toLoad !== null) {
				this.load();
			}
			
			this.entries.each(function(key, value) {
				var tran = value.transform,
					targets = value.targets;
				
				for (var i = 0, il = targets.length; i < il; i++) {
					targets[i].receiveTransform(tran);
				}
			});
		},
		
		/**
		 * Get the entry for the given Transform or create one if it does not
		 * already exist.
		 * 
		 * @param {o3d.Transform} transform the Transform to get the entry for
		 * @return {Object} the fetched or created entry
		 */
		getEntry: function(transform) {
			var entry = this.entries.get(transform.name);
			
			if (entry === null) {
				entry = {
					transform: transform,
					targets: []
				};
				this.entries.put(transform.name, entry);
			}
			
			return entry;
		},
		
		/**
		 * Load the entries restored from Octane into the TransformOwner.
		 */
		load: function() {
			var citizen = this.citizen,
				toLoad = this.toLoad;
			
			for (var i = 0, il = toLoad.length; i < il; i++) {
				var ent = toLoad[i],
					transform = null;
				
				if (citizen.getTransform != null) {
					transform = citizen.getTransform();
				} else if (citizen.getTransforms != null) {
					var tforms = citizen.getTransforms(ent.name);
					
					if (tforms.length === 1) {
						transform = tforms[0];
					}
				}
				
				if (transform != null) {
					var entry = this.getEntry(transform),
						tIds = ent.tIds;
					
					for (var j = 0, jl = tIds.length; j < jl; j++) {
						var target = hemi.world.getCitizenById(tIds[j]);
						
						if (target != null) {
							entry.targets.push(target);
						} else {
							hemi.console.log('Unable to locate Citizen with id ' +
								tIds[j], hemi.console.WARN);
						}
					}
				} else {
					hemi.console.log('Unable to load entry with name ' +
						ent.name + ' for TransformOwner with name ' +
						this.citizen.name, hemi.console.ERR);
				}
			}
			
			this.toLoad = null;
		},
		
		/**
		 * Register the given Citizen to receive the given Transform when it
		 * becomes available during Octane loading.
		 * 
		 * @param {o3d.Transform} transform the Transform to give
		 * @param {hemi.world.Citizen} target the Citizen to receive it
		 */
		register: function(transform, target) {
			var entry = this.getEntry(transform),
				ndx = entry.targets.indexOf(target);
			
			if (ndx === -1) {
				entry.targets.push(target);
			}
		},
		
	    /**
	     * Get the Octane structure for the TransformOwner.
	     *
	     * @return {Object} the Octane structure representing the TransformOwner
	     */
		toOctane: function() {
			var octane = {
					type: 'hemi.world.TransformOwner',
					props: [{
						name: 'citizen',
						id: this.citizen.getId()
					}]
				},
				ents = [];
			
			this.entries.each(function(key, value) {
				var targets = value.targets,
					targs = [];
				
				for (var i = 0, il = targets.length; i < il; i++) {
					targs.push(targets[i].getId());
				}
				
				ents.push({
					name: key,
					tIds: targs
				});
			});
			
			octane.props.push({
				name: 'toLoad',
				val: ents
			});
			
			return octane;
		},
		
		/**
		 * Remove the entry for the given Citizen and Transform.
		 * 
		 * @param {o3d.Transform} transform the Transform in the entry
		 * @param {hemi.world.Citizen} target the Citizen in the entry
		 */
		unregister: function(transform, target) {
			var entry = this.getEntry(transform),
				ndx = entry.targets.indexOf(target);
			
			if (ndx !== -1) {
				entry.targets.splice(ndx, 1);
				
				if (entry.targets.length === 0) {
					this.entries.remove(transform.name);
				}
			}
		}
	});
	
	/**
	 * @class A TransformRegistry maintains listings of which Transforms to
	 * distribute to which Citizens as they become available during Octane
	 * loading. This is necessary because Transforms are not proper Citizens.
	 */
	hemi.world.TransformRegistry = hemi.Class.extend({
		init: function() {
			this.owners = new Hashtable();
			this.toLoad = null;
		},
		
		/**
		 * Distribute the Transforms of the given Citizen to any other Citizens
		 * that have registered interest in those Transforms.
		 * 
		 * @param {hemi.world.Citizen} citizen the Citizen to distribute
		 *     Transforms for
		 */
		distribute: function(citizen) {
			if (this.toLoad !== null) {
				this.load();
			}
			
			var owner = this.owners.get(citizen.getId());
			
			if (owner !== null) {
				owner.distribute();
			}
		},
		
		/**
		 * Get the TransformOwner entry for the given Citizen or create one if
		 * it does not already exist.
		 * 
		 * @param {hemi.world.Citizen} citizen the Citizen to get the entry for
		 * @return {hemi.world.TransformOwner} the fetched or created entry
		 */
		getOwner: function(citizen) {
			var id = citizen.getId(),
				owner = this.owners.get(id);
			
			if (owner === null) {
				owner = new hemi.world.TransformOwner();
				owner.citizen = citizen;
				this.owners.put(id, owner);
			}
			
			return owner;
		},
		
		/**
		 * Load the entries restored from Octane into the TransformRegistry.
		 */
		load: function() {
			var toLoad = this.toLoad;
			
			for (var i = 0, il = toLoad.length; i < il; i++) {
				var owner = toLoad[i],
					cit = owner.citizen;
				
				if (cit) {
					this.owners.put(owner.citizen.getId(), owner);
				} else {
					hemi.console.log('TransformOwner has null citizen.', hemi.console.ERR);
				}
			}
			
			this.toLoad = null;
		},
		
		/**
		 * Register the given Citizen to receive the given Transform when it
		 * becomes available during Octane loading.
		 * 
		 * @param {o3d.Transform} transform the Transform to give
		 * @param {hemi.world.Citizen} target the Citizen to receive it
		 */
		register: function(transform, target) {
			var param = transform.getParam('ownerId');
			
			if (param !== null) {
				var citizen = hemi.world.getCitizenById(param.value),
					owner = this.getOwner(citizen);
				
				owner.register(transform, target);
			}
		},
		
	    /**
	     * Get the Octane structure for the TransformRegistry.
	     *
	     * @return {Object} the Octane structure representing the TransformRegistry
	     */
		toOctane: function() {
			var octane = {
					type: 'hemi.world.TransformRegistry',
					props: []
				},
				oct = [];
			
			this.owners.each(function(key, value) {
				oct.push(value.toOctane());
			});
			
			octane.props.push({
				name: 'toLoad',
				oct: oct
			});
			
			return octane;
		},
		
		/**
		 * Remove the entry for the given Citizen and Transform.
		 * 
		 * @param {o3d.Transform} transform the Transform in the entry
		 * @param {hemi.world.Citizen} target the Citizen in the entry
		 */
		unregister: function(transform, target) {
			var param = transform.getParam('ownerId'),
				owner = null;
			
			if (param !== null) {
				var citizen = hemi.world.getCitizenById(param.value);
				
				if (citizen !== null) {
					owner = this.getOwner(citizen);
				}
			}
			
			if (owner !== null) {
				owner.unregister(transform, target);
				
				if (owner.entries.length === 0) {
					this.owners.remove(param.value);
				}
			}
		}
	});
	
	/* All of the Citizens of the World */
	hemi.world.citizens = new hemi.utils.Hashtable();
	/* The loader used to load resources */
	hemi.world.loader = null;
	/* Array of callbacks for when a new World Camera is set */
	hemi.world.camCallbacks = [];
	/* A handler that consumes pick Messages rather than passing them on */
	hemi.world.pickGrabber = null;
	/* The registry of transforms to distribute to Citizens at Octane loading */
	hemi.world.tranReg = new hemi.world.TransformRegistry();
	/* Fog properties for the World */
	hemi.world.fog = null;
	
	/**
	 * Array of Hemi Messages that the World is known to send.
	 * @type string[]
	 */
	hemi.world.msgSent = [
		hemi.msg.cleanup,
		hemi.msg.pick,
		hemi.msg.ready
	];
	
	/**
	 * The Camera that provides a view of the World.
	 * @type hemi.view.Camera
	 */
	hemi.world.camera = null;
	
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
	hemi.world.getId = function() {
		return hemi.world.WORLD_ID;
	};
	
	/**
	 * Get the Octane structure for the World.
     * 
	 * @param {function(Citizen): boolean} opt_filter optional filter function
	 *     that takes a Citizen and returns true if the Citizen should be
	 *     included in the returned Octane
     * @return {Object} the Octane structure representing the World
	 */
	hemi.world.toOctane = function(opt_filter) {
		var octane = {
			version: hemi.version,
			nextId: nextId,
			camera: this.camera.getId(),
			citizens: [],
			fog: this.fog
		};
		
		this.citizens.each(function(key, value) {
			var accept = opt_filter ? opt_filter(value) : true;
			
			if (accept) {
				var oct = value.toOctane();
				
				if (oct !== null) {
					octane.citizens.push(oct);
				} else {
					hemi.console.log('Null Octane returned by Citizen with id ' + value.getId(), hemi.console.WARN);
				}
			}
		});
		
		octane.dispatch = hemi.dispatch.toOctane();
		octane.tranReg = this.tranReg.toOctane();
		
		return octane;
	};
	
	/**
	 * Activate the World once all resources are loaded. This function should
	 * only be called after all scripting and setup is complete.
	 */
	hemi.world.ready = function() {
		// Allow any potential loading to finish, then send an Init message
		this.loader.finish();
	};
	
	/**
	 * Perform cleanup on the World and release all resources. This effectively
	 * resets the World.
	 */
	hemi.world.cleanup = function() {
		this.send(hemi.msg.cleanup, {});
		this.loader.finish();
		this.loader = createWorldLoader();
		
		if (this.fog !== null) {
			this.clearFog();
		}
		
		this.citizens.each(function(key, value) {
			value.cleanup();
		});
		
		if (this.citizens.size() > 0) {
			hemi.console.log('World cleanup did not remove all citizens.', hemi.console.ERR);
		}
		
		// Set the World's attributes back to their initial values.
		nextId = reserveIds;
		this.camera = null;
		this.setCamera(new hemi.view.Camera());
		this.pickGrabber = null;
	};
	
	/**
	 * Try to perform a pick when there is a 'mouse down' event.
	 * 
	 * @param {o3d.Event} mouseEvent the 'mouse down' event
	 */
	hemi.world.onMouseDown = function(mouseEvent) {
		var pickInfo = hemi.picking.getPickInfo(mouseEvent);
		
		if (pickInfo) {				
			if (this.pickGrabber != null) {
				this.pickGrabber.onPick(pickInfo);
			} else {
		        this.send(
					hemi.msg.pick,
					{
						mouseEvent: mouseEvent,
						pickInfo: pickInfo
					});
			}
		}
	};
	
	/**
	 * Add the given function to the list of callbacks for when a new Camera is
	 * set for the World.
	 * 
	 * @param {function(hemi.view.Camera):void} callback function to execute
	 */
	hemi.world.addCamCallback = function(callback) {
		if (this.camCallbacks.indexOf(callback) === -1) {
			this.camCallbacks.push(callback);
		}
	};
	
	/**
	 * Remove the given function from the list of callbacks for when a new
	 * Camera is set for the World.
	 * 
	 * @param {function(hemi.view.Camera):void} callback function to remove
	 */
	hemi.world.removeCamCallback = function(callback) {
		var ndx = this.camCallbacks.indexOf(callback);
		
		if (ndx !== -1) {
			this.camCallbacks.splice(ndx, 1);
		}
	};
	
	/**
	 * Register the given handler as the 'pick grabber'. The pick grabber
	 * intercepts pick messages and prevents them from being passed to other
	 * handlers. It should be used if the user enters an 'interaction mode' that
	 * overrides default behavior.
	 * 
	 * @param {Object} grabber an object that implements onPick()
	 */
	hemi.world.setPickGrabber = function(grabber) {
		this.pickGrabber = grabber;
	};
	
	/**
	 * Remove the current 'pick grabber'. Allow pick messages to continue being
	 * passed to the other registered handlers.
	 * 
	 * @return {Object} the removed grabber or null
	 */
	hemi.world.removePickGrabber = function() {
		var grabber = this.pickGrabber;
		this.pickGrabber = null;

		return grabber;
	};
	
	/**
	 * Set the Camera for the World.
	 * 
	 * @param {hemi.view.Camera} camera the Camera to use
	 */
	hemi.world.setCamera = function(camera) {
		if (this.camera) {
			this.camera.cleanup();
		}
		
		this.camera = camera;
		
		if (camera !== null) {
			camera.name = 'World Cam';
			
			for (var i = 0, il = this.camCallbacks.length; i < il; i++) {
				this.camCallbacks[i](camera);
			}
		}
	};
	
	/**
	 * Add the given Citizen to the World and give it a world id if it does not
	 * already have one.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen.getId();
		
		if (id == null) {
			id = this.getNextId();
			citizen.setId(id);
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
		var id = citizen.getId();
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
				if (attributes.worldId < reserveIds) {
					// They are looking for a reserve, not a Citizen.
					return getReserve(attributes.worldId);
				}
				
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
		var cit;
		
		if (id < reserveIds) {
			cit = getReserve(id);
		} else {
			cit = this.citizens.get(id);
		}
		
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
	
	/**
	 * Send a Message with the given attributes from the World to any registered
	 * MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.world.send = function(type, data) {
		hemi.dispatch.postMessage(hemi.world, type, data);
	};
	
	/**
	 * Register the given handler to receive Messages of the specified type
	 * from the World. This creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an
	 *     object
	 * @param {string[]} opt_args optional array of names of arguments to pass
	 *     to the handler. Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.world.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.world.WORLD_ID, type, handler,
			opt_func, opt_args);
	};
	
	/**
	 * Remove the given MessageTarget for Messages of the specified type for the
	 * World.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove
	 *     from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was registered
	 *     for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
	 *     null
	 */
	hemi.world.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.world.WORLD_ID,
			msg: opt_type
		});
	};
	
	/** 
	 * Clear fog from this world.
	 */
	hemi.world.clearFog = function() {
		var color = hemi.view.defaultBG;
			start = this.camera.clip.far;
			end = start + 10;
		
		this.setFog(color, start, end);
		this.fog = null;
	};
	
	/** 
	 * Add fog to this world.
	 *
	 * @param {number[4]} color The rgba color of the fog
	 * @param {number} start The distance at which the fog starts
	 * @param {number} end The distance at which the fog is fully opaque
	 */
	hemi.world.setFog = function(color,start,end) {
		var mats = [];
		var models = hemi.world.getModels();
		for (var i = 0; i < models.length; i++) {
			mats = mats.concat(models[i].materials);
		}
		mats= mats.concat(hemi.core.mainPack.getObjectsByClassName('o3d.Material'));
		for (i = 0; i < mats.length; i++) {
			var fogPrms = hemi.fx.addFog(mats[i]);
			fogPrms.start.value = start;
			fogPrms.end.value = end;
			fogPrms.color.value = color;
		}
		hemi.view.setBGColor(color);
		
		this.fog = {
			color: color,
			start: start,
			end: end
		};
	};
	
	/**
	 * Setup the initial World.
	 */
	hemi.world.init = function() {
		nextId = reserveIds;
		hemi.world.loader = createWorldLoader();
		hemi.world.setCamera(new hemi.view.Camera());
		hemi.input.addMouseDownListener(this);
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
	 * @namespace A module for creating objects (including Worlds) from Octane.
	 */
	hemi.octane = hemi.octane || {};
	
	/**
	 * Create the World and Dispatch from the given Octane.
	 * 
	 * @param {Object} octane the structure containing information for setting
	 *     up the World and Dispatch
	 */
	hemi.octane.createWorld = function(octane) {
		hemi.world.cleanup();
		var citizenCount = octane.citizens.length;
		// Set the nextId value to a negative number so that we don't have to
		// worry about overlapping world ids between the constructed Citizens
		// and their actual ids that are restored from Octane.
		var fakeId = citizenCount * -2;
		hemi.world.setNextId(fakeId);
		
		// Do the bare minimum: create Citizens and set their ids
		for (var ndx = 0; ndx < citizenCount; ndx++) {
			var citOctane = octane.citizens[ndx];
			
			if (citOctane.id === octane.camera) {
				// Get rid of the old one first
				hemi.world.setCamera(null);
			}
			
			var obj = hemi.octane.createObject(citOctane);
			
			if (citOctane.id === octane.camera) {
				hemi.world.setCamera(obj);
			}
		}
		
		// Now set the World nextId to its proper value.
		hemi.world.setNextId(octane.nextId);
		
		if (octane.fog != null) {
			var f = octane.fog;
			hemi.world.setFog(f.color, f.start, f.end);
		}
		
		// Next set up the message dispatch
		var entryOctane = octane.dispatch.ents;
		var entries = [];
		
		for (var ndx = 0, len = entryOctane.length; ndx < len; ndx++) {
			var entry = hemi.octane.createObject(entryOctane[ndx]);
			hemi.octane.setProperties(entry, entryOctane[ndx]);
			entries.push(entry);
		}
		
		hemi.dispatch.loadEntries(entries);
		hemi.dispatch.setNextId(octane.dispatch.nextId);
		
		// Now rebuild the transform registry
		hemi.world.tranReg = hemi.octane.createObject(octane.tranReg);
		hemi.octane.setProperties(hemi.world.tranReg, octane.tranReg);
		
		// Now set Citizen properties and resolve references to other Citizens
		for (var ndx = 0; ndx < citizenCount; ndx++) {
			var citOctane = octane.citizens[ndx];
			hemi.octane.setProperties(hemi.world.getCitizenById(citOctane.id), citOctane);
		}
	};
	
	/**
	 * Create an object from the given Octane structure and set its id. No other
	 * properties will be set yet.
	 * 
	 * @param {Object} octane the structure containing information for creating
	 *     an object
	 * @return {Object} the newly created object
	 */
	hemi.octane.createObject = function(octane) {
		if (!octane.type) {
			alert("Unable to process octane: missing type");
			return null;
		}
		
		var object = eval("new " + octane.type + "();");
		
		if (octane.id !== undefined) {
			object.setId(octane.id);
		}
		
		return object;
	};
	
	/**
	 * Iterate through the given Octane structure and set properties for the
	 * given object. Properties stored by value will be set directly, by Octane
	 * will be recursively created, by id will be retrieved from the World, and
	 * by arg will be set by calling the specified function on the object.
	 * 
	 * @param {Object} object the object created from the given Octane
	 * @param {Object} octane the structure containing information about the
	 *     given object
	 */
	hemi.octane.setProperties = function(object, octane) {
		for (var ndx = 0, len = octane.props.length; ndx < len; ndx++) {
			var property = octane.props[ndx];
			var name = property.name;
			
			if (property.oct !== undefined) {
				if (property.oct instanceof Array) {
					value = [];
					
					for (var p = 0, pLen = property.oct.length; p < pLen; p++) {
						var child = hemi.octane.createObject(property.oct[p]);
						hemi.octane.setProperties(child, property.oct[p]);
						value.push(child);
					}
				} else {
					value = hemi.octane.createObject(property.oct);
					hemi.octane.setProperties(value, property.oct);
				}
				
				object[name] = value;
			} else if (property.val !== undefined) {
				object[name] = property.val;
			} else if (property.id !== undefined) {
				var value;
				
				if (property.id instanceof Array) {
					value = [];
					
					for (var p = 0, pLen = property.id.length; p < pLen; p++) {
						value.push(hemi.world.getCitizenById(property.id[p]));
					}
				} else {
					value = hemi.world.getCitizenById(property.id);
				}
				
				object[name] = value;
			} else if (property.arg !== undefined) {
				var func = object[name];
				func.apply(object, property.arg);
			} else {
				alert('Unable to process octane for ' + octane.id + ': missing property value');
			}
		}
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
	 * @namespace A module for prebuilt Message handlers that perform common
	 * Message handling tasks more easily.
	 */
	hemi.handlers = hemi.handlers || {};
	
	/**
	 * @class A ValueCheck handler checks a set of values against a specified
	 * set of values from the Message to handle. If the values all match, the
	 * Message is passed to the actual handler.
	 * @extends hemi.world.Citizen
	 */
	hemi.handlers.ValueCheck = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * A Citizen that the ValueCheck may be using.
			 * @type hemi.world.Citizen
			 */
			this.citizen = null;
			/**
			 * The values to check for.
			 * @type Object[]
			 */
			this.values = [];
			/**
			 * The parameter names to use to get the values to check.
			 * @type string[]
			 */
			this.valueParams = [];
			/**
			 * The handler object for the Message.
			 * @type Object
			 */
			this.handler = null;
			/**
			 * The name of the object function to pass the Message to.
			 * @type string
			 */
			this.func = null;
			/**
			 * Optional array to specify arguments to pass to the handler. Otherwise
			 * just pass it the Message.
			 * @type string[]
			 */
			this.args = [];
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         */
		citizenType: 'hemi.handlers.ValueCheck',
		
		/**
		 * Send a cleanup Message and remove all references in the ValueCheck.
		 */
		cleanup: function() {
			this._super();
			
			this.citizen = null;
			this.values = [];
			this.handler = null;
			this.args = [];
		},
		
		/**
		 * Check the specified value parameters against the specified values to
		 * determine if the given Message should be passed to the handler
		 * object.
		 * 
		 * @param {hemi.dispatch.Message} message the Message to handle
		 */
		handleMessage: function(message) {
			var values = hemi.dispatch.getArguments(message, this.valueParams),
				match = true;
			
			for (var ndx = 0, len = values.length; match && ndx < len; ndx++) {
				var val = values[ndx];
				
				if (val != null && val.getId !== undefined) {
					match = this.values[ndx] === val.getId();
				} else {
					match = this.values[ndx] === val;
				}
			}
			
			if (match) {
				var args = hemi.dispatch.getArguments(message, this.args);
				this.handler[this.func].apply(this.handler, args);
			}
		},
		
		/**
		 * Get the Octane structure for the ValueCheck.
	     *
	     * @return {Object} the Octane structure representing the ValueCheck
		 */
        toOctane: function() {
            var octane = this._super(),
            	valNames = ['values', 'valueParams', 'func', 'args'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			};
            
            octane.props.push({
                name: 'handler',
                id: this.handler.getId()
            });
			
			if (this.citizen) {
				octane.props.push({
	                name: 'citizen',
	                id: this.citizen.getId()
	            });
			}
            
            return octane;
        }
	});
	
	/**
	 * Create a ValueCheck handler that will check pick Messages for the given
	 * shape name.
	 * 
	 * @param {hemi.model.Model} model the Model containing the shape to pick
	 * @param {string} shapeName the shape name to check for
	 * @param {Object} handler handler object for the Message.
	 * @param {string} func name of the object function to pass the Message to
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     the handler. Otherwise just pass it the Message.
	 * @return {hemi.handlers.ValueCheck} the created ValueCheck handler
	 */
	hemi.handlers.handlePick = function(model, shapeName, handler, func, opt_args) {
		var valCheck = new hemi.handlers.ValueCheck();
		valCheck.citizen = model;
		valCheck.values = [shapeName];
		valCheck.valueParams = [hemi.dispatch.MSG_ARG + 'data.pickInfo.shapeInfo.shape.name'];
		valCheck.handler = handler;
		valCheck.func = func;
		
		if (opt_args) {
			valCheck.args = opt_args;
		}
		
		return hemi.world.subscribe(hemi.msg.pick, valCheck, 'handleMessage');
	};
	
	/**
	 * Create a ValueCheck handler that will check Camera move Messages for the
	 * given viewpoint.
	 * 
	 * @param {hemi.view.Camera} camera the camera to receive Messages from
	 * @param {hemi.view.Viewpoint} viewpoint the viewpoint to check for
	 * @param {Object} handler handler object for the Message.
	 * @param {string} func name of the object function to pass the Message to
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     the handler. Otherwise just pass it the Message.
	 * @return {hemi.handlers.ValueCheck} the created ValueCheck handler
	 */
	hemi.handlers.handleCameraMove = function(camera, viewpoint, handler, func, opt_args) {
		var valCheck = new hemi.handlers.ValueCheck();
		valCheck.citizen = camera;
		valCheck.values = [viewpoint.getId()];
		valCheck.valueParams = [hemi.dispatch.MSG_ARG + 'data.viewpoint'];
		valCheck.handler = handler;
		valCheck.func = func;
		
		if (opt_args) {
			valCheck.args = opt_args;
		}
		
		return camera.subscribe(hemi.msg.stop, valCheck, 'handleMessage');
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
	 * @namespace A module for supporting audio playback with HTML5's audio tag.
	 */
	hemi.audio = hemi.audio || {};

	/**
	 * @class An Audio contains an audio DOM element that can be played, paused,
	 * etc.
	 * @extends hemi.world.Citizen
	 */
	hemi.audio.Audio = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/*
			 * The actual audio DOM element.
			 */
			this.audio = document.createElement('audio');
			/*
			 * Flag indicating if the Audio should loop when it ends.
			 */
			this.looping = false;
			/*
			 * Flag indicating if a seek operation is currently happening.
			 */
			this.seeking = false;
			/*
			 * Flag indicating if the Audio should start playing when the current
			 * seek operation finishes.
			 */
			this.startPlay = false;
			/*
			 * Array of objects containing source URLs, types, and DOM elements.
			 */
			this.urls = [];
			var that = this;
			
			// For now, onevent functions (like onemptied) are not supported for
			// media elements in Webkit browsers.
			this.audio.addEventListener('emptied', function(e) {
					that.send(hemi.msg.unload, { });
				}, true);
			this.audio.addEventListener('loadeddata', function(e) {
	//				that.setLoop_();	*see below*
					that.send(hemi.msg.load, {
						src: that.audio.currentSrc
					});
				}, true);
			this.audio.addEventListener('playing', function(e) {
					that.send(hemi.msg.start, { });
				}, true);
			this.audio.addEventListener('ended', function(e) {
					if (that.looping) {
						that.play();
					}
					
					that.send(hemi.msg.stop, { });
				}, true);
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.audio.Audio',
		
		/**
		 * Add the given URL as a source for the audio file to load.
		 * 
		 * @param {string} url the URL of the audio file
		 * @param {string} type the type of the audio file (ogg, mpeg, etc)
		 */
		addUrl: function(url, type) {
			var src = document.createElement('source'),
				loadUrl = hemi.loader.getPath(url);
			
			src.setAttribute('src', loadUrl);
			src.setAttribute('type', 'audio/' + type);
			this.audio.appendChild(src);
			this.urls.push({
				url: url,
				type: type,
				node: src
			});
		},
		
		/**
		 * Send a cleanup Message and remove all references in the Audio.
		 */
		cleanup: function() {
			this._super();
			this.audio = null;
			this.urls = [];
		},
		
		/**
		 * Get the length of the current audio media.
		 * 
		 * @return {number} length of media in seconds
		 */
		getDuration: function() {
			if (this.audio) {
				return this.audio.duration;
			} else {
				return null;
			}
		},
		
		/**
		 * Get the current volume of the audio media. Volume ranges from 0.0 to
		 * 1.0.
		 * 
		 * @return {number} the current volume
		 */
		getVolume: function() {
			if (this.audio) {
				return this.audio.volume;
			} else {
				return null;
			}
		},
		
		/**
		 * Pause the audio media if it is currently playing.
		 */
		pause: function() {
			if (this.audio && !this.audio.paused) {
				this.audio.pause();
				this.startPlay = false;
			}
		},
		
		/**
		 * Play the audio media if it is not already doing so. If the media is
		 * in the middle of a seek operation, the Audio will wait until it
		 * finishes before playing.
		 */
		play: function() {
			if (this.audio) {
				if (this.seeking) {
					this.startPlay = true;
				} else if (this.audio.paused || this.audio.ended) {
					this.audio.play();
				}
			}
		},
		
		/**
		 * Remove the given URL as a source for the audio file to load.
		 * 
		 * @param {string} url the URL to remove
		 */
		removeUrl: function(url) {
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				if (urlObj.url === url) {
					this.audio.removeChild(urlObj.node);
					this.urls.splice(i, 1);
					
					if (urlObj.node.src === this.audio.currentSrc) {
						this.audio.load();
					}
					
					break;
				}
			}
		},
		
		/**
		 * Set the audio media's current time to the given time. If the media is
		 * currently playing, it will pause until the seek operation finishes.
		 * 
		 * @param {number} time the time to seek to in seconds
		 */
		seek: function(time) {
			if (this.audio && time >= 0 && time < this.audio.duration) {
				var that = this,
					notify = function() {
						that.audio.removeEventListener('seeked', notify, true);
						that.seeking = false;
						
						if (that.startPlay) {
							that.startPlay = false;
							that.play();
						}
					};
				
				this.audio.addEventListener('seeked', notify, true);
				this.seeking = true;
				this.startPlay = !this.audio.paused;
				this.audio.currentTime = time;
			}
		},
		
		/**
		 * Set if the audio media should loop when it ends.
		 * 
		 * @param {boolean} looping flag to indicate if the media should loop
		 */
		setLoop: function(looping) {
			if (this.looping !== looping) {
				this.looping = looping;
				
				if (this.audio) {
//					this.setLoop_();	*see below*
				}
			}
		},
		
		/*
		 * This is the proper way to set looping for HTML5 audio tags.
		 * Unfortunately Firefox doesn't currently support this feature, so we
		 * have to hack it in the ended event.
		 */
		setLoop_: function() {
			if (this.looping) {
				this.audio.setAttribute('loop', 'loop');
			} else {
				this.audio.removeAttribute('loop');
			}
		},
		
		/**
		 * Set the volume of the audio media. Volume ranges from 0.0 to 1.0.
		 * 
		 * @param {number} volume the volume to set
		 */
		setVolume: function(volume) {
			if (this.audio) {
				this.audio.volume = volume;
			}
		},
		
		/**
		 * Get the Octane structure for the Audio.
	     *
	     * @return {Object} the Octane structure representing the Audio
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'looping',
				val: this.looping
			});
			
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				octane.props.push({
					name: 'addUrl',
					arg: [urlObj.url, urlObj.type]
				});
			}
			
			return octane;
		}
	});

	hemi.audio.Audio.prototype.msgSent =
		hemi.audio.Audio.prototype.msgSent.concat([hemi.msg.load,
			hemi.msg.start, hemi.msg.stop, hemi.msg.unload]);

	return hemi;
})(hemi || {});/* 
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
	/**
	 * @namespace A module for defining camera and viewpoint options.
	 */
	hemi.view = hemi.view || {};

	hemi.view.defaults = {
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
	
	hemi.view.projection = {
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
	hemi.view.Camera = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			var tween = hemi.utils.penner.linearTween,		
				t = {
					cam    : hemi.core.mainPack.createObject('Transform'),
					pan    : hemi.core.mainPack.createObject('Transform'),
					tilt   : hemi.core.mainPack.createObject('Transform'),
					target : hemi.core.mainPack.createObject('Transform')
				};
			t.cam.name = 'hemi.view.cam';
			t.pan.name = 'hemi.view.pan';
			t.tilt.name = 'hemi.view.tilt';
			t.target.name = 'hemi.view.target';		
			t.pan.parent = hemi.core.client.root;
			t.tilt.parent = t.pan;
			t.cam.parent = t.tilt;
			t.target.parent = t.cam;
			t.target.translate([0,0,-1]);
			t.cam.translate([0,0,1]);	
			this.transforms = t;
			this.vd = { current: null, last: null };
			this.paramObj = hemi.core.mainPack.createObject('ParamObject');
			this.light = {
				position : this.paramObj.createParam('lightWorldPos','ParamFloat3'),
				color : this.paramObj.createParam('lightColor','ParamFloat4'),
				fixed : true
			};
			this.light.color.value = [1,1,1,1]; 
	        this.pan = {
				current : 0,
				min     : null,
				max     : null
			};
	        this.tilt = { 
				current : 0,
				min     : hemi.view.defaults.MIN_TILT,
				max     : hemi.view.defaults.MAX_TILT  
			};
	        this.fov = {
				current : hemi.view.defaults.FOV,
				min     : hemi.view.defaults.MIN_FOV,
				max     : hemi.view.defaults.MAX_FOV
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
				projection : hemi.view.projection.PERSPECTIVE
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
				near : hemi.view.defaults.NP,
				far  : hemi.view.defaults.FP
			};
			this.easeFunc = [tween,tween,tween];			
			hemi.view.addRenderListener(this);
			this.update();
			this.updateProjection();
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         * @string
         */
        citizenType: 'hemi.view.Camera',
		
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
			hemi.view.removeRenderListener(this);
			this._super();			
			this.disableControl();
			for (t in this.transforms) {
				this.transforms[t].parent = null;
				hemi.core.mainPack.removeObject(this.transforms[t]);
				this.transforms[t] = null;
			}
			this.paramObj.removeParam(this.light.position);
			this.paramObj.removeParam(this.light.color);
			hemi.core.mainPack.removeObject(this.paramObj);
			this.paramObj = null;
			this.light.position = null;
			this.light.color = null;
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
		enableControl : function() {
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
			this.light.fixed = true;
			this.update();
			return this;
		},
		
		/**
		 * Allow the eye to rotate about a fixed target. This is the default mode.
		 */
		freeEye : function() {
			this.mode.fixed = false;
			if (!this.mode.projection) {
				this.transforms.cam.identity();
				this.transforms.cam.translate([0,0,this.distance]);
			}
			this.update();
			return this;
		},
		
		/**
		 * Set the light source to be at the given position.
		 * 
		 * @param {number[3]} position XYZ position of the light source
		 */
		lightAtPosition : function(position) {
			this.light.position.value = position;
			this.light.fixed = false; 
			this.update();
			return this;
		},
		
		/**
		 * Get the current position of the Camera eye.
		 *
		 * @return {number[3]} XYZ coordinates of the eye
		 */
		getEye : function() {
			return this.transforms.cam.getUpdatedWorldMatrix()[3].slice(0,3);
		},

		/**
		 * Get the current position of the Camera target.
		 *
		 * @return {number[3]} XYZ coordinates of the target
		 */
		getTarget : function() {
			if (this.mode.fixed) {
				return this.transforms.target.getUpdatedWorldMatrix()[3].slice(0,3);
			} else {
				return this.transforms.pan.getUpdatedWorldMatrix()[3].slice(0,3);
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
		 * @param {hemi.view.CameraCurve} curve curve for the Camera eye and
		 *     target to follow
		 * @param {number} opt_time the number of seconds for the Camera to take
		 *     to move along the curve (0 is instant)
		 */
		moveOnCurve : function(curve, opt_time) {
			if (this.vd.current !== null) {
				this.vd.last = this.vd.current;
			} else {
				this.vd.last = hemi.view.createViewData(this);
			}
			
			this.vd.current = new hemi.view.ViewData({
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
			this.send(hemi.msg.start, { viewdata: this.vd.current });
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
				case hemi.view.projection.XY:
				case hemi.view.projection.YZ:
					this.transforms.pan.translate([-xDis,yDis,0]);
					break;
				case hemi.view.projection.XZ:
					this.transforms.pan.translate([xDis,0,yDis]);
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
				var deltaX = hemi.view.defaults.MOUSE_DELTA * this.distance
					* (xMovement);
				var deltaY = hemi.view.defaults.MOUSE_DELTA * this.distance
					* (yMovement);
				this.transforms.pan.translate([
					-deltaX,
					deltaY * Math.cos(this.tilt.current),
					deltaY * Math.sin(this.tilt.current)]);
				this.update();
			} else {
				if (this.mode.fixed) {
					this.rotate(
						-xMovement * hemi.view.defaults.MOUSE_SPEED,
						-yMovement * hemi.view.defaults.MOUSE_SPEED);
				} else {
					this.orbit(
						-xMovement * hemi.view.defaults.MOUSE_SPEED,
						-yMovement * hemi.view.defaults.MOUSE_SPEED);
				}		
			}
		},
		
		/**
		 * Move the Camera to the given Viewpoint.
		 *
		 * @param {hemi.view.Viewpoint} view Viewpoint to move to
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
			
			this.vd.last = hemi.view.createViewData(this);
			this.state.curve = null;
			this.state.time.end = (t > 0) ? t : 0.001;
			this.state.time.current = 0.0;
			this.state.moving = true;
			this.send(hemi.msg.start, pkg);
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
				var dis = this.distance * hemi.view.defaults.TRUCK_SPEED,
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
					this.distance = hemi.core.math.lerpScalar(0, this.distance, t);
					if (!this.mode.projection) {
						this.transforms.cam.identity();
						this.transforms.cam.translate([0,0,this.distance]);
					}
					this.updateProjection();
					this.state.update = true;
				}
			}
		},
		
		/**
		 * Orbit the Camera about the target point it is currently looking at.
		 * 
		 * @param {number} pan amount to pan around by (in radians)
		 * @param {number} tilt amount to tilt up and down by (in radians)
		 */
		orbit : function(pan,tilt) {
			if (tilt == null) tilt = 0;
			var lastTilt = this.tilt.current;			
			this.pan.current += pan;
			this.tilt.current += tilt;			
			if (this.tilt.current >= this.tilt.max) {
				this.tilt.current = this.tilt.max;
			} else if (this.tilt.current <= this.tilt.min) {
				this.tilt.current = this.tilt.min;
			}
			this.transforms.pan.rotateY(pan);
			this.transforms.tilt.rotateX(this.tilt.current - lastTilt);
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
			var cam = this.transforms.cam;
			if (tilt == null) tilt = 0;

			this.camPan.current += pan;
			this.camTilt.current += tilt;
			this.clampPanTilt();	
			cam.identity();
			cam.translate([0,0,this.distance]);
			cam.rotateY(this.camPan.current);
			cam.rotateX(this.camTilt.current);
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
		 * @return {hemi.view.Camera} This Camera, for chaining
		 */
		setEasing : function(easeFunc) {
			if (typeof(easeFunc) == 'function') {
				this.easeFunc = [easeFunc,easeFunc,easeFunc];
			} else {
				this.easeFunc = [
					easeFunc.x || this.easeFunc[0],
					easeFunc.y || this.easeFunc[1],
					easeFunc.z || this.easeFunc[2],
				];
			}
			return this;
		},
		
		/**
		 * Set the eye and target of the Camera. 
		 *
		 * @param {number[3]} eye XYZ position of camera eye
		 * @param {number[3]} target XYZ position of camera target
		 */
		setEyeTarget : function(eye,target) {
			var offset = [eye[0]-target[0],eye[1]-target[1],eye[2]-target[2]],
				rtp = hemi.utils.cartesianToSpherical(offset),
				t = this.transforms;

			this.distance = rtp[0];
			this.tilt.current = rtp[1] - Math.PI/2;
			this.pan.current = rtp[2];
			
			t.pan.identity();
			t.pan.translate(target);
			t.pan.rotateY(this.pan.current);
			
			t.tilt.identity();
			t.tilt.rotateX(this.tilt.current);
			
			var camPos = [0, 0, this.distance];
			t.cam.identity();
			t.cam.translate(camPos);
			
			hemi.utils.pointZAt(t.cam, camPos, hemi.utils.pointAsLocal(t.cam,target));
			t.cam.rotateY(Math.PI);
			this.camPan.current = 0;
			this.camTilt.current = 0;			
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
				curView = hemi.view.createViewData(this);
			
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
			this.transforms.pan.rotateX(this.tilt.current);
			this.transforms.pan.translate(0,0,-distance);
			this.transforms.pan.rotateX(-this.tilt.current);
			this.update();
		},
		
		/**
		 * Set up the Camera to interpolate between the two given time values.
		 * 
		 * @param {number} current current time
		 * @param {number} end end time
		 */
		interpolateView : function(current,end) {
			var eye = [], target = [],
				last = this.vd.last,
				cur = this.vd.current,
				upProj = false;
			
			if (this.state.curve) {
				var t = this.easeFunc[0](current,0,1,end);
				eye = this.state.curve.eye.interpolate(t);
				target = this.state.curve.target.interpolate(t);
			} else {
				for (var i=0; i<3; i++) {
					eye[i] = this.easeFunc[i](current,last.eye[i],cur.eye[i]-last.eye[i],end);
					target[i] = this.easeFunc[i](current,last.target[i],cur.target[i]-last.target[i],end);
				}
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
					var d = this.mode.frames ? 1.0/hemi.view.FPS : delta;
					if (time.current >= time.end) {
						this.state.moving = false;
						this.state.curve = null;
						
						if (this.state.vp !== null) {
							this.send(hemi.msg.stop, { viewpoint:this.state.vp });
							this.state.vp = null;
						} else {
							this.send(hemi.msg.stop, { viewdata:this.vd.current });
						}
					}
					time.current += d;
					if (time.current >= time.end) {
						time.current = time.end;
					}				
				}
			} 
			this.transforms.target.identity();
			this.transforms.target.translate([0,0,-this.distance]);
			hemi.view.viewInfo.drawContext.view = hemi.core.math.matrix4.lookAt(
					this.getEye(),
					this.getTarget(),
					this.up);
			if (this.light.fixed) {
				this.light.position.value = this.getEye();
			}
		},
		
		/**
		 * Update the Camera view projection.
		 */
		updateProjection : function() {
			var aspect = hemi.view.clientSize.width / hemi.view.clientSize.height;
			if (this.mode.projection) {
				var scale = this.distance;
				hemi.view.viewInfo.drawContext.projection = hemi.core.math.matrix4.orthographic(
					-scale,scale,-scale/aspect,scale/aspect,0,this.clip.far);			
			} else {
				hemi.view.viewInfo.drawContext.projection = hemi.core.math.matrix4.perspective(
					this.fov.current,aspect,this.clip.near,this.clip.far);
			}
		}
	});
	
	hemi.view.Camera.prototype.msgSent =
		hemi.view.Camera.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	
	/**
	 * @class A CameraCurve contains an "eye" Curve and a "target" Curve that
	 * allow a Camera to follow a smooth path through several waypoints.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.curve.Curve} eye Curve for camera eye to follow
	 * @param {hemi.curve.Curve} target Curve for camera target to follow
	 */
	hemi.view.CameraCurve = hemi.world.Citizen.extend({
		init: function(eye, target) {
			this._super();
			
			this.eye = eye;
			this.target = target;
		},
		
		/**
         * Overwrites hemi.world.Citizen.citizenType
         * @string
         */
		citizenType: 'hemi.view.CameraCurve',
		
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
	});
	
	hemi.view.ViewData = function(config) {
		var cfg = config || {};
		this.eye = cfg.eye || [0,0,-1];
		this.target = cfg.target || [0,0,0];
		this.up = cfg.up || [0,1,0];
		this.fov = cfg.fov || hemi.view.defaults.FOV;
		this.np = cfg.np || hemi.view.defaults.NP;
		this.fp = cfg.fp ||hemi.view.defaults.FP;
	};
	
	/**
	 * @class A Viewpoint describes everything needed for a view - eye, target,
	 * up axis, field of view, near plane, and far plane.
	 * @extends hemi.world.Citizen
	 */
	hemi.view.Viewpoint = hemi.world.Citizen.extend({
		init: function(config) {
			this._super();
			
			var cfg = config || {};
			this.name = cfg.name || '';
			this.eye = cfg.eye || [0,0,-1];
			this.target = cfg.target || [0,0,0];
			this.up = cfg.up || [0,1,0];
			this.fov = cfg.fov || hemi.view.defaults.FOV;
			this.np = cfg.np || hemi.view.defaults.NP;
			this.fp = cfg.fp ||hemi.view.defaults.FP;
		},
		
		/**
         * Overwrites hemi.world.Citizen.citizenType
         * @string
         */
		citizenType: 'hemi.view.Viewpoint',
		
		/**
		 * Get the data contained within the Viewpoint.
		 * 
		 * @return {hemi.view.ViewData} the ViewData for the Viewpoint
		 */
		getData: function() {
			return new hemi.view.ViewData(this);
		},
		
		/**
		 * Set the data for the Viewpoint.
		 * 
		 * @param {hemi.view.ViewData} viewData data to set for the Viewpoint
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
	});
	
	/**
	 * @class A ClientSize contains the height and width of the O3D client and
	 * updates camera projections when either value changes.
	 */
	hemi.view.ClientSize = function() {
		this.width = 0;
		this.height = 0;
	};
	
	/**
	 * Check if the client's width or height has changed. If so, update the
	 * projection of cameras. This function allows ClientSize to be a render
	 * listener.
	 */
	hemi.view.ClientSize.prototype.onRender = function() {
		// Update from the client size
		var newWidth = parseInt(hemi.core.client.width);
		var newHeight = parseInt(hemi.core.client.height);
		if ((newWidth != this.width || newHeight != this.height) &&
			hemi.world.camera != null) {
			this.width = newWidth;
			this.height = newHeight;

			hemi.world.camera.updateProjection();
		}
	};

	/**
	 * Initialize the hemi view.
	 */
	hemi.view.init = function() {
		/**
		 * The animation framerate in frames-per-second.
		 * @type number
		 * @default 24
		 */
		this.FPS = 24;
		this.defaultBG = [1, 1, 1, 1];
		this.clientSize = new hemi.view.ClientSize();
		this.renderListeners = [];
		this.viewInfo = hemi.core.renderGraph.createBasicView(hemi.core.mainPack,
				hemi.core.client.root, hemi.core.client.renderGraphRoot);
		this.setBGColor(this.defaultBG);

		hemi.view.addRenderListener(this.clientSize);
		hemi.core.client.setRenderCallback(hemi.view.onRender);
	};

	/**
	 * Add the given render listener to the view. A listener must implement the
	 * onRender function.
	 * 
	 * @param {Object}
	 *            listener the render listener to add
	 */
	hemi.view.addRenderListener = function(listener) {
		var ndx = hemi.view.renderListeners.indexOf(listener);
		if (ndx === -1) {
			hemi.view.renderListeners.push(listener);
		}
	};

	/**
	 * Remove the given render listener from the view.
	 * 
	 * @param {Object}
	 *            listener the render listener to remove
	 * @return {Object} the removed listener if successful or null
	 */
	hemi.view.removeRenderListener = function(listener) {
		var ndx = hemi.view.renderListeners.indexOf(listener);
		var retVal = null;
		if (ndx !== -1) {
			retVal = hemi.view.renderListeners.splice(ndx, 1);
		}

		return retVal;
	};

	/**
	 * Notify all of the render listeners with the given render event.
	 * 
	 * @param {o3d.RenderEvent}
	 *            renderEvent render event to pass to listeners
	 */
	hemi.view.onRender = function(renderEvent) {
		for (var ndx = 0; ndx < hemi.view.renderListeners.length; ndx++) {
			hemi.view.renderListeners[ndx].onRender(renderEvent);
		}
	};

	/**
	 * Set the clear color of the client.
	 *
	 * @param {number[4]} rgba Red-Green-Blue-Alpha array
	 */
	hemi.view.setBGColor = function(rgba) {
		this.viewInfo.clearBuffer.clearColor = rgba;
	};
	
	/**
	 * Get the clear color of the client.
	 * 
	 * @return {number[4]} the background color
	 */
	hemi.view.getBGColor = function() {
		return this.viewInfo.clearBuffer.clearColor;
	};

	/**
	 * Get the time that the specified animation frame occurs at.
	 * 
	 * @param {number} frame frame number to get the time for
	 * @return {number} time that the frame occurs at
	 */
	hemi.view.getTimeOfFrame = function(frame) {
		return frame / this.FPS;
	};

	/**
	 * Create a new ViewData with the given Camera's current viewing parameters.
	 * 
	 * @param {hemi.view.Camera} camera the Camera to create the Viewpoint from
	 * @return {hemi.view.ViewData} the newly created ViewData
	 */
	hemi.view.createViewData = function(camera) {
		return new hemi.view.ViewData({
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
	 * @param {hemi.view.Camera} camera the Camera to create the Viewpoint from
	 * @return {hemi.view.Viewpoint} the newly created Viewpoint
	 */
	hemi.view.createViewpoint = function(name, camera) {
		var viewpoint = new hemi.view.Viewpoint({name: name});
		viewpoint.setData(this.createViewData(camera));
		return viewpoint;
	};

	/**
	 * Create a new Viewpoint with the given name and the given viewing
	 * parameters.
	 * 
	 * @param {string} name the name of the new Viewpoint
	 * @param {number[3]} eye the coordinates of the eye
	 * @param {number[3]} target the coordinates of the target
	 * @param {number[3]} up the coordinates of the up direction
	 * @param {number} fov angle of the field-of-view
	 * @return {hemi.view.Viewpoint} the newly created Viewpoint
	 */
	hemi.view.createCustomViewpoint = function(name, eye, target, up, fov,
			np, fp) {
		var viewPoint = new hemi.view.Viewpoint({
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
	/**
	 * @namespace A module for managing 3D models and their assets.
	 */
	hemi.model = hemi.model || {};

	/**
	 * The name of the root Transform for all loaded Models. All Transforms in
	 * a Model are a child or grandchild of the modelRoot.
	 * @type string
	 * @constant
	 */
	hemi.model.MODEL_ROOT = 'ModelRoot';

	/**
	 * @class A TransformUpdate allows changes to a Transform in a Model to be
	 * persisted through Octane.
	 */
	hemi.model.TransformUpdate = function() {
		/**
		 * The updated position, rotation, and scale of the Transform.
		 * @type number[4][4]
		 */
		this.localMatrix = null;
		/**
		 * A flag indicating if the Transform is visible.
		 * @type boolean
		 */
		this.visible = null;
		/**
		 * A flag indicating if the Transform is able to be picked.
		 * @type boolean
		 */
		this.pickable = null;
		/**
		 * The opacity of the Transform. 
		 * @type number
		 */
		this.opacity = null;
		
		this.transform = null;
		this.toLoad = null;
	};

	hemi.model.TransformUpdate.prototype = {
		/**
		 * Get the Octane structure for the TransformUpdate.
		 *
		 * @return {Object} the Octane structure representing the TransformUpdate
		 */
		toOctane: function() {
			var octane = {
					type: 'hemi.model.TransformUpdate',
					props: [{
						name: 'toLoad',
						val: this.transform.name
					}]
				},
				valNames = ['localMatrix', 'visible', 'pickable', 'opacity'];
			
			for (var i = 0, il = valNames.length; i < il; i++) {
				var name = valNames[i];
				octane.props.push({
					name: name,
					val: this[name]
				});
			};

			return octane;
		},

		/**
		 * Check if the TransformUpdate has been modified.
		 * 
		 * @return {boolean} true if the Transform has been changed
		 */
		isModified: function() {
			return this.localMatrix != null || this.pickable != null 
				|| this.visible != null || this.opacity != null;
		},

		/**
		 * Apply the changes in the TransformUpdate to its target Transform.
		 * 
		 * @param {hemi.model.Model} model the Model to get the Transform from
		 */
		apply: function(model) {
			if (this.toLoad !== null) {
				var transforms = model.getTransforms(this.toLoad);
				
				if (transforms.length === 1) {
					this.transform = transforms[0];
					this.toLoad = null;
				} else {
					hemi.console.log(transforms.length + ' transforms with name ' +
						this.toLoad + ' in model ' + model.name, hemi.console.ERR);
					return;
				}
			}
			
			if (this.localMatrix != null) {
				this.transform.localMatrix = this.localMatrix;
			}
			
			if (this.pickable != null) {
				hemi.picking.setPickable(this.transform, this.pickable, true);
			}
			
			if (this.visible != null) {
				this.transform.visible = this.visible;
			}
			
			if (this.opacity != null) {
				model.setTransformOpacity(this.transform, this.opacity, false);
			}
		}
	};

	/**
	 * @class A ModelConfig contains the pack, transform, and animation time
	 * attributes for a Model. The pack is filled with shapes, transforms, and
	 * materials loaded from a model file.
	 */
	hemi.model.ModelConfig = function() {
		this.pack = hemi.core.client.createPack();
		// Create a root transform for the model's shapes and transforms
		this.rootTransform = this.pack.createObject('Transform');
		this.rootTransform.parent = hemi.model.modelRoot;
		// Create a param to access animations. No need to worry about storing
		// it for cleanup, it will get destroyed with pack.
		var paramObject = this.pack.createObject('ParamObject');
		this.animationTime = paramObject.createParam('animTime', 'ParamFloat');
	};

	hemi.model.ModelConfig.prototype = {
		/**
		 * Get all materials loaded in the pack from the model file.
		 * 
		 * @return {o3d.Material[]} array of materials
		 */
		getMaterials: function() {
			return this.pack.getObjectsByClassName('o3d.Material');
		},

		/**
		 * Get all shapes loaded in the pack from the model file.
		 * 
		 * @return {o3d.Shape[]} array of shapes
		 */
		getShapes: function() {
			return this.pack.getObjectsByClassName('o3d.Shape');
		},

		/**
		 * Get all transforms loaded in the pack from the model file.
		 * 
		 * @return {o3d.Transform[]} array of tranforms
		 */
		getTransforms: function() {
			return this.pack.getObjectsByClassName('o3d.Transform');
		},
		
		/**
		 * Check if the pack contains any skinned meshes.
		 * 
		 * @return {boolean} true if the pack contains any skinned meshes
		 */
		isSkinned: function() {
			return this.pack.getObjectsByClassName('o3d.Skin').length > 0;
		}
	};

	/**
	 * @class A Model contains geometric shapes, hierarchical transforms that
	 * manipulate those shapes, and materials that affect how the shapes are
	 * displayed.
	 * @extends hemi.world.Citizen
	 */
	hemi.model.Model = hemi.world.Citizen.extend({
		init: function() {
			this._super();

			/**
			 * A flag that indicates if the Model is currently animating.
			 * @type boolean
			 * @default false
			 */
			this.isAnimating = false;
			this.isSkinned = false;
			this.fileName = '';
			this.root = null;
			this.materials = [];
			this.shapes = [];
			this.transforms = [];
			this.transformUpdates = [];
			this.animParam = null;
			this.pack = null;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
		citizenType: 'hemi.model.Model',
		
		/**
		 * Send a cleanup Message and remove all references in the Model.
		 */
		cleanup: function() {
			this._super();
			this.unload();
		},

		/**
		 * Get the Octane structure for the Model.
		 *
		 * @return {Object} the Octane structure representing the Model
		 */
		toOctane: function() {
			var octane = this._super();

			octane.props.push({
				name: 'setFileName',
				arg: [this.fileName]
			});

			var upEntry = {
				name: 'transformUpdates',
				oct: []
			};

			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				
				if (update.isModified()) {
					// Only save the TransformUpdate if there is actually a
					// change to save.
					upEntry.oct.push(update.toOctane());
				}
			}

			octane.props.push(upEntry);

			return octane;
		},

		/**
		 * Set the file name and model name for the Model and then begin loading
		 * the file.
		 * 
		 * @param {string} fileName name of the file
		 */
		setFileName: function(fileName) {
			this.fileName = fileName;
			this.name = getModelName(fileName);
			this.load();
		},
		
		/**
		 * Load the Model (or reload) from its file url.
		 */
		load: function() {
			var config = new hemi.model.ModelConfig(),
				that = this;
			
			if (this.pack !== null) {
				this.unload();
			}
			
			try {
				hemi.loader.loadModel(
					this.fileName,
					config.pack,
					config.rootTransform,
					function(pack, parent) {
						hemi.core.loaderCallback(pack);
						that.loadConfig(config);
					},
					{opt_animSource: config.animationTime});
			} 
			catch (e) {
				alert('Loading failed: ' + e);
			}
		},

		/**
		 * Load the given configuration into the Model, populating it with
		 * transforms, shapes, and materials.
		 * 
		 * @param {hemi.model.ModelConfig} config configuration for the Model
		 */
		loadConfig: function(config) {
			var id = this.getId();
			
			this.name = getModelName(this.fileName);
			this.isSkinned = config.isSkinned();
			this.root = config.rootTransform;
			this.root.name = this.name + '_Root';
			// The deserialization process sets bad values for bounding boxes of
			// transforms, so we force them to be recalculated.
			if (this.isSkinned) {
				// For some reason, skinned meshes need to be rendered once and
				// then have both shapes and transforms recalculated.
				hemi.view.viewInfo.renderGraphRoot.render();
				this.root.recalculateBoundingBox(true, true);
			} else {
				this.root.recalculateBoundingBox(true);
			}
			
			this.animParam = config.animationTime;
			this.materials = config.getMaterials();
			this.shapes = config.getShapes();
			this.transforms = config.getTransforms();
			this.pack = config.pack;
			
			for (var i = 0, il = this.materials.length; i < il; ++i) {
				var mat = this.materials[i],
					oid = mat.createParam('ownerId', 'o3d.ParamInteger');
				oid.value = id;
			}
			
			for (var t = 0, len = this.transforms.length; t < len; ++t) {
				var transform = this.transforms[t],
					oid = transform.createParam('ownerId', 'o3d.ParamInteger');
				oid.value = id;
			}
			
			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				update.apply(this);
			}

			hemi.world.tranReg.distribute(this);
			
			this.send(hemi.msg.load, {});
		},

		/**
		 * Get the Model's animation parameter. It's value property can be
		 * set to update the Model to a specific keyframe.
		 *
		 * @return {o3d.ParamObject} the Model's animation parameter
		 */
		getAnimationParameter: function() {
			return this.animParam;
		},

		/**
		 * Get the Model's current animation time.
		 *
		 * @return {number} the Model's current animation time
		 */
		getAnimationTime: function() {
			var time = 0.0;
			
			if (this.animParam) {
				time = this.animParam.value;
			}
			
			return time;
		},
		
		/**
		 * Get the Model's max animation time value (in seconds).
		 * 
		 * @return {number} the Model's max animation time
		 */
		getMaxAnimationTime: function() {	
			var curves = this.pack.getObjectsByClassName('o3d.Curve'),
				max = 0;
			
			for (var ndx = 0; ndx < curves.length; ndx++) {
				var keys = curves[ndx].keys;
				
				for (var ndx2 = 0; ndx2 < keys.length; ndx2++) {
					var input = keys[ndx2].input;
					max = input > max ? input : max;
				}
			}
			
			return max;
		},

		/**
		 * Increment the Model's animation time by the given amount.
		 *
		 * @param {number} animateInc amount to increment animation time by
		 */
		incrementAnimationTime: function(animateInc) {
			if (this.animParam) {
				this.setAnimationTime(this.animParam.value + animateInc);
			}
		},

		/**
		 * Set the Model's animation time to the given amount.
		 *
		 * @param {number} animateTime amount to set the animation time to
		 */
		setAnimationTime: function(animateTime) {
			if (this.animParam) {
				var previous = this.animParam.value;
				this.animParam.value = animateTime;

				this.send(hemi.msg.animate,
					{
						previous: previous,
						time: animateTime
					});
			}
		},

		/**
		 * Get any Materials in the Model with the given name.
		 *
		 * @param {string} materialName the name of the desired Material
		 * @return {o3d.Material[]} array of Materials with the given name
		 */
		getMaterials: function(materialName) {
			var mats = [];
			
			for (var m = 0, len = this.materials.length; m < len; m++) {
				var material = this.materials[m];
				if (material.name === materialName) 
					mats.push(material);
			}
			
			return mats;
		},

		/**
		 * Get any Shapes in the Model with the given name.
		 *
		 * @param {string} shapeName the name of the desired Shape
		 * @return {o3d.Shape[]} array of Shapes with the given name
		 */
		getShapes: function(shapeName) {
			var shps = [];
			
			for (var s = 0, len = this.shapes.length; s < len; s++) {
				var shape = this.shapes[s];
				if (shape.name === shapeName) 
					shps.push(shape);
			}
			
			return shps;
		},

		/**
		 * Get any Transforms in the Model with the given name.
		 *
		 * @param {string} transformName the name of the desired Transform
		 * @return {o3d.Transform[]} array of Transforms with the given name
		 */
		getTransforms: function(transformName) {
			var tfms = [];
			
			for (var t = 0, len = this.transforms.length; t < len; t++) {
				var transform = this.transforms[t];
				if (transform.name === transformName) 
					tfms.push(transform);
			}
			
			return tfms;
		},

		/**
		 * Get the TransformUpdate for the given Transform, or create a new one
		 * if it does not already exist.
		 *
		 * @param {o3d.Transform} transform the Transform
		 * @return {hemi.model.TransformUpdate} the TransformUpdate for the
		 *		   Transform
		 */
		getTransformUpdate: function(transform) {
			var transUp = null;
			
			for (var t = 0, len = this.transformUpdates.length; t < len; t++) {
				var update = this.transformUpdates[t];
				
				if (update.transform === transform) {
					transUp = update;
					break;
				}
			}

			if (transUp === null) {
				transUp = new hemi.model.TransformUpdate();
				transUp.transform = transform;
				this.transformUpdates.push(transUp);
			}
			
			return transUp;
		},
		
		/**
		 * Calculate the center point of the Model's bounding box.
		 * 
		 * @return {number[3]} XYZ point in 3D space
		 */
		getCenterPoint: function() {
			var boundingBox = this.root.boundingBox;
			
			var xSpan = boundingBox.maxExtent[0] - boundingBox.minExtent[0];
			var ySpan = boundingBox.maxExtent[1] - boundingBox.minExtent[1];
			var zSpan = boundingBox.maxExtent[2] - boundingBox.minExtent[2]; 
 
			var center = [xSpan / 2, ySpan / 2, zSpan / 2];
			
			return center;
		},
		
		/**
		 * Get the bounding box of the Model's root Transform.
		 * 
		 * @return {o3d.BoundingBox} bounding box for the entire Model
		 */
		getBoundingBox : function(){
			return this.root.boundingBox;
		},
		
		/**
		 * Set the pickable flag for the Transforms in the Model.
		 *
		 * @param {Object} config configuration options
		 */
		setPickable: function(config) {
			var pick = config.pick,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				this.setTransformPickable(transforms[i], pick);
			}
		},
		
		/**
		 * Sets the opacity of the Transform to the given value. 
		 * 
		 * @param {o3d.Transform} transform the Transform to update
		 * @param {number} opacity the new opacity value
		 * @param {boolean} opt_trickle optional flag indicating if opacity
		 *     should also be set for the Transform's children (default is true)
		 */
		setTransformOpacity: function(transform, opacity, opt_trickle) {
			var update = this.getTransformUpdate(transform),
				shapes = transform.shapes,
				o = transform.getParam('opacity'),
				trickle = opt_trickle == null ? true : opt_trickle;
			
			if (o == null) {
				for (var i = 0, il = shapes.length; i < il; i++) {
					var s = shapes[i],
						elements = s.elements;
					
					for (var j = 0, jl = elements.length; j < jl; j++) {
						hemi.fx.addOpacity(elements[j].material);
					}
				}
				
				o = transform.createParam('opacity','ParamFloat');
			}
			
			o.value = opacity;
			update.opacity = opacity === 1 ? null : opacity;
			
			if (trickle) {
				var children = transform.children;
				
				for (var i = 0, il = children.length; i < il; i++) {
					this.setTransformOpacity(children[i], opacity, true);
				}
			}
		},

		/**
		 * Set the pickable flag for the given Transform.
		 *
		 * @param {o3d.Transform} transform the Transform
		 * @param {boolean} pickable value to set for pickable
		 */
		setTransformPickable: function(transform, pickable) {
			var update = this.getTransformUpdate(transform);
			hemi.picking.setPickable(transform, pickable, true);
			update.pickable = pickable ? null : false;
		},
		
		/**
		 * Set the visible flag for the given Transform.
		 *
		 * @param {o3d.Transform} transform the Transform
		 * @param {boolean} visible value to set for visible
		 */
		setTransformVisible: function(transform, visible) {
			var update = this.getTransformUpdate(transform);
			transform.visible = visible;
			update.visible = visible ? null : false;
		},
		
		/**
		 * Set the visible flag for the Transforms in the Model.
		 *
		 * @param {Object} config configuration options
		 */
		setVisible: function(config) {
			var vis = config.vis,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				this.setTransformVisible(transforms[i], vis);
			}
		},
		
		/**
		 * Rotate the Transforms in the Model.
		 * 
		 * @param {Object} config configuration options
		 */
		rotate: function(config) {
			var axis = config.axis.toLowerCase(),
				rad = config.rad,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				switch(axis) {
					case 'x':
						this.rotateTransformX(transforms[i], rad);
						break;
					case 'y':
						this.rotateTransformY(transforms[i], rad);
						break;
					case 'z':
						this.rotateTransformZ(transforms[i], rad);
						break;
				}
			}
		},

		/**
		 * Rotate the given Transform along the x-axis by the amount provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformX: function(transform, amount) {
			var update = this.getTransformUpdate(transform);
			transform.rotateX(amount);
			update.localMatrix = hemi.utils.clone(transform.localMatrix);
		},

		/**
		 * Rotate the given Transform along the y-axis by the amount provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformY: function(transform, amount) {
			var update = this.getTransformUpdate(transform);
			transform.rotateY(amount);
			update.localMatrix = hemi.utils.clone(transform.localMatrix);
		},

		/**
		 * Rotate the given Transform along the z-axis by the amount provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} amount the amount to rotate (in radians)
		 */
		rotateTransformZ: function(transform, amount) {
			var update = this.getTransformUpdate(transform);
			transform.rotateZ(amount);
			update.localMatrix = hemi.utils.clone(transform.localMatrix);
		},
		
		/**
		 * Scale the Transforms in the Model.
		 * 
		 * @param {Object} config configuration options
		 */
		scale: function(config) {
			var x = config.x,
				y = config.y,
				z = config.z,
				transforms;
			
			if (config.transforms instanceof Array) {
				transforms = config.transforms;
			} else {
				transforms = [config.transforms];
			}
			
			for (var i = 0, il = transforms.length; i < il; i++) {
				this.scaleTransform(transforms[i], x, y, z);
			}
		},

		/**
		 * Scale the given Transform by the factors provided.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number} xFactor the amount to scale along x
		 * @param {number} yFactor the amount to scale along y
		 * @param {number} zFactor the amount to scale along z
		 * @throws {Exception} If any of the scale factors are negative.
		 */
		scaleTransform: function(transform, xFactor, yFactor, zFactor) {
			if (xFactor < 0 || yFactor < 0 || zFactor < 0) {
				throw('Cannot scale with a negative number');
			} else {
				var update = this.getTransformUpdate(transform);
				transform.scale(xFactor, yFactor, zFactor);
				update.localMatrix = hemi.utils.clone(transform.localMatrix);
			}			
		},

		/**
		 * Set the given Transform's matrix to the new matrix.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 * @param {number[4][4]} matrix the new local matrix
		 */
		setTransformMatrix: function(transform, matrix) {
			var update = this.getTransformUpdate(transform);			
			transform.localMatrix = matrix;
			update.localMatrix = hemi.utils.clone(transform.localMatrix);
		},
		
		/**
		 * Clean up any materials, shapes, and transforms contained in the
		 * Model.
		 */
		unload: function() {
			this.materials = [];
			this.shapes = [];
			this.transforms = [];
			this.transformUpdates = [];
			
			if (this.pack !== null) {
				// Remove this Model's transform tree from the client root
				// transform before destroying the resources.
				this.root.parent = null;
				this.pack.destroy();
				this.pack = null;
				this.root = null;
				this.animParam = null;
			}
			
			this.send(hemi.msg.unload, {});
		}
	});

	hemi.model.Model.prototype.msgSent =
		hemi.model.Model.prototype.msgSent.concat([hemi.msg.animate,
			hemi.msg.load, hemi.msg.unload]);

	/**
	 * Set up the modelRoot, the transform root that all Model transforms will
	 * be children of.
	 */
	hemi.model.init = function() {
		// A transform parent to hold model transform roots
		this.modelRoot = hemi.core.mainPack.createObject('Transform');
		this.modelRoot.name = hemi.model.MODEL_ROOT;
		this.modelRoot.parent = hemi.picking.pickRoot;
	};

	// Internal functions
	var getModelName = function(fileName) {
		// Currently, file names are of the form:
		// [path to directory]/[model name]/scene.json
		var end = fileName.lastIndexOf('/');
		
		if (end < 1) {
			end = fileName.length;
		}
		
		var start = fileName.lastIndexOf('/', end - 1) + 1;
		
		if (start >= end) {
			start = 0;
		}
		
		return fileName.substring(start, end);
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
	 * @namespace A module for animating Models.
	 */
	hemi.animation = hemi.animation || {};

	/**
	 * @class A Loop contains a start time and stop time as well as the number of
	 * iterations to perform for the Loop.
	 * @memberOf hemi.animation
	 */
	hemi.animation.Loop = function() {
		/**
		 * The name of the Loop.
		 * @type string
		 * @default ''
		 */
		this.name = '';
		
		/**
		 * The time in an Animation that the Loop begins at.
		 * @type number
		 * @default 0
		 */
		this.startTime = 0;
		
		/**
		 * The time in an Animation that the Loop ends at.
		 * @type number
		 * @default 0
		 */
		this.stopTime = 0;
		
		/**
		 * The number of times the Loop repeats.
		 * @type number
		 * @default -1 (infinite)
		 */
		this.iterations = -1;
		
		this.current = 0;
	};
	
	hemi.animation.Loop.prototype = {
		/**
		 * Get the Octane structure for the Loop.
	     *
	     * @return {Object} the Octane structure representing the Loop
		 */
		toOctane: function(){
			var octane = {
				type: 'hemi.animation.Loop',
				props: [{
					name: 'startTime',
					val: this.startTime
				},{
					name: 'stopTime',
					val: this.stopTime
				},{
					name: 'iterations',
					val: this.iterations
				}, {
					name: 'name',
					val: this.name
				}]
			};
			
			return octane;
		}
	};
	
	/**
	 * @class An Animation contains a target to animate, a begin time, an end
	 * time, and Loops for repeating sections of the Animation.
	 * @extends hemi.world.Citizen
	 */
	hemi.animation.Animation = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The target of the Animation. It should have an 'isAnimating'
			 * property.
			 * @type Object
			 */
			this.target = null;
			
			/**
			 * The time the Animation begins at.
			 * @type number
			 * @default 0
			 */
			this.beginTime = 0;
			
			/**
			 * The time the Animation ends at.
			 * @type number
			 * @default 0
			 */
			this.endTime = 0;
			
			this.currentTime = 0;
			this.loops = [];
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
		 * @type string
         */
        citizenType: 'hemi.animation.Animation',
		
		/**
		 * Send a cleanup Message and remove all references in the Animation.
		 */
		cleanup: function() {
			if (this.target.isAnimating) {
				this.stop();
			}
			
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.target = null;
			this.loops = [];
		},
		
		/**
		 * Get the Octane structure for the Animation.
	     *
	     * @return {Object} the Octane structure representing the Animation
		 */
		toOctane: function(){
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'target',
				id: this.target.getId()
			});
			
			octane.props.push({
				name: 'beginTime',
				val: this.beginTime
			});
			
			octane.props.push({
				name: 'endTime',
				val: this.endTime
			});
			
			octane.props.push({
				name: 'currentTime',
				val: this.beginTime
			});
			
			var loopsEntry = {
				name: 'loops',
				oct: []
			};
			
			for (var ndx = 0, len = this.loops.length; ndx < len; ndx++) {
				loopsEntry.oct.push(this.loops[ndx].toOctane());
			}
			
			octane.props.push(loopsEntry);
			
			return octane;
		},
		
		/**
		 * Add the given Loop to the Animation.
		 *
		 * @param {hemi.animation.Loop} loop the Loop to add
		 */
		addLoop: function(loop){
			this.loops.push(loop);
		},

		/**
		 * Remove the given Loop from the Animation.
		 * 
		 * @param {hemi.animation.Loop} loop the Loop to remove
		 * @return {hemi.animation.Loop} the removed Loop or null
		 */
		removeLoop: function(loop) {			
			var found = null;
			var ndx = this.loops.indexOf(loop);
			
			if (ndx != -1) {
				var spliced = this.loops.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},

		/**
		 * Check if the current time of the Animation needs to be reset by any
		 * of its Loops. If a Loop resets the current time, increment that
		 * Loop's iteration counter.
		 */
		checkLoops: function() {
			for (var ndx = 0; ndx < this.loops.length; ndx++) {
				var loop = this.loops[ndx];
				
				if (loop.current != loop.iterations) {
					if (this.currentTime >= loop.stopTime) {
						this.currentTime = loop.startTime;
						loop.current++;
					}
				}
			}
		},

		/**
		 * Reset the Animation and its Loops to their initial states.
		 */
		reset: function() {
			this.currentTime = this.beginTime;
			
			for (var ndx = 0; ndx < this.loops.length; ndx++) {
				this.loops[ndx].current = 0;
			}
		},

		/**
		 * If the Animation's target is not currently animating, start the
		 * Animation.
		 */
		start: function(){
			if (!this.target.isAnimating) {
				this.target.isAnimating = true;
				this.updateTarget(this.currentTime);
				hemi.view.addRenderListener(this);
				
				this.send(hemi.msg.start, {});
			}
		},

		/**
		 * If the Animation is currently running, stop it.
		 */
		stop: function(){
			var listener = hemi.view.removeRenderListener(this);
			this.target.isAnimating = false;
			
			this.send(hemi.msg.stop, {});
		},

		/**
		 * Update the Animation's current time with the amount of elapsed time
		 * in the RenderEvent. If the Animation has not yet ended, update the
		 * Animation's target with the current animation time. Otherwise end
		 * the Animation.
		 *
		 * @param {o3d.RenderEvent} renderEvent the event containing
		 *		  information about the render
		 */
		onRender: function(renderEvent){
			this.currentTime += renderEvent.elapsedTime;
			this.checkLoops();
			if (this.currentTime < this.endTime) {
				this.updateTarget(this.currentTime);
			} else {
				this.updateTarget(this.endTime);
				this.stop();
				this.reset();
			}
		},
		
		/**
		 * Update the target with the given animation time.
		 * 
		 * @param {number} currentTime current animation time
		 */
		updateTarget: function(currentTime) {
			this.target.setAnimationTime(currentTime);
		}
	});
	
	hemi.animation.Animation.prototype.msgSent =
		hemi.animation.Animation.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	/**
	 * Create an Animation for the given Model.
	 *
	 * @param {hemi.model.Model} model Model to animate
	 * @param {number} beginTime time within the Model to start animating
	 * @param {number} endTime time within the Model to stop animating
	 * @return {hemi.animation.Animation} the newly created animation
	 */
	hemi.animation.createModelAnimation = function(model, beginTime, endTime) {
		var anim = new hemi.animation.Animation();
		anim.target = model;
		anim.beginTime = beginTime;
		anim.currentTime = beginTime;
		anim.endTime = endTime;

		return anim;
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
 * @fileoverview Motion describes classes for automatically translating
 * 		and rotating objects in the scene.
 */

var hemi = (function(hemi) {
	/**
	 * @namespace A module for moving and rotating objects in the scene.
	 */
	hemi.motion = hemi.motion || {};
	
	/**
	 * @class A Rotator makes automated rotation easier by allowing simple
	 * calls such as setVel to begin the automated spinning of a Transform.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {o3d.Transform} opt_tran optional transform that will be spinning
	 * @param {Object} opt_config optional configuration for the Rotator
	 */
	hemi.motion.Rotator = hemi.world.Citizen.extend({
		init: function(opt_tran, opt_config) {
			this._super();
			
			var cfg = opt_config || {};
			
			this.accel = cfg.accel || [0,0,0];
			this.angle = cfg.angle || [0,0,0];
			this.origin = cfg.origin || [0,0,0];
			this.vel = cfg.vel || [0,0,0];
	
			this.offset = hemi.core.math.mulScalarVector(-1,this.origin);
			this.time = 0;
			this.stopTime = 0;
			this.steadyRotate = false;
			this.mustComplete = false;
			this.startAngle = this.angle;
			this.stopAngle = this.angle;
			this.toLoad = {};
			this.transformObjs = [];
		
			if (opt_tran != null) {
				this.addTransform(opt_tran);
			}
	
			this.enable();
		},
		
		/**
		 * Add a Transform to the list of Transforms that will be spinning. A
		 * child Transform is created to allow the Rotator to spin about an
		 * arbitray axis.
		 *
		 * @param {o3d.Transform} transform the Transform to add
		 */
		addTransform : function(transform) {
			hemi.world.tranReg.register(transform, this);
			var param = transform.getParam('ownerId'),
				obj = {},
				oid = null,
				owner = null;
			
			if (param !== null) {
				oid = param.value;
				owner = hemi.world.getCitizenById(oid);
			}
			
			if (hemi.utils.isAnimated(transform)) {
				var tran1 = hemi.core.mainPack.createObject('Transform'),
					tran2 = hemi.utils.fosterTransform(transform);
				
				tran1.name = transform.name + ' Rotator';
				tran2.name = transform.name + ' Offset';
				param = tran1.createParam('ownerId', 'o3d.ParamInteger');
				param.value = oid;
				param = tran2.createParam('ownerId', 'o3d.ParamInteger');
				param.value = oid;
				
				tran1.parent = transform;
				tran2.parent = tran1;
				
				obj.rotTran = tran1;
				obj.offTran = tran2;
				obj.parent = transform;
				obj.foster = true;
			} else {
				var tran1 = hemi.core.mainPack.createObject('Transform'),
					tran2 = hemi.core.mainPack.createObject('Transform');
				
				tran1.name = transform.name + ' Rotator';
				tran2.name = transform.name + ' Offset';
				param = tran1.createParam('ownerId', 'o3d.ParamInteger');
				param.value = oid;
				param = tran2.createParam('ownerId', 'o3d.ParamInteger');
				param.value = oid;
				
				tran1.parent = transform.parent;
				tran2.parent = tran1;
				transform.parent = tran2;
				tran1.localMatrix = hemi.utils.clone(transform.localMatrix);
				transform.identity();
				
				obj.rotTran = tran2;
				obj.offTran = transform;
				obj.parent = tran1;
				obj.foster = false;
			}
			
			if (owner) {
				var that = this;
				obj.owner = owner;
				obj.msg = owner.subscribe(hemi.msg.cleanup, function(msg) {
					that.removeTransforms(msg.src);
				});
			}
			
			this.transformObjs.push(obj);
			applyRotator.call(this, [ obj ]);
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         * @string
         */
        citizenType: 'hemi.motion.Rotator',
		
		/**
		 * Send a cleanup Message and remove all references in the Rotator.
		 */
		cleanup: function() {
			this.disable();
			this._super();
			this.clearTransforms();
		},
		
		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.accel = [0,0,0];
			this.angle = [0,0,0];
			this.offset = [0,0,0];
			this.origin = [0,0,0];
			this.vel = [0,0,0];
		},
		
		/**
		 * Clear the list of spinning Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				removeRotateTransforms.call(this, this.transformObjs[0]);
			}
		},
		
		/**
		 * Disable mouse interaction for the Rotator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.view.removeRenderListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Rotator. 
		 */
		enable: function() {
			this.enabled = true;
			shouldRender.call(this);
		},
		
		/**
		 * Get the Transforms that the Rotator currently contains.
		 * 
		 * @return {o3d.Transform[]} array of Transforms
		 */
		getTransforms: function() {
			var trans = [];
			
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var obj = this.transformObjs[i];
				
				if (obj.foster) {
					trans.push(obj.rotTran.parent);
				} else {
					trans.push(obj.offTran);
				}
			}

			return trans;
		},
		
		/**
		 * Make the Rotator rotate the specified amount in the specified amount
		 * of time.
		 * 
		 * @param {number[3]} theta XYZ amounts to rotate (in radians)
		 * @param {number} time number of seconds for the rotation to take
		 * @param {boolean} opt_mustComplete optional flag indicating that no
		 *     other rotations can be started until this one finishes
		 */
		rotate: function(theta,time,opt_mustComplete) {
			if (!this.enabled || this.mustComplete) return false;
			this.time = 0;
			this.stopTime = time || 0.001;
			this.steadyRotate = true;
			this.startAngle = this.angle;
			this.mustComplete = opt_mustComplete || false;
			this.stopAngle = hemi.core.math.addVector(this.angle,theta);
			hemi.view.addRenderListener(this);
			this.send(hemi.msg.start,{});
			return true;
		},
		
		/**
		 * Render event listener - Perform Newtonian calculations on the 
		 * rotating object, starting with the angular velocity.
		 * 
		 * @param {o3d.Event} event message describing the render event
		 */
		onRender: function(event) {
			if (this.transformObjs.length > 0) {
				var t = event.elapsedTime;
				if (this.steadyRotate) {
					this.time += t;
					if (this.time >= this.stopTime) {
						this.time = this.stopTime;
						this.steadyRotate = this.mustComplete = false;
						hemi.view.removeRenderListener(this);
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.time/this.stopTime;
					this.angle = hemi.core.math.lerpVector(
						this.startAngle,
						this.stopAngle,
						t1);
				} else {
					this.vel = hemi.core.math.addVector(
							this.vel,
							hemi.core.math.mulScalarVector(t,this.accel));
					this.angle = hemi.core.math.addVector(
							this.angle,
							hemi.core.math.mulScalarVector(t,this.vel));
				}

				applyRotator.call(this);
			}
		},
		
		/**
		 * Receive the given Transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 */
		receiveTransform: function(transform) {
			this.addTransform(transform);
			var matrices = this.toLoad[transform.name];
			
			if (matrices != null) {
				var tranObj = this.transformObjs[this.transformObjs.length - 1],
					origTran = tranObj.offTran,
					rotTran = tranObj.rotTran;
				
				rotTran.parent.localMatrix = matrices[0];
				rotTran.localMatrix = matrices[1];
				origTran.localMatrix = matrices[2];
				delete this.toLoad[transform.name];
			}
		},
		
		/**
		 * Remove Transforms belonging to the specified owner from the Rotator.
		 * 
		 * @param {hemi.world.Citizen} owner owner to remove Transforms for
		 */
		removeTransforms: function(owner) {
			for (var i = 0; i < this.transformObjs.length; ++i) {
				var obj = this.transformObjs[i];
				
				if (owner === obj.owner) {
					removeRotateTransforms.call(this, obj);
					// Update index to reflect removed obj
					--i;
				}
			}
		},
		
		/**
		 * Set the angular acceleration.
		 * 
		 * @param {number[3]} accel XYZ angular acceleration (in radians)
		 */
		setAccel: function(accel) {
			this.accel = accel;
			shouldRender.call(this);
		},
		
		/**
		 * Set the current rotation angle.
		 * 
		 * @param {number[3]} theta XYZ rotation angle (in radians)
		 */
		setAngle: function(theta) {
			this.angle = theta;
			applyRotator.call(this);
		},
		
		/**
		 * Set the origin of the Rotator Transform.
		 * 
		 * @param {number[3]} origin XYZ origin
		 */
		setOrigin: function(origin) {
			this.origin = origin;
			this.offset = hemi.core.math.mulScalarVector(-1, origin);
		},
		
		/**
		 * Set the angular velocity.
		 * 
		 * @param {number[3]} vel XYZ angular velocity (in radians)
		 */
		setVel: function(vel) {
			this.vel = vel;
			shouldRender.call(this);
		},
		
		/**
		 * Get the Octane structure for the Rotator.
	     *
	     * @return {Object} the Octane structure representing the Rotator
		 */
		toOctane: function() {
			var octane = this._super(),
				valNames = ['accel', 'angle', 'vel'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			octane.props.push({
				name: 'setOrigin',
				arg: [this.origin]
			});
			
			// Save the local matrices of the transforms so we can restore them
			var tranOct = {};
			
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var tranObj = this.transformObjs[i],
					origTran = tranObj.offTran,
					rotTran = tranObj.rotTran;
				
				// Note: this will break if the Rotator has more than one
				// transform with the same name
				tranOct[origTran.name] = [
					tranObj.parent.localMatrix,
					rotTran.localMatrix,
					origTran.localMatrix
				];
			}
			
			octane.props.push({
				name: 'toLoad',
				val: tranOct
			});
			
			return octane;
		}
	});
	
	hemi.motion.Rotator.prototype.msgSent =
		hemi.motion.Rotator.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);

	/**
	 * @class A Translator provides easy setting of linear velocity and
	 * acceleration of shapes and transforms in the 3d scene.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {o3d.Transform} opt_tran optional Transform that will be moving
	 * @param {Object} opt_config optional configuration for the Translator
	 */
	hemi.motion.Translator = hemi.world.Citizen.extend({
		init: function(opt_tran, opt_config) {
			this._super();
			
			var cfg = opt_config || {};
			
			this.pos = cfg.pos || [0,0,0];
			this.vel = cfg.vel || [0,0,0];
			this.accel = cfg.accel || [0,0,0];
	
			this.time = 0;
			this.stopTime = 0;
			this.mustComplete = false;
			this.steadyMove = false;
			this.startPos = this.pos;
			this.stopPos = this.pos;
			this.toLoad = {};
			this.transformObjs = [];
			
			if (opt_tran != null) {
				this.addTransform(opt_tran);
			}
	
			this.enable();
		},
		
		/**
		 * Add the Transform to the list of Transforms that will be moving.
		 *
		 * @param {o3d.Transform} transform the Transform to add
		 */
		addTransform: function(transform) {
			hemi.world.tranReg.register(transform, this);
			var param = transform.getParam('ownerId'),
				obj = {},
				oid = null,
				owner = null;
			
			if (param !== null) {
				oid = param.value;
				owner = hemi.world.getCitizenById(oid);
			}
			
			if (hemi.utils.isAnimated(transform)) {
				obj.tran = hemi.utils.fosterTransform(transform);
				obj.tran.name = transform.name + ' Translator';
				param = obj.tran.createParam('ownerId', 'o3d.ParamInteger');
				param.value = oid;
				obj.parent = transform.parent;
				obj.foster = true;
			} else {
				var tran = hemi.core.mainPack.createObject('Transform');
				tran.name = transform.name + ' Translator';
				param = tran.createParam('ownerId', 'o3d.ParamInteger');
				param.value = oid;
				tran.parent = transform.parent;
				transform.parent = tran;
				tran.localMatrix = hemi.utils.clone(transform.localMatrix);
				transform.identity();
				
				obj.tran = transform;
				obj.parent = tran;
				obj.foster = false;
			}
			
			if (owner) {
				var that = this;
				obj.owner = owner;
				obj.msg = owner.subscribe(hemi.msg.cleanup, function(msg) {
					that.removeTransforms(msg.src);
				});
			}
			
			this.transformObjs.push(obj);
			applyTranslator.call(this, [ obj ]);
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         * @string
         */
        citizenType: 'hemi.motion.Translator',
		
		/**
		 * Send a cleanup Message and remove all references in the Translator.
		 */
		cleanup: function() {
			this.disable();
			this._super();
			this.clearTransforms();
		},
		
		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.pos = [0,0,0];
			this.vel = [0,0,0];
			this.accel = [0,0,0];
		},
		
		/**
		 * Clear the list of translating Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				removeTranslateTransforms.call(this, this.transformObjs[0]);
			}
		},
		
		/**
		 * Disable mouse interaction for the Translator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.view.removeRenderListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Translator. 
		 */
		enable: function() {
			this.enabled = true;
			shouldRender.call(this);
		},
		
		/**
		 * Get the Transforms that the Translator currently contains.
		 * 
		 * @return {o3d.Transform[]} array of Transforms
		 */
		getTransforms: function() {
			var trans = [];
			
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var obj = this.transformObjs[i];
				
				if (obj.foster) {
					trans.push(obj.tran.parent);
				} else {
					trans.push(obj.tran);
				}
			}
			
			return trans;
		},
		
		/**
		 * Make the Translator translate the specified amount in the specified
		 * amount of time.
		 * 
		 * @param {number[3]} delta XYZ amount to translate
		 * @param {number} time number of seconds for the translation to take
		 * @param {boolean} opt_mustComplete optional flag indicating that no
		 *     other translations can be started until this one finishes
		 */
		move : function(delta,time,opt_mustComplete) {
			if (!this.enabled || this.mustComplete) return false;
			this.time = 0;
			this.stopTime = time || 0.001;
			this.steadyMove = true;
			this.startPos = this.pos;
			this.mustComplete = opt_mustComplete || false;
			this.stopPos = hemi.core.math.addVector(this.pos,delta);
			hemi.view.addRenderListener(this);
			this.send(hemi.msg.start,{});
			return true;
		},
	
		/**
		 * Render event listener - calculate the position of the Translator,
		 * based on the acceleration and velocity.
		 * 
		 * @param {o3d.Event} event message describing render event
		 */
		onRender : function(event) {
			if (this.transformObjs.length > 0) {
				var t = event.elapsedTime;
				if (this.steadyMove) {
					this.time += t;
					if (this.time >= this.stopTime) {
						this.time = this.stopTime;
						this.steadyMove = this.mustComplete = false;
						hemi.view.removeRenderListener(this);
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.time/this.stopTime;
					this.pos = hemi.core.math.lerpVector(
						this.startPos,
						this.stopPos,
						t1);
				} else {
					this.vel = hemi.core.math.addVector(
							this.vel,
							hemi.core.math.mulScalarVector(t,this.accel));
					this.pos = hemi.core.math.addVector(
							this.pos,
							hemi.core.math.mulScalarVector(t,this.vel));
				}

				applyTranslator.call(this);
			}
		},
		
		/**
		 * Receive the given Transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 */
		receiveTransform: function(transform) {
			this.addTransform(transform);
			var matrices = this.toLoad[transform.name];
			
			if (matrices != null) {
				transform.parent.localMatrix = matrices[0];
				transform.localMatrix = matrices[1];
				delete this.toLoad[transform.name];
			}
		},
		
		/**
		 * Remove Transforms belonging to the specified owner from the
		 * Translator.
		 * 
		 * @param {hemi.world.Citizen} owner owner to remove Transforms for
		 */
		removeTransforms: function(owner) {
			for (var i = 0; i < this.transformObjs.length; ++i) {
				var obj = this.transformObjs[i];
				
				if (owner === obj.owner) {
					removeTranslateTransforms.call(this, obj);
					// Update index to reflect removed obj
					--i;
				}
			}
		},
		
		/**
		 * Set the acceleration.
		 * 
		 * @param {number[3]} a XYZ acceleration vector
		 */
		setAccel: function(a) {
			this.accel = a;
			shouldRender.call(this);
		},
		
		/**
		 * Set the position.
		 * 
		 * @param {number[3]} x XYZ position
		 */
		setPos: function(x) {
			this.pos = x;
			applyTranslator.call(this);
		},
		
		/**
		 * Set the velocity.
		 * @param {number[3]} v XYZ velocity vector
		 */
		setVel: function(v) {
			this.vel = v;
			shouldRender.call(this);
		},
		
		/**
		 * Get the Octane structure for the Translator.
	     *
	     * @return {Object} the Octane structure representing the Translator
		 */
		toOctane: function() {
			var octane = this._super(),
				valNames = ['pos', 'vel', 'accel'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			// Save the local matrices of the transforms so we can restore them
			var tranOct = {};
			
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var tranObj = this.transformObjs[i],
					origTran = tranObj.tran;
				
				// Note: this will break if the Translator has more than one
				// transform with the same name
				tranOct[origTran.name] = [
					tranObj.parent.localMatrix,
					origTran.localMatrix
				];
			}
			
			octane.props.push({
				name: 'toLoad',
				val: tranOct
			});
			
			return octane;
		}
	});
	
	hemi.motion.Translator.prototype.msgSent =
		hemi.motion.Translator.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	
	///////////////////////////////////////////////////////////////////////////
	// Private functions
	///////////////////////////////////////////////////////////////////////////

	var removeRotateTransforms = function(tranObj) {
		var rotTran = tranObj.rotTran,
			offTran = tranObj.offTran,
			origTran;
		
		if (tranObj.foster) {
			origTran = rotTran.parent;
			rotTran.parent = null;
			offTran.parent = origTran;
			
			hemi.core.mainPack.removeObject(rotTran);
			hemi.utils.unfosterTransform(offTran);
		} else {
			var parTran = tranObj.parent;
			
			parTran.children[0].parent = parTran.parent;
			rotTran.children[0].localMatrix = parTran.localMatrix;
			rotTran.children[0].parent = rotTran.parent;
			
			origTran = offTran;
			
			parTran.parent = rotTran.parent = null;
			hemi.core.mainPack.removeObject(parTran);
			hemi.core.mainPack.removeObject(rotTran);
		}
		
		hemi.world.tranReg.unregister(origTran, this);
		var ndx = this.transformObjs.indexOf(tranObj);
		
		if (ndx > -1) {
			this.transformObjs.splice(ndx, 1);
		}
		
		if (tranObj.owner && tranObj.msg) {
			tranObj.owner.unsubscribe(tranObj.msg, hemi.msg.cleanup);
		}
	},
	
	applyRotator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transformObj = objs[i];
			transformObj.offTran.identity();
			transformObj.offTran.translate(this.offset);
			transformObj.rotTran.identity();
			transformObj.rotTran.translate(this.origin);
			transformObj.rotTran.rotateZYX(this.angle);
		}
	},


	shouldRender = function() {
		if (!this.enabled ||  (this.accel.join() === '0,0,0' && this.vel.join() === '0,0,0')) {
			hemi.view.removeRenderListener(this);
		} else {
			hemi.view.addRenderListener(this);
		}
	},

	applyTranslator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i].tran;
			transform.identity();
			transform.translate(this.pos);
		}
	},

	removeTranslateTransforms = function(tranObj) {
		var origTran;
		
		if (tranObj.foster) {
			origTran = hemi.utils.unfosterTransform(tranObj.tran);
		} else {
			var parTran = tranObj.parent;

			parTran.children[0].localMatrix = parTran.localMatrix;
			parTran.children[0].parent = parTran.parent;
			
			origTran = tranObj.tran;
			parTran.parent = null;
			hemi.core.mainPack.removeObject(parTran);
		}
		
		hemi.world.tranReg.unregister(origTran, this);
		var ndx = this.transformObjs.indexOf(tranObj);
		
		if (ndx > -1) {
			this.transformObjs.splice(ndx, 1);
		}
		
		if (tranObj.owner && tranObj.msg) {
			tranObj.owner.unsubscribe(tranObj.msg, hemi.msg.cleanup);
		}
	};
	
	return hemi;
})(hemi || {});/* 
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
	 * @namespace A module for generating particle effects.
	 */
	hemi.effect = hemi.effect || {};
	
	/**
	 * A set of names of predefined per-particle parameter setting functions.
	 * <ul><pre>
	 * <li>hemi.effect.ParticleFunctionName.Acceleration
	 * <li>hemi.effect.ParticleFunctionName.Puff
	 * </ul></pre>
	 */
	hemi.effect.ParticleFunctions = {
		Acceleration : 'Acceleration',
		Puff: 'Puff'
	};
	
	/**
	 * @class A ParticleFunction specifies a predefined per-particle parameter
	 * setting function and any properties it might require.
	 * @example
	 * Each function must be of the form:
	 * 
	 * function(number, hemi.core.particles.ParticleSpec): void
	 * 
	 * The number is the index of the particle being created. The ParticleSpec
	 * is a set of parameters for that particular particle.
	 */
	hemi.effect.ParticleFunction = function() {
		/**
		 * The name of the predefined parameter setting function.
		 * @type hemi.effect.ParticleFunctions
		 */
		this.name = null;
		
		/**
		 * A set of options to customize values that the function uses to
		 * calculate the particle parameters.
		 * @type Object
		 */
		this.options = {};
	};
	
	hemi.effect.ParticleFunction.prototype = {
		/**
		 * Get the Octane structure for the ParticleFunction.
		 * 
	     * @return {Object} the Octane structure representing the
	     *     ParticleFunction
		 */
		toOctane: function() {
			var octane = {
				type: 'hemi.effect.ParticleFunction',
				props: []
			};
			
			octane.props.push({
				name: 'name',
				val: this.name
			});
			
			octane.props.push({
				name: 'options',
				val: this.options
			});
			
			return octane;
		}
	};
	
	/**
	 * @class An Effect is a 3D particle effect.
	 * @extends hemi.world.Citizen
	 */
	hemi.effect.Effect = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The particle state to use for drawing.
			 * @type hemi.core.particles.ParticleStateIds
			 * @default hemi.core.particles.ParticleStateIds.BLEND
			 */
			this.state = hemi.core.particles.ParticleStateIds.BLEND;
			
			/**
			 * An array of colors for each particle to transition through. Each
			 * color value is in the form RGBA.
			 * @type number[]
			 */
			this.colorRamp = [];
			
			/**
			 * A set of parameters for the particle emitter.
			 * @type hemi.core.particles.ParticleSpec
			 */
			this.params = {};
			
			/**
			 * Optional specs that identify a particle updating function to use and
			 * properties to set for it.
			 * @type hemi.effect.ParticleFunction
			 */
			this.particleFunction = null;
			
			/* The actual particle emitter for the Effect */
			this.particles = null;
			/* The containing Transform for the Effect */
			this.transform = hemi.effect.particlePack.createObject('Transform');
			this.transform.parent = hemi.core.client.root;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Effect',
		
		/**
		 * Send a cleanup Message and remove all references in the Effect.
		 */
		cleanup: function() {
			this._super();
			
			this.particles = null;
			this.transform.parent = null;
			hemi.effect.particlePack.removeObject(this.transform);
			this.transform = null;
		},
		
		/**
		 * Set the particle emitter up for the Effect. Implementing subclasses
		 * should override this.
		 */
		setup: function() {
			
		},
		
		/**
		 * Get the Octane structure for the Effect.
		 * 
	     * @return {Object} the Octane structure representing the Effect
		 */
		toOctane: function() {
			var octane = this._super();
			
			var valNames = ['state', 'colorRamp', 'params'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			};
			
			if (this.particleFunction !== null) {
				octane.props.push({
					name: 'particleFunction',
					oct: this.particleFunction.toOctane()
				});
			}
			
			octane.props.push({
				name: 'setup',
				arg: []
			});
			
			return octane;
		}
	});
	
	/**
	 * @class An Emitter constantly generates particles.
	 * @extends hemi.effect.Effect
	 */
	hemi.effect.Emitter = hemi.effect.Effect.extend({
		init: function() {
			this._super();
			
			/* Flag indicating if the Emitter is visible */
			this.visible = false;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Emitter',
		
		/**
		 * Set the Emitter to not be visible.
		 */
		hide: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (this.visible) {
				this.visible = false;
				this.transform.removeShape(this.particles.shape);
				this.send(hemi.msg.visible,
					{
						visible: this.visible
					});
			}
		},
		
		/**
		 * Set the particle emitter up for the Emitter.
		 */
		setup: function() {
			// Create a deep copy of the parameters since the particle emitter
			// will mutate them as it fires.
			var clonedParams = hemi.utils.clone(this.params),
				paramSetter;
			
			// It's okay if paramSetter stays undefined.
			if (this.particleFunction !== null) {
				paramSetter = hemi.effect.getParticleFunction(this.particleFunction);
			}
			
			this.particles = hemi.effect.particleSystem.createParticleEmitter();
			this.particles.setState(this.state);
			this.particles.setColorRamp(this.colorRamp);
			this.particles.setParameters(clonedParams, paramSetter);
		},
		
		/**
		 * Set the Emitter to be visible.
		 */
		show: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (!this.visible) {
				this.visible = true;
				this.transform.addShape(this.particles.shape);
				this.send(hemi.msg.visible,
					{
						visible: this.visible
					});
			}
		}
	});
	
	hemi.effect.Emitter.prototype.msgSent =
		hemi.effect.Emitter.prototype.msgSent.concat([hemi.msg.visible]);
	
	/**
	 * @class A Burst generates one set of particles at a time. It can be used
	 * for a smoke puff, explosion, firework, water drip, etc.
	 * @extends hemi.effect.Emitter
	 */
	hemi.effect.Burst = hemi.effect.Emitter.extend({
		init: function() {
			this._super();
			
			/* The OneShot particle effect */
			this.oneShot = null;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Burst',
		
		/**
		 * Send a cleanup Message and remove all references in the Burst.
		 */
		cleanup: function() {
			this._super();
			
			this.oneShot = null;
		},
		
		/**
		 * Set the particle emitter up for the Burst.
		 */
		setup: function() {
			this._super();
			
			this.oneShot = this.particles.createOneShot(this.transform);
		},
		
		/**
		 * Generate the particles for the Burst.
		 */
		trigger: function() {
			if (this.oneShot === null) {
				this.setup();
			}
			
			this.oneShot.trigger(this.params.position);
			this.send(hemi.msg.burst,
				{
					position: this.params.position
				});
		}
	});
	
	hemi.effect.Burst.prototype.msgSent =
		hemi.effect.Burst.prototype.msgSent.concat([hemi.msg.burst]);
	
	/**
	 * @class A Trail is a particle effect that can be started and stopped like
	 * an animation. It can be used for effects like exhaust.
	 * @extends hemi.effect.Effect
	 */
	hemi.effect.Trail = hemi.effect.Effect.extend({
		init: function() {
			this._super();
			
			/* A flag that indicates if the Trail is currently animating */
			this.isAnimating = false;
			/* The number of seconds between particle births */
			this.fireInterval = 1;
			this.count = 0;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Trail',
		
		/**
		 * Render event handling function that allows the Trail to animate.
		 * 
		 * @param {o3d.Event} renderEvent the render event
		 */
		onRender: function(renderEvent) {
			this.count += renderEvent.elapsedTime;
			
			if (this.count >= this.fireInterval) {
				this.count = 0;
				this.particles.birthParticles(this.params.position);
			}
		},
		
		/**
		 * Set the particle emitter up for the Trail.
		 */
		setup: function() {
			// Create a deep copy of the parameters since the particle emitter
			// will mutate them as it fires.
			var clonedParams = hemi.utils.clone(this.params),
				paramSetter;
			
			// Calculate the maximum number of particles for the stream
			var particlesPerFire = this.params.numParticles || 1,
				maxLife = this.params.lifeTime || 1 + this.params.lifeTimeRange || 0,
				maxFires = (maxLife / this.fireInterval) + 1,
				maxParticles = parseInt(maxFires * particlesPerFire);
			
			// It's okay if paramSetter stays undefined.
			if (this.particleFunction !== null) {
				paramSetter = hemi.effect.getParticleFunction(this.particleFunction);
			}
			
			// Intentionally left undefined for now.
			var texture;
			
			this.particles = hemi.effect.particleSystem.createTrail(
				this.transform,
				maxParticles,
				clonedParams,
				texture,
				paramSetter);
			this.particles.setState(this.state);
			this.particles.setColorRamp(this.colorRamp);
		},
		
		/**
		 * Start animating the Trail. It will generate particles based upon its
		 * fireInterval property.
		 */
		start: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (!this.isAnimating) {
				this.isAnimating = true;
				hemi.view.addRenderListener(this);
				this.send(hemi.msg.start, { });
			}
		},
		
		/**
		 * Stop animating the Trail.
		 */
		stop: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (this.isAnimating) {
				hemi.view.removeRenderListener(this);
				this.isAnimating = false;
				this.count = 0;
				this.send(hemi.msg.stop, { });
			}
		},
		
		/**
		 * Get the Octane structure for the Trail.
		 * 
	     * @return {Object} the Octane structure representing the Trail
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.unshift({
				name: 'fireInterval',
				val: this.fireInterval
			});
			
			return octane;
		}
	});
	
	hemi.effect.Trail.prototype.msgSent =
		hemi.effect.Trail.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	
	/**
	 * Initialize the resources for the effect module.
	 */
	hemi.effect.init = function() {
		this.particlePack = hemi.core.client.createPack();
		this.particleSystem = hemi.core.particles.createParticleSystem(
			this.particlePack,
			hemi.view.viewInfo);
	};
	
	/**
	 * Create an Emitter effect that constantly streams particles.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.core.particles.ParticleSpec} params parameters for the
	 *	   particle emitter
	 * @param {hemi.effect.ParticleFunction} opt_function optional specs that
	 *	   that identify a particle updating function to use and properties to
	 *	   set for it
	 * @return {hemi.effect.Emitter} the newly created Emitter
	 */
	hemi.effect.createEmitter = function(
			state,
			colorRamp,
			params,
			opt_function) {
		var emitter = new hemi.effect.Emitter();
		emitter.state = state;
		emitter.colorRamp = colorRamp;
		emitter.params = params;
		
		if (opt_function) {
			emitter.particleFunction = opt_function;
		}
		
		emitter.setup();
		return emitter;
	};
	
	/**
	 * Create a Burst effect that fires particles one shot at a time.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.core.particles.ParticleSpec} params parameters for the
	 *	   particle emitter
	 * @param {hemi.effect.ParticleFunction} opt_function optional specs that
	 *	   that identify a particle updating function to use and properties to
	 *	   set for it
	 * @return {hemi.effect.Burst} the newly created Burst
	 */
	hemi.effect.createBurst = function(
			state,
			colorRamp,
			params,
			opt_function) {
		var burst = new hemi.effect.Burst();
		burst.state = state;
		burst.colorRamp = colorRamp;
		burst.params = params;
		
		if (opt_function) {
			burst.particleFunction = opt_function;
		}
		
		burst.setup();
		return burst;
	};
	
	/**
	 * Create a Trail effect that fires particles at the specified interval.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.core.particles.ParticleSpec} params parameters for the
	 *	   particle emitter
	 * @param {number} fireInterval seconds to wait between firing particles
	 * @param {hemi.effect.ParticleFunction} opt_function optional specs that
	 *	   that identify a particle updating function to use and properties to
	 *	   set for it
	 * @return {hemi.effect.Trail} the newly created Trail
	 */
	hemi.effect.createTrail = function(
			state,
			colorRamp,
			params,
			fireInterval,
			opt_function) {
		var trail = new hemi.effect.Trail();
		trail.state = state;
		trail.colorRamp = colorRamp;
		trail.params = params;
		trail.fireInterval = fireInterval;
		
		if (opt_function) {
			trail.particleFunction = opt_function;
		}
		
		trail.setup();
		return trail;
	};
	
	/**
	 * Get the predefined per-particle parameter setting function for the given
	 * specs.
	 *
	 * @param {hemi.effect.ParticleFunction} funcSpecs specs that identify the
	 *	   function to get and properties to set for it
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
	 *	   instance of the predefined function with the appropriate properties
	 *	   set or null if the function name is not recognized
	 */
	hemi.effect.getParticleFunction = function(funcSpecs) {
		var particleFunc;
		
		switch(funcSpecs.name) {
			case hemi.effect.ParticleFunctions.Acceleration:
				particleFunc = this.getAccelerationFunction(funcSpecs.options);
				break;
			case hemi.effect.ParticleFunctions.Puff:
				particleFunc = this.getPuffFunction(funcSpecs.options);
				break;
			default:
				particleFunc = null;
				break;
		}
		
		return particleFunc;
	};
	
	/**
	 * Get a function that sets each particle's acceleration by applying a
	 * factor to that particle's velocity. Valid options are:
	 * - factor : number[3] a factor to apply to each particle's XYZ velocity
	 *
	 * @param {Object} options customization options for the particle parameters
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
	 *	   instance of the ParticleFunctionId.Acceleration function
	 */
	hemi.effect.getAccelerationFunction = function(options) {
		var acc = function (index, parameters) {
			parameters.acceleration = [
				acc.factor[0] * parameters.velocity[0],
				acc.factor[1] * parameters.velocity[1],
				acc.factor[2] * parameters.velocity[2]
			];
		};
		
		acc.factor = options.factor === undefined ? [0, 0, 0] : options.factor;
		return acc;
	};
	
	/**
	 * Get a function that sets each particle's velocity and acceleration to
	 * create a windblown puff effect. Valid options are:
	 * - wind : number[3] an XYZ acceleration to apply to each particle
	 * - size : number a factor to determine the size of the puff
	 * 
	 * @param {Object} options customization options for the particle parameters
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
	 *	   instance of the ParticleFunctionId.Puff function
	 */
	hemi.effect.getPuffFunction = function(options) {
		var puff = function (index, parameters) {
			var angle = Math.random() * 2 * Math.PI,
				speed = 0.8 * puff.size,
				drag = -0.003 * puff.size;
			// Calculate velocity
			parameters.velocity = hemi.core.math.matrix4.transformPoint(
				hemi.core.math.matrix4.rotationY(7 * angle),
				[speed,speed,speed]);
			parameters.velocity = hemi.core.math.matrix4.transformPoint(
				hemi.core.math.matrix4.rotationX(angle),
				parameters.velocity);
			// Calculate acceleration
			parameters.acceleration = hemi.core.math.mulVectorVector(
				parameters.velocity,
				[drag,drag,drag]);
			parameters.acceleration = hemi.core.math.addVector(
				parameters.acceleration,
				puff.wind);
		};
		
		puff.wind = options.wind === undefined ? [0, 0, 0] : options.wind;
		puff.size = options.size === undefined ? 1 : options.size;
		return puff;
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
	 * @namespace A module for grouping world events and behavior into logical
	 * scenes.
	 */	
	hemi.scene = hemi.scene || {};
	
	/**
	 * @class A Scene represents a logical grouping of behavior, events, and
	 * interactions. It can be used to determine when various interactions are
	 * valid or if various events should be enabled.
	 * @extends hemi.world.Citizen
	 */
	hemi.scene.Scene = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * Flag indicating if the Scene is currently loaded.
			 * @type boolean
			 * @default false
			 */
			this.isLoaded = false;
			
			/**
			 * The next Scene to move to after this one.
			 * @type hemi.scene.Scene
			 */
			this.next = null;
			
			/**
			 * The previous Scene that occurred before this one.
			 * @type hemi.scene.Scene
			 */
			this.prev = null;
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
        citizenType: 'hemi.scene.Scene',
		
		/**
		 * Send a cleanup Message and remove all references in the Scene.
		 */
		cleanup: function() {
			this._super();
			
			if (this.next !== null) {
				this.next.prev = this.prev;
			}
			if (this.prev !== null) {
				this.prev.next = this.next;
			}
			
			this.next = null;
			this.prev = null;
		},
	
		/**
		 * Get the Octane structure for the Scene.
	     *
	     * @return {Object} the Octane structure representing the Scene
		 */
		toOctane: function() {
			var octane = this._super();
			
			if (this.next === null) {
				octane.props.push({
					name: 'next',
					val: null
				});
			} else {
				octane.props.push({
					name: 'next',
					id: this.next.getId()
				});
			}
			
			if (this.prev === null) {
				octane.props.push({
					name: 'prev',
					val: null
				});
			} else {
				octane.props.push({
					name: 'prev',
					id: this.prev.getId()
				});
			}
			
			return octane;
		},
		
		/**
		 * Load the Scene.
		 */
		load: function() {
			if (!this.isLoaded) {
				this.isLoaded = true;
				
				this.send(hemi.msg.load, {});
			}
		},
		
		/**
		 * Unload the Scene.
		 */
		unload: function() {
			if (this.isLoaded) {
				this.isLoaded = false;
				
				this.send(hemi.msg.unload, {});
			}
		},
		
		/**
		 * Unload the Scene and move to the next Scene (if it has been set).
		 */
		nextScene: function() {
			if (this.isLoaded && this.next != null) {
				this.unload();
				this.next.load();
			}
		},
		
		/**
		 * Unload the Scene and move to the previous Scene (if it has been set).
		 */
		previousScene: function() {
			if (this.isLoaded && this.prev != null) {
				this.unload();
				this.prev.load();
			}
		}
	});
	
	hemi.scene.Scene.prototype.msgSent =
		hemi.scene.Scene.prototype.msgSent.concat([hemi.msg.load, hemi.msg.unload]);
	
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
	 * @namespace A module for heads up display (HUD) creation and
	 * manipulation.
	 */
	hemi.hud = hemi.hud || {};

	/**
	 * Creates the HudManager (which handles all HUD operations) and the Pack
	 * for HUD objects.
	 */
	hemi.hud.init = function() {
		this.pack = hemi.core.client.createPack();
		this.theme = new hemi.hud.Theme();
		this.theme.name = 'Default';
		this.hudMgr = new hemi.hud.HudManager();
	};
	
	/**
	 * Clean up objects created by the HUD Pack.
	 */
	hemi.hud.cleanup = function() {
		this.pack.destroy();
		this.pack = null;
		this.hudMgr = null;
		this.theme = null;
	};
	
	/**
	 * Set the current theme for HUD displays.
	 * 
	 * @param {hemi.hud.Theme} theme display options for HUD elements
	 */
	hemi.hud.setTheme = function(theme) {
		this.theme = theme;
	};
	
	/**
	 * @class A Theme contains configuration options for displaying HUD elements
	 * like pages and text.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.Theme = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * Configuration options for an image foreground overlay.
			 * @type Object
			 */
			this.image = {
				/**
				 * Options for a blur shadow effect on the image. Set radius to 0 to
				 * cancel.
				 * @type Object
				 */
				shadow: {
					radius: 0,
					offsetY: 0,
					offsetX: 0,
					color: [0, 0, 0, 1]
				}
			};
			
			/**
			 * Configuration options for a rectangular background overlay.
			 * @type Object
			 */
			this.page = {
				/**
				 * The color and opacity of the rectangular overlay in RGBA format.
				 * @type number[4]
				 * @default [0, 0, 0, 0.45]
				 */
				color: [0, 0, 0, 0.45],
				
				/**
				 * The amount of curving to apply to the corners of the page. Range
				 * is from 0.0 to 1.0 where 0 is a plain rectangle and 1 is an oval.
				 */
				curve: 0,
				
				/**
				 * Options for a blur shadow effect on the page. This is mutually
				 * exclusive to outline. Set radius to 0 to cancel.
				 * @type Object
				 */
				shadow: {
					radius: 0,
					offsetY: 0,
					offsetX: 0,
					color: [0, 0, 0, 0]
				},
				
				/**
				 * Optional outline for the page in RGBA format. This is mutually
				 * exclusive to shadow. Set to null to cancel.
				 * @type number[4]
				 */
				outline: null
			};
			
			/**
			 * Configuration options for a textual foreground overlay.
			 * @type Object
			 */
			this.text = {
				/**
				 * The font size of the text.
				 * @type number
				 * @default 12
				 */
				textSize: 12,
				
				/**
				 * The name of the font to use to paint the text.
				 * @type string
				 * @default 'helvetica'
				 */
				textTypeface: 'helvetica',
				
				/**
				 * The horizontal alignment of the text.
				 * @type string
				 * @default 'center'
				 */
				textAlign: 'center',
				
				/**
				 * Additional styling for the text (normal, bold, italics)
				 * @type string
				 * @default 'bold'
				 */
				textStyle: 'bold',
				
				/**
				 * Flag to indicate if the HudManager should perform strict text
				 * wrapping.
				 * @type boolean
				 * @default true
				 */
				strictWrapping: true,
				
				/**
				 * Number of pixels to place between lines of text.
				 * @type number
				 * @default 5
				 */
				lineMargin: 5,
				
				/**
				 * The color and opacity of the text in RGBA format.
				 * @type number[4]
				 * @default [1, 1, 0.6, 1]
				 */
				color: [1, 1, 0.6, 1],
				
				/**
				 * Options for a blur shadow effect on the text. This is mutually
				 * exclusive to outline. Set radius to 0 to cancel.
				 * @type Object
				 */
				shadow: {
					radius: 0.5,
					offsetY: 1,
					offsetX: 1,
					color: [0, 0, 0, 1]
				},
				
				/**
				 * Optional outline for the text in RGBA format. This is mutually
				 * exclusive to shadow. Set to null to cancel.
				 * @type number[4]
				 */
				outline: null
			};
			
			/**
			 * Configuration options for a video foreground overlay.
			 * @type Object
			 */
			this.video = {
				/**
				 * Options for a blur shadow effect on the video. Set radius to 0 to
				 * cancel.
				 * @type Object
				 */
				shadow: {
					radius: 0,
					offsetY: 0,
					offsetX: 0,
					color: [0, 0, 0, 1]
				}
			};
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.Theme',
		
		/**
		 * Set the Theme as the current Theme for HUD displays.
		 */
		load: function() {
			hemi.hud.setTheme(this);
		},
		
		/**
		 * Get the Octane structure for the Theme.
	     *
	     * @return {Object} the Octane structure representing the Theme
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'image',
				val: this.image
			});
			octane.props.push({
				name: 'page',
				val: this.page
			});
			octane.props.push({
				name: 'text',
				val: this.text
			});
			octane.props.push({
				name: 'load',
				arg: []
			});
			
			return octane;
		}
	});
	
	/**
	 * @class A HudElement contains the basics of any element to be drawn on
	 * the canvas.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.HudElement = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The handler function for mouse down events that occur within the
			 * bounds of the HudElement.
			 * @type function(o3d.Event): void
			 */
			this.mouseDown = null;
			
			/**
			 * The handler function for mouse up events that occur within the
			 * bounds of the HudElement.
			 * @type function(o3d.Event): void
			 */
			this.mouseUp = null;
			
			/**
			 * The handler function for mouse move events. It takes the Event and a
			 * boolean indicating if the Event occurred within the bounds of the
			 * HudElement.
			 * @type function(o3d.Event, boolean): void
			 */
			this.mouseMove = null;
			
			/**
			 * The y-value of the upper boundary of the HudElement. This value
			 * should be calculated at draw time rather than set directly.
			 * @type number 
			 */
			this.top = 0;
			
			/**
			 * The y-value of the lower boundary of the HudElement. This value
			 * should be calculated at draw time rather than set directly.
			 * @type number 
			 */
			this.bottom = 0;
			
			/**
			 * The x-value of the left boundary of the HudElement. This value
			 * should be calculated at draw time rather than set directly.
			 * @type number 
			 */
			this.left = 0;
			
			/**
			 * The x-value of the right boundary of the HudElement. This value
			 * should be calculated at draw time rather than set directly.
			 * @type number 
			 */
			this.right = 0;
			
			this.config = {};
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.HudElement',
		
		/**
		 * Send a cleanup Message and remove all references in the HudElement.
		 */
		cleanup: function() {
			this._super();
			this.mouseDown = null;
			this.mouseUp = null;
			this.mouseMove = null;
			this.config = {};
		},
		
		/**
		 * Get the Octane structure for the HudElement.
	     *
	     * @return {Object} the Octane structure representing the HudElement
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'top',
				val: this.top
			});
			octane.props.push({
				name: 'bottom',
				val: this.bottom
			});
			octane.props.push({
				name: 'left',
				val: this.left
			});
			octane.props.push({
				name: 'right',
				val: this.right
			});
			octane.props.push({
				name: 'config',
				val: this.config
			});
			
			return octane;
		},
		
		/**
		 * Calculate the top, bottom, left, and right values for the
		 * HudElement. This should be implemented by subclasses.
		 */
		calculateBounds: function() {
			
		},
		
		/**
		 * Check if the given Event occurred within the bounds of the
		 * HudElement.
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     the HudElement, otherwise false
		 */
		checkEvent: function(event) {
			var intersected = event.x <= this.right &&
				event.x >= this.left &&
				event.y <= this.bottom &&
				event.y >= this.top;
			
			return intersected;
		},
		
		/**
		 * Use the HudManager to draw the HudElement on screen. This should be
		 * implemented by subclasses.
		 */
		draw: function() {
			
		},
		
		/**
		 * If the given Event occurred within the bounds of this HudElement,
		 * call the HudElement's mouse down handler function (if one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     this HudElement, otherwise false
		 */
		onMouseDown: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected && this.mouseDown) {
				this.mouseDown(event);
			}
			
			return intersected;
		},
		
		/**
		 * If the HudElement's mouse move handler function is set, pass it the
		 * given Event and if it occurred within the bounds of this HudElement.
		 * 
		 * @param {o3d.Event} event the event that occurred
		 */
		onMouseMove: function(event) {
			if (this.mouseMove) {
				var intersected = this.checkEvent(event);
				this.mouseMove(event, intersected);
			}
		},
		
		/**
		 * If the given Event occurred within the bounds of this HudElement,
		 * call the HudElement's mouse up handler function (if one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     this HudElement, otherwise false
		 */
		onMouseUp: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected && this.mouseUp) {
				this.mouseUp(event);
			}
			
			return intersected;
		},
		
		/**
		 * Set unique display options for this HudElement. All other display
		 * options will be derived from the current Theme.
		 * 
		 * @param {Object} config configuration options
		 */
		setConfig: function(config) {
			this.config = config;
		}
	});
	
	/**
	 * @class A HudText contains formated text and display options for a single
	 * area of text on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudText = hemi.hud.HudElement.extend({
		init: function() {
			this._super();
			
			/**
			 * The x-coordinate of the HudText. The actual on screen location will
			 * depend on the horizontal alignment of the text.
			 * @type number
			 * @default 0
			 */
			this.x = 0;
			
			/**
			 * The y-coordinate of the top of the HudText.
			 * @type number
			 * @default 0
			 */
			this.y = 0;
			
			/**
			 * The formatted text that is actually drawn on screen. This property
			 * is created whenever the text, config, or width are set. It should
			 * typically not be set directly.
			 * @type string[]
			 */
			this.wrappedText = [];
			
			/**
			 * The height of the formatted text. This property is calculated
			 * whenever the text, config, or width are set. It should typically not
			 * be set directly.
			 * @type number
			 */
			this.wrappedHeight = 0;
			
			/**
			 * The width of the formatted text. This property is calculated
			 * whenever the text, config, or width are set. It should typically not
			 * be set directly.
			 * @type number
			 */
			this.wrappedWidth = 0;
			
			this.text = [];
			this.width = 0;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.HudText',
		
		/**
		 * Get the Octane structure for the HudText.
	     *
	     * @return {Object} the Octane structure representing the HudText
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			octane.props.push({
				name: 'setText',
				arg: [this.text]
			});
			octane.props.push({
				name: 'setWidth',
				arg: [this.width]
			});
			
			return octane;
		},

		/**
		 * Calculate the bounds of the formatted text.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			var align;
			
			if (this.config.textAlign != null) {
				align = this.config.textAlign.toLowerCase();
			} else {
				align = hemi.hud.theme.text.textAlign.toLowerCase();
			}
			
			this.top = this.y;
			this.bottom = this.top + this.wrappedHeight;

			switch (align) {
				case 'left':
					this.left = this.x;
					this.right = this.left + this.wrappedWidth;
					break;
				case 'right':
					this.right = this.x;
					this.left = this.right - this.wrappedWidth;
					break;
				default:
					var offset = this.wrappedWidth / 2;
					this.left = this.x - offset;
					this.right = this.x + offset;
					break;
			}
		},

		/**
		 * Draw the formatted text.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			hemi.hud.hudMgr.createTextOverlay(this.wrappedText, this.config, this.x, this.y);
		},

		/**
		 * Set unique display options for this HudText and perform text wrapping
		 * for the new options.
		 * 
		 * @param {Object} config configuration options
		 */
		setConfig: function(config) {
			this._super(config);
			this.wrapText();
		},

		/**
		 * Set the text to display for this HudText. Perform text wrapping for
		 * the new text.
		 * 
		 * @param {string} text a string or array of strings to display
		 */
		setText: function(text) {
			if (text instanceof Array) {
				this.text = text;
			} else {
				this.text = [text];
			}
			
			this.wrapText();
		},
		
		/**
		 * Set the desired width for this HudText. Perform text wrapping for
		 * the new width.
		 * 
		 * @param {number} width desired width for this HudText
		 */
		setWidth: function(width) {
			this.width = width;
			this.wrapText();
		},
		
		/**
		 * Perform text wrapping on the HudText's text. This sets the
		 * wrappedText, wrappedWidth, and wrappedHeight properties.
		 */
		wrapText: function() {
			if (this.width <= 0 || this.text.length <= 0) {
				return;
			}

			var width = 0;
			var height = 0;
			var wrappedText = [];

			for (var ndx = 0, len = this.text.length; ndx < len; ndx++) {
				var textObj = hemi.hud.hudMgr.doTextWrapping(this.text[ndx], this.width, this.config);
				
				if (textObj.width > width) {
					width = textObj.width;
				}
				
				height += textObj.height;
				wrappedText = wrappedText.concat(textObj.text);
			}

			this.wrappedWidth = width;
			this.wrappedHeight = height;
			this.wrappedText = wrappedText;
		}
	});
	
	/**
	 * @class A HudImage contains a texture and display options for a single
	 * image on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudImage = hemi.hud.HudElement.extend({
		init: function() {
			this._super();
			
			/**
			 * The x-coordinate of the left side of the HudImage.
			 * @type number
			 * @default 0
			 */
			this.x = 0;
			
			/**
			 * The y-coordinate of the top of the HudImage.
			 * @type number
			 * @default 0
			 */
			this.y = 0;
			
			/**
			 * The x-coordinate of the source image to pull image data from.
			 * @type number
			 * @default 0
			 */
			this.srcX = 0;
			
			/**
			 * The y-coordinate of the source image to pull image data from.
			 * @type number
			 * @default 0
			 */
			this.srcY = 0;
			
			/**
			 * The height of the image. This property is calculated when the image
			 * URL is loaded. It should typically not be set directly.
			 * @type number
			 */
			this.height = 0;
			
			/**
			 * The width of the image. This property is calculated when the image
			 * URL is loaded. It should typically not be set directly.
			 * @type number
			 */
			this.width = 0;
			
			this.image = null;
			this.url = null;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.HudImage',
		
		/**
		 * Send a cleanup Message and remove all references in the HudImage.
		 */
		cleanup: function() {
			this._super();
			this.image = null;
		},
		
		/**
		 * Get the Octane structure for the HudImage.
	     *
	     * @return {Object} the Octane structure representing the HudImage
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			octane.props.push({
				name: 'srcX',
				val: this.srcX
			});
			octane.props.push({
				name: 'srcY',
				val: this.srcY
			});
			octane.props.push({
				name: 'setImageUrl',
				arg: [this.url]
			});
			
			return octane;
		},
		
		/**
		 * Calculate the bounds of the image.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			this.top = this.y;
			this.bottom = this.top + this.height;
			this.left = this.x;
			this.right = this.left + this.width;
		},
		
		/**
		 * Draw the image texture.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			if (this.width !== this.image.width ||
				this.height !== this.image.height || this.srcX !== 0 ||
				this.srcY !== 0) {
				hemi.hud.hudMgr.createImageOverlay(this.image, this.config,
					this.x, this.y, this.srcX, this.srcY, this.width,
					this.height);
			} else {
				hemi.hud.hudMgr.createImageOverlay(this.image, this.config,
					this.x, this.y);
			}
		},
		
		/**
		 * Get the URL of the image file to load.
		 * 
		 * @return {string} the URL of the image file
		 */
		getImageUrl: function() {
			return this.url;
		},
		
		/**
		 * Set the URL of the image file to load and begin loading it.
		 * 
		 * @param {string} url the URL of the image file
		 */
		setImageUrl: function(url) {
			this.url = url;
			
			if (this.image !== null) {
				this.image = null;
			}
			
			this.loadImage();
		},
		
		/**
		 * Load the image from the image url into a texture for the HudManager
		 * to paint. This sets the texture, height, and width properties.
		 */
		loadImage: function() {
			var that = this;
			
			hemi.loader.loadImage(
				this.url,
				function(image) {
					that.image = image;
					that.height = image.height;
					that.width = image.width;
					that.send(hemi.msg.load, {});
				});
		}
	});

	hemi.hud.HudImage.prototype.msgSent =
		hemi.hud.HudImage.prototype.msgSent.concat([hemi.msg.load]);

	/**
	 * @class A HudButton uses different images based on if the button is
	 * enabled or if a mouse is hovering over it.
	 * @extends hemi.hud.HudImage
	 */
	hemi.hud.HudButton = hemi.hud.HudElement.extend({
		init: function() {
			this._super();
			
			/**
			 * The x-coordinate of the left side of the HudButton.
			 * @type number
			 * @default 0
			 */
			this.x = 0;
			
			/**
			 * The y-coordinate of the top of the HudButton.
			 * @type number
			 * @default 0
			 */
			this.y = 0;
			
			/**
			 * Flag indicating if the HudButton is enabled.
			 * @type boolean
			 * @default true
			 */
			this.enabled = true;
			
			/**
			 * Flag indicating if the mouse cursor is hovering over the HudButton.
			 * @type boolean
			 * @default false
			 */
			this.hovering = false;
			
			/**
			 * The HudImage to use for the HudButton when it is enabled.
			 * @type hemi.hud.HudImage
			 */
			this.enabledImg = null;
			
			/**
			 * The HudImage to use for the HudButton when it is disabled.
			 * @type hemi.hud.HudImage
			 */
			this.disabledImg = null;
			
			/**
			 * The HudImage to use for the HudButton when it is enabled and the
			 * mouse cursor is hovering.
			 * @type hemi.hud.HudImage
			 */
			this.hoverImg = null;
			
			var that = this;
			
			/**
			 * The built-in mouse move handler for a HudButton. If the mouse move
			 * occurred within the button's bounds, set it's hovering flag and
			 * redraw the button.
			 * @see hemi.hud.HudElement#mouseMove
			 * 
			 * @param {o3d.Event} event the mouse move event
			 * @param {boolean} intersected true if the event occurred within the
			 *     HudButton's bounds
			 */
			this.mouseMove = function(event, intersected) {
				if (intersected) {
					if (!that.hovering) {
						that.hovering = true;
						that.draw();
					}
				} else if (that.hovering) {
					that.hovering = false;
					that.draw();
				}
			};
		},
		
		/**
		 * Send a cleanup Message and remove all references in the HudButton.
		 */
		cleanup: function() {
			this._super();
			this.mouseMove = null;
			
			if (this.enabledImg) {
				this.enabledImg.cleanup();
				this.enabledImg = null;
			}
			if (this.disabledImg) {
				this.disabledImg.cleanup();
				this.disabledImg = null;
			}
			if (this.hoverImg) {
				this.hoverImg.cleanup();
				this.hoverImg = null;
			}
		},
		
		/**
		 * Get the Octane structure for the HudButton.
	     *
	     * @return {Object} the Octane structure representing the HudButton
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			octane.props.push({
				name: 'enabledImg',
				id: this.enabledImg.getId()
			});
			octane.props.push({
				name: 'disabledImg',
				id: this.disabledImg.getId()
			});
			octane.props.push({
				name: 'hoverImg',
				id: this.hoverImg.getId()
			});
			
			return octane;
		},
		
		/**
		 * Calculate the bounds of the button.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			var img = this.getImage();
			this.top = this.y;
			this.bottom = this.top + img.height;
			this.left = this.x;
			this.right = this.left + img.width;
		},
		
		/**
		 * Set the HudButton's image based on the enabled and hovering flags
		 * and then draw it.
		 * @see hemi.hud.HudImage#draw
		 */
		draw: function() {
			var img = this.getImage();
			img.x = this.x;
			img.y = this.y;
			img.draw();
		},
		
		/**
		 * Get the image that represents the HudButton in its current state.
		 * 
		 * @return {hemi.hud.HudImage} the image to draw for the HudButton
		 */
		getImage: function() {
			var img = this.enabledImg;
			
			if (!this.enabled) {
				if (this.disabledImg) {
					img = this.disabledImg;
				}
			} else if (this.hovering) {
				if (this.hoverImg) {
					img = this.hoverImg;
				}
			}
			
			return img;
		},
		
		/**
		 * Set the source x and y coordinates for the HudButtons images.
		 * 
		 * @param {Object} coords structure with optional coordinates for
		 *     different images
		 */
		setCoords: function(coords) {
			var disabledCoords = coords.disabled,
				enabledCoords = coords.enabled,
				hoverCoords = coords.hover;
			
			if (this.enabledImg === null) {
				this.enabledImg = new hemi.hud.HudImage();
			}
			if (this.disabledImg === null) {
				this.disabledImg = new hemi.hud.HudImage();
			}
			if (this.hoverImg === null) {
				this.hoverImg = new hemi.hud.HudImage();
			}
			if (enabledCoords != null) {
				this.enabledImg.srcX = enabledCoords[0];
				this.enabledImg.srcY = enabledCoords[1];
			}
			if (disabledCoords != null) {
				this.disabledImg.srcX = disabledCoords[0];
				this.disabledImg.srcY = disabledCoords[1];
			}
			if (hoverCoords != null) {
				this.hoverImg.srcX = hoverCoords[0];
				this.hoverImg.srcY = hoverCoords[1];
			}
		},
		
		/**
		 * Set the image urls for the HudButtons images.
		 * 
		 * @param {Object} urls structure with optional urls for different
		 *     images
		 */
		setUrls: function(urls) {
			var disabledUrl = urls.disabled,
				enabledUrl = urls.enabled,
				hoverUrl = urls.hover,
				that = this;
			
			if (!enabledUrl) {
				return;
			}
			if (this.enabledImg === null) {
				this.enabledImg = new hemi.hud.HudImage();
			}
			if (this.disabledImg === null) {
				this.disabledImg = new hemi.hud.HudImage();
			}
			if (this.hoverImg === null) {
				this.hoverImg = new hemi.hud.HudImage();
			}
			
			var enMsg = this.enabledImg.subscribe(hemi.msg.load, function(evt) {
				if (that.disabledImg.url === null) {
					that.disabledImg.url = enabledUrl;
					that.disabledImg.image = that.enabledImg.image;
					that.disabledImg.height = that.enabledImg.height;
					that.disabledImg.width = that.enabledImg.width;
				}
				if (that.hoverImg.url === null) {
					that.hoverImg.url = enabledUrl;
					that.hoverImg.image = that.enabledImg.image;
					that.hoverImg.height = that.enabledImg.height;
					that.hoverImg.width = that.enabledImg.width;
				}
				that.enabledImg.unsubscribe(enMsg);
			});
			
			if (disabledUrl != null && disabledUrl !== enabledUrl) {
				this.disabledImg.setImageUrl(disabledUrl);
			}
			if (hoverUrl != null && hoverUrl !== enabledUrl) {
				this.hoverImg.setImageUrl(hoverUrl);
			}
			this.enabledImg.setImageUrl(enabledUrl);
		}
	});
	
	/**
	 * @class A HudVideo contains a texture and display options for a single
	 * image on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudVideo = hemi.hud.HudElement.extend({
		init: function() {
			this._super();
			
			/**
			 * The x-coordinate of the left side of the HudVideo.
			 * @type number
			 * @default 0
			 */
			this.x = 0;
			
			/**
			 * The y-coordinate of the top of the HudVideo.
			 * @type number
			 * @default 0
			 */
			this.y = 0;
			
			/**
			 * The height of the video. Call setHeight to change.
			 * @type number
			 */
			this.height = 0;
			
			/**
			 * The width of the video. Call setWidth to change.
			 * @type number
			 */
			this.width = 0;
			
			this.urls = [];
			this.video = document.createElement('video');
			var vid = this.video,
				that = this;
			
			this.video.onloadeddata = function() {
				if (that.height === 0) {
					that.height = vid.videoHeight;
				} else {
					vid.setAttribute('height', '' + that.height);
				}
				if (that.width === 0) {
					that.width = vid.videoWidth;
				} else {
					vid.setAttribute('width', '' + that.width);
				}
				that.send(hemi.msg.load, {
					src: vid.currentSrc
				});
			};
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.HudVideo',
		
		/**
		 * Add the given URL as a source for the video file to load.
		 * 
		 * @param {string} url the URL of the video file
		 * @param {string} type the type of the video file (ogv, mp4, etc)
		 */
		addVideoUrl: function(url, type) {
			var src = document.createElement('source'),
				loadUrl = hemi.loader.getPath(url);
			
			src.setAttribute('src', loadUrl);
			src.setAttribute('type', 'video/' + type);
			this.video.appendChild(src);
			this.urls.push({
				url: url,
				type: type,
				node: src
			});
		},
		
		/**
		 * Send a cleanup Message and remove all references in the HudVideo.
		 */
		cleanup: function() {
			this._super();
			this.video = null;
			this.urls = [];
		},
		
		/**
		 * Get the Octane structure for the HudVideo.
	     *
	     * @return {Object} the Octane structure representing the HudVideo
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				octane.props.push({
					name: 'addVideoUrl',
					arg: [urlObj.url, urlObj.type]
				});
			}
			
			return octane;
		},
		
		/**
		 * Calculate the bounds of the video.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			this.top = this.y;
			this.bottom = this.top + this.height;
			this.left = this.x;
			this.right = this.left + this.width;
		},
		
		/**
		 * Draw the video.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			hemi.hud.hudMgr.createVideoOverlay(this.video, this.config, this.x,
				this.y, this.width, this.height);
		},
		
		/**
		 * Remove the given URL as a source for the video file to load.
		 * 
		 * @param {string} url the URL to remove
		 */
		removeVideoUrl: function(url) {
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				if (urlObj.url === url) {
					this.video.removeChild(urlObj.node);
					this.urls.splice(i, 1);
					break;
				}
			}
		},
		
		/**
		 * Set the height for the video to be displayed at.
		 * 
		 * @param {number} height the height to set for the video
		 */
		setHeight: function(height) {
			this.height = height;
			if (this.video !== null) {
				this.video.setAttribute('height', '' + height);
			}
		},
		
		/**
		 * Set the width for the video to be displayed at.
		 * 
		 * @param {number} width the width to set for the video
		 */
		setWidth: function(width) {
			this.width = width;
			if (this.video !== null) {
				this.video.setAttribute('width', '' + width);
			}
		}
	});

	hemi.hud.HudVideo.prototype.msgSent =
		hemi.hud.HudVideo.prototype.msgSent.concat([hemi.msg.load]);
	
	/**
	 * @class A HudPage contains other HudElements and display options for
	 * drawing a single page on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudPage = hemi.hud.HudElement.extend({
		init: function() {
			this._super();
			
			/**
			 * Flag indicating if a background rectangle should be drawn for the
			 * HudPage.
			 * @type boolean
			 * @default true
			 */
			this.drawBackground = true;
			
			/**
			 * The number of pixels to add as padding around the bounds of the
			 * HudPage's elements when drawing the background rectangle.
			 * @type number
			 * @default 5
			 */
			this.margin = 5;
			
			this.elements = [];
			this.auto = true;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.HudPage',
		
		/**
		 * Send a cleanup Message and remove all references in the HudPage.
		 */
		cleanup: function() {
			this._super();
			
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				this.elements[ndx].cleanup();
			}
			
			this.elements = [];
		},
		
		/**
		 * Get the Octane structure for the HudPage.
	     *
	     * @return {Object} the Octane structure representing the HudPage
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'auto',
				val: this.auto
			});
			octane.props.push({
				name: 'drawBackground',
				val: this.drawBackground
			});
			octane.props.push({
				name: 'margin',
				val: this.margin
			});
			
			var elemsEntry = {
				name: 'elements',
				id: []
			};
			
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				elemsEntry.id.push(this.elements[ndx].getId());
			}
			
			octane.props.push(elemsEntry);
			
			return octane;
		},
		
		/**
		 * Automatically set the size of the HudPage to contain all of its
		 * HudElements.
		 */
		autosize: function() {
			this.auto = true;
		},
		
		/**
		 * Calculate the bounds of the HudElements of the HudPage.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			var ndx, len = this.elements.length;
			
			if (len <= 0) {
				this.top = 0;
				this.bottom = 0;
				this.left = 0;
				this.right = 0;
				return;
			}
			
			for (ndx = 0; ndx < len; ndx++) {
				this.elements[ndx].calculateBounds();
			}
			
			if (this.auto) {
				var element = this.elements[0];
				this.top = element.top;
				this.bottom = element.bottom;
				this.left = element.left;
				this.right = element.right;
				
				for (ndx = 1; ndx < len; ndx++) {
					element = this.elements[ndx];
					
					if (element.top < this.top) {
						this.top = element.top;
					}
					if (element.bottom > this.bottom) {
						this.bottom = element.bottom;
					}
					if (element.left < this.left) {
						this.left = element.left;
					}
					if (element.right > this.right) {
						this.right = element.right;
					}
				}
				
				this.top -= this.margin;
				this.bottom += this.margin;
				this.left -= this.margin;
				this.right += this.margin;
			}
		},
		
		/**
		 * Draw the background (if any) and HudElements of the HudPage.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			this.calculateBounds();
			
			if (this.drawBackground) {				
				hemi.hud.hudMgr.createRectangleOverlay(this, this.config);
			}
			
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				this.elements[ndx].draw();
			}
		},
		
		/**
		 * Add the given HudElement to the HudPage for displaying.
		 * 
		 * @param {hemi.hud.HudElement} element element to add
		 */
		addElement: function(element) {
			var ndx = this.elements.indexOf(element);
			
			if (ndx == -1) {
				this.elements.push(element);
			}
		},
		
		/**
		 * Remove all HudElements from the HudPage.
		 */
		clearElements: function() {
			this.elements = [];
		},
		
		/**
		 * Remove the specified HudElement from the HudPage.
		 * 
		 * @param {hemi.hud.HudElement} element element to remove
		 * @return {hemi.hud.HudElement} the removed element or null
		 */
		removeElement: function(element) {
        	var found = null;
			var ndx = this.elements.indexOf(element);
			
			if (ndx != -1) {
				var spliced = this.elements.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},
		
		/**
		 * Check if the given Event occurred within the bounds of any of the
		 * HudElements of the HudPage. If it did, pass the Event to that
		 * HudElement. If not, call the HudPage's mouse down handler function
		 * (if one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     the HudPage, otherwise false
		 */
		onMouseDown: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected || !this.auto) {
				var caught = false;
				var len = this.elements.length;
				
				for (var ndx = 0; ndx < len && !caught; ndx++) {
					caught = this.elements[ndx].onMouseDown(event);
				}
				
				if (intersected && !caught && this.mouseDown) {
					this.mouseDown(event);
				}
			}
			
			return intersected;
		},
		
		/**
		 * Pass the given Event to all of the HudPage's HudElements. If the
		 * HudPage's mouse move handler function is set, pass it the Event and
		 * if it occurred within the bounds of the HudPage.
		 * 
		 * @param {o3d.Event} event the event that occurred
		 */
		onMouseMove: function(event) {
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				this.elements[ndx].onMouseMove(event);
			}
			
			if (this.mouseMove) {
				var intersected = this.checkEvent(event);
				this.mouseMove(event, intersected);
			}
		},
		
		/**
		 * Check if the given Event occurred within the bounds of any of the
		 * HudElements of the HudPage. If it did, pass the Event to that
		 * HudElement. If not, call the HudPage's mouse up handler function (if
		 * one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     this HudPage, otherwise false
		 */
		onMouseUp: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected || !this.auto) {
				var caught = false;
				var len = this.elements.length;
				
				for (var ndx = 0; ndx < len && !caught; ndx++) {
					caught = this.elements[ndx].onMouseUp(event);
				}
				
				if (intersected && !caught && this.mouseUp) {
					this.mouseUp(event);
				}
			}
			
			return intersected;
		},
		
		/**
		 * Manually set the size of the HudPage. This will prevent it from
		 * autosizing itself to fit all of the HudElements added to it.
		 * 
		 * @param {number} top the y coordinate of the top
		 * @param {number} bottom the y coordinate of the bottom
		 * @param {number} left the x coordinate of the left
		 * @param {number} right the x coordinate of the right
		 */
		setSize: function(top, bottom, left, right) {
			this.top = top;
			this.bottom = bottom;
			this.left = left;
			this.right = right;
			this.auto = false;
		}
	});
	
	/**
	 * @class A HudDisplay contains one or more HudPages to display
	 * sequentially.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.HudDisplay = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			this.visible = false;
			this.pages = [];
			this.currentPage = 0;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
        citizenType: 'hemi.hud.HudDisplay',
		
		/**
		 * Send a cleanup Message and remove all references in the HudDisplay.
		 */
		cleanup: function() {
			this._super();
			
			for (var ndx = 0, len = this.pages.length; ndx < len; ndx++) {
				this.pages[ndx].cleanup();
			}
			
			this.pages = [];
		},
		
		/**
		 * Get the Octane structure for the HudDisplay.
	     *
	     * @return {Object} the Octane structure representing the HudDisplay
		 */
		toOctane: function() {
			var octane = this._super();
			
			var pagesEntry = {
				name: 'pages',
				id: []
			};
			
			for (var ndx = 0, len = this.pages.length; ndx < len; ndx++) {
				pagesEntry.id.push(this.pages[ndx].getId());
			}
			
			octane.props.push(pagesEntry);
			
			return octane;
		},
		
		/**
		 * Check to see if the HudDisplay is currently visible.
		 * 
		 * @return {boolean} true if the HudDisplay is currently being displayed
		 */
		isVisible: function() {
			return this.visible;
		},
		
		/**
		 * Add the given HudPage to the HudDisplay.
		 * 
		 * @param {hemi.hud.HudPage} page page to add
		 */
		addPage: function(page) {
			var ndx = this.pages.indexOf(page);
			
			if (ndx == -1) {
				this.pages.push(page);
			}
		},
		
		/**
		 * Remove the specified HudPage from the HudDisplay.
		 * 
		 * @param {hemi.hud.HudPage} page page to remove
		 * @return {hemi.hud.HudPage} the removed page or null
		 */
		removePage: function(page) {
        	var found = null;
			var ndx = this.pages.indexOf(page);
			
			if (ndx != -1) {
				if (this.visible && ndx === this.currentPage) {
					if (ndx !== 0) {
						this.previousPage();
					} else if (this.pages.length > 1) {
						this.nextPage();
					} else  {
						this.hide();
					}
				}
				
				var spliced = this.pages.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},
		
		/**
		 * Remove all HudPages from the HudDisplay.
		 */
		clearPages: function() {
			if (this.visible) {
				this.hide();
			}
			
			this.pages = [];
		},
		
		/**
		 * Get the currently displayed HudPage.
		 * 
		 * @return {hemi.hud.HudPage} currently displayed page
		 */
		getCurrentPage: function() {
			var page = null;
			
			if (this.currentPage < this.pages.length) {
				page = this.pages[this.currentPage];
			}
			
			return page;
		},
		
		/**
		 * Get the number of HudPages in the HudDisplay.
		 * 
		 * @return {number} the number of HudPages
		 */
		getNumberOfPages: function() {
			return this.pages.length;
		},
		
		/**
		 * Display the next HudPage in the HudDisplay.
		 */
		nextPage: function() {
			var numPages = this.pages.length;
			this.currentPage++;
			
			if (this.currentPage >= numPages) {
				this.currentPage = numPages - 1;
			} else {
				this.showPage();
			}
		},
		
		/**
		 * Display the previous HudPage in the HudDisplay.
		 */
		previousPage: function() {
			this.currentPage--;
			
			if (this.currentPage < 0) {
				this.currentPage = 0;
			} else {
				this.showPage();
			}
		},
		
		/**
		 * Show the first HudPage of the HudDisplay and bind the mouse handlers
		 * for interaction.
		 */
		show: function() {
			if (!this.visible) {
				this.visible = true;
				this.showPage();
				hemi.input.addMouseDownListener(this);
				hemi.input.addMouseUpListener(this);
				hemi.input.addMouseMoveListener(this);
			}
		},

		/**
		 * Show the current page of the HudDisplay and add paging info if
		 * specified.
		 */
		showPage: function() {
			hemi.hud.hudMgr.clearDisplay();
			var page = this.getCurrentPage();
			page.draw();

			this.send(hemi.msg.visible,
				{
					page: this.currentPage + 1
				});
		},

		/**
		 * Hide the HudDisplay and unregister its key and mouse handlers.
		 */
		hide: function() {
			if (this.visible) {
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				hemi.input.removeMouseDownListener(this);
				hemi.hud.hudMgr.clearDisplay();
				this.visible = false;
				this.currentPage = 0;
				
				this.send(hemi.msg.visible,
					{
						page: 0
					});
			}
		},

		/**
		 * Pass the given mouse down Event to the currently displayed HudPage
		 * (if there is one). If the Event does not intersect it, pass it to
		 * the HudPagingDisplay (if there is one).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     a HudPage or HudPagingDisplay, otherwise false
		 */
		onMouseDown: function(event) {
			var page = this.getCurrentPage();
			var intersected = false;
			
			if (page) {
				intersected = page.onMouseDown(event);
			}
			
			return intersected;
		},
		
		/**
		 * Pass the given mouse move Event to the currently displayed HudPage
		 * (if there is one) and the HudPagingDisplay (if there is one).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 */
		onMouseMove: function(event) {
			var page = this.getCurrentPage();
			
			if (page) {
				page.onMouseMove(event);
			}
		},
		
		/**
		 * Pass the given mouse up Event to the currently displayed HudPage
		 * (if there is one). If the Event does not intersect it, pass it to
		 * the HudPagingDisplay (if there is one).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     a HudPage or HudPagingDisplay, otherwise false
		 */
		onMouseUp: function(event) {
			var page = this.getCurrentPage();
			var intersected = false;
			
			if (page) {
				intersected = page.onMouseUp(event);
			}
			
			return intersected;
		}
	});
	
	hemi.hud.HudDisplay.prototype.msgSent =
		hemi.hud.HudDisplay.prototype.msgSent.concat([hemi.msg.visible]);
	
	/**
	 * @class A HudManager creates the appropriate view components for
	 * rendering a HUD.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.HudManager = function() {
		var o3El = document.getElementById('o3d'),
			o3Can = o3El.firstElementChild,
			hudCan = document.createElement('canvas'),
			style = hudCan.style;
		
		this.videos = [];
		
		style.left = o3Can.offsetLeft + 'px';
		style.position = 'absolute';
		style.top = o3Can.offsetTop + 'px';
		style.zIndex = '10';
		
		hudCan.height = o3Can.height;
		hudCan.width = o3Can.width;
		
		o3El.appendChild(hudCan);
		this.canvas = hudCan.getContext('2d');
		// In our coordinate system, y indicates the top of the first line
		// of text, so set the canvas baseline to match.
		this.canvas.textBaseline = 'top';
		// Since the HUD canvas obscures the GL canvas, pass mouse events
		// through to Hemi.
		this.wheelHandler = o3d.Client.wrapEventCallback_(hemi.input.scroll, true),
		this.downHandler = o3d.Client.wrapEventCallback_(hemi.input.mouseDown, false),
		this.moveHandler = o3d.Client.wrapEventCallback_(hemi.input.mouseMove, false),
		this.upHandler = o3d.Client.wrapEventCallback_(hemi.input.mouseUp, false);
		
		hudCan.addEventListener('DOMMouseScroll', this.wheelHandler, true);
		hudCan.addEventListener('mousewheel', this.wheelHandler, true);
		hudCan.addEventListener('mousedown', this.downHandler, true);
		hudCan.addEventListener('mousemove', this.moveHandler, true);
		hudCan.addEventListener('mouseup', this.upHandler, true);
		
		this.canvasElem = hudCan;
		hemi.view.addRenderListener(this);
	};
	
	hemi.hud.HudManager.prototype = {
		/**
		 * Set the painting properties for the HUD canvas.
		 *
		 * @param {Object} options the options for painting.  Valid options are
		 * <ul>
		 * <li>color - the color to paint with. This is an array in RGBA
		 * format</li>
		 * <li>shader - the shader to apply.</li>
		 * <li>textAlign - the alignment of the text. Can be 'center', 'left',
		 * 'right'</li>
		 * <li>textSize - the size of the text to draw.</li>
		 * <li>textStyle - the style of the text. Can be 'normal', 'bold',
		 * 'italic', 'bold italic'</li>
		 * <li>textTypeface - the type face of the text.  e.g.: 'arial'</li>
		 * </ul>
		 */
		setPaintProperties: function(options) {
			var font;
			
			if (options.color != null) {
				this.canvas.fillStyle = getRgba(options.color);
			}
			if (options.outline != null) {
				this.canvas.strokeStyle = getRgba(options.outline);
				// If there is an outline, cancel the shadow.
				this.canvas.shadowColor = 'rgba(0,0,0,0)';
			} else if (options.shadow != null) {
				var shad = options.shadow;
				this.canvas.shadowBlur = shad.radius;
				this.canvas.shadowColor = getRgba(shad.color);
				this.canvas.shadowOffsetX = shad.offsetX;
				this.canvas.shadowOffsetY = shad.offsetY;
			} else {
				this.canvas.shadowColor = 'rgba(0,0,0,0)';
			}
			if (options.textAlign != null) {
				this.canvas.textAlign = options.textAlign;
			}
			if (options.textStyle != null) {
				font = options.textStyle + ' ';
			} else {
				font = 'bold ';
			}
			if (options.textSize != null) {
				font += options.textSize + 'px ';
			} else {
				font += '12px ';
			}
			if (options.textTypeface != null) {
				font += '"' + options.textTypeface + '"';
			} else {
				font += 'helvetica';
			}
			if (font != null) {
				this.canvas.font = font;
			}
		},
		
		/**
		 * Create a rectangular overlay from the given HudElement.
		 *
		 * @param {hemi.hud.HudElement} element element with a bounding box to
		 *     display
		 * @param {Object} boxConfig unique configuration options for the
		 *     rectangular overlay
		 */
		createRectangleOverlay: function(element, boxConfig) {
			var config = hemi.utils.join({}, hemi.hud.theme.page, boxConfig);
			this.canvas.save();
			this.setPaintProperties(config);
			
			if (config.curve > 0) {
				var curve = config.curve <= 1 ? config.curve / 2.0 : 0.5;
				this.drawRoundRect(element, curve, true);
				
				if (config.outline != null) {
					this.drawRoundRect(element, curve, false);
				}
			} else {
				var x = element.left,
					y = element.top,
					width = element.right - x,
					height = element.bottom - y;
				
				this.canvas.fillRect(x, y, width, height);
				
				if (config.outline != null) {
					this.canvas.strokeRect(x, y, width, height);
				}
			}
			
			this.canvas.restore();
		},
		
		/**
		 * Create a text overlay.
		 *
		 * @param {string} text the text display
		 * @param {Object} textConfig unique configuration options for the text
		 *    overlay
		 * @param {number} x x coordinate to draw the text at
		 * @param {number} y y coordinate to draw the text at
		 */
		createTextOverlay: function(text, textConfig, x, y) {
			var config = hemi.utils.join({}, hemi.hud.theme.text, textConfig),
				height = config.textSize,
				outline = config.outline != null;
			
			this.canvas.save();
			this.setPaintProperties(config);
			
			for (var ndx = 0, len = text.length; ndx < len; ndx++) {
				var line = text[ndx];
				this.canvas.fillText(line, x, y);
				
				if (outline) {
					this.canvas.strokeText(line, x, y);
				}
				
				y += height + config.lineMargin;
			}
			
			this.canvas.restore();
		},
		
		/**
		 * Create an image overlay.
		 *
		 * @param {Image} image the image to display
		 * @param {Object} imgConfig unique configuration options for the image
		 *    overlay
		 * @param {number} x x coordinate to draw the image at
		 * @param {number} y y coordinate to draw the image at
		 * @param {number} srcX optional x coordinate to pull from source image
		 * @param {number} srcY optional y coordinate to pull from source image
		 * @param {number} width optional width of destination image
		 * @param {number} height optional height of destination image
		 */
		createImageOverlay: function(image, imgConfig, x, y, srcX, srcY, width, height) {
			var config = hemi.utils.join({}, hemi.hud.theme.image, imgConfig);
			this.canvas.save();
			this.setPaintProperties(config);
			
			if (srcX != null && srcY != null && width != null && height != null) {
				this.canvas.drawImage(image, srcX, srcY, width, height, x, y,
					width, height);
			} else {
				this.canvas.drawImage(image, x, y);
			}
			
			this.canvas.restore();
		},
		
		/**
		 * Create a video overlay.
		 *
		 * @param {Video} video the video to display
		 * @param {Object} vidConfig unique configuration options for the video
		 *    overlay
		 * @param {number} x x coordinate to draw the video at
		 * @param {number} y y coordinate to draw the video at
		 * @param {number} width optional width of video
		 * @param {number} height optional height of video
		 */
		createVideoOverlay: function(video, vidConfig, x, y, width, height) {
			var config = hemi.utils.join({}, hemi.hud.theme.video, vidConfig);
			
			this.videos.push({
				video: video,
				config: config,
				x: x,
				y: y,
				width: width || video.videoWidth,
				height: height || video.videoHeight
			});
			video.play();
		},
		
		/**
		 * Clear the current overlays from the HUD.
		 */
		clearDisplay: function() {
			var can = this.canvas.canvas,
				vids = this.videos;
			
			this.videos = [];
			
			for (var i = 0, il = vids.length; i < il; i++) {
				vids[i].video.pause();
			}
			
			this.canvas.clearRect(0, 0, can.width, can.height);
			this.canvas.beginPath();
		},
		
		/**
		 * Calculate text wrapping and format the given string.
		 * 
		 * @param {string} text the text to display
		 * @param {number} width the maximum line width before wrapping
		 * @param {Object} textOptions unique configuration options for the text
		 *    overlay
		 * @return {Object} wrapped text object
		 */
		doTextWrapping: function(text, width, textOptions) {
			var config = hemi.utils.join({}, hemi.hud.theme.text, textOptions),
				wrappedText;
			
			this.canvas.save();
			this.setPaintProperties(config);
			
			if (config.strictWrapping) {
				wrappedText = hemi.utils.wrapTextStrict(text, width, this.canvas);
			} else {
				var metric = this.canvas.measureText(text),
					charWidth = metric.width / text.length;
				wrappedText = hemi.utils.wrapText(text, width, charWidth);
			}
			
			var height = wrappedText.length * (config.textSize + config.lineMargin),
				longestWidth = 0;
			
			for (var ndx = 0, len = wrappedText.length; ndx < len; ndx++) {
				var metric = this.canvas.measureText(wrappedText[ndx]);
				
				if (longestWidth < metric.width) {
					longestWidth = metric.width;
				}
			}
			
			this.canvas.restore();
			
			return {
				text: wrappedText,
				height: height,
				width: longestWidth
			};
		},
		
		/**
		 * Draw a rectangular overlay that has rounded corners from the given
		 * HudElement.
		 *
		 * @param {hemi.hud.HudElement} element element with a bounding box to
		 *     create the rectangle from
		 * @param {number} curveFactor amount of curving on the corners (between
		 *     0 and 0.5)
		 * @param {boolean} fill flag indicating whether to fill or stroke
		 */
		drawRoundRect: function(element, curveFactor, fill) {
			var hMath = hemi.core.math,
				lt = element.left,
				rt = element.right,
				tp = element.top,
				bm = element.bottom,
				wide = rt - lt,
				high = bm - tp,
				inc = high > wide ? wide * curveFactor : high * curveFactor,
				// Positions on a clock in radians :)
				hour12 = hMath.degToRad(270),
				hour3 = 0,
				hour6 = hMath.degToRad(90),
				hour9 = hMath.degToRad(180);
			
			this.canvas.beginPath();
			this.canvas.moveTo(lt, tp + inc);
			this.canvas.lineTo(lt, bm - inc);
			this.canvas.arc(lt + inc, bm - inc, inc, hour9, hour6, true);
			this.canvas.lineTo(rt - inc, bm);
			this.canvas.arc(rt - inc, bm - inc, inc, hour6, hour3, true);
			this.canvas.lineTo(rt, tp + inc);
			this.canvas.arc(rt - inc, tp + inc, inc, hour3, hour12, true);
			this.canvas.lineTo(lt + inc, tp);
			this.canvas.arc(lt + inc, tp + inc, inc, hour12, hour9, true);
			this.canvas.closePath();
			
			if (fill) {
				this.canvas.fill();
			} else {
				this.canvas.stroke();
			}
		},
		
		/**
		 * Copy the current image from any video elements onto the canvas on
		 * each render.
		 * 
		 * @param {o3d.RenderEvent} renderEvent event containing render info
		 */
		onRender: function(renderEvent) {
			var vids = this.videos,
				can = this.canvas,
				vid;
			
			for (var i = 0, il = vids.length; i < il; i++) {
				vid = vids[i];
				this.canvas.save();
				this.setPaintProperties(vid.config);
				can.drawImage(vid.video, vid.x, vid.y, vid.width, vid.height);
				this.canvas.restore();
			}
		}
	};
	
	/*
	 * Get the CSS RGBA string for the given color array in 0-1 format.
	 * @param {number[4]} col color array
	 * @return {string} the equivalent RGBA string
	 */
	var getRgba = function(col) {
		return 'rgba(' + Math.round(col[0]*255) + ',' + Math.round(col[1]*255) +
			',' + Math.round(col[2]*255) + ',' + col[3] + ')';
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
 * @fileoverview Manips are objects that allow shapes in a 3d scene to
 *		be clicked on and dragged around. These shapes are constrained
 *		to a 2d plane, as defined by the programmer.
 */

var hemi = (function(hemi) {
	/**
	 * @namespace A module for defining draggable objects.
	 */
	hemi.manip = hemi.manip || {};

	hemi.manip.Plane = {
		XY : 'xy',
		XZ : 'xz',
		YZ : 'yz',
		
		get: function(val) {
			var plane = null;
			
			if (hemi.utils.compareArrays(val, [[0,0,0],[1,0,0],[0,1,0]])) {
				plane = this.XY;
			} else if (hemi.utils.compareArrays(val, [[0,0,0],[1,0,0],[0,0,1]])) {
				plane = this.XZ;
			} else if (hemi.utils.compareArrays(val, [[0,0,0],[0,0,1],[0,1,0]])) {
				plane = this.YZ;
			}
			
			return plane;
		}
	};
	
	hemi.manip.Axis = {
		X : 'x',
		Y : 'y',
		Z : 'z'
	};

	/**
	 * @class A Draggable allows a 3d object to be dragged around the scene
	 * with the mouse, constrained to a defined 2d plane.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {number[3][3]} opt_plane Array of 3 xyz points defining a plane
	 * @param {number[4]} opt_limits An array containing 
	 *	   [min on u, max on u, min on v, max on v]
	 * @param {number[2]} opt_startUV Draggable's starting uv coordinate, if
	 *		not [0,0]
	 */
	hemi.manip.Draggable = hemi.world.Citizen.extend({
		init: function(opt_plane, opt_limits, opt_startUV) {
			this._super();
			
			this.activeTransform = null;
			this.dragUV = null;
			this.enabled = false;
			this.local = false;
			this.msgHandler = null;
			this.plane = null;
			this.transformObjs = [];
			this.umin = null;
			this.umax = null;
			this.uv = opt_startUV == null ? [0,0] : opt_startUV;
			this.vmin = null;
			this.vmax = null;
			
			if (opt_plane != null) {
				this.setPlane(opt_plane);
			}
			if (opt_limits != null) {
				this.setLimits(opt_limits);
			}
			
			this.enable();
		},

		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
		citizenType: 'hemi.manip.Draggable',
		
		/**
		 * Send a cleanup Message and remove all references in the Draggable.
		 */
		cleanup: function() {
			this.disable();
			this._super();
			this.clearTransforms();
			this.msgHandler = null;
		},
		
		/**
		 * Get the Octane structure for the Draggable.
	     *
	     * @return {Object} the Octane structure representing the Draggable
		 */
		toOctane: function(){
			var octane = this._super(),
				valNames = ['local', 'plane', 'umin', 'umax', 'vmin', 'vmax'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			return octane;
		},

		/**
		 * Add a Transform to the list of draggable Transforms.
		 *
		 * @param {o3d.Transform} transform the transform to add
		 */
		addTransform: function(transform) {
			hemi.world.tranReg.register(transform, this);
			var param = transform.getParam('ownerId'),
				obj = {},
				owner = null;
			
			if (param !== null) {
				owner = hemi.world.getCitizenById(param.value);
			}
			
			if (hemi.utils.isAnimated(transform)) {
				obj.transform = hemi.utils.fosterTransform(transform);
				obj.foster = true;
			} else {
				obj.transform = transform;
				obj.foster = false;
			}
			
			if (owner) {
				var that = this;
				obj.owner = owner;
				obj.msg = owner.subscribe(hemi.msg.cleanup, function(msg) {
					that.removeTransforms(msg.src);
				});
			}
			
			this.transformObjs.push(obj);
		},

		/**
		 * Add the given UV delta to the current UV coordinates and clamp the
		 * results.
		 *
		 * @param {number[2]} delta the uv change to add before clamping
		 * @return {number[2]} the actual change in uv after clamping
		 */
		clamp : function(delta) {
			var u = this.uv[0] + delta[0],
				v = this.uv[1] + delta[1];
			
			if (this.umin != null && u < this.umin) {
				u = this.umin;
			}
			if (this.umax != null && u > this.umax) {
				u = this.umax;
			}
			if (this.vmin != null && v < this.vmin) {
				v = this.vmin;
			}
			if (this.vmax != null && v > this.vmax) {
				v = this.vmax;
			}
			
			delta = [u - this.uv[0], v - this.uv[1]];
			this.uv = [u, v];
			
			return delta;
		},
		
		/**
		 * Remove any previously set limits from the draggable.
		 */
		clearLimits: function() {
			this.umin = null;
			this.umax = null;
			this.vmin = null;
			this.vmax = null;
		},
		
		/**
		 * Clear the list of draggable Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				removeManipTransforms.call(this, this.transformObjs[0]);
			}
		},

		/**
		 * Check if a given Transform is contained within the children of the
		 * Transforms acted upon by this Draggable.
		 *
		 * @param {o3d.Transform} transform transform to check against
		 * @return {boolean} true if the Transform is found
		 */
		containsTransform : function(transform) {
			for (var i = 0; i < this.transformObjs.length; i++) {
				var children = this.transformObjs[i].transform.getTransformsInTree();
				for (var j = 0; j < children.length; j++) {
					if (transform.clientId === children[j].clientId) {
						return true;
					}
				}
			}
			return false;
		},
		
		/**
		 * Disable mouse interaction for the Draggable. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Draggable. 
		 */
		enable: function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		
		/**
		 * Get the two dimensional plane that the Draggable will translate its
		 * active Transform along.
		 * 
		 * @return {number[3][3]} the current drag plane defined as 3 XYZ points
		 */
		getPlane: function() {
			if (this.activeTransform === null) {
				return null;
			}
			
			var plane;
			
			if (this.local) {
				var u = hemi.utils;
				plane = [u.pointAsWorld(this.activeTransform, this.plane[0]),
						 u.pointAsWorld(this.activeTransform, this.plane[1]),
						 u.pointAsWorld(this.activeTransform, this.plane[2])];
			} else {
				var hMath = hemi.core.math,
					wM = this.activeTransform.getUpdatedWorldMatrix(),
					translation = wM[3].slice(0,3);
				
				plane = [hMath.addVector(this.plane[0], translation),
						 hMath.addVector(this.plane[1], translation),
						 hMath.addVector(this.plane[2], translation)];
			}
			
			return plane;
		},
		
		/**
		 * Get the Transforms that the Draggable currently contains.
		 * 
		 * @return {o3d.Transform[]} array of Transforms
		 */
		getTransforms: function() {
			var trans = [];
			
			for (var i = 0, len = this.transformObjs.length; i < len; i++) {
				trans.push(this.transformObjs[i].transform);
			}
			
			return trans;
		},
		
		/**
		 * Convert the given screen coordinates into UV coordinates on the
		 * current dragging plane.
		 * 
		 * @param {number} x x screen coordinate
		 * @param {number} y y screen coordinate
		 * @return {number[2]} equivalent UV coordinates
		 */
		getUV: function(x,y) {
			var ray = hemi.core.picking.clientPositionToWorldRay(
					x,
					y,
					hemi.view.viewInfo.drawContext,
					hemi.core.client.width,
					hemi.core.client.height),
				plane = this.getPlane(),
				tuv = hemi.utils.intersect(ray, plane);
			
			return [tuv[1], tuv[2]];
		},

		/**
		 * Mouse movement event listener, calculates mouse point intersection 
		 * with this Draggable's plane, and then translates the dragging object 
		 * accordingly.
		 *
		 * @param {o3d.Event} event message describing how the mouse has moved
		 */
		onMouseMove : function(event) {
			if (this.dragUV === null) {
				return;
			}
			
			var uv = this.getUV(event.x, event.y),
				delta = [uv[0] - this.dragUV[0], uv[1] - this.dragUV[1]],
				plane = this.getPlane();
			
			delta = this.clamp(delta);
			
			var localDelta = hemi.utils.uvToXYZ(delta, plane),
				xyzOrigin = hemi.utils.uvToXYZ([0, 0], plane),
				xyzDelta = hemi.core.math.subVector(localDelta, xyzOrigin);
			
			for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
				var tran = this.transformObjs[ndx].transform;
				hemi.utils.worldTranslate(xyzDelta, tran);
			}
			
			this.send(hemi.msg.drag, { drag: xyzDelta });
		},

		/**
		 * Mouse-up event listener, stops dragging.
		 *
		 * @param {o3d.Event} event message describing the mouse behavior
		 */
		onMouseUp : function(event) {
			this.activeTransform = null;
			this.dragUV = null;
		},

		/**
		 * Pick event listener; checks in-scene intersections, and allows 
		 * dragging.
		 *
		 * @param {o3djs.picking.PickInfo} pickInfo pick event information that
		 *		contains information on the shape and transformation picked.
		 * @param {o3d.Event} mouseEvent message describing mouse behavior
		 */
		onPick : function(pickInfo, mouseEvent) {
			var pickTran = pickInfo.shapeInfo.parent.transform;
			
			for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
				if (checkTransform(this.transformObjs[ndx].transform, pickTran)) {
					this.activeTransform = pickTran;
					this.dragUV = this.getUV(mouseEvent.x, mouseEvent.y);
					break;
				}
			}
		},
		
		/**
		 * Receive the given Transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 */
		receiveTransform: function(transform) {
			this.addTransform(transform);
		},
		
		/**
		 * Remove Transforms belonging to the specified owner from the
		 * Draggable.
		 * 
		 * @param {hemi.world.Citizen} owner owner to remove Transforms for
		 */
		removeTransforms: function(owner) {
			for (var i = 0; i < this.transformObjs.length; ++i) {
				var obj = this.transformObjs[i];
				
				if (owner === obj.owner) {
					removeManipTransforms.call(this, obj);
					// Update index to reflect removed obj
					--i;
				}
			}
		},

		/**
		 * Set the relative uv limits in which this Draggable can move.
		 *
		 * @param {number[2][2]} coords min and max uv points on the current
		 *     plane
		 */
		setLimits : function(coords) {
			this.umin = coords[0][0];
			this.umax = coords[1][0];
			this.vmin = coords[0][1];
			this.vmax = coords[1][1];
		},

		/**
		 * Set the 2d plane on which this Draggable is bound.
		 *
		 * @param {number[3][3]} plane array of three XYZ coordinates defining a
		 *     plane
		 */
		setPlane : function(plane) {
			switch (plane) {
				case (hemi.manip.Plane.XY):
					this.plane = [[0,0,0],[1,0,0],[0,1,0]];
					break;
				case (hemi.manip.Plane.XZ):
					this.plane = [[0,0,0],[1,0,0],[0,0,1]];
					break;
				case (hemi.manip.Plane.YZ):
					this.plane = [[0,0,0],[0,0,1],[0,1,0]];
					break;
				default:
					this.plane = plane;
			}
		},
		
		/**
		 * Set the Draggable to operate in the local space of the transform it
		 * is translating.
		 */
		setToLocal: function() {
			this.local = true;
		},
		
		/**
		 * Set the Draggable to operate in world space.
		 */
		setToWorld: function() {
			this.local = false;
		}
	});

	/**
	 * @class A Turnable allows a Transform to be turned about an axis by the
	 *     user clicking and dragging with the mouse.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {hemi.manip.Axis} opt_axis axis to rotate about
	 * @param {number[2]} opt_limits minimum and maximum angle limits (in radians)
	 * @param {number} opt_startAngle starting angle (in radians, default is 0)
	 */
	hemi.manip.Turnable = hemi.world.Citizen.extend({
		init: function(opt_axis, opt_limits, opt_startAngle) {
			this._super();
			
			this.angle = opt_startAngle == null ? 0 : opt_startAngle;
			this.axis = null;
			this.activeTransform = null;
			this.dragAngle = null;
			this.enabled = false;
			this.local = false;
			this.min = null;
			this.max = null;
			this.msgHandler = null;
			this.plane = null;
			this.transformObjs = [];
			
			if (opt_axis != null) {
				this.setAxis(opt_axis);
			}
			if (opt_limits != null) {
				this.setLimits(opt_limits);
			}
			
			this.enable();
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @string
		 */
		citizenType: 'hemi.manip.Turnable',
		
		/**
		 * Send a cleanup Message and remove all references in the Turnable.
		 */
		cleanup: function() {
			this.disable();
			this._super();
			this.clearTransforms();
			this.msgHandler = null;
		},
		
		/**
		 * Get the Octane structure for the Turnable.
	     *
	     * @return {Object} the Octane structure representing the Turnable
		 */
		toOctane: function(){
			var octane = this._super(),
				valNames = ['min', 'max'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			octane.props.push({
				name: 'setAxis',
				arg: [this.axis]
			});
			
			return octane;
		},
		
		/**
		 * Add a Transform to this Turnable object.
		 * 
		 * @param {o3d.Transform} transform the transform that will turn about
		 *     its origin when clicked and dragged
		 */
		addTransform : function(transform) {
			hemi.world.tranReg.register(transform, this);
			var param = transform.getParam('ownerId'),
				obj = {},
				owner = null;
			
			if (param !== null) {
				owner = hemi.world.getCitizenById(param.value);
			}
			
			if (hemi.utils.isAnimated(transform)) {
				obj.transform = hemi.utils.fosterTransform(transform);
				obj.foster = true;
			} else {
				obj.transform = transform;
				obj.foster = false;
			}
			
			if (owner) {
				var that = this;
				obj.owner = owner;
				obj.msg = owner.subscribe(hemi.msg.cleanup, function(msg) {
					that.removeTransforms(msg.src);
				});
			}
			
			this.activeTransform = transform;
			this.transformObjs.push(obj);
		},
		
		/**
		 * Remove any previously set limits from the Turnable.
		 */
		clearLimits: function() {
			this.min = null;
			this.max = null;
		},
		
		/**
		 * Clear the list of Turnable Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				removeManipTransforms.call(this, this.transformObjs[0]);
			}
			
			this.activeTransform = null;
		},
		
		/**
		 * Check if this turnable object contains a transform within its children, and sets the
		 *		plane offset to match that transform if found.
		 * @param {o3d.transform} transform Transform to match against
		 */
		containsTransform : function(transform) {
			for (var i = 0; i < this.transformObjs.length; i++) {
				var family = this.transformObjs[i].transform.getTransformsInTree();
				for (var j = 0; j < family.length; j++) {
					if (family[j].clientId === transform.clientId) {
						return true;
					}
				}
			}
			return false;
		},
		
		/**
		 * Disable mouse interaction for the Turnable. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Turnable. 
		 */
		enable: function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		
		/**
		 * Get the relative angle of a mouse click's interception with the
		 * active plane to the origin of that plane.
		 * 
		 * @param {number} x screen x-position of the mouse click event
		 * @param {number} y screen y-position of the mouse click event
		 * @return {number} relative angle of mouse click position on the
		 *     Turnable's current active plane
		 */
		getAngle : function(x,y) {
			if (this.activeTransform === null) {
				return null;
			}
			
			var ray = hemi.core.picking.clientPositionToWorldRay(
					x,
					y,
					hemi.view.viewInfo.drawContext,
					hemi.core.client.width,
					hemi.core.client.height),
				plane;
			
			if (this.local) {
				var u = hemi.utils;
				plane = [u.pointAsWorld(this.activeTransform,this.plane[0]),
						 u.pointAsWorld(this.activeTransform,this.plane[1]),
						 u.pointAsWorld(this.activeTransform,this.plane[2])];
			} else {
				var hMath = hemi.core.math,
					wM = this.activeTransform.getUpdatedWorldMatrix(),
					translation = wM[3].slice(0,3);
				
				plane = [hMath.addVector(this.plane[0], translation),
						 hMath.addVector(this.plane[1], translation),
						 hMath.addVector(this.plane[2], translation)];
			}
			
			var tuv = hemi.utils.intersect(ray, plane);
			return Math.atan2(tuv[2],tuv[1]);
		},
		
		/**
		 * Get the Transforms that the Turnable currently contains.
		 * 
		 * @return {o3d.Transform[]} array of Transforms
		 */
		getTransforms: function() {
			var trans = [];		
			for (var i = 0, len = this.transformObjs.length; i < len; i++) {
				trans.push(this.transformObjs[i].transform);
			}
			return trans;
		},
		
		/**
		 * On mouse move, if the shape has been clicked and is being dragged, 
		 * calculate intersection points with the active plane and turn the
		 * Transform to match.
		 * 
		 * @param {o3d.Event} event message describing the mouse position, etc.
		 */
		onMouseMove : function(event) {
			if (this.dragAngle === null) {
				return;
			}
			
			var delta = this.getAngle(event.x,event.y) - this.dragAngle,
				axis;
			
			if (this.max != null && this.angle + delta >= this.max) {
				delta = this.max - this.angle;
			}
			if (this.min != null && this.angle + delta <= this.min) {
				delta = this.min - this.angle;
			}
			
			this.angle += delta;
			
			if (!this.local) {
				this.dragAngle += delta;
			}
			
			switch(this.axis) {
				case hemi.manip.Axis.X:
					axis = [-1,0,0];
					break;
				case hemi.manip.Axis.Y:
					axis = [0,-1,0];
					break;
				case hemi.manip.Axis.Z:
					axis = [0,0,1];
					break;
			}
			
			for (var i = 0; i < this.transformObjs.length; i++) {
				var tran = this.transformObjs[i].transform;
				
				if (this.local) {
					tran.axisRotate(axis, delta);
				} else {
					hemi.utils.worldRotate(axis, delta, tran);
				}
			}
		},
		
		/**
		 * On mouse up, deactivate turning.
		 * 
		 * @param {o3d.Event} event message describing mouse position, etc.
		 */
		onMouseUp : function(event) {
			this.dragAngle = null;
		},
		
		/**
		 * On a pick message, if it applies to this Turnable, set turning to
		 * true and calculate the relative angle.
		 * 
		 * @param {o3d.PickInfo} pickInfo information about the pick event
		 * @param {o3d.Event} event message describing mouse position, etc.
		 */
		onPick : function(pickInfo,event) {
			if (this.containsTransform(pickInfo.shapeInfo.parent.transform)) {
				this.activeTransform = pickInfo.shapeInfo.parent.transform;
				this.dragAngle = this.getAngle(event.x,event.y);
			}
		},
		
		/**
		 * Receive the given Transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the Transform
		 */
		receiveTransform: function(transform) {
			this.addTransform(transform);
		},
		
		/**
		 * Remove Transforms belonging to the specified owner from the
		 * Turnable.
		 * 
		 * @param {hemi.world.Citizen} owner owner to remove Transforms for
		 */
		removeTransforms: function(owner) {
			for (var i = 0; i < this.transformObjs.length; ++i) {
				var obj = this.transformObjs[i];
				
				if (owner === obj.owner) {
					removeManipTransforms.call(this, obj);
					// Update index to reflect removed obj
					--i;
				}
			}
		},
		
		/**
		 * Set the axis to which this Turnable is bound.
		 * 
		 * @param {hemi.manip.Axis} axis axis to rotate about - x, y, or z
		 */
		setAxis: function(axis) {
			this.axis = axis;
			
			switch(axis) {
				case hemi.manip.Axis.X:
					this.plane = [[0,0,0],[0,0,1],[0,1,0]];
					break;
				case hemi.manip.Axis.Y:
					this.plane = [[0,0,0],[1,0,0],[0,0,1]];
					break;
				case hemi.manip.Axis.Z:
					this.plane = [[0,0,0],[1,0,0],[0,1,0]];
					break;
			}
		},
		
		/**
		 * Set the limits to which this Turnable can rotate.
		 * 
		 * @param {number[2]} limits minimum and maximum angle limits (in radians)
		 */
		setLimits : function(limits) {
			if (limits[0] != null) {
				this.min = limits[0];
			} else {
				this.min = null;
			}
			
			if (limits[1] != null) {
				this.max = limits[1];
			} else {
				this.max = null;
			}
		},
		
		/**
		 * Set the Turnable to operate in the local space of the transform it is
		 * rotating.
		 */
		setToLocal: function() {
			this.local = true;
		},
		
		/**
		 * Set the Turnable to operate in world space.
		 */
		setToWorld: function() {
			this.local = false;
		}
		
	});
	
	hemi.manip.Scalable = hemi.world.Citizen.extend({
		init: function(axis) {
			this._super();
			this.activeTransform = null;
			this.axis = null;
			this.dragAxis = null;
			this.dragOrigin = null;
			this.local = false;
			this.scale = null;
			this.transformObjs = [];
			
			this.setAxis(axis);
			this.enable();
		},
		
		addTransform : function(transform) {
			hemi.world.tranReg.register(transform, this);
			var param = transform.getParam('ownerId'),
				obj = {},
				owner = null;
			
			if (param !== null) {
				owner = hemi.world.getCitizenById(param.value);
			}
			
			if (hemi.utils.isAnimated(transform)) {
				obj.transform = hemi.utils.fosterTransform(transform);
				obj.foster = true;
			} else {
				obj.transform = transform;
				obj.foster = false;
			}
			
			if (owner) {
				var that = this;
				obj.owner = owner;
				obj.msg = owner.subscribe(hemi.msg.cleanup, function(msg) {
					that.removeTransforms(msg.src);
				});
			}
			
			this.transformObjs.push(obj);
		},
		cleanup: function() {
			this.disable();
			this._super();
			this.clearTransforms();
			this.msgHandler = null;
		},
		/**
		 * Clear the list of scalable transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				removeManipTransforms.call(this, this.transformObjs[0]);
			}
		},
		containsTransform : function(transform) {
			for (var i = 0; i < this.transformObjs.length; i++) {
				var children = this.transformObjs[i].transform.getTransformsInTree();
				for (var j = 0; j < children.length; j++) {
					if (transform.clientId === children[j].clientId) {
						return true;
					}
				}
			}
			return false;
		},
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
		enable: function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		getScale: function(x, y) {
			var hMath = hemi.core.math,
				offset = [x - this.dragOrigin[0], y - this.dragOrigin[1]],
				scale = Math.abs(hemi.core.math.dot(this.dragAxis, offset));
			return scale;
		},
		onMouseMove : function(event) {
			if (this.dragAxis === null) {
				return;
			}
			
			var scale = this.getScale(event.x, event.y),
				f = scale/this.scale,
				axis = [
					this.axis[0] ? f : 1,
					this.axis[1] ? f : 1,
					this.axis[2] ? f : 1
				];
			
			for (i=0; i<this.transformObjs.length; i++) {
				var tran = this.transformObjs[i].transform;
				
				if (this.local) {
					tran.scale(axis);
				} else {
					hemi.utils.worldScale(axis, tran);
				}
			}
			
			this.scale = scale;
			
			this.send(hemi.msg.scale, { scale: scale });
		},
		onMouseUp : function() {
			this.dragAxis = null;
			this.dragOrigin = null;
			this.scale = null;
		},
		onPick : function(pickInfo,event) {
			if (this.containsTransform(pickInfo.shapeInfo.parent.transform)) {
				this.activeTransform = pickInfo.shapeInfo.parent.transform;
				var axis2d = this.xyPoint(this.axis);
				this.dragOrigin = this.xyPoint([0,0,0]);
				this.dragAxis = hemi.core.math.normalize(
					[axis2d[0]-this.dragOrigin[0], axis2d[1]-this.dragOrigin[1]]);
				this.scale = this.getScale(event.x, event.y);
			}
		},
		/**
		 * Remove Transforms belonging to the specified owner from the
		 * Scalable.
		 * 
		 * @param {hemi.world.Citizen} owner owner to remove Transforms for
		 */
		removeTransforms: function(owner) {
			for (var i = 0; i < this.transformObjs.length; ++i) {
				var obj = this.transformObjs[i];
				
				if (owner === obj.owner) {
					removeManipTransforms.call(this, obj);
					// Update index to reflect removed obj
					--i;
				}
			}
		},
		setAxis : function(axis) {
			switch(axis) {
				case hemi.manip.Axis.X:
					this.axis = [1,0,0];
					break;
				case hemi.manip.Axis.Y:
					this.axis = [0,1,0];
					break;
				case hemi.manip.Axis.Z:
					this.axis = [0,0,1];
					break;
				default:
					this.axis = [0,0,0];
			}
		},
		/**
		 * Set the Scalable to operate in the local space of the transform it is
		 * scaling.
		 */
		setToLocal: function() {
			this.local = true;
		},
		/**
		 * Set the Scalable to operate in world space.
		 */
		setToWorld: function() {
			this.local = false;
		},
		xyPoint : function(p) {
			if (this.activeTransform === null) {
				return null;
			}
			
			var u = hemi.utils,
				point;
			
			if (this.local) {
				point = u.pointAsWorld(this.activeTransform, p);
			} else {
				var wM = this.activeTransform.getUpdatedWorldMatrix(),
					translation = wM[3].slice(0,3);
				
				point = hemi.core.math.addVector(p, translation);
			}
			
			return u.worldToScreenFloat(point);
		}
	});
	
	hemi.manip.Draggable.prototype.msgSent =
		hemi.manip.Draggable.prototype.msgSent.concat([hemi.msg.drag]);
	
	hemi.manip.Scalable.prototype.msgSent =
		hemi.manip.Scalable.prototype.msgSent.concat([hemi.msg.scale]);

	///////////////////////////////////////////////////////////////////////////
	// Private functions
	///////////////////////////////////////////////////////////////////////////
	
	var removeManipTransforms = function(tranObj) {
		var tran;
		
		if (tranObj.foster) {
			tran = hemi.utils.unfosterTransform(tranObj.transform);
		} else {
			tran = tranObj.transform;
		}
		
		hemi.world.tranReg.unregister(tran, this);
		var ndx = this.transformObjs.indexOf(tranObj);
		
		if (ndx > -1) {
			this.transformObjs.splice(ndx, 1);
		}
		
		if (tranObj.owner && tranObj.msg) {
			tranObj.owner.unsubscribe(tranObj.msg, hemi.msg.cleanup);
		}
	};
	
	/*
	 * Check if the pickTransform is a child, grandchild, etc. of the transform.
	 * 
	 * @param {o3d.Transform} transform parent transform to check
	 * @param {o3d.Transform} pickTransform child transform to search for
	 * @return {boolean} true if the pickTransform is contained within the
	 *     transform
	 */
	function checkTransform(transform, pickTransform) {
		var found = (transform.clientId === pickTransform.clientId);

		if (!found) {
			var children = transform.children;
			
			for (var ndx = 0, len = children.length; ndx < len && !found; ndx++) {
				found = found || checkTransform(children[ndx], pickTransform);
			}
		}
		
		return found;
	}
	
	return hemi;
})(hemi || {});/* 
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
 * @fileoverview This describes the objects needed to build the hemi particle
 *		effects: Bezier curves, particles which can follow those curves, and
 *		systems to manage particles and emitters. 
 */

var hemi = (function(hemi) {
	/**
	 * @namespace A module for curves and particle systems.
	 */
	hemi.curve = hemi.curve || {};

	/**
	 * Enum for different curve types, described below.
	 * <ul><pre>
	 * <li>hemi.curve.CurveType.Linear
	 * <li>hemi.curve.CurveType.Bezier
	 * <li>hemi.curve.CurveType.CubicHermite
	 * <li>hemi.curve.CurveType.LinearNorm
	 * <li>hemi.curve.CurveType.Cardinal
	 * <li>hemi.curve.CurveType.Custom
	 * </ul></pre>
	 */
	hemi.curve.CurveType = {
		Linear : 0,
		Bezier : 1,
		CubicHermite : 2,
		LinearNorm : 3,
		Cardinal : 4,
		Custom : 5
	};
	
	/**
	 * Predefined values for common shapes.
	 * <ul><pre>
	 * <li>hemi.curve.ShapeType.CUBE
	 * <li>hemi.curve.ShapeType.SPHERE
	 * <li>hemi.curve.ShapeType.ARROW
	 * </ul></pre>
	 */
	hemi.curve.ShapeType = {
		CUBE : 'cube',
		SPHERE : 'sphere',
		ARROW : 'arrow'
	};
	
	/**
	 * @class A Box is defined by a minimum XYZ point and a maximum XYZ point.
	 * 
	 * @param {number[3]} opt_min minimum XYZ point
	 * @param {number[3]} opt_max maximum XYZ point
	 */
	hemi.curve.Box = function(opt_min, opt_max) {
		/**
		 * The minimum XYZ point
		 * @type number[3]
		 */
		this.min = opt_min || [];
		
		/**
		 * The maximum XYZ point
		 * @type number[3]
		 */
		this.max = opt_max || [];
	};
	
	/**
	 * @class A ColorKey contains a time key and a color value.
	 * 
	 * @param {number} key time value between 0 and 1
	 * @param {number[4]} color RGBA color value
	 */
	hemi.curve.ColorKey = function(key, color) {
		/**
		 * The time when the ColorKey is 100% of the Curve's color value.
		 * @type number
		 */
		this.key = key;
		
		/**
		 * The color value for Curve particles.
		 * @type number[4]
		 */
		this.value = color;
	};
	
	/**
	 * @class A ScaleKey contains a time key and a scale value.
	 * 
	 * @param {number} key time value between 0 and 1
	 * @param {number[3]} scale XYZ scale value
	 */
	hemi.curve.ScaleKey = function(key, scale) {
		/**
		 * The time when the ScaleKey is 100% of the Curve's scale value.
		 * @type number
		 */
		this.key = key;
		
		/**
		 * The scale value for Curve particles.
		 * @type number[3]
		 */
		this.value = scale;
	};

	/**
	 * Render a 3D representation of a curve.
	 *
	 * @param {number[3][]} points array of points (not waypoints)
	 * @param {Object} config configuration describing how the curve should look
	 */
	hemi.curve.drawCurve = function(points, config) {
		if (!this.dbgLineMat) {
			this.dbgLineMat = this.newMaterial(false);
			this.dbgLineMat.getParam('lightWorldPos').bind(hemi.world.camera.light.position);
		}
		
		var eShow = (config.edges == null) ? true : config.edges,
			eSize = config.edgeSize || 1,
			eColor = config.edgeColor || [0.5,0,0,1],
			jShow = (config.joints == null) ? true : config.joints,
			jSize = config.jointSize || 1,
			jColor = config.jointColor,
			crvTransform = this.pack.createObject('Transform');
		
		for (var i = 0; i < points.length; i++) {
			if(jShow) {
				var transform = this.pack.createObject('Transform'),
					joint = hemi.core.primitives.createSphere(this.pack,
						this.dbgLineMat, jSize, 20, 20);
				
				transform.parent = crvTransform;
				transform.addShape(joint);
				transform.translate(points[i]);
				
				if (jColor) {
					var param = transform.createParam('diffuse', 'o3d.ParamFloat4');
					param.value = jColor;
				}
			}
			if (eShow && i < (points.length - 1)) {
				var edgeTran = this.drawLine(points[i], points[i+1], eSize, eColor);
				edgeTran.parent = crvTransform;
			}
		}
		
		crvTransform.parent = hemi.core.client.root;
		this.dbgLineTransforms.push(crvTransform);
	};
	
	/**
	 * Draw a line connecting two points.
	 *
	 * @param {number[]} p0 The first point
	 * @param {number[]} p1 The second point
	 * @param {number} opt_size Thickness of the line
	 * @param {number[]} opt_color Color of the line
	 * @return {o3d.Transform} the Transform containing the line shape
	 */
	hemi.curve.drawLine = function(p0, p1, opt_size, opt_color) {
		if (!this.dbgLineMat) {
			this.dbgLineMat = this.newMaterial(false);
			this.dbgLineMat.getParam('lightWorldPos').bind(hemi.world.camera.light.position);
		}
		
		var size = opt_size || 1,
			dist = hemi.core.math.distance(p0,p1),
			midpoint = [ (p0[0]+p1[0])/2, (p0[1]+p1[1])/2, (p0[2]+p1[2])/2 ],
			line = hemi.core.primitives.createCylinder(this.pack,
				this.dbgLineMat, size, dist, 3, 1),
			transform = this.pack.createObject('Transform');
		
		transform.addShape(line);
		transform.translate(midpoint);
		transform = hemi.utils.pointYAt(transform,midpoint,p0);
		
		if (opt_color) {
			var param = transform.createParam('diffuse', 'o3d.ParamFloat4');
			param.value = opt_color;
		}
		
		return transform;
	};
	
	/**
	 * Remove the given curve line Transform, its shapes, and its children.
	 * 
	 * @param {o3d.Transform} opt_trans optional Transform to clean up
	 */
	hemi.curve.hideCurves = function(opt_trans) {
		if (opt_trans) {
			var children = opt_trans.children,
				shapes = opt_trans.shapes;
			
			for (var i = 0; i < children.length; i++) {
				this.hideCurves(children[i]);
			}
			for (var i = 0; i < shapes.length; i++) {
				var shape = shapes[i];
				opt_trans.removeShape(shape);
				this.pack.removeObject(shape);
			}
			
			opt_trans.parent = null;
			this.pack.removeObject(opt_trans);
		} else {
			for (var i = 0; i < this.dbgLineTransforms.length; i++) {
				this.hideCurves(this.dbgLineTransforms[i]);
			}
			
			this.dbgLineTransforms = [];
		}
	};
	
	/**
	 * Generate a random point within a bounding box
	 *
	 * @param {number[]} min Minimum point of the bounding box
	 * @param {number[]} max Maximum point of the bounding box
	 * @return {number[]} Randomly generated point
	 */
	hemi.curve.randomPoint = function(min,max) {
		var xi = Math.random();
		var yi = Math.random();
		var zi = Math.random();
		var x = xi*min[0] + (1-xi)*max[0];
		var y = yi*min[1] + (1-yi)*max[1];
		var z = zi*min[2] + (1-zi)*max[2];
		return [x,y,z];
	};
		
	/**
	 * Render the bounding boxes which the curves run through, mostly for
	 * debugging purposes.
	 * 
	 * @param {number[3][2][]} boxes array of pairs of XYZ coordinates, the
	 *     first as minimum values and the second as maximum
	 * @param {o3d.Transform} opt_trans optional parent transform for the boxes
	 */
	hemi.curve.showBoxes = function(boxes, opt_trans) {
		var pack = hemi.curve.pack,
			opt_trans = opt_trans || hemi.picking.pickRoot,
			trans = this.dbgBoxTransforms[opt_trans.clientId] || [];
		
		for (var i = 0; i < boxes.length; i++) {
			var transform = pack.createObject('Transform'),
				b = boxes[i],
				w = b.max[0] - b.min[0],
				h = b.max[1] - b.min[1],
				d = b.max[2] - b.min[2],
				x = b.min[0] + w/2,
				y = b.min[1] + h/2,
				z = b.min[2] + d/2,
				box = o3djs.primitives.createBox(pack, this.dbgBoxMat, w, h, d);
			
			transform.addShape(box);
			transform.translate(x,y,z);
			transform.parent = opt_trans;
			trans.push(transform);
		}
		
		this.dbgBoxTransforms[opt_trans.clientId] = trans;
	};
	
	/**
	 * Remove the bounding boxes from view. If a parent transform is given, only
	 * the bounding boxes under it will be removed. Otherwise all boxes will be
	 * removed.
	 * 
	 * @param {o3d.Transform} opt_trans optional parent transform for the boxes
	 */
	hemi.curve.hideBoxes = function(opt_trans) {
		var pack = hemi.curve.pack;
		
		if (opt_trans) {
			var trans = this.dbgBoxTransforms[opt_trans.clientId] || [];
			
			for (var i = 0; i < trans.length; i++) {
				var tran = trans[i],
					shape = tran.shapes[0];
				
				tran.parent = null;
				tran.removeShape(shape);
				pack.removeObject(shape);
				pack.removeObject(tran);
			}
			
			delete this.dbgBoxTransforms[opt_trans.clientId];
		} else {
			// Create fake transforms and clear all the boxes out
			for (var id in this.dbgBoxTransforms) {
				this.hideBoxes({clientId: id});
			}
		}
	};
	
	/**
	 * Create a curve particle system with the given configuration.
	 * 
	 * @param {Object} cfg configuration options:
	 *     aim: flag to indicate particles should orient with curve
	 *     boxes: array of bounding boxes for particle curves to pass through
	 *     colors: array of values for particle color ramp (use this or colorKeys)
	 *     colorKeys: array of time keys and values for particle color ramp
	 *     fast: flag to indicate GPU-driven particle system should be used
	 *     life: lifetime of particle system (in seconds)
	 *     particleCount: number of particles to allocate for system
	 *     particleShape: enumerator for type of shape to use for particles
	 *     particleSize: size of the particles
	 *     scales: array of values for particle scale ramp (use this or scaleKeys)
	 *     scaleKeys: array of time keys and values for particle size ramp
	 *     tension: tension parameter for the curve (typically from -1 to 1)
	 *     // JS particle system only
	 *     parent: transform to parent the particle system under
	 *     // GPU particle system only
	 *     trail: flag to indicate system should have trailing start and stop
	 * @return {Object} the created particle system
	 */
	hemi.curve.createSystem = function(cfg) {
		var system;
		
		if (cfg.fast) {
			if (cfg.trail) {
				system = new hemi.curve.GpuParticleTrail(cfg);
			} else {
				system = new hemi.curve.GpuParticleSystem(cfg);
			}
		} else {
			system = new hemi.curve.ParticleSystem(cfg);
		}
		
		return system;
	};
	
	hemi.curve.newMaterial = function(opt_trans) {
		var trans = opt_trans == null ? true : opt_trans;
		return hemi.core.material.createBasicMaterial(
			this.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			trans);
	};
	
	hemi.curve.init = function() {
		this.pack = hemi.core.client.createPack();
		this.dbgBoxMat = hemi.core.material.createConstantMaterial(
			this.pack,
			hemi.view.viewInfo,
			[0, 0, 0.5, 1]);
		this.dbgLineMat = null;
		
		var state = this.pack.createObject('State');
		state.getStateParam('PolygonOffset2').value = -1.0;
		state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
		this.dbgBoxMat.state = state;
		this.dbgBoxTransforms = {};
		this.dbgLineTransforms = [];
	};

	/**
	 * @class A Curve is used to represent and calculate different curves
	 * including: linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {number[3][]} points List of xyz waypoints 
	 * @param {hemi.curve.CurveType} opt_type Curve type
	 * @param {Object} opt_config Configuration object specific to this curve
	 */
	hemi.curve.Curve = function(points,opt_type,opt_config) {
		this.count = 0;
		this.tension = 0;
		this.type = opt_type;
		this.weights = [];
		this.xpts = [];
		this.xtans = [];
		this.ypts = [];
		this.ytans = [];
		this.zpts = [];
		this.ztans = [];
		
		if (points) {
			opt_config = opt_config || {};
			opt_config.points = points;
			this.loadConfig(opt_config);
		}
	};

	hemi.curve.Curve.prototype = {
		/**
		 * Get the Octane structure for the Curve.
	     *
	     * @return {Object} the Octane structure representing the Curve
		 */
		toOctane : function() {
			var names = ['count', 'tension', 'weights', 'xpts', 'xtans', 'ypts',
					'ytans', 'zpts', 'ztans'],
				octane = {
					type: 'hemi.curve.Curve',
					props: []
				};
			
			for (var ndx = 0, len = names.length; ndx < len; ndx++) {
				var name = names[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			octane.props.push({
				name: 'setType',
				arg: [this.type]
			});
			
			return octane;
		},
		
		/**
		 * Load the given configuration options into the Curve.
		 * 
		 * @param {Object} cfg configuration options for the Curve
		 */
		loadConfig : function(cfg) {
			var points = cfg.points,
				type = cfg.type || this.type || hemi.curve.CurveType.Linear;
			
			this.setType(type);
			
			if (points) {
				this.count = points.length;
				
				for (var i = 0; i < this.count; i++) {
					this.xpts[i] = points[i][0];
					this.ypts[i] = points[i][1];
					this.zpts[i] = points[i][2];
					this.xtans[i] = 0;
					this.ytans[i] = 0;
					this.ztans[i] = 0;
					this.weights[i] = 1;
				}
			}
			
			if (cfg.weights) {
				for (var i = 0; i < this.count; i++) {
					this.weights[i] = (cfg.weights[i] != null) ? cfg.weights[i] : 1;
				}
			}
			
			if (cfg.tangents) {
				for (var i = 0; i < this.count; i++) {
					if(cfg.tangents[i]) {
						this.xtans[i] = cfg.tangents[i][0] || 0;
						this.ytans[i] = cfg.tangents[i][1] || 0;
						this.ztans[i] = cfg.tangents[i][2] || 0;
					}	
				}
			}
			
			if(cfg.tension) {
				this.tension = cfg.tension;
			}
			
			this.setTangents();
		},
		
		/**
		 * Base interpolation function for this curve. Usually overwritten.
		 *
		 * @param {number} t time, usually between 0 and 1
		 * @return {number[3]} the position interpolated from the time input
		 */
		interpolate : function(t) {
			return [t,t,t];
		},

		/**
		 * The linear interpolation moves on a straight line between waypoints.
		 *
		 * @param {number} t time, usually between 0 and 1
		 * @return {number[3]} the position linearly interpolated from the time
		 *     input
		 */
		linear : function(t) {
			var n = this.count - 1;
			var ndx = Math.floor(t*n);
			if (ndx >= n) ndx = n-1;
			var tt = (t-ndx/n)/((ndx+1)/n-ndx/n);
			var x = (1-tt)*this.xpts[ndx] + tt*this.xpts[ndx+1];
			var y = (1-tt)*this.ypts[ndx] + tt*this.ypts[ndx+1];
			var z = (1-tt)*this.zpts[ndx] + tt*this.zpts[ndx+1];
			return [x,y,z];
		},

		/**
		 * The bezier interpolation starts at the first waypoint, and ends at
		 * the last waypoint, and 'bends' toward the intermediate points. These
		 * points can be weighted for more bending.
		 *
		 * @param {number} t time, usually between 0 and 1
		 * @return {number[3]} the position interpolated from the time input by
		 *     a bezier function.
		 */
		bezier : function(t) {
			var x = 0;
			var y = 0;
			var z = 0;
			var w = 0;
			var n = this.count;
			for(var i = 0; i < n; i++) {
				var fac = this.weights[i]*
				          hemi.utils.choose(n-1,i)*
					      Math.pow(t,i)*
						  Math.pow((1-t),(n-1-i));
				x += fac*this.xpts[i];
				y += fac*this.ypts[i];
				z += fac*this.zpts[i];
				w += fac; 
			}
			return [x/w,y/w,z/w];
		},

		/**
		 * The cubic hermite function interpolates along a line that runs
		 * through the Curve's waypoints at a predefined tangent slope through
		 * each one.
		 *
		 * @param {number} t time, usually between 0 and 1
		 * @return {number[3]} the position interpolated from the time input by
		 *     the cubic hermite function.
		 */
		cubicHermite : function(t) {
			var n = this.count - 1;
			var ndx = Math.floor(t*n);
			if (ndx >= n) ndx = n-1;
			var tt = (t-ndx/n)/((ndx+1)/n-ndx/n);
			var x = hemi.utils.cubicHermite(tt,this.xpts[ndx],this.xtans[ndx],this.xpts[ndx+1],this.xtans[ndx+1]);
			var y = hemi.utils.cubicHermite(tt,this.ypts[ndx],this.ytans[ndx],this.ypts[ndx+1],this.ytans[ndx+1]);
			var z = hemi.utils.cubicHermite(tt,this.zpts[ndx],this.ztans[ndx],this.zpts[ndx+1],this.ztans[ndx+1]);
			return [x,y,z];
		},
		
		/**
		 * The normalized linear interpolation moves on a straight line between
		 * waypoints at a constant velocity.
		 *
		 * @param {number} t time, usually between 0 and 1
		 * @return {number[3]} the position linearly interpolated from the time
		 *     input, normalized to keep the velocity constant
		 */
		linearNorm : function(t) {
			var d = 0;
			var dpts = [];
			dpts[0] = 0;
			for(var i = 1; i < this.count; i++) {
				d += hemi.core.math.distance([this.xpts[i-1],this.ypts[i-1],this.zpts[i-1]],
											 [this.xpts[i],this.ypts[i],this.zpts[i]]);
				dpts[i] = d;
			}
			var tt = t*d;
			var ndx = 0;
			for(var i = 0; i < this.count; i++) {
				if(dpts[i] < tt) ndx = i; 
			}
			var lt = (tt - dpts[ndx])/(dpts[ndx+1] - dpts[ndx]);
			var x = (1-lt)*this.xpts[ndx] + lt*this.xpts[ndx+1];
			var y = (1-lt)*this.ypts[ndx] + lt*this.ypts[ndx+1];
			var z = (1-lt)*this.zpts[ndx] + lt*this.zpts[ndx+1];			
			return [x,y,z];
		},
		
		/**
		 * Calculate the tangents for a cardinal curve, which is a cubic hermite
		 * curve where the tangents are defined by a single 'tension' factor.
		 */
		setTangents : function() {
			if (this.type == hemi.curve.CurveType.Cardinal) {
				var xpts = hemi.utils.clone(this.xpts),
					ypts = hemi.utils.clone(this.ypts),
					zpts = hemi.utils.clone(this.zpts);
				
				// Copy the first and last points in order to calculate tangents
				xpts.unshift(xpts[0]);
				xpts.push(xpts[xpts.length - 1]);
				ypts.unshift(ypts[0]);
				ypts.push(ypts[ypts.length - 1]);
				zpts.unshift(zpts[0]);
				zpts.push(zpts[zpts.length - 1]);
				
				for (var i = 0; i < this.count; i++) {
					this.xtans[i] = (1-this.tension)*(xpts[i+2]-xpts[i])/2;
					this.ytans[i] = (1-this.tension)*(ypts[i+2]-ypts[i])/2;
					this.ztans[i] = (1-this.tension)*(zpts[i+2]-zpts[i])/2;
				}
			}
		},
		
		/**
		 * Set the type of interpolation for the Curve.
		 * 
		 * @param {hemi.curve.CurveType} type interpolation type
		 */
		setType : function(type) {
			this.type = type;
			
			switch (type) {
				case hemi.curve.CurveType.Linear:
					this.interpolate = this.linear;
					break;
				case hemi.curve.CurveType.Bezier:
					this.interpolate = this.bezier;
					break;
				case hemi.curve.CurveType.CubicHermite:
				case hemi.curve.CurveType.Cardinal:
					this.interpolate = this.cubicHermite;
					break;
				case hemi.curve.CurveType.LinearNorm:
					this.interpolate = this.linearNorm;
					break;
				case hemi.curve.CurveType.Custom:
				default:
					break;
			}
		},
		
		/**
		 * Get the XYZ position of the last waypoint of the Curve.
		 * 
		 * @return {number[3]} the position of the last waypoint
		 */
		getEnd : function() {
			var end = this.count - 1;
			return [this.xpts[end],this.ypts[end],this.zpts[end]];
		},
		
		/**
		 * Get the XYZ position of the first waypoint of the Curve.
		 * 
		 * @return {number[3]} the position of the first waypoint
		 */
		getStart : function() {
			return [this.xpts[0],this.ypts[0],this.zpts[0]];
		},
		
		/**
		 * Draw the Curve using primitive shapes.
		 * 
		 * @param {number} samples the number of samples to use to draw
		 * @param {Object} config configuration for how the Curve should look
		 */
		draw : function(samples, config) {
			var points = [];
			for (var i = 0; i < samples+2; i++) {
				points[i] = this.interpolate(i/(samples+1));
			}
			hemi.curve.drawCurve(points,config);
		}
	};
	
	/**
	 * @class A Particle allows a Transform to move along a set of points.
	 * 
	 * @param {o3d.Transform} trans the transform to move along the curve
	 * @param {number[3][]} points the array of points to travel through
	 * @param {hemi.curve.ColorKey[]} colorKeys array of key-values for the 
	 *		color of the default material
	 * @param {hemi.curve.ScaleKey[]} scaleKeys array of key-values for the 
	 *		scale of the transform
	 * @param {boolean} rotate flag indicating if the Transform should rotate as
	 *      it travels through the points
	 */
	hemi.curve.Particle = function(trans,points,colorKeys,scaleKeys,rotate) {
		var pack = hemi.curve.pack,
			m4 = hemi.core.math.matrix4;
		
		this.transform = pack.createObject('Transform');
		this.transform.parent = trans;
		this.frame = 1;
		this.lastFrame = points.length - 2;
		this.destroyed = false;
        this.transform.createParam('diffuse', 'ParamFloat4').value = [0,0,0,0];		
		this.lt = [];
		this.matrices = [];
		this.setColors(colorKeys);
		
		for (var i = this.frame; i <= this.lastFrame; i++) {
			var L = m4.translation(points[i]);
			
			if (rotate) {
				hemi.utils.pointYAt(L, points[i-1], points[i+1]);
			}
			
			this.lt[i] = L;
		}
		this.setScales(scaleKeys);
		this.ready = true;
		this.active = false;
	};
	
	hemi.curve.Particle.prototype = {
		/**
		 * Start this particle along the curve.
		 *
		 * @param {number} loops the number of loops to do
		 */
		run : function(loops) {
			this.loops = loops;
			this.ready = false;
			this.active = true;
		},
	
		/**
		 * Add a shape to the particle Transform.
		 *
		 * @param {o3d.Shape} shape the shape to add
		 */
		addShape : function(shape) {
			this.transform.addShape(shape);
		},
		
		/**
		 * Remove all shapes from the particle transform.
		 */
		removeShapes : function() {
			for (var i = this.transform.shapes.length - 1; i >=0; i--) {
				this.transform.removeShape(this.transform.shapes[i]);
			}
		},
		
		/**
		 * Set the color gradient of this Particle.
		 * 
		 * @param {hemi.curve.ColorKey[]} colorKeys array of color key pairs
		 */
		setColors : function(colorKeys) {
			this.colors = [];
			if(colorKeys) {
				this.colorKeys = [];
				for (var i = 0; i < colorKeys.length; i++) {
					var p = {};
					var c = colorKeys[i];
					p.key = c.key;
					if (c.range) {
						p.value = [];
						if (typeof c.range == 'number') {
							var offset = (Math.random()-0.5)*2*c.range;
							for (var j = 0; j < c.value.length; j++) {
								p.value[j] = c.value[j] + offset;
							}
						} else {
							for (var j = 0; j < c.value.length; j++) {
								p.value[j] = c.value[j] + (Math.random()-0.5)*2*c.range[j];
							}
						}
					} else {
						p.value = c.value;
					}
					this.colorKeys[i] = p;
				}
			} else {
				this.colorKeys = [
					{key:0,value:[0,0,0,1]},
					{key:1,value:[0,0,0,1]}
					];
			}
			for (var i = 1; i <= this.lastFrame; i++) {		
				var time = (i-1)/(this.lastFrame-2);				
				this.colors[i] = this.lerpValue(time,this.colorKeys);			
			}
			return this;
		},
		
		/**
		 * Set the scale gradient of this particle.
		 * 
		 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale key pairs
		 */
		setScales : function(scaleKeys) {
			var m4 = hemi.core.math.matrix4;
			this.scales = [];
			if(scaleKeys) {
				var sKeys = [];
				for (i = 0; i < scaleKeys.length; i++) {
					var p = {};
					var c = scaleKeys[i];
					p.key = c.key;
					if (c.range) {
						p.value = [];
						if (typeof c.range == 'number') {
							var offset = (Math.random()-0.5)*2*c.range;
							for (var j = 0; j < c.value.length; j++) {
								p.value[j] = c.value[j] + offset;
							}
						} else {
							for (var j = 0; j < c.value.length; j++) {
								p.value[j] = c.value[j] + (Math.random()-0.5)*2*c.range[j];
							}
						}
					} else {
						p.value = c.value;
					}
					sKeys[i] = p;
				}
			} else {
				sKeys = [
					{key:0,value:[1,1,1]},
					{key:1,value:[1,1,1]}
				];
			}
			for (var i = 1; i <= this.lastFrame; i++) {
				var time = (i-1)/(this.lastFrame-2);
				this.scales[i] = this.lerpValue(time,sKeys);
				this.matrices[i] = m4.scale(hemi.utils.clone(this.lt[i]),
					this.scales[i]);
			}
			return this;
		},
	
		/**
		 * Translate the Particle transform in local space.
		 *
		 * @param {number} x x translation
		 * @param {number} y y translation
		 * @param {number} z z translation
		 */
		translate : function(x,y,z) {
			this.transform.translate(x,y,z);
		},
		
		/**
		 * Given a set of key-values, return the interpolated value
		 *
		 * @param {number} time time, from 0 to 1
		 * @param {Object[]} keySet array of key-value pairs
		 * @return {number[]} the interpolated value
		 */
		lerpValue : function(time,keySet) {
			var ndx = keySet.length - 2;
			while(keySet[ndx].key > time) {
				ndx--;
			}
			var t = (time - keySet[ndx].key)/(keySet[ndx+1].key - keySet[ndx].key);
			return o3djs.math.lerpVector(keySet[ndx].value,keySet[ndx+1].value,t);
		},
		
		/**
		 * Update the particle (called on each render).
		 */
		update : function() {
			if (!this.active) return;
			
			var f = this.frame;
			this.transform.getParam('diffuse').value = this.colors[f];
			this.transform.localMatrix = this.matrices[f];
			this.frame++;
			this.transform.visible = true;
			
			if (this.frame >= this.lastFrame) {
				this.frame = 1;
				this.loops--;
				if (this.loops === 0) this.reset();
			}
		},
		
		/**
		 * Destroy this particle and all references to it.
		 */
		destroy : function() {
			if(this.destroyed) return;
			var t = this.transform;
			for(var i = (t.shapes.length-1); i >= 0; i--) {
				t.removeShape(t.shapes[i]);
			}
			hemi.curve.pack.removeObject(t);
			this.transform = null;
			this.curve = null;
			this.destroyed = true;
		},
		
		/**
		 * Reset this particle.
		 */
		reset : function() {
			this.transform.visible = false;
			this.loops = this.totalLoops;
			this.destroyed = false;
			this.active = false;
			this.ready = true;
		}
	};
	
	/**
	 * @class A ParticleSystem manages a set of Particle objects, and fires
	 * them at the appropriate intervals.
	 * 
	 * @param {Object} config configuration object describing this system
	 */
	hemi.curve.ParticleSystem = function(config) {
		var pack = hemi.curve.pack;
		var view = hemi.view.viewInfo;
		this.transform = pack.createObject('Transform');
		this.transform.parent = config.parent || hemi.core.client.root;
		this.active = false;
		this.pLife = config.life || 5;
		this.boxes = config.boxes;
		this.maxParticles = config.particleCount || 25;
		this.maxRate = Math.ceil(this.maxParticles / this.pLife);
		this.particles = [];
		this.pRate = this.maxRate;
		this.pTimer = 0.0;
		this.pTimerMax = 1.0 / this.pRate;
		this.pIndex = 0;
			
		var shapeColor = [1,0,0,1];
		this.shapeMaterial = o3djs.material.createBasicMaterial(pack,view,shapeColor,true);
		var param = this.shapeMaterial.getParam('lightWorldPos'); 
		if(param) {
			param.bind(hemi.world.camera.light.position);
		}
		
		var type = config.particleShape || hemi.curve.ShapeType.CUBE,
			size = config.particleSize || 1;
		this.shapes = [];
		this.size = size;
		
		switch (type) {
			case (hemi.curve.ShapeType.ARROW):
				var halfSize = size / 2;
				this.shapes.push(hemi.core.primitives.createPrism(pack, this.shapeMaterial,
					[[0, size], [-size, 0], [-halfSize, 0], [-halfSize, -size],
					[halfSize, -size], [halfSize, 0], [size, 0]], size));
				break;
			case (hemi.curve.ShapeType.SPHERE):
				this.shapes.push(hemi.core.primitives.createSphere(pack,
					this.shapeMaterial,size,24,12));
				break;
			case (hemi.curve.ShapeType.CUBE):
				this.shapes.push(hemi.core.primitives.createCube(pack,
					this.shapeMaterial,size));
				break;
		}
		
		hemi.view.addRenderListener(this);
		
		this.boxesOn = false;
		
		this.points = [];
		this.frames = config.frames || this.pLife*hemi.view.FPS;
		
		for(j = 0; j < this.maxParticles; j++) {
			var curve = this.newCurve(config.tension || 0);
			this.points[j] = [];
			for(i=0; i < this.frames; i++) {
				this.points[j][i] = curve.interpolate((i)/this.frames);
			}
		}
		
		var colorKeys = null,
			scaleKeys = null;
		
		if (config.colorKeys) {
			colorKeys = config.colorKeys;
		} else if (config.colors) {
			var len = config.colors.length,
				step = len === 1 ? 1 : 1 / (len - 1),
			
			colorKeys = [];
			
			for (var i = 0; i < len; i++) {
				colorKeys.push({
					key: i * step,
					value: config.colors[i]
				});
			}
		}
		if (config.scaleKeys) {
			scaleKeys = config.scaleKeys;
		} else if (config.scales) {
			var len = config.scales.length,
				step = len === 1 ? 1 : 1 / (len - 1),
			
			scaleKeys = [];
			
			for (var i = 0; i < len; i++) {
				scaleKeys.push({
					key: i * step,
					value: config.scales[i]
				});
			}
		}
		
		for (i = 0; i < this.maxParticles; i++) {
			this.particles[i] = new hemi.curve.Particle(
				this.transform,
				this.points[i],
				colorKeys,
				scaleKeys,
				config.aim);
			for (var j = 0; j < this.shapes.length; j++) {
				this.particles[i].addShape(this.shapes[j]);
			}
		}
	};
	
	hemi.curve.ParticleSystem.prototype = {
		/**
		 * Start the system.
		 */
		start : function() {
			this.active = true;
		},
		
		/**
		 * Stop the system.
		 *
		 * @param {boolean} opt_hard If true, remove all particles immediately.
		 *     Otherwise, stop emitting but let existing particles finish.
		 */
		stop : function(opt_hard) {
			this.active = false;
			if(opt_hard) {
				// Destroy All Particles
				for(i = 0; i < this.maxParticles; i++) {
					if(this.particles[i] != null) {
						this.particles[i].reset();
					}
				}
			}
		},
		
		/**
		 * Update all existing particles on each render and emit new ones if
		 * needed.
		 *
		 * @param {o3d.RenderEvent} event event object describing details of the
		 *     render loop
		 */
		onRender : function(event) {
			for(i = 0; i < this.maxParticles; i++) {
				if(this.particles[i] != null) {
					this.particles[i].update(event);
				}
			}
			if(!this.active) return;
			this.pTimer += event.elapsedTime;
			if(this.pTimer >= this.pTimerMax) {
				this.pTimer = 0;
				var p = this.particles[this.pIndex];
				if (p.ready) p.run(1);
				this.pIndex++;
				if(this.pIndex >= this.maxParticles) this.pIndex = 0;
			}
		},
		
		/**
		 * Generate a new curve running through the system's bounding boxes.
		 * 
		 * @param {number} tension tension parameter for the Curve
		 * @return {hemi.curve.Curve} the randomly generated Curve
		 */
		newCurve : function(tension) {
			var points = [];
			var num = this.boxes.length;
			for (i = 0; i < num; i++) {
				var min = this.boxes[i].min;
				var max = this.boxes[i].max;
				points[i+1] = hemi.curve.randomPoint(min,max);
			}
			points[0] = points[1].slice(0,3);
			points[num+1] = points[num].slice(0,3);
			var curve = new hemi.curve.Curve(points,
				hemi.curve.CurveType.Cardinal, {tension: tension});
			return curve;
		},
		
		/**
		 * Remove all shapes from all particles in the system.
		 */
		removeShapes : function() {
			for (var i = 0; i < this.maxParticles; i++) {
				this.particles[i].removeShapes();
			}
			this.shapes = [];
		},
		
		/**
		 * Add a shape which will be added to the Transform of every particle.
		 *
		 * @param {number|o3d.Shape} shape either an enum for standard shapes,
		 *     or a custom	predefined shape to add
		 */
		addShape : function(shape) {
			var pack = hemi.curve.pack;
			var startndx = this.shapes.length;
			if (typeof shape == 'string') {
				var size = this.size;
				
				switch (shape) {
					case (hemi.curve.ShapeType.ARROW):
						var halfSize = size / 2;
						this.shapes.push(hemi.core.primitives.createPrism(pack, this.shapeMaterial,
							[[0, size], [-size, 0], [-halfSize, 0], [-halfSize, -size],
							[halfSize, -size], [halfSize, 0], [size, 0]], size));
						break;
					case (hemi.curve.ShapeType.SPHERE):
						this.shapes.push(hemi.core.primitives.createSphere(pack,
							this.shapeMaterial,size,24,12));
						break;
					case (hemi.curve.ShapeType.CUBE):
						this.shapes.push(hemi.core.primitives.createCube(pack,
							this.shapeMaterial,size));
						break;
				}
			} else {
				this.shapes.push(shape);
			}
			for (i = 0; i < this.maxParticles; i++) {
				for (var j = startndx; j < this.shapes.length; j++) {
					this.particles[i].addShape(this.shapes[j]);
				}
			}
		},
		
		/**
		 * Change the rate at which particles are emitted.
		 *
		 * @param {number} delta the delta by which to change the rate
		 * @return {number} the new rate
		 */
		changeRate : function(delta) {
			return this.setRate(this.pRate + delta);
		},
		
		/**
		 * Set the emit rate of the system.
		 *
		 * @param {number} rate the rate at which to emit particles
		 * @return {number} the new rate - may be different because of bounds
		 */
		setRate : function(rate) {
			var newRate = hemi.utils.clamp(rate, 0, this.maxRate);
			
			if (newRate === 0) {
				this.pTimerMax = 0;
				this.stop();
			} else {
				if (this.pRate === 0 && newRate > 0) {
					this.start();
				}
				this.pTimerMax = 1.0 / newRate;
			}
			
			this.pRate = newRate;
			return newRate;
		},
		
		/**
		 * Set the color gradient for this particle system.
		 * 
		 * @param {hemi.curve.ColorKey[]} colorKeys array of color key pairs
		 * @return {hemi.curve.ParticleSystem} this system, for chaining
		 */
		setColors : function(colorKeys) {
			for (var i = 0; i < this.maxParticles; i++) {
				this.particles[i].setColors(colorKeys);
			}
			return this;
		},

		/**
		 * Set the scale gradient for this particle system.
		 * 
		 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale key pairs
		 * @return {hemi.curve.ParticleSystem} this system, for chaining
		 */		
		setScales : function(scaleKeys) {
			for (var i = 0; i < this.maxParticles; i++) {
				this.particles[i].setScales(scaleKeys);
			}
			return this;
		},
		
		/**
		 * Render the bounding boxes which the particle system's curves run
		 * through (helpful for debugging).
		 */
		showBoxes : function() {
			hemi.curve.showBoxes(this.boxes, this.transform);
		},
	
		/**
		 * Hide the particle system's bounding boxes from view.
		 */
		hideBoxes : function() {
			hemi.curve.hideBoxes(this.transform);
		},
		
		/**
		 * Translate the entire particle system by the given amounts
		 * 
		 * @param {number} x amount to translate in the X direction
		 * @param {number} y amount to translate in the Y direction
		 * @param {number} z amount to translate in the Z direction
		 */
		translate: function(x, y, z) {
			this.transform.translate(x, y, z);
		}
	};
	
	// START GPU PARTICLE SYSTEM
	
	hemi.curve.vertHeader =
		'uniform float sysTime; \n' +
		'uniform float ptcMaxTime; \n' +
		'uniform float ptcDec; \n' +
		'uniform float numPtcs; \n' +
		'uniform float tension; \n' +
		'uniform vec3 minXYZ[NUM_BOXES]; \n' +
		'uniform vec3 maxXYZ[NUM_BOXES]; \n' +
		'uniform mat4 viewProjection; \n' +
		'attribute vec4 TEXCOORD; \n' +
		'varying vec4 ptcColor; \n';
	
	hemi.curve.vertHeaderColors =
		'uniform vec4 ptcColors[NUM_COLORS]; \n' +
		'uniform float ptcColorKeys[NUM_COLORS]; \n';
	
	hemi.curve.vertHeaderScales =
		'uniform vec3 ptcScales[NUM_SCALES]; \n' +
		'uniform float ptcScaleKeys[NUM_SCALES]; \n';
	
	hemi.curve.vertSupport =
		'float rand(vec2 co) { \n' +
		'  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); \n' +
		'} \n' +
		'vec3 randXYZ(vec2 co, vec3 min, vec3 max) { \n' +
		'  float rX = rand(vec2(co.x, co.x)); \n' +
		'  float rY = rand(vec2(co.y, co.y)); \n' +
		'  float rZ = rand(co); \n' +
		'  return vec3(mix(max.x, min.x, rX), \n' +
		'              mix(max.y, min.y, rY), \n' +
		'              mix(max.z, min.z, rZ)); \n' +
		'} \n' +
		'vec3 ptcInterp(float t, vec3 p0, vec3 p1, vec3 m0, vec3 m1) { \n' +
		'  float t2 = pow(t, 2.0); \n' +
		'  float t3 = pow(t, 3.0); \n' +
		'  return (2.0*t3 - 3.0*t2 + 1.0)*p0 + (t3 -2.0*t2 + t)*m0 + \n' +
		'   (-2.0*t3 + 3.0*t2)*p1 + (t3-t2)*m1; \n' +
		'} \n';
	
	// Unfortunately we have to do this in the vertex shader since the pixel
	// shader complains about non-constant indexing.
	hemi.curve.vertSupportColors =
		'void setPtcClr(float ptcTime) { \n' +
		'  if (ptcTime > 1.0) { \n' +
		'    ptcColor = vec4(0.0); \n' +
		'  } else { \n' +
		'    int ndx; \n' +
		'    float key; \n' +
		'    for (int i = 0; i < NUM_COLORS-1; i++) { \n' +
		'      if (ptcColorKeys[i] < ptcTime) { \n' +
		'        ndx = i; \n' +
		'        key = ptcColorKeys[i]; \n' +
		'      } \n' +
		'    } \n' +
		'    float t = (ptcTime - key)/(ptcColorKeys[ndx+1] - key); \n' +
		'    ptcColor = mix(ptcColors[ndx], ptcColors[ndx+1], t); \n' +
		'  } \n' +
		'} \n';
	
	hemi.curve.vertSupportNoColors =
		'void setPtcClr(float ptcTime) { \n' +
		'  if (ptcTime > 1.0) { \n' +
		'    ptcColor = vec4(0.0); \n' +
		'  } else { \n' +
		'    ptcColor = vec4(1.0); \n' +
		'  } \n' +
		'} \n';
	
	hemi.curve.vertSupportAim =
		'mat4 getRotMat(float t, vec3 p0, vec3 p1, vec3 m0, vec3 m1) { \n' +
		'  float tM = max(0.0,t-0.02); \n' +
		'  float tP = min(1.0,t+0.02); \n' +
		'  vec3 posM = ptcInterp(tM, p0, p1, m0, m1); \n' +
		'  vec3 posP = ptcInterp(tP, p0, p1, m0, m1); \n' +
		'  vec3 dPos = posP-posM; \n' +
		'  float dxz = sqrt(pow(dPos.x,2.0)+pow(dPos.z,2.0)); \n' +
		'  float dxyz = length(dPos); \n' +
		'  float cx = dPos.y/dxyz; \n' +
		'  float cy = dPos.z/dxz; \n' +
		'  float sx = dxz/dxyz; \n' +
		'  float sy = dPos.x/dxz; \n' +
		'  return mat4(cy,0.0,-1.0*sy,0.0, \n' +
		'   sx*sy,cx,sx*cy,0.0, \n' +
		'   cx*sy,-1.0*sx,cx*cy,0.0, \n' +
		'   0.0,0.0,0.0,1.0); \n' +
		'} \n';
	
	hemi.curve.vertSupportScale =
		'vec3 getScale(float ptcTime) { \n' +
		'  if (ptcTime > 1.0) { \n' +
		'    return vec3(1.0); \n' +
		'  } else { \n' +
		'    int ndx; \n' +
		'    float key; \n' +
		'    for (int i = 0; i < NUM_SCALES-1; i++) { \n' +
		'      if (ptcScaleKeys[i] < ptcTime) { \n' +
		'        ndx = i; \n' +
		'        key = ptcScaleKeys[i]; \n' +
		'      } \n' +
		'    } \n' +
		'    float t = (ptcTime - key)/(ptcScaleKeys[ndx+1] - key); \n' +
		'    return mix(ptcScales[ndx], ptcScales[ndx+1], t); \n' +
		'  } \n' +
		'} \n';
	
	hemi.curve.vertBodySetup =
		'  float id = TEXCOORD[0]; \n' +
		'  float offset = TEXCOORD[1]; \n' +
		'  vec2 seed = vec2(id, numPtcs-id); \n' +
		'  float ptcTime = sysTime + offset; \n' +
		'  if (ptcTime > ptcMaxTime) { \n' +
		'    ptcTime -= ptcDec; \n' +
		'  } \n' +
		'  setPtcClr(ptcTime); \n' +
		'  if (ptcTime > 1.0) { \n' +
		'    ptcTime = 0.0; \n' +
		'  } \n' +
		'  float boxT = float(NUM_BOXES-1)*ptcTime; \n' +
		'  int ndx = int(floor(boxT)); \n' +
		'  float t = fract(boxT); \n' +
		'  vec3 p0 = randXYZ(seed,minXYZ[ndx],maxXYZ[ndx]); \n' +
		'  vec3 p1 = randXYZ(seed,minXYZ[ndx+1],maxXYZ[ndx+1]); \n' +
		'  vec3 m0; \n' +
		'  vec3 m1; \n' +
		'  if (ndx == 0) { \n' +
		'    m0 = vec3(0,0,0); \n' +
		'  } else { \n' +
		'    vec3 pm1 = randXYZ(seed,minXYZ[ndx-1],maxXYZ[ndx-1]); \n' +
		'    m0 = (p1-pm1)*tension; \n' +
		'  } \n' +
		'  if (ndx == NUM_BOXES-2) { \n' +
		'    m1 = vec3(0,0,0); \n' +
		'  } else { \n' +
		'    vec3 p2 = randXYZ(seed,minXYZ[ndx+2],maxXYZ[ndx+2]); \n' +
		'    m1 = (p2-p0)*tension; \n' +
		'  } \n' +
		'  vec3 pos = ptcInterp(t, p0, p1, m0, m1); \n' +
		'  mat4 tMat = mat4(1.0,0.0,0.0,0.0, \n' +
		'   0.0,1.0,0.0,0.0, \n' +
		'   0.0,0.0,1.0,0.0, \n' +
		'   pos.x,pos.y,pos.z,1.0); \n' +
		'  mat4 tMatIT = mat4(1.0,0.0,0.0,-1.0*pos.x, \n' +
		'   0.0,1.0,0.0,-1.0*pos.y, \n' +
		'   0.0,0.0,1.0,-1.0*pos.z, \n' +
		'   0.0,0.0,0.0,1.0); \n';
	
	hemi.curve.vertBodyAim =
		'  mat4 rMat = getRotMat(t, p0, p1, m0, m1); \n';
	
	hemi.curve.vertBodyNoAim =
		'  mat4 rMat = mat4(1.0); \n';
	
	hemi.curve.vertBodyScale =
		'  vec3 scale = getScale(ptcTime); \n' +
		'  mat4 sMat = mat4(scale.x,0.0,0.0,0.0, \n' +
		'   0.0,scale.y,0.0,0.0, \n' +
		'   0.0,0.0,scale.z,0.0, \n' +
		'   0.0,0.0,0.0,1.0); \n';
	
	hemi.curve.vertBodyNoScale =
		'  mat4 sMat = mat4(1.0); \n';
	
	hemi.curve.vertBodyEnd =
		'  mat4 ptcWorld = tMat*rMat*sMat; \n' +
		'  mat4 ptcWorldIT = tMatIT*rMat*sMat; \n' +
		'  mat4 ptcWorldVP = viewProjection * ptcWorld; \n';
	
	hemi.curve.fragHeader =
		'varying vec4 ptcColor; \n';
	
	hemi.curve.fragPreBody =
		'  if (ptcColor.a == 0.0) {\n' +
		'    discard;\n' +
		'  }\n';
	
	hemi.curve.fragGlobNoColors =
		'gl_FragColor.a *= ptcColor.a; \n';
	
	/**
	 * @class A particle system that is GPU driven.
	 * 
	 * @param {Object} opt_cfg optional configuration object for the system
	 */
	hemi.curve.GpuParticleSystem = hemi.world.Citizen.extend({
		init: function(opt_cfg) {
			this._super();
			this.active = false;
			this.aim = false;
			this.boxes = [];
			this.colors = [];
			this.decParam = null;
			this.life = 0;
			this.material = null;
			this.materialSrc = null;
			this.maxTimeParam = null;
			this.particles = 0;
			this.ptcShape = 0;
			this.scales = [];
			this.size = 0;
			this.tension = 0;
			this.texNdx = -1;
			this.timeParam = null;
			this.transform = null;
			
			if (opt_cfg) {
				this.loadConfig(opt_cfg);
			}
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
		 * @type string
         */
        citizenType: 'hemi.curve.GpuParticleSystem',
	
		/**
		 * Hide the particle system's bounding boxes from view.
		 */
		hideBoxes : function() {
			hemi.curve.hideBoxes(this.transform);
		},
		
		/**
		 * Load the given configuration object and set up the GpuParticleSystem.
		 * 
		 * @param {Object} cfg configuration object
		 */
		loadConfig: function(cfg) {
			this.aim = cfg.aim == null ? false : cfg.aim;
			this.boxes = cfg.boxes ? hemi.utils.clone(cfg.boxes) : [];
			this.life = cfg.life || 5;
			this.particles = cfg.particleCount || 1;
			this.size = cfg.particleSize || 1;
			this.tension = cfg.tension || 0;
			
			if (cfg.colorKeys) {
				this.setColorKeys(cfg.colorKeys);
			} else if (cfg.colors) {
				this.setColors(cfg.colors);
			} else {
				this.colors = [];
			}
			
			if (cfg.scaleKeys) {
				this.setScaleKeys(cfg.scaleKeys);
			} else if (cfg.scales) {
				this.setScales(cfg.scales);
			} else {
				this.scales = [];
			}
			
			this.setMaterial(cfg.material || hemi.curve.newMaterial());
			this.setParticleShape(cfg.particleShape || hemi.curve.ShapeType.CUBE);
		},
		
		/**
		 * Update the particles on each render.
		 * 
		 * @param {o3d.RenderEvent} e the render event
		 */
		onRender: function(e) {
			var delta = e.elapsedTime / this.life,
				newTime = this.timeParam.value + delta;
			
			while (newTime > 1.0) {
				--newTime;
			}
			
			this.timeParam.value = newTime;
		},
		
		/**
		 * Pause the particle system.
		 */
		pause: function() {
			if (this.active) {
				hemi.view.removeRenderListener(this);
				this.active = false;
			}
		},
		
		/**
		 * Resume the particle system.
		 */
		play: function() {
			if (!this.active) {
				if (this.maxTimeParam.value === 1.0) {
					hemi.view.addRenderListener(this);
					this.active = true;
				} else {
					this.start();
				}
			}
		},
		
		/**
		 * Set whether or not particles should orient themselves along the curve
		 * they are following.
		 * 
		 * @param {boolean} aim flag indicating if particles should aim
		 */
		setAim: function(aim) {
			if (this.aim !== aim) {
				this.aim = aim;
				this.setupShaders();
			}
		},
		
		/**
		 * Set the bounding boxes that define waypoints for the particle
		 * system's curves.
		 * 
		 * @param {hemi.curve.Box[]} boxes array of boxes defining volumetric
		 *     waypoints for the particle system
		 */
		setBoxes: function(boxes) {
			var oldLength = this.boxes.length;
			this.boxes = hemi.utils.clone(boxes);
			
			if (this.boxes.length === oldLength) {
				setupBounds(this.material, this.boxes);
			} else {
				this.setupShaders();
			}
		},
		
		/**
		 * Set the color ramp for the particles as they travel along the curve.
		 * 
		 * @param {number[4][]} colors array of RGBA color values
		 */
		setColors: function(colors) {
			var len = colors.length,
				step = len === 1 ? 1 : 1 / (len - 1),
				colorKeys = [];
			
			for (var i = 0; i < len; i++) {
				colorKeys.push({
					key: i * step,
					value: colors[i]
				});
			}
			
			this.setColorKeys(colorKeys);
		},
		
		/**
		 * Set the color ramp for the particles as they travel along the curve,
		 * specifying the interpolation times for each color.
		 * 
		 * @param {hemi.curve.ColorKey[]} colorKeys array of color keys, sorted
		 *     into ascending key order
		 */
		setColorKeys: function(colorKeys) {
			var len = colorKeys.length;
			
			if (len === 1) {
				// We need at least two to interpolate
				var clr = colorKeys[0].value;
				this.colors = [{
					key: 0,
					value: clr
				}, {
					key: 1,
					value: clr
				}];
			} else if (len > 1) {
				// Just make sure the keys run from 0 to 1
				colorKeys[0].key = 0;
				colorKeys[colorKeys.length - 1].key = 1;
				this.colors = colorKeys;
			} else {
				this.colors = [];
			}
			
			this.setupShaders();
		},
		
		/**
		 * Set the lifetime of the particle system.
		 * 
		 * @param {number} life the lifetime of the system in seconds
		 */
		setLife: function(life) {
			if (life > 0) {
				this.life = life;
			}
		},
		
		/**
		 * Set the material to use for the particles. Note that the material's
		 * shader will be modified for the particle system.
		 * 
		 * @param {o3d.Material} material the material to use for particles
		 */
		setMaterial: function(material) {
			var shads = hemi.utils.getShaders(material);
			
			if (this.material) {
				hemi.curve.pack.removeObject(this.material);
			}
			
			this.material = material;
			this.materialSrc = {
				frag: shads.fragSrc,
				vert: shads.vertSrc
			};
			this.setupShaders();
		},
		
		/**
		 * Set the total number of particles for the system to create.
		 *  
		 * @param {number} numPtcs number of particles
		 */
		setParticleCount: function(numPtcs) {
			this.particles = numPtcs;
			
			if (this.ptcShape) {
				// Recreate the custom vertex buffers
				this.setParticleShape(this.ptcShape);
			}
		},
		
		/**
		 * Set the size of each individual particle. For example, this would be
		 * the radius if the particles are spheres.
		 * 
		 * @param {number} size size of the particles
		 */
		setParticleSize: function(size) {
			this.size = size;
			
			if (this.ptcShape) {
				// Recreate the custom vertex buffers
				this.setParticleShape(this.ptcShape);
			}
		},
		
		/**
		 * Set the shape of the particles to one of the predefined shapes. This
		 * may take some time as a new vertex buffer gets created.
		 * 
		 * @param {hemi.curve.ShapeType} type the type of shape to use
		 */
		setParticleShape: function(type) {
			this.ptcShape = type;
			
			if (this.transform) {
				this.transform.parent = null;
				hemi.shape.pack.removeObject(this.transform.shapes[0]);
				hemi.shape.pack.removeObject(this.transform);
				this.transform = null;
			}
			
			this.material = this.material || hemi.curve.newMaterial();
			this.particles = this.particles || 1;
			
			switch (type) {
				case hemi.curve.ShapeType.ARROW:
					this.transform = hemi.shape.create({
						shape: 'arrow',
						mat: this.material,
						size: this.size,
						tail: this.size });
					break;
				case hemi.curve.ShapeType.SPHERE:
					this.transform = hemi.shape.create({
						shape: 'sphere',
						mat: this.material,
						radius: this.size });
					break;
				case hemi.curve.ShapeType.CUBE:
				default:
					this.transform = hemi.shape.create({
						shape: 'cube',
						mat: this.material,
						size: this.size });
					break;
			}
			
			var shape = this.transform.shapes[0],
				elements = shape.elements;
			
			for (var i = 0, il = elements.length; i < il; i++) {
				var element = elements[i];
				
				if (element.className === 'Primitive') {
					this.texNdx = modifyPrimitive(element, this.particles);
				}
			}
			
			this.setupShaders();
		},
		
		/**
		 * Set the scale ramp for the particles as they travel along the curve.
		 * 
		 * @param {number[3][]} scales array of XYZ scale values
		 */
		setScales: function(scales) {
			var len = scales.length,
				step = len === 1 ? 1 : 1 / (len - 1),
				scaleKeys = [];
			
			for (var i = 0; i < len; i++) {
				scaleKeys.push({
					key: i * step,
					value: scales[i]
				});
			}
			
			this.setScaleKeys(scaleKeys);
		},
		
		/**
		 * Set the scale ramp for the particles as they travel along the curve,
		 * specifying the interpolation times for each scale.
		 * 
		 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale keys, sorted
		 *     into ascending key order
		 */
		setScaleKeys: function(scaleKeys) {
			var len = scaleKeys.length;
			
			if (len === 1) {
				// We need at least two to interpolate
				var scl = scaleKeys[0].value;
				this.scales = [{
					key: 0,
					value: scl
				}, {
					key: 1,
					value: scl
				}];
			} else if (len > 1) {
				// Just make sure the keys run from 0 to 1
				scaleKeys[0].key = 0;
				scaleKeys[len - 1].key = 1;
				this.scales = scaleKeys;
			} else {
				this.scales = [];
			}
			
			this.setupShaders();
		},
		
		/**
		 * Set the tension parameter for the curve. This controls how round or
		 * straight the curve sections are.
		 * 
		 * @param {number} tension tension value (typically from -1 to 1)
		 */
		setTension: function(tension) {
			this.tension = tension;
			
			if (this.material) {
				this.material.getParam('tension').value = (1 - this.tension) / 2;
			}
		},
		
		/**
		 * Modify the particle material's shaders so that the particle system
		 * can be rendered using its current configuration. At a minimum, the
		 * material, custom texture index, and curve boxes need to be defined.
		 */
		setupShaders: function() {
			if (!this.material || !this.materialSrc || this.texNdx === -1 || this.boxes.length < 2) {
				return;
			}
			
			var material = this.material,
				fragSrc = this.materialSrc.frag,
				vertSrc = this.materialSrc.vert,
				numBoxes = this.boxes.length,
				numColors = this.colors.length,
				numScales = this.scales.length,
				texNdx = this.texNdx,
				addColors = numColors > 1,
				addScale = numScales > 1,
				shads = hemi.utils.getShaders(material),
				fragShd = shads.fragShd,
				vertShd = shads.vertShd,
				dec = 1.0,
				maxTime = 3.0,
				time = 1.1,
				uniforms = ['sysTime', 'ptcMaxTime', 'ptcDec', 'numPtcs',
					'tension', 'ptcScales', 'ptcScaleKeys', 'minXYZ', 'maxXYZ',
					'ptcColors', 'ptcColorKeys'];
			
			// Remove any previously existing uniforms that we created
			for (var i = 0, il = uniforms.length; i < il; i++) {
				var name = uniforms[i],
					param = material.getParam(name);
				
				if (param) {
					if (name === 'ptcDec') {
						dec = param.value;
					} else if (name === 'ptcMaxTime') {
						maxTime = param.value;
					} else if (name === 'sysTime') {
						time = param.value;
					}
					
					material.removeParam(param);
				}
			}
			
			// modify the vertex shader
			if (vertSrc.search('ptcInterp') < 0) {
				var vertHdr = hemi.curve.vertHeader.replace(/NUM_BOXES/g, numBoxes),
					vertSprt = hemi.curve.vertSupport,
					vertPreBody = hemi.curve.vertBodySetup.replace(/NUM_BOXES/g, numBoxes);
				
				vertHdr = vertHdr.replace(/TEXCOORD/g, 'texCoord' + texNdx);
				vertPreBody = vertPreBody.replace(/TEXCOORD/g, 'texCoord' + texNdx);
				
				if (addColors) {
					vertHdr += hemi.curve.vertHeaderColors.replace(/NUM_COLORS/g, numColors);
					vertSprt += hemi.curve.vertSupportColors.replace(/NUM_COLORS/g, numColors);
				} else {
					vertSprt += hemi.curve.vertSupportNoColors;
				}
				
				if (this.aim) {
					vertSprt += hemi.curve.vertSupportAim;
					vertPreBody += hemi.curve.vertBodyAim;
				} else {
					vertPreBody += hemi.curve.vertBodyNoAim;
				}
				
				if (addScale) {
					vertHdr += hemi.curve.vertHeaderScales.replace(/NUM_SCALES/g, numScales);
					vertSprt += hemi.curve.vertSupportScale.replace(/NUM_SCALES/g, numScales);
					vertPreBody += hemi.curve.vertBodyScale;
				} else {
					vertPreBody += hemi.curve.vertBodyNoScale;
				}
				
				vertPreBody += hemi.curve.vertBodyEnd;
				var parsedVert = hemi.utils.parseSrc(vertSrc, 'gl_Position'),
					vertBody = parsedVert.body.replace(/world/g, 'ptcWorld')
						.replace(/ViewProjection/g, 'VP')
						.replace(/InverseTranspose/g, 'IT');
				
				parsedVert.postHdr = vertHdr;
				parsedVert.postSprt = vertSprt;
				parsedVert.postHdr = vertHdr;
				parsedVert.preBody = vertPreBody;
				parsedVert.body = vertBody;
				vertSrc = hemi.utils.buildSrc(parsedVert);
				
				material.gl.detachShader(material.effect.program_, vertShd);
				material.effect.loadVertexShaderFromString(vertSrc);
			}
			
			// modify the fragment shader
			if (fragSrc.search('ptcColor') < 0) {
				var parsedFrag = hemi.utils.parseSrc(fragSrc, 'gl_FragColor'),
					fragGlob = parsedFrag.glob;
				
				parsedFrag.postHdr = hemi.curve.fragHeader;
				parsedFrag.preBody = hemi.curve.fragPreBody;
				
				if (addColors) {
					if (fragGlob.indexOf('diffuse') !== -1) {
						parsedFrag.glob = fragGlob.replace(/diffuse/g, 'ptcColor');
					} else {
						parsedFrag.glob = fragGlob.replace(/emissive/g, 'ptcColor');
					}
				} else {
					parsedFrag.postGlob = hemi.curve.fragGlobNoColors;
				}
				
				fragSrc = hemi.utils.buildSrc(parsedFrag);
				material.gl.detachShader(material.effect.program_, fragShd);
				material.effect.loadPixelShaderFromString(fragSrc);
			}
			
			material.effect.createUniformParameters(material);
			
			// Setup params
			material.getParam('numPtcs').value = this.particles;
			material.getParam('tension').value = (1 - this.tension) / 2;
			this.decParam = material.getParam('ptcDec');
			this.maxTimeParam = material.getParam('ptcMaxTime');
			this.timeParam = material.getParam('sysTime');
			this.decParam.value = dec;
			this.maxTimeParam.value = maxTime;
			this.timeParam.value = time;
			setupBounds(material, this.boxes);
			
			var needsZ = false,
				hvv = hemi.view.viewInfo;
			
			for (var i = 0; i < numColors && !needsZ; i++) {
				needsZ = this.colors[i].value[3] < 1;
			}
			
			material.drawList = needsZ ? hvv.zOrderedDrawList : hvv.performanceDrawList;
			
			if (addColors) {
				setupColors(material, this.colors);
			}
			if (addScale) {
				setupScales(material, this.scales);
			}
		},
		
		/**
		 * Render the bounding boxes which the particle system's curves run
		 * through (helpful for debugging).
		 */
		showBoxes : function() {
			hemi.curve.showBoxes(this.boxes, this.transform);
		},
		
		/**
		 * Start the particle system.
		 */
		start: function() {
			if (!this.active) {
				this.active = true;
				this.timeParam.value = 1.0;
				this.maxTimeParam.value = 1.0;
				hemi.view.addRenderListener(this);
			}
		},
		
		/**
		 * Stop the particle system.
		 */
		stop: function() {
			if (this.active) {
				this.active = false;
				this.timeParam.value = 1.1;
				this.maxTimeParam.value = 3.0;
				hemi.view.removeRenderListener(this);
			}
		},
		
		/**
		 * Get the Octane structure for the GpuParticleSystem.
	     *
	     * @return {Object} the Octane structure representing the
	     *     GpuParticleSystem
		 */
		toOctane: function(){
			var octane = this._super();
			
			octane.props.push({
				name: 'loadConfig',
				arg: [{
					aim: this.aim,
					boxes: this.boxes,
					colorKeys: this.colors,
					life: this.life,
					particleCount: this.particles,
					particleShape: this.ptcShape,
					particleSize: this.size,
					scaleKeys: this.scales,
					tension: this.tension
				}]
			});
			
			return octane;
		},
		
		/**
		 * Translate the entire particle system by the given amounts
		 * @param {number} x amount to translate in the X direction
		 * @param {number} y amount to translate in the Y direction
		 * @param {number} z amount to translate in the Z direction
		 */
		translate: function(x, y, z) {
			for (var i = 0, il = this.boxes.length; i < il; i++) {
				var box = this.boxes[i],
					min = box.min,
					max = box.max;
				
				min[0] += x;
				max[0] += x;
				min[1] += y;
				max[1] += y;
				min[2] += z;
				max[2] += z;
			}
			setupBounds(this.material, this.boxes);
		}
	});
	
	/**
	 * @class A GPU driven particle system that has trailing starts and stops.
	 * 
	 * @param {Object} opt_cfg the configuration object for the system
	 */
	hemi.curve.GpuParticleTrail = hemi.curve.GpuParticleSystem.extend({
		init: function(opt_cfg) {
			this._super(opt_cfg);
			
			this.endTime = 1.0;
			this.starting = false;
			this.stopping = false;
		},
		
		/**
		 * Update the particles on each render.
		 * 
		 * @param {o3d.RenderEvent} e the render event
		 */
		onRender: function(e) {
			var delta = e.elapsedTime / this.life,
				newTime = this.timeParam.value + delta;
			
			if (newTime > this.endTime) {
				if (this.stopping) {
					this.active = false;
					this.stopping = false;
					this.maxTimeParam.value = 3.0;
					hemi.view.removeRenderListener(this);
					newTime = 1.1;
				} else {
					if (this.starting) {
						this.starting = false;
						this.endTime = 1.0;
						this.decParam.value = 1.0;
						this.maxTimeParam.value = 1.0;
					}
					
					while (--newTime > this.endTime) {}
				}
			}
			
			if (this.stopping) {
				this.maxTimeParam.value += delta;
			}
			
			this.timeParam.value = newTime;
		},
		
		/**
		 * Resume the particle system.
		 */
		play: function() {
			if (!this.active) {
				if (this.starting || this.stopping || this.maxTimeParam.value === 1.0) {
					hemi.view.addRenderListener(this);
					this.active = true;
				} else {
					this.start();
				}
			}
		},
		
		/**
		 * Start the particle system.
		 */
		start: function() {
			if (this.stopping) {
				hemi.view.removeRenderListener(this);
				this.active = false;
				this.stopping = false;
			}
			if (!this.active) {
				this.active = true;
				this.starting = true;
				this.stopping = false;
				this.endTime = 2.0;
				this.decParam.value = 2.0;
				this.maxTimeParam.value = 2.0;
				this.timeParam.value = 1.0;
				hemi.view.addRenderListener(this);
			}
		},
		
		/**
		 * Stop the particle system.
		 */
		stop: function() {
			if (this.active && !this.stopping) {
				this.starting = false;
				this.stopping = true;
				this.endTime = this.timeParam.value + 1.0;
				
			}
		}
	});
	
	/*
	 * Take the existing vertex buffer in the given primitive and copy the data
	 * once for each of the desired number of particles. Add a texture
	 * coordinate stream to feed particle id/offset data through.
	 * 
	 * @param {o3d.Primitive} primitive the primitive to modify
	 * @param {number} numParticles the number of particles to create vertex
	 *     data for
	 * @return {number} the id of the created texture coordinate stream
	 */
	var modifyPrimitive = function(primitive, numParticles) {
		var TEXCOORD = hemi.core.o3d.Stream.TEXCOORD,
			indexBuffer = primitive.indexBuffer,
			streamBank = primitive.streamBank,
			streams = streamBank.vertexStreams,
			numVerts = streams[0].getMaxVertices_(),
			vertexBuffer = streams[0].field.buffer,
			origStreams = [],
			idOffNdx = -1,
			idOffStream;
		
		// Create progress task for this
		var taskName = 'GpuParticles',
			taskDiv = numParticles / 3,
			taskInc = 0,
			taskProg = 10;
		
		hemi.loader.createTask(taskName, vertexBuffer);
		
		// Find the first unused texture coordinate stream and create it
		do {
			idOffStream = streamBank.getVertexStream(TEXCOORD, ++idOffNdx);
		} while (idOffStream !== null);
		
		var idOffsetField = vertexBuffer.createField('FloatField', 2);
		streamBank.setVertexStream(TEXCOORD, idOffNdx, idOffsetField, 0);
		
		// Copy the contents of all of the existing vertex streams
		for (var i = 0, il = streams.length; i < il; i++) {
			var stream = streams[i];
			
			origStreams.push({
				stream: stream,
				vals: stream.field.getAt(0, numVerts)
			});
		}
		
		vertexBuffer.allocateElements(numVerts * numParticles);
		hemi.loader.updateTask(taskName, taskProg);
		
		// Create a copy of each stream's contents for each particle
		var indexArr = indexBuffer.array_,
			newIndexArr = [];
		
		for (var i = 0; i < numParticles; i++) {
			// Index buffer entry
			var vertOffset = i * numVerts,
				timeOffset = i / numParticles;
			
			for (var j = 0, jl = indexArr.length; j < jl; j++) {
				newIndexArr.push(indexArr[j] + vertOffset);
			}
			// Original vertex data
			for (var j = 0, jl = origStreams.length; j < jl; j++) {
				var obj = origStreams[j],
					vals = obj.vals,
					field = obj.stream.field;
				
				field.setAt(vertOffset, vals);
			}
			// New "particle system" vertex data
			for (var j = 0; j < numVerts; j++) {
				idOffsetField.setAt(vertOffset + j, [i, timeOffset]);
			}
			
			if (++taskInc >= taskDiv) {
				taskInc = 0;
				taskProg += 30;
				hemi.loader.updateTask(taskName, taskProg);
			}
		}
		
		indexBuffer.set(newIndexArr);
		// Update the primitive and vertex counts
		primitive.numberPrimitives *= numParticles;
  		primitive.numberVertices *= numParticles;
		hemi.loader.updateTask(taskName, 100);
		return idOffNdx;
	};
	
	/*
	 * Set the parameters for the given Material so that it supports a curve
	 * through the given bounding boxes.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {hemi.curve.Box[]} boxes array of min and max XYZ coordinates
	 */
	var setupBounds = function(material, boxes) {
		var minParam = material.getParam('minXYZ'),
			maxParam = material.getParam('maxXYZ'),
			minArr = hemi.curve.pack.createObject('ParamArray'),
			maxArr = hemi.curve.pack.createObject('ParamArray');
		
		minArr.resize(boxes.length, 'ParamFloat3');
		maxArr.resize(boxes.length, 'ParamFloat3');
		
		for (var i = 0, il = boxes.length; i < il; ++i) {
			var box = boxes[i];
			minArr.getParam(i).value = box.min;
			maxArr.getParam(i).value = box.max;
		}
		
		minParam.value = minArr;
		maxParam.value = maxArr;
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a color ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object[]} colors array of RGBA color values and keys
	 */
	var setupColors = function(material, colors) {
		var clrParam = material.getParam('ptcColors'),
			keyParam = material.getParam('ptcColorKeys'),
			clrArr = hemi.curve.pack.createObject('ParamArray'),
			keyArr = hemi.curve.pack.createObject('ParamArray');
		
		clrArr.resize(colors.length, 'ParamFloat4');
		keyArr.resize(colors.length, 'ParamFloat');
		
		for (var i = 0, il = colors.length; i < il; ++i) {
			clrArr.getParam(i).value = colors[i].value;
			keyArr.getParam(i).value = colors[i].key;
		}
		
		clrParam.value = clrArr;
		keyParam.value = keyArr;
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a scale ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object[]} scales array of XYZ scale values and keys
	 */
	var setupScales = function(material, scales) {
		var sclParam = material.getParam('ptcScales'),
			keyParam = material.getParam('ptcScaleKeys'),
			sclArr = hemi.curve.pack.createObject('ParamArray'),
			keyArr = hemi.curve.pack.createObject('ParamArray');
		
		sclArr.resize(scales.length, 'ParamFloat3');
		keyArr.resize(scales.length, 'ParamFloat');
		
		for (var i = 0, il = scales.length; i < il; ++i) {
			sclArr.getParam(i).value = scales[i].value;
			keyArr.getParam(i).value = scales[i].key;
		}
		
		sclParam.value = sclArr;
		keyParam.value = keyArr;
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
 * @fileoverview The Sprite class allows for the easy creation of 2d animated sprites
 *		and billboards in the 3d world.
 */

var hemi = (function(hemi) {
	/**
	 * @namespace A module for defining animated sprites and billboards.
	 */
	hemi.sprite = hemi.sprite || {};
	
	hemi.sprite.header =
		'uniform mat4 projection; \n' +
		'uniform mat4 worldView; \n';
	
	hemi.sprite.vertBody =
		'  vec4 pos = position + vec4(worldView[3].xyz,0); \n';
	
	hemi.sprite.vertGlob =
		'  gl_Position = pos*projection; \n';
	
	hemi.sprite.init = function() {
		this.pack = hemi.core.client.createPack();
	};

	/**
	 * @class A Sprite can display a 2d image on a plane with several options.
	 * The image can be made to always face the camera, and it can scale to
	 * stay the same size in the viewer. It can also cycle through a series of
	 * frames to create an animation effect, for a number of cycles or
	 * indefinitely.
	 * 
	 * @param {number} width the width of the sprite
	 * @param {number} height the height of the sprite
	 * @param {string} opt_source the location of a source image to start with (not implemented)
	 */
	hemi.sprite.Sprite = function(width,height,opt_source) {
		var core = hemi.core;
		var pack = hemi.sprite.pack;
		var viewInfo = hemi.view.viewInfo;
		this.material = pack.createObject('Material');
		this.material.createParam('emissiveSampler','o3d.ParamSampler');
		core.material.attachStandardEffect(pack,this.material,viewInfo,'constant');
		this.material.getParam('o3d.drawList').value = viewInfo.zOrderedDrawList;
		var shads = hemi.utils.getShaders(this.material);
		this.materialSrc = {
			frag: shads.fragSrc,
			vert: shads.vertSrc
		};
		// Rotate the Sprite's plane so that it faces the Z axis
		var m4 = core.math.matrix4.rotationX(Math.PI/2);
		this.plane = core.primitives.createPlane(pack,this.material,width,height,1,1,m4);
		this.transform = pack.createObject('Transform');
		this.transform.addShape(this.plane);
		this.parent(core.client.root);
		this.cycle = 0;
		this.maxCycles = 0;
		this.clock = 0;
		this.period = 1;
		this.running = false;
		this.samplers = [];
		this.lookAtCam = false;
		this.constSize = false;
	};

	hemi.sprite.Sprite.prototype = {
		/**
		 * Add an image to be used as a frame in the animation, or as a
		 * standalone image.
		 *
		 * @param {string} path the path to the image source
		 * @param {function(number,hemi.sprite.Sprite):void} opt_callback a
		 * function to call and pass the index and sprite
		 */
		addFrame : function(path, opt_callback) {
			hemi.loader.loadTexture(path,
				function(texture) {
					var sampler = hemi.sprite.pack.createObject('Sampler');
					sampler.texture = texture;
					this.samplers.push(sampler);
					if (opt_callback) opt_callback(this.samplers.length - 1, this);
				}, this);
		},

		/**
		 * Set the Sprite to be a constant size in the viewer.
		 *
		 * @param {boolean} enable If true, keep sprite size constant
		 */
		constantSize : function(enable) {
			this.constSize = enable;
		},

		/**
		 * Set the Sprite to always look at the camera.
		 *
		 * @param {boolean} enable If true, always look at camera
		 */
		lookAtCamera : function(enable) {
			if (this.lookAtCam !== enable) {
				var material = this.material,
					shads = hemi.utils.getShaders(material),
					vertShd = shads.vertShd,
					vertSrc = this.materialSrc.vert,
					uniforms = [];
				
				// Remove any previously existing uniforms that we created
				for (var i = 0, il = uniforms.length; i < il; i++) {
					var name = uniforms[i],
						param = material.getParam(name);
					
					if (param) {
						material.removeParam(param);
					}
				}
				
				if (enable) {
					// modify the vertex shader
					vertSrc = hemi.utils.combineVertSrc(vertSrc, {
						postHdr: hemi.sprite.header,
						preBody: hemi.sprite.vertBody,
						glob: hemi.sprite.vertGlob
					});
				}
				
				material.gl.detachShader(material.effect.program_, vertShd);
				material.effect.loadVertexShaderFromString(vertSrc);
				material.effect.createUniformParameters(material);
				this.lookAtCam = enable;
			}
		},

		/**
		 * Function to call on every render cycle. Scale or rotate the Sprite if
		 * needed, and update the frame if needed.
		 *
		 *	@param {o3d.RenderEvent} e Message describing this render loop
		 */
		onRender : function(e) {
			var p0 = this.transform.getUpdatedWorldMatrix()[3].slice(0,3);
			if (this.constSize) {
				//TODO: Implement in shader
//				var scale = hemi.core.math.distance(hemi.world.camera.getEye(),p0) *
//							Math.asin(hemi.world.camera.fov.current);
//				this.transform.scale([scale,1,scale]);
			}
			if (!this.running) {
				return;
			}
			this.clock += e.elapsedTime;
			if (this.clock >= this.period) {
				this.cycle++;
				if (this.cycle == this.maxCycles) {
					this.stop();
				} else {
					this.setFrame(this.cycle);
					this.clock %= this.period;
				}
			}
		},

		/**
		 * Set the parent of the Sprite to a Transform.
		 *
		 * @param {o3d.Transform} transform Transform to be the new parent
		 */
		parent : function(transform) {
			this.transform.parent = transform;
		},

		/**
		 * Start the Sprite animating, for a set number of cycles, or pass in -1
		 * for infinite looping.
		 *
		 * @param {number} opt_cycles Number of cycles, defaults to one loop
		 *     through the frames
		 */
		run : function(opt_cycles) {
			this.cycle = 0;
			this.maxCycles = opt_cycles || this.samplers.length;
			this.clock = 0;
			this.setFrame(0);
			this.running = true;
			hemi.view.addRenderListener(this);
		},

		/**
		 * Set the Sprite to display one of it's frames.
		 *
		 * @param {number} index Index of desired frame
		 */
		setFrame : function(index) {
			if (this.samplers.length > 0) {
				var ndx = index%this.samplers.length;
				var sampler = this.samplers[ndx];
				this.material.getParam('emissiveSampler').value = sampler;
			}
		},

		/**
		 * Set the period of time, in seconds, that each frame of the Sprite's
		 * animation will display.
		 *
		 * @param {number} period Period, in seconds
		 */
		setPeriod : function(period) {
			this.period = period;
		},

		/**
		 * Stop the animating frames.
		 */
		stop : function() {
			this.running = false;
		}
	};

	return hemi;
})(hemi || {});/* 
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
	 * @namespace A module for easily creating primitives in Kuda.
	 */
	hemi.shape = hemi.shape || {};
	
	hemi.shape.BOX = 'box';
	hemi.shape.CUBE = 'cube';
	hemi.shape.SPHERE = 'sphere';
	hemi.shape.CYLINDER = 'cylinder';
	hemi.shape.CONE = 'cone';
	hemi.shape.ARROW = 'arrow';
	hemi.shape.TETRA = 'tetra';
	hemi.shape.OCTA = 'octa';
	hemi.shape.PYRAMID = 'pyramid';
	hemi.shape.CUSTOM = 'custom';
	hemi.shape.SHAPE_ROOT = "ShapeRoot";
	
	/**
	 * @class A TransformUpdate allows changes to the Transform in a Shape to be
	 * persisted through Octane.
	 */
	hemi.shape.TransformUpdate = function() {
		/**
		 * The updated position, rotation, and scale of the Transform.
		 * @type number[4][4]
		 */
		this.localMatrix = null;
		/**
		 * A flag indicating if the Transform is visible.
		 * @type boolean
		 */
		this.visible = null;
		/**
		 * A flag indicating if the Transform is able to be picked.
		 * @type boolean
		 */
		this.pickable = null;
	};

	hemi.shape.TransformUpdate.prototype = {
		/**
		 * Apply the changes in the TransformUpdate to the given Transform.
		 * 
		 * @param {o3d.Transform} transform the Transform to update
		 */
		apply: function(transform) {
			if (this.localMatrix != null) {
				transform.localMatrix = this.localMatrix;
			}
			
			if (this.pickable != null) {
				hemi.picking.setPickable(transform, this.pickable, true);
			}
			
			if (this.visible != null) {
				transform.visible = this.visible;
			}
		},

		/**
		 * Check if the TransformUpdate has been modified.
		 * 
		 * @return {boolean} true if the Transform has been changed
		 */
		isModified: function() {
			return this.localMatrix != null || this.pickable != null || this.visible != null;
		},
		
		/**
		 * Reset the TransformUpdate to its unmodified state.
		 */
		reset: function() {
			this.localMatrix = this.pickable = this.visible = null;
		},

		/**
		 * Get the Octane structure for the TransformUpdate.
		 *
		 * @return {Object} the Octane structure representing the TransformUpdate
		 */
		toOctane: function() {
			var octane = {
					type: 'hemi.shape.TransformUpdate',
					props: []
				},
				valNames = ['localMatrix', 'visible', 'pickable'];
			
			for (var i = 0, il = valNames.length; i < il; i++) {
				var name = valNames[i];
				octane.props.push({
					name: name,
					val: this[name]
				});
			};

			return octane;
		}
	};
	
	/**
	 * @class A Shape is a wrapper class around basic geometric shapes such as
	 * cubes and spheres that allows them to interact with the World in complex
	 * ways.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {Object} opt_config optional configuration for the Shape
	 */
	hemi.shape.Shape = hemi.world.Citizen.extend({
		init: function(opt_config) {
			this._super();
			
			this.color = null;
			this.dim = {};
			this.shapeType = null;
			this.transform = null;
			this.tranUp = new hemi.shape.TransformUpdate();
			
			if (opt_config != null) {
				this.loadConfig(opt_config);
			}
			if (this.color && this.shapeType) {
				this.create();
			}
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
        citizenType: 'hemi.shape.Shape',
		
		/**
		 * Send a cleanup Message and remove all references in the Shape.
		 */
		cleanup: function() {
			this._super();
			
			if (this.transform !== null) {
				destroyTransform(this.transform);
			}
			
			this.color = null;
			this.dim = {};
			this.shapeType = null;
			this.transform = null;
			this.tranUp = null;
		},
		
		/**
		 * Get the Octane structure for the Shape.
	     *
	     * @return {Object} the Octane structure representing the Shape
		 */
		toOctane: function(){
			var octane = this._super(),
				valNames = ['color', 'dim', 'shapeType'];
			
			for (var i = 0, il = valNames.length; i < il; i++) {
				var name = valNames[i];
				octane.props.push({
					name: name,
					val: this[name]
				});
			};
			
			if (this.tranUp.isModified()) {
				octane.props.push({
					name: 'tranUp',
					oct: this.tranUp.toOctane()
				});
			}
			
			octane.props.push({
				name: 'create',
				arg: []
			});
			
			return octane;
		},
		
		/**
		 * Change the existing Shape to a new type of Shape using the given
		 * configuration.
		 * 
		 * @param {Object} cfg configuration options for the Shape
		 */
		change: function(cfg) {
			this.loadConfig(cfg);
			
			var config = hemi.utils.join({
						shape: this.shapeType,
						color: this.color
					},
					this.dim),
				newTran = hemi.shape.create(config),
				oldTran = this.transform,
				oldShapes = oldTran.shapes.slice(0),
				newShapes = newTran.shapes.slice(0);
			
			while (oldShapes.length === 0) {
				oldTran = oldTran.children[0];
				oldShapes = oldTran.shapes;
			}
			
			for (var i = 0, il = newShapes.length; i < il; i++) {
				oldTran.addShape(newShapes[i]);
				newTran.removeShape(newShapes[i]);
			}
			
			for (var i = 0, il = oldShapes.length; i < il; i++) {
				newTran.addShape(oldShapes[i]);
				oldTran.removeShape(oldShapes[i]);
			}
			
			applyColor(this.transform, this.color);
			
			destroyTransform(newTran);
		},
		
		/**
		 * Create the actual shape and transform for the Shape.
		 */
		create: function() {
			var config = hemi.utils.join({
					shape: this.shapeType,
					color: this.color
				},
				this.dim);
			
			if (this.transform !== null) {
				destroyTransform(this.transform);
			}
			
			this.transform = hemi.shape.create(config);
			this.tranUp.apply(this.transform);
			this.setName(this.name);
			
			this.ownerId = this.transform.createParam('ownerId', 'o3d.ParamInteger');
			this.ownerId.value = this.getId();
			hemi.world.tranReg.distribute(this);
		},
		
		/**
		 * Load the given configuration object.
		 * 
		 * @param {Object} config configuration options for the Shape
		 */
		loadConfig: function(config) {
			this.tranUp.reset();
			this.dim = {};
			
			for (t in config) {
				if (t === 'color') {
					this.color = config[t];
				} else if (t === 'type') {
					this.shapeType = config[t];
				} else {
					this.dim[t] = config[t];
				}
			}
		},
		
		/**
		 * Overwrites Citizen.setId() so that the internal transform gets the
		 * new id as well.
		 * 
		 * @param {number} id the new id
		 */
		setId: function(id) {
			this._super(id);
			
			if (this.ownerId) {
				this.ownerId.value = id;
			}
		},
		
		/**
		 * Sets the transform and shape names as well as the overall name for
		 * this shape.
		 * 
		 * @param {string} name the new name
		 */
		setName: function(name) {
			this.name = name;
			this.transform.name = this.name + ' Transform';
			this.transform.shapes[0].name = this.name + ' Shape';
		},
		
		/**
		 * Get the transform for the Shape.
		 * 
		 * @return {o3d.Transform} the transform for the Shape
		 */
		getTransform: function() {
			return this.transform;
		},
		
		/**
		 * Rotate the Transforms in the Shape.
		 * 
		 * @param {Object} config configuration options
		 */
		rotate: function(config) {
			var axis = config.axis.toLowerCase(),
				rad = config.rad;
			
			switch(axis) {
				case 'x':
					this.transform.rotateX(rad);
					break;
				case 'y':
					this.transform.rotateY(rad);
					break;
				case 'z':
					this.transform.rotateZ(rad);
					break;
			}
			
			this.tranUp.localMatrix = hemi.utils.clone(this.transform.localMatrix);
		},
		
		/**
		 * Scale the Transforms in the Shape.
		 * 
		 * @param {Object} config configuration options
		 */
		scale: function(config) {
			this.transform.scale(config.x, config.y, config.z);
			this.tranUp.localMatrix = hemi.utils.clone(this.transform.localMatrix);
		},

		/**
		 * Set the pickable flag for the Transforms in the Shape.
		 *
		 * @param {Object} config configuration options
		 */
		setPickable: function(config) {
			hemi.picking.setPickable(this.transform, config.pick, true);
			this.tranUp.pickable = config.pick ? null : false;
		},

		/**
		 * Set the Shape Transform's matrix to the new matrix.
		 * 
		 * @param {number[4][4]} matrix the new local matrix
		 */
		setMatrix: function(matrix) {			
			this.transform.localMatrix = matrix;
			this.tranUp.localMatrix = hemi.utils.clone(matrix);
		},
		
		/**
		 * Set the visible flag for the Transforms in the Shape.
		 *
		 * @param {Object} config configuration options
		 */
		setVisible: function(config) {
			this.transform.visible = config.vis;
			this.tranUp.visible = config.vis ? null : false;
		},
		
		/**
		 * Translate the Shape by the given amounts.
		 * 
		 * @param {number} x amount to translate on the x axis
		 * @param {number} y amount to translate on the y axis
		 * @param {number} z amount to translate on the z axis
		 */
		translate: function(x, y, z) {
			if (this.transform !== null) {
				this.transform.translate(x, y, z);
				this.tranUp.localMatrix = hemi.utils.clone(this.transform.localMatrix);
			}
		}
	});
	
	/**
	 * Initialize a local root transform and pack.
	 */
	hemi.shape.init = function() {
		hemi.shape.root = hemi.core.mainPack.createObject('Transform');
		hemi.shape.root.name = hemi.shape.SHAPE_ROOT;
		hemi.shape.root.parent = hemi.picking.pickRoot;
		hemi.shape.pack = hemi.core.mainPack;
		hemi.shape.material = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			false);
		hemi.shape.transMaterial = hemi.core.material.createBasicMaterial(
			hemi.shape.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			true);
		
		hemi.world.addCamCallback(function(camera) {
			var pos = camera.light.position,
				param = hemi.shape.material.getParam('lightWorldPos');
			
			if (param) {
				param.bind(pos);
			}
			
			param = hemi.shape.transMaterial.getParam('lightWorldPos'); 
			if (param) {
				param.bind(pos);
			}
		});
	};
	
	/**
	 * Create a geometric shape with the given properties. Valid properties:
	 * shape: the type of shape to create
	 * color: the color of the shape to create
	 * mat: the Material to use for the shape (overrides color)
	 * height/h: height of the shape
	 * width/w: width of the shape
	 * depth/d: depth of the shape
	 * size: size of the shape
	 * radius/r: radius of the shape
	 * radiusB/r1: bottom radius of the shape
	 * radiusT/r2: top radius of the shape
	 * tail: length of the tail of the shape
	 * vertices/v: a series of vertices defining the shape
	 * 
	 * @param {Object} shapeInfo properties of the shape to create
	 * @return {o3d.Transform} the parent Transform of the created geometry
	 */
	hemi.shape.create = function(shapeInfo) {
		var transform = null,
			shapeType = shapeInfo.shape,
			color = null,
			material;
		
		if (shapeInfo.mat != null) {
			material = shapeInfo.mat;
			
			var param = material.getParam('lightWorldPos'); 
			if (param) {
				param.bind(hemi.world.camera.light.position);
			}
		} else {
			color = shapeInfo.color;
			
			if (color[3] < 1) {
				material = hemi.shape.transMaterial;
			}
			else {
				material = hemi.shape.material;
			}
		}
		
		switch (shapeType.toLowerCase()) {
			case hemi.shape.BOX:
				transform = hemi.shape.createBox(
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					shapeInfo.depth != null ? shapeInfo.depth :
						shapeInfo.d != null ? shapeInfo.d : 1,
					material);
				break;
			case hemi.shape.CUBE:
				transform = hemi.shape.createCube(
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.SPHERE:
				transform = hemi.shape.createSphere(
					shapeInfo.radius != null ? shapeInfo.radius :
						shapeInfo.r != null ? shapeInfo.r : 1,
					material);
				break;
			case hemi.shape.CYLINDER:
				transform = hemi.shape.createCylinder(
					shapeInfo.radiusB != null ? shapeInfo.radiusB :
							shapeInfo.r1 != null ? shapeInfo.r1 :
							shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.radiusT != null ? shapeInfo.radiusT :
							shapeInfo.r2 != null ? shapeInfo.r2 :
							shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.CONE:
				transform = hemi.shape.createCone(
					shapeInfo.radius != null ? shapeInfo.radius :
							shapeInfo.r != null ? shapeInfo.r : 1,
					shapeInfo.height != null ? shapeInfo.height : 
						shapeInfo.h != null ? shapeInfo.h : 1,
					material);
				break;
			case hemi.shape.ARROW:
				transform = hemi.shape.createArrow(
					shapeInfo.size != null ? shapeInfo.size : 1,
					shapeInfo.tail != null ? shapeInfo.tail : 1,
					material);
				break;
			case hemi.shape.TETRA:
				transform = hemi.shape.createTetra(
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.OCTA:
				transform = hemi.shape.createOcta(
					shapeInfo.size != null ? shapeInfo.size : 1,
					material);
				break;
			case hemi.shape.PYRAMID:
				transform = hemi.shape.createPyramid(
					shapeInfo.height != null ? shapeInfo.height :
						shapeInfo.h != null ? shapeInfo.h : 1,
					shapeInfo.width != null ? shapeInfo.width :
						shapeInfo.w != null ? shapeInfo.w : 1,
					shapeInfo.depth != null ? shapeInfo.depth :
						shapeInfo.d != null ? shapeInfo.d : 1,
					material);
				break;
			case hemi.shape.CUSTOM:
				transform = hemi.shape.createCustom(
					shapeInfo.vertices != null ? shapeInfo.vertices :
						shapeInfo.v != null ? shapeInfo.v : [[0,0,0]],
					material);
				break;
		}
		
		if (transform !== null && color != null) {
			applyColor(transform, color);
		}
		
		return transform;
	};
	
	/**
	 * Create a box.
	 * 
	 * @param {number} h height of box (along y-axis)
	 * @param {number} w width of box (along x-axis)
	 * @param {number} d depth of box (along z-axis)
	 * @param {o3d.Material} material material to use on box
	 * @return {o3d.Transform} the Transform containing the created box
	 */
	hemi.shape.createBox = function(h, w, d, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createBox(pack, material, w, h, d);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a cube.
	 * 
	 * @param {number} size dimensions of cube
	 * @param {o3d.Material} material material to use on cube
	 * @return {o3d.Transform} the Transform containing the created cube
	 */
	hemi.shape.createCube = function(size, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createBox(pack, material, size, size,
				size);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a cylinder.
	 * 
	 * @param {number} r1 Radius at bottom
	 * @param {number} r2 Radius at top
	 * @param {number} h height (along y-axis)
	 * @param {o3d.Material} material material to use on cylinder
	 * @return {o3d.Transform} the Transform containing the created cylinder
	 */
	hemi.shape.createCylinder = function(r1, r2, h, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createTruncatedCone(pack, material, r1,
				r2, h, 24, 1);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a cone.
	 * 
	 * @param {number} r radius of the base
	 * @param {number} h height (along y-axis)
	 * @param {o3d.Material} material material to use on cone
	 * @return {o3d.Transform} the Transform containing the created cone
	 */
	hemi.shape.createCone = function(r, h, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createTruncatedCone(pack, material, r,
					0, h, 24, 1);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a sphere.
	 * 
	 * @param {number} r radius of sphere
	 * @param {o3d.Material} material material to use on sphere
	 * @return {o3d.Transform} the Transform containing the created sphere
	 */
	hemi.shape.createSphere = function(r, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			shape = hemi.core.primitives.createSphere(pack, material, r, 24, 12);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create an arrow.
	 * 
	 * @param {number} size the scale of the arrow head on each axis
	 * @param {number} tail the length of the arrow tail
	 * @param {o3d.Material} material material to use on arrow
	 * @return {o3d.Transform} the Transform containing the created sphere
	 */
	hemi.shape.createArrow = function(size, tail, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			halfSize = size / 2,
			shape = hemi.core.primitives.createPrism(pack, material, [[0, size],
				[-size, 0], [-halfSize, 0], [-halfSize, -tail],
				[halfSize, -tail], [halfSize, 0], [size, 0]], size);
		
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	/**
	 * Create a tetrahedron.
	 * 
	 * @param {number} size size of cube in which tetrahedron will be inscribed
	 * @param {o3d.Material} material material to use on tetrahedron
	 * @return {o3d.Transform} the Transform containing the created tetrahedron
	 */
	hemi.shape.createTetra = function(size, material) {
		var halfSize = size / 2,
			v = [[halfSize, halfSize, halfSize],
				 [-halfSize, -halfSize, halfSize],
				 [-halfSize, halfSize, -halfSize],
				 [halfSize, -halfSize, -halfSize]],
			verts = [[v[0], v[2], v[1]],
					 [v[0], v[1], v[3]],
					 [v[0], v[3], v[2]],
					 [v[1], v[2], v[3]]];
			trans = hemi.shape.createCustom(verts, material);
		
		return trans;
	};
	
	/**
	 * Create a stellated octahedron.
	 * 
	 * @param {number} size size of cube on which octahedron will be inscribed
	 * @param {o3d.Material} material material to use on octahedron
	 * @return {o3d.Transform} the Transform containing the created octahedron
	 */
	hemi.shape.createOcta = function(size, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			t1 = hemi.shape.createTetra(size, material),
			t2 = hemi.shape.createTetra(size, material);
		
		t1.parent = trans;
		t2.parent = trans;
		t2.rotateY(Math.PI/2);
		trans.parent = hemi.shape.root;
		
		return trans;
	};
	
	/**
	 * Create a pyramid.
	 * 
	 * @param {number} h height of pyramid (along z-axis)
	 * @param {number} w width of pyramid (along x-axis)
	 * @param {number} d depth of pyramid (along y-axis)
	 * @param {o3d.Material} material material to use on pyramid
	 * @return {o3d.Transform} the Transform containing the created pyramid
	 */
	hemi.shape.createPyramid = function(h, w, d, material) {
		var halfH = h / 2,
			halfW = w / 2,
			halfD = d / 2,
			v = [[halfW, -halfH, halfD],
				[-halfW, -halfH, halfD],
				[-halfW, -halfH, -halfD],
				[halfW, -halfH, -halfD],
				[0, halfH, 0]];
			verts = [[v[0],v[1],v[2]],
					 [v[0],v[2],v[3]],
					 [v[1],v[0],v[4]],
					 [v[2],v[1],v[4]],
					 [v[3],v[2],v[4]],
					 [v[0],v[3],v[4]]];
			trans = hemi.shape.createCustom(verts, material);
		
		return trans;
	};
	
	/**
	 * Create a custom shape from a list of vertices.
	 * 
	 * @param {number[3][3][]} verts list of triples of xyz coordinates. Each
	 *     triple represents a polygon, with the normal determined by right-hand
	 *     rule (i.e. polygon will be visible from side from which vertices are
	 *     listed in counter-clockwise order).
	 * @param {o3d.Material} material material to apply to custom shape. Note -
	 *     UV mapping is a simple [0,0],[0,1],[1,0], so most complicated
	 *     textures will not look good
	 * @return {o3d.Transform} the Transform containing the created custom shape
	 */
	hemi.shape.createCustom = function(verts, material) {
		var pack = hemi.shape.pack,
			trans = pack.createObject('Transform'),
			vertexInfo = hemi.core.primitives.createVertexInfo(),
			positionStream = vertexInfo.addStream(3, o3djs.base.o3d.Stream.POSITION),
			normalStream = vertexInfo.addStream(3, o3djs.base.o3d.Stream.NORMAL),
			texCoordStream = vertexInfo.addStream(2, o3djs.base.o3d.Stream.TEXCOORD, 0);

		for (var i = 0, il = verts.length; i < il; i++) {
			var normal = hemi.core.math.cross(
				hemi.core.math.normalize([verts[i][1][0] - verts[i][0][0],
										  verts[i][1][1] - verts[i][0][1],
										  verts[i][1][2] - verts[i][0][2]]),
				hemi.core.math.normalize([verts[i][2][0] - verts[i][0][0],
										  verts[i][2][1] - verts[i][0][1],
										  verts[i][2][2] - verts[i][0][2]]));
			positionStream.addElementVector(verts[i][0]);
			normalStream.addElementVector(normal);
			texCoordStream.addElement(0, 1);
			positionStream.addElementVector(verts[i][1]);
			normalStream.addElementVector(normal);
			texCoordStream.addElement(1, 0);
			positionStream.addElementVector(verts[i][2]);
			normalStream.addElementVector(normal);
			texCoordStream.addElement(0, 0);
			vertexInfo.addTriangle(i*3,i*3+1,i*3+2);
		}
		
		var shape = vertexInfo.createShape(pack, material);
		trans.parent = hemi.shape.root;
		trans.addShape(shape);
		
		return trans;
	};
	
	// Internal functions
	
	/*
	 * Apply the given color to the given transform.
	 * 
	 * @param {o3d.Transform} transform transform to apply color to
	 * @param {number[4]} color RGBA color to apply
	 */
	var applyColor = function(transform, color) {
		var children = transform.children,
			param = transform.getParam('diffuse');
		
		if (param === null) {
			param = transform.createParam('diffuse', 'o3d.ParamFloat4');
		}
		
		param.value = color;
		
		for (var i = 0, il = children.length; i < il; i++) {
			applyColor(children[i], color);
		}
	};
	
	/*
	 * Remove the given transform and any child transforms or shapes from the
	 * shape pack.
	 * 
	 * @param {o3d.Transform} transform transform to destroy
	 */
	var destroyTransform = function(transform) {
		var children = transform.children,
			shapes = transform.shapes;
		
		transform.parent = null;
		
		for (var i = 0, il = children.length; i < il; i++) {
			destroyTransform(children[i]);
		}
		
		for (var i = 0, il = shapes.length; i < il; i++) {
			hemi.shape.pack.removeObject(shapes[i]);
		}
		
		hemi.shape.pack.removeObject(transform);
	};
	
	return hemi;
})(hemi || {});/* 
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

	hemi.fx = hemi.fx || {};

	/**
	 * 	{
	 *		type      : string ->
	 *			'texture','phong','lambert','basic','custom'
	 *		color     : float4
	 * 		color1    : float4
	 *      color2    : float4
	 * 		diffuse   : [float4 | url]
	 *		ambient   : [float4 | url]
	 *		emissive  : [float4 | url]
	 *		shader    : [string | url]
	 *		opacity   : float
	 *      light     : boolean (light object?)
	 *		wireframe : boolean
	 *		specular  : float4
	 *		shininess : float
	 *		texture   : url
	 *		texture1  : url
	 *		texture2  : url
	 *      weight    : float
	 *		normalmap : url
	 *      fog       : boolean
	 *	}
	 *
	 */
	
	/**
	 * Add parameters to the given Material that will allow the user to define a
	 * fog effect for it. The returned object will have these parameters:
	 * color: array of floats defining fog color in RGBA format
	 * start: float defining distance from the camera that fog starts
	 * end: float defining distance from the camera that fog becomes opaque
	 * 
	 * @param {o3d.Material} material the Material to create opacity for
	 * @return {Object} an object containing the ParamObjects listed above
	 */
	hemi.fx.addFog = function(material) {
		// get the source
		var gl = material.gl,
			program = material.effect.program_,
			shad = hemi.utils.getShaders(material),
			fragShd = shad.fragShd,
			fragSrc = shad.fragSrc,
			vertShd = shad.vertShd,
			vertSrc = shad.vertSrc;
		
		// modify the shaders
		if (vertSrc.search('fog') < 0) {
			var vertHdr =
					'uniform float fogStart;\n' +
					'uniform float fogEnd;\n' +
					'varying float fogAlpha;\n',
				vertSprt =
					'void setFogAlpha(float z) {\n' +
					'  fogAlpha = (z - fogStart)/(fogEnd - fogStart);\n' +
					'  fogAlpha = clamp(fogAlpha,0.0,1.0);\n' +
					'}\n';
				vertGlob =
					'setFogAlpha(gl_Position.z);\n';
			
			vertSrc = hemi.utils.combineVertSrc(vertSrc, {
				postHdr: vertHdr,
				postSprt: vertSprt,
				postGlob: vertGlob
			});
			gl.detachShader(program, vertShd);
			material.effect.loadVertexShaderFromString(vertSrc);
		}
		if (fragSrc.search('fog') < 0) {
			var fragHdr =
					'uniform vec4 fogColor;\n' +
					'varying float fogAlpha;\n',
				fragGlob =
					'gl_FragColor = mix(gl_FragColor, fogColor, fogAlpha);\n';
			
			fragSrc = hemi.utils.combineFragSrc(fragSrc, {
				postHdr: fragHdr,
				postGlob: fragGlob
			});
			gl.detachShader(program, fragShd);
			material.effect.loadPixelShaderFromString(fragSrc);
		}
		
		material.effect.createUniformParameters(material);
		return {
			start: material.getParam('fogStart'),
			end: material.getParam('fogEnd'),
			color: material.getParam('fogColor')
		};
	};
	
	/**
	 * Add an opacity parameter to the given Material that will allow
	 * transparency to be set for it. Transparency ranges from 0.0 to 1.0.
	 * 
	 * @param {o3d.Material} material the Material to create opacity for
	 * @return {o3d.ParamObject} a ParamObject linked to opacity
	 */
	hemi.fx.addOpacity = function(material) {
		// get the source
		var gl = material.gl,
			program = material.effect.program_,
			shad = hemi.utils.getShaders(material),
			fragShd = shad.fragShd,
			fragSrc = shad.fragSrc;
		
		// modify the pixel shader
		if (fragSrc.search('opacity') < 0) {
			var fragHdr = 'uniform float opacity;\n',
				fragGlob = 'gl_FragColor.a *= opacity;\n';
			
			fragSrc = hemi.utils.combineFragSrc(fragSrc, {
				postHdr: fragHdr,
				postGlob: fragGlob
			});
			gl.detachShader(program, fragShd);
			material.effect.loadPixelShaderFromString(fragSrc);
			
			material.effect.createUniformParameters(material);
			material.getParam('o3d.drawList').value = hemi.view.viewInfo.zOrderedDrawList;
		}
		
		
		var opacity = material.getParam('opacity');
		opacity.value = 1.0;		
		
		return opacity;
	};
	
	/*
	 * The following functions may be out-dated and need some work before using.
	 */
	
	hemi.fx.create = function(spec,callback) {
		switch (spec.type) {
			case 'constant':
				if (spec.texture) {
					return hemi.fx.createConstantTexture(spec.texture, callback);
				} else {
					callback(hemi.core.material.createConstantMaterial(
						hemi.core.mainPack,
						hemi.view.viewInfo,
						spec.color,
						spec.color[3] < 1));
					return;
				}
				break;
			case 'basic':
				if (spec.texture) {
					return hemi.fx.createBasicTexture(spec.texture, callback);
				} else {
					callback(hemi.core.material.createBasicMaterial(
						hemi.core.mainPack,
						hemi.view.viewInfo,
						spec.color,
						spec.color[3] < 1));
					return;
				}
				break;
		}
	};
	
	hemi.fx.modify = function(material, spec) {
		switch (spec.type) {
			case 'constant':
				material.effect = null;
				var diffuseParam = material.getParam('diffuseSampler');
				if (diffuseParam) {
					var paramSampler = material.createParam('emissiveSampler', 'ParamSampler');
					paramSampler.value = diffuseParam.value;
					material.removeParam(diffuseParam);
				}
				o3djs.material.attachStandardEffect(
					hemi.core.mainPack,
					material,
					hemi.view.viewInfo,
					'constant');
				return material;
				break;
		}
	};
	
	hemi.fx.createConstantTexture = function(path, callback) {
		var url = o3djs.util.getCurrentURI() + path;
		var material;
		hemi.core.io.loadTexture(hemi.core.mainPack,url,function(texture, e) {
			if (e) {
				alert(e);
			} else {
				material = hemi.core.material.createConstantMaterial(
					hemi.core.mainPack,
					hemi.view.viewInfo,
					texture);
				callback(material);
			}
		});
	};
	
	hemi.fx.createBasicTexture = function(path, callback) {
		var url = o3djs.util.getCurrentURI() + path;
		var material;
		hemi.core.io.loadTexture(hemi.core.mainPack,url,function(texture, e) {
			if (e) {
				alert(e);
			} else {
				material = hemi.core.material.createBasicMaterial(
					hemi.core.mainPack,
					hemi.view.viewInfo,
					texture);
				callback(material);
			}
		});
	};
	
	return hemi;
})(hemi || {});/* 
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
	 * @namespace A module for texture set management, specifically designed
	 * to handle shader sampling and texture maps.  An o3d.Material will have
	 * a parameter that is a sampler when a material is using a texture.  The
	 * paramter is either an emmissive, or diffuse sampler.  This module makes
	 * easy to swap textures dynamically on Models.  See the lighting sample.
	 */
	hemi.texture = hemi.texture || {};

	/**
	 * @class A TestureSampler contains a texture URL and a value.  The value is
	 * the o3d.Sampler which can be assigned to a shader's sampler parameter.
	 * 
	 * @param {string} url the texture URL
	 */
	hemi.texture.TextureSampler = function(url) {
		/**
		 * The url of the texture image file
		 * @type string
		 * @default ''
		 */
		this.textureURL = url || '';
		this.value = hemi.core.mainPack.createObject('Sampler');
	};

	/**
	 * @class A TextureSet can manage TextureSamplers that are part of a set as
	 * defined by the author.  It will handle loading them and notify the author
	 * upon completion.
	 * 
	 * @param {number} count number of TextureSamplers in the set
	 * @param {function(Object):void} opt_callback callback to receive loaded
	 *     TextureSamplers
	 */
	hemi.texture.TextureSet = function(count, opt_callback) {
		/**
		 * An object literal that maps a given name for the TextureSampler to
		 * its instance for easy access.
		 * @type Object
		 * @default
		 */
		this.samplers = { length: 0 };
		/**
		 * The total number of TextureSamplers in this set.
		 * @type number
		 * @default 0
		 */
		this.count = count || 0;
		this.callback = opt_callback || function() {};
	};

	hemi.texture.TextureSet.prototype = {
		/**
		 * Add a named texture file at the given url to this set.
		 *
		 * @param {string} name the name for the texture
		 * @param {string} url the url of the image
		 */
		addTexture: function(name, url) {
			this.count++;
			this.loadTexture(name, url);
		},
		/**
		 * Add the given TextureSampler to this set.
		 *
		 * @param {string} name the name of the TextureSampler
		 * @param {hemi.texture.TextureSampler} texSampler the TextureSampler
		 */
		addTextureSampler: function(name, texSampler) {
			this.count++;

			if (!texSampler.value.texture) {
				this.loadTextureSampler(texSampler);
			}

			this.samplers[name] = texSampler;
		},
		/**
		 * Get the TextureSampler with the name in this set.
		 *
		 * @param {string} name the name it was given when added.
		 * @return {hemi.texture.TextureSampler} the TextureSampler
		 */
		getTextureSampler: function(name) {
			return this.samplers[name];
		},
		/**
		 * Get the O3D Sampler from the named TextureSampler
		 *
		 * @param {string} name the name of the TextureSampler
		 * @return {o3d.Sampler} the O3D sampler
		 */
		getSamplerValue: function(name) {
			return this.samplers[name].value;
		},
		/**
		 * Load a texture from the given url and associate it in this set with
		 * the given name.
		 *
		 * @param {string} name the name of the texture
		 * @param {string} url the url to load the image from
		 */
		loadTexture: function(name, url) {
			var texSampler = new hemi.texture.TextureSampler(url);
			this.samplers[name] = texSampler;
			this.loadTextureSampler(texSampler);
		},
		/**
		 * Load a TextureSampler's texture image file and set the texture on the
		 * value, which is an O3D Sampler, once loaded.
		 *
		 * @param {hemi.texture.TextureSampler} texSampler the TextureSampler to
		 *     load and set the texture on
		 */
		loadTextureSampler: function(texSampler) {
			hemi.loader.loadTexture(texSampler.textureURL,
				function(texture) {
					texSampler.value.texture = texture;
					this.samplers.length++;

					if (this.samplers.length === this.count) {
						this.callback(this.samplers);
					}
				}, this);
		}
	};

	/**
	 * Create multiple texture sets using a simple object literal that maps
	 * distinct meaningful names to the urls of the images.
	 *
	 * @param {Object} urls An object literal with properties of urls to load
	 *     into the set
	 * @param {function(Object):void} callback a function to call and pass the
	 *     samplers
	 * @return {hemi.texture.TextureSet} the TextureSet
	 */
	hemi.texture.createTextureSet = function(urls, callback) {
		var urls = urls || {},
			count = 0,
			texSet;

		if (typeof Object.keys === 'function') {
			count = Object.keys(urls).length;
		} else {
			for (var p in urls) {
				if (urls.hasOwnProperty(p)) count++;
			}
		}

		texSet = new hemi.texture.TextureSet(count, callback);

		for (var name in urls) {
			texSet.loadTexture(name, urls[name]);
		}

		return texSet;
	};
	
	/**
	 * Get the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element from which to extract uv
	 *     coordinates
	 * @return {Object} {field: Field object used to reapply coordinates,
	 *				     uv: Float array of uv coordinates}
	 */
	hemi.texture.getUV = function(element) {
		var stream = element.streamBank.getVertexStream(hemi.core.o3d.Stream.TEXCOORD,0);
		return stream?{field:stream.field,
					   uv:stream.field.getAt(0,element.numberVertices)}:null;
	};
	
	hemi.texture.reportUV = function(element) {
		var uv = hemi.texture.getUV(element).uv;
		console.log(element);
		for (var i = 0; i < uv.length; i+=3) {
			console.log(uv[i] + ',' + uv[i+1] + ',' + uv[i+2]);
		}
	};
	
	/**
	 * Scale the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element to scale the texture on
	 * @param {number} x Amount to scale by along x-axis
	 * @param {number} y Amoung to scale by along y-axis
	 */
	hemi.texture.scale = function(element,x,y) {
		var set = hemi.texture.getUV(element);
		for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
			set.uv[i] *= x;
			set.uv[i+1] *= y;
		}
		set.field.setAt(0,set.uv);
	};

	/**
	 * Translate the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element to translate the texture on
	 * @param {number} x Distance to translate along x-axis
	 * @param {number} y Distance to translate along y-axis
	 */	
	hemi.texture.translate = function(element,x,y) {
		var set = hemi.texture.getUV(element);
		for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
			set.uv[i] += x;
			set.uv[i+1] += y;
		}	
		set.field.setAt(0,set.uv);
	};

	/**
	 * Rotate the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element to rotate the texture on
	 * @param {number} theta Radians to rotate texture, counter-clockwise
	 */	
	hemi.texture.rotate = function(element,theta) {
		var set = hemi.texture.getUV(element);
		for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
			var x = set.uv[i];
			var y = set.uv[i+1];
			set.uv[i] = x*Math.cos(theta) - y*Math.sin(theta);
			set.uv[i+1] = x*Math.sin(theta) + y*Math.cos(theta);
		}	
		set.field.setAt(0,set.uv);	
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
	 * @namespace A module for creating timers that can be used for scripting
	 * and behavior.
	 */	
	hemi.time = hemi.time || {};
	
	/**
	 * @class A Timer is a simple countdown timer that can be used to script
	 * behavior and sequence events.
	 * @extends hemi.world.Citizen
	 */
	hemi.time.Timer = hemi.world.Citizen.extend({
		init: function() {
			this._super();
		
			/*
			 * The epoch time that this Timer was last started (or resumed)
			 * @type number
			 */
			this._started = null;
			/*
			 * The elapsed time (not including any currently running JS timer)
			 * @type number
			 */
			this._time = 0;
			/*
			 * The id of the current JS timer
			 * @type number
			 */
			this._timeId = null;
			/**
			 * The time the timer will start counting down from (milliseconds).
			 * @type number
			 * @default 1000
			 */
			this.startTime = 1000;
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         * @string
         */
        citizenType: 'hemi.time.Timer',
		
		/**
		 * Send a cleanup Message and remove all references in the Timer.
		 */
		cleanup: function() {
			this._super();
			
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				this._started = null;
			}
		},
		
		/**
		 * Pause the Timer if it is currently running.
		 */
		pause: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				
				var stopped = (new Date()).getTime();
				this._time += (stopped - this._started);
			}
		},
		
		/**
		 * Reset the Timer so it is ready to count down again.
		 */
		reset: function() {
			this._started = null;
			this._time = 0;
			this._timeId = null;
		},
		
		/**
		 * Resume the Timer's count down if it is currently paused.
		 */
		resume: function() {
			if (this._timeId === null && this._started !== null) {
				this._timeId = setTimeout(handleTimeout,
					this.startTime - this._time, this);
				this._started = (new Date()).getTime();
			}
		},
		
		/**
		 * Start the Timer's count down. If it is currently running, restart the
		 * Timer from its initial count down value.
		 */
		start: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
			}
			
			this._time = 0;
			this.send(hemi.msg.start, {
				time: this.startTime
			});
			this._timeId = setTimeout(handleTimeout, this.startTime, this);
			this._started = (new Date()).getTime();
		},
		
		/**
		 * Stop the Timer if it is currently running or paused. This resets any
		 * currently elapsed time on the Timer.
		 */
		stop: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				var stopped = (new Date()).getTime();
				this._time += (stopped - this._started);
			}
			
			if (this._started !== null) {
				var elapsed = this._time;
				this.reset();
				this.send(hemi.msg.stop, {
					time: elapsed
				});
			}
		},
		
		/**
		 * Get the Octane structure for the Timer.
	     *
	     * @return {Object} the Octane structure representing the Timer
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.push({
				name: 'startTime',
				val: this.startTime
			});
			
			return octane;
		}
	});
	
	hemi.time.Timer.prototype.msgSent =
		hemi.time.Timer.prototype.msgSent.concat([hemi.msg.start, hemi.msg.stop]);
	
	/*
	 * Utility to handle the Timer naturally finishing its countdown.
	 */
	var handleTimeout = function(timer) {
		timer.reset();
		timer.send(hemi.msg.stop, {
			time: timer.startTime
		});
	};
	
	return hemi;
})(hemi || {});
