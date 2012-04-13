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

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
     * @class A SmokePuffConfig specifies properties for a smoke puff particle
     * Effect.
     * @see hemi.effect.Burst
     */
	hext.tools.SmokePuffConfig = function() {
		/**
		 * The general size of each smoke particle.
         * @type {number}
         * @default 1
		 */
		this.size = 1;
		
		/**
		 * The position to center the smoke puff around.
         * @type {number[3]}
         * @default [0, 0, 0]
		 */
		this.position = [0, 0, 0];
		
		/**
		 * A 'wind' velocity to apply to the smoke puff.
         * @type {number[3]}
         * @default [0, 0, 0]
		 */
		this.wind = [0, 0, 0];
		
		/**
		 * Variability to allow for each direction of the 'wind' velocity.
         * @type {number[3]}
         * @default [0, 0, 0]
		 */
		this.windVar = [0, 0, 0];
	};
	
	hext.tools.SmokePuffConfig.prototype = {
		/**
		 * Get a hash key for the SmokePuffConfig.
		 * 
		 * @return {string} a key unique to the configuration properties
		 */
		getKey: function() {
			var key = this.size + ',' +
				this.position[0] + ',' + this.position[1] + ',' + this.position[2] + ',' +
				this.wind[0] + ',' + this.wind[1] + ',' + this.wind[2] + ',' +
				this.windVar[0] + ',' + this.windVar[1] + ',' + this.windVar[2];
			
			return key;
		},
		
		/*
		 * Not currently supported.
	     */
		toOctane: function() {
			
		}
	};
	
	/**
	 * @class A SmokePuffer is the data model representation of a smoke puffer
	 * weatherization tool. It produces visible white puffs that can be used to
	 * detect drafts.
	 * @extends hext.tools.BaseTool
	 */
	var SmokePuffer = function(client) {
		hext.tools.BaseTool.call(this);
		
		this.puffConfigs = [];
		this.puffs = new Hashtable();
		this.pickNames = new Hashtable();
		this.client = client;
	};
	
	SmokePuffer.prototype = new hext.tools.BaseTool();
	SmokePuffer.prototype.constructor = SmokePuffer;
		
	/**
	 * Send a cleanup Message and remove all references in the SmokePuffer.
	 */
	SmokePuffer.prototype.cleanup = function() {
		hext.tools.BaseTool.cleanup.call(this);
		this.puffConfigs = [];
		this.puffs.clear();
		this.puffs = null;
		this.pickNames.clear();
		this.pickNames = null;
	};
		
	/*
	 * Not currently supported.
	 */
	SmokePuffer.prototype.toOctane = function() {
		
	};
	
	/**
	 * Associate a smoke puff particle Effect with the given configuration
	 * and the given shape name.
	 *  
	 * @param {string} shapeName name of the pickable shape to associate
	 *     with the smoke puff
	 * @param {hext.tools.SmokePuffConfig} config configuration for the
	 *     particle Effect to generate when the shape is picked
	 */
	SmokePuffer.prototype.addSmokePuff = function(shapeName, config) {
		var key = config.getKey();
		var puff;
		
		if (this.puffs.containsKey(key)) {
			puff = this.puffs.get(key);
		} else {
			puff = hext.tools.createSmokePuff(this.client,
				config.size,
				config.position,
				config.wind,
				config.windVar);
			
			this.puffConfigs.push(config);
			this.puffs.put(key, puff);
		}
		
		this.pickNames.put(shapeName, puff);
	};

	hemi.makeCitizen(SmokePuffer, 'hext.tools.SmokePuffer', {
		msgs: [],
		toOctane: []
	});
	
	hext.tools.createSmokePuff = function(client, scale, position, opt_wind, opt_windRange) {
		var wind = opt_wind || [0,0,0];
		var windRange = opt_windRange || [0,0,0];
		var pfSpecs = new hemi.ParticleFunction();
		pfSpecs.name = hemi.ParticleFunctionIds.Puff;
		pfSpecs.options.wind = wind;
		pfSpecs.options.size = scale;
		
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

		var smokepuff = hemi.createParticleBurst(client,
			colorRamp,
			params,
			pfSpecs);
		
		return smokepuff;
	};
	
	return hext;
})(hext || {});
