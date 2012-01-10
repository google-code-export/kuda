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
// ManipulatorBase class
////////////////////////////////////////////////////////////////////////////////////////////////////

	var ManipulatorBase = function(client) {
		this.client = client;
		this.transformObjs = [];
		this.local = false;
		this.enabled = false;
		this.msgHandler = null;
		this.activeTransform = null;
	};

	/**
	 * Remove all references in the Manipulator
	 */
	ManipulatorBase.prototype._clean = function() {
		this.disable();
		this.clearTransforms();
		this.msgHandler = null;
	};

	/**
	 * Add a Transform to the list of Manipulator Transforms.
	 *
	 * @param {THREE.Object3D} transform the transform to add
	 */
	ManipulatorBase.prototype.addTransform = function(transform) {
		this.transformObjs.push(transform);
	};

	/**
	 * Clear the list of Manipulator Transforms.
	 */
	ManipulatorBase.prototype.clearTransforms = function() {
		this.transformObjs.length = 0;
	};

	/**
	 * Check if a given Transform is contained within the children of the
	 * Transforms acted upon by this Manipulator.
	 *
	 * @param {THREE.Object3D} transform transform to check against
	 * @return {boolean} true if the Transform is found
	 */
	ManipulatorBase.prototype.containsTransform = function(transform) {
		for (var i = 0; i < this.transformObjs.length; i++) {
			var children = [];
			hemi.utils.getChildren(this.transformObjs[i], children);
			for (var j = 0; j < children.length; j++) {
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
	ManipulatorBase.prototype.disable = function() {
		if (this.enabled) {
			hemi.unsubscribe(this.msgHandler, hemi.msg.pick);
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			this.enabled = false;
		}
	};

	/**
	 * Enable mouse interaction for the Manipulator. 
	*/
	ManipulatorBase.prototype.enable = function() {
		if (!this.enabled) {
			this.msgHandler = hemi.subscribe(
				hemi.msg.pick,
				this,
				'onPick',
				[hemi.dispatch.MSG_ARG + 'data.pickedMesh', 
				 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
			hemi.input.addMouseMoveListener(this);
			hemi.input.addMouseUpListener(this);
			this.enabled = true;
		}
	};

	/**
	 * Get the Transforms that the Manipulator currently contains.
	 * 
	 * @return {THREE.Object3D[]} array of Transforms
	 */
	ManipulatorBase.prototype.getTransforms = function() {
		return this.transformObjs.slice(0);
	};

	/**
	 * Remove Transforms 
	 * 
	 * @param {THREE.Object3D} tranObj The transform to remove
	*/
	ManipulatorBase.prototype.removeTransforms = function(tranObj) {
		var ndx = this.transformObjs.indexOf(tranObj);

		if (ndx > -1) {
			this.transformObjs.splice(ndx, 1);
		}
	};

	/**
	 * Set the Draggable to operate in the local space of the transform it
	 * is translating.
	 */
	ManipulatorBase.prototype.setToLocal = function() {
		this.local = true;
	};

	/**
	 * Set the Draggable to operate in world space.
	 */
	ManipulatorBase.prototype.setToWorld = function() {
		this.local = false;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Draggable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Draggable allows a 3d object to be dragged around the scene with the mouse,
	 * constrained to a defined 2d plane.
	 * 
	 * @param {hemi.client} client the client that this draggable exists in
	 * @param {number[3][3]} opt_plane Array of 3 xyz points defining a plane
	 * @param {number[4]} opt_limits An array containing 
	 *	   [min on u, max on u, min on v, max on v]
	 * @param {number[2]} opt_startUV Draggable's starting uv coordinate, if
	 *		not [0,0]
	 */
	var Draggable = function(client, opt_plane, opt_limits, opt_startUV) {
		ManipulatorBase.call(this, client);
		this.dragUV = null;
		this.plane = null;
		this.umin = null;
		this.umax = null;
		this.uv = opt_startUV == null ? [0,0] : opt_startUV;
		this.vmin = null;
		this.vmax = null;

		if (opt_plane != null) {
			this.setPlane(opt_plane);
		}
		if (opt_limits != null) {
			this.setLimits(opt_limits);
		}

		this.enable();
	};

	Draggable.prototype = new ManipulatorBase();
	Draggable.constructor = Draggable;

	/*
	 * Array of Hemi Messages that Draggable is known to send.
	 * @type string[]
	 */
	Draggable.prototype._msgSent = [hemi.msg.drag];

	/*
	 * Octane properties for Draggable.
	 * @type string[]
	 */
	Draggable.prototype._octane = ['local', 'plane', 'umin', 'umax', 'vmin', 'vmax'];

	/**
	 * Add the given UV delta to the current UV coordinates and clamp the results.
	 *
	 * @param {number[2]} delta the uv change to add before clamping
	 * @return {number[2]} the actual change in uv after clamping
	 */
	Draggable.prototype.clamp = function(delta) {
		var u = this.uv[0] + delta[0],
			v = this.uv[1] + delta[1];

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

		delta = [u - this.uv[0], v - this.uv[1]];
		this.uv = [u, v];

		return delta;
	};

	/**
	 * Remove any previously set limits from the draggable.
	 */
	Draggable.prototype.clearLimits = function() {
		this.umin = null;
		this.umax = null;
		this.vmin = null;
		this.vmax = null;
	};

	/**
	 * Get the two dimensional plane that the Draggable will translate its active Transform along.
	 * 
	 * @return {THREE.Vector3[3]} the current drag plane defined as 3 XYZ points
	 */
	Draggable.prototype.getPlane = function() {
		if (this.activeTransform === null) {
			return null;
		}

		var plane;

		if (this.local) {
			var u = hemi.utils;
			plane = [u.pointAsWorld(this.activeTransform, this.plane[0]),
					 u.pointAsWorld(this.activeTransform, this.plane[1]),
					 u.pointAsWorld(this.activeTransform, this.plane[2])];
		} else {
			var translation = this.activeTransform.matrixWorld.getPosition();

			plane = [new THREE.Vector3().add(this.plane[0], translation),
					 new THREE.Vector3().add(this.plane[1], translation),
					 new THREE.Vector3().add(this.plane[2], translation)];
		}

		return plane;
	};

	/**
	 * Convert the given screen coordinates into UV coordinates on the current dragging plane.
	 * 
	 * @param {number} x x screen coordinate
	 * @param {number} y y screen coordinate
	 * @return {number[2]} equivalent UV coordinates
	 */
	Draggable.prototype.getUV = function(x,y) {
		var ray = this.client.castRay(x, y),
			plane = this.getPlane(),
			tuv = hemi.utils.intersect(ray, plane);

		return [tuv[1], tuv[2]];
	};

	/**
	 * Mouse movement event listener, calculates mouse point intersection with this Draggable's
	 * plane, and then translates the dragging object accordingly.
	 *
	 * @param {Object} event message describing how the mouse has moved
	 */
	Draggable.prototype.onMouseMove = function(event) {
		if (this.dragUV === null) {
			return;
		}

		var uv = this.getUV(event.x, event.y),
			delta = [uv[0] - this.dragUV[0], uv[1] - this.dragUV[1]],
			plane = this.getPlane();

		delta = this.clamp(delta);

		var localDelta = hemi.utils.uvToXYZ(delta, plane),
			xyzOrigin = hemi.utils.uvToXYZ([0, 0], plane),
			xyzDelta = new THREE.Vector3().sub(localDelta, xyzOrigin);

		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			var tran = this.transformObjs[ndx];
			hemi.utils.worldTranslate(xyzDelta, tran);
		}

		this.send(hemi.msg.drag, { drag: xyzDelta });
	};

	/**
	 * Mouse-up event listener, stops dragging.
	 *
	 * @param {o3d.Event} event message describing the mouse behavior
	 */
	Draggable.prototype.onMouseUp = function(event) {
		this.activeTransform = null;
		this.dragUV = null;
	};

	/**
	 * Pick event listener; checks in-scene intersections, and allows dragging.
	 *
	 * @param {THREE.Object3D} pickedMesh pick event information that contains information on the
	 *     shape and transformation picked.
	 * @param {Object} mouseEvent message describing mouse behavior
	 */
	Draggable.prototype.onPick = function(pickedMesh, mouseEvent) {
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			if (this.transformObjs[ndx].id == pickedMesh.id) {
				this.activeTransform = pickedMesh;
				this.dragUV = this.getUV(mouseEvent.x, mouseEvent.y);
				break;
			}
		}
	};

	/**
	 * Set the relative uv limits in which this Draggable can move.
	 *
	 * @param {number[2][2]} coords min and max uv points on the current plane
	 */
	Draggable.prototype.setLimits = function(coords) {
		this.umin = coords[0][0];
		this.umax = coords[1][0];
		this.vmin = coords[0][1];
		this.vmax = coords[1][1];
	};

	/**
	 * Set the 2d plane on which this Draggable is bound.
	 *
	 * @param {Vector3[3]} plane array of three XYZ coordinates defining a plane
	 */
	Draggable.prototype.setPlane = function(plane) {
		switch (plane) {
			case (hemi.Plane.XY):
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)];
				break;
			case (hemi.Plane.XZ):
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1)];
				break;
			case (hemi.Plane.YZ):
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0)];
				break;
			default:
				this.plane = plane;
		}
	};

	hemi.makeCitizen(Draggable, 'hemi.Draggable', {
		cleanup: ManipulatorBase.prototype._clean,
		toOctane: Draggable.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Turnable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Turnable allows a Transform to be turned about an axis by the user clicking and
	 * dragging with the mouse.
	 * 
	 * @param {hemi.Axis} opt_axis axis to rotate about
	 * @param {number[2]} opt_limits minimum and maximum angle limits (in radians)
	 * @param {number} opt_startAngle starting angle (in radians, default is 0)
	 */
	var Turnable = function(client, opt_axis, opt_limits, opt_startAngle) {	
		ManipulatorBase.call(this, client);
		this.angle = opt_startAngle == null ? 0 : opt_startAngle;
		this.axis = null;
		this.dragAngle = null;
		this.min = null;
		this.max = null;
		this.msgHandler = null;
		this.plane = null;
		
		if (opt_axis != null) {
			this.setAxis(opt_axis);
		}
		if (opt_limits != null) {
			this.setLimits(opt_limits);
		}
		
		this.enable();
	};

	Turnable.prototype = new ManipulatorBase();
	Turnable.constructor = Turnable;

	/*
	 * Octane properties for Turnable.
	 */
	Turnable.prototype._octane = function(){
		var valNames = ['min', 'max'],
			props = [];

		for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
			var name = valNames[ndx];

			props.push({
				name: name,
				val: this[name]
			});
		}

		props.push({
			name: 'setAxis',
			arg: [this.axis]
		});

		return props;
	};

	/**
	 * Remove any previously set limits from the Turnable.
	 */
	Turnable.prototype.clearLimits = function() {
		this.min = null;
		this.max = null;
	};

	/**
	 * Get the relative angle of a mouse click's interception with the active plane to the origin of
	 * that plane.
	 * 
	 * @param {number} x screen x-position of the mouse click event
	 * @param {number} y screen y-position of the mouse click event
	 * @return {number} relative angle of mouse click position on the Turnable's current active
	 *     plane
	 */
	Turnable.prototype.getAngle = function(x,y) {
		var plane;

		if (this.local) {
			var u = hemi.utils;
			plane = [u.pointAsWorld(this.activeTransform, this.plane[0]),
					 u.pointAsWorld(this.activeTransform, this.plane[1]),
					 u.pointAsWorld(this.activeTransform, this.plane[2])];
		} else {
			var translation = this.activeTransform.matrixWorld.getPosition();
			
			plane = [new THREE.Vector3().add(this.plane[0], translation),
					 new THREE.Vector3().add(this.plane[1], translation),
					 new THREE.Vector3().add(this.plane[2], translation)];
		}
		var ray = this.client.castRay(x, y),
		tuv = hemi.utils.intersect(ray, plane);
		return Math.atan2(tuv[2],tuv[1]);
	};

	/**
	 * On mouse move, if the shape has been clicked and is being dragged, calculate intersection
	 * points with the active plane and turn the Transform to match.
	 * 
	 * @param {Object} event message describing the mouse position, etc.
	 */
	Turnable.prototype.onMouseMove = function(event) {
		if (this.dragAngle === null) {
			return;
		}

		var delta = this.getAngle(event.x,event.y) - this.dragAngle,
			axis;

		if (this.max !== null && this.angle + delta >= this.max) {
			delta = this.max - this.angle;
		}
		if (this.min !== null && this.angle + delta <= this.min) {
			delta = this.min - this.angle;
		}

		this.angle += delta;

		if (!this.local) {
			this.dragAngle += delta;
		}

		switch(this.axis) {
			case hemi.Axis.X:
				axis = new THREE.Vector3(-1,0,0);
				break;
			case hemi.Axis.Y:
				axis = new THREE.Vector3(0,-1,0);
				break;
			case hemi.Axis.Z:
				axis = new THREE.Vector3(0,0,1);
				break;
		}

		for (var i = 0; i < this.transformObjs.length; i++) {
			var tran = this.transformObjs[i];
			
			if (this.local) {
				hemi.utils.axisRotate(axis, delta, tran);
			} else {
				hemi.utils.worldRotate(axis, delta, tran);
			}
		}
	};

	/**
	 * On mouse up, deactivate turning.
	 * 
	 * @param {Object} event message describing mouse position, etc.
	 */
	Turnable.prototype.onMouseUp = function(event) {
		this.dragAngle = null;
	};

	/**
	 * On a pick message, if it applies to this Turnable, set turning to true and calculate the
	 * relative angle.
	 * 
	 * @param {THREE.Object3D} pickedMesh information about the pick event
	 * @param {Object} event message describing mouse position, etc.
	 */
	Turnable.prototype.onPick = function(pickedMesh, event) {
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			if (this.transformObjs[ndx].id == pickedMesh.id) {
				this.activeTransform = pickedMesh;
				this.dragAngle = this.getAngle(event.x,event.y);
				break;
			}
		}
	};

	/**
	 * Set the axis to which this Turnable is bound.
	 * 
	 * @param {hemi.Axis} axis axis to rotate about - x, y, or z
	 */
	Turnable.prototype.setAxis = function(axis) {
		this.axis = axis;

		switch(axis) {
			case hemi.Axis.X:
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,1,0)];
				break;
			case hemi.Axis.Y:
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,1)];
				break;
			case hemi.Axis.Z:
				this.plane = [new THREE.Vector3(0,0,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)];
				break;
		}
	};

	/**
	 * Set the limits to which this Turnable can rotate.
	 * 
	 * @param {number[2]} limits minimum and maximum angle limits (in radians)
	 */
	Turnable.prototype.setLimits = function(limits) {
		if (limits[0] != null) {
			this.min = limits[0];
		} else {
			this.min = null;
		}
		
		if (limits[1] != null) {
			this.max = limits[1];
		} else {
			this.max = null;
		}
	};

	hemi.makeCitizen(Turnable, 'hemi.Turnable', {
		cleanup: ManipulatorBase.prototype._clean,
		toOctane: Turnable.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Scalable class
////////////////////////////////////////////////////////////////////////////////////////////////////

	var Scalable = function(client, axis) {
		ManipulatorBase.call(this, client);
		this.axis = null;
		this.dragAxis = null;
		this.dragOrigin = null;
		this.scale = null;

		this.setAxis(axis);
		this.enable();
	};

	Scalable.prototype = new ManipulatorBase();
	Scalable.constructor = Scalable;

	/*
	 * Array of Hemi Messages that Scalable is known to send.
	 * @type string[]
	 */
	Scalable.prototype._msgSent = [hemi.msg.scale];

	Scalable.prototype.getScale = function(x, y) {
		var offset = new THREE.Vector2(x - this.dragOrigin.x, y - this.dragOrigin.y),
		scale = Math.abs(this.dragAxis.dot(offset));
		return scale;
	};

	Scalable.prototype.onMouseMove = function(event) {
		if (this.dragAxis === null) {
			return;
		}

		var scale = this.getScale(event.x, event.y),
			f = scale/this.scale,
			axis = new THREE.Vector3(
				this.axis.x ? f : 1,
				this.axis.y ? f : 1,
				this.axis.z ? f : 1
			);

		for (var i = 0; i < this.transformObjs.length; i++) {
			var tran = this.transformObjs[i];

			if (this.local) {
				tran.scale.multiplySelf(axis);
				tran.updateMatrix();
			} else {
				hemi.utils.worldScale(axis, tran);
			}
		}

		this.scale = scale;

		this.send(hemi.msg.scale, { scale: scale });
	};

	Scalable.prototype.onMouseUp = function() {
		this.dragAxis = null;
		this.dragOrigin = null;
		this.scale = null;
	};

	Scalable.prototype.onPick = function(pickedMesh, event) {
		for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
			if (this.transformObjs[ndx].id == pickedMesh.id) {
				this.activeTransform = pickedMesh;
				var axis2d = this.xyPoint(this.axis);
				this.dragOrigin = this.xyPoint(new THREE.Vector3(0,0,0));
				this.dragAxis = new THREE.Vector2(axis2d.x - this.dragOrigin.x, axis2d.y - this.dragOrigin.y).normalize();
				this.scale = this.getScale(event.x, event.y);
				break;
			}
		}
	};

	Scalable.prototype.setAxis = function(axis) {
		switch(axis) {
			case hemi.Axis.X:
				this.axis = new THREE.Vector3(1,0,0);
				break;
			case hemi.Axis.Y:
				this.axis = new THREE.Vector3(0,1,0);
				break;
			case hemi.Axis.Z:
				this.axis = new THREE.Vector3(0,0,1);
				break;
			default:
				this.axis = new THREE.Vector3(0,0,0);
		}
	};

	Scalable.prototype.xyPoint = function(plane) {
		if (this.activeTransform === null) {
			return null;
		}
		
		var point;
		
		if (this.local) {
			point = hemi.utils.pointAsWorld(this.activeTransform, plane);
		} else {
			point = new THREE.Vector3().add(plane, this.activeTransform.position);
		}
		
		return hemi.utils.worldToScreenFloat(this.client, point);
	};

	hemi.makeCitizen(Scalable, 'hemi.Scalable', {
		cleanup: ManipulatorBase.prototype._clean,
		toOctane: []
	});

})();
