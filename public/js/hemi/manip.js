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

		// Static helper objects shared by all motions
	var _plane = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
		_vector = new THREE.Vector3(),
		_vec2 = new THREE.Vector2(),
		X_AXIS = new THREE.Vector3(1, 0, 0),
		Y_AXIS = new THREE.Vector3(0, 1, 0),
		Z_AXIS = new THREE.Vector3(0, 0, 1),
		XY_PLANE = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)],
		XZ_PLANE = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1)],
		YZ_PLANE = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0)];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	hemi.Plane = {
		XY : 'xy',
		XZ : 'xz',
		YZ : 'yz'
	};

	hemi.Axis = {
		X : 'x',
		Y : 'y',
		Z : 'z'
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Manipulator class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Manipulator allows a Transform to be manipulated in some way through mouse
	 * interaction.
	 */
	var Manipulator = function() {
		/*
		 * The Mesh that was picked by the last mouse click and is being used to manipulate.
		 * @type hemi.Mesh
		 */
		this._activeTransform = null;

		/**
		 * The Client that the Manipulator's active Transform is being rendered by.
		 * @type hemi.Client
		 */
		this._client = null;

		/*
		 * Flag indicating if interaction through the Manipulator is enabled.
		 * @type boolean
		 */
		this._enabled = false;

		/*
		 * The message handler for pick messages (stored for unsubscribing).
		 * @type hemi.dispatch.MessageTarget
		 */
		this._msgHandler = null;

		/**
		 * Flag indicating if the Manipulator should operate in the local space of the Transform it
		 * is manipulating (rather than world space).
		 * @type boolean
		 * @default false
		 */
		this.local = false;

		/**
		 * An array of Transforms controlled by the Manipulator.
		 * @type hemi.Transform[]
		 */
		this.transforms = [];
	};

	/**
	 * Add a Transform to the list of Manipulator Transforms.
	 *
	 * @param {hemi.Transform} transform the transform to add
	 */
	Manipulator.prototype.addTransform = function(transform) {
		this.transforms.push(transform);
	};

	/**
	 * Clear the list of Manipulator Transforms.
	 */
	Manipulator.prototype.clearTransforms = function() {
		this.transforms.length = 0;
	};

	/**
	 * Check if a given Transform is contained within the children of the Transforms acted upon by
	 * the Manipulator.
	 *
	 * @param {hemi.Transform} transform transform to check against
	 * @return {boolean} true if the Transform is found
	 */
	Manipulator.prototype.containsTransform = function(transform) {
		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			var children = this.transforms[i].getAllChildren();

			for (var j = 0, jl = children.length; j < jl; ++j) {
				if (transform.id === children[j].id) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Disable mouse interaction for the Manipulator. 
	 */
	Manipulator.prototype.disable = function() {
		if (this._enabled) {
			hemi.unsubscribe(this._msgHandler, hemi.msg.pick);
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			this._enabled = false;
			this._msgHandler = null;
		}
	};

	/**
	 * Enable mouse interaction for the Manipulator. 
	*/
	Manipulator.prototype.enable = function() {
		if (!this._enabled) {
			this._msgHandler = hemi.subscribe(hemi.msg.pick, this, 'onPick',
				[hemi.dispatch.MSG_ARG + 'data.pickedMesh', 
				 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);

			hemi.input.addMouseMoveListener(this);
			hemi.input.addMouseUpListener(this);
			this._enabled = true;
		}
	};

	/**
	 * Stop manipulating transforms.
	 *
	 * @param {Object} event the mouse up event
	 */
	Manipulator.prototype.onMouseUp = function(event) {
		this._activeTransform = null;
	};

	/**
	 * Remove the given Transform from the Manipulator.
	 * 
	 * @param {hemi.Transform} transform the Transform to remove
	*/
	Manipulator.prototype.removeTransform = function(transform) {
		var ndx = this.transforms.indexOf(transform);

		if (ndx !== -1) {
			this.transforms.splice(ndx, 1);
		}
	};

// Private functions

	/*
	 * Get the two dimensional plane that the Manipulator is operating on.
	 * 
	 * @return {THREE.Vector3[3]} the current move plane defined as 3 XYZ points
	 */
	function getPlane() {
		if (this.local) {
			var u = hemi.utils;
			_plane[0].copy(this.plane[0]);
			_plane[1].copy(this.plane[1]);
			_plane[2].copy(this.plane[2]);

			u.pointAsWorld(this._activeTransform, _plane[0]);
			u.pointAsWorld(this._activeTransform, _plane[1]);
			u.pointAsWorld(this._activeTransform, _plane[2]);
		} else {
			var translation = this._activeTransform.matrixWorld.getPosition();

			_plane[0].add(this.plane[0], translation);
			_plane[1].add(this.plane[1], translation);
			_plane[2].add(this.plane[2], translation);
		}

		return _plane;
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Movable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Movable allows a 3D object to be moveed around the scene with the mouse, constrained
	 * to a defined 2D plane.
	 * @extends Manipulator
	 * 
	 * @param {Vector3[3]} opt_plane an array of 3 XYZ points defining a plane
	 * @param {number[4]} opt_limits an array containing [min on u, max on u, min on v, max on v]
	 */
	var Movable = function(opt_plane, opt_limits) {
		Manipulator.call(this);

		/*
		 * The UV coordinates of the last mouse down that picked one of the Movable's Transforms.
		 * @type number[2]
		 */
		this._pickUV = null;

		/*
		 * The current UV coordinates of the Movable on its plane.
		 * @type number[2]
		 */
		this._uv = [0, 0];

		/**
		 * The 2D plane that the Movable's Transforms will move along.
		 * @type THREE.Vector3[3]
		 */
		this.plane = null;

		/**
		 * The minimum U coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.umin = null;

		/**
		 * The maximum U coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.umax = null;

		/**
		 * The minimum V coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.vmin = null;

		/**
		 * The maximum V coordinate for the Movable on its 2D plane.
		 * @type number
		 * @default null
		 */
		this.vmax = null;

		this.setPlane(opt_plane || hemi.Plane.XZ);

		if (opt_limits !== undefined) {
			this.setLimits(opt_limits);
		}

		this.enable();
	};

	Movable.prototype = new Manipulator();
	Movable.constructor = Movable;

	/*
	 * Octane properties for Movable.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Movable.prototype._octane = function(){
		var valNames = ['local', 'umin', 'umax', 'vmin', 'vmax'],
			props = [],
			plane = this.plane;

		for (var i = 0, il = valNames.length; i < il; ++i) {
			var name = valNames[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		if (plane === XY_PLANE) {
			props.push({
				name: 'setPlane',
				arg: [hemi.Plane.XY]
			});
		} else if (plane === XZ_PLANE) {
			props.push({
				name: 'setPlane',
				arg: [hemi.Plane.XZ]
			});
		} else if (plane === YZ_PLANE) {
			props.push({
				name: 'setPlane',
				arg: [hemi.Plane.YZ]
			});
		} else {
			props.push({
				name: 'plane',
				oct: [plane[0]._toOctane(), plane[1]._toOctane(), plane[2]._toOctane()]
			});
		}

		return props;
	};

	/**
	 * Clear all properties for the Movable.
	 */
	Movable.prototype.clear = function() {
		this._activeTransform = null;
		this._client = null;
		this._uv[0] = this._uv[1] = 0;
		this.local = false;

		this.setPlane(hemi.Plane.XZ);
		this.disable();
		this.clearTransforms();
		this.clearLimits();
	};

	/**
	 * Remove any previously set limits from the Movable.
	 */
	Movable.prototype.clearLimits = function() {
		this.umin = null;
		this.umax = null;
		this.vmin = null;
		this.vmax = null;
	};

	/**
	 * Calculate mouse point intersection with the Movable's plane and then translate the moving
	 * Transforms accordingly.
	 *
	 * @param {Object} event the mouse move event
	 */
	Movable.prototype.onMouseMove = function(event) {
		if (this._activeTransform === null) return;

		var plane = getPlane.call(this),
			uv = getUV.call(this, event.x, event.y, plane),
			delta = [uv[0] - this._pickUV[0], uv[1] - this._pickUV[1]];

		clampUV.call(this, delta);

		var localDelta = hemi.utils.uvToXYZ(delta, plane),
			xyzOrigin = hemi.utils.uvToXYZ([0, 0], plane),
			xyzDelta = _vector.sub(localDelta, xyzOrigin);

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			hemi.utils.worldTranslate(xyzDelta, this.transforms[i]);
		}

		this.transforms[0].send(hemi.msg.move, { delta: xyzDelta });
	};

	/**
	 * Check the picked mesh to see if the Movable should start moving its Transforms.
	 *
	 * @param {hemi.Mesh} pickedMesh the Mesh picked by the mouse click
	 * @param {Object} mouseEvent the mouse down event
	 */
	Movable.prototype.onPick = function(pickedMesh, mouseEvent) {
		var meshId = pickedMesh.id;

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			if (this.transforms[i].id === meshId) {
				this._activeTransform = pickedMesh;
				this._client = hemi.getClient(pickedMesh);
				this._pickUV = getUV.call(this, mouseEvent.x, mouseEvent.y);
				break;
			}
		}
	};

	/**
	 * Set the relative uv limits in which this Movable can move.
	 *
	 * @param {number[4]} limits an array containing [min on u, max on u, min on v, max on v]
	 */
	Movable.prototype.setLimits = function(limits) {
		this.umin = limits[0];
		this.umax = limits[1];
		this.vmin = limits[2];
		this.vmax = limits[3];
	};

	/**
	 * Set the 2d plane on which this Movable is bound.
	 *
	 * @param {hemi.Plane} plane enum indicating which plane to move along
	 */
	Movable.prototype.setPlane = function(plane) {
		switch (plane) {
			case (hemi.Plane.XY):
				this.plane = XY_PLANE;
				break;
			case (hemi.Plane.XZ):
				this.plane = XZ_PLANE;
				break;
			case (hemi.Plane.YZ):
				this.plane = YZ_PLANE;
				break;
		}
	};

	Movable.prototype.getPlaneString = function() {
		if (this.plane == XY_PLANE) {
			return hemi.Plane.XY;
		} else if (this.plane == XZ_PLANE) {
			return hemi.Plane.XZ;
		} else if (this.plane == YZ_PLANE) {
			return hemi.Plane.YZ;
		} else {
			return "UNKNOWN";
		}
	};

// Private functions

	/*
	 * Add the given UV delta to the current UV coordinates and clamp the results.
	 *
	 * @param {number[2]} delta the uv change to add before clamping
	 */
	function clampUV(delta) {
		var u = this._uv[0] + delta[0],
			v = this._uv[1] + delta[1];

		if (this.umin !== null && u < this.umin) {
			u = this.umin;
		}
		if (this.umax !== null && u > this.umax) {
			u = this.umax;
		}
		if (this.vmin !== null && v < this.vmin) {
			v = this.vmin;
		}
		if (this.vmax !== null && v > this.vmax) {
			v = this.vmax;
		}

		delta[0] = u - this._uv[0];
		delta[1] = v - this._uv[1];
		this._uv[0] = u;
		this._uv[1] = v;
	}

	/*
	 * Convert the given screen coordinates into UV coordinates on the current moving plane.
	 * 
	 * @param {number} x x screen coordinate
	 * @param {number} y y screen coordinate
	 * @return {number[2]} equivalent UV coordinates
	 */
	function getUV(x, y, opt_plane) {
		var ray = this._client.castRay(x, y),
			plane = opt_plane || getPlane.call(this),
			tuv = hemi.utils.intersect(ray, plane);

		return [tuv[1], tuv[2]];
	}

	hemi.Movable = Movable;
	hemi.makeOctanable(hemi.Movable, 'hemi.Movable', hemi.Movable.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Turnable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Turnable allows a Transform to be turned about an axis by the user clicking and
	 * dragging with the mouse.
	 * @extends Manipulator
	 * 
	 * @param {hemi.Axis} opt_axis optional axis to rotate about
	 * @param {number[2]} opt_limits optional minimum and maximum angle limits (in radians)
	 */
	var Turnable = function(opt_axis, opt_limits) {	
		Manipulator.call(this);

		/*
		 * The current angle of the Turnable on its axis.
		 * @type number
		 */
		this._angle = 0;

		/*
		 * The angle of the last mouse down that picked one of the Turnable's Transforms.
		 * @type number
		 */
		this._pickAngle = null;

		/**
		 * The axis that the Turnable's Transforms will turn about.
		 * @type THREE.Vector3
		 */
		this.axis = new THREE.Vector3();

		/**
		 * The minimum angle for the Turnable on its axis.
		 * @type number
		 * @default null
		 */
		this.min = null;

		/**
		 * The maximum angle for the Turnable on its axis.
		 * @type number
		 * @default null
		 */
		this.max = null;

		/**
		 * The 2D plane that the Movable's Transforms will move along.
		 * @type THREE.Vector3[3]
		 */
		this.plane = null;

		this.setAxis(opt_axis || hemi.Axis.Y);

		if (opt_limits !== undefined) {
			this.setLimits(opt_limits);
		}

		this.enable();
	};

	Turnable.prototype = new Manipulator();
	Turnable.constructor = Turnable;

	/*
	 * Octane properties for Turnable.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Turnable.prototype._octane = function(){
		var valNames = ['local', 'max', 'min'],
			props = [],
			plane = this.plane;

		for (var i = 0, il = valNames.length; i < il; ++i) {
			var name = valNames[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		if (plane === XY_PLANE) {
			props.push({
				name: 'setAxis',
				arg: [hemi.Axis.Z]
			});
		} else if (plane === XZ_PLANE) {
			props.push({
				name: 'setAxis',
				arg: [hemi.Axis.Y]
			});
		} else if (plane === YZ_PLANE) {
			props.push({
				name: 'setAxis',
				arg: [hemi.Axis.X]
			});
		} else {
			props.push({
				name: 'axis',
				oct: this.axis._toOctane()
			});
			props.push({
				name: 'plane',
				oct: [plane[0]._toOctane(), plane[1]._toOctane(), plane[2]._toOctane()]
			});
		}

		return props;
	};

	/**
	 * Clear all properties for the Turnable.
	 */
	Turnable.prototype.clear = function() {
		this._activeTransform = null;
		this._angle = 0;
		this._client = null;
		this.local = false;

		this.setAxis(hemi.Axis.Y);
		this.disable();
		this.clearTransforms();
		this.clearLimits();
	};

	/**
	 * Remove any previously set limits from the Turnable.
	 */
	Turnable.prototype.clearLimits = function() {
		this.min = null;
		this.max = null;
	};

	/**
	 * Calculate mouse point intersection with the Turnable's plane and then rotate the turning
	 * Transforms accordingly.
	 *
	 * @param {Object} event the mouse move event
	 */
	Turnable.prototype.onMouseMove = function(event) {
		if (this._activeTransform === null) return;

		var delta = getAngle.call(this, event.x, event.y) - this._pickAngle;

		if (this.max !== null && this._angle + delta >= this.max) {
			delta = this.max - this._angle;
		}
		if (this.min !== null && this._angle + delta <= this.min) {
			delta = this.min - this._angle;
		}

		this._angle += delta;

		if (!this.local) {
			this._pickAngle += delta;
		}

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			var tran = this.transforms[i];

			if (this.local) {
				hemi.utils.axisRotate(this.axis, delta, tran);
			} else {
				hemi.utils.worldRotate(this.axis, delta, tran);
			}
		}
	};

	/**
	 * Check the picked mesh to see if the Turnable should start turning its Transforms.
	 *
	 * @param {hemi.Mesh} pickedMesh the Mesh picked by the mouse click
	 * @param {Object} mouseEvent the mouse down event
	 */
	Turnable.prototype.onPick = function(pickedMesh, event) {
		var meshId = pickedMesh.id;

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			if (this.transforms[i].id === meshId) {
				this._activeTransform = pickedMesh;
				this._client = hemi.getClient(pickedMesh);
				this._pickAngle = getAngle.call(this, event.x, event.y);
				break;
			}
		}
	};

	/**
	 * Set the axis to which the Turnable is bound.
	 * 
	 * @param {hemi.Axis} axis axis to rotate about
	 */
	Turnable.prototype.setAxis = function(axis) {
		switch(axis) {
			case hemi.Axis.X:
				this.axis.copy(X_AXIS);
				this.axis.x *= -1;
				this.plane = YZ_PLANE;
				break;
			case hemi.Axis.Y:
				this.axis.copy(Y_AXIS);
				this.axis.y *= -1;
				this.plane = XZ_PLANE;
				break;
			case hemi.Axis.Z:
				this.axis.copy(Z_AXIS);
				this.plane = XY_PLANE;
				break;
		}
	};

	Turnable.prototype.getAxisString = function() {
		if (hemi.utils.vector3Equals(this.axis, new THREE.Vector3(-1, 0, 0))) {
			return hemi.Axis.X;
		} else if (hemi.utils.vector3Equals(this.axis, new THREE.Vector3(0, -1, 0))) {
			return hemi.Axis.Y;
		} else if (hemi.utils.vector3Equals(this.axis, new THREE.Vector3(0, 0, 1))) {
			return hemi.Axis.Z;
		} else {
			return "UNKNOWN";
		}
	};

	/**
	 * Set the limits to which the Turnable can rotate.
	 * 
	 * @param {number[2]} limits minimum and maximum angle limits (in radians)
	 */
	Turnable.prototype.setLimits = function(limits) {
		this.min = limits[0];
		this.max = limits[1];
	};

// Private functions

	/*
	 * Get the relative angle of a mouse click's interception with the active plane to the origin of
	 * that plane.
	 * 
	 * @param {number} x screen x-position of the mouse click event
	 * @param {number} y screen y-position of the mouse click event
	 * @return {number} relative angle of mouse click position on the Turnable's current active
	 *     plane
	 */
	function getAngle(x, y) {
		var plane = getPlane.call(this),
			ray = this._client.castRay(x, y),
			tuv = hemi.utils.intersect(ray, plane);

		return Math.atan2(tuv[2], tuv[1]);
	}


	hemi.Turnable = Turnable;
	hemi.makeOctanable(hemi.Turnable, 'hemi.Turnable', hemi.Turnable.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Resizable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Resizable allows a Transform to be resized along an axis by the user clicking and
	 * dragging with the mouse.
	 * @extends Manipulator
	 * 
	 * @param {hemi.Axis} opt_axis optional axis to resize along
	 */
	var Resizable = function(opt_axis) {
		Manipulator.call(this);

		/*
		 * The screen XY of the origin point in the local space of the Resizable's Transform.
		 * @type number[2]
		 */
		this._originXY = null;

		/*
		 * The screen XY of the last mouse down that picked one of the Resizable's Transforms.
		 * @type THREE.Vector2
		 */
		this._pickXY = new THREE.Vector2();

		/*
		 * The current scale of the Resizable on its axis.
		 * @type number
		 */
		this._scale = null;

		/**
		 * The axis that the Resizable's Transforms will resize along.
		 * @type THREE.Vector3
		 */
		this.axis = null;

		this.setAxis(opt_axis || hemi.Axis.Y);

		this.enable();
	};

	Resizable.prototype = new Manipulator();
	Resizable.constructor = Resizable;

	/*
	 * Octane properties for Resizable.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	Resizable.prototype._octane = function(){
		// TODO
		return [];
	};

	/**
	 * Clear all properties for the Resizable.
	 */
	Resizable.prototype.clear = function() {
		this._activeTransform = null;
		this._scale = null;
		this._client = null;
		this.local = false;

		this.setAxis(hemi.Axis.Y);
		this.disable();
		this.clearTransforms();
	};

	/**
	 * Calculate mouse point intersection with the Turnable's plane and then rotate the turning
	 * Transforms accordingly.
	 *
	 * @param {Object} event the mouse move event
	 */
	Resizable.prototype.onMouseMove = function(event) {
		if (this._activeTransform === null) return;

		var scale = getScale.call(this, event.x, event.y),
			f = scale / this._scale,
			axis = _vector.set(
				this.axis.x ? f : 1,
				this.axis.y ? f : 1,
				this.axis.z ? f : 1
			);

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			var tran = this.transforms[i];

			if (this.local) {
				tran.scale.multiplySelf(axis);
				tran.updateMatrix();
				tran.updateMatrixWorld();
			} else {
				hemi.utils.worldScale(axis, tran);
			}
		}

		this._scale = scale;
		this.transforms[0].send(hemi.msg.resize, { scale: scale });
	};

	/**
	 * Check the picked mesh to see if the Resizable should start resizing its Transforms.
	 *
	 * @param {hemi.Mesh} pickedMesh the Mesh picked by the mouse click
	 * @param {Object} mouseEvent the mouse down event
	 */
	Resizable.prototype.onPick = function(pickedMesh, event) {
		var meshId = pickedMesh.id;

		for (var i = 0, il = this.transforms.length; i < il; ++i) {
			if (this.transforms[i].id === meshId) {
				this._activeTransform = pickedMesh;
				this._client = hemi.getClient(pickedMesh);
				this._originXY = xyPoint.call(this, _vector.set(0,0,0));

				var axis2d = xyPoint.call(this, _vector.copy(this.axis));
				this._pickXY.set(axis2d[0] - this._originXY[0], axis2d[1] - this._originXY[1]).normalize();
				this._scale = getScale.call(this, event.x, event.y);
				break;
			}
		}
	};

	/**
	 * Set the axis along which the Resizable will resize.
	 * 
	 * @param {hemi.Axis} axis axis to resize along
	 */
	Resizable.prototype.setAxis = function(axis) {
		switch(axis) {
			case hemi.Axis.X:
				this.axis = X_AXIS;
				break;
			case hemi.Axis.Y:
				this.axis = Y_AXIS;
				break;
			case hemi.Axis.Z:
				this.axis = Z_AXIS;
				break;
		}
	};

// Private functions

	/*
	 * Get the relative scale from the given mouse event coordinates.
	 * 
	 * @param {number} x screen x-position of the mouse event
	 * @param {number} y screen y-position of the mouse event
	 * @return {number} relative scale
	 */
	function getScale(x, y) {
		var offset = _vec2.set(x - this._originXY[0], y - this._originXY[1]),
			scale = Math.abs(this._pickXY.dot(offset));

		return scale;
	}

	/*
	 * Convert the given point in the active transform's local space to screen coordinates.
	 * 
	 * @param {THREE.Vector3} point point in local space to convert
	 * @return {number[2]} array of the x and y screen coordinates
	 */
	function xyPoint(point) {
		if (this.local) {
			hemi.utils.pointAsWorld(this._activeTransform, point);
		} else {
			point.addSelf(this._activeTransform.position);
		}

		hemi.utils.worldToScreenFloat(this._client, point);
		return [point.x, point.y];
	}

	hemi.Resizable = Resizable;
	hemi.makeOctanable(hemi.Resizable, 'hemi.Resizable', hemi.Resizable.prototype._octane);

})();
