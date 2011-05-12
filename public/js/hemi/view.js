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
o3djs.require('hemi.core');
o3djs.require('hemi.input');
o3djs.require('hemi.msg');
o3djs.require('hemi.utils.mathUtils');
o3djs.require('hemi.world');

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
	 * @class A Camera contains all of the properties and functionality for
	 * viewing a 3D scene.
	 * @extends hemi.world.Citizen
	 */
	hemi.view.Camera = function() {
		hemi.world.Citizen.call(this);	
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
	};

	hemi.view.Camera.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
        citizenType: 'hemi.view.Camera',
		
		/**
		 * Clamp the pan and tilt angles to this camera's limits.
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
			hemi.world.Citizen.prototype.cleanup.call(this);			
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
		 * Disable free camera control.
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
		 * Enable free camera control.
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
		
		lightAtPosition : function(position) {
			this.light.position.value = position;
			this.light.fixed = false; 
			this.update();
			return this;
		},
		
		/**
		 * Get the current position of the camera eye.
		 *
		 * @return {[number]} XYZ coordinates of the eye
		 */
		getEye : function() {
			return this.transforms.cam.getUpdatedWorldMatrix()[3].slice(0,3);
		},

		/**
		 * Get the current position of the camera target.
		 *
		 * @return {[number]} XYZ coordinates of the target
		 */
		getTarget : function() {
			if (this.mode.fixed) {
				return this.transforms.target.getUpdatedWorldMatrix()[3].slice(0,3);
			} else {
				return this.transforms.pan.getUpdatedWorldMatrix()[3].slice(0,3);
			}
		},
		
		moveInFrames : function() {
			this.mode.frames = true;
		},
		
		moveInSeconds : function() {
			this.mode.frames = false;
		},
		
		/**
		 * Move the camera along a curve.
		 *
		 * @param {hemi.curve.Curve} eyeCurve Curve for camera eye to follow
		 * @param {hemi.curve.Curve} targetCurve Curve for camera target to follow
		 * @param {number} opt_frames Number of frames to take for this movement
		 */
		moveOnCurve : function(eyeCurve, targetCurve, opt_time) {
			if (this.vd.current !== null) {
				this.vd.last = this.vd.current;
			} else {
				this.vd.last = hemi.view.createViewData(this);
			}
			
			this.vd.current = new hemi.view.ViewData({
				eye: eyeCurve.getEnd(),
				target: targetCurve.getEnd(),
				up: this.up,
				fov: this.fov.current,
				np: this.clip.near,
				fp: this.clip.far
			});
			this.state.curve = { eye: eyeCurve, target: targetCurve };
			this.state.moving = true;
			this.state.vp = null;
			var t = (opt_time == null) ? 1.0 : (opt_time > 0) ? opt_time : 0.001;
			this.state.time.end = this.mode.frames ? t/hemi.view.FPS : t;
			this.state.time.current = 0.0;
			this.send(hemi.msg.start, { viewdata: this.vd.current });
		},
		
		/**
		 * Move the camera when the camera is in orthographic viewing mode.
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
		 * Move the camera when the camera is in perspective viewing mode.
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
		 * Move the camera to a Viewpoint or ViewData.
		 *
		 * @param {hemi.view.Viewpoint || hemi.view.ViewData} view The Viewpoint
		 *     or ViewData to move to
		 * @param {number} opt_span The number of frames or seconds to take
		 *     getting there (0 is instant)
		 */
		moveToView : function(view, opt_span) {
			var t = (opt_span == null) ? 1.0 : this.mode.frames ? opt_span / hemi.view.FPS : opt_span,
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
			this.state.time.end = (t > 0) ? t : 0.001;
			this.state.time.current = 0.0;
			this.state.moving = true;
			this.send(hemi.msg.start, pkg);
		},
		
		/**
		 * Keyboard key-down listener.
		 *
		 * @param {o3d.event} keyEvent Message describing key down
		 */
		onKeyDown : function(keyEvent) {
			this.state.shift = (keyEvent.keyCode == 16);
		},

		/**
		 * Keyboard key-up listener.
		 *
		 * @param {o3d.event} keyEvent Message describing key up
		 */
		onKeyUp : function(keyEvent) {
			if (keyEvent.keyCode == 16) this.state.shift = false;
		},

		/**
		 * Mouse-down listener - set parameters to reflect that fact.
		 *
		 * @param {o3d.event} mouseEvent Message describing mouse down
		 */
		onMouseDown : function(mouseEvent) {
			this.state.mouse = true;
			this.state.xy.current[0] = this.state.xy.last[0] = mouseEvent.x;
			this.state.xy.current[1] = this.state.xy.last[1] = mouseEvent.y;
		},

		/**
		 * Mouse-move listener - move the camera if the mouse is down.
		 *
		 * @param {o3d.event} mouseEvent Message describing mouse move
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
		 * @param {o3d.event} mouseEvent Message describing mouse up
		 */
		onMouseUp : function(mouseEvent) {
			this.state.mouse = false;
		},
		
		/**
		 * Render listener - check mouse and camera parameters and decide if the
		 * 		camera needs to be updated.
		 *
		 * @param {o3d.event} renderEvent Message desribing render loop
		 */
		onRender : function(renderEvent) {	
			if (this.state.xy.current[0] != this.state.xy.last[0] || 
				this.state.xy.current[1] != this.state.xy.last[1] ||
				this.state.moving ||
				this.state.update) {
				this.update(renderEvent.elapsedTime);
			}
			this.state.update = false;
		},
		
		/**
		 * Mouse-scroll listener - zoom the camera in or out.
		 *
		 * @param {o3d.event} mouseEvent Message describing mouse behavior
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
		 * Orbit the camera about a fixed point.
		 * @param {float} pan The radians to pan around by.
		 * @param {float} tilt The radians to tilt around by
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
		 * Rotate the camera in place. Has no effect if the camera is not in
		 * fixed-eye mode.
		 * @param {float} pan Radians by which to pan.
		 * @param {float} tilt Radians by which to tilt.
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
		 * Set the limits on the camera pan and tilt in fixed eye mode in radians
		 * 
		 * @param {number} panMin Minimum pan angle
		 * @param {number} panMax Maximum pan angle
		 * @param {number} tiltMin Minimum tilt angle
		 * @param {number} tiltMax Maximum tilt angle
		 */
		setLookAroundLimits : function(panMin, panMax, tiltMin, tiltMax) {
			this.camPan.min = panMin;
			this.camPan.max = panMax;
			this.camTilt.min = tiltMin;
			this.camTilt.max = tiltMax;
			return this;
		},
		
		/**
		 * Set the function used to ease the camera in and out of moves.
		 *
		 * @param {function|object} easeFunc Either the function which will be used
		 * 		for easing on all 3 axes, or a simple object containing x, y, or z
		 *		fields specifying a different function for each axis.
		 * @return {hemi.view.Camera} This camera, for chaining
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
		 * Set the eye and target of the camera. 
		 *
		 * @param {[number]} eye XYZ position of camera eye
		 * @param {[number]} target XYZ position of camera target
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
			
			t.cam.identity();
			t.cam.translate([0,0,this.distance]);
			
			hemi.utils.pointZAt(t.cam,hemi.utils.pointAsLocal(t.cam,target));
			t.cam.rotateY(Math.PI);
			this.camPan.current = 0;
			this.camTilt.current = 0;			
		},
		
		setLight : function(rgb) {
			this.light.color.value = [rgb[0],rgb[1],rgb[2],1];
			return this;
		},
		
		/**
		 * Set the camera view to render with an orthographic projection.
		 *
		 * @param {number} axis Enum for xy, xz, or yz plane to look at
		 */
		setOrthographic : function(axis) {
			this.mode.projection = axis;
			this.updateProjection();
		},
		
		/**
		 * Set the camera view to render with a perespective projection.
		 */
		setPerspective : function() {
			this.mode.projection = 0;
			this.updateProjection();
		},
		
		/**
		 * Set the zooming limits in fixed-eye mode.
		 *
		 * @param {number} min Zoom-in limit, in radians
		 * @param {number} max Zoom-out limit, in radians
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
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: this.mode.control ? 'enableControl' : 'disableControl',
				arg: []
			});
			
			var valNames = ['pan', 'tilt', 'fov', 'camPan', 'camTilt',
				'distance', 'up', 'mode', 'clip'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			};

			return octane;
		},
		
		truck : function(d) {
			this.transforms.pan.rotateX(this.tilt.current);
			this.transforms.pan.translate(0,0,-d);
			this.transforms.pan.rotateX(-this.tilt.current);
			this.update();
		},

		interpolateView : function(current,end) {
			var eye = [], target = [],
				last = this.vd.last, cur = this.vd.current;
			if(this.state.curve) {
				var t = this.easeFunc[0](current,0,1,end);
				eye = this.state.curve.eye.interpolate(t);
				target = this.state.curve.target.interpolate(t);
			} else {
				for (var i=0; i<3; i++) {
					eye[i] = this.easeFunc[i](current,last.eye[i],cur.eye[i]-last.eye[i],end);
					target[i] = this.easeFunc[i](current,last.target[i],cur.target[i]-last.target[i],end);
				}
			}
			this.fov.current = this.easeFunc[0](current,last.fov,cur.fov-last.fov,end);
			this.clip.near = this.easeFunc[0](current,last.np,cur.np-last.np,end);
			this.clip.far = this.easeFunc[0](current,last.fp,cur.fp-last.fp,end);
			this.setEyeTarget(eye,target);
		},
		
		/**
		 * Update the camera.
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
		 * Update the camera view projection.
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
	};
	
	hemi.view.Camera.inheritsFrom(hemi.world.Citizen);
	hemi.view.Camera.prototype.msgSent =
		hemi.view.Camera.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);

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
	hemi.view.Viewpoint = function(config) {
		hemi.world.Citizen.call(this);
		var cfg = config || {};
		this.name = cfg.name || '';
		this.eye = cfg.eye || [0,0,-1];
		this.target = cfg.target || [0,0,0];
		this.up = cfg.up || [0,1,0];
		this.fov = cfg.fov || hemi.view.defaults.FOV;
		this.np = cfg.np || hemi.view.defaults.NP;
		this.fp = cfg.fp ||hemi.view.defaults.FP;
	};
	
	hemi.view.Viewpoint.prototype = {
		citizenType: 'hemi.view.Viewpoint',
		
		getData: function() {
			return new hemi.view.ViewData(this);
		},
		
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
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
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
	
	hemi.view.Viewpoint.inheritsFrom(hemi.world.Citizen);
	
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
		hemi.view.renderListeners.push(listener);
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
		if (ndx != -1) {
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
	 * @param {[number]} rgba Red-Green-Blue-Alpha array
	 */
	hemi.view.setBGColor = function(rgba) {
		this.viewInfo.clearBuffer.clearColor = rgba;
	};
	
	/**
	 * Get the clear color of the client.
	 * 
	 * @return {[number]} the background color
	 */
	hemi.view.getBGColor = function() {
		return this.viewInfo.clearBuffer.clearColor;
	};

	/**
	 * Get the time that the specified animation frame occurs at.
	 * 
	 * @param {number}
	 *            frame frame number to get the time for
	 * @return {float} time that the frame occurs at
	 */
	hemi.view.getTimeOfFrame = function(frame) {
		return frame / this.FPS;
	};

	/**
	 * Create a new ViewData with the given Camera's current viewing parameters.
	 * 
	 * @param {hemi.view.Camera}
	 *            camera the Camera to create the Viewpoint from
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
	 * @param {string}
	 *            name the name of the new Viewpoint
	 * @param {hemi.view.Camera}
	 *            camera the Camera to create the Viewpoint from
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
	 * @param {string}
	 *            name the name of the new Viewpoint
	 * @param {float[3]}
	 *            eye the coordinates of the eye
	 * @param {float[3]}
	 *            target the coordinates of the target
	 * @param {float[3]}
	 *            up the coordinates of the up direction
	 * @param {number}
	 *            fov angle of the field-of-view
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
