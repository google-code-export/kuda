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
