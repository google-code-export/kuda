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

		/*
		 * Storage for the base classes that new Citizen classes were created from.
		 */
	var baseClasses = {},

		/*
		 * All of the Citizens of the World.
		 */
		citizens = new hemi.utils.Hashtable(),

		/*
		 * The next id to assign to a Citizen requesting a world id.
		 */
		nextId = 1;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the Citizen's id.
	 * 
	 * @return {number} the id
	 */
	function _getId() {
		return this._worldId;
	}

	/*
	 * Set the Citizen's id.
	 * 
	 * @param {number} id the id to set
	 */
	function _setId(id) {
		var oldId = this._worldId;
		this._worldId = id;

		if (oldId !== null) {
			citizens.remove(oldId);
			citizens.put(id, this);
		}
	}

	/*
	 * Send a Message with the given attributes from the Citizen to any registered MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to the Message
	 */
	function send(type, data) {
		hemi.dispatch.postMessage(this, type, data);
	}

	/*
	 * Register the given handler to receive Messages of the specified type from the Citizen. This
	 * creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array of names of arguments to pass to the handler.
	 *     Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	function subscribe(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(this._worldId, type, handler, opt_func, opt_args);
	}

	/*
	 * Register the given handler to receive Messages of all types from the Citizen. This creates a
	 * MessageTarget.
	 * 
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array of names of arguments to pass to the handler.
	 *     Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	function subscribeAll(handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(this._worldId, hemi.dispatch.WILDCARD, handler,
			opt_func, opt_args);
	}

	/*
	 * Remove the given MessageTarget for Messages of the specified type for the Citizen.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove from the Dispatch
	 * @param {string} opt_type optional message type the MessageTarget was registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	function unsubscribe(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: this._worldId,
			msg: opt_type
		});
	}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Get the base class that the specified Citizen class was created from. This can be useful if
	 * you want to extend functionality and create a new Citizen class yourself.
	 * 
	 * @param {string} clsName name of the Citizen class
	 * @return {function} the base class constructor or undefined
	 */
	hemi.getBaseClass = function(clsName) {
		return baseClasses[clsName];
	};

	/**
	 * Take the given base class constructor and create a new class from it that has all of the
	 * required functionality of a Citizen.
	 *  
	 * @param {function} clsCon constructor function for the base class
	 * @param {string} clsName name for the new Citizen class
	 * @param {Object} opts options including:
	 *     cleanup - function to execute for cleanup
	 *     toOctane - array of properties for octaning or function to execute
	 * @return {function} the constructor for the new Citizen class
	 */
	hemi.makeCitizen = function(clsCon, clsName, opts) {
		opts = opts || {};
		baseClasses[clsName] = clsCon;

		var cleanFunc = opts.cleanup;

		/*
		 * A Citizen is a uniquely identifiable member of a World that is able to send Messages
		 * through the World's dispatch. The Citizen's id is all that is necessary to retrieve the
		 * Citizen from its World, regardless of its type.
		 */
		function Citizen() {
			clsCon.apply(this, arguments);

			/*
			 * The name of the Citizen.
			 * @type string
			 * @default ''
			 */
			this.name = this.name || '';
			/* The unique identifier for any Citizen of the World */
			this._worldId = null;
			hemi.world.addCitizen(this);
		}

		// Populate our constructed prototype object
		Citizen.prototype = clsCon.prototype;

        /*
		 * Send a cleanup Message and remove the Citizen from the World. Base classes should extend
		 * this so that it removes all references to the Citizen.
		 */
		Citizen.prototype.cleanup = function() {
			this.send(hemi.msg.cleanup, {});

			if (cleanFunc) {
				cleanFunc.apply(this, arguments);
			}

			hemi.dispatch.removeSpecs({
				src: this._worldId
			}, true);
			hemi.dispatch.removeTargets({
				handler: this
			}, true);
			hemi.world.removeCitizen(this);
		};

        Citizen.prototype._getId = _getId;
        Citizen.prototype._setId = _setId;
        Citizen.prototype.send = send;
        Citizen.prototype.subscribe = subscribe;
        Citizen.prototype.subscribeAll = subscribeAll;
        Citizen.prototype.unsubscribe = unsubscribe;

        // Enforce the constructor to be what we expect
        Citizen.constructor = Citizen;

		if (Citizen.prototype._msgSent) {
			Citizen.prototype._msgSent.push(hemi.msg.cleanup);
		}

        hemi.makeOctanable(Citizen, clsName, opts.toOctane || []);
        createClass(Citizen, clsName);

        return Citizen;
	};

	/**
	 * @namespace A module for managing all elements of a 3D world. The World manages a set of
	 * Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};

	/**
	 * Add the given Citizen to the World and give it a world id if it does not already have one.
	 * 
	 * @param {Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen._getId();

		if (id === null) {
			id = this.getNextId();
			citizen._setId(id);
		}

		var toRemove = citizens.get(id);

		if (toRemove !== null) {
			console.log('Citizen with id ' + id + ' already exists.');
			toRemove.cleanup();
		}

		citizens.put(id, citizen);
	};

	/**
	 * Check the next id that will be assigned without incrementing the World's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a Citizen
	 */
	hemi.world.checkNextId = function() {
		return nextId;
	};

	/**
	 * Perform cleanup on the World and release all resources. This effectively resets the World.
	 */
	hemi.world.cleanup = function() {
		hemi.resetLoadTasks();
		hemi.send(hemi.msg.worldCleanup, {});

		citizens.each(function(key, value) {
			value.cleanup();
		});

		if (citizens.size() > 0) {
			console.log('World cleanup did not remove all citizens.');
		}

		nextId = 1;
	};

	/**
	 * Get any AnimationGroups with the given attributes. If no attributes are given, all
	 * AnimationGroups will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.AnimationGroup): boolean} opt_filter optional filter function that
	 *     takes a AnimationGroup and returns true if the AnimationGroup should be included in the
	 *     returned array
	 * @return {hemi.AnimationGroup[]} an array of AnimationGroups with matching attributes
	 */
	hemi.world.getAnimationGroups = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.AnimationGroup.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Audio with the given attributes. If no attributes are given, all Audio will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Audio): boolean} opt_filter optional filter function that takes an
	 *     Audio and returns true if the Audio should be included in the returned array
	 * @return {hemi.Audio[]} an array of Audio with matching attributes
	 */
	hemi.world.getAudio = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Audio.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any CameraCurves with the given attributes. If no attributes are given, all CameraCurves
	 * will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.CameraCurve): boolean} opt_filter optional filter function that takes a
	 *     CameraCurve and returns true if the CameraCurve should be included in the returned array
	 * @return {hemi.CameraCurve[]} an array of CameraCurves with matching attributes
	 */
	hemi.world.getCamCurves = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.CameraCurve.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get the Citizen with the given id and log an error if exactly one result is not returned.
	 * 
	 * @param {number} id world id of the Citizen to get
	 * @return {Citizen} the found Citizen or null
	 */
	hemi.world.getCitizenById = function(id) {
		var cit = citizens.get(id);

		if (cit === null) {
			console.log('Tried to get Citizen with id ' + id + ', returned null.');
		}

		return cit;
	};

	/**
	 * Get any Citizens with the given attributes. If no attributes are given, all Citizens will be
	 * returned. Note that you can give an array of values for an attribute and it will search for
	 * Citizens with attributes that match any one of those values.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(Citizen): boolean} opt_filter optional filter function that takes a Citizen
	 *     and returns true if the Citizen should be included in the returned array
	 * @return {Citizen[]} an array of Citizens with matching attributes
	 */
	hemi.world.getCitizens = function(attributes, opt_filter) {
		var matches = citizens.query(attributes || {});

		if (opt_filter) {
			for (var i = 0, il = matches.length; i < il; ++i) {
				if (!opt_filter(matches[i])) {
					matches.splice(i, 1);
					--i;
					--il;
				}
			}
		}

		return matches;
	};

	/**
	 * Get any HudDisplays with the given attributes. If no attributes are given, all HudDisplays
	 * will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.HudDisplay): boolean} opt_filter optional filter function that takes a
	 *     HudDisplay and returns true if the HudDisplay should be included in the returned array
	 * @return {hemi.HudDisplay[]} an array of HudDisplays with matching attributes
	 */
	hemi.world.getHudDisplays = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.HudDisplay.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Meshes with the given attributes. If no attributes are given, all Meshes will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Mesh): boolean} opt_filter optional filter function that takes a Mesh
	 *     and returns true if the Mesh should be included in the returned array
	 * @return {hemi.Mesh[]} an array of Meshes with matching attributes
	 */
	hemi.world.getMeshes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Mesh.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Models with the given attributes. If no attributes are given, all Models will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Model): boolean} opt_filter optional filter function that takes a Model
	 *     and returns true if the Model should be included in the returned array
	 * @return {hemi.Model[]} an array of Models with matching attributes
	 */
	hemi.world.getModels = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Model.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get the next id to assign and increment the World's nextId token.
	 * 
	 * @return {number} the next id ready to assign to a Citizen
	 */
	hemi.world.getNextId = function() {
		return nextId++;
	};

	/**
	 * Get any particle effects with the given attributes. If no attributes are given, all particle
	 * effects will be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.ParticleEmitter): boolean} opt_filter optional filter function that
	 *     takes a particle effect and returns true if the particle effect should be included in the
	 *     returned array
	 * @return {hemi.ParticleEmitter[]} an array of particle effects with matching attributes
	 */
	hemi.world.getParticleEffects = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.ParticleEmitter.prototype._citizenType;
		var retVal = this.getCitizens(attributes, opt_filter);

		attributes._citizenType = hemi.ParticleBurst.prototype._citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		attributes._citizenType = hemi.ParticleTrail.prototype._citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));

		return retVal; 
	};

	/**
	 * Get any Shapes with the given attributes. If no attributes are given, all Shapes will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Shape): boolean} opt_filter optional filter function that takes a Shape
	 *     and returns true if the Shape should be included in the returned array
	 * @return {hemi.Shape[]} an array of Shapes with matching attributes
	 */
	hemi.world.getShapes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Shape.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any States with the given attributes. If no attributes are given, all States will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.State): boolean} opt_filter optional filter function that takes a State
	 *     and returns true if the State should be included in the returned array
	 * @return {hemi.State[]} an array of States with matching attributes
	 */
	hemi.world.getStates = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.State.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Timers with the given attributes. If no attributes are given, all Timers will be
	 * returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Timer): boolean} opt_filter optional filter function that takes a Timer
	 *     and returns true if the Timer should be included in the returned array
	 * @return {hemi.Timer[]} an array of Timers with matching attributes
	 */
	hemi.world.getTimers = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Timer.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Transforms with the given attributes. If no attributes are given, all Transforms will
	 * be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Transform): boolean} opt_filter optional filter function that takes a
	 *     Transform and returns true if the Transform should be included in the returned array
	 * @return {hemi.Transform[]} an array of Transforms with matching attributes
	 */
	hemi.world.getTransforms = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Transform.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Get any Viewpoints with the given attributes. If no attributes are given, all Viewpoints will
	 * be returned.
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {function(hemi.Viewpoint): boolean} opt_filter optional filter function that takes a
	 *     Viewpoint and returns true if the Viewpoint should be included in the returned array
	 * @return {hemi.Viewpoint[]} an array of Viewpoints with matching attributes
	 */
	hemi.world.getViewpoints = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes._citizenType = hemi.Viewpoint.prototype._citizenType;
		return this.getCitizens(attributes, opt_filter);
	};

	/**
	 * Remove the given Citizen from the World.
	 * 
	 * @param {Citizen} citizen the Citizen to remove
	 * @return {boolean} true if the Citizen was found and removed
	 */
	hemi.world.removeCitizen = function(citizen) {
		var id = citizen._getId(),
			removed = citizens.remove(id);

		if (removed === null) {
			console.log('Unable to remove Citizen with id ' + id);
		}

		return removed !== null;
	};

	/**
	 * Set the id for the World to assign to the next Citizen.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.world.setNextId = function(id) {
		nextId = id;
	};

	/**
	 * Get the Octane structure for the World.
     * 
	 * @param {function(Citizen): boolean} opt_filter optional filter function that takes a Citizen
	 *     and returns true if the Citizen should be included in the returned Octane
     * @return {Object} the Octane structure representing the World
	 */
	hemi.world.toOctane = function(opt_filter) {
		var octane = {
			version: hemi.version,
			nextId: nextId,
			citizens: []
		};

		citizens.each(function(key, value) {
			var accept = opt_filter ? opt_filter(value) : true;

			if (accept) {
				var oct = value._toOctane();

				if (oct !== null) {
					octane.citizens.push(oct);
				} else {
					console.log('Null Octane returned by Citizen with id ' + value._getId());
				}
			}
		});

		octane.dispatch = hemi.dispatch._toOctane();
		return octane;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Set the given class constructor function to the given namespace. For example:
	 * createClass(myClass, 'my.new.Class');
	 * will make my.new.Class equal myClass
	 * 
	 * @param {function():void} clsCon class constructor function
	 * @param {string} clsName fully qualified class name
	 */
	function createClass(clsCon, clsName) {
		var names = clsName.split('.'),
			il = names.length - 1,
			scope = window;

		for (var i = 0; i < il; ++i) {
			var name = names[i];

			if (!scope[name]) {
				scope[name] = {};
			}

			scope = scope[name];
		}

		scope[names[il]] = clsCon;
	}

})();
