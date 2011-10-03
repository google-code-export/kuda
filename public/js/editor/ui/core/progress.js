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

var editor = (function(module) {
	
	module.ui = module.ui || {};
	
	var ProgressIndicator = module.ui.Component.extend({
		init: function() {		
			this._super();	
			this.progress = -1;
		},
		
		finishLayout: function() {
			this.container = jQuery('<div id="progressIndicator"></div>');
			this.text = jQuery('<span class="prgBarText">Loading...</span>');
			this.barWrapper = jQuery('<div class="prgBarContainer"></div>');
			this.indicator = jQuery('<div class="prgBarIndicator"></div>');
		
			this.barWrapper.append(this.indicator);
			this.container.append(this.text).append(this.barWrapper);
			
			this.container.css('zIndex', editor.ui.Layer.DIALOG);
			// immediately update
			this.update(0);
			hemi.world.subscribe(hemi.msg.progress, this, 'msgUpdate');
		},
		
		/**
		 * Callback for the hemi.msg.progress message type.  Only listens for
		 * the total progress information and updates the progress bar UI 
		 * accordingly.
		 * 
		 * @param {Object} progressMsg the message data received from the 
		 * 				   message dispatcher.
		 */
		msgUpdate: function(progressMsg) {
			var progressInfo = progressMsg.data,
				percent = this.progress;
			
			if (progressInfo.isTotal) {
				percent = progressInfo.percent;
				this.update(percent);
			}
		},
		
		setVisible: function(visible) {
			var ctn = this.container;
			
			if (visible) {
				var	windowHeight = jQuery(window).height(),
					windowWidth = window.innerWidth ? window.innerWidth 
						: document.documentElement.offsetWidth,
					top = windowHeight - ctn.height(),
					left = (windowWidth - ctn.width())/2;
								
				ctn.show().css({
					top: top + 20 + 'px',
					left: left + 'px',
					opacity: 0,
					position: 'absolute'
				}).animate({
					opacity: 1,
					top: '-=20'
				}, 300);
			}
			else {
				ctn.animate({
					opacity: 0,
					top: '+=20'
				}, 400, function(){
					ctn.hide();
				});
			}
		},
		
		/**
		 * Updates the progress bar with the given progress.
		 * 
		 * @param {number} progress the progress in percent.
		 */
		update: function(progress) {
			if (this.progress !== progress) {
				if (!this.isVisible()) {
					this.setVisible(true);
				}
				var wgt = this;
				this.progress = progress;
				
				// update the ui
				this.indicator.width(this.barWrapper.width() * progress/100);
				
				// if percent is 100, stop drawing this
				if (this.progress >= 99.9) {
					setTimeout(function() {
						wgt.progress = -1;
						wgt.setVisible(false);
					}, 100);
				}
			}
		}
	});
	
	module.ui.progressUI = new ProgressIndicator();
	
	jQuery(document).bind('ready', function() {
		jQuery('body').append(module.ui.progressUI.getUI());
		module.ui.progressUI.container.hide();
	});
	
	return module;
})(editor || {});
