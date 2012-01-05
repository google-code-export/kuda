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
            this.cam.eulerOrder = 'ZYX';
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
            		this.fov.current * hemi.RAD_TO_DEG,
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
					this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
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
            this.panTilt.rotation.x = rtp[1] - hemi.HALF_PI;
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
				this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
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
	 * @param {hemi.Curve} eye Curve for camera eye to follow
	 * @param {hemi.Curve} target Curve for camera target to follow
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
