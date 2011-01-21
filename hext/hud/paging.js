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
	/**
	 * @namespace A module for additional HUD features.
	 */
	hext.hud = hext.hud || {};
	
	/**
	 * The PagingInfo navigation control for multi-page HudDisplays.
	 * @type hext.hud.PagingInfo
	 */
	hext.hud.pagingInfo = null;
	/**
	 * Flag indicating if the PagingInfo should be attached to HudDisplays.
	 * @type boolean
	 * @default false
	 */
	hext.hud.showInfo = false;
	/*
	 * The MessageTarget created when the PagingInfo registers to receive HUD
	 * messages. We need to store it so we can remove it later.
	 */
	hext.hud.msgTarget = null;
	
	/**
	 * @class A PagingInfo contains text and images for displaying information
	 * about a multi-page HudDisplay.
	 * @extends hemi.hud.HudPage
	 */
	hext.hud.PagingInfo = function() {
		hemi.hud.HudPage.call(this);
		
		/**
		 * The HudDisplay currently using the PagingInfo.
		 * @type hemi.hud.HudDisplay
		 */
		this.display = null;
		
		/**
		 * The URL of the image file containing navigation icons.
		 * @type string
		 * @default 'hext/hud/assets/hudPaging.png'
		 */
		this.imageFile = 'hext/hud/assets/hudPaging.png';
		
		/**
		 * The width of each navigation icon.
		 * @type number
		 * @default 17
		 */
		this.imageWidth = 17;
		
		/**
		 * The height of each navigation icon.
		 * @type number
		 * @default 16
		 */
		this.imageHeight = 16;
		
		this.pageInfo = new hemi.hud.HudText();
		this.leftNav = new hemi.hud.HudButton();
		this.rightNav = new hemi.hud.HudButton();
		
		// Remove from the World's Citizens
		hemi.world.removeCitizen(this.pageInfo);
		hemi.world.removeCitizen(this.leftNav);
		hemi.world.removeCitizen(this.rightNav);
		
		this.leftNav.width = this.rightNav.width = this.imageWidth;
		this.leftNav.height = this.rightNav.height = this.imageHeight;
		
		var that = this;
		this.leftNav.mouseDown = function(mouseEvent) {
			that.display.previousPage();
		};
		this.rightNav.mouseDown = function(mouseEvent) {
			that.display.nextPage();
		};
		
		this.addElement(this.leftNav);
		this.addElement(this.rightNav);
		this.addElement(this.pageInfo);
	};
	
	hext.hud.PagingInfo.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hext.hud.PagingInfo',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * PagingInfo.
		 */
		cleanup: function() {
			hemi.hud.HudPage.prototype.cleanup.call(this);
			this.display = null;
			this.pageInfo.cleanup();
			this.leftNav.cleanup();
			this.rightNav.cleanup();
			this.pageInfo = null;
			this.leftNav = null;
			this.rightNav = null;
		},
		
		/**
		 * Position the elements of the PagingInfo so it is drawn at the bottom
		 * of the given HudPage.
		 * 
		 * @param {hemi.hud.HudPage} page page to append the PagingInfo to
		 */
		appendToPage: function(page) {
			this.margin = page.margin;
			this.drawBackground = page.drawBackground;
			
			var pageNdx = this.display.currentPage + 1;
			var numPages = this.display.pages.length;
			
			this.pageInfo.wrappedText = [pageNdx + ' / ' + numPages];
			this.pageInfo.x = (page.right + page.left) / 2;
			this.pageInfo.y = page.bottom;
			
			this.leftNav.enabled = pageNdx > 1;
			this.leftNav.x = page.left + page.margin;
			this.leftNav.y = page.bottom;
			
			this.rightNav.enabled = pageNdx < numPages;
			this.rightNav.x = page.right - (this.imageWidth + page.margin);
			this.rightNav.y = page.bottom;
		},
		
		/**
		 * Calculate the bounds (without the top margin).
		 * @see hemi.hud.HudPage#calculateBounds
		 */
		calculateBounds: function() {
			hemi.hud.HudPage.prototype.calculateBounds.call(this);
			
			this.top += this.margin;
		},
		
		/**
		 * Load up the images and create textures for paging navigation icons.
		 */
		loadPagingImages: function() {
			var that = this;
			
			hemi.loader.loadImage(
				this.imageFile,
				function(image) {
					var width = that.imageWidth,
						height = that.imageHeight;
					
					that.leftNav.image = image;
					that.rightNav.image = image;
					// Create the left arrow
					that.leftNav.enabledCoords = [0, 0];
					// Create the right arrow
					that.rightNav.enabledCoords = [width, 0];
					// Create the left disabled arrow
					that.leftNav.disabledCoords = [0, height];
					// Create the right disabled arrow
					that.rightNav.disabledCoords = [width, height];
					// Create the left hover arrow
					that.leftNav.hoverCoords = [0, 2*height];
					// Create the right hover arrow
					that.rightNav.hoverCoords = [width, 2*height];
				});
		}
	};
	
	hext.hud.PagingInfo.inheritsFrom(hemi.hud.HudPage);
	
	/**
	 * Show the PagingInfo control on the bottom of any currently visible
	 * HudDisplay. This will allow the user to navigate the HudDisplay pages
	 * using clickable buttons.
	 */
	hext.hud.showPagingInfo = function() {
		if (hext.hud.pagingInfo === null) {
			hext.hud.pagingInfo = new hext.hud.PagingInfo();
			hext.hud.pagingInfo.loadPagingImages();
			// Remove from the World's Citizens
			hemi.world.removeCitizen(hext.hud.pagingInfo);
		}
		
		if (!hext.hud.showInfo) {
			hext.hud.showInfo = true;
			
			hext.hud.msgTarget = hemi.msg.subscribe(hemi.msg.visible,
				function(msg) {
					if (msg.src.getCitizenType() === 'hemi.hud.HudDisplay') {
						if (msg.data.page === 0) {
							hext.hud.pagingInfo.display = null;
						} else {
							var page = msg.src.getCurrentPage();
							hext.hud.pagingInfo.display = msg.src;
							hext.hud.pagingInfo.appendToPage(page);
							hext.hud.pagingInfo.draw();
						}
					}
				});
			
			hemi.input.addMouseDownListener(hext.hud.pagingInfo);
			hemi.input.addMouseUpListener(hext.hud.pagingInfo);
			hemi.input.addMouseMoveListener(hext.hud.pagingInfo);
		}
	};
	
	/**
	 * Remove the PagingInfo control and do not attach it to any visible
	 * HudDisplays.
	 */
	hext.hud.hidePagingInfo = function() {
		if (hext.hud.showInfo) {
			hext.hud.showInfo = false;
			hemi.msg.unsubscribe(hext.hud.msgTarget);
			hext.hud.msgTarget = null;
			hemi.input.removeMouseMoveListener(hext.hud.pagingInfo);
			hemi.input.removeMouseUpListener(hext.hud.pagingInfo);
			hemi.input.removeMouseDownListener(hext.hud.pagingInfo);
		}
	};

	return hext;
})(hext || {});
