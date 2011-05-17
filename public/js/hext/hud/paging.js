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
	
	/**
	 * @class A PagingInfo contains text and images for displaying information
	 * about a multi-page HudDisplay.
	 */
	hext.hud.PagingInfo = function() {
		/**
		 * The HudDisplay currently using the PagingInfo.
		 * @type hemi.hud.HudDisplay
		 */
		this.display = null;
		
		/**
		 * The URL of the image file containing navigation icons.
		 * @type string
		 * @default 'js/hext/hud/assets/hudPaging.png'
		 */
		this.imageFile = 'js/hext/hud/assets/hudPaging.png';
		
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
			that.previousPage();
		};
		this.rightNav.mouseDown = function(mouseEvent) {
			that.nextPage();
		};
	};
	
	hext.hud.PagingInfo.prototype = {
		/**
		 * Position the elements of the PagingInfo so they are drawn at the
		 * bottom of the given HudPage.
		 * 
		 * @param {hemi.hud.HudPage} page page to append the PagingInfo to
		 */
		appendToPage: function(page) {
			page.calculateBounds();
			this.pageInfo.setWidth(page.right - page.left - (2 * page.margin));
			this.pageInfo.x = (page.right + page.left) / 2;
			this.pageInfo.y = page.bottom;
			page.addElement(this.pageInfo);
			
			this.leftNav.x = page.left + page.margin;
			this.leftNav.y = page.bottom;
			page.addElement(this.leftNav);
			
			this.rightNav.x = page.right - (this.imageWidth + page.margin);
			this.rightNav.y = page.bottom;
			page.addElement(this.rightNav);
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
		},
		
		/**
		 * If possible, navigate the HudDisplay to its next page and append the
		 * PagingInfo elements to that page.
		 */
		nextPage: function() {
			var ndx = this.display.currentPage,
				numPages = this.display.pages.length;
			
			if (ndx < numPages - 1) {
				var curPage = this.display.pages[ndx],
					nextPage = this.display.pages[ndx + 1];
				
				this.setNavInfo(ndx + 1, numPages);
				this.removeFromPage(curPage);
				this.appendToPage(nextPage);
				this.display.nextPage();
			}
		},
		
		/**
		 * If possible, navigate the HudDisplay to its previous page and append
		 * the PagingInfo elements to that page.
		 */
		previousPage: function() {
			var ndx = this.display.currentPage,
				numPages = this.display.pages.length;
				
			if (ndx > 0) {
				var curPage = this.display.pages[ndx],
					prevPage = this.display.pages[ndx - 1];
				
				this.setNavInfo(ndx - 1, numPages);
				this.removeFromPage(curPage);
				this.appendToPage(prevPage);
				this.display.previousPage();
			}
		},
		
		/**
		 * Remove the elements of the PagingInfo from the given HudPage.
		 * 
		 * @param {hemi.hud.HudPage} page page to remove the PagingInfo from
		 */
		removeFromPage: function(page) {
			page.removeElement(this.leftNav);
			page.removeElement(this.rightNav);
			page.removeElement(this.pageInfo);
		},
		
		/**
		 * Set the navigation info and icons according to the given page index
		 * and maximum page number.
		 * 
		 * @param {number} ndx page index to set info for
		 * @param {number} max maximum page number
		 */
		setNavInfo: function(ndx, max) {
			this.pageInfo.setText([(ndx + 1) + ' / ' + max]);
			this.leftNav.enabled = ndx > 0;
			this.rightNav.enabled = ndx < max - 1;
		}
	};
	
	hext.hud.PagingInfo.inheritsFrom(hemi.hud.HudPage);
	
	/**
	 * Add the PagingInfo control to the bottom of the given HudDisplay. This
	 * will allow the user to navigate the HudDisplay pages using clickable
	 * buttons or the keyboard.
	 */
	hext.hud.addPagingInfo = function(display) {
		if (hext.hud.pagingInfo === null) {
			hext.hud.pagingInfo = new hext.hud.PagingInfo();
			hext.hud.pagingInfo.loadPagingImages();
			// Remove from the World's Citizens
			hemi.world.removeCitizen(hext.hud.pagingInfo);
		}
		
		if (hext.hud.showInfo) {
			hext.hud.removePagingInfo();
		}
		
		hext.hud.showInfo = true;
		hext.hud.pagingInfo.display = display;
		
		// register a keydown handler
		jQuery(document).unbind('keydown.hud');
		jQuery(document).bind('keydown.hud', function(evt) {
			var key = hemi.core.event.getEventKeyChar(evt);
			
			if (key === 37) {
				hext.hud.pagingInfo.previousPage();
			} else if (key === 39) {
				hext.hud.pagingInfo.nextPage();
			}
		});
		
		var msgTarget = display.subscribe(hemi.msg.visible,
			function(msg) {
				if (msg.data.page !== 0) {
					display.unsubscribe(msgTarget);
					var page = display.getCurrentPage(),
						ndx = display.currentPage,
						numPages = display.pages.length;
					
					hext.hud.pagingInfo.setNavInfo(ndx, numPages);
					hext.hud.pagingInfo.appendToPage(page);
					// Force a redraw now that we've appended
					display.showPage();
				}
			});
	};
	
	/**
	 * Remove the PagingInfo control from its current HudDisplay.
	 */
	hext.hud.removePagingInfo = function() {
		if (hext.hud.showInfo) {
			jQuery(document).unbind('keydown.hud');
			var page = hext.hud.pagingInfo.display.getCurrentPage();
			hext.hud.pagingInfo.removeFromPage(page);
			hext.hud.pagingInfo.display = null;
			hext.hud.showInfo = false;
		}
	};

	return hext;
})(hext || {});
