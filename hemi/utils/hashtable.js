var hemi = (function(hemi) {
	/**
	 * @namespace A module to provide various utilities for Hemi.
	 */
	hemi.utils = hemi.utils || {};
	
	/**
	 * @class A Hemi Hashtable extends a Hashtable to allow it to be queried for
	 * Object attributes that are not the Hash key.
	 * @extends Hashtable
	 */
	hemi.utils.Hashtable = function() {
		Hashtable.call(this);
	};
	
	hemi.utils.Hashtable.prototype = {
		type: "hemi.utils.Hashtable",
		
		/**
		 * Search the Hashtable for values with attributes that match the given
		 * set of attributes. The attributes may be single values or arrays of
		 * values which are alternatives.
		 * @example
		 * query({
		 *     a: 1
		 *     b: [2, 3]
		 * });
		 * 
		 * will return any values that have a === 1 and b === 2 or b === 3
		 * 
		 * @param {Object} attributes a set of attributes to search for
		 * @return {Object[]} an array of matching values
		 */
		query: function(attributes) {
			var values = this.values(),
				props = [],
				arrProps = [],
				results = [],
				value,
				propName,
				propVal,
				propArr,
				pN,
				aN,
				aL,
				match;
			
			// Copy the property names out of the attributes object just once
			// since this is less efficient than a simple array.
			for (x in attributes) {
				if (jQuery.isArray(attributes[x])) {
					arrProps.push(x);
				} else {
					props.push(x);
				}
			}
			
			var pLen = props.length,
				aLen = arrProps.length;
			
			for (var ndx = 0, len = values.length; ndx < len; ndx++) {
				value = values[ndx];
				match = true;
				// First test the single value properties.
				for (pN = 0; match && pN < pLen; pN++) {
					propName = props[pN];
					match = value[propName] === attributes[propName];
				}
				// Next test the array of value properties.
				for (pN = 0; match && pN < aLen; pN++) {
					match = false;
					propName = arrProps[pN];
					propVal = value[propName];
					propArr = attributes[propName];
					aL = propArr.length;
					// Search through the array until we find a match for the
					// Hashtable value's property.
					for (aN = 0; !match && aN < aL; aN++) {
						match = propVal === propArr[aN];
					}
				}
				// If it all matches up, we'll return it.
				if (match) {
					results.push(value);
				}
			}
			
			return results;
		}
	};
	
	hemi.utils.Hashtable.inheritsFrom(Hashtable);
	
	return hemi;
})(hemi || {});
