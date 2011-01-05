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
 * @fileoverview Motion describes classes for automatically translating
 * 		and rotating objects in the scene.
 */
o3djs.require('hemi.core');
o3djs.require('hemi.msg');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for moving and rotating objects in the scene.
	 */
	hemi.motion = hemi.motion || {};
	
	/**
	 * @class A Rotator makes automated rotation easier by allowing simple
	 * calls such as setVel to begin the automated spinning of a transform.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {o3d.Transform} opt_tran Optional transform that will be spinning
	 * @param {Object} opt_config Optional configuration for the Rotator
	 */
	hemi.motion.Rotator = function(opt_tran, opt_config) {
		hemi.world.Citizen.call(this);
		var cfg = opt_config || {};
		
		this.accel = cfg.accel || [0,0,0];
		this.angle = cfg.angle || [0,0,0];
		this.origin = cfg.origin || [0,0,0];
		this.vel = cfg.vel || [0,0,0];
		
		this.enabled = false;
		this.offset = hemi.core.math.mulScalarVector(-1,this.origin);
		this.time = 0;
		this.stopTime = 0;
		this.steadyRotate = false;
		this.mustComplete = false;
		this.startAngle = this.angle;
		this.stopAngle = this.angle;
		this.transformObjs = [];
		this.intFunc = function (val) {
			return val;
		};
		
		if (opt_tran != null) {
			this.addTransform(opt_tran);
			this.enable();
		}
	};
	
	hemi.motion.Rotator.prototype = {
		/**
		 * Add a transform to the list of transforms that will be spinning. A
		 * child transform is created to allow the Rotator to spin about an
		 * arbitray axis.
		 *
		 * @param {o3d.transform} transform the transform to add
		 */
		addTransform : function(transform) {
			var tranChildren = transform.children,
				shapes = transform.shapes,
				newTran = hemi.core.mainPack.createObject('Transform'),
				offsetTran = hemi.core.mainPack.createObject('Transform');
			
			for (var ndx = 0, len = tranChildren.length; ndx < len; ndx++) {
				tranChildren[ndx].parent = offsetTran;
			};
			
			newTran.parent = transform;
			offsetTran.parent = newTran;
		
			for(var i = shapes.length-1; i >= 0; i--) {
				var shape = shapes[i];
				offsetTran.addShape(shape);
				transform.removeShape(shape);
			}
			
			hemi.core.addToTransformTable(transform);
			hemi.world.tranReg.register(transform, this);
			this.transformObjs.push({
				tran: newTran,
				offset: offsetTran
			});
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
        citizenType: 'hemi.motion.Rotator',
		
		/**
		 * Send a cleanup Message and remove all references in the Rotator.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.intFunc = null;
		},
		
		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.accel = [0,0,0];
			this.angle = [0,0,0];
			this.offset = [0,0,0];
			this.origin = [0,0,0];
			this.vel = [0,0,0];
		},
		
		/**
		 * Clear the list of spinning transforms.
		 */
		clearTransforms: function() {
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				var transformObj = this.transformObjs[i],
					tParent = hemi.core.getTransformParent(transformObj.tran),
					tranChildren = transformObj.offset.children,
					shapes = transformObj.offset.shapes;
				
				hemi.core.removeFromTransformTable(transformObj.tran);
				
				for (var j = 0, jl = tranChildren.length; j < jl; j++) {
					tranChildren[j].parent = tParent;
				};
			
				for (var j = 0, jl = shapes.length; j < jl; j++) {
					var shape = shapes[j];
					tParent.addShape(shape);
					transformObj.offset.removeShape(shape);
				}
				
				hemi.world.tranReg.unregister(tParent, this);
				transformObj.tran.parent = null;
				transformObj.offset.parent = null;
				hemi.core.mainPack.removeObject(transformObj.tran);
				hemi.core.mainPack.removeObject(transformObj.offset);
				hemi.core.addToTransformTable(tParent);
			}
			
			this.transformObjs = [];
		},
		
		/**
		 * Disable mouse interaction for the Rotator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.view.removeRenderListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Rotator. 
		 */
		enable: function() {
			if (!this.enabled) {
				hemi.view.addRenderListener(this);
				this.enabled = true;
			}
		},
		
		/**
		 * Get the transforms that the Rotator currently contains.
		 * 
		 * @return {o3d.Transform[]} array of transforms
		 */
		getTransforms: function() {
			var trans = [];
			
			for (var i = 0, il = this.transformObjs.length; i < il; i++) {
				trans.push(this.transformObjs[i].tran);
			}
			
			return trans;
		},
		
		rotate : function(theta,time,opt_mustComplete,opt_intFunc) {
			if (this.mustComplete && this.steadyRotate) return false;
			this.time = 0;
			this.stopTime = time;
			this.steadyRotate = true;
			this.startAngle = this.angle;
			this.mustComplete = opt_mustComplete || false;
			if (opt_intFunc) {
				this.intFunc = opt_intFunc;
			}
			this.stopAngle = hemi.core.math.addVector(this.angle,theta);
			this.send(hemi.msg.start,{});
			return true;
		},
		
		/**
		 * Render event listener - Perform Newtonian calculations on this 
		 *		rotating object, starting with the angular velocity.
		 * @param {o3d.event} event Message describing the render event
		 */
		onRender : function(event) {
			if (this.transformObjs.length > 0) {
				var t = event.activeTime;
				if (this.steadyRotate) {
					this.time += t;
					if (this.time >= this.stopTime) {
						this.time = this.stopTime;
						this.steadyRotate = false;
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.intFunc(this.time/this.stopTime);
					this.angle = hemi.core.math.lerpVector(
						this.startAngle,
						this.stopAngle,
						t1);
				} else {
					this.vel = hemi.core.math.addVector(
							this.vel,
							hemi.core.math.mulScalarVector(t,this.accel));
					this.angle = hemi.core.math.addVector(
							this.angle,
							hemi.core.math.mulScalarVector(t,this.vel));
				}
				
				for (var i = 0, il = this.transformObjs.length; i < il; i++) {
					var transformObj = this.transformObjs[i];
					transformObj.offset.identity();
					transformObj.offset.translate(this.offset);
					transformObj.tran.identity();
					transformObj.tran.translate(this.origin);
					transformObj.tran.rotateZYX(this.angle);
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
		 * Set the angular acceleration.
		 * @param {number[]} alpha New angular acceleration
		 */
		setAccel : function(alpha) {
			this.accel = alpha;
		},
		
		/**
		 * Set the angle.
		 * @param {number[]} theta New angle
		 */
		setAngle : function(theta) {
			this.angle = theta;
		},
		
		/**
		 * Set the origin of the Rotator transform.
		 * @param {number[3]} origin New origin
		 */
		setOrigin : function(origin) {
			this.origin = origin;
			this.offset = hemi.core.math.mulScalarVector(-1, origin);
		},
		
		/**
		 * Set the angular velocity.
		 * @param {number[]} omega New angular velocity
		 */
		setVel : function(omega) {
			this.vel = omega;
		},
		
		/**
		 * Get the Octane structure for the Rotator.
	     *
	     * @return {Object} the Octane structure representing the Rotator
		 */
		toOctane : function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this),
				valNames = ['accel', 'angle', 'vel'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			octane.props.push({
				name: 'setOrigin',
				arg: this.origin
			});
			
			return octane;
		}
	};
	
    hemi.motion.Rotator.inheritsFrom(hemi.world.Citizen);
	hemi.motion.Rotator.prototype.msgSent =
		hemi.motion.Rotator.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	
	/**
	 * @class A Translator provides easy setting of linear velocity and
	 * acceleration of shapes and transforms in the 3d scene.
	 * @extends hemi.world.Citizen
	 * 
	 * @param {o3d.Transform} opt_tran Optional transform that will be moving
	 * @param {Object} opt_config Optional configuration for thie Translator
	 */
	hemi.motion.Translator = function(opt_tran, opt_config) {
		hemi.world.Citizen.call(this);
		var cfg = opt_config || {};
		
		this.pos = cfg.pos || [0,0,0];
		this.vel = cfg.vel || [0,0,0];
		this.accel = cfg.accel || [0,0,0];
		
		this.enabled = false;
		this.time = 0;
		this.stopTime = 0;
		this.mustComplete = false;
		this.steadyMove = false;
		this.startPos = this.pos;
		this.stopPos = this.pos;
		this.transforms = [];
		this.intFunc = function (val) {
			return val;
		};
		
		if (opt_tran != null) {
			this.addTransform(opt_tran);
			this.enable();
		}
	};
	
	hemi.motion.Translator.prototype = {
		/**
		 * Add a transform to the list of transforms that will be moving.
		 *
		 * @param {o3d.transform} transform the transform to add
		 */
		addTransform : function(transform) {
			var tranChildren = transform.children,
				shapes = transform.shapes,
				newTran = hemi.core.mainPack.createObject('Transform');
			
			for (var ndx = 0, len = tranChildren.length; ndx < len; ndx++) {
				tranChildren[ndx].parent = newTran;
			};
			
			newTran.parent = transform;
			
			for (var i = shapes.length-1; i >= 0; i--) {
				var shape = shapes[i];
				newTran.addShape(shape);
				transform.removeShape(shape);
			}
			
			hemi.core.addToTransformTable(transform);
			hemi.world.tranReg.register(transform, this);
			this.transforms.push(newTran);
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
        citizenType: 'hemi.motion.Translator',
		
		/**
		 * Send a cleanup Message and remove all references in the Translator.
		 */
		cleanup: function() {
			this.disable();
			this.clearTransforms();
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.intFunc = null;
		},
		
		/**
		 * Clear properties like acceleration, velocity, etc.
		 */
		clear: function() {
			this.pos = [0,0,0];
			this.vel = [0,0,0];
			this.accel = [0,0,0];
		},
		
		/**
		 * Clear the list of translating transforms.
		 */
		clearTransforms: function() {
			for (var i = 0, il = this.transforms.length; i < il; i++) {
				var transform = this.transforms[i],
					tParent = hemi.core.getTransformParent(transform),
					tranChildren = transform.children,
					shapes = transform.shapes;
				
				hemi.core.removeFromTransformTable(transform);
				
				for (var j = 0, jl = tranChildren.length; j < jl; j++) {
					tranChildren[j].parent = tParent;
				};
			
				for (var j = 0, jl = shapes.length; j < jl; j++) {
					var shape = shapes[j];
					tParent.addShape(shape);
					transform.removeShape(shape);
				}
				
				hemi.world.tranReg.unregister(tParent, this);
				transform.parent = null;
				hemi.core.mainPack.removeObject(transform);
				hemi.core.addToTransformTable(tParent);
			}
			
			this.transforms = [];
		},
		
		/**
		 * Disable mouse interaction for the Translator. 
		 */
		disable: function() {
			if (this.enabled) {
				hemi.view.removeRenderListener(this);
				this.enabled = false;
			}
		},
		
		/**
		 * Enable mouse interaction for the Translator. 
		 */
		enable: function() {
			if (!this.enabled) {
				hemi.view.addRenderListener(this);
				this.enabled = true;
			}
		},
		
		/**
		 * Get the transforms that the Translator currently contains.
		 * 
		 * @return {o3d.Transform[]} array of transforms
		 */
		getTransforms: function() {
			return this.transforms;
		},
		
		move : function(pos,time,opt_mustComplete,opt_intFunc) {
			if (this.mustComplete && this.steadyMove) return false;
			this.time = 0;
			this.stopTime = time;
			this.steadyMove = true;
			this.startPos = this.pos;
			this.mustComplete = opt_mustComplete || false;
			if (opt_intFunc) {
				this.intFunc = opt_intFunc;
			}
			this.stopPos = hemi.core.math.addVector(this.pos,pos);
			this.send(hemi.msg.start,{});
			return true;
		},
	
		/**
		 * Render event listener - calculate the position of this translator,
		 *		based on the acceleration, where velocity = t*acceleration, 
		 *		and position = t*velocity.
		 * @param {o3d.event} event Message describing render event
		 */
		onRender : function(event) {
			if (this.transforms.length > 0) {
				var t = event.activeTime;
				if (this.steadyMove) {
					this.time += t;
					if (this.time >= this.stopTime) {
						this.time = this.stopTime;
						this.steadyMove = false;
						this.send(hemi.msg.stop,{});
					}
					var t1 = this.intFunc(this.time/this.stopTime);
					this.pos = hemi.core.math.lerpVector(
						this.startPos,
						this.stopPos,
						t1);
				} else {
					this.vel = hemi.core.math.addVector(
							this.vel,
							hemi.core.math.mulScalarVector(t,this.accel));
					this.pos = hemi.core.math.addVector(
							this.pos,
							hemi.core.math.mulScalarVector(t,this.vel));
				}
				
				for (var i = 0, il = this.transforms.length; i < il; i++) {
					var transform = this.transforms[i];
					transform.identity();
					transform.translate(this.pos);
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
		 * Set the acceleration.
		 * @param {number[]} a New acceleration vector
		 */
		setAccel : function(a) {
			this.accel = a;
		},
		
		/**
		 * Set the position.
		 * @param {number[]} x New position, as xyz coordinate
		 */
		setPos : function(x) {
			this.pos = x;
		},
		
		/**
		 * Set the velocity.
		 * @param {number[]} v New velocity vector
		 */
		setVel : function(v) {
			this.vel = v;
		},
		
		/**
		 * Get the Octane structure for the Translator.
	     *
	     * @return {Object} the Octane structure representing the Translator
		 */
		toOctane : function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this),
				valNames = ['pos', 'vel', 'accel'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			}
			
			return octane;
		}
	};
	
    hemi.motion.Translator.inheritsFrom(hemi.world.Citizen);
	hemi.motion.Translator.prototype.msgSent =
		hemi.motion.Translator.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	
	return hemi;
})(hemi || {});