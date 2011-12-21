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

var hemi = (function(hemi) {

	hemi = hemi || {};

	/**
	 * @class A Loop contains a start time and stop time as well as the number of
	 * iterations to perform for the Loop.
	 */
	hemi.Loop = function() {
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
	
	hemi.Loop.prototype = {
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
	 * @class An AnimationSquence contains a group of animations to animate, a begin time, an end
	 * time, and Loops for repeating sections of the AnimationSequence.
	 */
	hemi.AnimationSequenceBase = function() {
		/**
		 * The animations to play. 
		 * @type KeyFrameAnimation
		 */
		this.animations = [];
		
		/**
		 * The time the Sequence begins at.
		 * @type number
		 * @default 0
		 */
		this.beginTime = 0;
		
		/**
		 * The time the Sequence ends at.
		 * @type number
		 * @default 0
		 */
		this.endTime = 0;
		
		this.currentTime = 0;
		this.loops = [];
		this.isAnimating = false;
	};

		
	hemi.AnimationSequenceBase.prototype = {
		/**
		 * Get the Octane structure for the Animation.
		 *
		 * @return {Object} the Octane structure representing the Animation
		 */
		toOctane: function(){
			var octane = this._super();
			
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
		 * Add the given Loop to the Sequence.
		 *
		 * @param {hemi.Loop} loop the Loop to add
		 */
		addLoop: function(loop){
			this.loops.push(loop);
		},

		/**
		 * Remove the given Loop from the Sequence.
		 * 
		 * @param {hemi.Loop} loop the Loop to remove
		 * @return {hemi[Loop} the removed Loop or null
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
		 * Check if the current time of the Sequence needs to be reset by any
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
		 * Reset the Sequence and its Loops to their initial states.
		 */
		reset: function() {
			this.currentTime = this.beginTime;
			
			for (var ndx = 0; ndx < this.loops.length; ndx++) {
				this.loops[ndx].current = 0;
			}
		},

		/**
		 * If the Sequence is not currently animating, start the
		 * Animation.
		 */
		start: function(){
			if (!this.isAnimating) {
				this.isAnimating = true;
				for (var i = 0; i < this.animations.length; ++i) {
					this.animations[i].play(false, this.currentTime);
				}
				hemi.addRenderListener(this);
				
				this.send(hemi.msg.start, {});
			}
		},

		/**
		 * If the sequence is currently running, stop it.
		 */
		stop: function(){
			for (var i = 0; i < this.animations.length; ++i) {
				this.animations[i].stop();
			}
			hemi.removeRenderListener(this);
			this.isAnimating = false;
			
			this.send(hemi.msg.stop, {});
		},

		/**
		 * Update the Sequence's current time with the amount of elapsed time
		 * in the RenderEvent. If the Sequence has not yet ended, update the
		 * Sequence's animations with the current animation time. Otherwise end
		 * the Sequence.
		 *
		 * @param {RenderEvent} renderEvent the event containing
		 *		  information about the render
		 */
		onRender: function(renderEvent){
			var previous = this.currentTime;
			this.currentTime += renderEvent.elapsedTime;

			this.send(hemi.msg.animate,
				{
					previous: previous,
					time: this.currentTime
				});
			var animHandler = THREE.AnimationHandler;
			this.checkLoops();
			if (this.currentTime < this.endTime) {
				for (var i = 0; i < this.animations.length; ++i) {
					this.animations[i].update(renderEvent.elapsedTime);
				}
			} else {
				//PABNOTE Need to do this anymore?
				//this.updateTarget(this.endTime);
				this.stop();
				this.reset();
			}
		}
		
		/**
		 * Update the target with the given animation time.
		 * 
		 * @param {number} currentTime current animation time
		 */
		// updateTargets: function(currentTime) {
		// 	for (var i = 0; i < targets.length; ++i) {
		// 		targets[i].play(false, this.currentTime);
		// 	}
		// }
	};
	

	hemi.makeCitizen(hemi.AnimationSequenceBase, 'hemi.AnimationSequence', {
		cleanup: function() {
			if (this.isAnimating) {
				this.stop();
			}
			
			this.animations = [];
			this.loops = [];
		},
		msgs: [hemi.msg.start, hemi.msg.stop, hemi.msg.animate]
		//toOctane: ['client', 'fileName', 'load']
	});

	/**
	 * Create an AnimationSequence for the given Model.
	 *
	 * @param {hemi.Model} model Model to animate
	 * @param {number} beginTime time within the Model to start animating
	 * @param {number} endTime time within the Model to stop animating
	 * @return {hemi.AnimationSequence} the newly created animation
	 */
	hemi.createModelAnimationSequence = function(model, beginTime, endTime) {
		var anim = new hemi.AnimationSequence();
		anim.animations = model.animations;
		anim.beginTime = beginTime;
		anim.currentTime = beginTime;
		anim.endTime = endTime;

		return anim;
	};

	return hemi;
})(hemi || {});
