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

o3djs.require('hemi.core');
o3djs.require('hemi.input');
o3djs.require('hemi.loader');
o3djs.require('hemi.msg');
o3djs.require('hemi.utils.stringUtils');
o3djs.require('hemi.view');
o3djs.require('hemi.world');

var hemi = (function(hemi) {
	/**
	 * @namespace A module for heads up display (HUD) creation and
	 * manipulation.
	 */
	hemi.hud = hemi.hud || {};

	/**
	 * Creates the HudManager (which handles all HUD operations) and the Pack
	 * for HUD objects.
	 */
	hemi.hud.init = function() {
		this.pack = hemi.core.client.createPack();
		this.theme = new hemi.hud.Theme();
		this.theme.name = 'Default';
		this.hudMgr = new hemi.hud.HudManager();
	};
	
	/**
	 * Clean up objects created by the HUD Pack.
	 */
	hemi.hud.cleanup = function() {
		this.pack.destroy();
		this.pack = null;
		this.hudMgr = null;
		this.theme = null;
	};
	
	/**
	 * Set the current theme for HUD displays.
	 * 
	 * @param {hemi.hud.Theme} theme display options for HUD elements
	 */
	hemi.hud.setTheme = function(theme) {
		this.theme = theme;
	};
	
	/**
	 * @class A Theme contains configuration options for displaying HUD elements
	 * like pages and text.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.Theme = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * Configuration options for an image foreground overlay.
		 * @type Object
		 */
		this.image = {
			/**
			 * Options for a blur shadow effect on the image. Set radius to 0 to
			 * cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 1]
			}
		};
		
		/**
		 * Configuration options for a rectangular background overlay.
		 * @type Object
		 */
		this.page = {
			/**
			 * The color and opacity of the rectangular overlay in RGBA format.
			 * @type number[4]
			 * @default [0, 0, 0, 0.45]
			 */
			color: [0, 0, 0, 0.45],
			
			/**
			 * The amount of curving to apply to the corners of the page. Range
			 * is from 0.0 to 1.0 where 0 is a plain rectangle and 1 is an oval.
			 */
			curve: 0,
			
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
			 * Optional outline for the page in RGBA format. This is mutually
			 * exclusive to shadow. Set to null to cancel.
			 * @type number[4]
			 */
			outline: null
		};
		
		/**
		 * Configuration options for a textual foreground overlay.
		 * @type Object
		 */
		this.text = {
			/**
			 * The font size of the text.
			 * @type number
			 * @default 12
			 */
			textSize: 12,
			
			/**
			 * The name of the font to use to paint the text.
			 * @type string
			 * @default 'helvetica'
			 */
			textTypeface: 'helvetica',
			
			/**
			 * The horizontal alignment of the text.
			 * @type string
			 * @default 'center'
			 */
			textAlign: 'center',
			
			/**
			 * Additional styling for the text (normal, bold, italics)
			 * @type string
			 * @default 'bold'
			 */
			textStyle: 'bold',
			
			/**
			 * Flag to indicate if the HudManager should perform strict text
			 * wrapping.
			 * @type boolean
			 * @default true
			 */
			strictWrapping: true,
			
			/**
			 * Number of pixels to place between lines of text.
			 * @type number
			 * @default 5
			 */
			lineMargin: 5,
			
			/**
			 * The color and opacity of the text in RGBA format.
			 * @type number[4]
			 * @default [1, 1, 0.6, 1]
			 */
			color: [1, 1, 0.6, 1],
			
			/**
			 * Options for a blur shadow effect on the text. This is mutually
			 * exclusive to outline. Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0.5,
				offsetY: 1,
				offsetX: 1,
				color: [0, 0, 0, 1]
			},
			
			/**
			 * Optional outline for the text in RGBA format. This is mutually
			 * exclusive to shadow. Set to null to cancel.
			 * @type number[4]
			 */
			outline: null
		};
		
		/**
		 * Configuration options for a video foreground overlay.
		 * @type Object
		 */
		this.video = {
			/**
			 * Options for a blur shadow effect on the video. Set radius to 0 to
			 * cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 1]
			}
		};
	};
	
	hemi.hud.Theme.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.Theme',
		
		/**
		 * Set the Theme as the current Theme for HUD displays.
		 */
		load: function() {
			hemi.hud.setTheme(this);
		},
		
		/**
		 * Get the Octane structure for the Theme.
	     *
	     * @return {Object} the Octane structure representing the Theme
		 */
		toOctane: function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'image',
				val: this.image
			});
			octane.props.push({
				name: 'page',
				val: this.page
			});
			octane.props.push({
				name: 'text',
				val: this.text
			});
			octane.props.push({
				name: 'load',
				arg: []
			});
			
			return octane;
		}
	};
	
	hemi.hud.Theme.inheritsFrom(hemi.world.Citizen);
	
	/**
	 * @class A HudElement contains the basics of any element to be drawn on
	 * the canvas.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.HudElement = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * The handler function for mouse down events that occur within the
		 * bounds of the HudElement.
		 * @type function(o3d.Event): void
		 */
		this.mouseDown = null;
		
		/**
		 * The handler function for mouse up events that occur within the
		 * bounds of the HudElement.
		 * @type function(o3d.Event): void
		 */
		this.mouseUp = null;
		
		/**
		 * The handler function for mouse move events. It takes the Event and a
		 * boolean indicating if the Event occurred within the bounds of the
		 * HudElement.
		 * @type function(o3d.Event, boolean): void
		 */
		this.mouseMove = null;
		
		/**
		 * The y-value of the upper boundary of the HudElement. This value
		 * should be calculated at draw time rather than set directly.
		 * @type number 
		 */
		this.top = 0;
		
		/**
		 * The y-value of the lower boundary of the HudElement. This value
		 * should be calculated at draw time rather than set directly.
		 * @type number 
		 */
		this.bottom = 0;
		
		/**
		 * The x-value of the left boundary of the HudElement. This value
		 * should be calculated at draw time rather than set directly.
		 * @type number 
		 */
		this.left = 0;
		
		/**
		 * The x-value of the right boundary of the HudElement. This value
		 * should be calculated at draw time rather than set directly.
		 * @type number 
		 */
		this.right = 0;
		
		this.config = {};
	};
	
	hemi.hud.HudElement.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.HudElement',
		
		/**
		 * Send a cleanup Message and remove all references in the HudElement.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			this.mouseDown = null;
			this.mouseUp = null;
			this.mouseMove = null;
			this.config = {};
		},
		
		/**
		 * Get the Octane structure for the HudElement.
	     *
	     * @return {Object} the Octane structure representing the HudElement
		 */
		toOctane: function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'top',
				val: this.top
			});
			octane.props.push({
				name: 'bottom',
				val: this.bottom
			});
			octane.props.push({
				name: 'left',
				val: this.left
			});
			octane.props.push({
				name: 'right',
				val: this.right
			});
			octane.props.push({
				name: 'config',
				val: this.config
			});
			
			return octane;
		},
		
		/**
		 * Calculate the top, bottom, left, and right values for the
		 * HudElement. This should be implemented by subclasses.
		 */
		calculateBounds: function() {
			
		},
		
		/**
		 * Check if the given Event occurred within the bounds of the
		 * HudElement.
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     the HudElement, otherwise false
		 */
		checkEvent: function(event) {
			var intersected = event.x <= this.right &&
				event.x >= this.left &&
				event.y <= this.bottom &&
				event.y >= this.top;
			
			return intersected;
		},
		
		/**
		 * Use the HudManager to draw the HudElement on screen. This should be
		 * implemented by subclasses.
		 */
		draw: function() {
			
		},
		
		/**
		 * If the given Event occurred within the bounds of this HudElement,
		 * call the HudElement's mouse down handler function (if one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     this HudElement, otherwise false
		 */
		onMouseDown: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected && this.mouseDown) {
				this.mouseDown(event);
			}
			
			return intersected;
		},
		
		/**
		 * If the HudElement's mouse move handler function is set, pass it the
		 * given Event and if it occurred within the bounds of this HudElement.
		 * 
		 * @param {o3d.Event} event the event that occurred
		 */
		onMouseMove: function(event) {
			if (this.mouseMove) {
				var intersected = this.checkEvent(event);
				this.mouseMove(event, intersected);
			}
		},
		
		/**
		 * If the given Event occurred within the bounds of this HudElement,
		 * call the HudElement's mouse up handler function (if one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     this HudElement, otherwise false
		 */
		onMouseUp: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected && this.mouseUp) {
				this.mouseUp(event);
			}
			
			return intersected;
		},
		
		/**
		 * Set unique display options for this HudElement. All other display
		 * options will be derived from the current Theme.
		 * 
		 * @param {Object} config configuration options
		 */
		setConfig: function(config) {
			this.config = config;
		}
	};
	
	hemi.hud.HudElement.inheritsFrom(hemi.world.Citizen);
	
	/**
	 * @class A HudText contains formated text and display options for a single
	 * area of text on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudText = function() {
		hemi.hud.HudElement.call(this);
		
		/**
		 * The x-coordinate of the HudText. The actual on screen location will
		 * depend on the horizontal alignment of the text.
		 * @type number
		 * @default 0
		 */
		this.x = 0;
		
		/**
		 * The y-coordinate of the top of the HudText.
		 * @type number
		 * @default 0
		 */
		this.y = 0;
		
		/**
		 * The formatted text that is actually drawn on screen. This property
		 * is created whenever the text, config, or width are set. It should
		 * typically not be set directly.
		 * @type string[]
		 */
		this.wrappedText = [];
		
		/**
		 * The height of the formatted text. This property is calculated
		 * whenever the text, config, or width are set. It should typically not
		 * be set directly.
		 * @type number
		 */
		this.wrappedHeight = 0;
		
		/**
		 * The width of the formatted text. This property is calculated
		 * whenever the text, config, or width are set. It should typically not
		 * be set directly.
		 * @type number
		 */
		this.wrappedWidth = 0;
		
		this.text = [];
		this.width = 0;
	};
	
	hemi.hud.HudText.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.HudText',
		
		/**
		 * Get the Octane structure for the HudText.
	     *
	     * @return {Object} the Octane structure representing the HudText
		 */
		toOctane: function() {
			var octane = hemi.hud.HudElement.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			octane.props.push({
				name: 'setText',
				arg: [this.text]
			});
			octane.props.push({
				name: 'setWidth',
				arg: [this.width]
			});
			
			return octane;
		},

		/**
		 * Calculate the bounds of the formatted text.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			var align;
			
			if (this.config.textAlign != null) {
				align = this.config.textAlign.toLowerCase();
			} else {
				align = hemi.hud.theme.text.textAlign.toLowerCase();
			}
			
			this.top = this.y;
			this.bottom = this.top + this.wrappedHeight;

			switch (align) {
				case 'left':
					this.left = this.x;
					this.right = this.left + this.wrappedWidth;
					break;
				case 'right':
					this.right = this.x;
					this.left = this.right - this.wrappedWidth;
					break;
				default:
					var offset = this.wrappedWidth / 2;
					this.left = this.x - offset;
					this.right = this.x + offset;
					break;
			}
		},

		/**
		 * Draw the formatted text.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			hemi.hud.hudMgr.createTextOverlay(this.wrappedText, this.config, this.x, this.y);
		},

		/**
		 * Set unique display options for this HudText and perform text wrapping
		 * for the new options.
		 * 
		 * @param {Object} config configuration options
		 */
		setConfig: function(config) {
			hemi.hud.HudElement.prototype.setConfig.call(this, config);
			this.wrapText();
		},

		/**
		 * Set the text to display for this HudText. Perform text wrapping for
		 * the new text.
		 * 
		 * @param {string} text a string or array of strings to display
		 */
		setText: function(text) {
			if (text instanceof Array) {
				this.text = text;
			} else {
				this.text = [text];
			}
			
			this.wrapText();
		},
		
		/**
		 * Set the desired width for this HudText. Perform text wrapping for
		 * the new width.
		 * 
		 * @param {number} width desired width for this HudText
		 */
		setWidth: function(width) {
			this.width = width;
			this.wrapText();
		},
		
		/**
		 * Perform text wrapping on the HudText's text. This sets the
		 * wrappedText, wrappedWidth, and wrappedHeight properties.
		 */
		wrapText: function() {
			if (this.width <= 0 || this.text.length <= 0) {
				return;
			}

			var width = 0;
			var height = 0;
			var wrappedText = [];

			for (var ndx = 0, len = this.text.length; ndx < len; ndx++) {
				var textObj = hemi.hud.hudMgr.doTextWrapping(this.text[ndx], this.width, this.config);
				
				if (textObj.width > width) {
					width = textObj.width;
				}
				
				height += textObj.height;
				wrappedText = wrappedText.concat(textObj.text);
			}

			this.wrappedWidth = width;
			this.wrappedHeight = height;
			this.wrappedText = wrappedText;
		}
	};
	
	hemi.hud.HudText.inheritsFrom(hemi.hud.HudElement);
	
	/**
	 * @class A HudImage contains a texture and display options for a single
	 * image on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudImage = function() {
		hemi.hud.HudElement.call(this);
		
		/**
		 * The x-coordinate of the left side of the HudImage.
		 * @type number
		 * @default 0
		 */
		this.x = 0;
		
		/**
		 * The y-coordinate of the top of the HudImage.
		 * @type number
		 * @default 0
		 */
		this.y = 0;
		
		/**
		 * The x-coordinate of the source image to pull image data from.
		 * @type number
		 * @default 0
		 */
		this.srcX = 0;
		
		/**
		 * The y-coordinate of the source image to pull image data from.
		 * @type number
		 * @default 0
		 */
		this.srcY = 0;
		
		/**
		 * The height of the image. This property is calculated when the image
		 * URL is loaded. It should typically not be set directly.
		 * @type number
		 */
		this.height = 0;
		
		/**
		 * The width of the image. This property is calculated when the image
		 * URL is loaded. It should typically not be set directly.
		 * @type number
		 */
		this.width = 0;
		
		this.image = null;
		this.url = null;
	};
	
	hemi.hud.HudImage.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.HudImage',
		
		/**
		 * Send a cleanup Message and remove all references in the HudImage.
		 */
		cleanup: function() {
			hemi.hud.HudElement.prototype.cleanup.call(this);
			this.image = null;
		},
		
		/**
		 * Get the Octane structure for the HudImage.
	     *
	     * @return {Object} the Octane structure representing the HudImage
		 */
		toOctane: function() {
			var octane = hemi.hud.HudElement.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			octane.props.push({
				name: 'srcX',
				val: this.srcX
			});
			octane.props.push({
				name: 'srcY',
				val: this.srcY
			});
			octane.props.push({
				name: 'setImageUrl',
				arg: [this.url]
			});
			
			return octane;
		},
		
		/**
		 * Calculate the bounds of the image.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			this.top = this.y;
			this.bottom = this.top + this.height;
			this.left = this.x;
			this.right = this.left + this.width;
		},
		
		/**
		 * Draw the image texture.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			if (this.width !== this.image.width ||
				this.height !== this.image.height || this.srcX !== 0 ||
				this.srcY !== 0) {
				hemi.hud.hudMgr.createImageOverlay(this.image, this.config,
					this.x, this.y, this.srcX, this.srcY, this.width,
					this.height);
			} else {
				hemi.hud.hudMgr.createImageOverlay(this.image, this.config,
					this.x, this.y);
			}
		},
		
		/**
		 * Get the URL of the image file to load.
		 * 
		 * @return {string} the URL of the image file
		 */
		getImageUrl: function() {
			return this.url;
		},
		
		/**
		 * Set the URL of the image file to load and begin loading it.
		 * 
		 * @param {string} url the URL of the image file
		 */
		setImageUrl: function(url) {
			this.url = url;
			
			if (this.image !== null) {
				this.image = null;
			}
			
			this.loadImage();
		},
		
		/**
		 * Load the image from the image url into a texture for the HudManager
		 * to paint. This sets the texture, height, and width properties.
		 */
		loadImage: function() {
			var that = this;
			
			hemi.loader.loadImage(
				this.url,
				function(image) {
					that.image = image;
					that.height = image.height;
					that.width = image.width;
					that.send(hemi.msg.load, {});
				});
		}
	};

	hemi.hud.HudImage.inheritsFrom(hemi.hud.HudElement);
	hemi.hud.HudImage.prototype.msgSent =
		hemi.hud.HudImage.prototype.msgSent.concat([hemi.msg.load]);

	/**
	 * @class A HudButton uses different images based on if the button is
	 * enabled or if a mouse is hovering over it.
	 * @extends hemi.hud.HudImage
	 */
	hemi.hud.HudButton = function() {
		hemi.hud.HudElement.call(this);
		
		/**
		 * The x-coordinate of the left side of the HudButton.
		 * @type number
		 * @default 0
		 */
		this.x = 0;
		
		/**
		 * The y-coordinate of the top of the HudButton.
		 * @type number
		 * @default 0
		 */
		this.y = 0;
		
		/**
		 * Flag indicating if the HudButton is enabled.
		 * @type boolean
		 * @default true
		 */
		this.enabled = true;
		
		/**
		 * Flag indicating if the mouse cursor is hovering over the HudButton.
		 * @type boolean
		 * @default false
		 */
		this.hovering = false;
		
		/**
		 * The HudImage to use for the HudButton when it is enabled.
		 * @type hemi.hud.HudImage
		 */
		this.enabledImg = null;
		
		/**
		 * The HudImage to use for the HudButton when it is disabled.
		 * @type hemi.hud.HudImage
		 */
		this.disabledImg = null;
		
		/**
		 * The HudImage to use for the HudButton when it is enabled and the
		 * mouse cursor is hovering.
		 * @type hemi.hud.HudImage
		 */
		this.hoverImg = null;
		
		var that = this;
		
		/**
		 * The built-in mouse move handler for a HudButton. If the mouse move
		 * occurred within the button's bounds, set it's hovering flag and
		 * redraw the button.
		 * @see hemi.hud.HudElement#mouseMove
		 * 
		 * @param {o3d.Event} event the mouse move event
		 * @param {boolean} intersected true if the event occurred within the
		 *     HudButton's bounds
		 */
		this.mouseMove = function(event, intersected) {
			if (intersected) {
				if (!that.hovering) {
					that.hovering = true;
					that.draw();
				}
			} else if (that.hovering) {
				that.hovering = false;
				that.draw();
			}
		};
	};
	
	hemi.hud.HudButton.prototype = {
		/**
		 * Send a cleanup Message and remove all references in the HudButton.
		 */
		cleanup: function() {
			hemi.hud.HudElement.prototype.cleanup.call(this);
			this.mouseMove = null;
			
			if (this.enabledImg) {
				this.enabledImg.cleanup();
				this.enabledImg = null;
			}
			if (this.disabledImg) {
				this.disabledImg.cleanup();
				this.disabledImg = null;
			}
			if (this.hoverImg) {
				this.hoverImg.cleanup();
				this.hoverImg = null;
			}
		},
		
		/**
		 * Get the Octane structure for the HudButton.
	     *
	     * @return {Object} the Octane structure representing the HudButton
		 */
		toOctane: function() {
			var octane = hemi.hud.HudElement.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			octane.props.push({
				name: 'enabledImg',
				id: this.enabledImg.getId()
			});
			octane.props.push({
				name: 'disabledImg',
				id: this.disabledImg.getId()
			});
			octane.props.push({
				name: 'hoverImg',
				id: this.hoverImg.getId()
			});
			
			return octane;
		},
		
		/**
		 * Calculate the bounds of the button.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			var img = this.getImage();
			this.top = this.y;
			this.bottom = this.top + img.height;
			this.left = this.x;
			this.right = this.left + img.width;
		},
		
		/**
		 * Set the HudButton's image based on the enabled and hovering flags
		 * and then draw it.
		 * @see hemi.hud.HudImage#draw
		 */
		draw: function() {
			var img = this.getImage();
			img.x = this.x;
			img.y = this.y;
			img.draw();
		},
		
		/**
		 * Get the image that represents the HudButton in its current state.
		 * 
		 * @return {hemi.hud.HudImage} the image to draw for the HudButton
		 */
		getImage: function() {
			var img = this.enabledImg;
			
			if (!this.enabled) {
				if (this.disabledImg) {
					img = this.disabledImg;
				}
			} else if (this.hovering) {
				if (this.hoverImg) {
					img = this.hoverImg;
				}
			}
			
			return img;
		},
		
		/**
		 * Set the source x and y coordinates for the HudButtons images.
		 * 
		 * @param {Object} coords structure with optional coordinates for
		 *     different images
		 */
		setCoords: function(coords) {
			var disabledCoords = coords.disabled,
				enabledCoords = coords.enabled,
				hoverCoords = coords.hover;
			
			if (this.enabledImg === null) {
				this.enabledImg = new hemi.hud.HudImage();
			}
			if (this.disabledImg === null) {
				this.disabledImg = new hemi.hud.HudImage();
			}
			if (this.hoverImg === null) {
				this.hoverImg = new hemi.hud.HudImage();
			}
			if (enabledCoords != null) {
				this.enabledImg.srcX = enabledCoords[0];
				this.enabledImg.srcY = enabledCoords[1];
			}
			if (disabledCoords != null) {
				this.disabledImg.srcX = disabledCoords[0];
				this.disabledImg.srcY = disabledCoords[1];
			}
			if (hoverCoords != null) {
				this.hoverImg.srcX = hoverCoords[0];
				this.hoverImg.srcY = hoverCoords[1];
			}
		},
		
		/**
		 * Set the image urls for the HudButtons images.
		 * 
		 * @param {Object} urls structure with optional urls for different
		 *     images
		 */
		setUrls: function(urls) {
			var disabledUrl = urls.disabled,
				enabledUrl = urls.enabled,
				hoverUrl = urls.hover,
				that = this;
			
			if (!enabledUrl) {
				return;
			}
			if (this.enabledImg === null) {
				this.enabledImg = new hemi.hud.HudImage();
			}
			if (this.disabledImg === null) {
				this.disabledImg = new hemi.hud.HudImage();
			}
			if (this.hoverImg === null) {
				this.hoverImg = new hemi.hud.HudImage();
			}
			
			var enMsg = this.enabledImg.subscribe(hemi.msg.load, function(evt) {
				if (that.disabledImg.url === null) {
					that.disabledImg.url = enabledUrl;
					that.disabledImg.image = that.enabledImg.image;
					that.disabledImg.height = that.enabledImg.height;
					that.disabledImg.width = that.enabledImg.width;
				}
				if (that.hoverImg.url === null) {
					that.hoverImg.url = enabledUrl;
					that.hoverImg.image = that.enabledImg.image;
					that.hoverImg.height = that.enabledImg.height;
					that.hoverImg.width = that.enabledImg.width;
				}
				that.enabledImg.unsubscribe(enMsg);
			});
			
			if (disabledUrl != null && disabledUrl !== enabledUrl) {
				this.disabledImg.setImageUrl(disabledUrl);
			}
			if (hoverUrl != null && hoverUrl !== enabledUrl) {
				this.hoverImg.setImageUrl(hoverUrl);
			}
			this.enabledImg.setImageUrl(enabledUrl);
		}
	};
	
	hemi.hud.HudButton.inheritsFrom(hemi.hud.HudElement);
	
	/**
	 * @class A HudVideo contains a texture and display options for a single
	 * image on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudVideo = function() {
		hemi.hud.HudElement.call(this);
		
		/**
		 * The x-coordinate of the left side of the HudVideo.
		 * @type number
		 * @default 0
		 */
		this.x = 0;
		
		/**
		 * The y-coordinate of the top of the HudVideo.
		 * @type number
		 * @default 0
		 */
		this.y = 0;
		
		/**
		 * The height of the video. Call setHeight to change.
		 * @type number
		 */
		this.height = 0;
		
		/**
		 * The width of the video. Call setWidth to change.
		 * @type number
		 */
		this.width = 0;
		
		this.urls = [];
		this.video = document.createElement('video');
		var vid = this.video,
			that = this;
		
		this.video.onloadeddata = function() {
			if (that.height === 0) {
				that.height = vid.videoHeight;
			} else {
				vid.setAttribute('height', '' + that.height);
			}
			if (that.width === 0) {
				that.width = vid.videoWidth;
			} else {
				vid.setAttribute('width', '' + that.width);
			}
			that.send(hemi.msg.load, {
				src: vid.currentSrc
			});
		};
	};
	
	hemi.hud.HudVideo.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.HudVideo',
		
		/**
		 * Add the given URL as a source for the video file to load.
		 * 
		 * @param {string} url the URL of the video file
		 * @param {string} type the type of the video file (ogv, mp4, etc)
		 */
		addVideoUrl: function(url, type) {
			var src = document.createElement('source'),
				loadUrl = hemi.loader.getPath(url);
			
			src.setAttribute('src', loadUrl);
			src.setAttribute('type', 'video/' + type);
			this.video.appendChild(src);
			this.urls.push({
				url: url,
				type: type,
				node: src
			});
		},
		
		/**
		 * Send a cleanup Message and remove all references in the HudVideo.
		 */
		cleanup: function() {
			hemi.hud.HudElement.prototype.cleanup.call(this);
			this.video = null;
			this.urls = [];
		},
		
		/**
		 * Get the Octane structure for the HudVideo.
	     *
	     * @return {Object} the Octane structure representing the HudVideo
		 */
		toOctane: function() {
			var octane = hemi.hud.HudElement.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'x',
				val: this.x
			});
			octane.props.push({
				name: 'y',
				val: this.y
			});
			
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				octane.props.push({
					name: 'addVideoUrl',
					arg: [urlObj.url, urlObj.type]
				});
			}
			
			return octane;
		},
		
		/**
		 * Calculate the bounds of the video.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			this.top = this.y;
			this.bottom = this.top + this.height;
			this.left = this.x;
			this.right = this.left + this.width;
		},
		
		/**
		 * Draw the video.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			hemi.hud.hudMgr.createVideoOverlay(this.video, this.config, this.x,
				this.y, this.width, this.height);
		},
		
		/**
		 * Remove the given URL as a source for the video file to load.
		 * 
		 * @param {string} url the URL to remove
		 */
		removeVideoUrl: function(url) {
			for (var i = 0, il = this.urls.length; i < il; i++) {
				var urlObj = this.urls[i];
				
				if (urlObj.url === url) {
					this.video.removeChild(urlObj.node);
					this.urls.splice(i, 1);
					break;
				}
			}
		},
		
		/**
		 * Set the height for the video to be displayed at.
		 * 
		 * @param {number} height the height to set for the video
		 */
		setHeight: function(height) {
			this.height = height;
			if (this.video !== null) {
				this.video.setAttribute('height', '' + height);
			}
		},
		
		/**
		 * Set the width for the video to be displayed at.
		 * 
		 * @param {number} width the width to set for the video
		 */
		setWidth: function(width) {
			this.width = width;
			if (this.video !== null) {
				this.video.setAttribute('width', '' + width);
			}
		}
	};

	hemi.hud.HudVideo.inheritsFrom(hemi.hud.HudElement);
	hemi.hud.HudVideo.prototype.msgSent =
		hemi.hud.HudVideo.prototype.msgSent.concat([hemi.msg.load]);
	
	/**
	 * @class A HudPage contains other HudElements and display options for
	 * drawing a single page on the HUD.
	 * @extends hemi.hud.HudElement
	 */
	hemi.hud.HudPage = function() {
		hemi.hud.HudElement.call(this);
		
		/**
		 * Flag indicating if a background rectangle should be drawn for the
		 * HudPage.
		 * @type boolean
		 * @default true
		 */
		this.drawBackground = true;
		
		/**
		 * The number of pixels to add as padding around the bounds of the
		 * HudPage's elements when drawing the background rectangle.
		 * @type number
		 * @default 5
		 */
		this.margin = 5;
		
		this.elements = [];
		this.auto = true;
	};
	
	hemi.hud.HudPage.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.HudPage',
		
		/**
		 * Send a cleanup Message and remove all references in the HudPage.
		 */
		cleanup: function() {
			hemi.hud.HudElement.prototype.cleanup.call(this);
			
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				this.elements[ndx].cleanup();
			}
			
			this.elements = [];
		},
		
		/**
		 * Get the Octane structure for the HudPage.
	     *
	     * @return {Object} the Octane structure representing the HudPage
		 */
		toOctane: function() {
			var octane = hemi.hud.HudElement.prototype.toOctane.call(this);
			
			octane.props.push({
				name: 'auto',
				val: this.auto
			});
			octane.props.push({
				name: 'drawBackground',
				val: this.drawBackground
			});
			octane.props.push({
				name: 'margin',
				val: this.margin
			});
			
			var elemsEntry = {
				name: 'elements',
				id: []
			};
			
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				elemsEntry.id.push(this.elements[ndx].getId());
			}
			
			octane.props.push(elemsEntry);
			
			return octane;
		},
		
		/**
		 * Automatically set the size of the HudPage to contain all of its
		 * HudElements.
		 */
		autosize: function() {
			this.auto = true;
		},
		
		/**
		 * Calculate the bounds of the HudElements of the HudPage.
		 * @see hemi.hud.HudElement#calculateBounds
		 */
		calculateBounds: function() {
			var ndx, len = this.elements.length;
			
			if (len <= 0) {
				this.top = 0;
				this.bottom = 0;
				this.left = 0;
				this.right = 0;
				return;
			}
			
			for (ndx = 0; ndx < len; ndx++) {
				this.elements[ndx].calculateBounds();
			}
			
			if (this.auto) {
				var element = this.elements[0];
				this.top = element.top;
				this.bottom = element.bottom;
				this.left = element.left;
				this.right = element.right;
				
				for (ndx = 1; ndx < len; ndx++) {
					element = this.elements[ndx];
					
					if (element.top < this.top) {
						this.top = element.top;
					}
					if (element.bottom > this.bottom) {
						this.bottom = element.bottom;
					}
					if (element.left < this.left) {
						this.left = element.left;
					}
					if (element.right > this.right) {
						this.right = element.right;
					}
				}
				
				this.top -= this.margin;
				this.bottom += this.margin;
				this.left -= this.margin;
				this.right += this.margin;
			}
		},
		
		/**
		 * Draw the background (if any) and HudElements of the HudPage.
		 * @see hemi.hud.HudElement#draw
		 */
		draw: function() {
			this.calculateBounds();
			
			if (this.drawBackground) {				
				hemi.hud.hudMgr.createRectangleOverlay(this, this.config);
			}
			
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				this.elements[ndx].draw();
			}
		},
		
		/**
		 * Add the given HudElement to the HudPage for displaying.
		 * 
		 * @param {hemi.hud.HudElement} element element to add
		 */
		addElement: function(element) {
			var ndx = this.elements.indexOf(element);
			
			if (ndx == -1) {
				this.elements.push(element);
			}
		},
		
		/**
		 * Remove all HudElements from the HudPage.
		 */
		clearElements: function() {
			this.elements = [];
		},
		
		/**
		 * Remove the specified HudElement from the HudPage.
		 * 
		 * @param {hemi.hud.HudElement} element element to remove
		 * @return {hemi.hud.HudElement} the removed element or null
		 */
		removeElement: function(element) {
        	var found = null;
			var ndx = this.elements.indexOf(element);
			
			if (ndx != -1) {
				var spliced = this.elements.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},
		
		/**
		 * Check if the given Event occurred within the bounds of any of the
		 * HudElements of the HudPage. If it did, pass the Event to that
		 * HudElement. If not, call the HudPage's mouse down handler function
		 * (if one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     the HudPage, otherwise false
		 */
		onMouseDown: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected || !this.auto) {
				var caught = false;
				var len = this.elements.length;
				
				for (var ndx = 0; ndx < len && !caught; ndx++) {
					caught = this.elements[ndx].onMouseDown(event);
				}
				
				if (intersected && !caught && this.mouseDown) {
					this.mouseDown(event);
				}
			}
			
			return intersected;
		},
		
		/**
		 * Pass the given Event to all of the HudPage's HudElements. If the
		 * HudPage's mouse move handler function is set, pass it the Event and
		 * if it occurred within the bounds of the HudPage.
		 * 
		 * @param {o3d.Event} event the event that occurred
		 */
		onMouseMove: function(event) {
			for (var ndx = 0, len = this.elements.length; ndx < len; ndx++) {
				this.elements[ndx].onMouseMove(event);
			}
			
			if (this.mouseMove) {
				var intersected = this.checkEvent(event);
				this.mouseMove(event, intersected);
			}
		},
		
		/**
		 * Check if the given Event occurred within the bounds of any of the
		 * HudElements of the HudPage. If it did, pass the Event to that
		 * HudElement. If not, call the HudPage's mouse up handler function (if
		 * one was set).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     this HudPage, otherwise false
		 */
		onMouseUp: function(event) {
			var intersected = this.checkEvent(event);
			
			if (intersected || !this.auto) {
				var caught = false;
				var len = this.elements.length;
				
				for (var ndx = 0; ndx < len && !caught; ndx++) {
					caught = this.elements[ndx].onMouseUp(event);
				}
				
				if (intersected && !caught && this.mouseUp) {
					this.mouseUp(event);
				}
			}
			
			return intersected;
		},
		
		/**
		 * Manually set the size of the HudPage. This will prevent it from
		 * autosizing itself to fit all of the HudElements added to it.
		 * 
		 * @param {number} top the y coordinate of the top
		 * @param {number} bottom the y coordinate of the bottom
		 * @param {number} left the x coordinate of the left
		 * @param {number} right the x coordinate of the right
		 */
		setSize: function(top, bottom, left, right) {
			this.top = top;
			this.bottom = bottom;
			this.left = left;
			this.right = right;
			this.auto = false;
		}
	};
	
	hemi.hud.HudPage.inheritsFrom(hemi.hud.HudElement);
	
	/**
	 * @class A HudDisplay contains one or more HudPages to display
	 * sequentially.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.HudDisplay = function() {
		hemi.world.Citizen.call(this);
		
		this.visible = false;
		this.pages = [];
		this.currentPage = 0;
	};
	
	hemi.hud.HudDisplay.prototype = {
		/**
		 * Overwrites hemi.world.Citizen.citizenType
		 */
        citizenType: 'hemi.hud.HudDisplay',
		
		/**
		 * Send a cleanup Message and remove all references in the HudDisplay.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			
			for (var ndx = 0, len = this.pages.length; ndx < len; ndx++) {
				this.pages[ndx].cleanup();
			}
			
			this.pages = [];
		},
		
		/**
		 * Get the Octane structure for the HudDisplay.
	     *
	     * @return {Object} the Octane structure representing the HudDisplay
		 */
		toOctane: function() {
			var octane = hemi.world.Citizen.prototype.toOctane.call(this);
			
			var pagesEntry = {
				name: 'pages',
				id: []
			};
			
			for (var ndx = 0, len = this.pages.length; ndx < len; ndx++) {
				pagesEntry.id.push(this.pages[ndx].getId());
			}
			
			octane.props.push(pagesEntry);
			
			return octane;
		},
		
		/**
		 * Check to see if the HudDisplay is currently visible.
		 * 
		 * @return {boolean} true if the HudDisplay is currently being displayed
		 */
		isVisible: function() {
			return this.visible;
		},
		
		/**
		 * Add the given HudPage to the HudDisplay.
		 * 
		 * @param {hemi.hud.HudPage} page page to add
		 */
		addPage: function(page) {
			var ndx = this.pages.indexOf(page);
			
			if (ndx == -1) {
				this.pages.push(page);
			}
		},
		
		/**
		 * Remove the specified HudPage from the HudDisplay.
		 * 
		 * @param {hemi.hud.HudPage} page page to remove
		 * @return {hemi.hud.HudPage} the removed page or null
		 */
		removePage: function(page) {
        	var found = null;
			var ndx = this.pages.indexOf(page);
			
			if (ndx != -1) {
				if (this.visible && ndx === this.currentPage) {
					if (ndx !== 0) {
						this.previousPage();
					} else if (this.pages.length > 1) {
						this.nextPage();
					} else  {
						this.hide();
					}
				}
				
				var spliced = this.pages.splice(ndx, 1);
				
				if (spliced.length == 1) {
					found = spliced[0];
				}
			}
			
			return found;
		},
		
		/**
		 * Remove all HudPages from the HudDisplay.
		 */
		clearPages: function() {
			if (this.visible) {
				this.hide();
			}
			
			this.pages = [];
		},
		
		/**
		 * Get the currently displayed HudPage.
		 * 
		 * @return {hemi.hud.HudPage} currently displayed page
		 */
		getCurrentPage: function() {
			var page = null;
			
			if (this.currentPage < this.pages.length) {
				page = this.pages[this.currentPage];
			}
			
			return page;
		},
		
		/**
		 * Get the number of HudPages in the HudDisplay.
		 * 
		 * @return {number} the number of HudPages
		 */
		getNumberOfPages: function() {
			return this.pages.length;
		},
		
		/**
		 * Display the next HudPage in the HudDisplay.
		 */
		nextPage: function() {
			var numPages = this.pages.length;
			this.currentPage++;
			
			if (this.currentPage >= numPages) {
				this.currentPage = numPages - 1;
			} else {
				this.showPage();
			}
		},
		
		/**
		 * Display the previous HudPage in the HudDisplay.
		 */
		previousPage: function() {
			this.currentPage--;
			
			if (this.currentPage < 0) {
				this.currentPage = 0;
			} else {
				this.showPage();
			}
		},
		
		/**
		 * Show the first HudPage of the HudDisplay and bind the mouse handlers
		 * for interaction.
		 */
		show: function() {
			if (!this.visible) {
				this.visible = true;
				this.showPage();
				hemi.input.addMouseDownListener(this);
				hemi.input.addMouseUpListener(this);
				hemi.input.addMouseMoveListener(this);
			}
		},

		/**
		 * Show the current page of the HudDisplay and add paging info if
		 * specified.
		 */
		showPage: function() {
			hemi.hud.hudMgr.clearDisplay();
			var page = this.getCurrentPage();
			page.draw();

			this.send(hemi.msg.visible,
				{
					page: this.currentPage + 1
				});
		},

		/**
		 * Hide the HudDisplay and unregister its key and mouse handlers.
		 */
		hide: function() {
			if (this.visible) {
				hemi.input.removeMouseMoveListener(this);
				hemi.input.removeMouseUpListener(this);
				hemi.input.removeMouseDownListener(this);
				hemi.hud.hudMgr.clearDisplay();
				this.visible = false;
				this.currentPage = 0;
				
				this.send(hemi.msg.visible,
					{
						page: 0
					});
			}
		},

		/**
		 * Pass the given mouse down Event to the currently displayed HudPage
		 * (if there is one). If the Event does not intersect it, pass it to
		 * the HudPagingDisplay (if there is one).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     a HudPage or HudPagingDisplay, otherwise false
		 */
		onMouseDown: function(event) {
			var page = this.getCurrentPage();
			var intersected = false;
			
			if (page) {
				intersected = page.onMouseDown(event);
			}
			
			return intersected;
		},
		
		/**
		 * Pass the given mouse move Event to the currently displayed HudPage
		 * (if there is one) and the HudPagingDisplay (if there is one).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 */
		onMouseMove: function(event) {
			var page = this.getCurrentPage();
			
			if (page) {
				page.onMouseMove(event);
			}
		},
		
		/**
		 * Pass the given mouse up Event to the currently displayed HudPage
		 * (if there is one). If the Event does not intersect it, pass it to
		 * the HudPagingDisplay (if there is one).
		 * 
		 * @param {o3d.Event} event the event that occurred
		 * @return {boolean} true if the event occurred within the bounds of
		 *     a HudPage or HudPagingDisplay, otherwise false
		 */
		onMouseUp: function(event) {
			var page = this.getCurrentPage();
			var intersected = false;
			
			if (page) {
				intersected = page.onMouseUp(event);
			}
			
			return intersected;
		}
	};
	
	hemi.hud.HudDisplay.inheritsFrom(hemi.world.Citizen);
	hemi.hud.HudDisplay.prototype.msgSent =
		hemi.hud.HudDisplay.prototype.msgSent.concat([hemi.msg.visible]);
	
	/**
	 * @class A HudManager creates the appropriate view components for
	 * rendering a HUD.
	 * @extends hemi.world.Citizen
	 */
	hemi.hud.HudManager = function() {
		var o3El = document.getElementById('o3d'),
			o3Can = o3El.firstElementChild,
			hudCan = document.createElement('canvas'),
			style = hudCan.style;
		
		this.videos = [];
		
		style.left = o3Can.offsetLeft + 'px';
		style.position = 'absolute';
		style.top = o3Can.offsetTop + 'px';
		style.zIndex = '10';
		
		hudCan.height = o3Can.height;
		hudCan.width = o3Can.width;
		
		o3El.appendChild(hudCan);
		this.canvas = hudCan.getContext('2d');
		// In our coordinate system, y indicates the top of the first line
		// of text, so set the canvas baseline to match.
		this.canvas.textBaseline = 'top';
		// Since the HUD canvas obscures the GL canvas, pass mouse events
		// through to Hemi.
		this.wheelHandler = o3d.Client.wrapEventCallback_(hemi.input.scroll, true),
		this.downHandler = o3d.Client.wrapEventCallback_(hemi.input.mouseDown, false),
		this.moveHandler = o3d.Client.wrapEventCallback_(hemi.input.mouseMove, false),
		this.upHandler = o3d.Client.wrapEventCallback_(hemi.input.mouseUp, false);
		
		hudCan.addEventListener('DOMMouseScroll', this.wheelHandler, true);
		hudCan.addEventListener('mousewheel', this.wheelHandler, true);
		hudCan.addEventListener('mousedown', this.downHandler, true);
		hudCan.addEventListener('mousemove', this.moveHandler, true);
		hudCan.addEventListener('mouseup', this.upHandler, true);
		
		this.canvasElem = hudCan;
		hemi.view.addRenderListener(this);
	};
	
	hemi.hud.HudManager.prototype = {
		/**
		 * Set the painting properties for the HUD canvas.
		 *
		 * @param {Object} options the options for painting.  Valid options are
		 * <ul>
		 * <li>color - the color to paint with. This is an array in RGBA
		 * format</li>
		 * <li>shader - the shader to apply.</li>
		 * <li>textAlign - the alignment of the text. Can be 'center', 'left',
		 * 'right'</li>
		 * <li>textSize - the size of the text to draw.</li>
		 * <li>textStyle - the style of the text. Can be 'normal', 'bold',
		 * 'italic', 'bold italic'</li>
		 * <li>textTypeface - the type face of the text.  e.g.: 'arial'</li>
		 * </ul>
		 */
		setPaintProperties: function(options) {
			var font;
			
			if (options.color != null) {
				this.canvas.fillStyle = getRgba(options.color);
			}
			if (options.outline != null) {
				this.canvas.strokeStyle = getRgba(options.outline);
				// If there is an outline, cancel the shadow.
				this.canvas.shadowColor = 'rgba(0,0,0,0)';
			} else if (options.shadow != null) {
				var shad = options.shadow;
				this.canvas.shadowBlur = shad.radius;
				this.canvas.shadowColor = getRgba(shad.color);
				this.canvas.shadowOffsetX = shad.offsetX;
				this.canvas.shadowOffsetY = shad.offsetY;
			} else {
				this.canvas.shadowColor = 'rgba(0,0,0,0)';
			}
			if (options.textAlign != null) {
				this.canvas.textAlign = options.textAlign;
			}
			if (options.textStyle != null) {
				font = options.textStyle + ' ';
			} else {
				font = 'bold ';
			}
			if (options.textSize != null) {
				font += options.textSize + 'px ';
			} else {
				font += '12px ';
			}
			if (options.textTypeface != null) {
				font += '"' + options.textTypeface + '"';
			} else {
				font += 'helvetica';
			}
			if (font != null) {
				this.canvas.font = font;
			}
		},
		
		/**
		 * Create a rectangular overlay from the given HudElement.
		 *
		 * @param {hemi.hud.HudElement} element element with a bounding box to
		 *     display
		 * @param {Object} boxConfig unique configuration options for the
		 *     rectangular overlay
		 */
		createRectangleOverlay: function(element, boxConfig) {
			var config = hemi.utils.join({}, hemi.hud.theme.page, boxConfig);
			this.canvas.save();
			this.setPaintProperties(config);
			
			if (config.curve > 0) {
				var curve = config.curve <= 1 ? config.curve / 2.0 : 0.5;
				this.drawRoundRect(element, curve, true);
				
				if (config.outline != null) {
					this.drawRoundRect(element, curve, false);
				}
			} else {
				var x = element.left,
					y = element.top,
					width = element.right - x,
					height = element.bottom - y;
				
				this.canvas.fillRect(x, y, width, height);
				
				if (config.outline != null) {
					this.canvas.strokeRect(x, y, width, height);
				}
			}
			
			this.canvas.restore();
		},
		
		/**
		 * Create a text overlay.
		 *
		 * @param {string} text the text display
		 * @param {Object} textConfig unique configuration options for the text
		 *    overlay
		 * @param {number} x x coordinate to draw the text at
		 * @param {number} y y coordinate to draw the text at
		 */
		createTextOverlay: function(text, textConfig, x, y) {
			var config = hemi.utils.join({}, hemi.hud.theme.text, textConfig),
				height = config.textSize,
				outline = config.outline != null;
			
			this.canvas.save();
			this.setPaintProperties(config);
			
			for (var ndx = 0, len = text.length; ndx < len; ndx++) {
				var line = text[ndx];
				this.canvas.fillText(line, x, y);
				
				if (outline) {
					this.canvas.strokeText(line, x, y);
				}
				
				y += height + config.lineMargin;
			}
			
			this.canvas.restore();
		},
		
		/**
		 * Create an image overlay.
		 *
		 * @param {Image} image the image to display
		 * @param {Object} imgConfig unique configuration options for the image
		 *    overlay
		 * @param {number} x x coordinate to draw the image at
		 * @param {number} y y coordinate to draw the image at
		 * @param {number} srcX optional x coordinate to pull from source image
		 * @param {number} srcY optional y coordinate to pull from source image
		 * @param {number} width optional width of destination image
		 * @param {number} height optional height of destination image
		 */
		createImageOverlay: function(image, imgConfig, x, y, srcX, srcY, width, height) {
			var config = hemi.utils.join({}, hemi.hud.theme.image, imgConfig);
			this.canvas.save();
			this.setPaintProperties(config);
			
			if (srcX != null && srcY != null && width != null && height != null) {
				this.canvas.drawImage(image, srcX, srcY, width, height, x, y,
					width, height);
			} else {
				this.canvas.drawImage(image, x, y);
			}
			
			this.canvas.restore();
		},
		
		/**
		 * Create a video overlay.
		 *
		 * @param {Video} video the video to display
		 * @param {Object} vidConfig unique configuration options for the video
		 *    overlay
		 * @param {number} x x coordinate to draw the video at
		 * @param {number} y y coordinate to draw the video at
		 * @param {number} width optional width of video
		 * @param {number} height optional height of video
		 */
		createVideoOverlay: function(video, vidConfig, x, y, width, height) {
			var config = hemi.utils.join({}, hemi.hud.theme.video, vidConfig);
			
			this.videos.push({
				video: video,
				config: config,
				x: x,
				y: y,
				width: width || video.videoWidth,
				height: height || video.videoHeight
			});
			video.play();
		},
		
		/**
		 * Clear the current overlays from the HUD.
		 */
		clearDisplay: function() {
			var can = this.canvas.canvas,
				vids = this.videos;
			
			this.videos = [];
			
			for (var i = 0, il = vids.length; i < il; i++) {
				vids[i].video.pause();
			}
			
			this.canvas.clearRect(0, 0, can.width, can.height);
			this.canvas.beginPath();
		},
		
		/**
		 * Calculate text wrapping and format the given string.
		 * 
		 * @param {string} text the text to display
		 * @param {number} width the maximum line width before wrapping
		 * @param {Object} textOptions unique configuration options for the text
		 *    overlay
		 * @return {Object} wrapped text object
		 */
		doTextWrapping: function(text, width, textOptions) {
			var config = hemi.utils.join({}, hemi.hud.theme.text, textOptions),
				wrappedText;
			
			this.canvas.save();
			this.setPaintProperties(config);
			
			if (config.strictWrapping) {
				wrappedText = hemi.utils.wrapTextStrict(text, width, this.canvas);
			} else {
				var metric = this.canvas.measureText(text),
					charWidth = metric.width / text.length;
				wrappedText = hemi.utils.wrapText(text, width, charWidth);
			}
			
			var height = wrappedText.length * (config.textSize + config.lineMargin),
				longestWidth = 0;
			
			for (var ndx = 0, len = wrappedText.length; ndx < len; ndx++) {
				var metric = this.canvas.measureText(wrappedText[ndx]);
				
				if (longestWidth < metric.width) {
					longestWidth = metric.width;
				}
			}
			
			this.canvas.restore();
			
			return {
				text: wrappedText,
				height: height,
				width: longestWidth
			};
		},
		
		/**
		 * Draw a rectangular overlay that has rounded corners from the given
		 * HudElement.
		 *
		 * @param {hemi.hud.HudElement} element element with a bounding box to
		 *     create the rectangle from
		 * @param {number} curveFactor amount of curving on the corners (between
		 *     0 and 0.5)
		 * @param {boolean} fill flag indicating whether to fill or stroke
		 */
		drawRoundRect: function(element, curveFactor, fill) {
			var hMath = hemi.core.math,
				lt = element.left,
				rt = element.right,
				tp = element.top,
				bm = element.bottom,
				wide = rt - lt,
				high = bm - tp,
				inc = high > wide ? wide * curveFactor : high * curveFactor,
				// Positions on a clock in radians :)
				hour12 = hMath.degToRad(270),
				hour3 = 0,
				hour6 = hMath.degToRad(90),
				hour9 = hMath.degToRad(180);
			
			this.canvas.beginPath();
			this.canvas.moveTo(lt, tp + inc);
			this.canvas.lineTo(lt, bm - inc);
			this.canvas.arc(lt + inc, bm - inc, inc, hour9, hour6, true);
			this.canvas.lineTo(rt - inc, bm);
			this.canvas.arc(rt - inc, bm - inc, inc, hour6, hour3, true);
			this.canvas.lineTo(rt, tp + inc);
			this.canvas.arc(rt - inc, tp + inc, inc, hour3, hour12, true);
			this.canvas.lineTo(lt + inc, tp);
			this.canvas.arc(lt + inc, tp + inc, inc, hour12, hour9, true);
			this.canvas.closePath();
			
			if (fill) {
				this.canvas.fill();
			} else {
				this.canvas.stroke();
			}
		},
		
		/**
		 * Copy the current image from any video elements onto the canvas on
		 * each render.
		 * 
		 * @param {o3d.RenderEvent} renderEvent event containing render info
		 */
		onRender: function(renderEvent) {
			var vids = this.videos,
				can = this.canvas,
				vid;
			
			for (var i = 0, il = vids.length; i < il; i++) {
				vid = vids[i];
				this.canvas.save();
				this.setPaintProperties(vid.config);
				can.drawImage(vid.video, vid.x, vid.y, vid.width, vid.height);
				this.canvas.restore();
			}
		}
	};
	
	/*
	 * Get the CSS RGBA string for the given color array in 0-1 format.
	 * @param {number[4]} col color array
	 * @return {string} the equivalent RGBA string
	 */
	var getRgba = function(col) {
		return 'rgba(' + Math.round(col[0]*255) + ',' + Math.round(col[1]*255) +
			',' + Math.round(col[2]*255) + ',' + col[3] + ')';
	};

	return hemi;
})(hemi || {});
