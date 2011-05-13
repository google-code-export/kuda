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
o3djs.require('hemi.core');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for curves and particle systems.
	 */
	hemi.curve = hemi.curve || {};

	/**
	 * Enum for different curve types, described below.
	 * <ul><pre>
	 * <li>hemi.curve.curveType.Linear
	 * <li>hemi.curve.curveType.Bezier
	 * <li>hemi.curve.curveType.CubicHermite
	 * <li>hemi.curve.curveType.LinearNorm
	 * <li>hemi.curve.curveType.Cardinal
	 * <li>hemi.curve.curveType.Custom
	 * </ul></pre>
	 */
	hemi.curve.curveType = {
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
	 * Render a 3D representation of a curve.
	 *
	 * @param {number[][]} points Array of points (not waypoints)
	 * @param {hemi.config} config Configuration describing how the curve should look
	 */
	hemi.curve.drawCurve = function(points,config) {
		var jshow = (config.joints == null) ? true : config.joints;
		var jsize = config.jointSize || 10;
		var jcolor = config.jointColor || [1,1,0,1];
		var eshow = (config.edges == null) ? true : config.edges;
		var esize = config.edgeSize || 2;
		var ecolor = config.edgeColor || [0.5,0,0,1];
		var ballMat = o3djs.material.createBasicMaterial(hemi.curve.pack,hemi.view.viewInfo,jcolor);
		var param = ballMat.getParam('lightWorldPos'); 
		if(param) {
			param.bind(hemi.world.camera.light.position);
		}
		var mainTransform = hemi.curve.pack.createObject('Transform');
		mainTransform.parent = hemi.core.client.root;
		for (var i = 0; i < points.length; i++) {
			if(jshow) {
				var transform = hemi.curve.pack.createObject('Transform');
				transform.parent = mainTransform;
				var joint = o3djs.primitives.createSphere(hemi.curve.pack,ballMat,jsize,20,20);
				transform.addShape(joint);
				transform.translate(points[i]);
			}
			if (i < (points.length - 1) && eshow) {
				this.drawLine(points[i],points[i+1],mainTransform,esize,ecolor);
			}
		}
		return mainTransform;
	};
	
	/**
	 * Draw a line connecting two points.
	 *
	 * @param {number[]} p0 The first point
	 * @param {number[]} p1 The second point
	 * @param {number} opt_size Thickness of the line
	 * @param {number[]} opt_color Color of the line
	 */
	hemi.curve.drawLine = function(p0,p1,pTrans,opt_size,opt_color) {
		var size = opt_size || 2;
		var color = opt_color || [0.5,0,0,1];
		var lineMat = o3djs.material.createBasicMaterial(hemi.curve.pack,hemi.view.viewInfo,color);
		var param = lineMat.getParam('lightWorldPos'); 
		if(param) {
			param.bind(hemi.world.camera.light.position);
		}
		var dist = o3djs.math.distance(p0,p1);
		var midpoint = [ (p0[0]+p1[0])/2, (p0[1]+p1[1])/2, (p0[2]+p1[2])/2 ];
		var line = o3djs.primitives.createCylinder(hemi.curve.pack,lineMat,size,dist,3,1);
		var transform = hemi.curve.pack.createObject('Transform');
		transform.parent = pTrans;
		transform.addShape(line);
		transform.translate(midpoint);
		transform = hemi.utils.pointYAt(transform,midpoint,p0);
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
	 * 		debugging purposes.
	 * 
	 * @param {number[3][2][]} boxes array of pairs of XYZ coordinates, the
	 *     first as minimum values and the second as maximum
	 */
	hemi.curve.showBoxes = function(boxes) {
		var pack = hemi.curve.pack;
		
		if (this.dbgBoxTransforms.length > 0) {
			this.hideBoxes();
		}
		
		for (i = 0; i < boxes.length; i++) {
			var transform = pack.createObject('Transform'),
				b = boxes[i],
				w = b[1][0] - b[0][0],
				h = b[1][1] - b[0][1],
				d = b[1][2] - b[0][2],
				x = b[0][0] + w/2,
				y = b[0][1] + h/2,
				z = b[0][2] + d/2,
				box = o3djs.primitives.createBox(pack, this.dbgBoxMat, w, h, d);
			
			transform.addShape(box);
			transform.translate(x,y,z);
			transform.parent = hemi.picking.pickRoot;
			this.dbgBoxTransforms[i] = transform;
		}
	};
	
	/**
	 * Remove the bounding boxes from view.
	 */
	hemi.curve.hideBoxes = function() {
		var pack = hemi.curve.pack;
		
		for (i = 0; i < this.dbgBoxTransforms.length; i++) {
			var tran = this.dbgBoxTransforms[i],
				shape = tran.shapes[0];
			
			tran.removeShape(shape);
			tran.parent = null;
			pack.removeObject(shape);
			pack.removeObject(tran);
		}
		
		this.dbgBoxTransforms = [];
	};
	
	/**
	 * Create a curve particle system with the given configuration.
	 * 
	 * @param {Object} cfg configuration options:
	 *     aim: flag to indicate particles should orient with curve
	 *     boxes: array of bounding boxes for particle curves to pass through
	 *     fast: flag to indicate GPU-driven particle system should be used
	 *     life: lifetime of particle system (in seconds)
	 *     particleCount: number of particles to allocate for system
	 *     shape: enumerator for type of shape to use for particles
	 *     // JS particle system only
	 *     colorKeys: array of time keys and values for particle color ramp
	 *     scaleKeys: array of time keys and values for particle size ramp
	 *     // GPU particle system only
	 *     colors: color ramp for particles
	 *     particleSize: size of the particles
	 *     tension: tension parameter for the curve (typically from -1 to 1)
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
	
	hemi.curve.newMaterial = function() {
		return hemi.core.material.createBasicMaterial(
			this.pack,
			hemi.view.viewInfo,
			[0,0,0,1],
			true);
	};
	
	hemi.curve.init = function() {
		this.pack = hemi.core.client.createPack();
		this.dbgBoxMat = hemi.core.material.createConstantMaterial(
			this.pack,
			hemi.view.viewInfo,
			[0, 0, 0.5, 1]);
		
		var state = this.pack.createObject('State');
		state.getStateParam('PolygonOffset2').value = -1.0;
		state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
		this.dbgBoxMat.state = state;
		this.dbgBoxTransforms = [];
	};

	/**
	 * @class A Curve is used to represent and calculate different curves
	 * including: linear, bezier, cardinal, and cubic hermite.
	 * 
	 * @param {number[][]} points List of xyz waypoints 
	 * @param {number} opt_type Curve type
	 * @param {hemi.config} opt_config Configuration object specific to this curve
	 */
	hemi.curve.Curve = function(points,opt_type,opt_config) {

		this.type = opt_type || hemi.curve.curveType.Linear;
		this.xpts = {};		
		this.ypts = {};
		this.zpts = {};
		this.xtans = {};
		this.ytans = {};
		this.ztans = {};
		this.weights = {};
		this.tension = 0;
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

		switch (this.type) {
			case hemi.curve.curveType.Linear:
				this.interpolate = this.linear;
				break;
			case hemi.curve.curveType.Bezier:
				this.interpolate = this.bezier;
				break;
			case hemi.curve.curveType.CubicHermite:
			case hemi.curve.curveType.Cardinal:
				this.interpolate = this.cubicHermite;
				break;
			case hemi.curve.curveType.LinearNorm:
				this.interpolate = this.linearNorm;
				break;
			case hemi.curve.curveType.Custom:
				break;
			default:
		}
		
		if (opt_config) {
			if (opt_config.weights) {
				for (var i = 0; i < this.count; i++) {
					this.weights[i] = (opt_config.weights[i] != null) ? opt_config.weights[i] : 1;
				}
			}
			
			if (opt_config.tangents) {
				for (var i = 0; i < this.count; i++) {
					if(opt_config.tangents[i]) {
						this.xtans[i] = opt_config.tangents[i][0] || 0;
						this.ytans[i] = opt_config.tangents[i][1] || 0;
						this.ztans[i] = opt_config.tangents[i][2] || 0;
					}	
				}
			}
			
			if(opt_config.tension) {
				this.tension = opt_config.tension;
			}
		}
		
		this.setTangents();
	};

	hemi.curve.Curve.prototype = {
		
		/**
		 * Base interpolation function for this curve. Usually overwritten.
		 *
		 * @param {number} t Time, usually between 0 and 1
		 * @return {number[]} The position interpolated from the time input
		 */
		interpolate : function(t) {
			return [t,t,t];
		},

		/**
		 * The linear interpolation moves on a straight line between waypoints.
		 *
		 * @param {number} t Time, usually between 0 and 1
		 * @return {number[]} The position linearly interpolated from the time input
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
		 * The bezier interpolation starts at the first waypoint, and ends at the
		 *		last waypoint, and 'bends' toward the intermediate points. These
		 *		points can be weighted for more bending.
		 *
		 * @param {number} t Time, usually between 0 and 1
		 * @return {number[]} The position interpolated from the time input by a
		 *		a bezier function.
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
		 * The cubic hermite function interpolates along a line that runs through the Curve
		 *		object's waypoints, at a predefined tangent slope through each one.
		 *
		 * @param {number} t Time, usually between 0 and 1
		 * @return {number[]} The position interpolated from the time input by the cubic 
		 *		hermite function.
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
		 * The normalized linear interpolation moves on a straight line between waypoints,
		 *		at a constant velocity.
		 *
		 * @param {number} t Time, usually between 0 and 1
		 * @return {number[]} The position linearly interpolated from the time input, normalized
		 * 		to keep the velocity constant
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
		 * Calculate the tangents for a cardinal curve, which is a cubic hermite curve
		 * 		where the tangents are defined by a single 'tension' factor.
		 */
		setTangents : function() {
			if (this.type == hemi.curve.curveType.Cardinal) {
				for (var i = 0; i < this.count - 2; i++) {
					this.xtans[i] = (1-this.tension)*(this.xpts[i+2]-this.xpts[i])/2;
					this.ytans[i] = (1-this.tension)*(this.ypts[i+2]-this.ypts[i])/2;
					this.ztans[i] = (1-this.tension)*(this.zpts[i+2]-this.zpts[i])/2;
					this.xpts[i] = this.xpts[i+1];
					this.ypts[i] = this.ypts[i+1];
					this.zpts[i] = this.zpts[i+1];
				}
				this.count = this.count - 2;
			}
		},
		
		getStart : function() {
			return [this.xpts[0],this.ypts[0],this.zpts[0]];
		},
		
		getEnd : function() {
			var end = this.count - 1;
			return [this.xpts[end],this.ypts[end],this.zpts[end]];
		},
		
		draw : function(samples,config) {
			var points = [];
			for (var i = 0; i < samples+2; i++) {
				points[i] = this.interpolate(i/(samples+1));
			}
			return hemi.curve.drawCurve(points,config);
		}
		
	};
	
	/**
	 * @class A Particle allows for the movement of a transform along a set of
	 * points.
	 * 
	 * @param {o3d.transform} trans The transform to move along the curve
	 * @param {number[][]} points The array of points to travel through
	 * @param {hemi.curve.colorKey[]} colorKeys Array of key-values for the 
	 *		color of the default material
	 * @param {hemi.curve.scaleKey[]} scaleKeys Array of key-values for the 
	 *		scale of the transform
	 * @param {boolean} rotate flag indicating if the transform should rotate as
	 *      it travels along the points
	 */
	hemi.curve.Particle = function(trans,points,colorKeys,scaleKeys,rotate) {	
		var pack = hemi.curve.pack;
		this.transform = pack.createObject('Transform');
		this.transform.parent = trans;
		this.frame = 1;
		this.lastFrame = points.length - 2;
		this.destroyed = false;
        this.transform.createParam('diffuse', 'ParamFloat4').value = [0,0,0,0];		
		this.lt = [];		
		this.setColors(colorKeys);
		this.setScales(scaleKeys);	
		for (var i = this.frame; i <= this.lastFrame; i++) {
			var L = o3djs.math.matrix4.translation(points[i]);
			
			if (rotate) {
				hemi.utils.pointYAt(L, points[i-1], points[i+1]);
			}
			this.lt[i] = L;
		}
		this.ready = true;
		this.active = false;
	};
	
	hemi.curve.Particle.prototype = {
	
		/**
		 * Start this particle along the curve.
		 *
		 * @param {number} loops The number of loops to do
		 */
		run : function(loops) {
			this.loops = loops;
			this.ready = false;
			this.active = true;
		},
	
		/**
		 * Add a shape to the particle transform.
		 *
		 * @param {o3d.shape} shape The shape to add
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
		 * Set the color gradient of this particle.
		 * @param {key[]} colorKeys Array of color key pairs
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
		 * @param {key[]} scaleKeys Array of scale key pairs
		 */
		setScales : function(scaleKeys) {
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
			}	
			return this;
		},
	
		/**
		 * Translate the particle transform in local space.
		 *
		 * @param {number} x X translation
		 * @param {number} y Y translation
		 * @param {number} z Z translation
		 */
		translate : function(x,y,z) {
			this.transform.translate(x,y,z);
		},
		
		/**
		 * Given a set of key-values, return the interpolated value
		 *
		 * @param {number} time Time, from 0 to 1
		 * @param {hemi.curve.Key[]} keySet Array of key-value pairs
		 * @return {number[]} The interpolated value
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
			
			var f = this.frame,
				color = this.colors[f],
				scale = this.scales[f];
					
			this.transform.getParam('diffuse').value = color;
			this.transform.localMatrix = hemi.utils.copyArray(this.lt[f]);
			this.transform.scale(scale);		
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
	 * @param {o3d.transform} trans The transform which will be the parent of this system
	 * @param {hemi.config} config Configuration object describing this system
	 */
	hemi.curve.ParticleSystem = function(trans,config) {
		var pack = hemi.curve.pack;
		var view = hemi.view.viewInfo;
		this.transform = pack.createObject('Transform');
		this.transform.parent = trans;
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

		var mState = pack.createObject('State');
				// Use these when we figure out how...
		//mState.getStateParam('o3d.BlendEquation').value = hemi.core.o3d.State.BLEND_ADD;
		//mState.getStateParam('o3d.SourceBlendFunction').value = hemi.core.o3d.State.BLENDFUNC_SOURCE_ALPHA;
		//mState.getStateParam('o3d.DestinationBlendFunction').value = hemi.core.o3d.State.BLENDFUNC_ONE;		
		this.shapeMaterial.state = mState;
		
		this.shapes = [];
		
		if (config.shape) {
			switch (config.shape) {
				case (hemi.curve.ShapeType.ARROW):
					var arrowHeadXY = [[-0.4,0],[0.4,0],[0,0.6]];
					var arrowBaseXY = [[-0.2,0],[-0.2,-0.4],[0.2,-0.4],[0.2,0]];
					this.shapes.push(o3djs.primitives.createPrism(pack,this.shapeMaterial,arrowHeadXY,0.2));
					this.shapes.push(o3djs.primitives.createPrism(pack,this.shapeMaterial,arrowBaseXY,0.2));
					break;
				case (hemi.curve.ShapeType.SPHERE):
					this.shapes.push(o3djs.primitives.createSphere(pack,this.shapeMaterial,0.5,12,12));
					break;
				case (hemi.curve.ShapeType.CUBE):
					this.shapes.push(o3djs.primitives.createCube(pack,this.shapeMaterial,1));
					break;
				default:
					break;
			}
		} else {
			this.shapes.push(o3djs.primitives.createSphere(pack,this.shapeMaterial,0.5,12,12));
		}
		
		hemi.view.addRenderListener(this);
		
		this.boxesOn = false;
		
		this.points = [];
		this.frames = config.frames || this.pLife*hemi.view.FPS;
		
		for(j = 0; j < this.maxParticles; j++) {
			var curve = this.newCurve();
			this.points[j] = [];
			for(i=0; i < this.frames; i++) {
				this.points[j][i] = curve.interpolate((i)/this.frames);
			}
		}
		
		for (i = 0; i < this.maxParticles; i++) {
			this.particles[i] = new hemi.curve.Particle(
				this.transform,
				this.points[i],
				config.colorKeys,
				config.scaleKeys,
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
		 * @param {boolean} opt_hard If true, remove all particles immediately. Otherwise,
		 *		stop emitting but let existing particles finish.
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
		 * Function performed on each render. Update all existing particles, and emit
		 * 		new ones if needed.
		 *
		 * @param {o3d.RenderEvent} event Event object describing details of the render loop
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
		 * @return {hemi.curve.Curve} The randomly generated Curve object.
		 */
		newCurve : function() {
			var points = [];
			var num = this.boxes.length;
			for (i = 0; i < num; i++) {
				var min = this.boxes[i][0];
				var max = this.boxes[i][1];
				points[i+1] = hemi.curve.randomPoint(min,max);
			}
			points[0] = points[1].slice(0,3);
			points[num+1] = points[num].slice(0,3);
			var curve = new hemi.curve.Curve(points,hemi.curve.curveType.Cardinal);
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
		 * Add a shape which will be added to the transform of every particle.
		 *
		 * @param {number|o3d.shape} shape Either an enum for standard shapes, or a custom
		 * 		predefined shape to add
		 */
		addShape : function(shape) {
			var pack = hemi.curve.pack;
			var startndx = this.shapes.length;
			if (typeof shape == 'string') {
				switch (shape) {
					case (hemi.curve.ShapeType.ARROW):
						var arrowHeadXY = [[-0.4,0],[0.4,0],[0,0.6]];
						var arrowBaseXY = [[-0.2,0],[-0.2,-0.4],[0.2,-0.4],[0.2,0]];
						this.shapes.push(o3djs.primitives.createPrism(pack,this.shapeMaterial,arrowHeadXY,0.2));
						this.shapes.push(o3djs.primitives.createPrism(pack,this.shapeMaterial,arrowBaseXY,0.2));
						break;
					case (hemi.curve.ShapeType.CUBE):
						this.shapes.push(o3djs.primitives.createCube(pack,this.shapeMaterial,1));
						break;
					case (hemi.curve.ShapeType.SPHERE):
					default:
						this.shapes.push(o3djs.primitives.createSphere(pack,this.shapeMaterial,0.5,12,12));
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
		 * @param {number} delta The delta by which to change the rate
		 * @return {number} The new rate
		 */
		changeRate : function(delta) {
			return this.setRate(this.pRate + delta);
		},
		
		/**
		 * Set the emit rate of the system.
		 *
		 * @param (number) rate The rate at which to emit particles
		 * @return (number) The new rate - may be different because of bounds
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
		 * @param {key[]} colorKeys Array of color key pairs
		 * @return {hemi.curve.ParticleSystem} This system, for chaining
		 */
		setColors : function(colorKeys) {
			for (var i = 0; i < this.maxParticles; i++) {
				this.particles[i].setColors(colorKeys);
			}
			return this;
		},

		/**
		 * Set the scale gradient for this particle system.
		 * @param {key[]} scaleKeys Array of scale key pairs
		 * @return {hemi.curve.ParticleSystem} This system, for chaining
		 */		
		setScales : function(scaleKeys) {
			for (var i = 0; i < this.maxParticles; i++) {
				this.particles[i].setScales(scaleKeys);
			}
			return this;
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
		'attribute vec4 TEXCOORD; \n' +
		'varying vec4 ptcColor; \n';
	
	hemi.curve.vertHeaderColors =
		'uniform vec4 ptcColors[NUM_COLORS]; \n';
	
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
		'    float clrT = float(NUM_COLORS-1)*ptcTime; \n' +
		'    int ndx = int(floor(clrT)); \n' +
		'    float t = fract(clrT); \n' +
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
		'  vec3 pos = ptcInterp(t, p0, p1, m0, m1); \n';
	
	hemi.curve.vertBodyWMAim =
		'  mat4 rMat = getRotMat(t, p0, p1, m0, m1); \n' +
		'  mat4 tMat = mat4(1.0,0.0,0.0,0.0, \n' +
		'   0.0,1.0,0.0,0.0, \n' +
		'   0.0,0.0,1.0,0.0, \n' +
		'   pos.x,pos.y,pos.z,1.0); \n' +
		'  mat4 tMatIT = mat4(1.0,0.0,0.0,-1.0*pos.x, \n' +
		'   0.0,1.0,0.0,-1.0*pos.y, \n' +
		'   0.0,0.0,1.0,-1.0*pos.z, \n' +
		'   0.0,0.0,0.0,1.0); \n' +
		'  mat4 ptcWorld = tMat*rMat; \n' +
		'  mat4 ptcWorldIT = tMatIT*rMat; \n';
	
	hemi.curve.vertBodyWMNoAim =
		'  mat4 ptcWorld = mat4(1.0,0.0,0.0,0.0, \n' +
		'   0.0,1.0,0.0,0.0, \n' +
		'   0.0,0.0,1.0,0.0, \n' +
		'   pos.x,pos.y,pos.z,1.0); \n' +
		'  mat4 ptcWorldIT = mat4(1.0,0.0,0.0,-1.0*pos.x, \n' +
		'   0.0,1.0,0.0,-1.0*pos.y, \n' +
		'   0.0,0.0,1.0,-1.0*pos.z, \n' +
		'   0.0,0.0,0.0,1.0); \n';
	
	hemi.curve.vertBodyEnd =
		'  mat4 ptcWorldVP = worldViewProjection * ptcWorld; \n';
	
	hemi.curve.fragHeader =
		'varying vec4 ptcColor; \n';
	
	hemi.curve.fragGlobNoColors =
		'gl_FragColor.a *= ptcColor.a; \n';
	
	/**
	 * A particle system that is GPU driven.
	 * 
	 * @param {Object} opt_cfg optional configuration object for the system
	 */
	hemi.curve.GpuParticleSystem = function(opt_cfg) {
		hemi.world.Citizen.call(this);
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
		this.size = 0;
		this.tension = 0;
		this.texNdx = -1;
		this.timeParam = null;
		this.transform = null;
		
		if (opt_cfg) {
			this.loadConfig(opt_cfg);
		}
	};
	
	hemi.curve.GpuParticleSystem.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         */
        citizenType: 'hemi.curve.GpuParticleSystem',
		
		/**
		 * Send a cleanup Message and remove all references in the GpuParticleSystem.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
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
			
			if (!cfg.colors) {
				this.colors = [];
			} else if (cfg.colors.length === 1) {
				// We need at least two to interpolate
				var clr = cfg.colors[0];
				this.colors = [clr, clr];
			} else {
				this.colors = cfg.colors;
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
		 * @param {number[3][2][]} boxes array of pairs of XYZ coordinates, the
		 *     first as minimum values and the second as maximum
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
			this.colors = colors;
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
				texNdx = this.texNdx,
				addColors = numColors > 1,
				shads = hemi.utils.getShaders(material),
				fragShd = shads.fragShd,
				vertShd = shads.vertShd,
				dec = 1.0,
				maxTime = 3.0,
				time = 1.1,
				uniforms = ['sysTime', 'ptcMaxTime', 'ptcDec', 'numPtcs',
					'tension', 'minXYZ', 'maxXYZ', 'ptcColors'];
			
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
					vertPreBody += hemi.curve.vertBodyWMAim;
				} else {
					vertPreBody += hemi.curve.vertBodyWMNoAim;
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
			
			if (addColors) {
				setupColors(material, this.colors);
			}
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
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'loadConfig',
				arg: [{
					aim: this.aim,
					boxes: this.boxes,
					colors: this.colors,
					life: this.life,
					particles: this.particles,
					shape: this.ptcShape,
					size: this.size,
					tension: this.tension
				}]
			});
			
			return octane;
		}
	};

	hemi.curve.GpuParticleSystem.inheritsFrom(hemi.world.Citizen);
	
	/**
	 * A GPU driven particle system that has trailing starts and stops.
	 * 
	 * @param {Object} opt_cfg the configuration object for the system
	 */
	hemi.curve.GpuParticleTrail = function(opt_cfg) {
		hemi.curve.GpuParticleSystem.call(this, opt_cfg);
		
		this.endTime = 1.0;
		this.starting = false;
		this.stopping = false;
	};
	
	hemi.curve.GpuParticleTrail.prototype = {
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
	};
	
	hemi.curve.GpuParticleTrail.inheritsFrom(hemi.curve.GpuParticleSystem);
	
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
				
				field.setAt(i * numVerts, vals);
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
	 * @param {number[3][2][]} boxes array of min and max XYZ coordinates
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
			minArr.getParam(i).value = box[0];
			maxArr.getParam(i).value = box[1];
		}
		
		minParam.value = minArr;
		maxParam.value = maxArr;
	};
	
	/*
	 * Set the parameters for the given Material so that it adds a color ramp to
	 * the particles using it.
	 * 
	 * @param {o3d.Material} material material to set parameters for
	 * @param {Object} colors array of RGBA color values
	 */
	var setupColors = function(material, colors) {
		var clrParam = material.getParam('ptcColors'),
			clrArr = hemi.curve.pack.createObject('ParamArray');
		
		clrArr.resize(colors.length, 'ParamFloat4');
		
		for (var i = 0, il = colors.length; i < il; ++i) {
			clrArr.getParam(i).value = colors[i];
		}
		
		clrParam.value = clrArr;
	};
	
	return hemi;
})(hemi || {});
