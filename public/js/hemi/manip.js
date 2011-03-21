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
 * @fileoverview Manips are objects that allow shapes in a 3d scene to
 *		be clicked on and dragged around. These shapes are constrained
 *		to a 2d plane, as defined by the programmer.
 */
o3djs.require('hemi.core');
o3djs.require('hemi.input');
o3djs.require('hemi.msg');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for defining draggable objects.
	 */
	hemi.manip = hemi.manip || {};

	hemi.manip.Plane = {
		XY : 'xy',
		XZ : 'xz',
		YZ : 'yz',
		
		get: function(val) {
			var plane = null;
			
			if (hemi.utils.compareArrays(val, [[0,0,0],[1,0,0],[0,1,0]])) {
				plane = this.XY;
			} else if (hemi.utils.compareArrays(val, [[0,0,0],[1,0,0],[0,0,1]])) {
				plane = this.XZ;
			} else if (hemi.utils.compareArrays(val, [[0,0,0],[0,0,1],[0,1,0]])) {
				plane = this.YZ;
			}
			
			return plane;
		}
	};
	
	hemi.manip.Axis = {
		X : 'x',
		Y : 'y',
		Z : 'z'
	};

	/**
	 * @class A Draggable allows a 3d object to be dragged around the scene
	 * with the mouse, constrained to a defined 2d plane.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {number[][]} opt_plane Array of 3 xyz points defining a plane
	 * @param {number[]} opt_limits An array containing 
	 *	   [min on u, max on u, min on v, max on v]
	 * @param {number[]} opt_startUV Draggable's starting uv coordinate, if
	 *		not [0,0]
	 */
	hemi.manip.Draggable = function(opt_plane, opt_limits, opt_startUV) {
		hemi.world.Citizen.call(this);
		
		this.activeTransform = null;
		this.dragUV = null;
		this.enabled = false;
		this.local = false;
		this.msgHandler = null;
		this.plane = null;
		this.transformObjs = [];
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

	hemi.manip.Draggable.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hemi.manip.Draggable',
		
		/**
		 * Send a cleanup Message and remove all references in the Draggable.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.msgHandler = null;
		},
		
		/**
		 * Get the Octane structure for the Draggable.
	     *
	     * @return {Object} the Octane structure representing the Draggable
		 */
		toOctane: function(){
			var octane = hemi.world.Citizen.prototype.toOctane.call(this),
				valNames = ['local', 'plane', 'umin', 'umax', 'vmin', 'vmax'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			return octane;
		},

		/**
		 * Add a transform to the list of draggable transforms.
		 *
		 * @param {o3d.transform} transform the transform to add
		 */
		addTransform: function(transform) {
			hemi.world.tranReg.register(transform, this);
			var obj = {};
			
			if (hemi.utils.isAnimated(transform)) {
				obj.transform = hemi.utils.fosterTransform(transform);
				obj.foster = true;
			} else {
				obj.transform = transform;
				obj.foster = false;
			}
			
			this.transformObjs.push(obj);
		},

		/**
		 * Add the given UV delta to the current UV coordinates and clamp the
		 * results.
		 *
		 * @param {number[]} delta the uv change to add before clamping
		 * @return {number[]} the actual change in uv after clamping
		 */
		clamp : function(delta) {
			var u = this.uv[0] + delta[0],
				v = this.uv[1] + delta[1];
			
			if (this.umin != null && u < this.umin) {
				u = this.umin;
			}
			if (this.umax != null && u > this.umax) {
				u = this.umax;
			}
			if (this.vmin != null && v < this.vmin) {
				v = this.vmin;
			}
			if (this.vmax != null && v > this.vmax) {
				v = this.vmax;
			}
			
			delta = [u - this.uv[0], v - this.uv[1]];
			this.uv = [u, v];
			
			return delta;
		},
		
		/**
		 * Remove any previously set limits from the draggable.
		 */
		clearLimits: function() {
			this.umin = null;
			this.umax = null;
			this.vmin = null;
			this.vmax = null;
		},
		
		/**
		 * Clear the list of draggable transforms.
		 */
		clearTransforms: function() {
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var obj = this.transformObjs[i],
					tran;
				
				if (obj.foster) {
					tran = hemi.utils.unfosterTransform(obj.transform);
				} else {
					tran = obj.transform;
				}
				
				hemi.world.tranReg.unregister(tran, this);
			}
			
			this.transformObjs = [];
		},

		/**
		 * Check if a given transform is contained within the children of the
		 *		transforms acted upon by this Draggable.
		 *
		 * @param {o3d.transform} transform Transform to check against
		 * @return {boolean} True if the transform is found
		 */
		containsTransform : function(transform) {
			for (var i = 0; i < this.transformObjs.length; i++) {
				var children = this.transformObjs[i].transform.getTransformsInTree();
				for (var j = 0; j < children.length; j++) {
					if (transform.clientId === children[j].clientId) {
						return true;
					}
				}
			}
			return false;
		},
		
		/**
		 * Disable mouse interaction for the Draggable. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Draggable. 
		 */
		enable: function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		
		/**
		 * Get the two dimensional plane that the Draggable will translate its
		 * active transform along.
		 * 
		 * @return {number[][]} the current drag plane defined as 3 XYZ points
		 */
		getPlane: function() {
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
				var hMath = hemi.core.math,
					wM = this.activeTransform.getUpdatedWorldMatrix(),
					translation = wM[3].slice(0,3);
				
				plane = [hMath.addVector(this.plane[0], translation),
						 hMath.addVector(this.plane[1], translation),
						 hMath.addVector(this.plane[2], translation)];
			}
			
			return plane;
		},
		
		/**
		 * Get the transforms that the Draggable currently contains.
		 * 
		 * @return {o3d.Transform[]} array of transforms
		 */
		getTransforms: function() {
			var trans = [];
			
			for (var i = 0, len = this.transformObjs.length; i < len; i++) {
				trans.push(this.transformObjs[i].transform);
			}
			
			return trans;
		},
		
		/**
		 * Convert the given screen coordinates into UV coordinates on the
		 * current dragging plane.
		 * 
		 * @param {number} x x screen coordinate
		 * @param {number} y y screen coordinate
		 * @return {number[]} equivalent UV coordinates
		 */
		getUV: function(x,y) {
			var ray = hemi.core.picking.clientPositionToWorldRay(
					x,
					y,
					hemi.view.viewInfo.drawContext,
					hemi.core.client.width,
					hemi.core.client.height),
				plane = this.getPlane(),
				tuv = hemi.utils.intersect(ray, plane);
			
			return [tuv[1], tuv[2]];
		},

		/**
		 * Mouse movement event listener, calculates mouse point intersection 
		 * with this Draggable's plane, and then translates the dragging object 
		 * accordingly.
		 *
		 * @param {o3d.inputevent} event Message describing how the mouse has moved
		 */
		onMouseMove : function(event) {
			if (this.dragUV === null) {
				return;
			}
			
			var uv = this.getUV(event.x, event.y),
				delta = [uv[0] - this.dragUV[0], uv[1] - this.dragUV[1]],
				plane = this.getPlane();
			
			delta = this.clamp(delta);
			
			var localDelta = hemi.utils.uvToXYZ(delta, plane),
				xyzOrigin = hemi.utils.uvToXYZ([0, 0], plane),
				xyzDelta = hemi.core.math.subVector(localDelta, xyzOrigin);
			
			for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
				var tran = this.transformObjs[ndx].transform;
				hemi.utils.worldTranslate(xyzDelta, tran);
			}
			
			this.send(hemi.msg.drag, { drag: xyzDelta });
		},

		/**
		 * Mouse-up event listener, stops dragging.
		 *
		 * @param {o3d.mouseevent} event Message describing the mouse behavior
		 */
		onMouseUp : function(event) {
			this.activeTransform = null;
			this.dragUV = null;
		},

		/**
		 * Pick event listener; checks in-scene intersections, and allows 
		 * dragging.
		 *
		 * @param {o3djs.picking.PickInfo} pickInfo pick event information that
		 *		contains information on the shape and transformation picked.
		 * @param {o3d.mouseevent} mouseEvent Message describing mouse behavior
		 */
		onPick : function(pickInfo, mouseEvent) {
			var pickTran = pickInfo.shapeInfo.parent.transform;
			
			for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
				if (checkTransform(this.transformObjs[ndx].transform, pickTran)) {
					this.activeTransform = pickTran;
					this.dragUV = this.getUV(mouseEvent.x, mouseEvent.y);
					break;
				}
			}
		},
		
		/**
		 * Receive the given transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the transform
		 */
		receiveTransform: function(transform) {
			this.addTransform(transform);
		},

		/**
		 * Set the relative uv limits in which this Draggable can move.
		 *
		 * @param {number[][]} coords Min uv point, and max uv point of bounding box
		 */
		setLimits : function(coords) {
			this.umin = coords[0][0];
			this.umax = coords[1][0];
			this.vmin = coords[0][1];
			this.vmax = coords[1][1];
		},

		/**
		 * Set the 2d plane on which this Draggable is bound.
		 *
		 * @param {number[][]} plane Array of three xyz coordinates defining a plane
		 */
		setPlane : function(plane) {
			switch (plane) {
				case (hemi.manip.Plane.XY):
					this.plane = [[0,0,0],[1,0,0],[0,1,0]];
					break;
				case (hemi.manip.Plane.XZ):
					this.plane = [[0,0,0],[1,0,0],[0,0,1]];
					break;
				case (hemi.manip.Plane.YZ):
					this.plane = [[0,0,0],[0,0,1],[0,1,0]];
					break;
				default:
					this.plane = plane;
			}
		},
		
		/**
		 * Set the Draggable to operate in the local space of the transform it
		 * is translating.
		 */
		setToLocal: function() {
			this.local = true;
		},
		
		/**
		 * Set the Draggable to operate in world space.
		 */
		setToWorld: function() {
			this.local = false;
		}
	};

	/**
	 * @class A Turnable allows a transform to be turned about an axis by the user
	 *		clicking and dragging with the mouse.
	 * @extends hemi.world.Citizen
	 * @param {hemi.manip.Axis} opt_axis Axis to rotate about - x,y, or z
	 * @param {number[]} opt_limits [min angle, max angle] in radians
	 * @param {number[]} opt_startAngle Starting angle in radians (default is 0)
	 */
	hemi.manip.Turnable = function(opt_axis, opt_limits, opt_startAngle) {
		hemi.world.Citizen.call(this);
		
		this.angle = opt_startAngle == null ? 0 : opt_startAngle;
		this.axis = null;
		this.activeTransform = null;
		this.dragAngle = null;
		this.enabled = false;
		this.local = false;
		this.min = null;
		this.max = null;
		this.msgHandler = null;
		this.plane = null;
		this.transformObjs = [];
		
		if (opt_axis != null) {
			this.setAxis(opt_axis);
		}
		if (opt_limits != null) {
			this.setLimits(opt_limits);
		}
		
		this.enable();
	};
	
	hemi.manip.Turnable.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hemi.manip.Turnable',
		
		/**
		 * Send a cleanup Message and remove all references in the Turnable.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.msgHandler = null;
		},
		
		/**
		 * Get the Octane structure for the Turnable.
	     *
	     * @return {Object} the Octane structure representing the Turnable
		 */
		toOctane: function(){
			var octane = hemi.world.Citizen.prototype.toOctane.call(this),
				valNames = ['min', 'max'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			octane.props.push({
				name: 'setAxis',
				arg: [this.axis]
			});
			
			return octane;
		},
		
		/**
		 * Add a transform to this Turnable object.
		 * @param {o3d.transform} transform The transform that will also
		 *		turn about its origin when clicked and dragged
		 */
		addTransform : function(transform) {
			hemi.world.tranReg.register(transform, this);
			var wp = transform.getUpdatedWorldMatrix()[3].slice(0,3),
				obj = {};
			
			if (hemi.utils.isAnimated(transform)) {
				obj.transform = hemi.utils.fosterTransform(transform);
				obj.foster = true;
			} else {
				obj.transform = transform;
				obj.foster = false;
			}
			
			this.activeTransform = transform;
			this.transformObjs.push(obj);
		},
		
		/**
		 * Remove any previously set limits from the Turnable.
		 */
		clearLimits: function() {
			this.min = null;
			this.max = null;
		},
		
		/**
		 * Clear the list of Turnable transforms.
		 */
		clearTransforms: function() {
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var obj = this.transformObjs[i],
					tran;
				
				if (obj.foster) {
					tran = hemi.utils.unfosterTransform(obj.transform);
				} else {
					tran = obj.transform;
				}
				
				hemi.world.tranReg.unregister(tran, this);
			}
			
			this.activeTransform = null;
			this.transformObjs = [];
		},
		
		/**
		 * Check if this turnable object contains a transform within its children, and sets the
		 *		plane offset to match that transform if found.
		 * @param {o3d.transform} transform Transform to match against
		 */
		containsTransform : function(transform) {
			for (var i = 0; i < this.transformObjs.length; i++) {
				var family = this.transformObjs[i].transform.getTransformsInTree();
				for (var j = 0; j < family.length; j++) {
					if (family[j].clientId === transform.clientId) {
						return true;
					}
				}
			}
			return false;
		},
		
		/**
		 * Disable mouse interaction for the Turnable. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Turnable. 
		 */
		enable: function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		
		/**
		 * Get the relative angle of a mouse click's interception with the active plane
		 * 		to the origin of that plane.
		 * @param {float} x Screen x-position of the mouse click event
		 * @param {float} y Screen y-position of the mouse click event
		 * @return {float} Relative angle of mouse click position on this Turnable's current
		 *		active plane
		 */
		getAngle : function(x,y) {
			if (this.activeTransform === null) {
				return null;
			}
			
			var ray = hemi.core.picking.clientPositionToWorldRay(
					x,
					y,
					hemi.view.viewInfo.drawContext,
					hemi.core.client.width,
					hemi.core.client.height),
				plane;
			
			if (this.local) {
				var u = hemi.utils;
				plane = [u.pointAsWorld(this.activeTransform,this.plane[0]),
						 u.pointAsWorld(this.activeTransform,this.plane[1]),
						 u.pointAsWorld(this.activeTransform,this.plane[2])];
			} else {
				var hMath = hemi.core.math,
					wM = this.activeTransform.getUpdatedWorldMatrix(),
					translation = wM[3].slice(0,3);
				
				plane = [hMath.addVector(this.plane[0], translation),
						 hMath.addVector(this.plane[1], translation),
						 hMath.addVector(this.plane[2], translation)];
			}
			
			var tuv = hemi.utils.intersect(ray, plane);
			return Math.atan2(tuv[2],tuv[1]);
		},
		
		/**
		 * Get the transforms that the Turnable currently contains.
		 * 
		 * @return {o3d.Transform[]} array of transforms
		 */
		getTransforms: function() {
			var trans = [];		
			for (var i = 0, len = this.transformObjs.length; i < len; i++) {
				trans.push(this.transformObjs[i].transform);
			}
			return trans;
		},
		
		/**
		 * On mouse move, if the shape has been clicked and is being dragged, 
		 *		calculate intersection points with the active plane and turn
		 *		the transform to match.
		 * @param {o3d.mouseEvent} event Message describing the mouse position, etc.
		 */
		onMouseMove : function(event) {
			if (this.dragAngle === null) {
				return;
			}
			
			var delta = this.getAngle(event.x,event.y) - this.dragAngle,
				axis;
			
			if (this.max != null && this.angle + delta >= this.max) {
				delta = this.max - this.angle;
			}
			if (this.min != null && this.angle + delta <= this.min) {
				delta = this.min - this.angle;
			}
			
			this.angle += delta;
			
			if (!this.local) {
				this.dragAngle += delta;
			}
			
			switch(this.axis) {
				case hemi.manip.Axis.X:
					axis = [-1,0,0];
					break;
				case hemi.manip.Axis.Y:
					axis = [0,-1,0];
					break;
				case hemi.manip.Axis.Z:
					axis = [0,0,1];
					break;
			}
			
			for (var i = 0; i < this.transformObjs.length; i++) {
				var tran = this.transformObjs[i].transform;
				
				if (this.local) {
					tran.axisRotate(axis, delta);
				} else {
					hemi.utils.worldRotate(axis, delta, tran);
				}
			}
		},
		
		/**
		 * On mouse up, deactivate turning.
		 * @param {o3d.mouseEvent} event Message describing mouse position, etc.
		 */
		onMouseUp : function(event) {
			this.dragAngle = null;
		},
		
		/**
		 * On a pick message, if it applies to this Turnable, set turning to true and 
		 *	calculate the relative angle.
		 * @param {o3d.pickInfo} pickInfo Information about the pick event
		 * @param {o3d.mouseEvent} event Message describing mouse poistion, etc.
		 */
		onPick : function(pickInfo,event) {
			if (this.containsTransform(pickInfo.shapeInfo.parent.transform)) {
				this.activeTransform = pickInfo.shapeInfo.parent.transform;
				this.dragAngle = this.getAngle(event.x,event.y);
			}
		},
		
		/**
		 * Receive the given transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the transform
		 */
		receiveTransform: function(transform) {
			this.addTransform(transform);
		},
		
		/**
		 * Set the axis to which this Turnable is bound.
		 * 
		 * @param {hemi.manip.Axis} axis Axis to rotate about - x,y, or z
		 */
		setAxis: function(axis) {
			this.axis = axis;
			
			switch(axis) {
				case hemi.manip.Axis.X:
					this.plane = [[0,0,0],[0,0,1],[0,1,0]];
					break;
				case hemi.manip.Axis.Y:
					this.plane = [[0,0,0],[1,0,0],[0,0,1]];
					break;
				case hemi.manip.Axis.Z:
					this.plane = [[0,0,0],[1,0,0],[0,1,0]];
					break;
			}
		},
		
		/**
		 * Set the limits to which this Turnable can rotate.
		 * @param {float[]} limits [min,max] Angle limits in radians
		 */
		setLimits : function(limits) {
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
		},
		
		/**
		 * Set the Turnable to operate in the local space of the transform it is
		 * rotating.
		 */
		setToLocal: function() {
			this.local = true;
		},
		
		/**
		 * Set the Turnable to operate in world space.
		 */
		setToWorld: function() {
			this.local = false;
		}
		
	};
	
	hemi.manip.Scalable = function(axis) {
		hemi.world.Citizen.call(this);
		this.activeTransform = null;
		this.axis = null;
		this.dragAxis = null;
		this.dragOrigin = null;
		this.local = false;
		this.scale = null;
		this.transformObjs = [];
		
		this.setAxis(axis);
		this.enable();
	};
	
	hemi.manip.Scalable.prototype = {
		addTransform : function(transform) {
			hemi.world.tranReg.register(transform, this);
			var obj = {};
			
			if (hemi.utils.isAnimated(transform)) {
				obj.transform = hemi.utils.fosterTransform(transform);
				obj.foster = true;
			} else {
				obj.transform = transform;
				obj.foster = false;
			}
			
			this.transformObjs.push(obj);
		},
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.msgHandler = null;
		},
		/**
		 * Clear the list of scalable transforms.
		 */
		clearTransforms: function() {
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var obj = this.transformObjs[i],
					tran;
				
				if (obj.foster) {
					tran = hemi.utils.unfosterTransform(obj.transform);
				} else {
					tran = obj.transform;
				}
				
				hemi.world.tranReg.unregister(tran, this);
			}
			
			this.transformObjs = [];
		},
		containsTransform : function(transform) {
			for (var i = 0; i < this.transformObjs.length; i++) {
				var children = this.transformObjs[i].transform.getTransformsInTree();
				for (var j = 0; j < children.length; j++) {
					if (transform.clientId === children[j].clientId) {
						return true;
					}
				}
			}
			return false;
		},
		disable: function() {
			if (this.enabled) {
				hemi.world.unsubscribe(this.msgHandler, hemi.msg.pick);
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				this.enabled = false;
			}
		},
		enable: function() {
			if (!this.enabled) {
				this.msgHandler = hemi.world.subscribe(
					hemi.msg.pick,
					this,
					'onPick',
					[hemi.dispatch.MSG_ARG + 'data.pickInfo', 
					 hemi.dispatch.MSG_ARG + 'data.mouseEvent']);
				hemi.input.addMouseMoveListener(this);
				hemi.input.addMouseUpListener(this);
				this.enabled = true;
			}
		},
		getScale: function(x, y) {
			var hMath = hemi.core.math,
				offset = [x - this.dragOrigin[0], y - this.dragOrigin[1]],
				scale = Math.abs(hemi.core.math.dot(this.dragAxis, offset));
			return scale;
		},
		onMouseMove : function(event) {
			if (this.dragAxis === null) {
				return;
			}
			
			var scale = this.getScale(event.x, event.y),
				f = scale/this.scale,
				axis = [
					this.axis[0] ? f : 1,
					this.axis[1] ? f : 1,
					this.axis[2] ? f : 1
				];
			
			for (i=0; i<this.transformObjs.length; i++) {
				var tran = this.transformObjs[i].transform;
				
				if (this.local) {
					tran.scale(axis);
				} else {
					hemi.utils.worldScale(axis, tran);
				}
			}
			
			this.scale = scale;
		},
		onMouseUp : function() {
			this.dragAxis = null;
			this.dragOrigin = null;
			this.scale = null;
		},
		onPick : function(pickInfo,event) {
			if (this.containsTransform(pickInfo.shapeInfo.parent.transform)) {
				this.activeTransform = pickInfo.shapeInfo.parent.transform;
				var axis2d = this.xyPoint(this.axis);
				this.dragOrigin = this.xyPoint([0,0,0]);
				this.dragAxis = hemi.core.math.normalize(
					[axis2d[0]-this.dragOrigin[0], axis2d[1]-this.dragOrigin[1]]);
				this.scale = this.getScale(event.x, event.y);
			}
		},
		setAxis : function(axis) {
			switch(axis) {
				case hemi.manip.Axis.X:
					this.axis = [1,0,0];
					break;
				case hemi.manip.Axis.Y:
					this.axis = [0,1,0];
					break;
				case hemi.manip.Axis.Z:
					this.axis = [0,0,1];
					break;
				default:
					this.axis = [0,0,0];
			}
		},
		/**
		 * Set the Scalable to operate in the local space of the transform it is
		 * scaling.
		 */
		setToLocal: function() {
			this.local = true;
		},
		/**
		 * Set the Scalable to operate in world space.
		 */
		setToWorld: function() {
			this.local = false;
		},
		xyPoint : function(p) {
			if (this.activeTransform === null) {
				return null;
			}
			
			var u = hemi.utils,
				point;
			
			if (this.local) {
				point = u.pointAsWorld(this.activeTransform, p);
			} else {
				var wM = this.activeTransform.getUpdatedWorldMatrix(),
					translation = wM[3].slice(0,3);
				
				point = hemi.core.math.addVector(p, translation);
			}
			
			return u.worldToScreenFloat(point);
		}
	};
	
	hemi.manip.Draggable.inheritsFrom(hemi.world.Citizen);
	hemi.manip.Draggable.prototype.msgSent =
		hemi.manip.Draggable.prototype.msgSent.concat([hemi.msg.drag]);
	
	hemi.manip.Turnable.inheritsFrom(hemi.world.Citizen);
	
	hemi.manip.Scalable.inheritsFrom(hemi.world.Citizen);
	
	/*
	 * Check if the pickTransform is a child, grandchild, etc. of the transform.
	 * 
	 * @param {o3d.Transform} transform parent transform to check
	 * @param {o3d.Transform} pickTransform child transform to search for
	 * @return {boolean} true if the pickTransform is contained within the
	 *     transform
	 */
	function checkTransform(transform, pickTransform) {
		var found = (transform.clientId === pickTransform.clientId);

		if (!found) {
			var children = transform.children;
			
			for (var ndx = 0, len = children.length; ndx < len && !found; ndx++) {
				found = found || checkTransform(children[ndx], pickTransform);
			}
		}
		
		return found;
	}
	
	return hemi;
})(hemi || {});