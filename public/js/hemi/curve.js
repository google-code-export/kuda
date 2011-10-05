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
