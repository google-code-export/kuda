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
            
            this.target.position.z = -1;
            this.target.updateMatrix();
            this.cam.position.z = 1;
            this.cam.updateMatrix();
            this.updateWorldMatrices();

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
			this.mode.fixedLight = true;
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
			this.cam.position.z = this.distance;
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

			this.pan.rotation.x += this.tilt.rotation.x;
            this.pan.updateMatrix();
			this.pan.translateZ(-distance);
            this.pan.updateMatrix();
			this.pan.rotation.x -= this.tilt.rotation.x;
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
            this.target.position.z = -this.distance;
            this.target.updateMatrix();
            //force an update of the transforms so we can get the correct world matricies
            this.updateWorldMatrices();
            var camPosition = this.getEye();
            var targetPosition = this.getTarget();
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
