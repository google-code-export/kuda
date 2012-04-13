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

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	// Constants for the manometer view htm file
	var DEVICE_DISPLAY_ID = 'device';
	var CONFIG_DISPLAY_ID = 'config';
	var LEFT_DISPLAY_ID = 'left-text';
	var RIGHT_DISPLAY_ID = 'right-text';
	var LEFT_PA_UNITS_ID = 'left-pa';
	var RIGHT_CFM_UNITS_ID = 'right-cfm';
	var RIGHT_PA_UNITS_ID = 'right-pa';
	var LEFT_PR_MODE_ID = 'left-pr';
	var RIGHT_PR_MODE_ID = 'right-pr';
	var RIGHT_FL_MODE_ID = 'right-fl';
	
	/**
	 * @class A ManometerView is the HTML view for a Manometer.
	 * @extends hext.tools.HtmlView
	 * 
	 * @param {Object} config configuration options
	 */
	var ManometerView = function(config) {
		this.config = hemi.utils.join({
			contentFileName: 'js/hext/tools/assets/manometerDisplay.htm',
			selectedClass: 'selected',
			toDoorClass: 'toDoor',
			toBlowerClass: 'toBlower',
			toRoomClass: 'toRoom'
		}, config);
		hext.tools.HtmlView.call(this, this.config);
		
		this.rightMode = hext.tools.ManometerMode.Pressure;
		this.deviceName = null;
		this.leftDisplay = null;
		this.rightDisplay = null;
		this.rightPrMode = null;
		this.rightFlMode = null;
		this.rightPaUnits = null;
		this.rightCfmUnits = null;
		this.leftValue = 0;
		this.rightValue = 0;
		this.updateLeft = false;
		this.updateRight = false;
		this.time = 0;
		this.refreshTime = 0.5;
		
		var that = this;
		
		this.addLoadCallback(function() {
			that.setupElements();
			hemi.addRenderListener(that);
		});
	};

	ManometerView.prototype = new hext.tools.HtmlView();
	ManometerView.prototype.constructor = ManometerView;
		
	/**
	 * Send a cleanup Message and remove all references in the
	 * ManometerView.
	 */
	ManometerView.prototype.cleanup = function() {
		hemi.view.removeRenderListener(this);
		this._super();
		this.config = null;
		this.deviceName = null;
		this.leftDisplay = null;
		this.rightDisplay = null;
		this.rightPrMode = null;
		this.rightFlMode = null;
		this.rightPaUnits = null;
		this.rightCfmUnits = null;
	};
		
	/*
	 * Not currently supported.
	 */
	ManometerView.prototype.toOctane = function() {
		
	};
		
	/**
	 * Update the ManometerView's time counter and if enough time has passed
	 * to refresh the display, update it with the current Manometer values.
	 *
	 * @param {RenderEvent} event the event containing the elapsed time
	 */
	ManometerView.prototype.onRender = function(event) {
		this.time += event.elapsedTime;
		
		if (this.time >= this.refreshTime) {
			if (this.updateLeft) {
				this.updateLeftDisplay();
				this.updateLeft = false;
			}
			if (this.updateRight) {
				this.updateRightDisplay();
				this.updateRight = false;
			}
			
			this.time = 0;
		}
	};
		
	/**
	 * Initialize the ManometerView's display elements as jQuery objects
	 * from the loaded htm file. This should not be called directly.
	 */
	ManometerView.prototype.setupElements = function() {
		this.deviceName = this.getElement(DEVICE_DISPLAY_ID);
		this.leftDisplay = this.getElement(LEFT_DISPLAY_ID);
		this.rightDisplay = this.getElement(RIGHT_DISPLAY_ID);
		this.rightPrMode = this.getElement(RIGHT_PR_MODE_ID);
		this.rightFlMode = this.getElement(RIGHT_FL_MODE_ID);
		this.rightPaUnits = this.getElement(RIGHT_PA_UNITS_ID);
		this.rightCfmUnits = this.getElement(RIGHT_CFM_UNITS_ID);
		
		this.setRightDisplayMode(this.rightMode);
	};
		
	/**
	 * Set the type of data and units being displayed by the right display
	 * field of the ManometerView.
	 *
	 * @param {hext.tools.ManometerMode} mode the display mode
	 */
	ManometerView.prototype.setRightDisplayMode = function(mode) {
		switch (mode) {
			case hext.tools.ManometerMode.Pressure:
				this.rightMode = hext.tools.ManometerMode.Pressure;
				this.rightFlMode.hide();
				this.rightPrMode.show();
				this.rightCfmUnits.hide();
				this.rightPaUnits.show();
				break;
			case hext.tools.ManometerMode.Flow:
				this.rightMode = hext.tools.ManometerMode.Flow;
				this.rightPrMode.hide();
				this.rightFlMode.text('FL');
				this.rightFlMode.show();
				this.rightPaUnits.hide();
				this.rightCfmUnits.text('CFM');
				this.rightCfmUnits.show();
				break;
			case hext.tools.ManometerMode.FlowAt50:
				this.rightMode = hext.tools.ManometerMode.Flow;
				this.rightPrMode.hide();
				this.rightFlMode.text('FL@50');
				this.rightFlMode.show();
				this.rightPaUnits.hide();
				this.rightCfmUnits.text('CFM@50');
				this.rightCfmUnits.show();
				break;
		}
		
		this.updateRightDisplay();
	};
		
	/**
	 * Set the name of the Manometer device being used (usually a numeric id).
	 *
	 * @param {string} name name of the Manometer device
	 */
	ManometerView.prototype.setDeviceName = function(name) {
		this.deviceName.text(name);
	};
		
	/**
	 * Update the left display field of the ManometerView with the current
	 * left value of the Manometer tool.
	 */
	ManometerView.prototype.updateLeftDisplay = function() {
		if (this.leftDisplay) {
			this.leftDisplay.text(Math.round(this.leftValue));
		}
	};
		
	/**
	 * Update the right display field of the ManometerView with the
	 * current right value of the Manometer tool. If the right display is
	 * showing CFM, make sure the left value is reading enough pressure to
	 * calculate CFM.
	 */
	ManometerView.prototype.updateRightDisplay = function() {
		if (this.rightDisplay) {
			if (this.rightMode === hext.tools.ManometerMode.Flow &&
			    Math.abs(Math.round(this.leftValue)) < 10) {
				this.rightDisplay.text('----');
			}
			else {
				this.rightDisplay.text(Math.round(this.rightValue));
			}
		}
	};
		
	/**
	 * Update the left and right values for the ManometerView.
	 *
	 * @param {number} leftVal the value of the Manometer's left inputs
	 * @param {number} rightVal the value of the Manometer's right inputs
	 */
	ManometerView.prototype.updateValues = function(leftVal, rightVal) {
		if (this.leftValue != leftVal) {
			this.leftValue = leftVal;
			this.updateLeft = true;
		}
		
		if (this.rightValue != rightVal) {
			this.rightValue = rightVal;
			this.updateRight = true;
		}
	};
		
	/**
	 * Update the left and right modes for the ManometerView.
	 *
	 * @param {hext.tools.ManometerMode} leftMode the Manometer's left
	 *     input mode
	 * @param {hext.tools.ManometerMode} rightMode the Manometer's right
	 *     input mode
	 */
	ManometerView.prototype.updateModes = function(leftMode, rightMode) {
		// Ignore the leftMode for now
		
		if (this.rightMode != rightMode) {
			this.setRightDisplayMode(rightMode);
		}
	};
		
	/**
	 * Set the CSS class for a selected input tap to the HTML element with
	 * the given id and send a notification Message.
	 * 
	 * @param {string} elemId the id of the HTML element for the tap
	 * @param {boolean} selected flag indicating if the tap is selected
	 */
	ManometerView.prototype.setTapSelected = function(elemId, selected) {
		var tap = this.getElement(elemId);
		if (tap) {
			if (selected) {
				tap.addClass(this.config.selectedClass);
			}
			else {
				tap.removeClass(this.config.selectedClass);
			}
			
			this.send(hext.msg.input,
				{
					elementId: elemId,
					selected: selected
				});
		}
	};
		
	/**
	 * Set the CSS class for an input tap connected to the outside Location
	 * to the HTML element with the given id and send a notification
	 * Message.
	 * 
	 * @param {string} elemId the id of the HTML element for the tap
	 * @param {boolean} flag flag indicating if the tap is connected
	 */
	ManometerView.prototype.setTapToDoor = function(elemId, flag) {
		var tap = this.getElement(elemId);
		if (tap) {
			if (flag) {
				tap.addClass(this.config.toDoorClass);
			}
			else {
				tap.removeClass(this.config.toDoorClass);
			}
		}
	};
		
	/**
	 * Set the CSS class for an input tap connected to an inside Location
	 * to the HTML element with the given id and send a notification
	 * Message.
	 * 
	 * @param {string} elemId the id of the HTML element for the tap
	 * @param {boolean} flag flag indicating if the tap is connected
	 */
	ManometerView.prototype.setTapToRoom = function(elemId, flag) {
		var tap = this.getElement(elemId);
		if (tap) {
			if (flag) {
				tap.addClass(this.config.toRoomClass);
			}
			else {
				tap.removeClass(this.config.toRoomClass);
			}
		}
	};
		
	/**
	 * Set the CSS class for an input tap connected to a BlowerDoor to the
	 * HTML element with the given id and send a notification Message.
	 * 
	 * @param {string} elemId the id of the HTML element for the tap
	 * @param {boolean} flag flag indicating if the tap is connected
	 */
	ManometerView.prototype.setTapToBlower = function(elemId, flag) {
		var tap = this.getElement(elemId);
		if (tap) {
			if (flag) {
				tap.addClass(this.config.toBlowerClass);
			}
			else {
				tap.removeClass(this.config.toBlowerClass);
			}
		}
	};

	hemi.makeCitizen(ManometerView, 'hext.tools.ManometerView', {
		msgs: [],
		toOctane: []
	});
	
	/**
	 * @class A ManometerToolbarView is the toolbar view for a Manometer.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {Object} config configuration options
	 */
	var ManometerToolbarView =	function(config) {
		this.button = null;
		hext.tools.ToolbarView.call(this, hemi.utils.join({
			containerId: 'manometerToolbarView',
			buttonId: 'manometerButtonId'
		}, config));
	};

	ManometerToolbarView.prototype = new hext.tools.ToolbarView();
	ManometerToolbarView.prototype.constructor = ManometerToolbarView;
		
	/**
	 * Send a cleanup Message and remove all references in the
	 * ManometerToolbarView.
	 */
	ManometerToolbarView.prototype.cleanup = function() {
		hext.tools.ToolbarView.prototype.cleanup.call(this);
		
		if (this.button) {
			this.button.unbind();
			this.button = null;
		}
	};
		
	/*
	 * Not currently supported.
	 */
	ManometerToolbarView.prototype.toOctane = function() {
		
    };
	
	/**
	 * Create the actual toolbar button element for the
	 * ManometerToolbarView.
	 */
	ManometerToolbarView.prototype.layoutView = function() {
		this.button = jQuery('<button id="' + this.config.buttonId + '" title="Manometer Tool">Manometer</button>');
		this.container.append(this.button);
	};

	hemi.makeCitizen(ManometerToolbarView, 'hext.tools.ManometerToolbarView', {
		msgs: [hext.msg.input],
		toOctane: []
	});
	
	return hext;
})(hext || {});
