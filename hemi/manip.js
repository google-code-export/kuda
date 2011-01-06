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
	}

	/**
	 * @class A Draggable allows a 3d object to be dragged around the scene
	 * with the mouse, constrained to a defined 2d plane.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {number[][]} opt_plane Array of 3 xyz points defining a plane
	 * @param {number[]} opt_limits An array containing 
	 *	   [min on x, max on x, min on y, max on y]
	 * @param {number[]} opt_startUV Draggable's starting uv coordinate, if
	 *		not [0,0]
	 */
	hemi.manip.Draggable = function(opt_plane, opt_limits, opt_startUV) {
		hemi.world.Citizen.call(this);
		
		this.transformObjs = [];
		this.dragging = false;
		this.enabled = false;
		this.lastPos = null;
		this.offset = [0,0];
		this.msgHandler = null;
		this.activePlane = [];
		this.plane = null;
		this.umin = null;
		this.umax = null;
		this.vmin = null;
		this.vmax = null;
		this.uv = opt_startUV == null ? [0,0] : opt_startUV;
		
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
				valNames = ['plane', 'umin', 'umax', 'vmin', 'vmax'];
			
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
		 * @param {boolean} opt_needsChild true if this is an animation-locked 
		 *		transform, which means a new child transform needs to be created 
		 *		and shapes moved down into that transform
		 */
		addTransform: function(transform,
							   opt_needsChild) {
			var trans;		  
			if (opt_needsChild) {
				//TODO: Come up with a way to track these so we can clean them
				// up properly from the Pack.
				var trans = hemi.core.mainPack.createObject('Transform');
				
				trans.parent = transform;
				trans.name = transform.name;   
				for (var i = transform.shapes.length-1; i >= 0; i--) {
					var shape = transform.shapes[i];
					trans.addShape(shape);
					transform.removeShape(shape);
				}
				for (var i = 0; i < transform.children.length; i++) {
					transform.children[i].parent = trans;
				}
			} else {
				trans = transform;
			}
			
			var offsetVector = transform.worldMatrix[3].slice(0,3);
			var dPlane = [];
			for(var i = 0; i < this.plane.length; i++) {
				dPlane[i] = hemi.core.math.addVector(this.plane[i], offsetVector);
			}

			var transObj = {
				transform: trans,
				plane: dPlane
			};

			hemi.world.tranReg.register(trans, this);
			this.transformObjs.push(transObj);		
		},

		/**
		 * Simple 2d clamp function.
		 *
		 * @param {number[]} uv 2d coordinate to clamp
		 * @return {number[]} 2d coordinate clamped to this Draggable's limits
		 */
		clamp : function(uv) {
			var u = uv[0];
			var v = uv[1];

			if (this.umin != null) {
				u = (u < this.umin)? this.umin : u;
			}
			if (this.umax != null) {
				u = (u > this.umax)? this.umax : u;
			}
			if (this.vmin != null) {
				v = (v < this.vmin)? this.vmin : v;
			}
			if (this.vmax != null) {
				v = (v > this.vmax)? this.vmax : v;
			}

			return [u,v];
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
				var transform = this.transformObjs[i].transform;
				hemi.world.tranReg.unregister(transform, this);
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
					if (transform.clientId == children[j].clientId) {
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
		 * Mouse movement event listener, calculates mouse point intersection 
		 * with this Draggable's plane, and then translates the dragging object 
		 * accordingly.
		 *
		 * @param {o3d.inputevent} event Message describing how the mouse has moved
		 */
		onMouseMove : function(event) {
			if (!this.dragging) return;
			
			var worldRay = hemi.core.picking.clientPositionToWorldRay(
				event.x, 
				event.y, 
				hemi.view.viewInfo.drawContext, 
				hemi.core.client.width, 
				hemi.core.client.height);

			var ip = hemi.utils.intersect(worldRay, this.activePlane);
			this.uv = this.clamp([ip[1] + this.offset[0],
								 ip[2] + this.offset[1]]);
									 
			var uf = hemi.core.math.mulScalarVector(
				this.uv[0],
				hemi.core.math.addVector(
					this.activePlane[1],
					hemi.core.math.mulScalarVector(
						-1,
						this.activePlane[0])));
							
			var vf = hemi.core.math.mulScalarVector(
				this.uv[1],
				hemi.core.math.addVector(
					this.activePlane[2],
					hemi.core.math.mulScalarVector(
						-1,
						this.activePlane[0])));
							
			var pos = hemi.core.math.addVector(
				this.activePlane[0],
				hemi.core.math.addVector(uf,vf));
	
	
			if (this.lastPos) {
				var delta = hemi.core.math.addVector(
					pos,
					hemi.core.math.mulScalarVector(-1, this.lastPos));
				
				for (var ndx = 0, len = this.transformObjs.length; ndx < len; ndx++) {
					var transObj = this.transformObjs[ndx];
					hemi.utils.worldTranslate(delta, transObj.transform);
				}
				
				this.send(hemi.msg.drag,
					{
						drag: delta
					});
			}
			this.lastPos = pos;
		},

		/**
		 * Mouse-up event listener, stops dragging.
		 *
		 * @param {o3d.mouseevent} event Message describing the mouse behavior
		 */
		onMouseUp : function(event) {
			this.dragging = false;
			this.lastPos = null;
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
			var found = false;
			for (var ndx = 0, len = this.transformObjs.length; ndx < len && !found; ndx++) {
				if (checkTransform(this.transformObjs[ndx].transform, 
					pickInfo.shapeInfo.parent.transform)) {
						found = true;
						this.activePlane = this.transformObjs[ndx].plane;
					}
			}

			if (found) {
				this.dragging = true;
				var worldRay = hemi.core.picking.clientPositionToWorldRay(
					mouseEvent.x, 
					mouseEvent.y, 
					hemi.view.viewInfo.drawContext, 
					hemi.core.client.width, 
					hemi.core.client.height);
					
				var ip = hemi.utils.intersect(worldRay,this.activePlane);		
				this.offset = [this.uv[0] - ip[1], this.uv[1] - ip[2]];
				this.onMouseMove(mouseEvent);
			}

			function checkTransform(transform, pickTransform) {
				var found = (transform.clientId == pickTransform.clientId);

				if (!found) {
					var children = transform.children;
					
					for (var ndx = 0, len = children.length; ndx < len && !found; ndx++) {
						found = found || checkTransform(children[ndx], pickTransform);
					}
				}
				
				return found;
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
		 * Set the uv limits in which this Draggable can move.
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
		}
	};

	/**
	 * @class A Turnable allows a transform to be turned about an axis by the user
	 *		clicking and dragging with the mouse.
	 * @extends hemi.world.Citizen
	 * @param {hemi.manip.Axis} opt_axis Axis to rotate about - x,y, or z
	 * @param {number[]} opt_limits [min angle, max angle] in degrees
	 * @param {number[]} opt_startAngle Starting angle if not 0
	 */
	hemi.manip.Turnable = function(opt_axis, opt_limits, opt_startAngle) {
		hemi.world.Citizen.call(this);
		
		this.axis = null;
		this.enabled = false;
		this.min = null;
		this.max = null;
		this.msgHandler = null;
		this.plane = null;
		this.transformObjs = [];
		this.turning = false;
		this.offset = null;
		this.angle = 0;
		this.realAngle = opt_startAngle == null ? 0 : opt_startAngle;
		
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
			var wp = transform.worldMatrix[3].slice(0,3);
			var planeOffset;
			switch(this.axis) {
				case hemi.manip.Axis.X:
					planeOffset = [wp[0],0,0];
					break;
				case hemi.manip.Axis.Y:
					planeOffset = [0,wp[1],0];
					break;
				case hemi.manip.Axis.Z:
					planeOffset = [0,0,wp[2]];
					break;
			}
			hemi.world.tranReg.register(transform, this);
			this.currentTransform = transform;
			this.transformObjs.push({
				transform : transform,
				offset : planeOffset});
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
				var transform = this.transformObjs[i].transform;
				hemi.world.tranReg.unregister(transform, this);
			}
			
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
					if (family[j].clientId == transform.clientId) {
						this.offset = this.transformObjs[i].offset;
						this.currentTransform = this.transformObjs[i].transform;
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
			var u = hemi.utils;
			var plane = [
				hemi.core.math.addVector(u.pointAsWorld(this.currentTransform,this.plane[0]),this.offset),
				hemi.core.math.addVector(u.pointAsWorld(this.currentTransform,this.plane[1]),this.offset),
				hemi.core.math.addVector(u.pointAsWorld(this.currentTransform,this.plane[2]),this.offset)];
			var ray = hemi.core.picking.clientPositionToWorldRay(
					x, 
					y, 
					hemi.view.viewInfo.drawContext, 
					hemi.core.client.width, 
					hemi.core.client.height);
			var tuv = hemi.utils.intersect(ray,plane);
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
			if (!this.turning) return;
			var delta = this.getAngle(event.x,event.y) - this.angle;
			var savedRA = this.realAngle;
			this.realAngle += delta;
			if (this.max) {
				if (this.realAngle >= this.max) {
					this.realAngle = this.max;
					delta = this.max - savedRA;
				}
			}
			if (this.min) {
				if (this.realAngle <= this.min) {
					this.realAngle = this.min;
					delta = this.min - savedRA;
				}
			}	
			for (var i = 0; i < this.transformObjs.length; i++) {
				var t = this.transformObjs[i].transform;
				switch(this.axis) {
					case hemi.manip.Axis.X:
						t.rotateX(-delta);
						break;
					case hemi.manip.Axis.Y:
						t.rotateY(-delta);
						break;
					case hemi.manip.Axis.Z:
						t.rotateZ(delta);
						break;
				}
			}
		},
		
		/**
		 * On mouse up, deactivate turning.
		 * @param {o3d.mouseEvent} event Message describing mouse position, etc.
		 */
		onMouseUp : function(event) {
			this.turning = false;
		},
		
		/**
		 * On a pick message, if it applies to this Turnable, set turning to true and 
		 *	calculate the relative angle.
		 * @param {o3d.pickInfo} pickInfo Information about the pick event
		 * @param {o3d.mouseEvent} event Message describing mouse poistion, etc.
		 */
		onPick : function(pickInfo,event) {
			if (this.containsTransform(pickInfo.shapeInfo.parent.transform)) {
				this.turning = true;
				this.angle = this.getAngle(event.x,event.y);
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
		 * @param {float[]} limits [min,max] Angle limits, in degrees
		 */
		setLimits : function(limits) {
			if (limits[0] != null) {
				this.min = hemi.core.math.degToRad(limits[0]);
			} else {
				this.min = null;
			}
			
			if (limits[1] != null) {
				this.max = hemi.core.math.degToRad(limits[1]);
			} else {
				this.max = null;
			}
		}
		
	};
	
	hemi.manip.Draggable.inheritsFrom(hemi.world.Citizen);
	hemi.manip.Draggable.prototype.msgSent =
		hemi.manip.Draggable.prototype.msgSent.concat([hemi.msg.drag]);
	
	hemi.manip.Turnable.inheritsFrom(hemi.world.Citizen);
	
	return hemi;
})(hemi || {});