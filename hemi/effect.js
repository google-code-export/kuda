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

o3djs.require('hemi.core');
o3djs.require('hemi.view');
o3djs.require('hemi.world');

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
	hemi.effect.Effect = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * The particle state to use for drawing.
		 * @type hemi.core.particles.ParticleStateIds
		 * @default hemi.core.particles.ParticleStateIds.BLEND
		 */
		this.state = hemi.core.particles.ParticleStateIds.BLEND;
		
		/**
		 * An array of colors for each particle to transition through. Each
		 * color value is in the form RGBA.
		 * @type number[][4]
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
	};
	
	hemi.effect.Effect.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hemi.effect.Effect',
		
		/**
		 * Send a cleanup Message and remove all references in the Effect.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			
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
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
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
	};
	
	/**
	 * @class An Emitter constantly generates particles.
	 * @extends hemi.effect.Effect
	 */
	hemi.effect.Emitter = function() {
		hemi.effect.Effect.call(this);
		/* Flag indicating if the Emitter is visible */
		this.visible = false;
	};
	
	hemi.effect.Emitter.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
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
			var clonedParams = hemi.utils.join({}, this.params),
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
	};
	
	/**
	 * @class A Burst generates one set of particles at a time. It can be used
	 * for a smoke puff, explosion, firework, water drip, etc.
	 * @extends hemi.effect.Emitter
	 */
	hemi.effect.Burst = function() {
		hemi.effect.Emitter.call(this);
		/* The OneShot particle effect */
		this.oneShot = null;
	};
	
	hemi.effect.Burst.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hemi.effect.Burst',
		
		/**
		 * Send a cleanup Message and remove all references in the Burst.
		 */
		cleanup: function() {
			hemi.effect.Effect.prototype.cleanup.call(this);
			
			this.oneShot = null;
		},
		
		/**
		 * Set the particle emitter up for the Burst.
		 */
		setup: function() {
			hemi.effect.Emitter.prototype.setup.call(this);
			
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
	};
	
	/**
	 * @class A Trail is a particle effect that can be started and stopped like
	 * an animation. It can be used for effects like exhaust.
	 * @extends hemi.effect.Effect
	 */
	hemi.effect.Trail = function() {
		hemi.effect.Effect.call(this);
		
		/* A flag that indicates if the Trail is currently animating */
		this.isAnimating = false;
		/* The number of seconds between particle births */
		this.fireInterval = 1;
		this.count = 0;
	};
	
	hemi.effect.Trail.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
		citizenType: 'hemi.effect.Trail',
		
		/*
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
			var clonedParams = hemi.utils.join({}, this.params),
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
			var octane = hemi.effect.Effect.prototype.toOctane.call(this);
			
			octane.props.unshift({
				name: 'fireInterval',
				val: this.fireInterval
			});
			
			return octane;
		}
	};
	
	/**
	 * Initialize the resources for the effect module.
	 */
	hemi.effect.init = function() {
		this.particlePack = hemi.core.client.createPack();
		this.particleSystem = hemi.core.particles.createParticleSystem(
			this.particlePack,
			hemi.view.viewInfo);
		
		// Perform inheritance for effect classes
		hemi.effect.Effect.inheritsFrom(hemi.world.Citizen);
		hemi.effect.Emitter.inheritsFrom(hemi.effect.Effect);
		hemi.effect.Emitter.prototype.msgSent =
			hemi.effect.Emitter.prototype.msgSent.concat([hemi.msg.visible]);
		hemi.effect.Burst.inheritsFrom(hemi.effect.Emitter);
		hemi.effect.Burst.prototype.msgSent =
			hemi.effect.Burst.prototype.msgSent.concat([hemi.msg.burst]);
		hemi.effect.Trail.inheritsFrom(hemi.effect.Effect);
		hemi.effect.Trail.prototype.msgSent =
			hemi.effect.Trail.prototype.msgSent.concat([
				hemi.msg.start,
				hemi.msg.stop]);
		
		//Just temporary examples/tests
		this.puff = this.createSmokePuff(7,[0,0,0]);
		this.windPuff = this.createSmokePuff(7,[0,0,0],[20,0,0],[10,3,3]);
		this.steamTrail = this.createSteamTrail();
		this.waterVaporTrail = this.createWaterVaporTrail();
		this.waterDrips = this.createWaterDrips();
		this.humidity = this.createHumidity();
		this.stoveSmoke = this.createStoveSmoke();
		this.exhaustSmoke = this.createExhaustSmoke();
	};
	
	/**
	 * Create an Emitter effect that constantly streams particles.
	 * 
	 * @param {hemi.core.particles.ParticleStateIds} state the particle state
	 * @param {number[][4]} colorRamp array of color values in the form RGBA
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
	 * @param {number[][4]} colorRamp array of color values in the form RGBA
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
	 * @param {number[][4]} colorRamp array of color values in the form RGBA
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
	
	hemi.effect.createSmokePuff = function(scale,position,opt_wind,opt_windRange) {
		var wind = opt_wind || [0,0,0];
		var windRange = opt_windRange || [0,0,0];
		var pfSpecs = new hemi.effect.ParticleFunction();
		pfSpecs.name = hemi.effect.ParticleFunctions.Puff;
		pfSpecs.options.wind = wind;
		pfSpecs.options.size = scale;
		
		var state = hemi.core.particles.ParticleStateIds.ADD;
		var colorRamp = 
			[0.6, 0.6, 0.6, 0.6,
			0.9, 0.9, 0.9, 0.2,
			0.95,0.95,0.95,0.1,
			1,1,1,0];
		var params = {
			numParticles: 60,
			lifeTime: 2.3,
			startTime: 0,
			startSize: 0.5*scale,
			endSize: 3.0*scale,
			endSizeRange: 1.0*scale,
			position: position,
			spinSpeedRange: 10,
			accelerationRange: windRange};

		var smokepuff = hemi.effect.createBurst(
			state,
			colorRamp,
			params,
			pfSpecs);
		
		return smokepuff;
	};
	
	hemi.effect.createSmokeStack = function() {
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[0, 0, 0, 0.5,
			0, 0, 0, 0];
		var params = {
			numParticles: 2,
			lifeTime: 2,
			startSize: 10,
			endSize: 100,
			position: [0, 0, 0],
			velocity: [0, 0, 100],
			spinSpeedRange: 4};
			
		var smokeStack = hemi.effect.createEmitter(
			state,
			colorRamp,
			params);
			
		return smokeStack;
	};

	hemi.effect.createFire = function() {
		var state = hemi.core.particles.ParticleStateIds.ADD;
		var colorRamp = 
			[1, 1, 0, 0.6,
			 1, 0, 0, 0.6,
			 0, 0, 0, 1,
			 0, 0, 0, 0.5,
			 0, 0, 0, 0];
		var params = {
			numParticles: 20,
			lifeTime: 1.1,
			timeRange: 1,
			startSize: 55,
			startSizeRange : 20,
			endSize: 1,
			endSizeRange: 1,
			velocity:[0, 55, 0],
			velocityRange: [10.1, 9.7, 10.3],
			acceleration: [0, -1, 0],
			positionRange : [3.6, 2, 3.4],
			spinSpeedRange: 4
		};
		var fire = hemi.effect.createEmitter(
			state,
			colorRamp,
			params);

		return fire;
	};

	hemi.effect.createSteamTrail = function() {
		var fireInterval = 0.2;
		var pfSpecs = new hemi.effect.ParticleFunction();
		pfSpecs.name = hemi.effect.ParticleFunctions.Acceleration;
		pfSpecs.options.factor = [-0.2, -0.4, -0.2];
		
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[1, 1, 1, 0.2,
			0.9, 0.9, 0.9, 0.05,
			0.8, 0.8, 0.8, 0.0];
		var params = {
			numParticles: 15,
			lifeTime: 0.8,
			lifeTimeRange: 0.2,
			startSize: 0.2,
			startSizeRange: 0.1,
			endSize: 0.9,
			endSizeRange: 0.5,
			position: [-2.744, 1.426, 1.812],
			positionRange: [0.1, 0.2, 0.1],
			velocity: [0, 0.3, 0],
			velocityRange: [0.2, 0.3, 0.2],
			spinSpeedRange: 10};
		
		var steamTrail = hemi.effect.createTrail(
			state,
			colorRamp,
			params,
			fireInterval,
			pfSpecs);
		
		return steamTrail;
	};

	hemi.effect.createWaterVaporTrail = function() {
		var fireInterval = 0.5;
		var pfSpecs = new hemi.effect.ParticleFunction();
		pfSpecs.name = hemi.effect.ParticleFunctions.Acceleration;
		pfSpecs.options.factor = [0.1, -0.1, 0.1];
		
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[1, 1, 1, 0.1,
			0.6, 0.85, 0.9, 0.05,
			0.35, 0.71, 0.80, 0];
		var params = {
			numParticles: 10,
			lifeTime: 2.5,
			lifeTimeRange: 0.5,
			startSize: 0.8,
			startSizeRange: 0.2,
			endSize: 1.8,
			endSizeRange: 0.3,
			position: [0, 3.385, 1.956],
			positionRange: [0.5, 0, 0.5],
			velocity: [0, 1, 0],
			velocityRange: [0.5, 0.5, 0.5],
			spinSpeedRange: 6};
		
		var waterVaporTrail = hemi.effect.createTrail(
			state,
			colorRamp,
			params,
			fireInterval,
			pfSpecs);
		
		return waterVaporTrail;
	};
	
	hemi.effect.createWaterDrips = function() {
		var fireInterval = 0.6;
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[0.35, 0.71, 0.80, 0.8];
		var params = {
			acceleration: [0, -9.8, 0],
			numParticles: 1,
			lifeTime: 0.38,
			startSize: 0.3,
			endSize: 0.3,
			position: [0, 4.731, 1.176],
			positionRange: [0.2, 0, 0.1],
			velocity: [0, 0, 0],
			spinSpeedRange: 4};
			
		var waterDrips = hemi.effect.createTrail(
			state,
			colorRamp,
			params,
			fireInterval);
		
		return waterDrips;
	};
	
	hemi.effect.createHumidity = function() {
		var fireInterval = 0.8;
		var pfSpecs = new hemi.effect.ParticleFunction();
		pfSpecs.name = hemi.effect.ParticleFunctions.Acceleration;
		pfSpecs.options.factor = [0.1, 0, 0.1];
		
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[1, 1, 1, 0.08,
			1, 1, 1, 0.06,
			1, 1, 1, 0];
		var params = {
			numParticles: 50,
			lifeTime: 4,
			lifeTimeRange: 0.5,
			startSize: 1.2,
			startSizeRange: 0.1,
			endSize: 1.8,
			endSizeRange: 0.1,
			position: [0.261, 0.126, 0.495],
			positionRange: [3, 0, 2],
			velocity: [0, 0.8, 0],
			velocityRange: [0.4, 0.1, 0.4],
			spinSpeedRange: 4};
		
		var humidity = hemi.effect.createTrail(
			state,
			colorRamp,
			params,
			fireInterval,
			pfSpecs);
		
		return humidity;
	};
	
	hemi.effect.createStoveSmoke = function() {
		var fireInterval = 0.3;
		var pfSpecs = new hemi.effect.ParticleFunction();
		pfSpecs.name = hemi.effect.ParticleFunctions.Acceleration;
		pfSpecs.options.factor = [-0.4, 0.9, -0.1];
		
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[0.4, 0.4, 0.4, 0.3,
			0.4, 0.4, 0.4, 0.3,
			0.5, 0.5, 0.5, 0.1,
			0.5, 0.5, 0.5, 0.0];
		var params = {
			numParticles: 12,
			lifeTime: 1.5,
			startSize: 0.7,
			endSize: 1.5,
			endSizeRange: 0.4,
			position: [-2.376, 0.885, 1.813],
			positionRange: [0.2, 0.1, 0.1],
			velocity: [1.9, 0.6, 0],
			velocityRange: [0.4, 0.4, 0.2],
			spinSpeedRange: 10};
		
		var stoveSmoke = hemi.effect.createTrail(
			state,
			colorRamp,
			params,
			fireInterval,
			pfSpecs);
		
		return stoveSmoke;
	};
	
	hemi.effect.createExhaustSmoke = function() {
		var fireInterval = 0.25;
		var pfSpecs = new hemi.effect.ParticleFunction();
		pfSpecs.name = hemi.effect.ParticleFunctions.Acceleration;
		pfSpecs.options.factor = [-0.1, -0.1, -0.1];
		
		var state = hemi.core.particles.ParticleStateIds.BLEND;
		var colorRamp = 
			[0.4, 0.4, 0.4, 0.2,
			0.7, 0.7, 0.7, 0.2,
			0.7, 0.7, 0.7, 0.1,
			0.8, 0.8, 0.8, 0.0];
		var params = {
			numParticles: 20,
			lifeTime: 2.0,
			startSize: 0.2,
			endSize: 1.0,
			endSizeRange: 0.5,
			position: [-3.378, 7.025, 1.822],
			positionRange: [0.1, 0.1, 0.1],
			velocity: [0, 1.0, 0],
			velocityRange: [0.2, 0.6, 0.2],
			spinSpeedRange: 10};
		
		var exhaustSmoke = hemi.effect.createTrail(
			state,
			colorRamp,
			params,
			fireInterval,
			pfSpecs);
		
		return exhaustSmoke;
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
