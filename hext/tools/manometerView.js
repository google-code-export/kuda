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

o3djs.require('hemi.view');
o3djs.require('hext.msg');
o3djs.require('hext.tools.htmlView');
o3djs.require('hext.tools.manometer');
o3djs.require('hext.tools.toolbarView');

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
	 * @class A ManometerViewConfig contains configuration options for a
	 * ManometerView.
	 * @extends hext.tools.HtmlViewConfig
	 */
	hext.tools.ManometerViewConfig = function() {
		hext.tools.HtmlViewConfig.call(this);
		
		/**
		 * @see hext.tools.HtmlViewConfig#contentFileName
		 * @default 'hext/tools/assets/manometerDisplay.htm'
		 */
		this.contentFileName = 'hext/tools/assets/manometerDisplay.htm';
		
		/**
		 * The CSS class to apply to the HTML element for a manometer tap
		 * that is selected.
		 * @type string
		 * @default 'selected'
		 */
		this.selectedClass = 'selected';
		
		/**
		 * The CSS class to apply to the HTML element for a manometer tap
		 * that is connected to the outside Location.
		 * @type string
		 * @default 'toDoor'
		 */
		this.toDoorClass = 'toDoor';
		
		/**
		 * The CSS class to apply to the HTML element for a manometer tap
		 * that is connected to a BlowerDoor.
		 * @type string
		 * @default 'toBlower'
		 */
		this.toBlowerClass = 'toBlower';
		
		/**
		 * The CSS class to apply to the HTML element for a manometer tap
		 * that is connected to an inside Location.
		 * @type string
		 * @default 'toRoom'
		 */
		this.toRoomClass = 'toRoom';
	};
	
	/**
	 * @class A ManometerView is the HTML view for a Manometer.
	 * @extends hext.tools.HtmlView
	 * 
	 * @param {hext.tools.ManometerViewConfig} config configuration options
	 */
	hext.tools.ManometerView = function(config) {
		hext.tools.HtmlView.call(this);
		
		this.config = jQuery.extend(new hext.tools.ManometerViewConfig(), config);
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
			hemi.view.addRenderListener(that);
		});
	};
	
	hext.tools.ManometerView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.ManometerView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * ManometerView.
		 */
		cleanup: function() {
			hemi.view.removeRenderListener(this);
			hext.tools.HtmlView.prototype.cleanup.call(this);
			this.config = null;
			this.deviceName = null;
			this.leftDisplay = null;
			this.rightDisplay = null;
			this.rightPrMode = null;
			this.rightFlMode = null;
			this.rightPaUnits = null;
			this.rightCfmUnits = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},
		
		/**
		 * Update the ManometerView's time counter and if enough time has passed
		 * to refresh the display, update it with the current Manometer values.
		 *
		 * @param {o3d.RenderEvent} event the event containing the elapsed time
		 */
		onRender: function(event) {
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
		},
		
		/**
		 * Initialize the ManometerView's display elements as jQuery objects
		 * from the loaded htm file. This should not be called directly.
		 */
		setupElements: function() {
			this.deviceName = this.getElement(DEVICE_DISPLAY_ID);
			this.leftDisplay = this.getElement(LEFT_DISPLAY_ID);
			this.rightDisplay = this.getElement(RIGHT_DISPLAY_ID);
			this.rightPrMode = this.getElement(RIGHT_PR_MODE_ID);
			this.rightFlMode = this.getElement(RIGHT_FL_MODE_ID);
			this.rightPaUnits = this.getElement(RIGHT_PA_UNITS_ID);
			this.rightCfmUnits = this.getElement(RIGHT_CFM_UNITS_ID);
			
			this.setRightDisplayMode(this.rightMode);
		},
		
		/**
		 * Set the type of data and units being displayed by the right display
		 * field of the ManometerView.
		 *
		 * @param {hext.tools.ManometerMode} mode the display mode
		 */
		setRightDisplayMode: function(mode) {
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
		},
		
		/**
		 * Set the name of the Manometer device being used (usually a numeric id).
		 *
		 * @param {string} name name of the Manometer device
		 */
		setDeviceName: function(name) {
			this.deviceName.text(name);
		},
		
		/**
		 * Update the left display field of the ManometerView with the current
		 * left value of the Manometer tool.
		 */
		updateLeftDisplay: function() {
			if (this.leftDisplay) {
				this.leftDisplay.text(Math.round(this.leftValue));
			}
		},
		
		/**
		 * Update the right display field of the ManometerView with the
		 * current right value of the Manometer tool. If the right display is
		 * showing CFM, make sure the left value is reading enough pressure to
		 * calculate CFM.
		 */
		updateRightDisplay: function() {
			if (this.rightDisplay) {
				if (this.rightMode === hext.tools.ManometerMode.Flow &&
				    Math.abs(Math.round(this.leftValue)) < 10) {
					this.rightDisplay.text('----');
				}
				else {
					this.rightDisplay.text(Math.round(this.rightValue));
				}
			}
		},
		
		/**
		 * Update the left and right values for the ManometerView.
		 *
		 * @param {number} leftVal the value of the Manometer's left inputs
		 * @param {number} rightVal the value of the Manometer's right inputs
		 */
		updateValues: function(leftVal, rightVal) {
			if (this.leftValue != leftVal) {
				this.leftValue = leftVal;
				this.updateLeft = true;
			}
			
			if (this.rightValue != rightVal) {
				this.rightValue = rightVal;
				this.updateRight = true;
			}
		},
		
		/**
		 * Update the left and right modes for the ManometerView.
		 *
		 * @param {hext.tools.ManometerMode} leftMode the Manometer's left
		 *     input mode
		 * @param {hext.tools.ManometerMode} rightMode the Manometer's right
		 *     input mode
		 */
		updateModes: function(leftMode, rightMode) {
			// Ignore the leftMode for now
			
			if (this.rightMode != rightMode) {
				this.setRightDisplayMode(rightMode);
			}
		},
		
		/**
		 * Set the CSS class for a selected input tap to the HTML element with
		 * the given id and send a notification Message.
		 * 
		 * @param {string} elemId the id of the HTML element for the tap
		 * @param {boolean} selected flag indicating if the tap is selected
		 */
		setTapSelected: function(elemId, selected) {
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
		},
		
		/**
		 * Set the CSS class for an input tap connected to the outside Location
		 * to the HTML element with the given id and send a notification
		 * Message.
		 * 
		 * @param {string} elemId the id of the HTML element for the tap
		 * @param {boolean} flag flag indicating if the tap is connected
		 */
		setTapToDoor: function(elemId, flag) {
			var tap = this.getElement(elemId);
			if (tap) {
				if (flag) {
					tap.addClass(this.config.toDoorClass);
				}
				else {
					tap.removeClass(this.config.toDoorClass);
				}
			}
		},
		
		/**
		 * Set the CSS class for an input tap connected to an inside Location
		 * to the HTML element with the given id and send a notification
		 * Message.
		 * 
		 * @param {string} elemId the id of the HTML element for the tap
		 * @param {boolean} flag flag indicating if the tap is connected
		 */
		setTapToRoom: function(elemId, flag) {
			var tap = this.getElement(elemId);
			if (tap) {
				if (flag) {
					tap.addClass(this.config.toRoomClass);
				}
				else {
					tap.removeClass(this.config.toRoomClass);
				}
			}
		},
		
		/**
		 * Set the CSS class for an input tap connected to a BlowerDoor to the
		 * HTML element with the given id and send a notification Message.
		 * 
		 * @param {string} elemId the id of the HTML element for the tap
		 * @param {boolean} flag flag indicating if the tap is connected
		 */
		setTapToBlower: function(elemId, flag) {
			var tap = this.getElement(elemId);
			if (tap) {
				if (flag) {
					tap.addClass(this.config.toBlowerClass);
				}
				else {
					tap.removeClass(this.config.toBlowerClass);
				}
			}
		}
	};
	
	/**
	 * @class A ManometerToolbarViewConfig contains configuration options for
	 * a ManometerToolbarView.
	 * @extends hext.tools.ToolbarViewConfig
	 */
	hext.tools.ManometerToolbarViewConfig = function() {
		hext.tools.ToolbarViewConfig.call(this);
		
		/**
		 * @see hext.tools.ToolbarViewConfig#containerId
		 * @default 'manometerToolbarView'
		 */
		this.containerId = 'manometerToolbarView';
		
		/**
		 * The id for the HTML element containing the Manometer toolbar
		 * button.
		 * @type string
		 * @default 'manometerButtonId'
		 */
		this.buttonId = 'manometerButtonId';
	};
	
	/**
	 * @class A ManometerToolbarView is the toolbar view for a Manometer.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {hext.tools.ManometerToolbarViewConfig} config configuration
	 *     options
	 */
	hext.tools.ManometerToolbarView = function(config) {
		this.button = null;
		hext.tools.ToolbarView.call(this, config);
	};
	
	
	hext.tools.ManometerToolbarView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.ManometerToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * ManometerToolbarView.
		 */
		cleanup: function() {
			hext.tools.ToolbarView.prototype.cleanup.call(this);
			
			if (this.button) {
				this.button.unbind();
				this.button = null;
			}
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
	    },
		
    	/**
		 * Create the actual toolbar button element for the
		 * ManometerToolbarView.
		 */
		layoutView: function() {
			this.button = jQuery('<button id="' + this.config.buttonId + '" title="Manometer Tool">Manometer</button>');
			this.container.append(this.button);
		}
	};
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.ManometerViewConfig.inheritsFrom(hext.tools.HtmlViewConfig);
	hext.tools.ManometerView.inheritsFrom(hext.tools.HtmlView);
	hext.tools.ManometerView.prototype.msgSent =
		hext.tools.ManometerView.prototype.msgSent.concat([hext.msg.input]);
	hext.tools.ManometerToolbarViewConfig.inheritsFrom(hext.tools.ToolbarViewConfig);
	hext.tools.ManometerToolbarView.inheritsFrom(hext.tools.ToolbarView);
});