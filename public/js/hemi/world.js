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
	
	var createClass = function(clsCon, clsName) {
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
		},
        
		/*
		 * Get the Citizen's id.
		 * 
		 * @return {number} the id
		 */        
        _getId = function() {
        	return this._worldId;
        },
		
		/*
		 * Set the Citizen's id.
		 * 
		 * @param {number} id the id to set
		 */
        _setId = function(id) {
        	var oldId = this._worldId;
			this._worldId = id;
			
			if (oldId !== null) {
				hemi.world.citizens.remove(oldId);
				hemi.world.citizens.put(id, this);
			}
        },
	
		/*
		 * Send a Message with the given attributes from the Citizen to any
		 * registered MessageTargets.
		 * 
		 * @param {string} type type of Message
		 * @param {Object} data container for any and all information relevant
		 *        to the Message
		 */
		send = function(type, data) {
			hemi.dispatch.postMessage(this, type, data);
		},
	
		/*
		 * Register the given handler to receive Messages of the specified type
		 * from the Citizen. This creates a MessageTarget.
		 * 
		 * @param {string} type type of Message to handle
		 * @param {Object} handler either a function or an object
		 * @param {string} opt_func name of the function to call if handler is
		 *     an object
		 * @param {string[]} opt_args optional array of names of arguments to
		 *     pass to the handler. Otherwise the entire Message is just passed
		 *     in.
		 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
		 */
		subscribe = function(type, handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this._worldId, type, handler,
				opt_func, opt_args);
		},
	
		/*
		 * Register the given handler to receive Messages of all types from the
		 * Citizen. This creates a MessageTarget.
		 * 
		 * @param {Object} handler either a function or an object
		 * @param {string} opt_func name of the function to call if handler is
		 *     an object
		 * @param {string[]} opt_args optional array of names of arguments to
		 *     pass to the handler. Otherwise the entire Message is just passed
		 *     in.
		 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
		 */
		subscribeAll = function(handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this._worldId, hemi.dispatch.WILDCARD,
				handler, opt_func, opt_args);
		},
	
		/*
		 * Remove the given MessageTarget for Messages of the specified type for
		 * the Citizen.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
		 *     remove from the Dispatch
		 * @param {string} opt_type Message type the MessageTarget was
		 *     registered for
		 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
		 *     null
		 */
		unsubscribe = function(target, opt_type) {
			return hemi.dispatch.removeTarget(target, {
				src: this._worldId,
				msg: opt_type
			});
		};
	
	/**
	 * Take the given base class constructor and create a new class from it that
	 * has all of the required functionality of a Citizen.
	 *  
	 * @param {function} clsCon constructor function for the base class
	 * @param {string} clsName name for the new Citizen class
	 * @param {Object} opts options including:
	 *     cleanup - function to execute for cleanup
	 *     msgs - array of messages Citizen may send
	 *     toOctane - array of properties for octaning or function to execute
	 * @return {function} the constructor for the new Citizen class
	 */
	hemi.makeCitizen = function(clsCon, clsName, opts) {
		opts = opts || {};
		var cleanFunc = opts.cleanup,
			msgs = opts.msgs || [hemi.msg.cleanup];
		
		/*
		 * A Citizen is a uniquely identifiable member of a World that is
		 * able to send Messages through the World's dispatch. The Citizen's id is
		 * all that is necessary to retrieve the Citizen from its World, regardless
		 * of its type.
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
		 * Array of Hemi Messages that the Citizen is known to send.
		 * @type string[]
		 */
        Citizen.prototype._msgSent = msgs;
        
        /*
		 * Send a cleanup Message and remove the Citizen from the World.
		 * Base classes should extend this so that it removes all references to
		 * the Citizen.
		 */
        Citizen.prototype.cleanup = function() {
        	this.send(hemi.msg.cleanup, {});
        	
        	if (cleanFunc) {
        		cleanFunc.apply(this, arguments);
        	}

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
        
        hemi.makeOctanable(Citizen, clsName, opts.toOctane);
        createClass(Citizen, clsName);
        
        return Citizen;
	};
	
	/**
	 * @namespace A module for managing all elements of a 3D world. The World
	 * manages a set of Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};
	
	hemi.world.WORLD_ID = 0;
	
	/* The next id to assign to a Citizen requesting a world id */
	var nextId = 1;
	
	/* All of the Citizens of the World */
	hemi.world.citizens = new hemi.utils.Hashtable();
	
	/**
	 * Set the id for the World to assign to the next Citizen.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.world.setNextId = function(id) {
		nextId = id;
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
	 * Check to see what the next id to assign will be without incrementing the
	 * World's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a Citizen
	 */
	hemi.world.checkNextId = function() {
		return nextId;
	};
	
	/**
	 * Get the id for the World.
	 * 
	 * @return {number} the id of the World
	 */
	hemi.world._getId = function() {
		return hemi.world.WORLD_ID;
	};
	
	/**
	 * Add the given Citizen to the World and give it a world id if it does not
	 * already have one.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen._getId();
		
		if (id == null) {
			id = this.getNextId();
			citizen._setId(id);
		}
		
		var toRemove = this.citizens.get(id);
		
		if (toRemove !== null) {
			hemi.console.log('Citizen with id ' + id + ' already exists.', hemi.console.ERR);
			toRemove.cleanup();
		}
		
		this.citizens.put(id, citizen);
	};
	
	/**
	 * Remove the given Citizen from the World.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to remove
	 * @return {boolean} true if the Citizen was found and removed
	 */
	hemi.world.removeCitizen = function(citizen) {
		var id = citizen._getId();
		var removed = this.citizens.remove(id);
		
		if (removed === null) {
			hemi.console.log('Unable to remove Citizen with id ' + id, hemi.console.WARN);
		}
		
		return removed !== null;
	};
	
	/**
	 * Get any Citizens with the given attributes. If no attributes are given,
	 * all Citizens will be returned. Valid attributes are:
	 * - name
	 * - citizenType
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Citizen): boolean} opt_filter optional filter function
	 *     that takes a Citizen and returns true if the Citizen should be
	 *     included in the returned array
	 * @return {hemi.world.Citizen[]} an array of Citizens with matching
	 *     attributes
	 */
	hemi.world.getCitizens = function(attributes, opt_filter) {
		var atts = {};
		
		if (attributes != undefined) {
			if (attributes.worldId !== undefined) {
				atts.worldId = attributes.worldId;
			}
			if (attributes.name !== undefined) {
				atts.name = attributes.name;
			}
			if (attributes.citizenType !== undefined) {
				atts.citizenType = attributes.citizenType;
			}
		}
		
		var matches = this.citizens.query(atts);
		
		if (opt_filter) {
			for (var ndx = 0, len = matches.length; ndx < len; ndx++) {
				if (!opt_filter(matches[ndx])) {
					matches.splice(ndx, 1);
					ndx--;
					len--;
				}
			}
		}
		
		return matches;
	};
	
	/**
	 * Get the Citizen with the given id and log an error if exactly one result
	 * is not returned.
	 * 
	 * @param {number} id world id of the Citizen to get
	 * @return {hemi.world.Citizen} the found Citizen or null
	 */
	hemi.world.getCitizenById = function(id) {
		var cit = this.citizens.get(id);
		
		if (cit === null) {
			hemi.console.log('Tried to get Citizen with id ' + id + ', returned null.', hemi.console.ERR);
		}
		
		return cit;
	};
	
	/**
	 * Get any Audio with the given attributes. If no attributes are given, all
	 * Audio will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Audio): boolean} opt_filter optional filter function
	 *     that takes an Audio and returns true if the Audio should be included
	 *     in the returned array
	 * @return {hemi.audio.Audio[]} an array of Audio with matching attributes
	 */
	hemi.world.getAudio = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.audio.Audio.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any CameraCurves with the given attributes. If no attributes are
	 * given, all CameraCurves will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(CameraCurve): boolean} opt_filter optional filter
	 *     function that takes a CameraCurve and returns true if the CameraCurve
	 *     should be included in the returned array
	 * @return {hemi.view.CameraCurve[]} an array of CameraCurves with matching
	 *     attributes
	 */
	hemi.world.getCamCurves = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.view.CameraCurve.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any HudDisplays with the given attributes. If no attributes are
	 * given, all HudDisplays will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(HudDisplay): boolean} opt_filter optional filter
	 *     function that takes a HudDisplay and returns true if the HudDisplay
	 *     should be included in the returned array
	 * @return {hemi.hud.HudDisplay[]} an array of HudDisplays with matching
	 *     attributes
	 */
	hemi.world.getHudDisplays = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.hud.HudDisplay.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any HudElements with the given attributes. If no attributes are
	 * given, all HudElements will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(HudElement): boolean} opt_filter optional filter
	 *     function that takes a HudElement and returns true if the HudElement
	 *     should be included in the returned array
	 * @return {hemi.hud.HudElement[]} an array of HudElements with matching
	 *     attributes
	 */
	hemi.world.getHudElements = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.hud.HudElement.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Models with the given attributes. If no attributes are given, all
	 * Models will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Model): boolean} opt_filter optional filter function
	 *     that takes a Model and returns true if the Model should be included
	 *     in the returned array
	 * @return {hemi.model.Model[]} an array of Models with matching attributes
	 */
	hemi.world.getModels = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.model.Model.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
    
	/**
	 * Get any Animations with the given attributes. If no attributes are given,
	 * all Animations will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Animation): boolean} opt_filter optional filter function
	 *     that takes a Animation and returns true if the Animation should be
	 *     included in the returned array
	 * @return {hemi.animation.Animation[]} an array of Animations with matching
	 *     attributes
	 */
    hemi.world.getAnimations = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.animation.Animation.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
    
	/**
	 * Get any Effects with the given attributes. If no attributes are given,
	 * all Effects will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Effect): boolean} opt_filter optional filter function
	 *     that takes a Effect and returns true if the Effect should be
	 *     included in the returned array
	 * @return {hemi.effect.Effect[]} an array of Effect with matching
	 *     attributes
	 */
    hemi.world.getEffects = function(attributes, opt_filter) {
		var retVal = [];
		
		attributes = attributes || {};
		attributes.citizenType = hemi.effect.Emitter.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));
		
		attributes.citizenType = hemi.effect.Burst.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));
		
		attributes.citizenType = hemi.effect.Trail.prototype.citizenType;
		retVal = retVal.concat(this.getCitizens(attributes, opt_filter));
		
		return retVal; 
	};
	
	/**
	 * Get any Viewpoints with the given attributes. If no attributes are given,
	 * all Viewpoints will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Viewpoint): boolean} opt_filter optional filter function
	 *     that takes a Viewpoint and returns true if the Viewpoint should be
	 *     included in the returned array
	 * @return {hemi.view.Viewpoint[]} an array of Viewpoints with matching
	 *     attributes
	 */
	hemi.world.getViewpoints = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.view.Viewpoint.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any PressureEngines with the given attributes. If no attributes are
	 * given, all PressureEngines will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(PressureEngine): boolean} opt_filter optional filter
	 *     function that takes a PressureEngine and returns true if the
	 *     PressureEngine should be included in the returned array
	 * @return {hext.engines.PressureEngine[]} an array of PressureEngines with
	 *     matching attributes
	 */
	hemi.world.getPressureEngines = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hext.engines.PressureEngine.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Draggables with the given attributes. If no attributes are given,
	 * all Draggables will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Draggable): boolean} opt_filter optional filter function
	 *     that takes a Draggable and returns true if the Draggable should be
	 *     included in the returned array
	 * @return {hemi.manip.Draggable[]} an array of Draggables with matching
	 *     attributes
	 */
	hemi.world.getDraggables = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.manip.Draggable.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Turnables with the given attributes. If no attributes are given,
	 * all Turnables will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Turnable): boolean} opt_filter optional filter function
	 *     that takes a Turnable and returns true if the Turnable should be
	 *     included in the returned array
	 * @return {hemi.manip.Turnable[]} an array of Turnables with matching
	 *     attributes
	 */
	hemi.world.getTurnables = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.manip.Turnable.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Rotators with the given attributes. If no attributes are given,
	 * all Rotators will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Rotator): boolean} opt_filter optional filter function
	 *     that takes a Rotator and returns true if the Rotator should be
	 *     included in the returned array
	 * @return {hemi.motion.Rotator[]} an array of Rotators with matching
	 *     attributes
	 */
	hemi.world.getRotators = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.motion.Rotator.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Scenes with the given attributes. If no attributes are given, all
	 * Scenes will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Scene): boolean} opt_filter optional filter function
	 *     that takes a Scene and returns true if the Scene should be included
	 *     in the returned array
	 * @return {hemi.scene.Scene[]} an array of Scenes with matching attributes
	 */
	hemi.world.getScenes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.scene.Scene.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Timers with the given attributes. If no attributes are given, all
	 * Timers will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Timer): boolean} opt_filter optional filter function
	 *     that takes a Timer and returns true if the Timer should be included
	 *     in the returned array
	 * @return {hemi.time.Timer[]} an array of Timers with matching attributes
	 */
	hemi.world.getTimers = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.time.Timer.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Translators with the given attributes. If no attributes are
	 * given, all Translators will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Translator): boolean} opt_filter optional filter
	 *     function that takes a Translator and returns true if the Translator
	 *     should be included in the returned array
	 * @return {hemi.motion.Translator[]} an array of Translators with matching
	 *     attributes
	 */
	hemi.world.getTranslators = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.motion.Translator.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get any Shapes with the given attributes. If no attributes are given, all
	 * Shapes will be returned. Valid attributes are:
	 * - name
	 * - worldId
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {function(Shape): boolean} opt_filter optional filter function
	 *     that takes a Shape and returns true if the Shape should be included
	 *     in the returned array
	 * @return {hemi.shape.Shape[]} an array of Shapes with matching attributes
	 */
	hemi.world.getShapes = function(attributes, opt_filter) {
		attributes = attributes || {};
		attributes.citizenType = hemi.shape.Shape.prototype.citizenType;
		return this.getCitizens(attributes, opt_filter);
	};
	
	/**
	 * Get the owning Citizen that the given transform is a part of.
	 * 
	 * @param {o3d.Transform} transform the transform to get the owner for
	 * @return {hemi.world.Citizen} the containing Citizen or null
	 */
	hemi.world.getTranOwner = function(transform) {
		var param = transform.getParam('ownerId'),
			owner = null;
		
		if (param !== null) {
			owner = this.getCitizenById(param.value);
		}
		
		return owner;
	};
	
	return hemi;
})(hemi || {});
