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

o3djs.require('hemi.msg');
o3djs.require('hemi.view');
o3djs.require('hemi.world');

var hemi = (function(hemi) {
	
	/**
	 * @namespace A module for animating {@link hemi.model.Model}s.
	 */
	hemi.animation = hemi.animation || {};

	/**
	 * @class A Loop contains a start time and stop time as well as the number of
	 * iterations to perform for the Loop.
	 * @memberOf hemi.animation
	 */
	hemi.animation.Loop = function() {
		/**
		 * The name of the Loop.
		 * @type string
		 * @default ''
		 */
		this.name = '';
		
		/**
		 * The time in an Animation that the Loop begins at.
		 * @type number
		 * @default 0
		 */
		this.startTime = 0;
		
		/**
		 * The time in an Animation that the Loop ends at.
		 * @type number
		 * @default 0
		 */
		this.stopTime = 0;
		
		/**
		 * The number of times the Loop repeats.
		 * @type number
		 * @default -1 (infinite)
		 */
		this.iterations = -1;
		
		this.current = 0;
	};
	
	hemi.animation.Loop.prototype = {
		/**
		 * Get the Octane structure for the Loop.
	     *
	     * @return {Object} the Octane structure representing the Loop
		 */
		toOctane: function(){
			var octane = {
				type: 'hemi.animation.Loop',
				props: [{
					name: 'startTime',
					val: this.startTime
				},{
					name: 'stopTime',
					val: this.stopTime
				},{
					name: 'iterations',
					val: this.iterations
				}, {
					name: 'name',
					val: this.name
				}]
			};
			
			return octane;
		}
	};
	
	/**
	 * @class An Animation contains a target to animate, a begin time, an end
	 * time, and {@link hemi.animation.Loop}s for repeating sections of the
	 * Animation.
	 * @extends hemi.world.Citizen
	 */
	hemi.animation.Animation = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * The target of the Animation. It should have an 'isAnimating'
		 * property.
		 * @type Object
		 */
		this.target = null;
		
		/**
		 * The time the Animation begins at.
		 * @type number
		 * @default 0
		 */
		this.beginTime = 0;
		
		/**
		 * The time the Animation ends at.
		 * @type number
		 * @default 0
		 */
		this.endTime = 0;
		
		this.currentTime = 0;
		this.loops = [];
	};
	
	hemi.animation.Animation.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         */
        citizenType: 'hemi.animation.Animation',
		
		/**
		 * Send a cleanup Message and remove all references in the Animation.
		 */
		cleanup: function() {
			if (this.target.isAnimating) {
				this.stop();
			}
			
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.target = null;
			this.loops = [];
		},
		
		/**
		 * Get the Octane structure for the Animation.
	     *
	     * @return {Object} the Octane structure representing the Animation
		 */
		toOctane: function(){
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'target',
				id: this.target.getId()
			});
			
			octane.props.push({
				name: 'beginTime',
				val: this.beginTime
			});
			
			octane.props.push({
				name: 'endTime',
				val: this.endTime
			});
			
			octane.props.push({
				name: 'currentTime',
				val: this.beginTime
			});
			
			var loopsEntry = {
				name: 'loops',
				oct: []
			};
			
			for (var ndx = 0, len = this.loops.length; ndx < len; ndx++) {
				loopsEntry.oct.push(this.loops[ndx].toOctane());
			}
			
			octane.props.push(loopsEntry);
			
			return octane;
		},
		
		/**
		 * Add the given Loop to the Animation.
		 *
		 * @param {hemi.animation.Loop} loop the Loop to add
		 */
		addLoop: function(loop){
			this.loops.push(loop);
		},

		/**
		 * Remove the given Loop from the Animation.
		 * 
		 * @param {hemi.animation.Loop} loop the Loop to remove
		 * @return {hemi.animation.Loop} the removed Loop or null
		 */
		removeLoop: function(loop) {			
			var found = null;
			var ndx = this.loops.indexOf(loop);
			
			if (ndx != -1) {
				var spliced = this.loops.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},

		/**
		 * Check if the current time of the Animation needs to be reset by any
		 * of its Loops. If a Loop resets the current time, increment that
		 * Loop's iteration counter.
		 */
		checkLoops: function() {
			for (var ndx = 0; ndx < this.loops.length; ndx++) {
				var loop = this.loops[ndx];
				
				if (loop.current != loop.iterations) {
					if (this.currentTime >= loop.stopTime) {
						this.currentTime = loop.startTime;
						loop.current++;
					}
				}
			}
		},

		/**
		 * Reset the Animation and its Loops to their initial states.
		 */
		reset: function() {
			this.currentTime = this.beginTime;
			
			for (var ndx = 0; ndx < this.loops.length; ndx++) {
				this.loops[ndx].current = 0;
			}
		},

		/**
		 * If the Animation's target is not currently animating, start the
		 * Animation.
		 */
		start: function(){
			if (!this.target.isAnimating) {
				this.target.isAnimating = true;
				this.updateTarget(this.currentTime);
				hemi.view.addRenderListener(this);
				
				this.send(hemi.msg.start, {});
			}
		},

		/**
		 * If the Animation is currently running, stop it.
		 */
		stop: function(){
			var listener = hemi.view.removeRenderListener(this);
			this.target.isAnimating = false;
			
			this.send(hemi.msg.stop, {});
		},

		/**
		 * Update the Animation's current time with the amount of elapsed time
		 * in the RenderEvent. If the Animation has not yet ended, update the
		 * Animation's target with the current animation time. Otherwise end
		 * the Animation.
		 *
		 * @param {o3d.RenderEvent} renderEvent the event containing
		 *		  information about the render
		 */
		onRender: function(renderEvent){
			this.currentTime += renderEvent.elapsedTime;
			this.checkLoops();
			if (this.currentTime < this.endTime) {
				this.updateTarget(this.currentTime);
			} else {
				this.updateTarget(this.endTime);
				this.stop();
				this.reset();
			}
		},
		
		/**
		 * Update the target with the given animation time.
		 * 
		 * @param {number} currentTime current animation time
		 */
		updateTarget: function(currentTime) {
			this.target.setAnimationTime(currentTime);
		}
	};
	
	hemi.animation.Animation.inheritsFrom(hemi.world.Citizen);
	hemi.animation.Animation.prototype.msgSent =
		hemi.animation.Animation.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	/**
	 * Create an Animation for the given Model.
	 *
	 * @param {hemi.model.Model} model Model to animate
	 * @param {number} beginTime time within the Model to start animating
	 * @param {number} endTime time within the Model to stop animating
	 * @return {hemi.animation.Animation} the newly created animation
	 */
	hemi.animation.createModelAnimation = function(model, beginTime, endTime) {
		var anim = new hemi.animation.Animation();
		anim.target = model;
		anim.beginTime = beginTime;
		anim.currentTime = beginTime;
		anim.endTime = endTime;

		return anim;
	};

	return hemi;
})(hemi || {});
