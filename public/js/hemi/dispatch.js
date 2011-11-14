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
	 * @namespace A module for message dispatching and handling. The Dispatch
	 * receives Messages and sends them to MessageTargets that are registered
	 * with MessageSpecs.
	 */
	hemi.dispatch = hemi.dispatch || {};
	
	/* The next id to assign to a MessageTarget */
	var nextId = 0;
	
	/**
	 * String literal to indicate that all entries for a field are desired.
	 * @constant
	 */
	hemi.dispatch.WILDCARD = '*';
	
	/** 
	  * First part of an argument string indicating it is an id for the actual
	  * argument desired.
	  * @constant
	  * @example
	  * 'id:12' will execute: hemi.world.getCitizenById(12);
	  */ 
	hemi.dispatch.ID_ARG = 'id:';
	
	/** 
	  * First part of an argument string indicating it should be used to parse
	  * the actual message structure passed to the handler.
	  * @constant
	  * @example
	  * 'msg:data.shape.name' will parse: message.data.shape.name
	  */ 
	hemi.dispatch.MSG_ARG = 'msg:';
	
	/**
	 * @class A Message is sent whenever an event occurs.
	 */
	hemi.dispatch.Message = function() {
		/**
		 * The Message originator.
		 * @type hemi.world.Citizen
		 */
		this.src = null;
		
		/**
		 * The type of the Message.
		 * @type string
		 */
		this.msg = null;
		
		/**
		 * Container for any and all Message data.
		 * @type Object
		 */
		this.data = {};
	};
	
	/**
	 * @class A MessageSpec specifies a certain Message type and source and
	 * contains a set of MessageTargets that have registered to receive Messages
	 * with matching specs.
	 */
	hemi.dispatch.MessageSpec = function() {
		/**
		 * The id of the Message originator to handle Messages from. This can
		 * also be hemi.dispatch.WILDCARD to match all source ids.
		 * @type number
		 */
		this.src = null;
		
		/**
		 * The type of Message to handle. This can also be
		 * hemi.dispatch.WILDCARD to match all Message types.
		 * @type string
		 */
		this.msg = null;
		
		/**
		 * The MessageTargets to pass Messages with matching source ids and
		 * types.
		 * @type hemi.dispatch.MessageTarget[]
		 */
		this.targets = [];
	};
	
	hemi.dispatch.MessageSpec.prototype = {
		/**
		 * Clean up the MessageSpec so all references in it are removed.
		 */
		cleanup: function() {
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				this.targets[ndx].cleanup();
			}
			
			this.targets = [];
		},
		
		/**
		 * Get the Octane structure for the MessageSpec.
	     *
	     * @return {Object} the Octane structure representing the MessageSpec
		 */
		toOctane: function() {
			var targetsOct = [];
			
			for (var ndx = 0, len = this.targets.length; ndx < len; ndx++) {
				var oct = this.targets[ndx].toOctane();
				
				if (oct !== null) {
					targetsOct.push(oct);
				} else {
					hemi.console.log('Null Octane returned by MessageTarget', hemi.console.ERR);
				}
			}
			
			var props = [
				{
					name: 'src',
					val: this.src
				},{
					name: 'msg',
					val: this.msg
				},{
					name: 'targets',
					oct: targetsOct
				}
			];
			
			var octane = {
				type: 'hemi.dispatch.MessageSpec',
				props: props
			};
			
			return octane;
		},
		
		/**
		 * Register the given MessageTarget with the MessageSpec.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the target to add
		 */
		addTarget: function(target) {
			if (this.targets.indexOf(target) != -1) {
				hemi.console.log('MessageSpec already contains MessageTarget', hemi.console.WARN);
			}
			
			this.targets.push(target);
		},
		
		/**
		 * Remove the given MessageTarget from the MessageSpec.
		 * 
		 * @param {hemi.dispatch.MessageTarget} target the target to remove
		 * @return {hemi.dispatch.MessageTarget} the removed target or null
		 */
		removeTarget: function(target) {
			var found = null,
				ndx = this.targets.indexOf(target);
			
			if (ndx != -1) {
				var spliced = this.targets.splice(ndx, 1);
				
				if (spliced.length === 1) {
					found = spliced[0];
				}
			} else {
				hemi.console.log('MessageTarget not found in MessageSpec', hemi.console.WARN);
			}
	        
	        return found;
		},
		
		/**
		 * Get the unique hash key for the MessageSpec.
		 * 
		 * @return {string} the hash key
		 */
		getHash: function() {
			return this.msg + this.src;
		}
	};
	
	/**
	 * @class A MessageTarget registers with a MessageSpec to receive Messages
	 * that match its attributes.
	 * @example
	 * A MessageTarget with the following values:
	 * handler = myObj;
	 * func = 'myFunction';
	 * args = ['msg:src', 12];
	 * 
	 * will execute:
	 * myObj.myFunction(message.src, 12);
	 */
	hemi.dispatch.MessageTarget = function() {
		/**
		 * The id of the MessageTarget.
		 * @type number
		 */
		this.dispatchId = null;
		
		/**
		 * The name of the MessageTarget.
		 * @type string
		 * @default ''
		 */
		this.name = '';
		
		/**
		 * The handler for Messages passed through a MessageSpec. It may be an
		 * object or function.
		 * @type Object || function
		 */
		this.handler = null;
		
		/**
		 * The name of the object function to call if handler is an object.
		 * @type string
		 */
		this.func = null;
		
		/**
		 * Optional array to specify arguments to pass to the handler. Otherwise
		 * just pass it the Message.
		 * @type string[]
		 */
		this.args = null;
	};
	
	hemi.dispatch.MessageTarget.prototype = {
		/**
		 * Clean up the MessageTarget so all references in it are removed.
		 */
		cleanup: function() {
			this.handler = null;
		},
		
		/**
		 * Get the Octane structure for the MessageTarget.
	     *
	     * @return {Object} the Octane structure representing the MessageTarget
		 */
		toOctane: function() {
			if (!this.handler._getId) {
				hemi.console.log('Handler object in MessageTarget can not be saved to Octane', hemi.console.WARN);
				return null;
			}
			
			var names = ['dispatchId', 'name', 'func', 'args'],
				props = [{
					name: 'handler',
					id: this.handler._getId()
				}];
			
			for (var ndx = 0, len = names.length; ndx < len; ndx++) {
				var name = names[ndx];
				
				props.push({
					name: name,
					val: this[name]
				});
			}
			
			var octane = {
				type: 'hemi.dispatch.MessageTarget',
				props: props
			};
			
			return octane;
		}
	};
	
	/* All of the MessageSpecs (and MessageTargets) in the Dispatch */
	hemi.dispatch.msgSpecs = new hemi.utils.Hashtable();
	
	/**
	 * Set the id for the Dispatch to assign to the next MessageTarget.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.dispatch.setNextId = function(id) {
		nextId = id;
	};
	
	/**
	 * Get the next id to assign and increment the Dispatch's nextId token.
	 * 
	 * @return {number} the next id ready to assign to a MessageTarget
	 */
	hemi.dispatch.getNextId = function() {
		return nextId++;
	};
	
	/**
	 * Check to see what the next id to assign will be without incrementing the
	 * Dispatch's nextId token.
	 * 
	 * @return {number} the next id that will be assigned to a MessageTarget
	 */
	hemi.dispatch.checkNextId = function() {
		return nextId;
	};
	
    /**
	 * Load the given MessageSpec entries into the MessageSpec database.
	 * 
	 * @param {hemi.dispatch.MessageSpec[]} entries MessageSpecs to load into
	 *     the Dispatch
	 */
	hemi.dispatch.loadEntries = function(entries) {
		for (var ndx = 0, len = entries.length; ndx < len; ndx++) {
			var entry = entries[ndx];
			this.msgSpecs.put(entry.getHash(), entry);
		}
	};
	
	/**
	 * Empty the MessageSpec database of all entries.
	 */
	hemi.dispatch.cleanup = function() {
		this.msgSpecs.each(function(key, value) {
			value.cleanup();
		});
		
		this.msgSpecs.clear();
	};
	
	/**
	 * Get the Octane structure for the Dispatch.
     *
     * @return {Object} the Octane structure representing the MessageDispatcher
	 */
	hemi.dispatch.toOctane = function() {
		var octane = {
			nextId: nextId,
			ents: []
		};
		
		this.msgSpecs.each(function(key, value) {
			var oct = value.toOctane();
			
			if (oct !== null) {
				octane.ents.push(oct);
			} else {
				hemi.console.log('Null Octane returned by MessageSpec', hemi.console.ERR);
			}
		});
		
		return octane;
	};
	
	/**
	 * Get any MessageSpecs with the given attributes. If no attributes are
	 * given, all MessageSpecs will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of MessageSpecs with
	 *     matching attributes
	 */
	hemi.dispatch.getSpecs = function(attributes, wildcards) {
		var specs;
		
		if (attributes === undefined) {
			specs = this.msgSpecs.values();
		} else {
			var atts = {};
			
			if (wildcards) {
				if (attributes.src !== undefined) {
					if (attributes.src === hemi.dispatch.WILDCARD) {
						atts.src = hemi.dispatch.WILDCARD;
					} else {
						atts.src = [attributes.src, hemi.dispatch.WILDCARD];
					}
				}
				if (attributes.msg !== undefined) {
					if (attributes.msg === hemi.dispatch.WILDCARD) {
						atts.msg = hemi.dispatch.WILDCARD;
					} else {
						atts.msg = [attributes.msg, hemi.dispatch.WILDCARD];
					}
				}
			} else {
				if (attributes.src !== undefined) {
					atts.src = attributes.src;
				}
				if (attributes.msg !== undefined) {
					atts.msg = attributes.msg;
				}
			}
			
			specs = this.msgSpecs.query(atts);
		}
		
		return specs;
	};
	
	/**
	 * Get the MessageSpec with the given source id and Message type. If
	 * wildcards are allowed, search for wildcard sources and types as well.
	 * This is much faster than getSpecs.
	 * 
	 * @param {number} src id of the Message originator to search for
	 * @param {string} type type of Message to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results
	 * @return {hemi.dispatch.MessageSpec[]} an array of found MessageSpecs
	 */
	hemi.dispatch.getSpecsFast = function(src, msg, wildcards) {
		var specs = [],
			hash = msg + src,
			spec = this.msgSpecs.get(hash);
		
		if (spec !== null) {
			specs.push(spec);
		}
		
		if (wildcards) {
			var wildSrc = src === hemi.dispatch.WILDCARD;
			
			if (!wildSrc) {
				hash = msg + hemi.dispatch.WILDCARD;
				spec = this.msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
			}
			if (msg !== hemi.dispatch.WILDCARD) {
				hash = hemi.dispatch.WILDCARD + src;
				spec = this.msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
				
				if (!wildSrc) {
					hash = hemi.dispatch.WILDCARD + hemi.dispatch.WILDCARD;
					spec = this.msgSpecs.get(hash);
					if (spec !== null) {
						specs.push(spec);
					}
				}
			}
		}
		
		return specs;
	};
	
	/**
	 * Get any MessageTargets registered with the given attributes. If no
	 * attributes are given, all MessageTargets will be returned. Valid
	 * attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} an array of MessageTargets
	 *     registered with matching attributes
	 */
	hemi.dispatch.getTargets = function(attributes, wildcards) {
		var specs = this.getSpecs(attributes, wildcards),
			results = [],
			dispatchId,
			name,
			handler;
		
		if (attributes !== undefined) {
			dispatchId = attributes.dispatchId;
			name = attributes.name;
			handler = attributes.handler;
		}
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var targets = specs[ndx].targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var result = targets[t];
				var add = true;
				
				if (dispatchId !== undefined) {
					add = result.dispatchId === dispatchId;
				}
				if (add && name !== undefined) {
					add = result.name === name;
				}
				if (add && handler !== undefined) {
					add = result.handler === handler;
				}
				
				if (add) {
					results.push(result);
				}
			}
		}
		
		return results;
	};
	
	/**
	 * Get the MessageSpec that the given MessageTarget is currently
	 * registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to get
	 *     the MessageSpec for
	 * @return {hemi.dispatch.MessageSpec} the found MessageSpec or null
	 */
	hemi.dispatch.getTargetSpec = function(target) {
		var specs = this.getSpecs(),
			dispatchId = target.dispatchId;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx],
				targets = spec.targets;
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				if (targets[t].dispatchId === dispatchId) {
					return spec;
				}
			}
		}
		
		return null;
	};
	
	/**
	 * Get the MessageSpec with the given attributes or create one if it does
	 * not already exist.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @return {hemi.dispatch.MessageSpec} the created/found MessageSpec
	 */
	hemi.dispatch.createSpec = function(src, msg) {
		var specs = this.getSpecsFast(src, msg, false),
			spec;
		
		if (specs.length === 0) {
			spec = new hemi.dispatch.MessageSpec();
			spec.src = src;
			spec.msg = msg;
			this.msgSpecs.put(spec.getHash(), spec);
		} else {
			if (specs.length > 1) {
				hemi.console.log('Found ' + specs.length + ' MessageSpecs with the same src and msg.', hemi.console.ERR);
			}
			
			spec = specs[0];
		}
		
		return spec;
	};
	
	/**
	 * Setup a MessageTarget with the given attributes and register it to
	 * receive Messages.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @param {Object} handler either a function that will take the Message as a
	 *     parameter, or an object that will receive it
	 * @param {string} opt_func name of the function to call if handler is an
	 *     object
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     opt_func. Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.dispatch.registerTarget = function(src, msg, handler, opt_func, opt_args) {
		var spec = this.createSpec(src, msg),
			msgTarget = new hemi.dispatch.MessageTarget();
		msgTarget.dispatchId = this.getNextId();
		msgTarget.handler = handler;
		
		if (opt_func) {
			msgTarget.func = opt_func;
		}
		if (opt_args) {
			msgTarget.args = opt_args;
		}
		
		spec.addTarget(msgTarget);
		return msgTarget;
	};
	
	/**
	 * Remove the given MessageTarget from the dispatch.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     remove
	 * @param {Object} opt_attributes optional structure with MessageSpec
	 *     attributes to search for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.dispatch.removeTarget = function(target, opt_attributes) {
		var specs = this.getSpecs(opt_attributes, false),
			removed = null;
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			var spec = specs[ndx];
			removed = spec.removeTarget(target);
			
			if (removed !== null) {
				break;
			}
		}
		
		if (removed === null) {
			hemi.console.log('MessageTarget was not found and therefore not removed', hemi.console.WARN);
		}
		
		return removed;
	};
	
	/**
	 * Remove the given MessageTarget from its current MessageSpec and register
	 * it with the given specifications.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     register
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 */
	hemi.dispatch.setTargetSpec = function(target, src, msg) {
		var spec = this.getTargetSpec(target);
		
		if (spec !== null) {
			spec.removeTarget(target);
		} else {
			hemi.console.log('Previous MessageSpec for MessageTarget not found', hemi.console.WARN);
		}
		
		spec = this.createSpec(src, msg);
		spec.addTarget(target);
	};
	
	/**
	 * Create a Message from the given attributes and send it to all
	 * MessageTargets with matching source id and message type.
	 * 
	 * @param {hemi.world.Citizen} src the Message originator
	 * @param {string} msg type of Message to send
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.dispatch.postMessage = function(src, msg, data) {
		var message = new hemi.dispatch.Message(),
			id = src._getId();
		message.src = src;
		message.msg = msg;
		message.data = data;
		
		var specs = this.getSpecsFast(id, msg, true);
		
		for (var ndx = 0, len = specs.length; ndx < len; ndx++) {
			// Make a local copy of the array in case it gets modified while
			// sending the message (such as a MessageHandler unsubscribes itself
			// or another one as part of its handle).
			var targets = specs[ndx].targets.slice(0);
			
			for (var t = 0, tLen = targets.length; t < tLen; t++) {
				var msgTarget = targets[t];
				var args, func;
				
				if (msgTarget.args !== null) {
					// Parse the specified arguments from the Message.
					args = this.getArguments(message, msgTarget.args);
				} else {
					// No arguments specified, so just pass the Message.
					args = [message];
				}
				
				if (msgTarget.func) {
					// The handler is an object. Use the specified function to
					// handle the Message.
					func = msgTarget.handler[msgTarget.func];
				}
				else {
					// The handler is a function. Just pass it the arguments.
					func = msgTarget.handler;
				}
				
				func.apply(msgTarget.handler, args);
			}
		}
	};

	/**
	 * Create an array of arguments from the given array of parameter strings. A
	 * string starting with 'id:' indicates the world id for a Citizen to
	 * retrieve. A string starting with 'msg:' indicates a period-delimited
	 * string of attributes to parse from within message. Otherwise the argument
	 * is passed through unmodified.
	 * For example:
	 * 'id:12' will fetch hemi.world.getCitizens({worldId:12})
	 * 'msg:data.shape.name' will parse message.data.shape.name
	 * 
	 * @param {hemi.dispatch.Message} message the Message to parse data from
	 * @param {Object[]} params the list of parameters to create arguments from
	 * @return {Object[]} array of arguments created
	 */
	hemi.dispatch.getArguments = function(message, params) {
		var arguments = [];
		
		for (var ndx = 0, len = params.length; ndx < len; ndx++) {
			var param = params[ndx];
			
			if (typeof param != 'string') {
				arguments[ndx] = param;
			} else if (param.substring(0,3) === hemi.dispatch.ID_ARG) {
				var id = parseInt(param.substring(3));
				arguments.push(hemi.world.getCitizenById(id));
			} else if (param.substring(0,4) === hemi.dispatch.MSG_ARG) {
				param = param.substring(4);
				var tokens = param.split('.');
				var arg = message;
				
				for (aNdx = 0, aLen = tokens.length; arg != null && aNdx < aLen; aNdx++) {
					arg = arg[tokens[aNdx]];
				}
				
				arguments.push(arg);
			} else {
				arguments[ndx] = param;
			}
		}
		
		return arguments;
	};

	// Wildcard functions
	var anon = {
		_getId: function() {
			return hemi.dispatch.WILDCARD;
		}
	};
	
	/**
	 * Send a Message with the given attributes from an anonymous wildcard
	 * source to any registered MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to
	 *     the Message
	 */
	hemi.send = function(type, data) {
		hemi.dispatch.postMessage(anon, type, data);
	};
	
	/**
	 * Register the given handler to receive Messages of the specified type
	 * from any source. This creates a MessageTarget.
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
	hemi.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.dispatch.WILDCARD, type,
			handler, opt_func, opt_args);
	};
	
	/**
	 * Remove the given MessageTarget for the specified Message type. Note
	 * that this removes a MessageTarget registered with the wildcard as the
	 * source id. It does not remove the MessageTarget from any Citizens it
	 * may be directly registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to
	 *     remove from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was
	 *     registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or
	 *     null
	 */
	hemi.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.dispatch.WILDCARD,
			msg: opt_type
		});
	};
	
	return hemi;
})(hemi || {});
