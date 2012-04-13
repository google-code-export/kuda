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

		// Static helper vector
	var _vector = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 
	 * Convert from cartesian to spherical coordinates.
	 *
	 * @param {number[3]} coords XYZ cartesian coordinates
	 * @return {number[3]} array of radius, theta, phi
	 */
	hemi.utils.cartesianToSpherical = function(coords) {
		var x = coords[0],
			y = coords[1],
			z = coords[2],
			r = Math.sqrt(x*x + y*y + z*z),
			theta = Math.acos(y/r),
			phi = Math.atan2(x,z);

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
		return hemi.utils.factorial(n, (n - m) + 1) / hemi.utils.factorial(m);
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
		return val > max ? max : (val < min ? min : val);
	};

	/**
	 * Compute the normal of the three given vertices that form a triangle.
	 * 
	 * @param {THREE.Vertex} a vertex a
	 * @param {THREE.Vertex} b vertex b
	 * @param {THREE.Vertex} c vertex c
	 * @return {THREE.Vector3} the normal vector
	 */
	hemi.utils.computeNormal = function(a, b, c) {
		var cb = new THREE.Vector3().sub(c, b),
			ab = _vector.sub(a, b);

		cb.crossSelf(ab);

		if (!cb.isZero()) {
			cb.normalize();
		}

		return cb;
	};

	/**
	 * Calculate the cubic hermite interpolation between two points with associated tangents.
	 *
	 * @param {number} t time (between 0 and 1)
	 * @param {number[3]} p0 the first waypoint
	 * @param {number[3]} m0 the tangent through the first waypoint
	 * @param {number[3]} p1 the second waypoint
	 * @param {number[3]} m1 the tangent through the second waypoint
	 * @return {number[3]} the interpolated point
	 */
	hemi.utils.cubicHermite = function(t,p0,m0,p1,m1) {
		var t2 = t * t,
			t3 = t2 * t,
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
	 * @param {number} opt_stop optional number to stop the factorial at (if it should be stopped
	 *     before 1
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
	 * @param {THREE.Ray} ray Ray described by a near xyz point and a far xyz point
	 * @param {THREE.Vector3[3]} plane Array of 3 xyz coordinates defining a plane
	 * @return {number[3]} the array [
	 *     t: time value on ray,
	 *     u: u-coordinate on plane,
	 *     v: v-coordinate on plane
	 */
	hemi.utils.intersect = function(ray, plane) {
		var dir = ray.direction,
			orig = ray.origin,
			point0 = plane[0],
			point1 = plane[1],
			point2 = plane[2],
			A = hemi.utils.invertMat3([[dir.x, point1.x - point0.x, point2.x - point0.x],
				[dir.y, point1.y - point0.y, point2.y - point0.y],
				[dir.z, point1.z - point0.z, point2.z - point0.z]]),
			B = [orig.x - point0.x, orig.y - point0.y, orig.z - point0.z],
			t = A[0][0] * B[0] + A[0][1] * B[1] + A[0][2] * B[2],
			u = A[1][0] * B[0] + A[1][1] * B[1] + A[1][2] * B[2],
			v = A[2][0] * B[0] + A[2][1] * B[1] + A[2][2] * B[2];

		return [t,u,v];
	};

	/**
	 * Compute the inverse of a 3-by-3 matrix.
	 * 
	 * @param {number[3][3]} m the matrix to invert
	 * @return {number[3][3]} the inverse of m
	 */
	hemi.utils.invertMat3 = function(m) {
		var t00 = m[1][1] * m[2][2] - m[1][2] * m[2][1],
			t10 = m[0][1] * m[2][2] - m[0][2] * m[2][1],
			t20 = m[0][1] * m[1][2] - m[0][2] * m[1][1],
			d = 1 / (m[0][0] * t00 - m[1][0] * t10 + m[2][0] * t20);

		return [[d * t00, -d * t10, d * t20],
			[-d * (m[1][0] * m[2][2] - m[1][2] * m[2][0]),
			 d * (m[0][0] * m[2][2] - m[0][2] * m[2][0]),
			 -d * (m[0][0] * m[1][2] - m[0][2] * m[1][0])],
			[d * (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
			 -d * (m[0][0] * m[2][1] - m[0][1] * m[2][0]),
			 d * (m[0][0] * m[1][1] - m[0][1] * m[1][0])]];
	};

	/**
	 * Perform linear interpolation on the given values. Values can be numbers or arrays or even
	 * nested arrays (as long as their lengths match).
	 * 
	 * @param {number} start start number (or array of numbers) for interpolation
	 * @param {number} stop stop number (or array of numbers) for interpolation
	 * @param {number} t coefficient for interpolation (usually time)
	 * @return {number} the interpolated number (or array of numbers)
	 */
	hemi.utils.lerp = function(start, stop, t) {
		var ret;

		if (hemi.utils.isArray(start)) {
			ret = [];

			for (var i = 0, il = start.length; i < il; ++i) {
				ret[i] = hemi.utils.lerp(start[i], stop[i], t);
			}
		} else {
			ret = start + (stop - start) * t;
		}

		return ret;
	};

	/**
	 * Perform linear interpolation on the given vectors.
	 * 
	 * @param {THREE.Vector3} start start vector for interpolation
	 * @param {THREE.Vector3} stop stop vector for interpolation
	 * @param {number} t coefficient for interpolation (usually time)
	 * @param {THREE.Vector3} opt_vec optional vector to receive interpolated value
	 * @return {THREE.Vector3} the interpolated vector
	 */
	hemi.utils.lerpVec3 = function(start, stop, t, opt_vec) {
		opt_vec = opt_vec || new THREE.Vector3();

		opt_vec.x = hemi.utils.lerp(start.x, stop.x, t);
		opt_vec.y = hemi.utils.lerp(start.y, stop.y, t);
		opt_vec.z = hemi.utils.lerp(start.z, stop.z, t);

		return opt_vec;
	};

	/**
	 * Convert the given linear interpolated value to an exponential interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the exponential value
	 */
	hemi.utils.linearToExponential = function(val, x) {
		return (Math.pow(x, val) - 1) / (x - 1);
	};

	/**
	 * Convert the given linear interpolated value to an inverse exponential interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @param {number} x the exponent to use
	 * @return {number} the inverse exponential value
	 */
	hemi.utils.linearToExponentialInverse = function(val, x) {
		return 1 - hemi.utils.linearToExponential(1 - val, x);
	};

	/**
	 * Convert the given linear interpolated value to a parabolic interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the parabolic value
	 */
	hemi.utils.linearToParabolic = function(val) {
		return val * val;
	};

	/**
	 * Convert the given linear interpolated value to a inverse parabolic interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the inverse parabolic value
	 */
	hemi.utils.linearToParabolicInverse = function(val) {
		return 1 - (1 - val) * (1 - val);
	};

	/**
	 * Convert the given linear interpolated value to a sinusoidal interpolated value.
	 * 
	 * @param {number} val the linear value
	 * @return {number} the sinusoidal value
	 */
	hemi.utils.linearToSine = function(val) {
		return (Math.sin(Math.PI * val - hemi.HALF_PI) + 1) / 2;
	};

	/**
	 * A container for all the common penner easing equations:
	 * linear
	 * quadratic 
	 * cubic
	 * quartic
	 * quintic
	 * exponential
	 * sinusoidal
	 * circular
	 */
	hemi.utils.penner = {

		linearTween: function (t, b, c, d) {
			return c*t/d + b;
		},

		easeInQuad: function (t, b, c, d) {
			t /= d;
			return c*t*t + b;
		},

		easeOutQuad: function (t, b, c, d) {
			t /= d;
			return -c * t*(t-2) + b;
		},

		easeInOutQuad: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t + b;
			t--;
			return -c/2 * (t*(t-2) - 1) + b;
		},

		easeInCubic: function (t, b, c, d) {
			t /= d;
			return c*t*t*t + b;
		},

		easeOutCubic: function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t + 1) + b;
		},

		easeInOutCubic: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t + 2) + b;
		},

		easeInQuart: function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t + b;
		},
		
		easeOutQuart: function (t, b, c, d) {
			t /= d;
			t--;
			return -c * (t*t*t*t - 1) + b;
		},

		easeInOutQuart: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t + b;
			t -= 2;
			return -c/2 * (t*t*t*t - 2) + b;
		},

		easeInQuint: function (t, b, c, d) {
			t /= d;
			return c*t*t*t*t*t + b;
		},
		
		easeOutQuint: function (t, b, c, d) {
			t /= d;
			t--;
			return c*(t*t*t*t*t + 1) + b;
		},

		easeInOutQuint: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2*t*t*t*t*t + b;
			t -= 2;
			return c/2*(t*t*t*t*t + 2) + b;
		},

		easeInSine: function (t, b, c, d) {
			return -c * Math.cos(t/d * hemi.HALF_PI) + c + b;
		},

		easeOutSine: function (t, b, c, d) {
			return c * Math.sin(t/d * hemi.HALF_PI) + b;
		},

		easeInOutSine: function (t, b, c, d) {
			return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
		},

		easeInExpo: function (t, b, c, d) {
			return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
		},

		easeOutExpo: function (t, b, c, d) {
			return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
		},

		easeInOutExpo: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
			t--;
			return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
		},

		easeInCirc: function (t, b, c, d) {
			t /= d;
			return -c * (Math.sqrt(1 - t*t) - 1) + b;
		},

		easeOutCirc: function (t, b, c, d) {
			t /= d;
			t--;
			return c * Math.sqrt(1 - t*t) + b;
		},

		easeInOutCirc: function (t, b, c, d) {
			t /= d/2;
			if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
			t -= 2;
			return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
		}

	};

	/** 
	 * Convert from quaternion to euler rotation
	 *
	 * @param {THREE.Quaternion} quaternion
	 * @return {THREE.Vector3} Euler rotation
	 */
	hemi.utils.quaternionToVector3 = function(quaternion) {
		return new THREE.Vector3().getRotationFromMatrix(new THREE.Matrix4().setRotationFromQuaternion(quaternion));
	};

	/** 
	 * Convert from spherical to cartesian coordinates.
	 *
	 * @param {number[3]} rtp array of radius, theta, phi
	 * @return {number[3]} XYZ cartesian coordinates
	 */
	hemi.utils.sphericalToCartesian = function(rtp) {
		var r = rtp[0],
			t = rtp[1],
			p = rtp[2],
			sinT = Math.sin(t);

		return [r * sinT * Math.cos(p),	// x
				r * sinT * Math.sin(p), // y
				r * Math.cos(t)]; // z
	};

	/**
	 * Convert the given UV coordinates for the given plane into XYZ coordinates in 3D space.
	 * 
	 * @param {number[2]} uv uv coordinates on a plane
	 * @param {THREE.Vector3[3]} plane array of 3 xyz coordinates defining the plane
	 * @return {THREE.Vector3} xyz coordinates of the uv location on the plane
	 */
	hemi.utils.uvToXYZ = function(uv, plane) {
		var point0 = plane[0],
			point1 = plane[1],
			point2 = plane[2],
			uf = new THREE.Vector3().sub(point1, point0).multiplyScalar(uv[0]),
			vf = _vector.sub(point2, point0).multiplyScalar(uv[1]);

		return uf.addSelf(vf).addSelf(point0);
	};

	/**
	 * Convert the given XYZ point in world space to screen coordinates. Note that this function
	 * converts the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Client} the Client containing the point
	 * @param {THREE.Vector3} point XYZ point to convert
	 * @return {THREE.Vector2} XY screen position of point
	 */
	hemi.utils.worldToScreen = function(client, point) {
		var camera = client.camera.threeCamera;
		camera.matrixWorldInverse.multiplyVector3(point);

		var viewZ = point.z;
		camera.projectionMatrix.multiplyVector3(point);

		var projX = point.x,
			projY = point.y;

		if (viewZ > 0) {
			projX = -projX;
			projY = -projY;
		}

		point.x = (1 + projX) * 0.5 * client.getWidth();
		point.y = (1 - projY) * 0.5 * client.getHeight();

		return new THREE.Vector2(Math.round(point.x), Math.round(point.y));
	};

	/**
	 * Convert the given XYZ point in world space to screen coordinates. Note that this function
	 * converts the actual point passed in, not a clone of it.
	 * 
	 * @param {hemi.Client} the Client containing the point
	 * @param {THREE.Vector3} point XYZ point to convert
	 * @return {THREE.Vector3} XY screen position of point plus z-distance, where 0.0 = near clip
	 *     and 1.0 = flar clip
	 */
	hemi.utils.worldToScreenFloat = function(client, point) {
		var camera = client.camera.threeCamera;
		camera.matrixWorldInverse.multiplyVector3(point);

		var viewZ = point.z;
		camera.projectionMatrix.multiplyVector3(point);

		var projX = point.x,
			projY = point.y;

		if (viewZ > 0) {
			projX = -projX;
			projY = -projY;
		}

		point.x = (1 + projX) * 0.5 * client.getWidth();
		point.y = (1 - projY) * 0.5 * client.getHeight();

		return point;
	};

})();
