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

o3djs.require('hext.tools.htmlView');
o3djs.require('hext.tools.toolbarView');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BlowerDoorView is the HTML view for a BlowerDoor.
	 * @extends hext.tools.HtmlView
	 * 
	 * @param {Object} config configuration options
	 */
	hext.tools.BlowerDoorView = hext.tools.HtmlView.extend({
		init: function(config) {
			this._super(hemi.utils.join({
				contentFileName: 'js/hext/tools/assets/blowerDoorDisplay.htm',
				blowerDoorKnobId: 'blowerDoorKnob'
			}, config));
			
			this.knob = null;
			this.canvasKnob = null;
			
			var that = this;
			
			this.addLoadCallback(function () {
				that.knob = that.getElement(that.config.blowerDoorKnobId);
			});
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.BlowerDoorView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BlowerDoorView.
		 */
		cleanup: function() {
			this._super();
			
			if (this.knob && this.knob.rotate) {
				this.knob.rotate.unbind();
			}
			
			this.knob = null;
			this.canvasKnob = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},
		
		/**
		 * Rotate the knob widget by the specified value.
		 * 
		 * @param {number} value the amount to rotate the knob widget
		 */
		rotateKnob: function(value) {
			if (this.canvasKnob) {
				this.canvasKnob.rotateAnimation(value);
			}
		}
	});
	
	/**
	 * @class A BlowerDoorToolbarView is the toolbar view for a BlowerDoor.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {Object} config configuration options
	 */
	hext.tools.BlowerDoorToolbarView = hext.tools.ToolbarView.extend({
		init: function(config) {
			this.button = null;
	        config = hemi.utils.join({
	        	containerId: 'blowerDoorToolbarView',
				buttonId: 'blowerDoorButtonId'
	        }, config);
	        this._super(config);
		},
		
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.BlowerDoorToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BlowerDoorToolbarView.
		 */
		cleanup: function() {
			this._super();
			
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
		 * BlowerDoorToolbarView.
		 */
	    layoutView: function() {
	        this.button = jQuery('<button id="' + this.config.buttonId + '" title="Blower Door Tool">Blower Door</button>');
			this.container.append(this.button);
		}
    });
	
	return hext;
})(hext || {});
