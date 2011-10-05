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
