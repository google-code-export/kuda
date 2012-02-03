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

////////////////////////////////////////////////////////////////////////////////////////////////////
// ValueCheck class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A ValueCheck handler checks a set of values against a specified set of values from the
	 * Message to handle. If the values all match, the Message is passed to the actual handler.
	 */
	var ValueCheck = function() {
		/**
		 * A Citizen that the ValueCheck may be using.
		 * @type hemi.world.Citizen
		 */
		this.citizen = null;
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

	/*
	 * Remove all references in the ValueCheck.
	 */
	ValueCheck.prototype._clean = function() {
		this.citizen = null;
		this.values = [];
		this.handler = null;
		this.args = [];
	};

	/*
	 * Octane properties for ValueCheck.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	ValueCheck.prototype._octane = function() {
		var valNames = ['values', 'valueParams', 'func', 'args'],
			props = [];

		for (var i = 0, il = valNames.length; i < il; ++i) {
			var name = valNames[i];

			props.push({
				name: name,
				val: this[name]
			});
		}

		props.push({
			name: 'handler',
			id: this.handler._getId()
		});

		if (this.citizen) {
			props.push({
				name: 'citizen',
				id: this.citizen._getId()
			});
		}

		return props;
	};

	/**
	 * Check the ValueCheck's value parameters against it's expected values to determine if the
	 * given Message should be passed to the handler object.
	 * 
	 * @param {hemi.dispatch.Message} message the Message to handle
	 */
	ValueCheck.prototype.handleMessage = function(message) {
		var values = hemi.dispatch.getArguments(message, this.valueParams),
			match = true;

		for (var i = 0, il = values.length; match && i < il; ++i) {
			var val = values[i];

			if (val && val._getId !== undefined) {
				match = this.values[i] === val._getId();
			} else {
				match = this.values[i] === val;
			}
		}

		if (match) {
			var args = hemi.dispatch.getArguments(message, this.args);
			this.handler[this.func].apply(this.handler, args);
		}
	};

	hemi.makeCitizen(ValueCheck, 'hemi.ValueCheck', {
		cleanup: ValueCheck.prototype._clean,
		toOctane: ValueCheck.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Create a ValueCheck handler that will check pick Messages for the given shape name.
	 * 
	 * @param {hemi.Model} model the Model containing the Mesh to pick
	 * @param {string} meshName the Mesh name to check for
	 * @param {Object} handler handler object for the Message.
	 * @param {string} func name of the object function to pass the Message to
	 * @param {string[]} opt_args optional array to specify arguments to pass to the handler.
	 *     Otherwise just pass it the Message.
	 * @return {hemi.ValueCheck} the created ValueCheck handler
	 */
	hemi.handlePick = function(model, meshName, handler, func, opt_args) {
		var valCheck = new hemi.ValueCheck();
		valCheck.citizen = model;
		valCheck.values = [meshName];
		valCheck.valueParams = [hemi.dispatch.MSG_ARG + 'data.pickedMesh.name'];
		valCheck.handler = handler;
		valCheck.func = func;

		if (opt_args) {
			valCheck.args = opt_args;
		}

		return hemi.subscribe(hemi.msg.pick, valCheck, 'handleMessage');
	};

	/**
	 * Create a ValueCheck handler that will check Camera move Messages for the given viewpoint.
	 * 
	 * @param {hemi.Camera} camera the camera to receive Messages from
	 * @param {hemi.Viewpoint} viewpoint the viewpoint to check for
	 * @param {Object} handler handler object for the Message.
	 * @param {string} func name of the object function to pass the Message to
	 * @param {string[]} opt_args optional array to specify arguments to pass to the handler.
	 *     Otherwise just pass it the Message.
	 * @return {hemi.ValueCheck} the created ValueCheck handler
	 */
	hemi.handleCameraMove = function(camera, viewpoint, handler, func, opt_args) {
		var valCheck = new hemi.ValueCheck();
		valCheck.citizen = camera;
		valCheck.values = [viewpoint._getId()];
		valCheck.valueParams = [hemi.dispatch.MSG_ARG + 'data.viewpoint'];
		valCheck.handler = handler;
		valCheck.func = func;

		if (opt_args) {
			valCheck.args = opt_args;
		}

		return camera.subscribe(hemi.msg.stop, valCheck, 'handleMessage');
	};

})();
