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

o3djs.require('hext.msg');
o3djs.require('hext.tools.baseTool');
o3djs.require('hext.tools.manometerTube');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
     * Enum for the different Manometer inputs.
	 * <ul><pre>
	 * <li>hext.tools.InputId.UpperLeft
	 * <li>hext.tools.InputId.LowerLeft
	 * <li>hext.tools.InputId.UpperRight
	 * <li>hext.tools.InputId.LowerRight
	 * </ul></pre>
     */
	hext.tools.InputId = {
		UpperLeft: 0,
		LowerLeft: 1,
		UpperRight: 3,
		LowerRight: 4
	};
	
	/**
     * Enum for the different Manometer input modes.
	 * <ul><pre>
	 * <li>hext.tools.ManometerMode.Pressure
	 * <li>hext.tools.ManometerMode.Flow
	 * <li>hext.tools.ManometerMode.FlowAt50
	 * </ul></pre>
     */
	hext.tools.ManometerMode = {
		Pressure: 0,
		Flow: 1,
		FlowAt50: 2
	};
	
	/**
	 * @class A Manometer is the data model representation of a manometer
	 * weatherization tool. It measures pressure and airflow.
	 * @extends hext.tools.BaseTool
	 */
	hext.tools.Manometer = hext.tools.BaseTool.extend({
		init: function() {
			this._super();
			
			/**
			 * The calculated value of the Manometer's left inputs. This should not
			 * be set directly.
			 * @type number
			 */
			this.leftValue = 0;
			
			/**
			 * The calculated value of the Manometer's right inputs. This should not
			 * be set directly.
			 * @type number
			 */
			this.rightValue = 0;
			
			/**
			 * The input mode of the Manometer's left inputs. This should not be
			 * set directly.
			 * @type hext.tools.ManometerMode
			 */
			this.leftMode = hext.tools.ManometerMode.Pressure;
			
			/**
			 * The input mode of the Manometer's right inputs. This should not be
			 * set directly.
			 * @type hext.tools.ManometerMode
			 */
			this.rightMode = hext.tools.ManometerMode.Pressure;
			
			this.value = 0;
			this.location = null;
			this.ulInput = this;
			this.llInput = this;
			this.urInput = this;
			this.lrInput = this;
			this.msgHandler = null;
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.Manometer',
		
		/**
		 * Send a cleanup Message and remove all references in the Manometer.
		 */
		cleanup: function() {
			this._super();
			this.location = null;
			this.ulInput = null;
			this.llInput = null;
			this.urInput = null;
			this.lrInput = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},
		
		/**
		 * Set the visibility for the Manometer and any of its inputs.
		 * @see hext.tools.BaseTool#setVisible
		 * 
		 * @param {boolean} visible flag to indicate if the Manometer is
		 *     visible
		 */
		setVisible: function(visible) {
			this._super(visible);
			
			if (this.ulInput != this) {
				this.ulInput.setVisible(visible);
			}
			if (this.urInput != this) {
				this.urInput.setVisible(visible);
			}
			if (this.llInput != this) {
				this.llInput.setVisible(visible);
			}
			if (this.lrInput != this) {
				this.lrInput.setVisible(visible);
			}
		},
		
		/**
		 * Get the pressure value for the Manometer in its current Location.
		 * 
		 * @return {number} the current pressure value
		 */
		getValue: function() {
			return this.value;
		},
		
		/**
		 * Set the pressure value for the Manometer in its current Location and
		 * recalculate its input values.
		 * 
		 * @return {number} the pressure value to set
		 */
		setValue: function(value) {
			if (Math.abs(this.value - value) > 0.05) {
				this.value = value;
				
				if (this.ulInput == this || this.llInput == this) {
					this.inputUpdated(hext.tools.InputId.UpperLeft);
				}
				
				if (this.urInput == this || this.lrInput == this) {
					this.inputUpdated(hext.tools.InputId.UpperRight);
				}
			}
		},
		
		/**
		 * Get the Manometer's current Location.
		 * 
		 * @return {hext.engines.Location} the current Location
		 */
		getLocation: function() {
			return this.location;
		},
		
		/**
		 * Set the Manometer's current Location and register it to handle
		 * update Messages from the Location.
		 * 
		 * @param {hext.engines.Location} location the Location to set
		 */
		setLocation: function(location) {
			if (this.location != null) {
				this.location.unsubscribe(this.msgHandler, hext.msg.pressure);
				this.msgHandler = null;
			}

			this.location = location;
			this.msgHandler = this.location.subscribe(
				hext.msg.pressure,
				this,
				'setValue',
				[hemi.dispatch.MSG_ARG + 'data.pressure']);
		},

		/**
		 * Get the Manometer's input at the specified input location.
		 * 
		 * @param {hext.tools.InputId} inputId id of the input to get
		 * @return {Object} either a ManometerTube or the Manometer itself
		 */
		getInput: function(inputId) {
			var input = null;
			
			switch (inputId) {
				case hext.tools.InputId.UpperLeft:
					input = this.ulInput;
					break;
				case hext.tools.InputId.LowerLeft:
					input = this.llInput;
					break;
				case hext.tools.InputId.UpperRight:
					input = this.urInput;
					break;
				case hext.tools.InputId.LowerRight:
					input = this.lrInput;
					break;
			}
			
			return input;
		},
		
		/**
		 * Set the given ManometerTube as an input for the Manometer and
		 * recalculate its input values. Send a notification Message.
		 * 
		 * @param {hext.tools.ManometerTube} input the new input
		 */
		setInput: function(input) {
			var visible = false;
			var mode;
			
			if (input.tubeType == hext.tools.TubeType.Cfm) {
				mode = hext.tools.ManometerMode.Flow;
			}
			else {
				mode = hext.tools.ManometerMode.Pressure;
			}
			
			switch (input.inputId) {
				case hext.tools.InputId.UpperLeft:
					this.ulInput = input;
					visible = true;
					this.leftMode = mode;
					break;
				case hext.tools.InputId.LowerLeft:
					this.llInput = input;
					visible = true;
					this.leftMode = mode;
					break;
				case hext.tools.InputId.UpperRight:
					this.urInput = input;
					visible = true;
					this.rightMode = mode;
					break;
				case hext.tools.InputId.LowerRight:
					this.lrInput = input;
					visible = true;
					this.rightMode = mode;
					break;
			}
			
			this.send(hext.msg.input,
				{
					left: this.leftMode,
					right: this.rightMode
				});
			
			if (visible) {
				input.setVisible(visible);
				this.inputUpdated(input.inputId);
			}
		},
		
		/**
		 * Remove the Manometer's input at the specified input location. The
		 * Manometer will become its own input at that input location.
		 * Recalculate its input values and send a notification Message.
		 * 
		 * @param {hext.tools.InputId} inputId id of the input to get
		 */
		removeInput: function(inputId) {
			var oldInput = null;
			
			switch (inputId) {
				case hext.tools.InputId.UpperLeft:
					oldInput = this.ulInput;
					this.ulInput = this;
					this.leftMode = hext.tools.ManometerMode.Pressure;
					break;
				case hext.tools.InputId.LowerLeft:
					oldInput = this.llInput;
					this.llInput = this;
					this.leftMode = hext.tools.ManometerMode.Pressure;
					break;
				case hext.tools.InputId.UpperRight:
					oldInput = this.urInput;
					this.urInput = this;
					this.rightMode = hext.tools.ManometerMode.Pressure;
					break;
				case hext.tools.InputId.LowerRight:
					oldInput = this.lrInput;
					this.lrInput = this;
					this.rightMode = hext.tools.ManometerMode.Pressure;
					break;
			}

			this.send(hext.msg.input,
				{
					left: this.leftMode,
					right: this.rightMode
				});

			if (oldInput != this) {
				oldInput.setVisible(false);
				this.inputUpdated(inputId);
			}
		},
		
		/**
		 * Notify the Manometer that the input at the specified input location
		 * has a new value. Recalculate its input values and send a
		 * notification Message.
		 * 
		 * @param {hext.tools.InputId} inputId id of the input with a new value
		 */
		inputUpdated: function(inputId) {
			switch (inputId) {
				case hext.tools.InputId.UpperLeft:
				case hext.tools.InputId.LowerLeft:
					this.leftValue = this.ulInput.getValue() - this.llInput.getValue();
					break;
				case hext.tools.InputId.UpperRight:
				case hext.tools.InputId.LowerRight:
					this.rightValue = value = this.urInput.getValue() - this.lrInput.getValue();
					break;
			}
			
			this.send(hext.msg.pressure,
				{
					left: this.leftValue,
					right: this.rightValue
				});
		}
	});
	
	hext.tools.Manometer.prototype.msgSent =
		hext.tools.Manometer.prototype.msgSent.concat([
			hext.msg.input,
			hext.msg.pressure]);
	
	return hext;
})(hext || {});
