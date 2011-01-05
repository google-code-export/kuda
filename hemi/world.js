o3djs.require('hemi.core');
o3djs.require('hemi.dispatch');
o3djs.require('hemi.input');
o3djs.require('hemi.msg');
o3djs.require('hemi.picking');
o3djs.require('hemi.view');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for managing all elements of a 3D world. The World
	 * manages a set of Citizens and provides look up services for them.
	 */
	hemi.world = hemi.world || {};
	
	/* The reserve ids, which belong to Hemi library modules */
	var reserveIds = 50;
	hemi.world.WORLD_ID = 0;
	hemi.world.AUDIO_ID = 1;
	
	/* The next id to assign to a Citizen requesting a world id */
	var nextId = reserveIds;
	
	/*
	 * Create a loader that will:
	 * 1) Send out a ready message once all resources are loaded.
	 * 2) Replace itself with a loader that will call this function again when
	 *    the World is cleaned up.
	 */
	var createWorldLoader = function() {
		return hemi.core.loader.createLoader(function() {
			// Reset the loader so that the other modules can continue
			// loading things after the World has been initialized.
			hemi.world.loader = hemi.core.loader.createLoader(function() {
				hemi.console.log('Backup world loader is finished.');
			});
			
			hemi.world.send(hemi.msg.ready, {});
		});
	};
	
	/*
	 * Get the library module with the given reserve id.
	 * 
	 * @param {number} id the id of the module to get
	 * @return {Object} the matching module or null
	 */
	var getReserve = function(id) {
		var reserve;
		
		switch(id) {
			case hemi.world.WORLD_ID:
				reserve = hemi.world;
				break;
			case hemi.world.AUDIO_ID:
				reserve = hemi.audio;
				break;
			default:
				reserve = null;
		}
		
		return reserve;
	}
	
	/**
	 * @class A Citizen is a uniquely identifiable member of a World that is
	 * able to send Messages through the World's dispatch. The Citizen's id is
	 * all that is necessary to retrieve the Citizen from its World, regardless
	 * of its type.
	 */
	hemi.world.Citizen = function() {
		/**
		 * The name of the Citizen.
		 * @type string
		 * @default ''
		 */
		this.name = '';
		/* The unique identifier for any Citizen of the World */
		this.worldId = null;
		hemi.world.addCitizen(this);
	};
	
	hemi.world.Citizen.prototype = {
        /**
         * Essentially a class name for Citizens.
         * @type string
         */
        citizenType: 'hemi.world.Citizen',
		
		/**
		 * Array of Hemi Messages that the Citizen is known to send.
		 * @type string[]
		 */
		msgSent: [
			hemi.msg.cleanup
		],
		
		/**
		 * Get the Citizen's type (similar to class in Java).
		 * 
		 * @return {string} the type
		 */
		getCitizenType: function() {
			return this.citizenType;
		},
		
		/**
		 * Set the Citizen's type (similar to class in Java).
		 * 
		 * @param {string} type the type to set
		 */
		setCitizenType: function(type) {
			this.citizenType = type;
		},
		
		/**
		 * Get the Citizen's id.
		 * 
		 * @return {number} the id
		 */
		getId: function() {
			return this.worldId;
		},
		
		/**
		 * Set the Citizen's id.
		 * 
		 * @param {number} id the id to set
		 */
		setId: function(id) {
			var oldId = this.worldId;
			this.worldId = id;
			
			if (oldId !== null) {
				hemi.world.citizens.remove(oldId);
				hemi.world.citizens.put(id, this);
			}
		},
		
		/**
		 * Send a cleanup Message and remove the Citizen from the World.
		 * Subclasses should extend this so that it removes all references to
		 * the Citizen.
		 */
		cleanup: function() {
			this.send(hemi.msg.cleanup, {});
			hemi.world.removeCitizen(this);
		},
		
		/**
		 * Receive the given transform from the TransformRegistry.
		 * 
		 * @param {o3d.Transform} transform the transform
		 */
		receiveTransform: function(transform) {
			hemi.console.log('Transform ignored by Citizen with id ' + this.worldId, hemi.console.WARN);
		},
		
		/**
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
		subscribe: function(type, handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this.worldId, type, handler,
				opt_func, opt_args);
		},
		
		/**
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
		subscribeAll: function(handler, opt_func, opt_args) {
			return hemi.dispatch.registerTarget(this.worldId, hemi.dispatch.WILDCARD,
				handler, opt_func, opt_args);
		},
		
		/**
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
		unsubscribe: function(target, opt_type) {
			return hemi.dispatch.removeTarget(target, {
				src: this.worldId,
				msg: opt_type
			});
		},
		
		/**
		 * Send a Message with the given attributes from the Citizen to any
		 * registered MessageTargets.
		 * 
		 * @param {string} type type of Message
		 * @param {Object} data container for any and all information relevant
		 *        to the Message
		 */
		send: function(type, data) {
			hemi.dispatch.postMessage(this, type, data);
		},
		
	    /**
	     * Get the Octane structure for the Citizen. The structure returned is:
	     * <pre>
	     * {
	     *     id: the Citizen's world id
	     *     type: the Citizen's type
	     *     props: the Citizen's properties (name and id/value)
	     *     init: a function of the Citizen to execute after it is loaded 
	     * }
	     * </pre>
	     *
	     * @return {Object} the Octane structure representing the Citizen
	     */
		toOctane: function() {
			var octane = {
				id: this.worldId,
				type: this.citizenType,
				props: []
			};
			
			if (this.name.length > 0) {
	            octane.props.push({
	                name: 'name',
	                val: this.name
	            });
			}
			
			return octane;
		}
	};
	
	/**
	 * @class A TransformOwner contains a Citizen that owns at least one
	 * transform and entries of other Citizens that need to be given any of
	 * those transforms as they become available during Octane loading.
	 */
	hemi.world.TransformOwner = function() {
		this.citizen = null;
		this.entries = new Hashtable();
		this.toLoad = null;
	};
	
	hemi.world.TransformOwner.prototype = {
		/**
		 * Distribute the transforms of the owning Citizen to any other Citizens
		 * that have registered interest in those transforms.
		 */
		distribute: function() {
			if (this.toLoad !== null) {
				this.load();
			}
			
			this.entries.each(function(key, value) {
				var tran = value.transform,
					targets = value.targets;
				
				for (var i = 0, il = targets.length; i < il; i++) {
					targets[i].receiveTransform(tran);
				}
			});
		},
		
		/**
		 * Get the entry for the given transform or create one if it does not
		 * already exist.
		 * 
		 * @param {o3d.Transform} transform the transform to get the entry for
		 * @return {Object} the fetched or created entry
		 */
		getEntry: function(transform) {
			var entry = this.entries.get(transform.name);
			
			if (entry === null) {
				entry = {
					transform: transform,
					targets: []
				};
				this.entries.put(transform.name, entry);
			}
			
			return entry;
		},
		
		/**
		 * Load the entries restored from Octane into the TransformOwner.
		 */
		load: function() {
			var citizen = this.citizen,
				toLoad = this.toLoad;
			
			for (var i = 0, il = toLoad.length; i < il; i++) {
				var ent = toLoad[i],
					transform = citizen.getTransform(ent.name),
					entry = this.getEntry(transform),
					tIds = ent.tIds;
				
				for (var j = 0, jl = tIds.length; j < jl; j++) {
					var target = hemi.world.getCitizenById(tIds[j]);
					entry.targets.push(target);
				}
			}
			
			this.toLoad = null;
		},
		
		/**
		 * Register the given Citizen to receive the given transform when it
		 * becomes available during Octane loading.
		 * 
		 * @param {o3d.Transform} transform the transform to give
		 * @param {hemi.world.Citizen} target the Citizen to receive it
		 */
		register: function(transform, target) {
			var entry = this.getEntry(transform),
				ndx = entry.targets.indexOf(target);
			
			if (ndx === -1) {
				entry.targets.push(target);
			}
		},
		
	    /**
	     * Get the Octane structure for the TransformOwner.
	     *
	     * @return {Object} the Octane structure representing the TransformOwner
	     */
		toOctane: function() {
			var octane = {
					type: 'hemi.world.TransformOwner',
					props: [{
						name: 'citizen',
						id: this.citizen.getId()
					}]
				},
				ents = [];
			
			this.entries.each(function(key, value) {
				var targets = value.targets,
					targs = [];
				
				for (var i = 0, il = targets.length; i < il; i++) {
					targs.push(targets[i].getId());
				}
				
				ents.push({
					name: key,
					tIds: targs
				});
			});
			
			octane.props.push({
				name: 'toLoad',
				val: ents
			});
			
			return octane;
		},
		
		/**
		 * Remove the entry for the given Citizen and transform.
		 * 
		 * @param {o3d.Transform} transform the transform in the entry
		 * @param {hemi.world.Citizen} target the Citizen in the entry
		 */
		unregister: function(transform, target) {
			var entry = this.getEntry(transform),
				ndx = entry.targets.indexOf(target);
			
			if (ndx !== -1) {
				entry.targets.splice(ndx, 1);
				
				if (entry.targets.length === 0) {
					this.entries.remove(transform.name);
				}
			}
		}
	};
	
	/**
	 * @class A TransformRegistry maintains listings of which transforms to
	 * distribute to which Citizens as they become available during Octane
	 * loading. This is necessary because transforms are not proper Citizens.
	 */
	hemi.world.TransformRegistry = function() {
		this.owners = new Hashtable();
		this.toLoad = null;
	};
	
	hemi.world.TransformRegistry.prototype = {
		/**
		 * Distribute the transforms of the given Citizen to any other Citizens
		 * that have registered interest in those transforms.
		 * 
		 * @param {hemi.world.Citizen} citizen the Citizen to distribute
		 *     transforms for
		 */
		distribute: function(citizen) {
			if (this.toLoad !== null) {
				this.load();
			}
			
			var owner = this.owners.get(citizen.getId());
			
			if (owner !== null) {
				owner.distribute();
			}
		},
		
		/**
		 * Get the TransformOwner entry for the given Citizen or create one if
		 * it does not already exist.
		 * 
		 * @param {hemi.world.Citizen} citizen the Citizen to get the entry for
		 * @return {hemi.world.TransformOwner} the fetched or created entry
		 */
		getOwner: function(citizen) {
			var id = citizen.getId(),
				owner = this.owners.get(id);
			
			if (owner === null) {
				owner = new hemi.world.TransformOwner();
				owner.citizen = citizen;
				this.owners.put(id, owner);
			}
			
			return owner;
		},
		
		/**
		 * Load the entries restored from Octane into the TransformRegistry.
		 */
		load: function() {
			var toLoad = this.toLoad;
			
			for (var i = 0, il = toLoad.length; i < il; i++) {
				var owner = toLoad[i];
				this.owners.put(owner.citizen.getId(), owner);
			}
			
			this.toLoad = null;
		},
		
		/**
		 * Register the given Citizen to receive the given transform when it
		 * becomes available during Octane loading.
		 * 
		 * @param {o3d.Transform} transform the transform to give
		 * @param {hemi.world.Citizen} target the Citizen to receive it
		 */
		register: function(transform, target) {
			var id = transform.getParam('ownerId').value,
				citizen = hemi.world.getCitizenById(id),
				owner = this.getOwner(citizen);
			
			owner.register(transform, target);
		},
		
	    /**
	     * Get the Octane structure for the TransformRegistry.
	     *
	     * @return {Object} the Octane structure representing the TransformRegistry
	     */
		toOctane: function() {
			var octane = {
					type: 'hemi.world.TransformRegistry',
					props: []
				},
				oct = [];
			
			this.owners.each(function(key, value) {
				oct.push(value.toOctane());
			});
			
			octane.props.push({
				name: 'toLoad',
				oct: oct
			});
			
			return octane;
		},
		
		/**
		 * Remove the entry for the given Citizen and transform.
		 * 
		 * @param {o3d.Transform} transform the transform in the entry
		 * @param {hemi.world.Citizen} target the Citizen in the entry
		 */
		unregister: function(transform, target) {
			var id = transform.getParam('ownerId').value,
				citizen = hemi.world.getCitizenById(id),
				owner = this.getOwner(citizen);
			
			owner.unregister(transform, target);
			
			if (owner.entries.length === 0) {
				this.owners.remove(id);
			}
		}
	};
	
	/* All of the Citizens of the World */
	hemi.world.citizens = new hemi.utils.Hashtable();
	/* The loader used to load resources */
	hemi.world.loader = null;
	/* Array of callbacks for when a new World Camera is set */
	hemi.world.camCallbacks = [];
	/* A handler that consumes pick Messages rather than passing them on */
	hemi.world.pickGrabber = null;
	/* The registry of transforms to distribute to Citizens at Octane loading */
	hemi.world.tranReg = new hemi.world.TransformRegistry();
	/* Fog properties for the World */
	hemi.world.fog = null;
	
	/**
	 * Array of Hemi Messages that the World is known to send.
	 * @type string[]
	 */
	hemi.world.msgSent = [
		hemi.msg.cleanup,
		hemi.msg.pick,
		hemi.msg.ready
	],
	
	/**
	 * The Camera that provides a view of the World.
	 * @type hemi.view.Camera
	 */
	hemi.world.camera = null;
	
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
	hemi.world.getId = function() {
		return hemi.world.WORLD_ID;
	};
	
	/**
	 * Get the Octane structure for the World.
     * 
     * @return {Object} the Octane structure representing the World
	 */
	hemi.world.toOctane = function() {
		var octane = {
			citizens: [],
			nextId: nextId,
			camera: this.camera.getId(),
			fog: this.fog,
			dispatch: hemi.dispatch.toOctane(),
			tranReg: this.tranReg.toOctane()
		};
		
		this.citizens.each(function(key, value) {
			var oct = value.toOctane();
			
			if (oct !== null) {
				octane.citizens.push(oct);
			} else {
				hemi.console.log('Null Octane returned by Citizen with id ' + value.getId(), hemi.console.WARN);
			}
		});
		
		return octane;
	};
	
	/**
	 * Activate the World once all resources are loaded. This function should
	 * only be called after all scripting and setup is complete.
	 */
	hemi.world.ready = function() {
		// Allow any potential loading to finish, then send an Init message
		this.loader.finish();
	};
	
	/**
	 * Perform cleanup on the World and release all resources. This effectively
	 * resets the World.
	 */
	hemi.world.cleanup = function() {
		this.send(hemi.msg.cleanup, {});
		this.loader.finish();
		this.loader = createWorldLoader();
		
		if (this.fog !== null) {
			this.clearFog();
		}
		
		this.citizens.each(function(key, value) {
			value.cleanup();
		});
		
		if (this.citizens.size() > 0) {
			hemi.console.log('World cleanup did not remove all citizens.', hemi.console.ERR);
		}
		
		// Set the World's attributes back to their initial values.
		nextId = reserveIds;
		this.camera = null;
		this.setCamera(new hemi.view.Camera());
		this.pickGrabber = null;
	};
	
	/**
	 * Try to perform a pick when there is a 'mouse down' event.
	 * 
	 * @param {o3d.Event} mouseEvent the 'mouse down' event
	 */
	hemi.world.onMouseDown = function(mouseEvent) {
		var pickInfo = hemi.picking.getPickInfo(mouseEvent);
		
		if (pickInfo) {				
			if (this.pickGrabber != null) {
				this.pickGrabber.onPick(pickInfo);
			} else {
		        this.send(
					hemi.msg.pick,
					{
						mouseEvent: mouseEvent,
						pickInfo: pickInfo
					});
			}
		}
	};
	
	/**
	 * Add the given function to the list of callbacks for when a new Camera is
	 * set for the World.
	 * 
	 * @param {function(hemi.view.Camera):void} callback function to execute
	 */
	hemi.world.addCamCallback = function(callback) {
		if (this.camCallbacks.indexOf(callback) === -1) {
			this.camCallbacks.push(callback);
		}
	};
	
	/**
	 * Remove the given function from the list of callbacks for when a new
	 * Camera is set for the World.
	 * 
	 * @param {function(hemi.view.Camera):void} callback function to remove
	 */
	hemi.world.removeCamCallback = function(callback) {
		var ndx = this.camCallbacks.indexOf(callback);
		
		if (ndx !== -1) {
			this.camCallbacks.splice(ndx, 1);
		}
	};
	
	/**
	 * Register the given handler as the 'pick grabber'. The pick grabber
	 * intercepts pick messages and prevents them from being passed to other
	 * handlers. It should be used if the user enters an 'interaction mode' that
	 * overrides default behavior.
	 * 
	 * @param {Object} grabber an object that implements onPick()
	 */
	hemi.world.setPickGrabber = function(grabber) {
		this.pickGrabber = grabber;
	};
	
	/**
	 * Remove the current 'pick grabber'. Allow pick messages to continue being
	 * passed to the other registered handlers.
	 * 
	 * @return {Object} the removed grabber or null
	 */
	hemi.world.removePickGrabber = function() {
		var grabber = this.pickGrabber;
		this.pickGrabber = null;

		return grabber;
	};
	
	/**
	 * Set the Camera for the World.
	 * 
	 * @param {hemi.view.Camera} camera the Camera to use
	 */
	hemi.world.setCamera = function(camera) {
		if (this.camera) {
			this.camera.cleanup();
		}
		
		this.camera = camera;
		
		if (camera !== null) {
			camera.name = 'World Cam';
			
			for (var i = 0, il = this.camCallbacks.length; i < il; i++) {
				this.camCallbacks[i](camera);
			}
		}
	};
	
	/**
	 * Add the given Citizen to the World and give it a world id if it does not
	 * already have one.
	 * 
	 * @param {hemi.world.Citizen} citizen the Citizen to add
	 */
	hemi.world.addCitizen = function(citizen) {
		var id = citizen.getId();
		
		if (id == null) {
			id = this.getNextId();
			citizen.setId(id);
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
		var id = citizen.getId();
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
				if (attributes.worldId < reserveIds) {
					// They are looking for a reserve, not a Citizen.
					return getReserve(attributes.worldId);
				}
				
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
		var cit;
		
		if (id < reserveIds) {
			cit = getReserve(id);
		} else {
			cit = this.citizens.get(id);
		}
		
		if (cit === null) {
			hemi.console.log('Tried to get Citizen with id ' + id + ', returned null.', hemi.console.ERR);
		}
		
		return cit;
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
			owner = this.getCitizenById(param.value);
		
		return owner;
	};
	
	/**
	 * Send a Message with the given attributes from the World to any registered
	 * MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.world.send = function(type, data) {
		hemi.dispatch.postMessage(hemi.world, type, data);
	};
	
	/**
	 * Register the given handler to receive Messages of the specified type
	 * from the World. This creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an
	 *     object
	 * @param {string[]} opt_args optional array of names of arguments to pass
	 *     to the handler. Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.world.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.world.WORLD_ID, type, handler,
			opt_func, opt_args);
	};
	
	/**
	 * Remove the given MessageTarget for Messages of the specified type for the
	 * World.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove
	 *     from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was registered
	 *     for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
	 *     null
	 */
	hemi.world.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.world.WORLD_ID,
			msg: opt_type
		});
	};
	
	/** 
	 * Clear fog from this world.
	 */
	hemi.world.clearFog = function() {
		var color = hemi.view.defaultBG;
			start = this.camera.clip.far;
			end = start + 10;
		
		this.setFog(color, start, end);
		this.fog = null;
	};
	
	/** 
	 * Add fog to this world.
	 *
	 * @param {float[4]} color The rgba color of the fog
	 * @param {float} start The distance at which the fog starts
	 * @param {float} end The distance at which the fog is fully opaque
	 */
	hemi.world.setFog = function(color,start,end) {
		var mats = [];
		var models = hemi.world.getModels();
		for (var i = 0; i < models.length; i++) {
			mats = mats.concat(models[i].materials);
		}
		mats= mats.concat(hemi.core.mainPack.getObjectsByClassName('o3d.Material'));
		for (i = 0; i < mats.length; i++) {
			hemi.fx.addFog(mats[i],{color:color,start:start,end:end});
		}
		hemi.view.setBGColor(color);
		
		this.fog = {
			color: color,
			start: start,
			end: end
		};
	};
	
	/**
	 * Setup the initial World.
	 */
	hemi.world.init = function() {
		// Clean up 'fake' Citizens created by inheritance mechanism
		hemi.world.citizens.clear();
		nextId = reserveIds;
		hemi.world.loader = createWorldLoader();
		hemi.world.setCamera(new hemi.view.Camera());
		hemi.input.addMouseDownListener(this);
	};
	
	return hemi;
})(hemi || {});
