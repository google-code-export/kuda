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

var hemi = (function(hemi) {
	
	/**
	 * @namespace A module for generating particle effects.
	 */
	hemi.effect = hemi.effect || {};
	
	/**
	 * A set of names of predefined per-particle parameter setting functions.
	 * <ul><pre>
	 * <li>hemi.effect.ParticleFunctionName.Acceleration
	 * <li>hemi.effect.ParticleFunctionName.Puff
	 * </ul></pre>
	 */
	hemi.effect.ParticleFunctions = {
		Acceleration : 'Acceleration',
		Puff: 'Puff'
	};
	
	/**
	 * @class A ParticleFunction specifies a predefined per-particle parameter
	 * setting function and any properties it might require.
	 * @example
	 * Each function must be of the form:
	 * 
	 * function(number, hemi.core.particles.ParticleSpec): void
	 * 
	 * The number is the index of the particle being created. The ParticleSpec
	 * is a set of parameters for that particular particle.
	 */
	hemi.effect.ParticleFunction = function() {
		/**
		 * The name of the predefined parameter setting function.
		 * @type hemi.effect.ParticleFunctions
		 */
		this.name = null;
		
		/**
		 * A set of options to customize values that the function uses to
		 * calculate the particle parameters.
		 * @type Object
		 */
		this.options = {};
	};
	
	hemi.effect.ParticleFunction.prototype = {
		/**
		 * Get the Octane structure for the ParticleFunction.
		 * 
	     * @return {Object} the Octane structure representing the
	     *     ParticleFunction
		 */
		toOctane: function() {
			var octane = {
				type: 'hemi.effect.ParticleFunction',
				props: []
			};
			
			octane.props.push({
				name: 'name',
				val: this.name
			});
			
			octane.props.push({
				name: 'options',
				val: this.options
			});
			
			return octane;
		}
	};
	
	/**
	 * @class An Effect is a 3D particle effect.
	 * @extends hemi.world.Citizen
	 */
	hemi.effect.Effect = hemi.world.Citizen.extend({
		init: function() {
			this._super();
			
			/**
			 * The particle state to use for drawing.
			 * @type hemi.core.particles.ParticleStateIds
			 * @default hemi.core.particles.ParticleStateIds.BLEND
			 */
			this.state = hemi.core.particles.ParticleStateIds.BLEND;
			
			/**
			 * An array of colors for each particle to transition through. Each
			 * color value is in the form RGBA.
			 * @type number[]
			 */
			this.colorRamp = [];
			
			/**
			 * A set of parameters for the particle emitter.
			 * @type hemi.core.particles.ParticleSpec
			 */
			this.params = {};
			
			/**
			 * Optional specs that identify a particle updating function to use and
			 * properties to set for it.
			 * @type hemi.effect.ParticleFunction
			 */
			this.particleFunction = null;
			
			/* The actual particle emitter for the Effect */
			this.particles = null;
			/* The containing Transform for the Effect */
			this.transform = hemi.effect.particlePack.createObject('Transform');
			this.transform.parent = hemi.core.client.root;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Effect',
		
		/**
		 * Send a cleanup Message and remove all references in the Effect.
		 */
		cleanup: function() {
			this._super();
			
			this.particles = null;
			this.transform.parent = null;
			hemi.effect.particlePack.removeObject(this.transform);
			this.transform = null;
		},
		
		/**
		 * Set the particle emitter up for the Effect. Implementing subclasses
		 * should override this.
		 */
		setup: function() {
			
		},
		
		/**
		 * Get the Octane structure for the Effect.
		 * 
	     * @return {Object} the Octane structure representing the Effect
		 */
		toOctane: function() {
			var octane = this._super();
			
			var valNames = ['state', 'colorRamp', 'params'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			};
			
			if (this.particleFunction !== null) {
				octane.props.push({
					name: 'particleFunction',
					oct: this.particleFunction.toOctane()
				});
			}
			
			octane.props.push({
				name: 'setup',
				arg: []
			});
			
			return octane;
		}
	});
	
	/**
	 * @class An Emitter constantly generates particles.
	 * @extends hemi.effect.Effect
	 */
	hemi.effect.Emitter = hemi.effect.Effect.extend({
		init: function() {
			this._super();
			
			/* Flag indicating if the Emitter is visible */
			this.visible = false;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Emitter',
		
		/**
		 * Set the Emitter to not be visible.
		 */
		hide: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (this.visible) {
				this.visible = false;
				this.transform.removeShape(this.particles.shape);
				this.send(hemi.msg.visible,
					{
						visible: this.visible
					});
			}
		},
		
		/**
		 * Set the particle emitter up for the Emitter.
		 */
		setup: function() {
			// Create a deep copy of the parameters since the particle emitter
			// will mutate them as it fires.
			var clonedParams = hemi.utils.clone(this.params),
				paramSetter;
			
			// It's okay if paramSetter stays undefined.
			if (this.particleFunction !== null) {
				paramSetter = hemi.effect.getParticleFunction(this.particleFunction);
			}
			
			this.particles = hemi.effect.particleSystem.createParticleEmitter();
			this.particles.setState(this.state);
			this.particles.setColorRamp(this.colorRamp);
			this.particles.setParameters(clonedParams, paramSetter);
		},
		
		/**
		 * Set the Emitter to be visible.
		 */
		show: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (!this.visible) {
				this.visible = true;
				this.transform.addShape(this.particles.shape);
				this.send(hemi.msg.visible,
					{
						visible: this.visible
					});
			}
		}
	});
	
	hemi.effect.Emitter.prototype.msgSent =
		hemi.effect.Emitter.prototype.msgSent.concat([hemi.msg.visible]);
	
	/**
	 * @class A Burst generates one set of particles at a time. It can be used
	 * for a smoke puff, explosion, firework, water drip, etc.
	 * @extends hemi.effect.Emitter
	 */
	hemi.effect.Burst = hemi.effect.Emitter.extend({
		init: function() {
			this._super();
			
			/* The OneShot particle effect */
			this.oneShot = null;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Burst',
		
		/**
		 * Send a cleanup Message and remove all references in the Burst.
		 */
		cleanup: function() {
			this._super();
			
			this.oneShot = null;
		},
		
		/**
		 * Set the particle emitter up for the Burst.
		 */
		setup: function() {
			this._super();
			
			this.oneShot = this.particles.createOneShot(this.transform);
		},
		
		/**
		 * Generate the particles for the Burst.
		 */
		trigger: function() {
			if (this.oneShot === null) {
				this.setup();
			}
			
			this.oneShot.trigger(this.params.position);
			this.send(hemi.msg.burst,
				{
					position: this.params.position
				});
		}
	});
	
	hemi.effect.Burst.prototype.msgSent =
		hemi.effect.Burst.prototype.msgSent.concat([hemi.msg.burst]);
	
	/**
	 * @class A Trail is a particle effect that can be started and stopped like
	 * an animation. It can be used for effects like exhaust.
	 * @extends hemi.effect.Effect
	 */
	hemi.effect.Trail = hemi.effect.Effect.extend({
		init: function() {
			this._super();
			
			/* A flag that indicates if the Trail is currently animating */
			this.isAnimating = false;
			/* The number of seconds between particle births */
			this.fireInterval = 1;
			this.count = 0;
		},
		
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 * @type string
		 */
		citizenType: 'hemi.effect.Trail',
		
		/**
		 * Render event handling function that allows the Trail to animate.
		 * 
		 * @param {o3d.Event} renderEvent the render event
		 */
		onRender: function(renderEvent) {
			this.count += renderEvent.elapsedTime;
			
			if (this.count >= this.fireInterval) {
				this.count = 0;
				this.particles.birthParticles(this.params.position);
			}
		},
		
		/**
		 * Set the particle emitter up for the Trail.
		 */
		setup: function() {
			// Create a deep copy of the parameters since the particle emitter
			// will mutate them as it fires.
			var clonedParams = hemi.utils.clone(this.params),
				paramSetter;
			
			// Calculate the maximum number of particles for the stream
			var particlesPerFire = this.params.numParticles || 1,
				maxLife = this.params.lifeTime || 1 + this.params.lifeTimeRange || 0,
				maxFires = (maxLife / this.fireInterval) + 1,
				maxParticles = parseInt(maxFires * particlesPerFire);
			
			// It's okay if paramSetter stays undefined.
			if (this.particleFunction !== null) {
				paramSetter = hemi.effect.getParticleFunction(this.particleFunction);
			}
			
			// Intentionally left undefined for now.
			var texture;
			
			this.particles = hemi.effect.particleSystem.createTrail(
				this.transform,
				maxParticles,
				clonedParams,
				texture,
				paramSetter);
			this.particles.setState(this.state);
			this.particles.setColorRamp(this.colorRamp);
		},
		
		/**
		 * Start animating the Trail. It will generate particles based upon its
		 * fireInterval property.
		 */
		start: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (!this.isAnimating) {
				this.isAnimating = true;
				hemi.view.addRenderListener(this);
				this.send(hemi.msg.start, { });
			}
		},
		
		/**
		 * Stop animating the Trail.
		 */
		stop: function() {
			if (this.particles === null) {
				this.setup();
			}
			
			if (this.isAnimating) {
				hemi.view.removeRenderListener(this);
				this.isAnimating = false;
				this.count = 0;
				this.send(hemi.msg.stop, { });
			}
		},
		
		/**
		 * Get the Octane structure for the Trail.
		 * 
	     * @return {Object} the Octane structure representing the Trail
		 */
		toOctane: function() {
			var octane = this._super();
			
			octane.props.unshift({
				name: 'fireInterval',
				val: this.fireInterval
			});
			
			return octane;
		}
	});
	
	hemi.effect.Trail.prototype.msgSent =
		hemi.effect.Trail.prototype.msgSent.concat([
			hemi.msg.start,
			hemi.msg.stop]);
	
	/**
	 * Initialize the resources for the effect module.
	 */
	hemi.effect.init = function() {
		this.particlePack = hemi.core.client.createPack();
		this.particleSystem = hemi.core.particles.createParticleSystem(
			this.particlePack,
			hemi.view.viewInfo);
	};
	
	/**
	 * Create an Emitter effect that constantly streams particles.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.core.particles.ParticleSpec} params parameters for the
	 *	   particle emitter
	 * @param {hemi.effect.ParticleFunction} opt_function optional specs that
	 *	   that identify a particle updating function to use and properties to
	 *	   set for it
	 * @return {hemi.effect.Emitter} the newly created Emitter
	 */
	hemi.effect.createEmitter = function(
			state,
			colorRamp,
			params,
			opt_function) {
		var emitter = new hemi.effect.Emitter();
		emitter.state = state;
		emitter.colorRamp = colorRamp;
		emitter.params = params;
		
		if (opt_function) {
			emitter.particleFunction = opt_function;
		}
		
		emitter.setup();
		return emitter;
	};
	
	/**
	 * Create a Burst effect that fires particles one shot at a time.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.core.particles.ParticleSpec} params parameters for the
	 *	   particle emitter
	 * @param {hemi.effect.ParticleFunction} opt_function optional specs that
	 *	   that identify a particle updating function to use and properties to
	 *	   set for it
	 * @return {hemi.effect.Burst} the newly created Burst
	 */
	hemi.effect.createBurst = function(
			state,
			colorRamp,
			params,
			opt_function) {
		var burst = new hemi.effect.Burst();
		burst.state = state;
		burst.colorRamp = colorRamp;
		burst.params = params;
		
		if (opt_function) {
			burst.particleFunction = opt_function;
		}
		
		burst.setup();
		return burst;
	};
	
	/**
	 * Create a Trail effect that fires particles at the specified interval.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[]} colorRamp array of color values in the form RGBA
	 * @param {hemi.core.particles.ParticleSpec} params parameters for the
	 *	   particle emitter
	 * @param {number} fireInterval seconds to wait between firing particles
	 * @param {hemi.effect.ParticleFunction} opt_function optional specs that
	 *	   that identify a particle updating function to use and properties to
	 *	   set for it
	 * @return {hemi.effect.Trail} the newly created Trail
	 */
	hemi.effect.createTrail = function(
			state,
			colorRamp,
			params,
			fireInterval,
			opt_function) {
		var trail = new hemi.effect.Trail();
		trail.state = state;
		trail.colorRamp = colorRamp;
		trail.params = params;
		trail.fireInterval = fireInterval;
		
		if (opt_function) {
			trail.particleFunction = opt_function;
		}
		
		trail.setup();
		return trail;
	};
	
	/**
	 * Get the predefined per-particle parameter setting function for the given
	 * specs.
	 *
	 * @param {hemi.effect.ParticleFunction} funcSpecs specs that identify the
	 *	   function to get and properties to set for it
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
	 *	   instance of the predefined function with the appropriate properties
	 *	   set or null if the function name is not recognized
	 */
	hemi.effect.getParticleFunction = function(funcSpecs) {
		var particleFunc;
		
		switch(funcSpecs.name) {
			case hemi.effect.ParticleFunctions.Acceleration:
				particleFunc = this.getAccelerationFunction(funcSpecs.options);
				break;
			case hemi.effect.ParticleFunctions.Puff:
				particleFunc = this.getPuffFunction(funcSpecs.options);
				break;
			default:
				particleFunc = null;
				break;
		}
		
		return particleFunc;
	};
	
	/**
	 * Get a function that sets each particle's acceleration by applying a
	 * factor to that particle's velocity. Valid options are:
	 * - factor : number[3] a factor to apply to each particle's XYZ velocity
	 *
	 * @param {Object} options customization options for the particle parameters
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
	 *	   instance of the ParticleFunctionId.Acceleration function
	 */
	hemi.effect.getAccelerationFunction = function(options) {
		var acc = function (index, parameters) {
			parameters.acceleration = [
				acc.factor[0] * parameters.velocity[0],
				acc.factor[1] * parameters.velocity[1],
				acc.factor[2] * parameters.velocity[2]
			];
		};
		
		acc.factor = options.factor === undefined ? [0, 0, 0] : options.factor;
		return acc;
	};
	
	/**
	 * Get a function that sets each particle's velocity and acceleration to
	 * create a windblown puff effect. Valid options are:
	 * - wind : number[3] an XYZ acceleration to apply to each particle
	 * - size : number a factor to determine the size of the puff
	 * 
	 * @param {Object} options customization options for the particle parameters
	 * @return {function(number, hemi.core.particles.ParticleSpec): void} an
	 *	   instance of the ParticleFunctionId.Puff function
	 */
	hemi.effect.getPuffFunction = function(options) {
		var puff = function (index, parameters) {
			var angle = Math.random() * 2 * Math.PI,
				speed = 0.8 * puff.size,
				drag = -0.003 * puff.size;
			// Calculate velocity
			parameters.velocity = hemi.core.math.matrix4.transformPoint(
				hemi.core.math.matrix4.rotationY(7 * angle),
				[speed,speed,speed]);
			parameters.velocity = hemi.core.math.matrix4.transformPoint(
				hemi.core.math.matrix4.rotationX(angle),
				parameters.velocity);
			// Calculate acceleration
			parameters.acceleration = hemi.core.math.mulVectorVector(
				parameters.velocity,
				[drag,drag,drag]);
			parameters.acceleration = hemi.core.math.addVector(
				parameters.acceleration,
				puff.wind);
		};
		
		puff.wind = options.wind === undefined ? [0, 0, 0] : options.wind;
		puff.size = options.size === undefined ? 1 : options.size;
		return puff;
	};
	
	return hemi;
})(hemi || {});
