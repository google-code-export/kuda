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

	var dbgBoxMat =  new THREE.MeshPhongMaterial({
			color: 0x000088,
			wireframe: true,
			wireframeLinewidth: 1
		}),	
		dbgBoxTransforms = {},
		dbgLineMat = null,
		dbgLineTransforms = [];

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleCurve shader code
////////////////////////////////////////////////////////////////////////////////////////////////////

	var shaderChunks = {
		vert: {
			header: 
				'uniform float sysTime; \n' +
				'uniform float ptcMaxTime; \n' +
				'uniform float ptcDec; \n' +
				'uniform float numPtcs; \n' +
				'uniform float tension; \n' +
				'uniform mat4 viewIT; \n' +
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
				'  mat4 ptcWorldViewIT = viewIT*tMatIT*rMat*sMat; \n' +
				'  mat3 ptcNorm = mat3(ptcWorldViewIT[0].xyz, ptcWorldViewIT[1].xyz, ptcWorldViewIT[2].xyz); \n' +
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
	 *     life: lifetime of particle system (in seconds)
	 *     particleCount: number of particles to allocate for system
	 *     particleShape: mesh containg shape geometry to use for particles
	 *     scales: array of values for particle scale ramp (use this or scaleKeys)
	 *     scaleKeys: array of time keys and values for particle size ramp
	 *     tension: tension parameter for the curve (typically from -1 to 1)
	 *     trail: flag to indicate system should have trailing start and stop
	 * @return {Object} the created particle system
	 */
	hemi.createCurveSystem = function(client, cfg) {
		var system;
		
		if (cfg.fast) {
			if (cfg.trail) {
				system = new hemi.GpuParticleTrail(client, cfg);
			} else {
				system = new hemi.GpuParticleCurveSystem(client, cfg);
			}
		} else {
			system = new hemi.ParticleCurveSystem(client, cfg);
		}
		
		return system;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Enum for different curve interpolation types.
	 */
	hemi.CurveType = {
		Linear : 0,
		Bezier : 1,
		CubicHermite : 2,
		LinearNorm : 3,
		Cardinal : 4,
		Custom : 5
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// BoundingBox class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A BoundingBox is defined by a minimum XYZ point and a maximum XYZ point.
	 * 
	 * @param {THREE.Vector3} opt_min minimum XYZ point
	 * @param {THREE.Vector3} opt_max maximum XYZ point
	 */
	hemi.BoundingBox = function(opt_min, opt_max) {
		/**
		 * The minimum XYZ point
		 * @type THREE.Vector3
		 */
		this.min = opt_min || new THREE.Vector3();
		
		/**
		 * The maximum XYZ point
		 * @type THREE.Vector3
		 */
		this.max = opt_max || new THREE.Vector3();
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Curve class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Curve is used to represent and calculate different interpolation curves including
	 * linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {THREE.Vector3[]} points array of xyz waypoints 
	 * @param {hemi.CurveType} opt_type optional curve interpolation type
	 * @param {Object} opt_config optional configuration object for the Curve
	 */
	var Curve = function(points, opt_type, opt_config) {
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

	/*
	 * Octane properties for Curve.
	 * @type string[]
	 */
	Curve.prototype._octane = function() {
		var names = ['count', 'tension', 'weights', 'xpts', 'xtans', 'ypts', 'ytans', 'zpts', 'ztans'],
			props = [];

		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		props.push({
			name: 'setType',
			arg: [this.type]
		});

		return props;
	};

	/**
	 * Draw the Curve using primitive shapes.
	 * 
	 * @param {number} samples the number of samples to use to draw
	 * @param {Object} config configuration for how the Curve should look
	 */
	Curve.prototype.draw = function(samples, config) {
		var points = [];

		for (var i = 0, il = samples + 2; i < il; ++i) {
			points[i] = this.interpolate(i / (samples + 1));
		}

		drawCurve(points, config);
	};

	/**
	 * Get the XYZ position of the last waypoint of the Curve.
	 * 
	 * @return {THREE.Vector3} the position of the last waypoint
	 */
	Curve.prototype.getEnd = function() {
		var end = this.count - 1;
		return new THREE.Vector3(this.xpts[end],this.ypts[end],this.zpts[end]);
	};
	
	/**
	 * Get the XYZ position of the first waypoint of the Curve.
	 * 
	 * @return {THREE.Vector3} the position of the first waypoint
	 */
	Curve.prototype.getStart = function() {
		return new THREE.Vector3(this.xpts[0],this.ypts[0],this.zpts[0]);
	};

	/**
	 * Base interpolation function for this curve. Usually overwritten.
	 *
	 * @param {number} t time (usually between 0 and 1)
	 * @return {THREE.Vector3} the position interpolated from the time input
	 */
	Curve.prototype.interpolate = function(t) {
		return new THREE.Vector3(t,t,t);
	};

	/**
	 * Load the given configuration options into the Curve.
	 * 
	 * @param {Object} cfg configuration options for the Curve
	 */
	Curve.prototype.loadConfig = function(cfg) {
		var points = cfg.points,
			type = cfg.type || this.type || hemi.CurveType.Linear;

		this.setType(type);

		if (points) {
			this.count = points.length;

			for (var i = 0; i < this.count; i++) {
				this.xpts[i] = points[i].x;
				this.ypts[i] = points[i].y;
				this.zpts[i] = points[i].z;
				this.xtans[i] = 0;
				this.ytans[i] = 0;
				this.ztans[i] = 0;
				this.weights[i] = 1;
			}
		}

		if (cfg.weights) {
			for (var i = 0; i < this.count; i++) {
				this.weights[i] = (cfg.weights[i] !== undefined) ? cfg.weights[i] : 1;
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

		if (this.type === hemi.CurveType.Cardinal) {
			setTangents.call(this);
		}
	};

	/**
	 * Set the type of interpolation for the Curve.
	 * 
	 * @param {hemi.CurveType} type interpolation type
	 */
	Curve.prototype.setType = function(type) {
		this.type = type;

		switch (type) {
			case hemi.CurveType.Bezier:
				this.interpolate = interpolateBezier;
				break;
			case hemi.CurveType.CubicHermite:
			case hemi.CurveType.Cardinal:
				this.interpolate = interpolateCubicHermite;
				break;
			case hemi.CurveType.Linear:
				this.interpolate = interpolateLinear;
				break;
			case hemi.CurveType.LinearNorm:
				this.interpolate = interpolateLinearNorm;
				break;
			default:
				break;
		}
	};

// Private functions for Curve

		/*
		 * The bezier interpolation starts at the first waypoint and ends at the last waypoint, and
		 * 'bends' toward the intermediate points. These points can be weighted for more bending.
		 * 
		 * @param {number} time time (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
	var interpolateBezier = function(time) {
			var points = this.count,
				x = 0,
				y = 0,
				z = 0,
				w = 0;

			for (var i = 0; i < points; ++i) {
				var fac = this.weights[i] * hemi.utils.choose(points - 1, i) * Math.pow(time, i) *
					Math.pow((1 - time), (points - 1 - i));

				x += fac * this.xpts[i];
				y += fac * this.ypts[i];
				z += fac * this.zpts[i];
				w += fac;
			}

			return new THREE.Vector3(x/w, y/w, z/w);
		},

		/*
		 * The cubic hermite function interpolates along a line that runs through the Curve's
		 * waypoints at a predefined tangent slope through each one.
		 * 
		 * @param {number} time time (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
		interpolateCubicHermite = function(time) {
			var last = this.count - 1,
				ndx = Math.floor(time * last);

			if (ndx >= last) {
				ndx = last - 1;
			}

			var factor = ndx / last,
				tt = (time - factor) / ((ndx + 1) / last - factor),
				x = hemi.utils.cubicHermite(tt, this.xpts[ndx], this.xtans[ndx], this.xpts[ndx+1], this.xtans[ndx+1]);
				y = hemi.utils.cubicHermite(tt, this.ypts[ndx], this.ytans[ndx], this.ypts[ndx+1], this.ytans[ndx+1]);
				z = hemi.utils.cubicHermite(tt, this.zpts[ndx], this.ztans[ndx], this.zpts[ndx+1], this.ztans[ndx+1]);

			return new THREE.Vector3(x, y, z);
		},

		/*
		 * The linear interpolation moves on a straight line between waypoints.
		 *
		 * @param {number} time time of interpolation (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
		interpolateLinear = function(time) {
			var last = this.count - 1,
				ndx = Math.floor(time * points);

			if (ndx >= last) {
				ndx = last - 1;
			}

			var factor = ndx / last,
				tt = (time - factor) / ((ndx + 1) / last - factor),
				x = (1 - tt) * this.xpts[ndx] + tt * this.xpts[ndx+1];
				y = (1 - tt) * this.ypts[ndx] + tt * this.ypts[ndx+1];
				z = (1 - tt) * this.zpts[ndx] + tt * this.zpts[ndx+1];

			return new THREE.Vector3(x, y, z);
		},

		/*
		 * The normalized linear interpolation moves on a straight line between waypoints at a
		 * constant velocity.
		 *
		 * @param {number} time time (usually between 0 and 1)
		 * @return {THREE.Vector3} the position interpolated from the time input
		 */
		interpolateLinearNorm = function(time) {
			var dist = 0,
				dpts = [0];

			for (var i = 1, il = this.count; i < il; ++i) {
				var xDist = this.xpts[i-1] - this.xpts[i],
					yDist = this.ypts[i-1] - this.ypts[i],
					zDist = this.zpts[i-1] - this.zpts[i];

				dist += Math.sqrt(xDist * xDist + yDist * yDist + zDist * zDist);
				dpts[i] = d;
			}

			var tt = time * dist,
				ndx = 0;

			for (var i = 1, il = this.count; i < il; ++i) {
				if (dpts[i] < tt) {
					ndx = i;
				}
			}

			var lt = (tt - dpts[ndx]) / (dpts[ndx+1] - dpts[ndx]),
				x = (1 - lt) * this.xpts[ndx] + lt * this.xpts[ndx+1],
				y = (1 - lt) * this.ypts[ndx] + lt * this.ypts[ndx+1],
				z = (1 - lt) * this.zpts[ndx] + lt * this.zpts[ndx+1];

			return new THREE.Vector3(x, y, z);
		},

		/*
		 * Calculate the tangents for a cardinal curve, which is a cubic hermite curve where the
		 * tangents are defined by a single 'tension' factor.
		 */
		setTangents = function() {
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
		};

	hemi.Curve = Curve;
	hemi.makeOctanable(hemi.Curve, 'hemi.Curve', hemi.Curve.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleCurve class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleCurve is a particle system that uses volumetric waypoints (boxes) to create
	 * curved paths for particles to follow.
	 * 
	 * @param {Object} opt_cfg optional configuration object for the ParticleCurve
	 */
	var ParticleCurve = function(client, opt_cfg) {
		this._aim = false;
		this._boxes = [];
		this._colors = [];
		this._decparam = null;
		this._materialSrc = null;
		this._maxTimeParam = null;
		this._mesh = null;
		this._particles = 0;
		this._scales = [];
		this._tension = 0;
		this._timeParam = null;
		this._viewITParam = null;

		/**
		 * Flag indicating if the ParticleCurve is currently running.
		 * @type boolean
		 */
		this.active = false;
		/**
		 * The Client that the ParticleCurve is being rendered by.
		 * @type hemi.Client
		 */
		this.client = client;
		/**
		 * The lifetime of the ParticleCurve. This is the amount of time it takes a particle to
		 * travel from the first waypoint to the last.
		 * @type number
		 */
		this.life = 0;

		if (opt_cfg) {
			this.loadConfig(opt_cfg);
		}
	};

	/*
	 * Array of Hemi Messages that ParticleCurve is known to send.
	 * @type string[]
	 */
	ParticleCurve.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for ParticleCurve.
	 * @type string[]
	 */
	ParticleCurve.prototype._octane = function() {
		return [{
			name: 'mesh',
			id: this._mesh._getId()
		}, {
			name: 'loadConfig',
			arg: [{
				aim: this._aim,
				boxes: this._boxes,
				colorKeys: this._colors,
				life: this.life,
				particleCount: this._particles,
				scaleKeys: this._scales,
				tension: this._tension
			}]
		}];
	};

	/**
	 * Hide the ParticleCurve's waypoint boxes from view.
	 */
	ParticleCurve.prototype.hideBoxes = function() {
		if (this._mesh) {
			var trans = dbgBoxTransforms[this._mesh.id] || [];

			for (var i = 0, il = trans.length; i < il; ++i) {
				this._mesh.remove(trans[i]);
			}

			delete dbgBoxTransforms[this._mesh.id];
		}
	};

	/**
	 * Load the given configuration object and set up the ParticleCurve.
	 * 
	 * @param {Object} cfg configuration object
	 */
	ParticleCurve.prototype.loadConfig = function(cfg) {
		this._aim = cfg.aim === undefined ? false : cfg.aim;
		this._boxes = cfg.boxes ? hemi.utils.clone(cfg.boxes) : [];
		this.life = cfg.life || 5;
		this._particles = cfg.particleCount || 0;
		this._tension = cfg.tension || 0;

		if (cfg.colorKeys) {
			this.setColorKeys(cfg.colorKeys);
		} else if (cfg.colors) {
			this.setColors(cfg.colors);
		} else {
			this._colors = [];
		}

		if (cfg.scaleKeys) {
			this.setScaleKeys(cfg.scaleKeys);
		} else if (cfg.scales) {
			this.setScales(cfg.scales);
		} else {
			this._scales = [];
		}

		if (cfg.particleShape) {
			this.setParticleShape(cfg.particleShape);
		} else {
			this._mesh = null;
		}
	};

	/**
	 * Update the particles on each render.
	 * 
	 * @param {Object} e the render event
	 */
	ParticleCurve.prototype.onRender = function(e) {
		var delta = e.elapsedTime / this.life,
			newTime = this._timeParam.value + delta;

		while (newTime > 1) {
			--newTime;
		}

		// refresh uniforms
		this._timeParam.value = newTime;
		this._viewITParam.value.copy(this.client.camera.threeCamera.matrixWorld).transpose();
	};

	/**
	 * Pause the ParticleCurve.
	 */
	ParticleCurve.prototype.pause = function() {
		if (this.active) {
			hemi.removeRenderListener(this);
			this.active = false;
		}
	};

	/**
	 * Resume the ParticleCurve.
	 */
	ParticleCurve.prototype.play = function() {
		if (!this.active) {
			if (this._maxTimeParam.value === 1) {
				hemi.addRenderListener(this);
				this.active = true;
			} else {
				this.start();
			}
		}
	};

	/**
	 * Set whether or not particles should orient themselves along the curve they are following.
	 * 
	 * @param {boolean} aim flag indicating if particles should aim along the curve
	 */
	ParticleCurve.prototype.setAim = function(aim) {
		if (this._aim !== aim) {
			this._aim = aim;
			setupShaders.call(this);
		}
	};

	/**
	 * Set the bounding boxes that define waypoints for the ParticleCurve's curves.
	 * 
	 * @param {hemi.BoundingBox[]} boxes array of boxes defining volumetric waypoints for the
	 *     ParticleCurve
	 */
	ParticleCurve.prototype.setBoxes = function(boxes) {
		var oldLength = this._boxes.length;
		this._boxes = hemi.utils.clone(boxes);

		if (this._boxes.length === oldLength) {
			setupBounds.call(this);
		} else {
			setupShaders.call(this);
		}
	};

	/**
	 * Set the color ramp for the particles as they travel along the curve.
	 * 
	 * @param {number[4][]} colors array of RGBA color values
	 */
	ParticleCurve.prototype.setColors = function(colors) {
		var len = colors.length,
			step = len === 1 ? 1 : 1 / (len - 1),
			colorKeys = [];

		for (var i = 0; i < len; ++i) {
			colorKeys.push({
				key: i * step,
				value: colors[i]
			});
		}

		this.setColorKeys(colorKeys);
	};

	/**
	 * Set the color ramp for the particles as they travel along the curve, specifying the
	 * interpolation times for each color.
	 * 
	 * @param {Object[]} colorKeys array of color keys, sorted into ascending key order
	 */
	ParticleCurve.prototype.setColorKeys = function(colorKeys) {
		var len = colorKeys.length;

		if (len === 1) {
			// We need at least two to interpolate
			var clr = colorKeys[0].value;
			this._colors = [{
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
			this._colors = colorKeys;
		} else {
			this._colors = [];
		}

		setupShaders.call(this);
	};

	/**
	 * Set the material to use for the particles. Note that the material's shader will be modified
	 * for the ParticleCurve.
	 * 
	 * @param {THREE.Material} material the material to use for particles
	 */
	ParticleCurve.prototype.setMaterial = function(material) {
		if (this._mesh) {
			this._mesh.material = material;

			if (!material.program) {
				var scene = this.client.scene;
				this.client.renderer.initMaterial(material, scene.lights, scene.fog, this._mesh);
			}

			var shads = hemi.utils.getShaders(this.client, material);

			this._materialSrc = {
				frag: shads.fragSrc,
				vert: shads.vertSrc
			};

			setupShaders.call(this);
		}
	};

	/**
	 * Set the total number of particles for the ParticleCurve to create.
	 *  
	 * @param {number} numPtcs number of particles
	 */
	ParticleCurve.prototype.setParticleCount = function(numPtcs) {
		this._particles = numPtcs;

		if (this._mesh) {
			// Recreate the custom vertex buffers
			this.setParticleShape(this._mesh);
		}
	};

	/**
	 * Set the shape of the particles to the given shape geometry. This may take some time as a new
	 * vertex buffer gets created.
	 * 
	 * @param {hemi.Mesh} mesh the mesh containing the shape geometry to use
	 */
	ParticleCurve.prototype.setParticleShape = function(mesh) {			
		if (this._mesh) {
			if (this._mesh.parent) this.client.scene.remove(this._mesh);
			this._mesh = null;
		}

		if (!mesh.parent) this.client.scene.add(mesh);

		this._mesh = mesh;
		this._particles = this._particles || 1;

		var retVal = modifyGeometry(this._mesh.geometry, this._particles);
		this.idArray = retVal.ids;
		this.offsetArray = retVal.offsets;
		this.idOffsets = retVal.idOffsets;

		this.setMaterial(mesh.material || newMaterial());
	};

	/**
	 * Set the scale ramp for the particles as they travel along the curve.
	 * 
	 * @param {THREE.Vector3[]} scales array of XYZ scale values
	 */
	ParticleCurve.prototype.setScales = function(scales) {
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
	};

	/**
	 * Set the scale ramp for the particles as they travel along the curve, specifying the
	 * interpolation times for each scale.
	 * 
	 * @param {Object[]} scaleKeys array of scale keys, sorted into ascending key order
	 */
	ParticleCurve.prototype.setScaleKeys = function(scaleKeys) {
		var len = scaleKeys.length;

		if (len === 1) {
			// We need at least two to interpolate
			var scl = scaleKeys[0].value;
			this._scales = [{
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
			this._scales = scaleKeys;
		} else {
			this._scales = [];
		}

		setupShaders.call(this);
	};

	/**
	 * Set the tension parameter for the curve. This controls how round or straight the curve
	 * sections are.
	 * 
	 * @param {number} tension tension value (typically from -1 to 1)
	 */
	ParticleCurve.prototype.setTension = function(tension) {
		this._tension = tension;

		if (this._mesh) {
			this._mesh.material.getParam('tension').value = (1 - this._tension) / 2;
		}
	};

	/**
	 * Render the waypoint boxes which the curves run through (helpful for debugging).
	 */
	ParticleCurve.prototype.showBoxes = function() {
		if (this._mesh) {
			var trans = dbgBoxTransforms[this._mesh.id] || [];

			for (var i = 0; i < this._boxes.length; i++) {
				var b = this._boxes[i],
					w = b.max.x - b.min.x,
					h = b.max.y - b.min.y,
					d = b.max.z - b.min.z,
					x = b.min.x + w/2,
					y = b.min.y + h/2,
					z = b.min.z + d/2,
					box = new THREE.CubeGeometry(w, h, d),
					mesh = new THREE.Mesh(box, dbgBoxMat);

				mesh.position.addSelf(new THREE.Vector3(x, y, z));
				this._mesh.add(mesh);
				trans.push(mesh);
			}

			dbgBoxTransforms[this._mesh.id] = trans;
		}
	};

	/**
	 * Start the ParticleCurve.
	 */
	ParticleCurve.prototype.start = function() {
		if (!this.active) {
			this.active = true;
			this._timeParam.value = 1.0;
			this._maxTimeParam.value = 1.0;
			hemi.addRenderListener(this);
		}
	};

	/**
	 * Stop the ParticleCurve.
	 */
	ParticleCurve.prototype.stop = function() {
		if (this.active) {
			this.active = false;
			this._timeParam.value = 1.1;
			this._maxTimeParam.value = 3.0;
			hemi.removeRenderListener(this);
		}
	};

	/**
	 * Translate the entire particle system by the given amounts
	 * @param {number} x amount to translate in the X direction
	 * @param {number} y amount to translate in the Y direction
	 * @param {number} z amount to translate in the Z direction
	 */
	ParticleCurve.prototype.translate = function(x, y, z) {
		for (var i = 0, il = this._boxes.length; i < il; i++) {
			var box = this._boxes[i],
				min = box.min,
				max = box.max;

			min[0] += x;
			max[0] += x;
			min[1] += y;
			max[1] += y;
			min[2] += z;
			max[2] += z;
		}

		setupBounds.call(this);
	};

// Private functions for ParticleCurve

	/*
	 * Modify the particle material's shaders so that the particle system can be rendered using its
	 * current configuration. At a minimum, the mesh and curve boxes need to be defined.
	 */
	function setupShaders() {
		if (!this._mesh || !this._materialSrc || this._boxes.length < 2) {
			return;
		}

		var gl = this.client.renderer.context,
			chunksVert = shaderChunks.vert,
			chunksFrag = shaderChunks.frag,
			material = this._mesh.material,
			oldProgram = material.program,
			program = material.program = oldProgram.isCurveGen ? oldProgram : gl.createProgram(),
			fragSrc = this._materialSrc.frag,
			vertSrc = this._materialSrc.vert,
			numBoxes = this._boxes.length,
			numColors = this._colors.length,
			numScales = this._scales.length,
			addColors = numColors > 1,
			addScale = numScales > 1,
			shads = hemi.utils.getShaders(this.client, material),
			fragShd = shads.fragShd,
			vertShd = shads.vertShd,
			dec = 1.0,
			maxTime = 3.0,
			time = 1.1,
			uniformNames = ['sysTime', 'ptcMaxTime', 'ptcDec', 'numPtcs',
				'tension', 'ptcScales', 'ptcScaleKeys', 'minXYZ', 'maxXYZ',
				'ptcColors', 'ptcColorKeys', 'viewIT'];

		// Remove any previously existing uniforms that we created
		for (var i = 0, il = uniformNames.length; i < il; ++i) {
			var name = uniformNames[i],
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
				delete program.uniforms[name];
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

			if (this._aim) {
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
					.replace(/objectMatrix/g, 'ptcWorld')
					.replace(/normalMatrix/g, 'ptcNorm');

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
			}

			parsedFrag.body = parsedFrag.body.replace(/opacity/g, '(opacity * ptcColor.a)');
			fragSrc = material.fragmentShader = hemi.utils.buildSrc(parsedFrag);

			var fShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fShader, fragSrc);
			gl.compileShader(fShader);
			gl.detachShader(program, fragShd);
			gl.attachShader(program, fShader);
		}

		// add the attributes and uniforms to the material
		var attributes = {
				idOffset: { type: 'v2', value: this.idOffsets, needsUpdate: true }
			},
			uniforms = {
				sysTime: { type: 'f', value: time },
				ptcMaxTime: { type: 'f', value: maxTime },
				ptcDec: { type: 'f', value: dec },
				numPtcs: { type: 'f', value: this._particles },
				tension: { type: 'f', value: (1 - this._tension) / 2 },
				minXYZ: { type: 'v3v', value: [] },
				maxXYZ: { type: 'v3v', value: [] },
				viewIT: { type: 'm4', value: new THREE.Matrix4() }
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

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			hemi.error('Could not initialise shader. VALIDATE_STATUS: ' +
				gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + ', gl error [' +
				gl.getError() + ']');
		}

		program.uniforms = {};
		program.attributes = {};
		program.isCurveGen = true;

		for (var u in material.uniforms) {
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
		this._decparam = material.uniforms.ptcDec;
		this._maxTimeParam = material.uniforms.ptcMaxTime;
		this._timeParam = material.uniforms.sysTime;
		this._viewITParam = material.uniforms.viewIT;

		setupBounds.call(this);

		var needsZ = false;

		for (var i = 0; i < numColors && !needsZ; i++) {
			needsZ = this._colors[i].value[3] < 1;
		}

		material.transparent = needsZ;

		if (addColors) {
			setupColors(material, this._colors);
		}
		if (addScale) {
			setupScales(material, this._scales);
		}

		// force rebuild of buffers
		this._mesh.dynamic = true;
		this._mesh.__webglInit = this._mesh.__webglActive = false;
		delete this._mesh.geometry.geometryGroups;
		delete this._mesh.geometry.geometryGroupsList;
		this.client.scene.__objectsAdded.push(this._mesh);
	}

	/*
	 * Set the parameters for the ParicleCurve's Material so that it supports a curve through its
	 * bounding boxes.
	 */
	function setupBounds() {
		if (this._mesh) {
			var material = this._mesh.material,
				boxes = this._boxes,
				minParam = material.uniforms.minXYZ,
				maxParam = material.uniforms.maxXYZ;

			minParam._array = new Float32Array(3 * boxes.length);
			maxParam._array = new Float32Array(3 * boxes.length);

			for (var i = 0, il = boxes.length; i < il; ++i) {
				var box = boxes[i];

				minParam.value[i] = box.min;
				maxParam.value[i] = box.max;
			}
		}
	}

	hemi.makeCitizen(ParticleCurve, 'hemi.ParticleCurve', {
		toOctane: ParticleCurve.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ParticleCurveTrail class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ParticleCurve that has trailing starts and stops.
	 * @extends hemi.ParticleCurve
	 * 
	 * @param {Object} opt_cfg the configuration object for the system
	 */
	var ParticleCurveTrail = function(client, opt_cfg) {
		ParticleCurve.call(this, client, opt_cfg);

		this.endTime = 1.0;
		this.starting = false;
		this.stopping = false;
	};

	ParticleCurveTrail.prototype = new ParticleCurve();
	ParticleCurveTrail.prototype.constructor = ParticleCurveTrail;

	/**
	 * Update the particles on each render.
	 * 
	 * @param {Object} e the render event
	 */
	ParticleCurveTrail.prototype.onRender = function(e) {
		var delta = e.elapsedTime / this.life,
			newTime = this._timeParam.value + delta;

		if (newTime > this.endTime) {
			if (this.stopping) {
				this.active = false;
				this.stopping = false;
				this._maxTimeParam.value = 3.0;
				hemi.removeRenderListener(this);
				newTime = 1.1;
			} else {
				if (this.starting) {
					this.starting = false;
					this.endTime = 1.0;
					this._decparam.value = 1.0;
					this._maxTimeParam.value = 1.0;
				}

				while (--newTime > this.endTime) {}
			}
		}

		if (this.stopping) {
			this._maxTimeParam.value += delta;
		}

		this._timeParam.value = newTime;
		this._viewITParam.value.copy(this.client.camera.threeCamera.matrixWorld).transpose();
	};

	/**
	 * Resume the ParticleCurveTrail.
	 */
	ParticleCurveTrail.prototype.play = function() {
		if (!this.active) {
			if (this.starting || this.stopping || this._maxTimeParam.value === 1.0) {
				hemi.addRenderListener(this);
				this.active = true;
			} else {
				this.start();
			}
		}
	};

	/**
	 * Start the ParticleCurveTrail.
	 */
	ParticleCurveTrail.prototype.start = function() {
		if (this.stopping) {
			hemi.removeRenderListener(this);
			this.active = false;
			this.stopping = false;
		}
		if (!this.active) {
			this.active = true;
			this.starting = true;
			this.stopping = false;
			this.endTime = 2.0;
			this._decparam.value = 2.0;
			this._maxTimeParam.value = 2.0;
			this._timeParam.value = 1.0;
			hemi.addRenderListener(this);
		}
	};

	/**
	 * Stop the ParticleCurveTrail.
	 * 
	 * @param {boolean} opt_hard optional flag to indicate a hard stop (all particles disappear at
	 *     once)
	 */
	ParticleCurveTrail.prototype.stop = function(opt_hard) {
		if (this.active) {
			if (opt_hard) {
				this.endTime = -1.0;
			} else if (!this.stopping) {
				this.endTime = this._timeParam.value + 1.0;
			}

			this.starting = false;
			this.stopping = true;
		}
	};

	hemi.makeCitizen(ParticleCurveTrail, 'hemi.ParticleCurveTrail', {
		toOctane: ParticleCurveTrail.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility Methods
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Render a 3D representation of a curve.
	 *
	 * @param {THREE.Vector3[]} points array of points (not waypoints)
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
	}

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
	}

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
	}

	/*
	 * Take the existing vertex buffer in the given primitive and copy the data once for each of the
	 * desired number of particles. 
	 * 
	 * @param {THREE.Geometry} geometry the geoemtry to modify
	 * @param {number} numParticles the number of particles to create vertex
	 *     data for
	 */
	function modifyGeometry(geometry, numParticles) {
		var verts = geometry.vertices,
			faces = geometry.faces,
			faceVertexUvs = geometry.faceVertexUvs,
			numVerts = verts.length,
			numFaces = faces.length,
			ids = [],
			offsets = [],
			idOffsets = [];

		for (var i = 0; i < numVerts; i++) {
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
		};
	}

	/*
	 * Create a new material for a ParticleCurve to use.
	 * 
	 * @param {string} opt_type optional shader type to use (defaults to phong)
	 * @param {boolean} opt_trans optional flag indicating if material should support transparency
	 *     (defaults to true)
	 * @return {THREE.Material} the created material
	 */
	function newMaterial(opt_type, opt_trans) {
		var params = {
				color: 0xff0000,
				opacity: 1,
				transparent: opt_trans === undefined ? true : opt_trans
			},
			mat;

		if (opt_type === 'lambert') {
			mat = new THREE.MeshLambertMaterial(params);
		} else {
			mat = new THREE.MeshPhongMaterial(params);
		}

		return mat;
	}

	/*
	 * Set the parameters for the given Material so that it adds a color ramp to the particles using
	 * it.
	 * 
	 * @param {THREE.Material} material material to set parameters for
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
	}

	/*
	 * Set the parameters for the given Material so that it adds a scale ramp to the particles using
	 * it.
	 * 
	 * @param {THREE.Material} material material to set parameters for
	 * @param {Object[]} scales array of XYZ scale values and keys
	 */
	function setupScales(material, scales) {
		var sclParam = material.uniforms.ptcScales,
			keyParam = material.uniforms.ptcScaleKeys;

		sclParam._array = new Float32Array(3 * scales.length);

		for (var i = 0, il = scales.length; i < il; ++i) {
			var obj = scales[i];

			sclParam.value[i] = obj.value;
			keyParam.value[i] = obj.key;
		}
	}

	return hemi;
})(hemi || {});
