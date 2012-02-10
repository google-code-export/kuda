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

		// Default values for Camera control, etc
	var FAR_PLANE = 10000,
		FOV = 0.707107,
		MAX_FOV = Math.PI / 3,
		MAX_TILT = Math.PI / 2.001,
		MIN_FOV = 0.05,
		MIN_TILT = -Math.PI / 2.001,
		MOUSE_DELTA = 0.0015,
		MOUSE_SPEED = 0.005,
		NEAR_PLANE = 1,
		SCROLL_UP = 13/12,
		SCROLL_DOWN = 11/12,
		TRUCK_SPEED = 0.02,
		// Static helper objects shared by all Cameras
		_vector1 = new THREE.Vector3(),
		_vector2 = new THREE.Vector3();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Camera class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Camera controls the point of view and perspective when viewing a  3D scene.
	 */
	var Camera = function() {
		this.panTilt = new THREE.Object3D();
		this.panTilt.name = 'panTilt';
		this.panTilt.eulerOrder = 'ZYX';
		this.panTilt.matrixAutoUpdate = false;
		this.cam = new THREE.Object3D();
		this.cam.name = 'cam';
		this.cam.eulerOrder = 'ZYX';
		this.cam.matrixAutoUpdate = false;
		this.panTilt.add(this.cam);

		this.cam.position.z = 1;
		this.cam.updateMatrix();
		this.updateWorldMatrices();

		this.distance = 1;
		this.vd = { current: null, last: null };
		this.tiltMax = MAX_TILT;
		this.tiltMin = MIN_TILT;

		this.fov = {
			current: FOV,
			min: MIN_FOV,
			max: MAX_FOV
		};
		this.lookLimits = {
			panMax: null,
			panMin: null,
			tiltMax: null,
			tiltMin: null
		};
		this.mode = {
			scroll: true,
			scan: true,
			fixed: false,
			control: false,
			projection: null
		};	
		this.state = {
			moving: false,
			curve: null,
			time: { current: 0.0, end: 0.0 },
			mouse: false,
			xy: { current: [-1,-1], last: [-1,-1] },
			shift: false,
			update: false,
			vp: null
		};

		this.threeCamera = new THREE.PerspectiveCamera(this.fov.current * hemi.RAD_TO_DEG,
			window.innerWidth / window.innerHeight, NEAR_PLANE, FAR_PLANE);
		this.threeCamera.matrixAutoUpdate = false;

		/**
		 * A light that moves with the Camera and is always pointing where the Camera is pointing.
		 * @type THREE.PointLight
		 */
		this.light = new THREE.PointLight(0xffffff, 1.35);

		// Use shared reference to guarantee the camera light follows the Camera.
		this.light.position = this.threeCamera.position;
		this.light.rotation = this.threeCamera.rotation;
		this.light.scale = this.threeCamera.scale;

		var tween = hemi.utils.penner.linearTween;
		this.easeFunc = [tween,tween,tween];
		updateCamera.call(this);

		hemi.addRenderListener(this);
	};

	/*
	 * Remove all references in the Camera.
	 */
	Camera.prototype._clean = function() {
		hemi.removeRenderListener(this);
		this.disableControl();
		this.light = null;
		this.threeCamera = null;
	};

	/*
	 * Array of Hemi Messages that Camera is known to send.
	 * @type string[]
	 */
	Camera.prototype._msgSent = [hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for Camera.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Camera.prototype._octane = function() {
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
	};

	/**
	 * Disable control of the Camera through the mouse and keyboard.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.disableControl = function() {
		if (this.mode.control) {
			hemi.input.removeMouseDownListener(this);
			hemi.input.removeMouseUpListener(this);
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseWheelListener(this);
			hemi.input.removeKeyDownListener(this);
			hemi.input.removeKeyUpListener(this);	
			this.mode.control = false;
			this.state.mouse = false;
		}

		return this;
	};

	/**
	 * Disable the shiftkey scanning.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.disableScan = function() {
		this.mode.scan = false;
		return this;
	};

	/**
	 * Disable the scroll wheel zooming.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.disableZoom = function() {
		this.mode.scroll = false;
		return this;
	};

	/**
	 * Enable control of the Camera through the mouse and keyboard.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.enableControl = function(element) {
		if (!this.mode.control) {
			hemi.input.addMouseDownListener(this);
			hemi.input.addMouseUpListener(this);
			hemi.input.addMouseMoveListener(this);
			hemi.input.addMouseWheelListener(this);
			hemi.input.addKeyDownListener(this);
			hemi.input.addKeyUpListener(this);
			this.mode.control = true;
		}

		return this;
	};

	/**
	 * Enable the shiftkey dragging.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.enableScan = function() {
		this.mode.scan = true;
		return this;
	};

	/**
	 * Enable the camera to zoom with the mouse scroll.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.enableZoom = function() {
		this.mode.scroll = true;
		return this;
	};

	/**
	 * Fix the camera to its current spot, and use mouse movements to look around.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.fixEye = function() {
		this.mode.fixed = true;
		updateCamera.call(this);
		return this;
	};

	/**
	 * Allow the camera to rotate about a fixed target. This is the default mode.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.freeEye = function() {
		this.setEyeTarget(this.getEye(_vector1), this.getTarget(_vector2));
		this.mode.fixed = false;
		updateCamera.call(this);
		return this;
	};

	/**
	 * Get the current position of the Camera eye.
	 * 
	 * @param {THREE.Vector3} opt_vec optional vector to receive eye position
	 * @return {THREE.Vector3} XYZ coordinates of the eye
	 */
	Camera.prototype.getEye = function(opt_vec) {
		var eye;

		if (opt_vec) {
			opt_vec.copy(this.cam.matrixWorld.getPosition());
			eye = opt_vec;
		} else {
			eye = this.cam.matrixWorld.getPosition().clone();
		}

		return eye;
	};

	/**
	 * Get the current position of the Camera target.
	 * 
	 * @param {THREE.Vector3} opt_vec optional vector to receive target position
	 * @return {THREE.Vector3} XYZ coordinates of the target
	 */
	Camera.prototype.getTarget = function(opt_vec) {
		var tgt;

		if (this.mode.fixed) {
			// Create a target vector that is transformed by cam's matrix but adds a negative Z
			// translation of "distance" length
			tgt = opt_vec ? opt_vec.set(0, 0, 1) : new THREE.Vector3(0, 0, 1);
			this.cam.matrixWorld.rotateAxis(tgt).multiplyScalar(-this.distance);
			tgt.addSelf(this.cam.matrixWorld.getPosition());
		} else {
			if (opt_vec) {
				opt_vec.copy(this.panTilt.matrixWorld.getPosition());
				tgt = opt_vec;
			} else {
				tgt = this.panTilt.matrixWorld.getPosition().clone();
			}
		}

		return tgt;
	};

	/**
	 * Move the Camera along the specified curve.
	 *
	 * @param {hemi.CameraCurve} curve curve for the Camera eye and target to follow
	 * @param {number} opt_time the number of seconds for the Camera to take to move alon gthe curve
	 *     (0 is instant)
	 */
	Camera.prototype.moveOnCurve = function(curve, opt_time) {
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
		this.state.time.end = (opt_time === null) ? 1.0 : (opt_time > 0) ? opt_time : 0.001;
		this.state.time.current = 0.0;
		this.send(hemi.msg.start, { viewdata: this.vd.current });
	};

	/**
	 * Move the Camera to the given Viewpoint.
	 *
	 * @param {hemi.Viewpoint} view Viewpoint to move to
	 * @param {number} opt_time the number of seconds for the Camera to take to move to the
	 *     Viewpoint (0 is instant)
	 */
	Camera.prototype.moveToView = function(view, opt_time) {
		var t = (opt_time === undefined) ? 1.0 : opt_time,
			pkg;

		if (view.getData !== undefined) {
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
	};

	/**
	 * Keyboard key-down listener.
	 *
	 * @param {Object} keyEvent key down event
	 */
	Camera.prototype.onKeyDown = function(keyEvent) {
		this.state.shift = (keyEvent.keyCode === 16);
	};

	/**
	 * Keyboard key-up listener.
	 *
	 * @param {Object} keyEvent key up event
	 */
	Camera.prototype.onKeyUp = function(keyEvent) {
		if (keyEvent.keyCode === 16) this.state.shift = false;
	};

	/**
	 * Mouse-down listener - set parameters to reflect that fact.
	 *
	 * @param {Object} mouseEvent mouse down event
	 */
	Camera.prototype.onMouseDown = function(mouseEvent) {
		this.state.mouse = true;
		this.state.xy.current[0] = this.state.xy.last[0] = mouseEvent.x;
		this.state.xy.current[1] = this.state.xy.last[1] = mouseEvent.y;
	};

	/**
	 * Mouse-move listener - move the camera if the mouse is down.
	 *
	 * @param {Object} mouseEvent mouse move event
	 */
	Camera.prototype.onMouseMove = function(mouseEvent) {
		if (this.state.mouse) {
			this.state.xy.last[0] = this.state.xy.current[0];
			this.state.xy.last[1] = this.state.xy.current[1];
			this.state.xy.current[0] = mouseEvent.x;
			this.state.xy.current[1] = mouseEvent.y;

			var xMovement = this.state.xy.current[0] - this.state.xy.last[0],
				yMovement = this.state.xy.current[1] - this.state.xy.last[1];

			if (this.mode.projection) {
				moveOrthographic.call(this, xMovement, yMovement);
			} else {
				movePerspective.call(this, xMovement, yMovement);
			}
		}
	};

	/**
	 * Mouse-up listener.
	 *
	 * @param {Object} mouseEvent mouse up event
	 */
	Camera.prototype.onMouseUp = function(mouseEvent) {
		this.state.mouse = false;
	};

	/**
	 * Render listener - check mouse and camera parameters and decide if the Camera needs to be
	 * updated.
	 *
	 * @param {Object} renderEvent render event
	 */
	Camera.prototype.onRender = function(renderEvent) {
		var state = this.state,
			xy = state.xy;	
		
		if ((state.mouse && (xy.current[0] !== xy.last[0] || xy.current[1] !== xy.last[1])) ||
			state.moving || state.update) {
			updateCamera.call(this, renderEvent.elapsedTime);
		}

		state.update = false;
	};

	/**
	 * Mouse-scroll listener - zoom the camera in or out.
	 *
	 * @param {Object} mouseEvent mouse wheel event
	 */
	Camera.prototype.onScroll = function(mouseEvent) {
		if (!this.mode.scroll) return;

		if (this.state.shift) {
			var dis = this.distance * TRUCK_SPEED,
				dir = (mouseEvent.deltaY > 0) ? 1 : -1;

			this.truck(dis * dir);
		} else {
			if (this.mode.fixed) {
				var breakpoint = (this.fov.max + this.fov.min) / 2;

				if (mouseEvent.deltaY > 0) {
					if (this.fov.current < breakpoint) {
						this.fov.current = this.fov.min + (this.fov.current - this.fov.min) * SCROLL_DOWN;
					} else {
						this.fov.current = this.fov.max - (this.fov.max - this.fov.current) * SCROLL_UP;
					}
				} else {
					if (this.fov.current < breakpoint) {
						this.fov.current = this.fov.min + (this.fov.current - this.fov.min) * SCROLL_UP;
					} else {
						this.fov.current = this.fov.max - (this.fov.max - this.fov.current) * SCROLL_DOWN;
					}
				}

				this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
				this.threeCamera.updateProjectionMatrix();
				this.state.update = true;
			} else {
				var t = (mouseEvent.deltaY > 0) ? SCROLL_DOWN : SCROLL_UP;
				this.distance = hemi.utils.lerp(0, this.distance, t);

				if (!this.mode.projection) {
					this.cam.position.z = this.distance;
					this.cam.updateMatrix();
				}

				this.state.update = true;
			}
		}
	};

	/**
	 * Orbit the Camera about the target point it is currently looking at.
	 * 
	 * @param {number} pan amount to pan around by (in radians)
	 * @param {number} tilt amount to tilt up and down by (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.orbit = function(pan, tilt) {
		if (tilt === undefined) tilt = 0;

		var newTilt = this.panTilt.rotation.x + tilt;

		this.panTilt.rotation.y += pan;
		this.panTilt.rotation.x = hemi.utils.clamp(newTilt, this.tiltMin, this.tiltMax);
		this.panTilt.updateMatrix();
		updateCamera.call(this);
		return this;
	};

	/**
	 * Rotate the Camera in place so that it looks in a new direction. Note that this has no effect
	 * if the Camera is not in fixed-eye mode.
	 * 
	 * @param {number} pan amount to pan (in radians)
	 * @param {number} tilt amount to tilt (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.rotate = function(pan, tilt) {
		if (tilt === undefined) tilt = 0;

		var ll = this.lookLimits,
			newPan = this.cam.rotation.y + pan,
			newTilt = this.cam.rotation.x + tilt;

		if (ll.panMin !== null && newPan < ll.panMin) {
			this.cam.rotation.y = ll.panMin;
		} else if (ll.panMax !== null && newPan > ll.panMax) {
			this.cam.rotation.y = ll.panMax;
		} else {
			this.cam.rotation.y = newPan;
		}

		if (ll.tiltMin !== null && newTilt < ll.tiltMin) {
			this.cam.rotation.x = ll.tiltMin;
		} else if (ll.tiltMax !== null && newTilt > ll.tiltMax) {
			this.cam.rotation.x = ll.tiltMax;
		} else {
			this.cam.rotation.x = newTilt;
		}

        this.cam.updateMatrix();
		updateCamera.call(this);
		return this;
	};

	/**
	 * Set the limits on the Camera pan and tilt in fixed eye mode.
	 * 
	 * @param {number} panMin minimum pan angle (in radians)
	 * @param {number} panMax maximum pan angle (in radians)
	 * @param {number} tiltMin minimum tilt angle (in radians)
	 * @param {number} tiltMax maximum tilt angle (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setLookAroundLimits = function(panMin, panMax, tiltMin, tiltMax) {
		this.lookLimits.panMax = panMax;
		this.lookLimits.panMin = panMin;
		this.lookLimits.tiltMax = tiltMax;
		this.lookLimits.tiltMin = tiltMin;
		return this;
	};

	/**
	 * Set the function used to ease the Camera in and out of moves.
	 *
	 * @param {function[]} easeFunc array of three functions which will be used for easing on the X,
	 *     Y, and Z axes
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setEasing = function(easeFunc) {
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
	};

	/**
	 * Set the eye and target of the Camera. 
	 *
	 * @param {THREE.Vector3} eye XYZ position of camera eye
	 * @param {THREE.Vector3} target XYZ position of camera target
	 */
	Camera.prototype.setEyeTarget = function(eye, target) {
		var offset = [eye.x - target.x, eye.y - target.y, eye.z -target.z],
			rtp = hemi.utils.cartesianToSpherical(offset);

		this.distance = rtp[0];

		this.panTilt.position.copy(target);
        this.panTilt.rotation.y = rtp[2];
        this.panTilt.rotation.x = rtp[1] - hemi.HALF_PI;
        this.panTilt.updateMatrix();

		this.cam.rotation.y = 0;
		this.cam.rotation.x = 0;
		this.cam.position.z = this.distance;
        this.cam.updateMatrix();

		_vector1.set(0, 0, this.distance);
		hemi.utils.pointAsLocal(this.cam, _vector2.copy(target));
		hemi.utils.pointZAt(this.cam, _vector1, _vector2);
		this.cam.rotation.y += Math.PI;
		this.cam.updateMatrix();

        this.updateWorldMatrices();
	};

	/**
	 * Set the color of the Camera's light source.
	 * 
	 * @param {number[3]} rgb rgb value of the color
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setLightColor = function(rgb) {
		this.light.color.setRGB(rgb[0], rgb[1], rgb[2]);
		return this;
	};

	/**
	 * Set the Camera view to render with an orthographic projection.
	 * 
	 * @param {hemi.Plane} plane the plane to look at orthographically (xy, xz, or yz)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setOrthographic = function(plane) {
		this.mode.projection = plane;
		return this;
	};

	/**
	 * Set the Camera view to render with a perspective projection.
	 * 
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setPerspective = function() {
		this.mode.projection = null;
		return this;
	};

	/**
	 * Set the zooming limits in fixed-eye mode.
	 *
	 * @param {number} min zoom-in limit (in radians)
	 * @param {number} max zoom-out limit (in radians)
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.setZoomLimits = function(min, max) {
		this.fov.min = min;
		this.fov.max = max;

		if (this.fov.current > this.fov.max) {
			this.fov.current = this.fov.max;
		}
		if (this.fov.current < this.fov.min) {
			this.fov.current = this.fov.min;
		}

		return this;
	};

	/**
	 * Move the Camera towards or away from its current target point by the given distance.
	 * 
	 * @param {number} distance the distance to move the Camera
	 * @return {hemi.Camera} this Camera (for easy chaining)
	 */
	Camera.prototype.truck = function(distance) {
		this.panTilt.translateZ(-distance);
        this.panTilt.updateMatrix();
        updateCamera.call(this);
		return this;
	};

	/**
	 * Recursively update all world matrices of the Camera's transforms.
	 */
    Camera.prototype.updateWorldMatrices = function() {
        this.panTilt.updateMatrixWorld(true);
    };

// Private functions for Camera

	/*
	 * Set up the Camera to interpolate between the two given time values.
	 * 
	 * @param {number} current current time
	 * @param {number} end end time
	 */
	function interpolateView(current, end) {
		var last = this.vd.last,
			cur = this.vd.current,
			upProj = false,
			eye, target;

		if (this.state.curve) {
			var t = this.easeFunc[0](current, 0, 1, end);
			eye = this.state.curve.eye.interpolate(t);
			target = this.state.curve.target.interpolate(t);
		} else {
			eye = _vector1;
			target = _vector2;
			eye.x = this.easeFunc[0](current, last.eye.x, cur.eye.x - last.eye.x, end);
			eye.y = this.easeFunc[1](current, last.eye.y, cur.eye.y - last.eye.y, end);
			eye.z = this.easeFunc[2](current, last.eye.z, cur.eye.z - last.eye.z, end);
			target.x = this.easeFunc[0](current, last.target.x, cur.target.x - last.target.x, end);
			target.y = this.easeFunc[1](current, last.target.y, cur.target.y - last.target.y, end);
			target.z = this.easeFunc[2](current, last.target.z ,cur.target.z - last.target.z,end);
		}
		if (cur.fov !== last.fov) {
			this.fov.current = this.easeFunc[0](current, last.fov, cur.fov - last.fov, end);
			this.threeCamera.fov = this.fov.current * hemi.RAD_TO_DEG;
			upProj = true;
		}
		if (cur.np !== last.np) {
			this.threeCamera.near = this.easeFunc[0](current, last.np, cur.np - last.np, end);
			upProj = true;
		}
		if (cur.fp !== last.fp) {
			this.threeCamera.far = this.easeFunc[0](current, last.fp, cur.fp - last.fp, end);
			upProj = true;
		}
		if (upProj) {
			this.threeCamera.updateProjectionMatrix();
		}

		this.setEyeTarget(eye, target);
	}

	/*
	 * Move the Camera when the Camera is in orthographic viewing mode.
	 *
	 * @param {number} xMovement the mouse movement in pixels along the x-axis
	 * @param {number} yMovement the mouse movement in pixels along the y-axis
	 */
	function moveOrthographic(xMovement, yMovement) {
		var distFactor = 2 * this.distance / hemi.core.client.width,
			xDis = xMovement * distFactor,
			yDis = yMovement * distFactor;

		switch(this.mode.projection) {
			case hemi.Plane.XY:
			case hemi.Plane.YZ:
				this.panTilt.translateX(-xDis);
                this.panTilt.translateY(yDis);
                this.panTilt.updateMatrix();
				break;
			case hemi.Plane.XZ:
			    this.panTilt.translateX(xDis);
                this.panTilt.translateZ(yDis);
                this.panTilt.updateMatrix();
				break;
		}
	}

	/*
	 * Move the Camera when the Camera is in perspective viewing mode.
	 *
	 * @param {number} xMovement the mouse movement in pixels along the x-axis
	 * @param {number} yMovement the mouse movement in pixels along the y-axis
	 */		
	function movePerspective(xMovement, yMovement) {
		if (this.state.shift && this.mode.scan) {
			var deltaX = MOUSE_DELTA * this.distance * xMovement,
				deltaY = MOUSE_DELTA * this.distance * yMovement;

			this.panTilt.translateX(-deltaX);
			this.panTilt.translateY(deltaY);
            this.panTilt.updateMatrix();
			updateCamera.call(this);
		} else {
			if (this.mode.fixed) {
				this.rotate(-xMovement * MOUSE_SPEED, -yMovement * MOUSE_SPEED);
			} else {
				this.orbit(-xMovement * MOUSE_SPEED, -yMovement * MOUSE_SPEED);
			}		
		}
	}

	/*
	 * Update the Camera.
	 * 
	 * @param {number} opt_delta optional time delta to upate for
	 */
	function updateCamera(opt_delta) {
		var time = this.state.time;

		if (this.state.moving) {
			interpolateView.call(this, time.current,time.end);

			if (opt_delta !== undefined) {
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

				time.current += opt_delta;

				if (time.current >= time.end) {
					time.current = time.end;
				}				
			}
		}

		this.updateWorldMatrices();
		this.getEye(this.threeCamera.position);
		this.getTarget(_vector1);

		this.threeCamera.matrix.setPosition(this.threeCamera.position);
		this.threeCamera.lookAt(_vector1);
		this.threeCamera.updateMatrixWorld(true);

		this.light.updateMatrix();
	}

	hemi.makeCitizen(Camera, 'hemi.Camera', {
		cleanup: Camera.prototype._clean,
		toOctane: Camera.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// CameraCurve class
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * @class A CameraCurve contains an "eye" Curve and a "target" Curve that allow a Camera to
	 * follow a smooth path through several waypoints.
	 * 
	 * @param {hemi.Curve} eye Curve for camera eye to follow
	 * @param {hemi.Curve} target Curve for camera target to follow
	 */
	var CameraCurve = function(eye, target) {
		this.eye = eye;
		this.target = target;
	};

	/*
	 * Remove all references in the CameraCurve.
	 */
	CameraCurve.prototype._clean = function() {
		this.eye = null;
		this.target = null;
	};

	/*
	 * Octane properties for CameraCurve.
	 * @type string[]
	 */
	CameraCurve.prototype._octane = ['eye', 'target'];

	hemi.makeCitizen(CameraCurve, 'hemi.CameraCurve', {
		cleanup: CameraCurve.prototype._clean,
		toOctane: CameraCurve.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// ViewData class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ViewData is a light-weight, non-Citizen form of a Viewpoint.
	 */
	hemi.ViewData = function(config) {
		var cfg = config || {};
		this.eye = cfg.eye || new THREE.Vector3(0, 0, -1);
		this.target = cfg.target || new THREE.Vector3(0, 0, 0);
		this.fov = cfg.fov || FOV;
		this.np = cfg.np || NEAR_PLANE;
		this.fp = cfg.fp || FAR_PLANE;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Viewpoint class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Viewpoint describes everything needed for a view - eye, target, field of view, near
	 * plane, and far plane.
	 */
	var Viewpoint = function(config) {
		var cfg = config || {};
		this.name = cfg.name || '';
		this.eye = cfg.eye || new THREE.Vector3(0, 0, -1);
		this.target = cfg.target || new THREE.Vector3(0, 0, 0);
		this.fov = cfg.fov || FOV;
		this.np = cfg.np || NEAR_PLANE;
		this.fp = cfg.fp || FAR_PLANE;
	};

	/*
	 * Remove all references in the Viewpoint.
	 */
	Viewpoint.prototype._clean = function() {
		this.eye = null;
		this.target = null;
	};

	/*
	 * Octane properties for Viewpoint.
	 * @type string[]
	 */
	Viewpoint.prototype._octane = ['eye', 'target', 'fov', 'np', 'fp'];

	/**
	 * Get the data contained within the Viewpoint.
	 *
	 * @return {hemi.ViewData} the ViewData for the Viewpoint
	 */
	Viewpoint.prototype.getData = function() {
		return new hemi.ViewData(this);
	};

	/**
	 * Set the data for the Viewpoint.
	 *
	 * @param {hemi.ViewData} viewData data to set for the Viewpoint
	 */
	Viewpoint.prototype.setData = function(viewData) {
		this.eye = viewData.eye;
		this.target = viewData.target;
		this.fov = viewData.fov;
		this.np = viewData.np;
		this.fp = viewData.fp;
	};

	hemi.makeCitizen(Viewpoint, 'hemi.Viewpoint', {
		cleanup: Viewpoint.prototype._clean,
		toOctane: Viewpoint.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

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
	 * Create a new Viewpoint with the given name and the given Camera's current viewing parameters.
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

})();
