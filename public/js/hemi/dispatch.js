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

		/* All of the MessageSpecs (and MessageTargets) in the Dispatch */
	var msgSpecs = new hemi.utils.Hashtable(),

		/* The next id to assign to a MessageTarget */
		nextId = 0;

////////////////////////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @namespace A module for message dispatching and handling. The Dispatch receives Messages and
	 * sends them to MessageTargets that are registered with MessageSpecs.
	 */
	hemi.dispatch = hemi.dispatch || {};

	/**
	 * String literal to indicate that all entries for a field are desired.
	 * @constant
	 */
	hemi.dispatch.WILDCARD = '*';

	/** 
	  * First part of an argument string indicating it is an id for the actual argument desired.
	  * @constant
	  * @example
	  * 'id:12' will execute: hemi.world.getCitizenById(12);
	  */ 
	hemi.dispatch.ID_ARG = 'id:';

	/** 
	  * First part of an argument string indicating it should be used to parse the actual message
	  * structure passed to the handler.
	  * @constant
	  * @example
	  * 'msg:data.shape.name' will parse: message.data.shape.name
	  */ 
	hemi.dispatch.MSG_ARG = 'msg:';

////////////////////////////////////////////////////////////////////////////////////////////////////
// Message class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A Message is sent whenever an event occurs.
	 */
	var Message = function() {
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

	hemi.dispatch.Message = Message;

////////////////////////////////////////////////////////////////////////////////////////////////////
// MessageSpec class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A MessageSpec specifies a certain Message type and source and
	 * contains a set of MessageTargets that have registered to receive Messages
	 * with matching specs.
	 */
	var MessageSpec = function() {
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

	/*
	 * Octane properties for MessageSpec.
	 * @type string[]
	 */
	MessageSpec.prototype._octane = function() {
		var targetsOct = [];

		for (var i = 0, il = this.targets.length; i < il; ++i) {
			var oct = this.targets[i]._toOctane();

			if (oct !== null) {
				targetsOct.push(oct);
			} else {
				console.log('Null Octane returned by MessageTarget');
			}
		}

		return [
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
	};

	/**
	 * Register the given MessageTarget with the MessageSpec.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the target to add
	 */
	MessageSpec.prototype.addTarget = function(target) {
		if (this.targets.indexOf(target) !== -1) {
			console.log('MessageSpec already contains MessageTarget');
		}

		this.targets.push(target);
	};

	/**
	 * Clean up the MessageSpec so all references in it are removed.
	 */
	MessageSpec.prototype.cleanup = function() {
		for (var i = 0, il = this.targets.length; i < il; ++i) {
			this.targets[i].cleanup();
		}

		this.targets = [];
	};

	/**
	 * Remove the given MessageTarget from the MessageSpec.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the target to remove
	 * @return {hemi.dispatch.MessageTarget} the removed target or null
	 */
	MessageSpec.prototype.removeTarget = function(target) {
		var found = null,
			ndx = this.targets.indexOf(target);

		if (ndx !== -1) {
			found = this.targets.splice(ndx, 1)[0];
		} else {
			console.log('MessageTarget not found in MessageSpec');
		}

		return found;
	};

	/**
	 * Get the unique hash key for the MessageSpec.
	 * 
	 * @return {string} the hash key
	 */
	MessageSpec.prototype.getHash = function() {
		return this.msg + this.src;
	};

	hemi.dispatch.MessageSpec = MessageSpec;
	hemi.makeOctanable(hemi.dispatch.MessageSpec, 'hemi.dispatch.MessageSpec',
		hemi.dispatch.MessageSpec.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// MessageTarget class
////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * @class A MessageTarget registers with a MessageSpec to receive Messages that match its
	 * attributes.
	 * @example
	 * A MessageTarget with the following values:
	 * handler = myObj;
	 * func = 'myFunction';
	 * args = ['msg:src', 12];
	 * 
	 * will execute:
	 * myObj.myFunction(message.src, 12);
	 */
	var MessageTarget = function() {
		/**
		 * The id of the MessageTarget.
		 * @type number
		 */
		this._dispatchId = null;

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

	/*
	 * Octane properties for MessageSpec.
	 * @type string[]
	 */
	MessageTarget.prototype._octane = function() {
		if (!this.handler._getId) {
			console.log('Handler object in MessageTarget can not be saved to Octane');
			return null;
		}

		var names = ['_dispatchId', 'name', 'func', 'args'],
			props = [
				{
					name: 'handler',
					id: this.handler._getId()
				}
			];
		
		for (var i = 0, il = names.length; i < il; ++i) {
			var name = names[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		return props;
	};

	/**
	 * Clean up the MessageTarget so all references in it are removed.
	 */
	MessageTarget.prototype.cleanup = function() {
		this.handler = null;
	};

	hemi.dispatch.MessageTarget = MessageTarget;
	hemi.makeOctanable(hemi.dispatch.MessageTarget, 'hemi.dispatch.MessageTarget',
		hemi.dispatch.MessageTarget.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Get the Octane structure for the Dispatch.
     *
     * @return {Object} the Octane structure representing the MessageDispatcher
	 */
	hemi.dispatch._toOctane = function() {
		var octane = {
			nextId: nextId,
			ents: []
		};

		msgSpecs.each(function(key, value) {
			var oct = value._toOctane();

			if (oct !== null) {
				octane.ents.push(oct);
			} else {
				console.log('Null Octane returned by MessageSpec');
			}
		});

		return octane;
	};

	/**
	 * Check to see what the next id to assign will be without incrementing the Dispatch's nextId
	 * token.
	 * 
	 * @return {number} the next id that will be assigned to a MessageTarget
	 */
	hemi.dispatch.checkNextId = function() {
		return nextId;
	};

	/**
	 * Empty the MessageSpec database of all entries.
	 */
	hemi.dispatch.cleanup = function() {
		msgSpecs.each(function(key, value) {
			value.cleanup();
		});

		msgSpecs.clear();
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
	 * Get any MessageSpecs with the given attributes. If no attributes are given, all MessageSpecs
	 * will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of MessageSpecs with matching attributes
	 */
	hemi.dispatch.getSpecs = function(attributes, wildcards) {
		var specs;

		if (attributes === undefined) {
			specs = msgSpecs.values();
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

			specs = msgSpecs.query(atts);
		}

		return specs;
	};

	/**
	 * Get the MessageSpec with the given source id and Message type. If wildcards are allowed,
	 * search for wildcard sources and types as well. This is much faster than getSpecs.
	 * 
	 * @param {number} src id of the Message originator to search for
	 * @param {string} type type of Message to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results
	 * @return {hemi.dispatch.MessageSpec[]} an array of found MessageSpecs
	 */
	hemi.dispatch.getSpecsFast = function(src, msg, wildcards) {
		var specs = [],
			hash = msg + src,
			spec = msgSpecs.get(hash);

		if (spec !== null) {
			specs.push(spec);
		}

		if (wildcards) {
			var wildSrc = src === hemi.dispatch.WILDCARD;

			if (!wildSrc) {
				hash = msg + hemi.dispatch.WILDCARD;
				spec = msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}
			}
			if (msg !== hemi.dispatch.WILDCARD) {
				hash = hemi.dispatch.WILDCARD + src;
				spec = msgSpecs.get(hash);
				if (spec !== null) {
					specs.push(spec);
				}

				if (!wildSrc) {
					hash = hemi.dispatch.WILDCARD + hemi.dispatch.WILDCARD;
					spec = msgSpecs.get(hash);
					if (spec !== null) {
						specs.push(spec);
					}
				}
			}
		}

		return specs;
	};

	/**
	 * Get any MessageTargets registered with the given attributes. If no attributes are given, all
	 * MessageTargets will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} an array of MessageTargets registered with matching
	 *     attributes
	 */
	hemi.dispatch.getTargets = function(attributes, wildcards) {
		var specs = this.getSpecs(attributes, wildcards),
			results = [],
			dispatchId,
			name,
			handler;

		if (attributes !== undefined) {
			dispatchId = attributes._dispatchId;
			name = attributes.name;
			handler = attributes.handler;
		}

		for (var i = 0, il = specs.length; i < il; ++i) {
			var targets = specs[i].targets;

			for (var j = 0, jl = targets.length; j < jl; ++j) {
				var result = targets[j],
					add = true;
				
				if (dispatchId !== undefined) {
					add = result._dispatchId === dispatchId;
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
	 * Get the MessageSpec that the given MessageTarget is currently registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to get
	 *     the MessageSpec for
	 * @return {hemi.dispatch.MessageSpec} the found MessageSpec or null
	 */
	hemi.dispatch.getTargetSpec = function(target) {
		var specs = this.getSpecs(),
			dispatchId = target._dispatchId;

		for (var i = 0, il = specs.length; i < il; ++i) {
			var spec = specs[i],
				targets = spec.targets;
			
			for (var j = 0, jl = targets.length; j < jl; ++j) {
				if (targets[j]._dispatchId === dispatchId) {
					return spec;
				}
			}
		}

		return null;
	};

    /**
	 * Load the given MessageSpec entries into the MessageSpec database.
	 * 
	 * @param {hemi.dispatch.MessageSpec[]} entries MessageSpecs to load into the Dispatch
	 */
	hemi.dispatch.loadEntries = function(entries) {
		for (var i = 0, il = entries.length; i < il; ++i) {
			var entry = entries[i];
			msgSpecs.put(entry.getHash(), entry);
		}
	};

	/**
	 * Create a Message from the given attributes and send it to all MessageTargets with matching
	 * source id and message type.
	 * 
	 * @param {hemi.world.Citizen} src the Message originator
	 * @param {string} msg type of Message to send
	 * @param {Object} data container for any and all information relevant to the Message
	 */
	hemi.dispatch.postMessage = function(src, msg, data) {
		var message = new hemi.dispatch.Message(),
			id = src._getId();

		message.src = src;
		message.msg = msg;
		message.data = data;

		var specs = this.getSpecsFast(id, msg, true);

		for (var i = 0, il = specs.length; i < il; ++i) {
			// Make a local copy of the array in case it gets modified while
			// sending the message (such as a MessageHandler unsubscribes itself
			// or another one as part of its handle).
			var targets = specs[i].targets.slice(0);
			
			for (var j = 0, jl = targets.length; j < jl; ++j) {
				var msgTarget = targets[j],
					args, func;
				
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
	 * Setup a MessageTarget with the given attributes and register it to receive Messages.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @param {Object} handler either a function that will take the Message as a parameter, or an
	 *     object that will receive it
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array to specify arguments to pass to opt_func. Otherwise
	 *     the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.dispatch.registerTarget = function(src, msg, handler, opt_func, opt_args) {
		var spec = createSpec(src, msg),
			msgTarget = new hemi.dispatch.MessageTarget();

		msgTarget._dispatchId = this.getNextId();
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
	 * Remove any MessageSpecs with the given attributes from the dispatch.
	 * Valid attributes are:
	 * - src
	 * - msg
	 * 
	 * @param {Object} attributes optional structure with the attributes to
	 *     search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be
	 *     included in the search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageSpec[]} an array of removed MessageSpecs
	 */
	hemi.dispatch.removeSpecs = function(attributes, wildcards) {
		var specs = hemi.dispatch.getSpecs(attributes, wildcards),
			removed = [],
			spec;

		for (var i = 0, il = specs.length; i < il; ++i) {
			spec = msgSpecs.remove(specs[i].getHash());
			if (spec) removed.push(spec);
		}

		return removed;
	};

	/**
	 * Remove the given MessageTarget from the dispatch.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove
	 * @param {Object} opt_attributes optional structure with MessageSpec attributes to search for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.dispatch.removeTarget = function(target, opt_attributes) {
		var specs = this.getSpecs(opt_attributes, false),
			removed = null;

		for (var i = 0, il = specs.length; i < il; ++i) {
			var spec = specs[i];
			removed = spec.removeTarget(target);

			if (removed !== null) {
				break;
			}
		}

		if (removed === null) {
			console.log('MessageTarget was not found and therefore not removed');
		}

		return removed;
	};

	/**
	 * Remove any MessageTargets registered with the given attributes. If no attributes are given,
	 * all MessageTargets will be returned. Valid attributes are:
	 * - src
	 * - msg
	 * - dispatchId
	 * - name
	 * - handler
	 * 
	 * @param {Object} attributes optional structure with the attributes to search for
	 * @param {boolean} wildcards flag indicating if wildcard values should be included in the
	 *     search results (only needed if attributes is set)
	 * @return {hemi.dispatch.MessageTarget[]} array of removed MessageTargets
	 */
	hemi.dispatch.removeTargets = function(attributes, wildcards) {
		var specs = this.getSpecs(attributes, wildcards),
			results = [],
			dispatchId,
			name,
			handler;

		if (attributes !== undefined) {
			dispatchId = attributes._dispatchId;
			name = attributes.name;
			handler = attributes.handler;
		}

		for (var i = 0, il = specs.length; i < il; ++i) {
			var spec = specs[i],
				targets = spec.targets;

			for (var j = 0, jl = targets.length; j < jl; ++j) {
				var result = targets[j],
					remove = true;

				if (dispatchId !== undefined) {
					remove = result._dispatchId === dispatchId;
				}
				if (remove && name !== undefined) {
					remove = result.name === name;
				}
				if (remove && handler !== undefined) {
					remove = result.handler === handler;
				}

				if (remove) {
					spec.removeTarget(result);
					results.push(result);
				}
			}
		}

		return results;
	};

	/**
	 * Set the id for the Dispatch to assign to the next MessageTarget.
	 * 
	 * @param {number} id the next id to assign
	 */
	hemi.dispatch.setNextId = function(id) {
		nextId = id;
	};

	/**
	 * Remove the given MessageTarget from its current MessageSpec and register it with the given
	 * specifications.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to register
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 */
	hemi.dispatch.setTargetSpec = function(target, src, msg) {
		var spec = this.getTargetSpec(target);

		if (spec !== null) {
			spec.removeTarget(target);
		} else {
			console.log('Previous MessageSpec for MessageTarget not found');
		}

		spec = createSpec(src, msg);
		spec.addTarget(target);
	};

	/**
	 * Create an array of arguments from the given array of parameter strings. A string starting
	 * with 'id:' indicates the world id for a Citizen to retrieve. A string starting with 'msg:'
	 * indicates a period-delimited string of attributes to parse from within message. Otherwise the
	 * argument is passed through unmodified.
	 * For example:
	 * 'id:12' will fetch hemi.world.getCitizens({worldId:12})
	 * 'msg:data.shape.name' will parse message.data.shape.name
	 * 
	 * @param {hemi.dispatch.Message} message the Message to parse data from
	 * @param {Object[]} params the list of parameters to create arguments from
	 * @return {Object[]} array of arguments created
	 */
	hemi.dispatch.getArguments = function(message, params) {
		var args = [];

		for (var i = 0, il = params.length; i < il; ++i) {
			var param = params[i];

			if (typeof param != 'string') {
				args[i] = param;
			} else if (param.substring(0, 3) === hemi.dispatch.ID_ARG) {
				var id = parseInt(param.substring(3), 10);
				args[i] = hemi.world.getCitizenById(id);
			} else if (param.substring(0, 4) === hemi.dispatch.MSG_ARG) {
				var tokens = param.substring(4).split('.'),
					arg = message;

				for (var j = 0, jl = tokens.length; arg != null && j < jl; ++j) {
					arg = arg[tokens[j]];
				}

				args[i] = arg;
			} else {
				args[i] = param;
			}
		}

		return args;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Wildcard functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	// Anonymous source
	var anon = {
		_getId: function() {
			return hemi.dispatch.WILDCARD;
		}
	};

	/**
	 * Utility function to reset the contents of the dispatch. This should typically not be used.
	 * 
	 * @param {hemi.utils.Hashtable} opt_specs optional set of new MessageSpecs for the dispatch
	 * @return {hemi.utils.Hashtable} the previous set of MessageSpecs in the dispatch
	 */
	hemi._resetMsgSpecs = function(opt_specs) {
		var oldSpecs = msgSpecs;
		msgSpecs = opt_specs || new hemi.utils.Hashtable();
		return oldSpecs;
	};

	/**
	 * Send a Message with the given attributes from an anonymous wildcard source to any registered
	 * MessageTargets.
	 * 
	 * @param {string} type type of Message
	 * @param {Object} data container for any and all information relevant to the Message
	 */
	hemi.send = function(type, data) {
		hemi.dispatch.postMessage(anon, type, data);
	};

	/**
	 * Register the given handler to receive Messages of the specified type from any source. This
	 * creates a MessageTarget.
	 * 
	 * @param {string} type type of Message to handle
	 * @param {Object} handler either a function or an object
	 * @param {string} opt_func name of the function to call if handler is an object
	 * @param {string[]} opt_args optional array of names of arguments to pass to the handler.
	 *     Otherwise the entire Message is just passed in.
	 * @return {hemi.dispatch.MessageTarget} the created MessageTarget
	 */
	hemi.subscribe = function(type, handler, opt_func, opt_args) {
		return hemi.dispatch.registerTarget(hemi.dispatch.WILDCARD, type, handler, opt_func,
			opt_args);
	};

	/**
	 * Remove the given MessageTarget for the specified Message type. Note that this removes a
	 * MessageTarget registered with the wildcard as the source id. It does not remove the
	 * MessageTarget from any Citizens it may be directly registered with.
	 * 
	 * @param {hemi.dispatch.MessageTarget} target the MessageTarget to remove from the Dispatch
	 * @param {string} opt_type Message type the MessageTarget was registered for
	 * @return {hemi.dispatch.MessageTarget} the removed MessageTarget or null
	 */
	hemi.unsubscribe = function(target, opt_type) {
		return hemi.dispatch.removeTarget(target, {
			src: hemi.dispatch.WILDCARD,
			msg: opt_type
		});
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the MessageSpec with the given attributes or create one if it does not already exist.
	 * 
	 * @param {number} src id of the Message originator to handle Messages for
	 * @param {string} msg type of Message to handle
	 * @return {hemi.dispatch.MessageSpec} the created/found MessageSpec
	 */
	function createSpec(src, msg) {
		var specs = hemi.dispatch.getSpecsFast(src, msg, false),
			spec;

		if (specs.length === 0) {
			spec = new hemi.dispatch.MessageSpec();
			spec.src = src;
			spec.msg = msg;
			msgSpecs.put(spec.getHash(), spec);
		} else {
			if (specs.length > 1) {
				console.log('Found ' + specs.length + ' MessageSpecs with the same src and msg.');
			}

			spec = specs[0];
		}

		return spec;
	}

})();
