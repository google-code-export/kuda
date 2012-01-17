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
	
	hext.progressUI = hext.progressUI || {};
	
	/**
	 * Default configuration for the bar UI
	 */
	hext.progressUI.barConfig = {
		/**
		 * Configuration options for the bar container.
		 * @type Object
		 */
		container: {
			/**
			 * The color and opacity of the rectangular overlay in RGBA format.
			 * Defaults to semi-transparent black. 
			 * @type number[4]
			 * @default [0, 0, 0, 0.45]
			 */
			color: [0, 0, 0, 0.45],
			
			/**
			 * Options for a blur shadow effect on the container. This is 
			 * mutually exclusive to outline. Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 0]
			},
			
			/**
			 * Options for an outline around the container. This is mutually 
			 * exclusive to shadow. Set radius to 0 to cancel.
			 * @type Object
			 */
			outline: {
				radius: 1,
				color: [1, 1, 1, 0.5]
			}
		},
		
		/**
		 * Configuration options for the progress indicator.
		 * @type Object
		 */
		indicator: {
			/**
			 * The color and opacity of the rectangular overlay in RGBA format.
			 * Defaults to red.
			 * @type number[4]
			 * @default [0, 0, 0, 0.45]
			 */
			color: [1, 0, 0, 0.75],
			
			/**
			 * Options for a blur shadow effect on the indicator. This is 
			 * mutually exclusive to outline. Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 0]
			},
			
			/**
			 * Options for an outline around the indicator. This is mutually 
			 * exclusive to shadow. Set radius to 0 to cancel.
			 * @type Object
			 */
			outline: {
				radius: 0,
				color: [0, 0, 0, 0]
			}
		}
	};
	
	/**
	 * Default configuration for the progress bar full page panel. 
	 */
	hext.progressUI.pageConfig = {		
		/**
		 * The color and opacity of the rectangular overlay in RGBA format.
		 * @type number[4]
		 * @default [0, 0, 0, 0.45]
		 */
		color: [0, 0, 0, 0.65],
		
		/**
		 * Options for a blur shadow effect on the page. This is mutually
		 * exclusive to outline. Set radius to 0 to cancel.
		 * @type Object
		 */
		shadow: {
			radius: 0,
			offsetY: 0,
			offsetX: 0,
			color: [0, 0, 0, 0]
		},
		
		/**
		 * Options for an outline around a page. This is mutually exclusive to
		 * shadow. Set radius to 0 to cancel.
		 * @type Object
		 */
		outline: {
			radius: 0,
			color: [0, 0, 0, 0]
		}
	};
	
	/**
	 * The UI component for the progress bar.  Renders the container and the 
	 * indicator.
	 * 
	 * @param {Object} bounds the rectangular bounds of this component.
	 * @param {Object} config the hud draw configurations.  Defaults to 
	 * 				   hext.progressUI.barConfig
	 */	
	hext.progressUI.barUI = function(bounds, config) {
		this.config = hemi.utils.join({}, hext.progressUI.barConfig, config);
		this.containerBounds = bounds;
		this.indicatorBounds = {
			_top: bounds._top,
			_bottom: bounds._bottom,
			_left: bounds._left,
			_right: bounds._left
		};
		this.percent = 0;
	};
	
	/**
	 * Draws the progress bar to the hud.
	 */
	hext.progressUI.barUI.prototype.draw = function() {			
		hemi.hudManager.createRectangleOverlay(this.containerBounds, this.config.container);			
		hemi.hudManager.createRectangleOverlay(this.indicatorBounds, this.config.indicator);
	};
	
	/**
	 * Updates the progress bar to the given percentage and redraws.
	 * 
	 * @param {Object} percent the new progress percentage
	 */
	hext.progressUI.barUI.prototype.update = function(percent) {
		this.percent = percent/100;
		this.indicatorBounds._right = (this.containerBounds._right - this.containerBounds._left) * this.percent + this.containerBounds._left;
		
		this.draw();
	};
	
	/**
	 * The UI for the progress bar page/panel
	 * 
	 * @param {Object} bounds the rectangular bounds of the page UI
	 * @param {Object} config the hud draw configurations.  Defaults to 
	 * 				   hext.progressUI.pageConfig
	 */
	hext.progressUI.pageUI = function(bounds, config) {
		this.config = hemi.utils.join({}, hext.progressUI.pageConfig, config);
		this.bounds = bounds;
	};

	/**
	 * Draws the page ui to the hud.
	 */
	hext.progressUI.pageUI.prototype.draw = function() {
		hemi.hudManager.createRectangleOverlay(this.bounds, this.config);	
	};
	
	/**
	 * The progress bar.  Encapsulates the page and bar UIs and registers with
	 * hemi.msg.progress to update the bar UI.  Currently sets the bounds of
	 * the page to the client width and height with the bar set to 20 pixels 
	 * in height and 1/3 the client width.
	 * @param {hemi.client}
	 * @param {string} opt_taskName optional name of the task to get progress
	 *     updates for (otherwise display bar only updates for total progress)
	 */
	hext.progressUI.bar = function(client, opt_taskName) {
		var width = parseInt(client.getWidth()),
			height = parseInt(client.getHeight()),
			barHeight = 20,
			barWidth = width / 3;
		
		// set up the hud				
		this.pageUI = new hext.progressUI.pageUI({
			_top: 0,
			_left: 0,
			_bottom: height,
			_right: width
		});
		
		this.barUI = new hext.progressUI.barUI({
			_top: height / 2 - barHeight / 2,
			_left: width / 2 - barWidth / 2,
			_bottom: height / 2 + barHeight / 2,
			_right: width / 2 + barWidth / 2
		});
		
		this.progress = -1;
		this.task = opt_taskName;
		// immediately update
		this.update(0);
		hemi.subscribe(hemi.msg.progress, this, 'msgUpdate');
	};
	
	/**
	 * Callback for the hemi.msg.progress message type.  Only listens for
	 * the total progress information and updates the progress bar UI 
	 * accordingly.
	 * 
	 * @param {Object} progressMsg the message data received from the 
	 * 				   message dispatcher.
	 */
	hext.progressUI.bar.prototype.msgUpdate = function(progressMsg) {
		var progressInfo = progressMsg.data,
			percent = this.progress;
		
		if ((progressInfo.isTotal && this.task == null) || progressInfo.task === this.task) {
			percent = progressInfo.percent;
			this.update(percent);
		}
	};
		
	/**
	 * Updates the progress bar with the given progress.
	 * 
	 * @param {number} progress the progress in percent.
	 */
	hext.progressUI.bar.prototype.update = function(progress) {
		if (this.progress !== progress) {
			this.progress = progress;
			
			// update the ui
			hemi.hudManager.clearDisplay();
			this.pageUI.draw();
			this.barUI.update(this.progress);
			
			// if percent is 100, stop drawing this
			if (this.progress >= 99.9) {
				setTimeout(function() {
					hemi.hudManager.clearDisplay();
				}, 100);
			}
		}	
	};
	
	return hext;
})(hext || {});
