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
				box = new THREE.CubeGeometry(h, w, d),
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
	 * Render a 3D representation of a curve.
	 *
	 * @param {number[3][]} points array of points (not waypoints)
	 * @param {Object} config configuration describing how the curve should look
	 */
	hemi.curve.drawCurve = function(points, config) {
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
	hemi.curve.drawLine = function(p0, p1, opt_size, opt_color) {
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
	hemi.curve.hideCurves = function(opt_trans) {
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
	
	/**
	 * Generate a random point within a bounding box
	 *
	 * @param {number[]} min Minimum point of the bounding box
	 * @param {number[]} max Maximum point of the bounding box
	 * @return {number[]} Randomly generated point
	 */
	hemi.curve.randomPoint = function(min, max) {
		var xi = Math.random();
		var yi = Math.random();
		var zi = Math.random();
		var x = xi*min[0] + (1-xi)*max[0];
		var y = yi*min[1] + (1-yi)*max[1];
		var z = zi*min[2] + (1-zi)*max[2];
		return [x,y,z];
	};
	
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
	hemi.curve.createSystem = function(client, cfg) {
		var system;
		
//		if (cfg.fast) {
//			if (cfg.trail) {
//				system = new hemi.curve.GpuParticleTrail(cfg);
//			} else {
//				system = new hemi.curve.GpuParticleSystem(cfg);
//			}
//		} else {
			system = new hemi.curve.ParticleSystem(client, cfg);
//		}
		
		return system;
	};
	
	/**
	 * Create a new material for a hemi particle curve to use.
	 * 
	 * @param {string} opt_type optional shader type to use (defaults to phong)
	 * @param {boolean} opt_trans optional flag indicating if material should
	 *     support transparency (defaults to true)
	 * @return {THREE.Material} the created material
	 */
	hemi.curve.newMaterial = function(opt_type, opt_trans) {
		var params = {
				color: 0x000000,
				opacity: 1,
				transparent: opt_trans == null ? true : opt_trans
			},
			mat;
		
		switch (opt_type) {
			case 'lambert':
				mat = new THREE.MeshLambertMaterial(params);
				break;
			case 'phong':
				mat = new THREE.MeshPhongMaterial(params);
				break;
			default:
				mat = new THREE.MeshBasicMaterial(params);
				break;
		}
		
		return mat;
	};

	/**
	 * @class A Curve is used to represent and calculate different curves
	 * including: linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {number[3][]} points List of xyz waypoints 
	 * @param {hemi.curve.CurveType} opt_type Curve type
	 * @param {Object} opt_config Configuration object specific to this curve
	 */
	hemi.curve.Curve = function(points, opt_type, opt_config) {
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
	hemi.curve.Particle = function(trans, points, colorKeys, scaleKeys, rotate) {
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
	hemi.curve.ParticleSystem = function(client, config) {
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
//				this.shapes.push(hemi.core.primitives.createPrism(pack, this.shapeMaterial,
//					[[0, size], [-size, 0], [-halfSize, 0], [-halfSize, -size],
//					[halfSize, -size], [halfSize, 0], [size, 0]], size));
//				break;
			case (hemi.curve.ShapeType.CUBE):
				this.shapes.push(new THREE.CubeGeometry(size, size, size));
//				this.shapes.push(hemi.core.primitives.createCube(pack,
//					this.shapeMaterial,size));
				break;
			case (hemi.curve.ShapeType.SPHERE):
				this.shapes.push(new THREE.SphereGeometry(size, 12, 12));
//				this.shapes.push(hemi.core.primitives.createSphere(pack,
//					this.shapeMaterial,size,24,12));
				break;
		}
		
		hemi.addRenderListener(this);
		
		this.boxesOn = false;
		
		this.points = [];
		this.frames = config.frames || this.pLife*client.camera.FPS;
		
		for(var j = 0; j < this.maxParticles; j++) {
			var curve = this.newCurve(config.tension || 0);
			this.points[j] = [];
			for(var i=0; i < this.frames; i++) {
				this.points[j][i] = curve.interpolate((i)/this.frames);
			}
		}
		console.log(this);
		
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
	};
	
	return hemi;
})(hemi || {});
