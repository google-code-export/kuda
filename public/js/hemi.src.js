/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

Detector = {

	canvas : !! window.CanvasRenderingContext2D,
	webgl : ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
	workers : !! window.Worker,
	fileapi : window.File && window.FileReader && window.FileList && window.Blob,

	getWebGLErrorMessage : function () {

		var domElement = document.createElement( 'div' );

		domElement.style.fontFamily = 'monospace';
		domElement.style.fontSize = '13px';
		domElement.style.textAlign = 'center';
		domElement.style.background = '#eee';
		domElement.style.color = '#000';
		domElement.style.padding = '1em';
		domElement.style.width = '475px';
		domElement.style.margin = '5em auto 0';

		if ( ! this.webgl ) {

			domElement.innerHTML = window.WebGLRenderingContext ? [
				'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br />',
				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
			].join( '\n' ) : [
				'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation">WebGL</a>.<br/>',
				'Find out how to get it <a href="http://get.webgl.org/">here</a>.'
			].join( '\n' );

		}

		return domElement;

	},

	addGetWebGLMessage : function ( parameters ) {

		var parent, id, domElement;

		parameters = parameters || {};

		parent = parameters.parent !== undefined ? parameters.parent : document.body;
		id = parameters.id !== undefined ? parameters.id : 'oldie';

		domElement = Detector.getWebGLErrorMessage();
		domElement.id = id;

		parent.appendChild( domElement );

	}

};
/**
 * Copyright 2009 Tim Down.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Hashtable=(function(){var w="undefined",f="function",k="string",j="equals",t="hashCode",o="toString";var r=(typeof Array.prototype.splice==f)?function(y,x){y.splice(x,1)}:function(A,z){var y,B,x;if(z===A.length-1){A.length=z}else{y=A.slice(z+1);A.length=z;for(B=0,x=y.length;B<x;++B){A[z+B]=y[B]}}};function v(y){var x;if(typeof y==k){return y}else{if(typeof y[t]==f){x=y.hashCode();return(typeof x==k)?x:v(x)}else{if(typeof y[o]==f){return y.toString()}else{return String(y)}}}}function s(x,y){return x.equals(y)}function b(x,y){return(typeof y[j]==f)?y.equals(x):(x===y)}function d(x){return function(y){if(y===null){throw new Error("null is not a valid "+x)}else{if(typeof y==w){throw new Error(x+" must not be undefined")}}}}var g=d("key"),c=d("value");function i(y,z,x){this.entries=[];this.addEntry(y,z);if(x!==null){this.getEqualityFunction=function(){return x}}}var a=0,l=1,h=2;function p(x){return function(z){var y=this.entries.length,B,A=this.getEqualityFunction(z);while(y--){B=this.entries[y];if(A(z,B[0])){switch(x){case a:return true;case l:return B;case h:return[y,B[1]]}}}return false}}function u(x){return function(A){var B=A.length;for(var z=0,y=this.entries.length;z<y;++z){A[B+z]=this.entries[z][x]}}}i.prototype={getEqualityFunction:function(x){return(typeof x[j]==f)?s:b},getEntryForKey:p(l),getEntryAndIndexForKey:p(h),removeEntryForKey:function(y){var x=this.getEntryAndIndexForKey(y);if(x){r(this.entries,x[0]);return x[1]}return null},addEntry:function(x,y){this.entries[this.entries.length]=[x,y]},keys:u(0),values:u(1),getEntries:function(y){var A=y.length;for(var z=0,x=this.entries.length;z<x;++z){y[A+z]=this.entries[z].slice(0)}},containsKey:p(a),containsValue:function(y){var x=this.entries.length;while(x--){if(y===this.entries[x][1]){return true}}return false}};function q(){}q.prototype=[];function e(A,x){var y=A.length,z;while(y--){z=A[y];if(x===z[0]){return y}}return null}function n(y,x){var z=y[x];return(z&&(z instanceof q))?z[1]:null}function m(A,x){var B=this;var E=[];var y={};var C=(typeof A==f)?A:v;var z=(typeof x==f)?x:null;this.put=function(I,K){g(I);c(K);var F=C(I),J,H,G=null;var L=n(y,F);if(L){H=L.getEntryForKey(I);if(H){G=H[1];H[1]=K}else{L.addEntry(I,K)}}else{J=new q();J[0]=F;J[1]=new i(I,K,z);E[E.length]=J;y[F]=J}return G};this.get=function(H){g(H);var F=C(H);var I=n(y,F);if(I){var G=I.getEntryForKey(H);if(G){return G[1]}}return null};this.containsKey=function(G){g(G);var F=C(G);var H=n(y,F);return H?H.containsKey(G):false};this.containsValue=function(G){c(G);var F=E.length;while(F--){if(E[F][1].containsValue(G)){return true}}return false};this.clear=function(){E.length=0;y={}};this.isEmpty=function(){return !E.length};var D=function(F){return function(){var G=[],H=E.length;while(H--){E[H][1][F](G)}return G}};this.keys=D("keys");this.values=D("values");this.entries=D("getEntries");this.remove=function(I){g(I);var G=C(I),F,H=null;var J=n(y,G);if(J){H=J.removeEntryForKey(I);if(H!==null){if(!J.entries.length){F=e(E,G);r(E,F);y[G]=null;delete y[G]}}}return H};this.size=function(){var G=0,F=E.length;while(F--){G+=E[F][1].entries.length}return G};this.each=function(I){var F=B.entries(),G=F.length,H;while(G--){H=F[G];I(H[0],H[1])}};this.putAll=function(N,I){var H=N.entries();var K,L,J,F,G=H.length;var M=(typeof I==f);while(G--){K=H[G];L=K[0];J=K[1];if(M&&(F=B.get(L))){J=I(L,F,J)}B.put(L,J)}};this.clone=function(){var F=new m(A,x);F.putAll(B);return F}}return m})();/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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
	 * The "best" way to test if a value is a function or not.
	 *
	 * @param {Object} val value to test
	 * @return {boolean} true if the value is a function
	 */
	hemi.utils.isFunction = function(val) {
		return Object.prototype.toString.call(val) === '[object Function]';
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
	 * Perform linear interpolation on the given values. Values can be numbers
	 * or arrays or even nested arrays (as long as their lengths match).
	 * 
	 * @param {number} a first number (or array of numbers) for interpolation
	 * @param {number} v second number (or array of numbers) for interpolation
	 * @param {number} t coefficient for interpolation (usually time)
	 * @return {number} the interpolated number (or array of numbers)
	 */
	hemi.utils.lerp = function(a, b, t) {
		var ret;
		
		if (hemi.utils.isArray(a)) {
			ret = [];
			
			for (var i = 0; i < a.length; ++i) {
				ret[i] = hemi.utils.lerp(a[i], b[i], t);
			}
		} else {
			ret = a + (b - a) * t;
		}
		
		return ret;
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

	/**
	 * Convert an angle from radians to degrees
	 * @param {number} radians an angle
	 * @return {number} the angle in degrees
	 */
	hemi.utils.radToDeg = function(radians) {
  		return radians * 180 / Math.PI;
	};
	
	return hemi;
})(hemi || {});
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
	hemi.utils.getShaders = function(client, material) {
		var gl = client.renderer.context,
			program = material.program,
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
			bodyEnd = src.lastIndexOf(global),
			globEnd = src.lastIndexOf('}');
		
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
	hemi.utils.pointAsLocal = function(transform, point) {
		var inv = new THREE.Matrix4().getInverse(transform.matrixWorld);
	    return inv.multiplyVector3(point.clone());
	};
	
	/**
	 * Interprets a point in local space into world space.
	 */
	hemi.utils.pointAsWorld = function(transform, point) {
		return transform.matrixWorld.multiplyVector3(point.clone());
	};
	
	/**
	 * Point the y axis of the given matrix toward the given point.
	 *
	 * @param {THREE.Matrix4} matrix the matrix to rotate
	 * @param {number[]} eye XYZ point from which to look (may be the origin)
	 * @param {number[]} target XYZ point at which to aim the y axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointYAt = function(matrix, eye, target) {
		var dx = target[0] - eye[0],
			dy = target[1] - eye[1],
			dz = target[2] - eye[2],
			dxz = Math.sqrt(dx*dx + dz*dz),
			rotY = Math.atan2(dx,dz),
			rotX = Math.atan2(dxz,dy);
		
//		tran.rotation.y += rotY;
//		tran.rotation.x += rotX;
//		tran.updateMatrix();
		matrix.rotateX(rotX);
		matrix.rotateY(rotY);
		
		return matrix;
	};
	
	/**
	 * Point the z axis of the given transform toward the given point.
	 *
	 * @param {THREE.Object3D} tran the transform to rotate
	 * @param {THREE.Vector3} eye XYZ point from which to look (may be the origin)
	 * @param {THREE.Vector3} target XYZ point at which to aim the z axis
	 * @return {THREE.Object3D} the rotated transform
	 */
	hemi.utils.pointZAt = function(tran, eye, target) {
		var delta = new THREE.Vector3().sub(target, eye),
			rotY = Math.atan2(delta.x, delta.z),
			rotX = -Math.asin(delta.y / delta.length());
		
		tran.rotation.y += rotY;
		tran.rotation.x += rotX;
		tran.updateMatrix();
		
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

    hemi.utils.identity = function(object3d) {
        object3d.position = new THREE.Vector3(0, 0, 0);
        object3d.rotation = new THREE.Vector3(0, 0, 0);
        object3d.scale = new THREE.Vector3(1, 1, 1);
        object3d.updateMatrix();
    }
	
	return hemi;
})(hemi || {});
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
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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
	hemi.console.setEnabled(true);
	
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
			numClients = hemi.clients.length;
		
		for (var i = 0; i < elements.length; ++i) {
			var element = elements[i];
			
			if (element.id && element.id.match(/^kuda/)) {
				var renderer = getRenderer(element);
				
				if (renderer) {
					var client = i < numClients ? hemi.clients[i] : new hemi.Client();
					
					element.appendChild(renderer.domElement);
					client.setRenderer(renderer);
				}
			}
		}
		
		hemi.init();
		return hemi.clients;
	};

	/**
	 * Initialize hemi features. This does not need to be called if
	 * hemi.makeClients() is called, but it can be used on its own if you don't
	 * want to use hemi's client system.
	 */
	hemi.init = function() {
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
		resetCB = null,
		taskCount = 1,
	
		decrementTaskCount = function() {
			if (--taskCount === 0) {
				taskCount = 1;
				hemi.send(hemi.msg.ready, {});

				if (resetCB) {
					resetCB();
					resetCB = null;
				}
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
	hemi.loadOctane = function(url, opt_callback) {
		url = getPath(url);
		++taskCount;

		hemi.utils.get(url, function(data, status) {
			decrementTaskCount();

			if (data == null) {
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
	
	return hemi;
})(hemi || {});
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
		 * Get the Citizen's id.
		 * 
		 * @return {number} the id
		 */        
        _getId = function() {
        	return this._worldId;
        },
		
		/*
		 * Set the Citizen's id.
		 * 
		 * @param {number} id the id to set
		 */
        _setId = function(id) {
        	var oldId = this._worldId;
			this._worldId = id;
			
			if (oldId !== null) {
				hemi.world.citizens.remove(oldId);
				hemi.world.citizens.put(id, this);
			}
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
			return hemi.dispatch.registerTarget(this._worldId, type, handler,
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
			return hemi.dispatch.registerTarget(this._worldId, hemi.dispatch.WILDCARD,
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
				src: this._worldId,
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
			msgs = opts.msgs || [];
		
		msgs.push(hemi.msg.cleanup);

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

        Citizen.prototype._getId = _getId;
        Citizen.prototype._setId = _setId;
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
	 * Perform cleanup on the World and release all resources. This effectively
	 * resets the World.
	 */
	hemi.world.cleanup = function() {
		hemi.resetLoadTasks();
		hemi.send(hemi.msg.cleanup, {});
		
		hemi.world.citizens.each(function(key, value) {
			value.cleanup();
		});
		
		if (hemi.world.citizens.size() > 0) {
			hemi.console.log('World cleanup did not remove all citizens.', hemi.console.ERR);
		}
		
		nextId = 1;
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
			citizens: []
		};
		
		this.citizens.each(function(key, value) {
			var accept = opt_filter ? opt_filter(value) : true;
			
			if (accept) {
				var oct = value._toOctane();
				
				if (oct !== null) {
					octane.citizens.push(oct);
				} else {
					hemi.console.log('Null Octane returned by Citizen with id ' + value.getId(), hemi.console.WARN);
				}
			}
		});
		
		octane.dispatch = hemi.dispatch._toOctane();
		
		return octane;
	};
	
	return hemi;
})(hemi || {});
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
	
		/**
		 * Create an object from the given Octane structure and set its id. No other
		 * properties will be set yet.
		 * 
		 * @param {Object} octane the structure containing information for creating
		 *     an object
		 * @return {Object} the newly created object
		 */
	var createObject = function(octane) {
			if (!octane.type) {
				alert("Unable to process octane: missing type");
				return null;
			}
			
			var con = constructors[octane.type],
				object = null;

			if (con) {
				object = new con();

				if (octane.id !== undefined) {
					object._setId(octane.id);
				}
			} else {
				hemi.console.log('Cannot find constructor for type: ' + octane.type, hemi.console.ERR);
			}
			
			return object;
		},
	
		parseProps = function(obj, propNames) {
			var oct = [];
			
			for (var i = 0; i < propNames.length; ++i) {
				var name = propNames[i],
					prop = obj[name],
					entry = {
						name: name	
					};
				
				if (hemi.utils.isFunction(prop)) {
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
		},

		/*
		 * Iterate through the given Octane structure and set properties for the
		 * given object. Properties stored by value will be set directly, by Octane
		 * will be recursively created, by id will be retrieved from the World, and
		 * by arg will be set by calling the specified function on the object.
		 * 
		 * @param {Object} object the object created from the given Octane
		 * @param {Object} octane the structure containing information about the
		 *     given object
		 */
		setProperties = function(object, octane) {
			for (var ndx = 0, len = octane.props.length; ndx < len; ndx++) {
				var property = octane.props[ndx];
				var name = property.name;
				
				if (property.oct !== undefined) {
					if (property.oct instanceof Array) {
						value = [];
						
						for (var p = 0, pLen = property.oct.length; p < pLen; p++) {
							var child = createObject(property.oct[p]);
							setProperties(child, property.oct[p]);
							value.push(child);
						}
					} else {
						value = createObject(property.oct);
						setProperties(value, property.oct);
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
		},

		constructors = {};
	
	/**
	 * Restore the original object from the given Octane.
	 * 
	 * @param {Object} octane the structure containing information for creating
	 *     the original object
	 * @return {Object} the created object
	 */
	hemi.fromOctane = function(octane) {
		var created = null;

		if (octane.type) {
			created = createObject(octane);
			setProperties(created, octane);
		} else {
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
				createObject(citOctane);
			}
			
			// Now set the World nextId to its proper value.
			hemi.world.setNextId(octane.nextId);
			
			// Next set up the message dispatch
			var entryOctane = octane.dispatch.ents,
				entries = [];
			
			for (var ndx = 0, len = entryOctane.length; ndx < len; ndx++) {
				var entry = createObject(entryOctane[ndx]);
				setProperties(entry, entryOctane[ndx]);
				entries.push(entry);
			}
			
			hemi.dispatch.loadEntries(entries);
			hemi.dispatch.setNextId(octane.dispatch.nextId);
			
			// Now set Citizen properties and resolve references to other Citizens
			for (var ndx = 0; ndx < citizenCount; ndx++) {
				var citOctane = octane.citizens[ndx];
				setProperties(hemi.world.getCitizenById(citOctane.id), citOctane);
			}
		}

		return created;
	};
	
	hemi.makeOctanable = function(clsCon, clsName, octProps) {
		octProps = octProps || [];
		
		constructors[clsName] = clsCon;
		
		/*
         * Essentially a class name.
         * @type string
         */
		clsCon.prototype._citizenType = clsName;
		
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
				props: hemi.utils.isFunction(octProps) ? octProps.call(this) : parseProps(this, octProps)
			};
        	
        	if (this._worldId != null) {
        		octane.id = this._worldId;
        	}
			
			if (this.name && this.name.length > 0 && !octane.props.name) {
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

	hemi.makeOctanable(hemi.dispatch.MessageSpec, 'hemi.dispatch.MessageSpec',
		function() {
			var targetsOct = [];
			
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				var oct = this.targets[ndx]._toOctane();
				
				if (oct !== null) {
					targetsOct.push(oct);
				} else {
					hemi.console.log('Null Octane returned by MessageTarget', hemi.console.ERR);
				}
			}
			
			return [
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
		});
	
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
		this._dispatchId = null;
		
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
		}
	};

	hemi.makeOctanable(hemi.dispatch.MessageTarget, 'hemi.dispatch.MessageTarget',
		function() {
			if (!this.handler._getId) {
				hemi.console.log('Handler object in MessageTarget can not be saved to Octane', hemi.console.WARN);
				return null;
			}
			
			var names = ['_dispatchId', 'name', 'func', 'args'],
				oct = [
					{
						name: 'handler',
						id: this.handler._getId()
					}
				];
			
			for (var ndx = 0, len = names.length; ndx < len; ndx++) {
				var name = names[ndx];
				
				oct.push({
					name: name,
					val: this[name]
				});
			}
			
			return oct;
		});
	
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
	hemi.dispatch._toOctane = function() {
		var octane = {
			nextId: nextId,
			ents: []
		};
		
		this.msgSpecs.each(function(key, value) {
			var oct = value._toOctane();
			
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
					add = result._dispatchId === dispatchId;
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
			dispatchId = target._dispatchId;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx],
				targets = spec.targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				if (targets[t]._dispatchId === dispatchId) {
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
		msgTarget._dispatchId = this.getNextId();
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
			id = src._getId();
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
		_getId: function() {
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
	/**
	 * @namespace A module for handling all keyboard and mouse input.
	 */
	hemi.input = hemi.input || {};
	
	hemi.input.mouseDownListeners = [];
	hemi.input.mouseUpListeners = [];
	hemi.input.mouseMoveListeners = [];
	hemi.input.mouseWheelListeners = [];
	hemi.input.keyDownListeners = [];
	hemi.input.keyUpListeners = [];
	hemi.input.keyPressListeners = [];
	
	/**
	 * Setup the listener lists and register the event handlers.
	 */
	hemi.input.init = function(canvas) {
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
            this.panTilt = new THREE.Object3D();
            this.panTilt.name = 'panTilt';
            this.panTilt.eulerOrder = 'ZYX';
            this.cam = new THREE.Object3D();
            this.cam.name = 'cam';
            this.panTilt.add(this.cam);
            
            this.cam.position.z = 1;
            this.cam.updateMatrix();
            this.updateWorldMatrices();

	        this.distance = 1;
			this.vd = { current: null, last: null };
			this.light = new THREE.PointLight( 0xffffff, 1.35 );
            this.tiltMax = hemi.viewDefaults.MAX_TILT;
            this.tiltMin = hemi.viewDefaults.MIN_TILT;

	        this.fov = {
				current : hemi.viewDefaults.FOV,
				min     : hemi.viewDefaults.MIN_FOV,
				max     : hemi.viewDefaults.MAX_FOV
			};
	        this.lookLimits = {
	        	panMax: null,
	        	panMin: null,
	        	tiltMax: null,
	        	tiltMin: null
	        };
			this.mode = {
				scroll     : true,
				scan       : true,
				fixed      : false,
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
            this.threeCamera = new THREE.PerspectiveCamera(
            		this.fov.current * 180 / Math.PI,
            		window.innerWidth / window.innerHeight,
            		hemi.viewDefaults.NP,
            		hemi.viewDefaults.FP);

            var tween = hemi.utils.penner.linearTween;
			this.easeFunc = [tween,tween,tween];
			this.update();

            hemi.addRenderListener(this);
		};

	hemi.CameraBase.prototype = {
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
			this.mode.fixedLight = true;
			this.update();
			return this;
		},
		
		/**
		 * Allow the eye to rotate about a fixed target. This is the default mode.
		 */
		freeEye : function() {
			this.setEyeTarget(this.getEye(), this.getTarget());
			this.mode.fixed = false;
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
			return this.cam.matrixWorld.getPosition().clone();
		},

		/**
		 * Get the current position of the Camera target.
		 *
		 * @return {Vector3} XYZ coordinates of the target
		 */
		getTarget : function() {
			if (this.mode.fixed) {
				// Create a target vector that is transformed by cam's matrix
				// but adds a negative Z translation of "distance" length
				var tgt = new THREE.Vector3(0, 0, 1);
				this.cam.matrixWorld.rotateAxis(tgt).multiplyScalar(-this.distance);
				return tgt.addSelf(this.cam.matrixWorld.getPosition());
			} else {
				return this.panTilt.matrixWorld.getPosition().clone();
			}
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
				fov: this.fov.current,
				np: this.threeCamera.near,
				fp: this.threeCamera.far
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
				case hemi.viewProjection.XY:
				case hemi.viewProjection.YZ:
					this.panTilt.translateX(-xDis);
                    this.panTilt.translateY(yDis);
                    this.panTilt.updateMatrix();
					break;
				case hemi.viewProjection.XZ:
				    this.panTilt.translateX(xDis);
                    this.panTilt.translateZ(yDis);
                    this.panTilt.updateMatrix();
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
				this.panTilt.translateX(-deltaX);
				this.panTilt.translateY(deltaY);
                this.panTilt.updateMatrix();
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
					this.threeCamera.fov = this.fov.current * 180 / Math.PI;
					this.threeCamera.updateProjectionMatrix();
					this.state.update = true;
					return;
				} else {
					var t = (mouseEvent.deltaY > 0) ? 11/12 : 13/12;
					this.distance = hemi.utils.lerp(0, this.distance, t);
					if (!this.mode.projection) {
						this.cam.position.z = this.distance;
						this.cam.updateMatrix();
					}
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
			
			var newTilt = this.panTilt.rotation.x + tilt;
			
			this.panTilt.rotation.y += pan;
			this.panTilt.rotation.x = newTilt >= this.tiltMax ? this.tiltMax : (newTilt <= this.tiltMin ? this.tiltMin : newTilt);
			this.panTilt.updateMatrix();
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
			
			var ll = this.lookLimits,
				newPan = this.cam.rotation.y + pan,
				newTilt = this.cam.rotation.x + tilt;
			
			if (ll.panMin != null && newPan < ll.panMin) {
				this.cam.rotation.y = ll.panMin;
			} else if (ll.panMax != null && newPan > ll.panMax) {
				this.cam.rotation.y = ll.panMax;
			} else {
				this.cam.rotation.y = newPan;
			}

			if (ll.tiltMin != null && newTilt < ll.tiltMin) {
				this.cam.rotation.x = ll.tiltMin;
			} else if (ll.tiltMax != null && newTilt > ll.tiltMax) {
				this.cam.rotation.x = ll.tiltMax;
			} else {
				this.cam.rotation.x = newTilt;
			}
			
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
			this.lookLimits.panMax = panMax;
			this.lookLimits.panMin = panMin;
			this.lookLimits.tiltMax = tiltMax;
			this.lookLimits.tiltMin = tiltMin;
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
			var offset = [eye.x - target.x, eye.y - target.y, eye.z -target.z],
				rtp = hemi.utils.cartesianToSpherical(offset);

			this.distance = rtp[0];

			this.panTilt.position = target;
            this.panTilt.rotation.y = rtp[2];
            this.panTilt.rotation.x = rtp[1] - Math.PI/2;
            this.panTilt.updateMatrix();

			this.cam.rotation.y = 0;
			this.cam.rotation.x = 0;
			this.cam.position.z = this.distance;
            this.cam.updateMatrix();

			var camPos = new THREE.Vector3(0, 0, this.distance);
			hemi.utils.pointZAt(this.cam, camPos, hemi.utils.pointAsLocal(this.cam,target));
			this.cam.rotation.y += Math.PI;
            this.cam.updateMatrix();

            this.updateWorldMatrices();
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
		},
		
		/**
		 * Set the Camera view to render with a perspective projection.
		 */
		setPerspective : function() {
			this.mode.projection = 0;
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
		 * Move the Camera towards or away from its current target point by the
		 * given distance.
		 * 
		 * @param {number} distance the distance to move the Camera
		 */
		truck : function(distance) {
			this.panTilt.translateZ(-distance);
            this.panTilt.updateMatrix();
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
				this.threeCamera.fov = this.fov.current * 180 / Math.PI;
				upProj = true;
			}
			if (cur.np !== last.np) {
				this.threeCamera.near = this.easeFunc[0](current,last.np,cur.np-last.np,end);
				upProj = true;
			}
			if (cur.fp !== last.fp) {
				this.threeCamera.far = this.easeFunc[0](current,last.fp,cur.fp-last.fp,end);
				upProj = true;
			}	
			if (upProj) {
				this.threeCamera.updateProjectionMatrix();
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
					
					time.current += delta;
					
					if (time.current >= time.end) {
						time.current = time.end;
					}				
				}
			}
			
            //force an update of the transforms so we can get the correct world matricies
            this.updateWorldMatrices();
            var camPosition = this.getEye();
            var targetPosition = this.getTarget();
            this.threeCamera.position = camPosition;
            this.threeCamera.updateMatrix();
            this.threeCamera.updateMatrixWorld(true);
            this.threeCamera.lookAt(targetPosition);
            if (this.mode.fixedLight) {
				this.light.position = this.threeCamera.position;
                this.light.rotation = this.threeCamera.rotation;
                this.light.scale = this.threeCamera.scale;
                this.light.updateMatrix();
			}
		},

        updateWorldMatrices : function() {
            this.panTilt.updateMatrixWorld(true);
        }
	};

	hemi.makeCitizen(hemi.CameraBase, 'hemi.Camera', {
		cleanup: function() {
			hemi.removeRenderListener(this);
			this.disableControl();
			this.threeCamera = null;
		},
		msgs: [hemi.msg.start, hemi.msg.stop],
		toOctane: function() {
			var curView = hemi.createViewData(this),
				oct = [
					{
						name: this.mode.control ? 'enableControl' : 'disableControl',
						arg: []
					}, {
						name: 'mode',
						val: this.mode
					}, {
						name: 'moveToView',
						arg: [curView, 0]
					}
				];

			return oct;
		}
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
				oct: this.eye._toOctane()
			});
			octane.props.push({
				name: 'target',
				oct: this.target._toOctane()
			});

			return octane;
		}
	};

	hemi.ViewData = function(config) {
		var cfg = config || {};
		this.eye = cfg.eye || new THREE.Vector3(0,0,-1);
		this.target = cfg.target || new THREE.Vector3(0,0,0);
		this.fov = cfg.fov || hemi.viewDefaults.FOV;
		this.np = cfg.np || hemi.viewDefaults.NP;
		this.fp = cfg.fp ||hemi.viewDefaults.FP;
	};

	/**
	 * @class A Viewpoint describes everything needed for a view - eye, target,
	 * field of view, near plane, and far plane.
	 * @extends hemi.world.Citizen
	 */
	hemi.ViewpointBase = function(config) {
        var cfg = config || {};
        this.name = cfg.name || '';
        this.eye = cfg.eye || new THREE.Vector3(0,0,-1);
        this.target = cfg.target || new THREE.Vector3(0,0,0);
        this.fov = cfg.fov || hemi.viewDefaults.FOV;
        this.np = cfg.np || hemi.viewDefaults.NP;
        this.fp = cfg.fp ||hemi.viewDefaults.FP;
    };

    hemi.ViewpointBase.prototype = {
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
			this.fov = viewData.fov;
			this.np = viewData.np;
			this.fp = viewData.fp;
		}
	};

	hemi.makeCitizen(hemi.ViewpointBase, 'hemi.Viewpoint', {
		toOctane: ['eye', 'target', 'fov', 'np', 'fp']
	});

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
			fov: camera.fov.current,
			np: camera.threeCamera.near,
			fp: camera.threeCamera.far
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
	 * @param {number} fov angle of the field-of-view
	 * @return {hemi.Viewpoint} the newly created Viewpoint
	 */
	hemi.createCustomViewpoint = function(name, eye, target, fov, np, fp) {
		var viewPoint = new hemi.Viewpoint({
			name: name,
			eye: eye,
			target: target,
			fov: fov,
			np: np,
			fp: fp
		});

		return viewPoint;
	};

	return hemi;

})(hemi || {});
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

	THREE.Object3D.prototype.pickable = true;

	var getObject3DsRecursive = function(name, obj3d, returnObjs) {
			for (var i = 0; i < obj3d.children.length; ++i) {
				var child = obj3d.children[i];

				if (child.name === name) {
					returnObjs.push(child);
				}

				getObject3DsRecursive(name, child, returnObjs);
			}
		};
	    
	hemi.ModelBase = function(client) {
		this.client = client;
		this.fileName = null;
		this.root = null;
		this.animations = [];
	};

	hemi.ModelBase.prototype = {
		getObject3Ds: function(name) {
			var obj3ds = [];
			getObject3DsRecursive(name, this.root, obj3ds);
			return obj3ds;
		},

		load: function() {
			var that = this;

			hemi.loadCollada(this.fileName, function (collada) {
				that.root = collada.scene;
				that.client.scene.add(that.root);
				var animHandler = THREE.AnimationHandler;
				for ( var i = 0, il = collada.animations.length; i < il; i++ ) {
					var anim = collada.animations[i];
					//Add to the THREE Animation handler to get the benefits of it's
					animHandler.add(anim);
					var kfAnim = new THREE.KeyFrameAnimation(anim.node, anim.name);
					kfAnim.timeScale = 1;
					that.animations.push(kfAnim);
				}
				that.send(hemi.msg.load, {});
			});
		},

		setFileName: function(fileName, callback) {
			this.fileName = fileName;
			this.load(callback);
		}
	};

	hemi.makeCitizen(hemi.ModelBase, 'hemi.Model', {
		cleanup: function() {
			this.client.scene.remove(this.root);
			this.client = null;
			this.root = null;
		},
		msgs: [hemi.msg.load],
		toOctane: ['client', 'fileName', 'load']
	});

	return hemi;
})(hemi || {});
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

	hemi.Picker = function(scene, camera) {
		this.scene = scene;
		this.camera = camera;
		this.width = 1;
		this.height = 1;

		this.projector = new THREE.Projector();

		hemi.input.addMouseDownListener(this);
	};

	hemi.Picker.prototype = {
		onMouseDown : function(mouseEvent) {
			var x = (mouseEvent.x / this.width) * 2 - 1;
			var y = -(mouseEvent.y / this.height) * 2 + 1;
			var projVector = new THREE.Vector3(x, y, 0.5);

			this.projector.unprojectVector(projVector, this.camera.threeCamera);
			var ray = new THREE.Ray(this.camera.threeCamera.position, projVector.subSelf(this.camera.threeCamera.position).normalize());

			var pickedObjs = ray.intersectScene(this.scene);

			if (pickedObjs.length > 0) {
				for (var i = 0; i < pickedObjs.length; ++i) {
					if (pickedObjs[i].object.parent.pickable) {
						hemi.send(hemi.msg.pick,
							{
								mouseEvent: mouseEvent,
								pickedMesh: pickedObjs[0].object
							});
						break;
					}
				}
			}
		},

		resize : function(width, height) {
			this.width = width;
			this.height = height;
		}
	};

	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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

	hemi.ClientBase = function() {
		this.bgColor = 0;
		this.bgAlpha = 1;
		this.camera = new hemi.Camera();
		this.scene = new THREE.Scene();
		this.picker = new hemi.Picker(this.scene, this.camera);
		this.renderer = null;
		this.lights = [];

		this.useCameraLight(true);
		this.scene.add(this.camera.threeCamera)
		hemi.clients.push(this);
	};

	hemi.ClientBase.prototype = {
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
		
		addLight: function(light) {
			var ndx = this.lights.indexOf(light);

			if (ndx === -1) {
				this.lights.push(light);
				this.scene.add(light);
			}
		},

		onRender: function() {
			this.renderer.render(this.scene, this.camera.threeCamera);
		},
		
		removeLight: function(light) {
			var ndx = this.lights.indexOf(light);
			
			if (ndx > -1) {
				this.lights.splice(ndx, 1);
				this.scene.remove(light);
			}
		},

		resize: function() {
			var dom = this.renderer.domElement,
				width = Math.max(1, dom.clientWidth),
				height = Math.max(1, dom.clientHeight);

			this.renderer.setSize(width, height);
			this.camera.threeCamera.aspect = width / height;
			this.camera.threeCamera.updateProjectionMatrix();
			this.picker.resize(width, height);
		},

		setBGColor: function(hex, opt_alpha) {
			this.bgColor = hex;
			this.bgAlpha = opt_alpha == null ? 1 : opt_alpha;
			this.renderer.setClearColorHex(this.bgColor, this.bgAlpha);
		},

		setRenderer: function(renderer) {
			var dom = renderer.domElement;
			dom.style.width = "100%";
			dom.style.height = "100%";
			hemi.input.init(dom);

			renderer.setClearColorHex(this.bgColor, this.bgAlpha);
			this.renderer = renderer;
			this.resize();
		},

		useCameraLight: function(useLight) {
			if (useLight) {
				this.addLight(this.camera.light);
			} else {
				this.removeLight(this.camera.light);
			}
		}
	};

	hemi.makeCitizen(hemi.ClientBase, 'hemi.Client', {
		msgs: [],
		toOctane: function() {
			return [
				{
					name: 'bgColor',
					val: this.bgColor
				}, {
					name: 'bgAlpha',
					val: this.bgAlpha
				}, {
					name: 'useCameraLight',
					arg: [false]
				}, {
					name: 'camera',
					id: this.camera._getId()
				}, {
					name: 'useCameraLight',
					arg: [true]
				}
			];
		}
	});

	return hemi;
})(hemi || {});
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

	hemi = hemi || {};

	/**
	 * @class A Loop contains a start time and stop time as well as the number of
	 * iterations to perform for the Loop.
	 */
	hemi.Loop = function() {
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
	
	hemi.Loop.prototype = {
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
	 * @class An AnimationSquence contains a group of animations to animate, a begin time, an end
	 * time, and Loops for repeating sections of the AnimationSequence.
	 */
	hemi.AnimationSequenceBase = function() {
		/**
		 * The animations to play. 
		 * @type KeyFrameAnimation
		 */
		this.animations = [];
		
		/**
		 * The time the Sequence begins at.
		 * @type number
		 * @default 0
		 */
		this.beginTime = 0;
		
		/**
		 * The time the Sequence ends at.
		 * @type number
		 * @default 0
		 */
		this.endTime = 0;
		
		this.currentTime = 0;
		this.loops = [];
		this.isAnimating = false;
	};

		
	hemi.AnimationSequenceBase.prototype = {
		/**
		 * Get the Octane structure for the Animation.
		 *
		 * @return {Object} the Octane structure representing the Animation
		 */
		toOctane: function(){
			var octane = this._super();
			
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
		 * Add the given Loop to the Sequence.
		 *
		 * @param {hemi.Loop} loop the Loop to add
		 */
		addLoop: function(loop){
			this.loops.push(loop);
		},

		/**
		 * Remove the given Loop from the Sequence.
		 * 
		 * @param {hemi.Loop} loop the Loop to remove
		 * @return {hemi[Loop} the removed Loop or null
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
		 * Check if the current time of the Sequence needs to be reset by any
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
		 * Reset the Sequence and its Loops to their initial states.
		 */
		reset: function() {
			this.currentTime = this.beginTime;
			
			for (var ndx = 0; ndx < this.loops.length; ndx++) {
				this.loops[ndx].current = 0;
			}
		},

		/**
		 * If the Sequence is not currently animating, start the
		 * Animation.
		 */
		start: function(){
			if (!this.isAnimating) {
				this.isAnimating = true;
				for (var i = 0; i < this.animations.length; ++i) {
					this.animations[i].play(false, this.currentTime);
				}
				hemi.addRenderListener(this);
				
				this.send(hemi.msg.start, {});
			}
		},

		/**
		 * If the sequence is currently running, stop it.
		 */
		stop: function(){
			for (var i = 0; i < this.animations.length; ++i) {
				this.animations[i].stop();
			}
			hemi.removeRenderListener(this);
			this.isAnimating = false;
			
			this.send(hemi.msg.stop, {});
		},

		/**
		 * Update the Sequence's current time with the amount of elapsed time
		 * in the RenderEvent. If the Sequence has not yet ended, update the
		 * Sequence's animations with the current animation time. Otherwise end
		 * the Sequence.
		 *
		 * @param {RenderEvent} renderEvent the event containing
		 *		  information about the render
		 */
		onRender: function(renderEvent){
			var previous = this.currentTime;
			this.currentTime += renderEvent.elapsedTime;

			this.send(hemi.msg.animate,
				{
					previous: previous,
					time: this.currentTime
				});
			var animHandler = THREE.AnimationHandler;
			this.checkLoops();
			if (this.currentTime < this.endTime) {
				for (var i = 0; i < this.animations.length; ++i) {
					this.animations[i].update(renderEvent.elapsedTime);
				}
			} else {
				//PABNOTE Need to do this anymore?
				//this.updateTarget(this.endTime);
				this.stop();
				this.reset();
			}
		}
		
		/**
		 * Update the target with the given animation time.
		 * 
		 * @param {number} currentTime current animation time
		 */
		// updateTargets: function(currentTime) {
		// 	for (var i = 0; i < targets.length; ++i) {
		// 		targets[i].play(false, this.currentTime);
		// 	}
		// }
	};
	

	hemi.makeCitizen(hemi.AnimationSequenceBase, 'hemi.AnimationSequence', {
		cleanup: function() {
			if (this.isAnimating) {
				this.stop();
			}
			
			this.animations = [];
			this.loops = [];
		},
		msgs: [hemi.msg.start, hemi.msg.stop, hemi.msg.animate]
		//toOctane: ['client', 'fileName', 'load']
	});

	/**
	 * Create an AnimationSequence for the given Model.
	 *
	 * @param {hemi.Model} model Model to animate
	 * @param {number} beginTime time within the Model to start animating
	 * @param {number} endTime time within the Model to stop animating
	 * @return {hemi.AnimationSequence} the newly created animation
	 */
	hemi.createModelAnimationSequence = function(model, beginTime, endTime) {
		var anim = new hemi.AnimationSequence();
		anim.animations = model.animations;
		anim.beginTime = beginTime;
		anim.currentTime = beginTime;
		anim.endTime = endTime;

		return anim;
	};

	return hemi;
})(hemi || {});
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

/**
 * @fileoverview Motion describes classes for automatically translating
 * 		and rotating objects in the scene.
 */

var hemi = (function(hemi) {

    hemi = hemi || {};

    /**
     * @class A Rotator makes automated rotation easier by allowing simple
     * calls such as setVel to begin the automated spinning of a Transform.
     * @extends hemi.world.Citizen
     *
     * @param {THREE.Object3d} opt_tran optional transform that will be spinning
     * @param {Object} opt_config optional configuration for the Rotator
     */
    hemi.RotatorBase = function(opt_tran, opt_config) {
        var cfg = opt_config || {};

        this.accel = cfg.accel || new THREE.Vector3();
        this.angle = cfg.angle || new THREE.Vector3();
        this.vel = cfg.vel || new THREE.Vector3();

        this.time = 0;
        this.stopTime = 0;
        this.steadyRotate = false;
        this.mustComplete = false;
        this.startAngle = this.angle.clone();
        this.stopAngle = this.angle.clone();
        this.toLoad = {};
        this.transformObjs = [];

        if (opt_tran !== null) {
            this.addTransform(opt_tran);
        }

        this.enable();
    };

    hemi.RotatorBase.prototype = {
        /**
         * Add a Transform to the list of Transforms that will be spinning. A
         * child Transform is created to allow the Rotator to spin about an
         * arbitray axis.
         *
         * @param {THREE.Object3D} transform the Transform to add
         */
        addTransform : function(transform) {
            this.transformObjs.push(transform);
            applyRotator.call(this, [transform]);
        },

        /**
         * Clear properties like acceleration, velocity, etc.
         */
        clear: function() {
            this.accel = new THREE.Vector3(0,0,0);
            this.angle =  new THREE.Vector3(0,0,0);
            this.vel =  new THREE.Vector3(0,0,0);
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
                hemi.removeRenderListener(this);
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
         * @return {THREE.Object3D[]} array of Transforms
         */
        getTransforms: function() {
            return this.transformObjs.slice();
        },

        /**
         * Make the Rotator rotate the specified amount in the specified amount
         * of time.
         *
         * @param {THREE.Vecto3} theta XYZ amounts to rotate (in radians)
         * @param {number} time number of seconds for the rotation to take
         * @param {boolean} opt_mustComplete optional flag indicating that no
         *     other rotations can be started until this one finishes
         */
        rotate: function(theta,time,opt_mustComplete) {
            if (!this.enabled || this.mustComplete) return false;
            this.time = 0;
            this.stopTime = time || 0.001;
            this.steadyRotate = true;
            this.startAngle = this.angle.clone();
            this.mustComplete = opt_mustComplete || false;
            this.stopAngle.add(this.angle, theta);
            hemi.addRenderListener(this);
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
                        hemi.removeRenderListener(this);
                        this.send(hemi.msg.stop,{});
                    }
                    var t1 = this.time/this.stopTime;
                    var newAngle = hemi.utils.lerp(
                        [this.startAngle.x, this.startAngle.y, this.startAngle.z],
                        [this.stopAngle.x, this.stopAngle.y, this.stopAngle.z],
                        t1);
                    this.angle.x = newAngle[0];
					this.angle.y = newAngle[1];
					this.angle.z = newAngle[2];
                } else {
                    this.vel.addSelf(this.accel.clone().multiplyScalar(t));
                    this.angle.addSelf(this.vel.clone().multiplyScalar(t));
                }

                applyRotator.call(this);
            }
        },

		removeTransforms : function(tranObj) {
			var ndx = this.transformObjs.indexOf(tranObj);

			if (ndx > -1) {
				this.transformObjs.splice(ndx, 1);
			}
		},

        /**
         * Set the angular acceleration.
         *
         * @param {THREE.Vector3} accel XYZ angular acceleration (in radians)
         */
        setAccel: function(accel) {
            this.accel = accel.clone();
            shouldRender.call(this);
        },

        /**
         * Set the current rotation angle.
         *
         * @param {THREE.Vector3} theta XYZ rotation angle (in radians)
         */
        setAngle: function(theta) {
            this.angle = theta.clone();
            applyRotator.call(this);
        },

        /**
         * Set the angular velocity.
         *
         * @param {THREE.Vector3} vel XYZ angular velocity (in radians)
         */
        setVel: function(vel) {
            this.vel = vel.clone();
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
    };

    hemi.makeCitizen(hemi.RotatorBase, 'hemi.Rotator', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	/**
	 * @class A Translator provides easy setting of linear velocity and
	 * acceleration of shapes and transforms in the 3d scene.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {THREE.Object3D} opt_tran optional Transform that will be moving
	 * @param {Object} opt_config optional configuration for the Translator
	 */
	hemi.TranslatorBase = function(opt_tran, opt_config) {
		var cfg = opt_config || {};

		this.pos = cfg.pos || new THREE.Vector3();
		this.vel = cfg.vel || new THREE.Vector3();
		this.accel = cfg.accel || new THREE.Vector3();

		this.time = 0;
		this.stopTime = 0;
		this.mustComplete = false;
		this.steadyMove = false;
		this.startPos = this.pos.clone();
		this.stopPos = this.pos.clone();
		this.toLoad = {};
		this.transformObjs = [];

		if (opt_tran !== null) {
			this.addTransform(opt_tran);
		}

		this.enable();
	};


	hemi.TranslatorBase.prototype = {
		/**
		 * Add the Transform to the list of Transforms that will be moving.
		 *
		 * @param {THREE.Object3D} transform the Transform to add
		 */
		addTransform: function(transform) {
			this.transformObjs.push(transform);
			applyTranslator.call(this, [transform]);
		},

		/**
		 * Send a cleanup Message and remove all references in the Translator.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
		},

		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.pos = new THREE.Vector3();
			this.vel = new THREE.Vector3();
			this.accel = new THREE.Vector3();
		},

		/**
		 * Clear the list of translating Transforms.
		 */
		clearTransforms: function() {
			while (this.transformObjs.length > 0) {
				this.removeTransform(this.transformObjs[0]);
			}
		},

		/**
		 * Disable mouse interaction for the Translator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.removeRenderListener(this);
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
		 * @return {THREE.Object3D[]} array of Transforms
		 */
		getTransforms: function() {
		    return this.transformObjs.slice();
		},

		/**
		 * Make the Translator translate the specified amount in the specified
		 * amount of time.
		 * 
		 * @param {THREE.Vector3} delta XYZ amount to translate
		 * @param {number} time number of seconds for the translation to take
		 * @param {boolean} opt_mustComplete optional flag indicating that no
		 *     other translations can be started until this one finishes
		 */
		move : function(delta,time,opt_mustComplete) {
			if (!this.enabled || this.mustComplete) return false;
			this.time = 0;
			this.stopTime = time || 0.001;
			this.steadyMove = true;
			this.startPos = this.pos.clone();
			this.mustComplete = opt_mustComplete || false;
			this.stopPos.add(this.pos, delta);
			hemi.addRenderListener(this);
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
						hemi.removeRenderListener(this);
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.time/this.stopTime;
					var newPos = hemi.utils.lerp(
						[this.startPos.x, this.startPos.y, this.startPos.z],
						[this.stopPos.x, this.stopPos.y, this.stopPos.z],
						t1);
					this.pos.x = newPos[0];
					this.pos.y = newPos[1];
					this.pos.z = newPos[2];
				} else {
					this.vel.addSelf(this.accel.clone().multiplyScalar(t));
					this.pos.addSelf(this.vel.clone().multiplyScalar(t));
				}

				applyTranslator.call(this);
			}
		},

		removeTransforms : function(tranObj) {
			var ndx = this.transformObjs.indexOf(tranObj);

			if (ndx > -1) {
				this.transformObjs.splice(ndx, 1);
			}
		},

		/**
		 * Set the acceleration.
		 * 
		 * @param {THREE.Vector3} a XYZ acceleration vector
		 */
		setAccel: function(a) {
			this.accel = a.clone();
			shouldRender.call(this);
		},

		/**
		 * Set the position.
		 * 
		 * @param {THREE.Vector3} x XYZ position
		 */
		setPos: function(x) {
			this.pos = x.clone();
			applyTranslator.call(this);
		},

		/**
		 * Set the velocity.
		 * @param {THREE.Vector3} v XYZ velocity vector
		 */
		setVel: function(v) {
			this.vel = v.clone();
			shouldRender.call(this);
		}
	};

	hemi.makeCitizen(hemi.TranslatorBase, 'hemi.Translator', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});

	///////////////////////////////////////////////////////////////////////////
	// Private functions
	///////////////////////////////////////////////////////////////////////////
	shouldRender = function() {
		if (!this.enabled ||  (this.accel.isZero() && this.vel.isZero())) {
			hemi.removeRenderListener(this);
		} else {
			hemi.addRenderListener(this);
		}
	};

	applyTranslator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];
			hemi.utils.identity(transform);
			transform.position = this.pos.clone();
			transform.updateMatrix();
		}
	};

	
	applyRotator = function(opt_objs) {
		var objs = this.transformObjs;

		if (opt_objs) {
			objs = opt_objs;
		}

		for (var i = 0, il = objs.length; i < il; i++) {
			var transform = objs[i];
			hemi.utils.identity(transform);
			if (transform.useQuaternion) {
				transform.quaternion.setFromEuler(new THREE.Vector3(
				 hemi.utils.radToDeg(this.angle.x), hemi.utils.radToDeg(this.angle.y), hemi.utils.radToDeg(this.angle.z)));
			}
			else {
				transform.rotation = this.angle.clone();
			}
			transform.updateMatrix();
		}
	};

	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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
	
	var dbBoxMat =  new THREE.MeshPhongMaterial({
			color: 0x000088,
			wireframe: true,
			wireframeLinewidth: 1
		}),	
		dbgBoxTransforms = {},
		dbgLineMat = null,
		dbgLineTransforms = [];
	
