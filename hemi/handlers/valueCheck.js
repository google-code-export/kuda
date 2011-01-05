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
 
 o3djs.require('hemi.dispatch');
o3djs.require('hemi.world');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for prebuilt Message handlers that perform common
	 * Message handling tasks more easily.
	 */
	hemi.handlers = hemi.handlers || {};
	
	/**
	 * @class A ValueCheck handler checks a set of values against a specified
	 * set of values from the Message to handle. If the values all match, the
	 * Message is passed to the actual handler.
	 * @extends hemi.world.Citizen
	 */
	hemi.handlers.ValueCheck = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * The values to check for.
		 * @type Object[]
		 */
		this.values = [];
		/**
		 * The parameter names to use to get the values to check.
		 * @type string[]
		 */
		this.valueParams = [];
		/**
		 * The handler object for the Message.
		 * @type Object
		 */
		this.handler = null;
		/**
		 * The name of the object function to pass the Message to.
		 * @type string
		 */
		this.func = null;
		/**
		 * Optional array to specify arguments to pass to the handler. Otherwise
		 * just pass it the Message.
		 * @type string[]
		 */
		this.args = [];
	};
	
	hemi.handlers.ValueCheck.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType.
         */
		citizenType: 'hemi.handlers.ValueCheck',
		
		/**
		 * Send a cleanup Message and remove all references in the ValueCheck.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.values = [];
			this.handler = null;
			this.args = [];
		},
		
		/**
		 * Check the specified value parameters against the specified values to
		 * determine if the given Message should be passed to the handler
		 * object.
		 * 
		 * @param {hemi.dispatch.Message} message the Message to handle
		 */
		handleMessage: function(message) {
			var values = hemi.dispatch.getArguments(message, this.valueParams),
				match = true;
			
			for (var ndx = 0, len = values.length; match && ndx < len; ndx++) {
				var val = values[ndx];
				
				if (val.getId !== undefined) {
					match = this.values[ndx] === val.getId();
				} else {
					match = this.values[ndx] === val;
				}
			}
			
			if (match) {
				var args = hemi.dispatch.getArguments(message, this.args);
				this.handler[this.func].apply(this.handler, args);
			}
		},
		
		/**
		 * Get the Octane structure for the ValueCheck.
	     *
	     * @return {Object} the Octane structure representing the ValueCheck
		 */
        toOctane: function() {
            var octane = hemi.world.Citizen.prototype.toOctane.call(this),
            	valNames = ['values', 'valueParams', 'func', 'args'];
			
			for (var ndx = 0, len = valNames.length; ndx < len; ndx++) {
				var name = valNames[ndx];
				
				octane.props.push({
					name: name,
					val: this[name]
				});
			};
            
            octane.props.push({
                name: 'handler',
                id: this.handler.getId()
            });
            
            return octane;
        }
	};
	
	hemi.handlers.ValueCheck.inheritsFrom(hemi.world.Citizen);
	
	/**
	 * Create a ValueCheck handler that will check pick Messages for the given
	 * shape name.
	 * 
	 * @param {string} shapeName the shape name to check for
	 * @param {Object} handler handler object for the Message.
	 * @param {string} func name of the object function to pass the Message to
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     the handler. Otherwise just pass it the Message.
	 * @return {hemi.handlers.ValueCheck} the created ValueCheck handler
	 */
	hemi.handlers.handlePick = function(shapeName, handler, func, opt_args) {
		var valCheck = new hemi.handlers.ValueCheck();
		valCheck.values = [shapeName];
		valCheck.valueParams = [hemi.dispatch.MSG_ARG + 'data.pickInfo.shapeInfo.shape.name'];
		valCheck.handler = handler;
		valCheck.func = func;
		
		if (opt_args) {
			valCheck.args = opt_args;
		}
		
		return hemi.world.subscribe(hemi.msg.pick, valCheck, 'handleMessage');
	};
	
	/**
	 * Create a ValueCheck handler that will check Camera move Messages for the
	 * given viewpoint.
	 * 
	 * @param {hemi.view.Camera} camera the camera to receive Messages from
	 * @param {hemi.view.Viewpoint} viewpoint the viewpoint to check for
	 * @param {Object} handler handler object for the Message.
	 * @param {string} func name of the object function to pass the Message to
	 * @param {string[]} opt_args optional array to specify arguments to pass to
	 *     the handler. Otherwise just pass it the Message.
	 * @return {hemi.handlers.ValueCheck} the created ValueCheck handler
	 */
	hemi.handlers.handleCameraMove = function(camera, viewpoint, handler, func, opt_args) {
		var valCheck = new hemi.handlers.ValueCheck();
		valCheck.values = [viewpoint.getId()];
		valCheck.valueParams = [hemi.dispatch.MSG_ARG + 'data.viewpoint'];
		valCheck.handler = handler;
		valCheck.func = func;
		
		if (opt_args) {
			valCheck.args = opt_args;
		}
		
		return camera.subscribe(hemi.msg.stop, valCheck, 'handleMessage');
	};
	
	return hemi;
})(hemi || {});
