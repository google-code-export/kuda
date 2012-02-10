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
// Loop class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Loop contains a start time and stop time as well as the number of iterations to
	 * perform for the Loop.
	 */
	var Loop = function() {
		/*
		 * The current iteration.
		 * @type number
		 */
		this._current = 0;

		/**
		 * The number of times the Loop repeats.
		 * @type number
		 * @default -1 (infinite)
		 */
		this.iterations = -1;

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
	};

	Loop.prototype._octane = ['iteration', 'name', 'startTime', 'stopTime'];

	hemi.Loop = Loop;
	hemi.makeOctanable(hemi.Loop, 'hemi.Loop', hemi.Loop.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// AnimationGroup class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class An AnimationGroup contains a group of animations to animate together as well as Loops
	 * for repeating sections of the AnimationGroup.
	 * 
	 * @param {number} opt_beginTime optional time to start animating
	 * @param {number} opt_endTime optional time to stop animating
	 * @param {hemi.Model} opt_model optional Model to grab KeyFrameAnimations from
	 */
	var AnimationGroup = function(opt_beginTime, opt_endTime, opt_model) {
		/*
		 * The current animation time.
		 * @type number
		 */
		this._currentTime = opt_beginTime ? opt_beginTime : 0;

		/*
		 * Flag indicating if the AnimationGroup is currently playing.
		 * @type boolean
		 */
		this._isAnimating = false;
	
		/**
		 * The model used in animation. Contains the THREE.KeyAnimations[]
		 * @type Hemi.Model
		 */
		this.model = opt_model ? opt_model : null;

		/**
		 * The time the AnimationGroup begins at.
		 * @type number
		 * @default 0
		 */
		this.beginTime = opt_beginTime ? opt_beginTime : 0;

		/**
		 * The time the AnimationGroup ends at.
		 * @type number
		 * @default 0
		 */
		this.endTime = opt_endTime ? opt_endTime : 0;

		/**
		 * Any loops in the AnimationGroup.
		 * @type hemi.Loop[]
		 */
		this.loops = [];

        
	};

	/*
	 * Remove all references in the AnimationGroup.
	 */
	AnimationGroup.prototype._clean = function() {
		if (this._isAnimating) {
			this.stop();
		}

		this.model = null;
		this.loops = [];
	};

	/*
	 * Array of Hemi Messages that AnimationGroup is known to send.
	 * @type string[]
	 */
	AnimationGroup.prototype._msgSent = [hemi.msg.animate, hemi.msg.start, hemi.msg.stop];

	/*
	 * Octane properties for AnimationGroup.
	 * @type string[]
	 */
	AnimationGroup.prototype._octane = ['beginTime', 'endTime', 'loops', 'reset','model'];
	// TODO: how to get animations in octane?

	/**
	 * Add the given Loop to the AnimationGroup.
	 *
	 * @param {hemi.Loop} loop the Loop to add
	 */
	AnimationGroup.prototype.addLoop = function(loop){
		if (this.loops.indexOf(loop) === -1) {
			this.loops.push(loop);
		}
	};

	/**
	 * Update the AnimationGroup's current time with the amount of elapsed time in the render event.
	 * Update the AnimationGroup's animations with the current animation time.
	 * 
	 * @param {Object} event event containing information about the render
	 */
	AnimationGroup.prototype.onRender = function(event){
		var previous = this._currentTime,
			delta = event.elapsedTime;


		this._currentTime += delta;
		checkLoops.call(this);        


        if (this._currentTime !== previous + delta) {
            delta = 0;
        }
        var animations = [];
        if (this.model) {
            animations = this.model.animations;

            if (delta === 0) {
                this.send(hemi.msg.animate,
                    {
                        previous: this._currentTime,
                        time: this._currentTime
                    });
                for (var i = 0, il = animations.length; i < il; ++i) {
                    animations[i].stop();
                }
                for (var i = 0, il = animations.length; i < il; ++i) {
                    animations[i].play(false, this._currentTime);
                }
            } else {
                this.send(hemi.msg.animate,
                    {
                        previous: previous,
                        time: this._currentTime
                    });

                if (this._currentTime >= this.endTime) {
                    delta = this.endTime - previous;
                    this.stop();
                    this.reset();
                }

                for (var i = 0, il = animations.length; i < il; ++i) {
                    animations[i].update(delta);
                }
            }
        }
	};

	/**
	 * Remove the given Loop from the AnimationGroup.
	 * 
	 * @param {hemi.Loop} loop the Loop to remove
	 * @return {hemi.Loop} the removed Loop or null
	 */
	AnimationGroup.prototype.removeLoop = function(loop) {
		var ndx = this.loops.indexOf(loop),
			found = null;

		if (ndx !== -1) {
			found = this.loops.splice(ndx, 1)[0];
		}

		return found;
	};

	/**
	 * Reset the AnimationGroup and its Loops to their initial states.
	 */
	AnimationGroup.prototype.reset = function() {
		this._currentTime = this.beginTime;

		for (var i = 0, il = this.loops.length; i < il; ++i) {
			this.loops[i]._current = 0;
		}
	};

	/**
	 * If the AnimationGroup is not currently animating, start it.
	 */
	AnimationGroup.prototype.start = function() {
		if (!this._isAnimating) {
            var animations = [];
            
            if (this.model)  {
                animations = this.model.animations;
            
            
                for (var i = 0, il = animations.length; i < il; ++i) {
                    var animation = animations[i];
                    for ( var h = 0, hl = animation.hierarchy.length; h < hl; h++ ) {

                        var keys = animation.data.hierarchy[h].keys,
                            sids = animation.data.hierarchy[h].sids,
                            obj = animation.hierarchy[h];

                        if ( keys.length && sids ) {

                            for ( var s = 0; s < sids.length; s++ ) {

                                var sid = sids[ s ],
                                    next = animation.getNextKeyWith( sid, h, 0 );

                                if ( next ) {
                                    next.apply( sid );
                                }
                            }
                            obj.matrixAutoUpdate = false;
                            animation.data.hierarchy[h].node.updateMatrix();
                            obj.matrixWorldNeedsUpdate = true;

                        }

                    }
                    animation.play(false, this._currentTime);
                }

                this._isAnimating = true;
                hemi.addRenderListener(this);
                this.send(hemi.msg.start, {});
            }
		}
        
	};

	/**
	 * If the AnimationGroup is currently running, stop it.
	 */
	AnimationGroup.prototype.stop = function() {
		if (this._isAnimating) {
            var animations = [];
            if (this.model) {
                animations = this.model.animations;
                for (var i = 0, il = animations.length; i < il; ++i) {
                    animations[i].stop();
                }

                hemi.removeRenderListener(this);
                this._isAnimating = false;
                this.send(hemi.msg.stop, {});
            }
		}
	};

// Private functions for AnimationGroup

	/*
	 * Check if the current time of the AnimationGroup needs to be reset by any of its Loops. If a
	 * Loop resets the current time, increment that Loop's iteration counter.
	 */
	function checkLoops() {
		for (var i = 0, il = this.loops.length; i < il; ++i) {
			var loop = this.loops[i];
			
			if (loop._current !== loop.iterations && this._currentTime >= loop.stopTime) {
				this._currentTime = loop.startTime;
				loop._current++;
			}
		}
	};

	hemi.makeCitizen(AnimationGroup, 'hemi.AnimationGroup', {
		cleanup: AnimationGroup.prototype._clean,
		toOctane: AnimationGroup.prototype._octane
	});

})();
