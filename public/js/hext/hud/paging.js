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
	 * @type PagingInfo
	 */
	hext.hud.pagingInfo = null;
	/**
	 * Flag indicating if the PagingInfo should be attached to HudDisplays.
	 * @type boolean
	 * @default false
	 */
	hext.hud.showInfo = false;

	/**
	 * @class A PagingInfo contains text and images for displaying information about a multi-page
	 * HudDisplay.
	 */
	var PagingInfo = function() {
		hemi.HudPage.call(this);

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

		this.pageInfo = new hemi.HudText();
		this.leftNav = new hemi.HudButton();
		this.rightNav = new hemi.HudButton();

		var that = this;
		this.leftNav.mouseDown = function(mouseEvent) {
			that.previousPage();
		};
		this.rightNav.mouseDown = function(mouseEvent) {
			that.nextPage();
		};
	};

	PagingInfo.prototype = new hemi.HudPage();
	PagingInfo.constructor = PagingInfo;

	/**
	 * Position the elements of the PagingInfo so they are drawn at the bottom of the given HudPage.
	 * 
	 * @param {hemi.HudPage} page page to append the PagingInfo to
	 */
	PagingInfo.prototype.appendToPage = function(page) {
		page.calculateBounds();
		this.pageInfo.setWidth(page._right - page._left - (2 * page.margin));
		this.pageInfo.x = (page._right + page._left) / 2;
		this.pageInfo.y = page._bottom;
		page.add(this.pageInfo);

		this.leftNav.x = page._left + page.margin;
		this.leftNav.y = page._bottom;
		page.add(this.leftNav);

		this.rightNav.x = page._right - (this.imageWidth + page.margin);
		this.rightNav.y = page._bottom;
		page.add(this.rightNav);
	};

	/**
	 * Load up the images and create textures for paging navigation icons.
	 */
	PagingInfo.prototype.loadPagingImages = function() {
		var width = this.imageWidth,
			height = this.imageHeight,
			that = this;

		this.leftNav.setSrcCoords({
			enabled: [0, 0],
			disabled: [0, height],
			hover: [0, 2*height]
		});
		this.rightNav.setSrcCoords({
			enabled: [width, 0],
			disabled: [width, height],
			hover: [width, 2*height]
		});

		this.leftNav.enabledImg._width =
		this.leftNav.disabledImg._width =
		this.leftNav.hoverImg._width =
		this.rightNav.enabledImg._width =
		this.rightNav.disabledImg._width =
		this.rightNav.hoverImg._width = this.imageWidth;

		this.leftNav.enabledImg._height =
		this.leftNav.disabledImg._height =
		this.leftNav.hoverImg._height =
		this.rightNav.enabledImg._height =
		this.rightNav.disabledImg._height =
		this.rightNav.hoverImg._height = this.imageHeight;

		hemi.loadImage(this.imageFile, function(image) {
				that.leftNav.enabledImg._image =
				that.leftNav.disabledImg._image =
				that.leftNav.hoverImg._image =
				that.rightNav.enabledImg._image =
				that.rightNav.disabledImg._image =
				that.rightNav.hoverImg._image = image;
			});
	};

	/**
	 * If possible, navigate the HudDisplay to its next page and append the PagingInfo elements to
	 * that page.
	 */
	PagingInfo.prototype.nextPage = function() {
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
	};

	/**
	 * If possible, navigate the HudDisplay to its previous page and append the PagingInfo elements
	 * to that page.
	 */
	PagingInfo.prototype.previousPage = function() {
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
	};

	/**
	 * Remove the elements of the PagingInfo from the given HudPage.
	 * 
	 * @param {hemi.HudPage} page page to remove the PagingInfo from
	 */
	PagingInfo.prototype.removeFromPage = function(page) {
		page.remove(this.leftNav);
		page.remove(this.rightNav);
		page.remove(this.pageInfo);
	};

	/**
	 * Set the navigation info and icons according to the given page index and maximum page number.
	 * 
	 * @param {number} ndx page index to set info for
	 * @param {number} max maximum page number
	 */
	PagingInfo.prototype.setNavInfo = function(ndx, max) {
		this.pageInfo.setText([(ndx + 1) + ' / ' + max]);
		this.leftNav.enabled = ndx > 0;
		this.rightNav.enabled = ndx < max - 1;
	};

	/**
	 * Add the PagingInfo control to the bottom of the given HudDisplay. This will allow the user to
	 * navigate the HudDisplay pages using clickable buttons or the keyboard.
	 */
	hext.hud.addPagingInfo = function(display) {
		if (hext.hud.pagingInfo === null) {
			hext.hud.pagingInfo = new PagingInfo();
			hext.hud.pagingInfo.loadPagingImages();
		}

		hext.hud.removePagingInfo();
		hext.hud.showInfo = true;
		hext.hud.pagingInfo.display = display;

		// register a keydown handler
		jQuery(document).unbind('keydown.hud');
		jQuery(document).bind('keydown.hud', function(evt) {
			if (evt.keyCode === 37) {
				hext.hud.pagingInfo.previousPage();
			} else if (evt.keyCode === 39) {
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
