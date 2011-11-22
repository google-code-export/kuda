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
	
	var isFunction = function(val) {
			return Object.prototype.toString.call(val) === '[object Function]';
		},
	
		parseProps = function(obj, propNames) {
			var oct = [];
			
			for (var i = 0; i < propNames.length; ++i) {
				var name = propNames[i],
					prop = obj[name],
					entry = {
						name: name	
					};
				
				if (isFunction(prop)) {
					entry.arg = [];
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
		};
	
	hemi.makeOctanable = function(clsCon, clsName, octProps) {
		octProps = octProps || [];
		
		/*
         * Essentially a class name.
         * @type string
         */
		clsCon.prototype._citizenType = clsName;
		
		//TODO: Register constructor with hemi.octane
		
		/*
	     * Get the Octane structure for the class. The structure returned is:
	     * <pre>
	     * {
	     *     id: the Citizen's world id (optional)
	     *     type: the class name
	     *     props: the class properties (name and id/value) 
	     * }
	     * </pre>
	     *
	     * @return {Object} the Octane structure representing the class
	     */
		clsCon.prototype._toOctane = function() {
        	var octane = {
				type: this._citizenType,
				props: isFunction(octProps) ? octProps.call(this) : parseProps(this, octProps)
			};
        	
        	if (this._worldId != null) {
        		octane.id = this._worldId;
        	}
			
			if (this.name.length > 0 && !octane.props.name) {
	            octane.props.unslice({
	                name: 'name',
	                val: this.name
	            });
			}
			
			return octane;
        };
	};
	
	return hemi;
})(hemi || {});