////////////////////////////////////////////////////////////////////////////////
//                              	Constants	                              //
////////////////////////////////////////////////////////////////////////////////  

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
	
////////////////////////////////////////////////////////////////////////////////
//                             Global Methods                                 //
////////////////////////////////////////////////////////////////////////////////  
	
	/**
	 * Create a curve particle system with the given configuration.
	 * 
	 * @param {hemi.Client} the client to create the system in
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
	hemi.createCurveSystem = function(client, cfg) {
		var system;
		
		if (cfg.fast) {
			if (cfg.trail) {
				system = new hemi.GpuParticleTrail(client, cfg);
			} else {
				system = new hemi.GpuParticleSystem(client, cfg);
			}
		} else {
			system = new hemi.ParticleSystem(client, cfg);
		}
		
		return system;
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              	Classes	                                  //
////////////////////////////////////////////////////////////////////////////////  
	
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
	 * @class A Curve is used to represent and calculate different curves
	 * including: linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {number[3][]} points List of xyz waypoints 
	 * @param {hemi.curve.CurveType} opt_type Curve type
	 * @param {Object} opt_config Configuration object specific to this curve
	 */
	hemi.CurveBase = hemi.Class.extend({
		init: function(points, opt_type, opt_config) {
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
		},
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
			drawCurve(points,config);
		}
	});
	
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
	var Particle = function(trans, points, colorKeys, scaleKeys, rotate) {
		this.transform = new THREE.Object3D();
		trans.add(this.transform);
		this.transform.matrixAutoUpdate = false;
		
		this.frame = 1;
		this.lastFrame = points.length - 2;
		this.destroyed = false;
		this.material = new THREE.MeshPhongMaterial({
			color: 0x000000,
			transparent: true
		});
		
		this.lt = [];
		this.matrices = [];
		this.setColors(colorKeys);
		
		for (var i = this.frame; i <= this.lastFrame; i++) {
			var L = new THREE.Matrix4(),
				p = points[i];
			
			L.setTranslation(p[0], p[1], p[2]);
			
			if (rotate) {
				hemi.utils.pointYAt(L, points[i-1], points[i+1]);
			}
			
			this.lt[i] = L;
		}
		this.setScales(scaleKeys);
		this.ready = true;
		this.active = false;
	};
	
	Particle.prototype = {
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
		 * @param {THREE.Geometry} shape the shape to add
		 */
		addShape : function(shape) {
			this.transform.add(new THREE.Mesh(shape, this.material));
		},
		
		/**
		 * Remove all shapes from the particle transform.
		 */
		removeShapes : function() {
			for (var i = this.transform.children.length - 1; i >=0; i--) {
				this.transform.remove(this.transform.children[i]);
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
					{key: 0, value: [0,0,0,1]},
					{key: 1, value: [0,0,0,1]}
					];
			}
			for (var i = 1; i <= this.lastFrame; i++) {		
				var time = (i-1)/(this.lastFrame-2);				
				this.colors[i] = this.lerpValue(time, this.colorKeys);			
			}
			return this;
		},
		
		/**
		 * Set the scale gradient of this particle.
		 * 
		 * @param {hemi.curve.ScaleKey[]} scaleKeys array of scale key pairs
		 */
		setScales : function(scaleKeys) {
			this.scales = [];
			if(scaleKeys) {
				var sKeys = [];
				for (var i = 0; i < scaleKeys.length; i++) {
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
					{key: 0, value: [1,1,1]},
					{key: 1, value: [1,1,1]}
				];
			}
			for (var i = 1; i <= this.lastFrame; i++) {
				var time = (i-1)/(this.lastFrame-2),
					scale = this.scales[i] = this.lerpValue(time, sKeys);
				this.matrices[i] = new THREE.Matrix4().copy(this.lt[i]).scale(
					new THREE.Vector3(scale[0], scale[1], scale[2]));
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
		translate : function(x, y, z) {
			this.transform.translateX(x);
			this.transform.translateY(y);
			this.transform.translateZ(z);
		},
		
		/**
		 * Given a set of key-values, return the interpolated value
		 *
		 * @param {number} time time, from 0 to 1
		 * @param {Object[]} keySet array of key-value pairs
		 * @return {number[]} the interpolated value
		 */
		lerpValue : function(time, keySet) {
			var ndx = keySet.length - 2;
			while(keySet[ndx].key > time) {
				ndx--;
			}
			var a = keySet[ndx],
				b = keySet[ndx+1],
				t = (time - a.key)/(b.key - a.key),
				r = [],
				aLength = a.value.length;
				
			for (var i = 0; i < aLength; ++i) {
				r[i] = (1 - t) * a.value[i] + t * b.value[i];
			}
				
			return r;
		},
		
		/**
		 * Update the particle (called on each render).
		 */
		update : function() {
			if (!this.active) return;
			
			var f = this.frame,
				c = this.colors[f];
			this.material.color.setRGB(c[0], c[1], c[2]);
			this.material.opacity = c[3];
			this.transform.matrixWorldNeedsUpdate = true;
			this.transform.matrix = this.matrices[f];
			this.frame++;
			this.transform.visible = true;
			for (var i = 0, il = this.transform.children.length; i < il; i++) {
				this.transform.children[i].visible = true;
			}
			
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
			
			var t = this.transform,
				p = t.parent;
				
			for(var i = (t.children.length-1); i >= 0; i--) {
				t.remove(t.children[i]);
			}
			
			if (p) {
				p.remove(t);
			}
			
			this.transform = null;
			this.curve = null;
			this.destroyed = true;
		},
		
		/**
		 * Reset this particle.
		 */
		reset : function() {
			this.transform.visible = false;
			for (var i = 0, il = this.transform.children.length; i < il; i++) {
				this.transform.children[i].visible = false;
			}
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
	hemi.ParticleSystemBase = hemi.Class.extend({
		init: function(client, config) {
			this.transform = new THREE.Object3D();
			config.parent ? config.parent.add(this.transform) : client.scene.add(this.transform);
			
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
				
			this.shapeMaterial = new THREE.MeshBasicMaterial({
				color: 0xff0000,
				transparent: true
			});
			
			var type = config.particleShape || hemi.curve.ShapeType.CUBE,
				size = config.particleSize || 1;
			this.shapes = [];
			this.size = size;
			
			switch (type) {
				case (hemi.curve.ShapeType.ARROW):
					var halfSize = size / 2;
//					this.shapes.push(hemi.core.primitives.createPrism(pack, this.shapeMaterial,
//						[[0, size], [-size, 0], [-halfSize, 0], [-halfSize, -size],
//						[halfSize, -size], [halfSize, 0], [size, 0]], size));
//					break;
				case (hemi.curve.ShapeType.CUBE):
					this.shapes.push(new THREE.CubeGeometry(size, size, size));
					break;
				case (hemi.curve.ShapeType.SPHERE):
					this.shapes.push(new THREE.SphereGeometry(size, 12, 12));
					break;
			}
			
			hemi.addRenderListener(this);
			
			this.boxesOn = false;
			
			this.points = [];
			this.frames = config.frames || this.pLife*hemi.getFPS();
			
			for(var j = 0; j < this.maxParticles; j++) {
				var curve = this.newCurve(config.tension || 0);
				this.points[j] = [];
				for(var i=0; i < this.frames; i++) {
					this.points[j][i] = curve.interpolate((i)/this.frames);
				}
			}
			
			var colorKeys = null,
				scaleKeys = null;
			
			if (config.colorKeys) {
				colorKeys = config.colorKeys;
			} else if (config.colors) {
				var len = config.colors.length,
					step = len === 1 ? 1 : 1 / (len - 1);
				
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
					step = len === 1 ? 1 : 1 / (len - 1);
				
				scaleKeys = [];
				
				for (var i = 0; i < len; i++) {
					scaleKeys.push({
						key: i * step,
						value: config.scales[i]
					});
				}
			}
			
			for (i = 0; i < this.maxParticles; i++) {
				this.particles[i] = new Particle(
					this.transform,
					this.points[i],
					colorKeys,
					scaleKeys,
					config.aim);
				for (var j = 0; j < this.shapes.length; j++) {
					this.particles[i].addShape(this.shapes[j]);
				}
			}
		},
		
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
				for(var i = 0; i < this.maxParticles; i++) {
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
			for(var i = 0; i < this.maxParticles; i++) {
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
			for (var i = 0; i < num; i++) {
				var min = this.boxes[i].min;
				var max = this.boxes[i].max;
				points[i+1] = randomPoint(min,max);
			}
			points[0] = points[1].slice(0,3);
			points[num+1] = points[num].slice(0,3);
			var curve = new hemi.Curve(points,
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
					case (hemi.curve.ShapeType.CUBE):
						this.shapes.push(new THREE.CubeGeometry(size, size, size));
						break;
					case (hemi.curve.ShapeType.SPHERE):
						this.shapes.push(new THREE.SphereGeometry(size, 24, 12));
						break;
				}
			} else {
				this.shapes.push(shape);
			}
			for (var i = 0; i < this.maxParticles; i++) {
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
			showBoxes.call(this);
		},
	
		/**
		 * Hide the particle system's bounding boxes from view.
		 */
		hideBoxes : function() {
			hideBoxes.call(this);
		},
		
		/**
		 * Translate the entire particle system by the given amounts
		 * 
		 * @param {number} x amount to translate in the X direction
		 * @param {number} y amount to translate in the Y direction
		 * @param {number} z amount to translate in the Z direction
		 */
		translate: function(x, y, z) {
			this.transform.position.addSelf(new THREE.Vector(x, y, z));
			this.transform.updateMatrix();
		}
	});
	
	// START GPU PARTICLE SYSTEM
	
	
////////////////////////////////////////////////////////////////////////////////
//                               Shader Chunks                                //
////////////////////////////////////////////////////////////////////////////////   
	
	var shaderChunks = {
		vert: {
			header: 
				'uniform float sysTime; \n' +
				'uniform float ptcMaxTime; \n' +
				'uniform float ptcDec; \n' +
				'uniform float numPtcs; \n' +
				'uniform float tension; \n' +
				'uniform vec3 minXYZ[NUM_BOXES]; \n' +
				'uniform vec3 maxXYZ[NUM_BOXES]; \n' +
				'attribute vec4 idOffset; \n' +
				'varying vec4 ptcColor; \n',
				
			headerColors:
				'uniform vec4 ptcColors[NUM_COLORS]; \n' +
				'uniform float ptcColorKeys[NUM_COLORS]; \n',
	
			headerScales:
				'uniform vec3 ptcScales[NUM_SCALES]; \n' +
				'uniform float ptcScaleKeys[NUM_SCALES]; \n',
	
			support:
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
				'} \n',
			
			// Unfortunately we have to do this in the vertex shader since the pixel
			// shader complains about non-constant indexing.
			supportColors:
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
		//		'    ptcColor = vec4(t, 0.0, 0.0, 1.0); \n ' + //vec4(1.0, 0.0, 0.5, 1.0); \n' +
				'  } \n' +
				'} \n',
			
			supportNoColors:
				'void setPtcClr(float ptcTime) { \n' +
				'  if (ptcTime > 1.0) { \n' +
				'    ptcColor = vec4(0.0); \n' +
				'  } else { \n' +
				'    ptcColor = vec4(1.0); \n' +
				'  } \n' +
				'} \n',
			
			supportAim:
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
				'} \n',
			
			supportScale:
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
				'} \n',
			
			bodySetup:
				'  float id = idOffset[0]; \n' +
				'  float offset = idOffset[1]; \n' +
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
				'   0.0,0.0,0.0,1.0); \n',
			
			bodyAim:
				'  mat4 rMat = getRotMat(t, p0, p1, m0, m1); \n',
			
			bodyNoAim:
				'  mat4 rMat = mat4(1.0); \n',
			
			bodyScale:
				'  vec3 scale = getScale(ptcTime); \n' +
				'  mat4 sMat = mat4(scale.x,0.0,0.0,0.0, \n' +
				'   0.0,scale.y,0.0,0.0, \n' +
				'   0.0,0.0,scale.z,0.0, \n' +
				'   0.0,0.0,0.0,1.0); \n',
			
			bodyNoScale:
				'  mat4 sMat = mat4(1.0); \n',
			
			bodyEnd:
				'  mat4 ptcWorld = tMat*rMat*sMat; \n' +
				'  mat4 ptcWorldView = viewMatrix * ptcWorld; \n'
		},
		frag: {
			header:
				'varying vec4 ptcColor; \n',
			
			bodySetup:
				'  if (ptcColor.a == 0.0) {\n' +
				'    discard;\n' +
				'  }\n',
			
			globNoColors:
				'gl_FragColor.a *= ptcColor.a; \n'
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                           Gpu Particle Systems                             //
////////////////////////////////////////////////////////////////////////////////   
	
	/**
	 * @class A particle system that is GPU driven.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {Object} opt_cfg optional configuration object for the system
	 */
	hemi.GpuParticleSystemBase = hemi.Class.extend({ 
		init: function(client, opt_cfg) {
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
			this.client = client;
			this.dirtyShader = false;
			this.shaderMaterial = new THREE.ShaderMaterial();
			
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
			hideBoxes.call(this);
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
			
			this.setMaterial(cfg.material || newMaterial());
			this.setParticleShape(cfg.particleShape || hemi.curve.ShapeType.CUBE);
		},
		
		/**
		 * Update the particles on each render.
		 * 
		 * @param {o3d.RenderEvent} e the render event
		 */
		onRender: function(e) {
			if (this.dirtyShader) {
				this.setupShaders();
			}
			
			var delta = e.elapsedTime / this.life,
				newTime = this.timeParam.value + delta;
			
			while (newTime > 1.0) {
				--newTime;
			}
			
			// refresh uniforms
			this.timeParam.value = newTime;			
		},
		
		/**
		 * Pause the particle system.
		 */
		pause: function() {
			if (this.active) {
				hemi.removeRenderListener(this);
				this.active = false;
			}
		},
		
		/**
		 * Resume the particle system.
		 */
		play: function() {
			if (!this.active) {
				if (this.maxTimeParam.value === 1.0) {
					hemi.addRenderListener(this);
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
				this.setupShaders()
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
				this.setupShaders()
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
			
			this.setupShaders()
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
			this.material = material;
			
			if (material.program) {
				var shads = hemi.utils.getShaders(this.client, material);
				
				this.materialSrc = {
					frag: shads.fragSrc,
					vert: shads.vertSrc
				};
			}
				
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
				this.transform.parent ? this.client.scene.remove(this.transform) : null;
				this.transform = null;
			}
			
			this.material = this.material || newMaterial();
			this.particles = this.particles || 1;
			
			switch (type) {
				case (hemi.curve.ShapeType.ARROW):
					var halfSize = this.size / 2;
				case (hemi.curve.ShapeType.CUBE):
					this.transform = new THREE.Mesh(
						new THREE.CubeGeometry(this.size, this.size, this.size),
						this.material);
					break;
				case (hemi.curve.ShapeType.SPHERE):
					this.transform = new THREE.Mesh(
						new THREE.SphereGeometry(this.size, 12, 12),
						this.material);
					break;
			}
			
			this.client.scene.add(this.transform);
			var retVal = modifyGeometry(this.transform.geometry, this.particles);
			this.idArray = retVal.ids;
			this.offsetArray = retVal.offsets;
			this.idOffsets = retVal.idOffsets;
			
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
			
			this.setupShaders()
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
			if (!this.material || !this.materialSrc || this.boxes.length < 2 || !this.transform) {
				this.dirtyShader = true;
				return;
			}
			
			// TODO: test for if this is a program we created so that we can
			// just modify the existing
			var gl = this.client.renderer.context,
				chunksVert = shaderChunks.vert,
				chunksFrag = shaderChunks.frag,
				material = this.material,
				oldProgram = this.material.program,
				program = material.program = gl.createProgram(),
				fragSrc = this.materialSrc.frag,
				vertSrc = this.materialSrc.vert,
				numBoxes = this.boxes.length,
				numColors = this.colors.length,
				numScales = this.scales.length,
				texNdx = this.texNdx,
				addColors = numColors > 1,
				addScale = numScales > 1,
				shads = hemi.utils.getShaders(this.client, material),
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
					param = material.uniforms[name];
				
				if (param) {
					if (name === 'ptcDec') {
						dec = param.value;
					} else if (name === 'ptcMaxTime') {
						maxTime = param.value;
					} else if (name === 'sysTime') {
						time = param.value;
					}
					
					delete material.uniforms[name];
//					delete program.uniforms[name];
				}
			}
			
			// modify the vertex shader
			if (vertSrc.search('ptcInterp') < 0) {
				var vertHdr = chunksVert.header.replace(/NUM_BOXES/g, numBoxes),
					vertSprt = chunksVert.support,
					vertPreBody = chunksVert.bodySetup.replace(/NUM_BOXES/g, numBoxes);
								
				if (addColors) {
					vertHdr += chunksVert.headerColors.replace(/NUM_COLORS/g, numColors);
					vertSprt += chunksVert.supportColors.replace(/NUM_COLORS/g, numColors);
				} else {
					vertSprt += chunksVert.supportNoColors;
				}
				
				if (this.aim) {
					vertSprt += chunksVert.supportAim;
					vertPreBody += chunksVert.bodyAim;
				} else {
					vertPreBody += chunksVert.bodyNoAim;
				}
				
				if (addScale) {
					vertHdr += chunksVert.headerScales.replace(/NUM_SCALES/g, numScales);
					vertSprt += chunksVert.supportScale.replace(/NUM_SCALES/g, numScales);
					vertPreBody += chunksVert.bodyScale;
				} else {
					vertPreBody += chunksVert.bodyNoScale;
				}
				
				vertPreBody += chunksVert.bodyEnd;
				var parsedVert = hemi.utils.parseSrc(vertSrc),
					vertBody = parsedVert.body.replace(/modelViewMatrix/g, 'ptcWorldView')
						.replace(/objectMatrix/g, 'ptcWorld');
								
				parsedVert.postSprt = vertHdr + vertSprt;
				parsedVert.preBody = vertPreBody;
				parsedVert.body = vertBody;
				vertSrc = material.vertexShader = hemi.utils.buildSrc(parsedVert);
				
				var vShader = gl.createShader(gl.VERTEX_SHADER);
				gl.shaderSource(vShader, vertSrc);
				gl.compileShader(vShader);
				gl.detachShader(program, vertShd);
				gl.attachShader(program, vShader);
			}
			
			// modify the fragment shader
			if (fragSrc.search('ptcColor') < 0) {
				var parsedFrag = hemi.utils.parseSrc(fragSrc, 'gl_FragColor'),
					fragGlob = parsedFrag.glob;
				
				parsedFrag.postSprt = chunksFrag.header;
				parsedFrag.preBody = chunksFrag.bodySetup;
				
				if (addColors) {
					if (parsedFrag.body.indexOf('diffuse') !== -1) {
						parsedFrag.body = parsedFrag.body.replace(/diffuse/g, 'ptcColor.rgb');
					} else {
						parsedFrag.body = parsedFrag.body.replace(/emissive/g, 'ptcColor.rgb');
					}
				} //else {
//					parsedFrag.postGlob = hemi.curve.fragGlobNoColors;
//				}
				
				fragSrc = material.fragmentShader = hemi.utils.buildSrc(parsedFrag);
				
				var fShader = gl.createShader(gl.FRAGMENT_SHADER);
				gl.shaderSource(fShader, fragSrc);
				gl.compileShader(fShader);
				gl.detachShader(program, fragShd);
				gl.attachShader(program, fShader);
			}
			
			// add the attributes and uniforms to the material
			var attributes = {
					idOffset: { type: 'v2', value: this.idOffsets, needsUpdate: true },
				},
				uniforms = {
					sysTime: { type: 'f', value: time },
					ptcMaxTime: { type: 'f', value: maxTime },
					ptcDec: { type: 'f', value: dec },
					numPtcs: { type: 'f', value: this.particles },
					tension: { type: 'f', value: (1 - this.tension) / 2 },
					minXYZ: { type: 'v3v', value: [] },
					maxXYZ: { type: 'v3v', value: [] }
				};
	
			if (addColors) {
				uniforms.ptcColors = {
					type: 'v4v', value: []
				};
				uniforms.ptcColorKeys = {
					type: 'fv1', value: []
				};
			}
			if (addScale) {
				uniforms.ptcScales = {
					type: 'v3v', value: []
				};
				uniforms.ptcScaleKeys = {
					type: 'fv1', value: []
				};
			}
				
			material.uniforms = THREE.UniformsUtils.merge([material.uniforms, uniforms]);
			material.attributes = THREE.UniformsUtils.merge([material.attributes, attributes]);

			material.uniformsList = [];
			
			gl.linkProgram(program);
			program.uniforms = {};
			program.attributes = {};
	
			for (u in material.uniforms) {
				material.uniformsList.push([material.uniforms[u], u]);
			}
			
			// update the program to point to the uniforms and attributes
			for (var u in oldProgram.uniforms) {
				var loc = program.uniforms[u] = gl.getUniformLocation(program, u);
			}
			for (var u in uniforms) {
				program.uniforms[u] = gl.getUniformLocation(program, u);
			}
			for (var a in oldProgram.attributes) {
				var loc = program.attributes[a] = gl.getAttribLocation(program, a);
				gl.enableVertexAttribArray(loc);
			}
			for (var a in attributes) {
				var loc = program.attributes[a] = gl.getAttribLocation(program, a);
				gl.enableVertexAttribArray(loc);
			}
			
			// setup params
			this.decParam = material.uniforms.ptcDec;
			this.maxTimeParam = material.uniforms.ptcMaxTime;
			this.timeParam = material.uniforms.sysTime;
			
			setupBounds(material, this.boxes);
			
			var needsZ = false;
			
			for (var i = 0; i < numColors && !needsZ; i++) {
				needsZ = this.colors[i].value[3] < 1;
			}
			
			material.transparent = needsZ;
			
			if (addColors) {
				setupColors(material, this.colors);
			}
			if (addScale) {
				setupScales(material, this.scales);
			}
				
			// force rebuild of buffers
			this.transform.dynamic = true;
			this.transform.__webglInit = this.transform.__webglActive = false;
			delete this.transform.geometry.geometryGroups;
			delete this.transform.geometry.geometryGroupsList;
			this.client.scene.__objectsAdded.push(this.transform);
			
			this.dirtyShader = false;
		},
		
		/**
		 * Render the bounding boxes which the particle system's curves run
		 * through (helpful for debugging).
		 */
		showBoxes : function() {
			showBoxes.call(this);
		},
		
		/**
		 * Start the particle system.
		 */
		start: function() {
			if (!this.active) {
				if (this.dirtyShader) {
					this.setMaterial(this.material);
				}
				this.active = true;
				this.timeParam.value = 1.0;
				this.maxTimeParam.value = 1.0;
				hemi.addRenderListener(this);
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
				hemi.removeRenderListener(this);
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
	 * @extends hemi.curve.GpuParticleSystem
	 * 
	 * @param {Object} opt_cfg the configuration object for the system
	 */
	hemi.GpuParticleTrailBase = hemi.GpuParticleSystemBase.extend({
		init: function(client, opt_cfg) {
			this._super(client, opt_cfg);
			
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
					hemi.removeRenderListener(this);
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
					hemi.addRenderListener(this);
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
				hemi.removeRenderListener(this);
				this.active = false;
				this.stopping = false;
			}
			if (!this.active) {
				if (this.dirtyShader) {
					this.setMaterial(this.material);
				}
				this.active = true;
				this.starting = true;
				this.stopping = false;
				this.endTime = 2.0;
				this.decParam.value = 2.0;
				this.maxTimeParam.value = 2.0;
				this.timeParam.value = 1.0;
				hemi.addRenderListener(this);
			}
		},
		
		/**
		 * Stop the particle system.
		 * 
		 * @param {boolean} opt_hard optional flag to indicate a hard stop (all
		 *     particles disappear at once)
		 */
		stop: function(opt_hard) {
			if (this.active) {
				if (opt_hard) {
					this.endTime = -1.0;
				} else if (!this.stopping) {
					this.endTime = this.timeParam.value + 1.0;
				}
				
				this.starting = false;
				this.stopping = true;
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                             Hemi Citizenship                               //
////////////////////////////////////////////////////////////////////////////////   

	hemi.makeCitizen(hemi.CurveBase, 'hemi.Curve', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
	hemi.makeCitizen(hemi.ParticleSystemBase, 'hemi.ParticleSystem', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
	hemi.makeCitizen(hemi.GpuParticleSystemBase, 'hemi.GpuParticleSystem', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});

	hemi.makeCitizen(hemi.GpuParticleTrailBase, 'hemi.GpuParticleTrail', {
		msgs: ['hemi.start', 'hemi.stop'],
		toOctane: []
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Private Methods                               //
////////////////////////////////////////////////////////////////////////////////   
	
				
	/**
	 * Render the bounding boxes which the curves run through, mostly for
	 * debugging purposes. 
	 * 
	 */
	function showBoxes() {		
		var trans = dbgBoxTransforms[this.transform.clientId] || [];
		
		for (var i = 0; i < this.boxes.length; i++) {
			var b = this.boxes[i],
				w = b.max[0] - b.min[0],
				h = b.max[1] - b.min[1],
				d = b.max[2] - b.min[2],
				x = b.min[0] + w/2,
				y = b.min[1] + h/2,
				z = b.min[2] + d/2,
				box = new THREE.CubeGeometry(w, h, d),
				mesh = new THREE.Mesh(box, dbBoxMat);
			
			mesh.position.addSelf(new THREE.Vector3(x, y, z));
			this.transform.add(mesh);
			trans.push(mesh);
		}
		
		dbgBoxTransforms[this.transform.clientId] = trans;
	};
	
	/**
	 * Remove the bounding boxes from view. If a parent transform is given, only
	 * the bounding boxes under it will be removed. Otherwise all boxes will be
	 * removed.
	 */
	function hideBoxes() {
		for (var id in dbgBoxTransforms) {
			var trans = dbgBoxTransforms[id] || [];
			
			for (var i = 0; i < trans.length; i++) {
				var tran = trans[i];
				
				this.transform.remove(tran);
			}
			
			delete dbgBoxTransforms[id];
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              Utility Methods                               //
////////////////////////////////////////////////////////////////////////////////

	/**
	 * Render a 3D representation of a curve.
	 *
	 * @param {number[3][]} points array of points (not waypoints)
	 * @param {Object} config configuration describing how the curve should look
	 */
	function drawCurve(points, config) {
//		if (!this.dbgLineMat) {
//			this.dbgLineMat = this.newMaterial('phong', false);
//			this.dbgLineMat.getParam('lightWorldPos').bind(hemi.world.camera.light.position);
//		}
//		
//		var eShow = (config.edges == null) ? true : config.edges,
//			eSize = config.edgeSize || 1,
//			eColor = config.edgeColor || [0.5,0,0,1],
//			jShow = (config.joints == null) ? true : config.joints,
//			jSize = config.jointSize || 1,
//			jColor = config.jointColor,
//			crvTransform = this.pack.createObject('Transform');
//		
//		for (var i = 0; i < points.length; i++) {
//			if(jShow) {
//				var transform = this.pack.createObject('Transform'),
//					joint = hemi.core.primitives.createSphere(this.pack,
//						this.dbgLineMat, jSize, 20, 20);
//				
//				transform.parent = crvTransform;
//				transform.addShape(joint);
//				transform.translate(points[i]);
//				
//				if (jColor) {
//					var param = transform.createParam('diffuse', 'o3d.ParamFloat4');
//					param.value = jColor;
//				}
//			}
//			if (eShow && i < (points.length - 1)) {
//				var edgeTran = this.drawLine(points[i], points[i+1], eSize, eColor);
//				edgeTran.parent = crvTransform;
//			}
//		}
//		
//		crvTransform.parent = hemi.core.client.root;
//		this.dbgLineTransforms.push(crvTransform);
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
	function drawLine(p0, p1, opt_size, opt_color) {
//		if (!this.dbgLineMat) {
//			this.dbgLineMat = this.newMaterial('phong', false);
//			this.dbgLineMat.getParam('lightWorldPos').bind(hemi.world.camera.light.position);
//		}
//		
//		var size = opt_size || 1,
//			dist = hemi.core.math.distance(p0,p1),
//			midpoint = [ (p0[0]+p1[0])/2, (p0[1]+p1[1])/2, (p0[2]+p1[2])/2 ],
//			line = hemi.core.primitives.createCylinder(this.pack,
//				this.dbgLineMat, size, dist, 3, 1),
//			transform = this.pack.createObject('Transform');
//		
//		transform.addShape(line);
//		transform.translate(midpoint);
//		transform = hemi.utils.pointYAt(transform,midpoint,p0);
//		
//		if (opt_color) {
//			var param = transform.createParam('diffuse', 'o3d.ParamFloat4');
//			param.value = opt_color;
//		}
//		
//		return transform;
	};
	
	/**
	 * Remove the given curve line Transform, its shapes, and its children.
	 * 
	 * @param {o3d.Transform} opt_trans optional Transform to clean up
	 */
	function hideCurves(opt_trans) {
//		if (opt_trans) {
//			var children = opt_trans.children,
//				shapes = opt_trans.shapes;
//			
//			for (var i = 0; i < children.length; i++) {
//				this.hideCurves(children[i]);
//			}
//			for (var i = 0; i < shapes.length; i++) {
//				var shape = shapes[i];
//				opt_trans.removeShape(shape);
//				this.pack.removeObject(shape);
//			}
//			
//			opt_trans.parent = null;
//			this.pack.removeObject(opt_trans);
//		} else {
//			for (var i = 0; i < this.dbgLineTransforms.length; i++) {
//				this.hideCurves(this.dbgLineTransforms[i]);
//			}
//			
//			this.dbgLineTransforms = [];
//		}
	};  
	
	/*
	 * Take the existing vertex buffer in the given primitive and copy the data
	 * once for each of the desired number of particles. 
	 * 
	 * @param {THREE.Geometry} geometry the geoemtry to modify
	 * @param {number} numParticles the number of particles to create vertex
	 *     data for
	 */
	function modifyGeometry(geometry, numParticles) {
		var verts = geometry.vertices,
			faces = geometry.faces
			faceVertexUvs = geometry.faceVertexUvs,
			numVerts = verts.length,
			numFaces = faces.length,
			ids = [],
			offsets = [],
			idOffsets = [];
				
		for (var j = 0; j < numVerts; j++) {
			ids.push(0);
			offsets.push(0);
			idOffsets.push(new THREE.Vector2());
		}
		
		for (var i = 1; i < numParticles; i++) {
			var vertOffset = i * numVerts,
				timeOffset = i / numParticles,
				newVerts = [],
				newFaces = [];
				
			for (var j = 0; j < numVerts; j++) {
				ids.push(i);
				offsets.push(timeOffset);
				idOffsets.push(new THREE.Vector2(i, timeOffset));
				var vert = verts[j].position,
					newVert = new THREE.Vector3(vert.x, vert.y, vert.z);
				newVerts.push(new THREE.Vertex(newVert));
			}
			
			for (var j = 0; j < numFaces; j++) {
				var face = faces[j],
					newFace = null;
				
				if (face instanceof THREE.Face3) {
					newFace = new THREE.Face3(face.a + vertOffset,
						face.b + vertOffset,
						face.c + vertOffset,
						null, null, face.material);
				}
				else {
					newFace = new THREE.Face4(face.a + vertOffset,
						face.b + vertOffset,
						face.c + vertOffset,
						face.d + vertOffset,
						null, null, face.material);
				}
				newFaces.push(newFace);
			}
			
			// dupe the vertices
			geometry.vertices = geometry.vertices.concat(newVerts);
		
			// dupe the faces	
			geometry.faces = geometry.faces.concat(newFaces);
			
			// dupe the uvs
			geometry.faceVertexUvs = geometry.faceVertexUvs.concat(faceVertexUvs);
		}

		geometry.computeCentroids();
		geometry.computeFaceNormals();
		
		return {
			ids: ids,
			offsets: offsets,
			idOffsets: idOffsets
		}
	};
	
	/**
	 * Create a new material for a hemi particle curve to use.
	 * 
	 * @param {string} opt_type optional shader type to use (defaults to phong)
	 * @param {boolean} opt_trans optional flag indicating if material should
	 *     support transparency (defaults to true)
	 * @return {THREE.Material} the created material
	 */
	function newMaterial(opt_type, opt_trans) {
		var params = {
				color: 0xff0000,
				opacity: 1,
				transparent: opt_trans == null ? true : opt_trans
			},
			mat;
		
		switch (opt_type) {
			case 'lambert':
				mat = new THREE.MeshLambertMaterial(params);
				break;
			default:
				mat = new THREE.MeshPhongMaterial(params);
				break;
		}
		
		return mat;
	};
	
	/**
	 * Generate a random point within a bounding box
	 *
	 * @param {number[]} min Minimum point of the bounding box
	 * @param {number[]} max Maximum point of the bounding box
	 * @return {number[]} Randomly generated point
	 */
	function randomPoint(min, max) {
		var xi = Math.random();
		var yi = Math.random();
		var zi = Math.random();
		var x = xi*min[0] + (1-xi)*max[0];
		var y = yi*min[1] + (1-yi)*max[1];
		var z = zi*min[2] + (1-zi)*max[2];
		return [x,y,z];
	};
	
	/*
	 * Set the parameters for the given Material so that it supports a curve
	 * through the given bounding boxes.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {hemi.curve.Box[]} boxes array of min and max XYZ coordinates
	 */
	function setupBounds(material, boxes) {
		var minParam = material.uniforms.minXYZ,
			maxParam = material.uniforms.maxXYZ;
			
		minParam._array = new Float32Array(3 * boxes.length);
		maxParam._array = new Float32Array(3 * boxes.length);
				
		for (var i = 0, il = boxes.length; i < il; ++i) {
			var box = boxes[i],
				min = box.min,
				max = box.max;
						
			minParam.value[i] = new THREE.Vector3(min[0], min[1], min[2]);
			maxParam.value[i] = new THREE.Vector3(max[0], max[1], max[2]);
		}
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a color ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object[]} colors array of RGBA color values and keys
	 */
	function setupColors(material, colors) {
		var clrParam = material.uniforms.ptcColors,
			keyParam = material.uniforms.ptcColorKeys;
		
		clrParam._array = new Float32Array(4 * colors.length);
		
		for (var i = 0, il = colors.length; i < il; ++i) {
			var obj = colors[i],
				offset = i * 4;
			
			clrParam.value[i] = new THREE.Vector4(obj.value[0], obj.value[1], 
				obj.value[2], obj.value[3]);
			keyParam.value[i] = obj.key;
		}
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a scale ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object[]} scales array of XYZ scale values and keys
	 */
	function setupScales(material, scales) {
		var sclParam = material.uniforms.ptcScales,
			keyParam = material.uniforms.ptcScaleKeys;
		
		sclParam._array = new Float32Array(3 * scales.length);
		
		for (var i = 0, il = scales.length; i < il; ++i) {
			var obj = scales[i];
			
			sclParam.value[i] = new THREE.Vector3(obj.value[0], obj.value[1], 
				obj.value[2]);
			keyParam.value[i] = obj.key;
		}
	};
	
	return hemi;
})(hemi || {});
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

	hemi.fx = hemi.fx || {};
	
	var clientData = [];
	
	function findData(client) {
		var retVal = null;
		for (var i = 0, il = clientData.length; i < il && retVal == null; i++) {
			if (clientData[i].client === client) {
				retVal = clientData[i];
			}
		}
		return retVal;
	};

	/*
	 * The following three functions are exact duplicates of the functions
	 * in WebGLRenderer. Until those functions are exposed, we have to 
	 * duplicate them here. 
	 * 
	 */
	
	function addToFixedArray(where, what) {
		where.list[ where.count ] = what;
		where.count += 1;
	};

	function unrollImmediateBufferMaterials(globject) {
		var i, l, m, ml, material,
			object = globject.object,
			opaque = globject.opaque,
			transparent = globject.transparent;

		transparent.count = 0;
		opaque.count = 0;

		for (m = 0, ml = object.materials.length; m < ml; m++) {
			material = object.materials[ m ];
			material.transparent ? addToFixedArray(transparent, material) : addToFixedArray(opaque, material);
		}

	};

	function unrollBufferMaterials(globject) {
		var i, l, m, ml, material, meshMaterial,
			object = globject.object,
			buffer = globject.buffer,
			opaque = globject.opaque,
			transparent = globject.transparent;

		transparent.count = 0;
		opaque.count = 0;

		for (m = 0, ml = object.materials.length; m < ml; m++) {

			meshMaterial = object.materials[ m ];

			if (meshMaterial instanceof THREE.MeshFaceMaterial) {
				for (i = 0, l = buffer.materials.length; i < l; i++) {
					material = buffer.materials[ i ];
					if (material) material.transparent ? addToFixedArray(transparent, material) : addToFixedArray(opaque, material);

				}
			} else {
				material = meshMaterial;
				if (material) material.transparent ? addToFixedArray(transparent, material) : addToFixedArray(opaque, material);
			}
		}
	};
	
	hemi.fx.cleanup = function() {
		clientData = [];
	}
	
	/**
	 * Removes the fog for the given client
	 * 
	 * @param {hemi.Client} client the client view to clear fog for
	 */
	hemi.fx.clearFog = function(client) {
		var data = findData(client);
		
		if (data && data.fog) {
			client.scene.fog = undefined;
			client.setBGColor(data.oldBGHex, data.oldBGAlpha);
			
			// now change the materials
			for (var i = 0, il = data.materials.length; i < il; i++) {
				var matData = data.materials[i];
				
				client.renderer.initMaterial(matData.mat, client.scene.lights, client.scene.fog, matData.obj);
			}
		}
	};
	
	/**
	 * Sets the fog for the given client to the following parameters
	 * 
	 * @param {hemi.Client} client the client view to set fog for 
	 * @param {number} color the hex (begins with 0x) color value
	 * @param {number} alpha the alpha value of the color between 0 and 1
	 * @param {number} near the viewing distance where the fog obscuring starts  
	 * @param {number} far the viewing distance where fog opacity obscures the 
	 * 		subject
	 */
	hemi.fx.setFog = function(client, color, alpha, near, far) {
		var data = findData(client),
			objs = client.scene.__webglObjects.concat(
				client.scene.__webglObjectsImmediate),
			mats = [],
			refresh = false;
		
		if (!data) {
			data = {
				client: client
			};
			clientData.push(data);
		}
		
		if (!data.fog) {
			data.fog = new THREE.Fog();
			
			// save the old background color
			data.oldBGHex = client.renderer.getClearColor().getHex();
			data.oldBGAlpha = client.renderer.getClearAlpha();
			refresh = true;
		}
		
		data.fog.color.setHex(color);
		data.fog.near = near;
		data.fog.far = far;
		
		client.scene.fog = data.fog;
		client.setBGColor(color, alpha);
		
		if (refresh) {
			// go through all the materials and update
			// first get the materials
			for (var i = 0, il = objs.length; i < il; i++) {
				var webglObject = objs[i], 
					object = webglObject.object, 
					opaque = webglObject.opaque, 
					transparent = webglObject.transparent;
				
				for (var j = 0, jl = opaque.count; j < jl; j++) {
					mats.push({
						mat: opaque.list[j],
						obj: object
					});
				}
				for (var j = 0, jl = transparent.count; j < jl; j++) {
					mats.push({
						mat: transparent.list[j],
						obj: object
					});
				}
			}
		
			// save the materials for later
			data.materials = mats;
		}
		
		// now change the materials
		for (var i = 0, il = data.materials.length; i < il; i++) {
			var matData = data.materials[i],
				material = matData.mat,
				object = matData.obj,
				fog = client.scene.fog;
			
			if (refresh) {
				client.renderer.initMaterial(material, client.scene.lights, 
					fog, object);
			}
			else {
				var uniforms = material.uniforms;
									
				uniforms.fogColor.value = fog.color;		
				uniforms.fogNear.value = fog.near;
				uniforms.fogFar.value = fog.far;
			}
		}
	};
	
	/**
	 * Sets the opacity for the given material in the given object.
	 * 
	 * @param {hemi.Client} client the client view in which to change opacity
	 * @param {THREE.Object3d} object the object whose material's opacity we're 
	 * 		changing
	 * @param {THREE.Material} material the material to set opacity on
	 * @param {number} opacity the opacity value between 0 and 1
	 */
	hemi.fx.setOpacity = function(client, object, material, opacity) {
		var objs = client.scene.__webglObjects.concat(
				client.scene.__webglObjectsImmediate),
			found = null;
				
		for (var i = 0, il = objs.length; i < il && found == null; i++) {
			var webglObject = objs[i];
			
			if (webglObject.object.parent === object || webglObject.object === object) {
				found = webglObject;
			}
		}
		
		if (found) {
			material.transparent = opacity < 1;
			material.opacity = opacity;
			
			// move the material to the transparent list and out of the opaque list
			found.transparent.list = [];
			found.opaque.list = [];
			unrollBufferMaterials(found);
			unrollImmediateBufferMaterials(found);
		}
	};
	
	return hemi;
})(hemi || {});/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
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
	/*
	 * Utility to handle the Timer naturally finishing its countdown.
	 */
	var handleTimeout = function(timer) {
			timer.reset();
			timer.send(hemi.msg.stop, {
				time: timer.startTime
			});
		};

	/**
	 * @class A Timer is a simple countdown timer that can be used to script
	 * behavior and sequence events.
	 * @extends hemi.world.Citizen
	 */
	hemi.TimerBase = function() {
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
	};

	hemi.TimerBase.prototype = {
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
		}
	};

	hemi.makeCitizen(hemi.TimerBase, 'hemi.Timer', {
		cleanup: function() {
			if (this._timeId !== null) {
				clearTimeout(this._timeId);
				this._timeId = null;
				this._started = null;
			}
		},
		msgs: [hemi.msg.start, hemi.msg.stop],
		toOctane: ['startTime']
	});
	
	return hemi;
})(hemi || {});
