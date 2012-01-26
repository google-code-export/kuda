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
	 * Map of class names to stored class constructor functions.
	 */
	var constructors = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Restore the original object from the given Octane.
	 * 
	 * @param {Object} octane the structure containing information for creating the original object
	 * @return {Object} the created object
	 */
	hemi.fromOctane = function(octane) {
		var created = null;

		if (octane.type) {
			created = createObject(octane);
			setProperties(created, octane);
		} else {
			hemi.world.cleanup();

			var citizenCount = octane.citizens.length;

			// Set the nextId value to a negative number so that we don't have to worry about
			// overlapping world ids between the constructed Citizens and their actual ids that are
			// restored from Octane.
			hemi.world.setNextId(citizenCount * -2);

			// Do the bare minimum: create Citizens and set their ids
			for (var i = 0; i < citizenCount; ++i) {
				createObject(octane.citizens[i]);
			}

			// Now set the World nextId to its proper value.
			hemi.world.setNextId(octane.nextId);

			// Next set up the message dispatch
			var entryOctane = octane.dispatch.ents,
				entries = [];

			for (var i = 0, il = entryOctane.length; i < il; ++i) {
				var entry = createObject(entryOctane[i]);
				setProperties(entry, entryOctane[i]);
				entries.push(entry);
			}

			hemi.dispatch.loadEntries(entries);
			hemi.dispatch.setNextId(octane.dispatch.nextId);

			// Now set Citizen properties and resolve references to other Citizens
			for (var i = 0; i < citizenCount; ++i) {
				var citOctane = octane.citizens[i];
				setProperties(hemi.world.getCitizenById(citOctane.id), citOctane);
			}
		}

		return created;
	};

	/**
	 * Make the given class Octanable. This both enables it to be serialized and stores its
	 * constructor so it can be deserialized.
	 * 
	 * @param {function():void} clsCon the constructor function for the class
	 * @param {string} clsName the name of the class
	 * @param {Object} octProps either an array of names of properties to be saved to Octane or a
	 *     function that returns an array of Octane properties
	 */
	hemi.makeOctanable = function(clsCon, clsName, octProps) {
		octProps = octProps || [];
		constructors[clsName] = clsCon;

		/*
         * Essentially a class name.
         * @type string
         */
		clsCon.prototype._citizenType = clsName;

		/*
	     * Get the Octane structure for the class. The structure returned is:
	     * <pre>
	     * {
	     *     id: the Object's world id (optional)
	     *     type: the class name
	     *     props: the class properties (name and id/value) 
	     * }
	     * </pre>
	     * 
	     * @return {Object} the Octane structure representing the class
	     */
		clsCon.prototype._toOctane = function() {
			var props = hemi.utils.isFunction(octProps) ? octProps.call(this) : parseProps(this, octProps),
				octane = null;

			if (props !== null) {
				octane = {
					type: this._citizenType,
					props: props
				};

				if (this._worldId !== undefined) {
					octane.id = this._worldId;
				}

				if (this.name && this.name.length > 0 && !octane.props.name) {
					octane.props.unshift({
						name: 'name',
						val: this.name
					});
				}
			}

			return octane;
		};
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create an object from the given Octane structure and set its id. No other properties will be
	 * set yet.
	 * 
	 * @param {Object} octane the structure containing information for creating an object
	 * @return {Object} the newly created object
	 */
	function createObject(octane) {
		if (!octane.type) {
			alert("Unable to process octane: missing type");
			return null;
		}

		var con = constructors[octane.type],
			object = null;

		if (con) {
			object = new con();

			if (octane.id !== undefined) {
				object._setId(octane.id);
			}
		} else {
			console.log('Cannot find constructor for type: ' + octane.type);
		}

		return object;
	}

	/**
	 * Use the given list of property names to parse Octane properties from the given object.
	 * 
	 * @param {Object} obj the object to parse from
	 * @param {string[]} propNames array of property names
	 * @return {Object[]} array of parsed Octane properties
	 */
	function parseProps(obj, propNames) {
		var oct = [];

		for (var i = 0, il = propNames.length; i < il; ++i) {
			var name = propNames[i],
				prop = obj[name],
				entry = {
					name: name	
				};
                
            if (!prop) {
                entry.val = prop;
            } else if (hemi.utils.isFunction(prop)) {
				entry.arg = [];
			} else if (hemi.utils.isArray(prop)) {
				if (prop.length > 0) {
					var p = prop[0];

					if (p._getId && p._worldId) {
						entry.id = [];

						for (var j = 0; j < prop.length; ++j) {
							entry.id[j] = prop[j]._getId();
						}
					} else if (p._toOctane) {
						entry.oct = [];

						for (var j = 0; j < prop.length; ++j) {
							entry.oct[j] = prop[j]._toOctane();
						}
					} else {
						entry.val = prop;
					}
				} else {
					entry.val = prop;
				}
			} else if (prop._getId && prop._worldId) {
				entry.id = prop._getId();
			} else if (prop._toOctane) {
				entry.oct = prop._toOctane();
			} else {
				entry.val = prop;
			}

			oct.push(entry);
		}

		return oct;
	}

	/*
	 * Iterate through the given Octane structure and set properties for the given object.
	 * Properties stored by value will be set directly, by Octane will be recursively created, by id
	 * will be retrieved from the World, and by arg will be set by calling the specified function on
	 * the object.
	 * 
	 * @param {Object} object the object created from the given Octane
	 * @param {Object} octane the structure containing information about the given object
	 */
	function setProperties(object, octane) {
		for (var i = 0, il = octane.props.length; i < il; ++i) {
			var property = octane.props[i],
				name = property.name;

			if (property.oct !== undefined) {
				if (hemi.utils.isArray(property.oct)) {
					value = [];

					for (var j = 0, jl = property.oct.length; j < jl; ++j) {
						var child = createObject(property.oct[j]);
						setProperties(child, property.oct[j]);
						value.push(child);
					}
				} else {
					value = createObject(property.oct);
					setProperties(value, property.oct);
				}

				object[name] = value;
			} else if (property.val !== undefined) {
				object[name] = property.val;
			} else if (property.id !== undefined) {
				var value;

				if (hemi.utils.isArray(property.id)) {
					value = [];

					for (var j = 0, jl = property.id.length; j < jl; ++j) {
						value.push(hemi.world.getCitizenById(property.id[j]));
					}
				} else {
					value = hemi.world.getCitizenById(property.id);
				}

				object[name] = value;
			} else if (property.arg !== undefined) {
				var func = object[name],
					args = hemi.dispatch.getArguments(null, property.arg);

				func.apply(object, args);
			} else {
				alert('Unable to process octane for ' + octane.id + ': missing property value');
			}
		}
	}

})();
