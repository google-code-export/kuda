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
			 * Flag to indicate if the canvas should update after drawing the
			 * overlay.
			 * @type boolean
			 * @default false
			 */
			update: false
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
			},
			
			/**
			 * Flag to indicate if the canvas should update after drawing the
			 * overlay.
			 * @type boolean
			 * @default false
			 */
			update: false
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
			textTypeface: 'Helvetica',
			
			/**
			 * The horizontal alignment of the text.
			 * @type o3d.CanvasPaint.TextAlign
			 * @default hemi.core.o3d.CanvasPaint.CENTER
			 */
			textAlign: hemi.core.o3d.CanvasPaint.CENTER,
			
			/**
			 * Additional styling for the text (normal, bold, italics)
			 * @type o3d.CanvasPaint.Style
			 * @default hemi.core.o3d.CanvasPaint.BOLD
			 */
			textStyle: hemi.core.o3d.CanvasPaint.BOLD,
			
			/**
			 * The 2D shader to use to paint. Set to null to stop using a shader.
			 * @type o3d.CanvasShader
			 * @default undefined
			 */
			shader: undefined,
			
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
			 * Options for an outline around text. This is mutually exclusive to
			 * shadow. Set radius to 0 to cancel.
			 * @type Object
			 */
			outline: {
				radius: 0,
				color: [0, 0, 0, 1]
			},
			
			/**
			 * Flag to indicate if the canvas should update after drawing the
			 * text.
			 * @type boolean
			 * @default false
			 */
			update: false
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
				align = this.config.textAlign;
			} else {
				align = hemi.hud.theme.text.textAlign;
			}
			
			this.top = this.y;
			this.bottom = this.top + this.wrappedHeight;

			switch (align) {
				case hemi.core.o3d.CanvasPaint.LEFT:
					this.left = this.x;
					this.right = this.left + this.wrappedWidth;
					break;
				case hemi.core.o3d.CanvasPaint.RIGHT:
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
		 * The actual image texture to draw on screen. This property is created
		 * when the image URL is loaded. It should typically not be set
		 * directly.
		 * @type o3d.Texture2D
		 */
		this.texture = null;
		
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
		
		this.imageUrl = null;
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
			
			if (this.texture) {
				hemi.hud.pack.removeObject(this.texture);
				this.texture = null;
			}
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
				name: 'setImageUrl',
				arg: [this.imageUrl]
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
			hemi.hud.hudMgr.createImageOverlay(this.texture, this.config, this.x, this.y);
		},
		
		/**
		 * Get the URL of the image file to load.
		 * 
		 * @return {string} the URL of the image file
		 */
		getImageUrl: function() {
			return this.imageUrl;
		},
		
		/**
		 * Set the URL of the image file to load and begin loading it.
		 * 
		 * @param {string} imageUrl the URL of the image file
		 */
		setImageUrl: function(imageUrl) {
			this.imageUrl = imageUrl;
			
			if (this.texture) {
				hemi.hud.pack.removeObject(this.texture);
				this.texture = null;
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
				this.imageUrl,
				hemi.hud.pack,
				function(bitmaps) {
					var bitmap = bitmaps[0];
					that.texture = hemi.hud.pack.createTexture2D(
						bitmap.width,
						bitmap.height,
						bitmap.format,
						bitmap.numMipmaps,
						false);
					that.texture.setFromBitmap(bitmap);
					that.height = that.texture.height;
					that.width = that.texture.width;
					// Now that we have our texture, remove the bitmap
					hemi.hud.pack.removeObject(bitmap);
					that.send(hemi.msg.load, {});
				});
		}
	};

	hemi.hud.HudImage.inheritsFrom(hemi.hud.HudElement);
	hemi.hud.HudImage.prototype.msgSent =
		hemi.hud.HudImage.prototype.msgSent.concat([hemi.msg.load]);

	/**
	 * @class A HudButton contains textures for different images based on if
	 * the button is enabled or if a mouse is hovering over it.
	 * @extends hemi.hud.HudImage
	 */
	hemi.hud.HudButton = function() {
		hemi.hud.HudImage.call(this);
		
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
		 * The texture to use for the HudButton when it is enabled.
		 * @type o3d.Texture2D
		 */
		this.enabledTexture = null;
		
		/**
		 * The texture to use for the HudButton when it is disabled.
		 * @type o3d.Texture2D
		 */
		this.disabledTexture = null;
		
		/**
		 * The texture to use for the HudButton when it is enabled and the
		 * mouse cursor is hovering.
		 * @type o3d.Texture2D
		 */
		this.hoverTexture = null;
		
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
		
		// Since we need to update the button's texture based upon mouse
		// interaction, the HUD needs to update its texture any time the button
		// is drawn.
		this.config.update = true;
	};
	
	hemi.hud.HudButton.prototype = {
		/**
		 * Send a cleanup Message and remove all references in the HudButton.
		 */
		cleanup: function() {
			hemi.hud.HudElement.prototype.cleanup.call(this);
			
			if (this.enabledTexture) {
				hemi.hud.pack.removeObject(this.enabledTexture);
				this.enabledTexture = null;
			}
			if (this.disabledTexture) {
				hemi.hud.pack.removeObject(this.disabledTexture);
				this.disabledTexture = null;
			}
			if (this.hoverTexture) {
				hemi.hud.pack.removeObject(this.hoverTexture);
				this.hoverTexture = null;
			}
		},
		
		/**
		 * Set the HudButton's texture based on the enabled and hovering flags
		 * and then draw it.
		 * @see hemi.hud.HudImage#draw
		 */
		draw: function() {
			if (this.enabled) {
				if (this.hovering) {
					this.texture = this.hoverTexture;
				} else {
					this.texture = this.enabledTexture;
				}
			} else {
				this.texture = this.disabledTexture;
			}
			
			hemi.hud.HudImage.prototype.draw.call(this);
		}
	};
	
	hemi.hud.HudButton.inheritsFrom(hemi.hud.HudImage);
	
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
			
			hemi.hud.hudMgr.canvas.updateTexture();
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
		 * Show the first HudPage of the HudDisplay and bind the key and mouse
		 * handlers for interaction.
		 * 
		 * @param {boolean} opt_keyNav optional flag indicating if keyboard
		 *     navigation should be enabled (defaults to true)
		 */
		show: function(opt_keyNav) {
			var that = this;
			
			if (opt_keyNav !== false) {
				// register as keydown handler
				jQuery(document).unbind('keydown.hud');
				jQuery(document).bind('keydown.hud', function(evt) {
					var key = hemi.core.event.getEventKeyChar(evt);
					
					if (key == 37) {
						that.previousPage();
					}
					else if (key == 39) {
						that.nextPage();
					}
				});
			}

			this.visible = true;
			this.showPage();
			hemi.input.addMouseDownListener(this);
			hemi.input.addMouseUpListener(this);
			hemi.input.addMouseMoveListener(this);
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
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			hemi.input.removeMouseDownListener(this);
			jQuery(document).unbind('keydown.hud');
			hemi.hud.hudMgr.clearDisplay();
			this.visible = false;
			this.currentPage = 0;
			
			this.send(hemi.msg.visible,
				{
					page: 0
				});
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
		this.orthoRoot = hemi.hud.pack.createObject('Transform');
		
		// Create a view for the orthographic display of the fullscreen banner.
		this.orthoViewInfo = hemi.core.renderGraph.createBasicView(hemi.hud.pack, this.orthoRoot, hemi.core.client.renderGraphRoot);
		
		// Make sure the orthographic view gets drawn after the 3d stuff          
		this.orthoViewInfo.root.priority = hemi.view.viewInfo.root.priority + 1000;
		
		// Turn off clearing the color for the orthographic view, since that would
		// erase the 3d parts.  Leave clearing the depth and stencil, so it's
		// unaffected by anything done by the 3d parts.
		this.orthoViewInfo.clearBuffer.clearColorFlag = false;
		
		// Set culling to none so we can flip images using rotation or negative scale.
		this.orthoViewInfo.zOrderedState.getStateParam('CullMode').value = hemi.core.o3d.State.CULL_NONE;
		this.orthoViewInfo.zOrderedState.getStateParam('ZWriteEnable').value = false;
		
		// Create an orthographic matrix for the banner.
		// The area we're using for display is width by height pixels.
		// If we change the size of the client area after setup, everything will get
		// scaled to match, but we don't have to change any of our code.
		this.orthoViewInfo.drawContext.projection = hemi.core.math.matrix4.orthographic(0 + 0.5, hemi.core.client.width + 0.5, hemi.core.client.height + 0.5, 0 + 0.5, 0.001, 1000);
		
		this.orthoViewInfo.drawContext.view = hemi.core.math.matrix4.lookAt(
			[0, 0, 1], // eye
 			[0, 0, 0], // target
 			[0, 1, 0]); // up
		this.canvasLib = hemi.core.canvas.create(hemi.hud.pack, this.orthoRoot, this.orthoViewInfo);
		this.paint = hemi.hud.pack.createObject('CanvasPaint');
		
		this.canvas = hemi.hud.createCanvas(this.canvasLib,
			{
				topX: 0,
				topY: 0,
				width: hemi.core.client.width,
				height: hemi.core.client.height,
				clear: [0, 0, 0, 0],
				transform: this.orthoRoot
			});
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
		 * <li>textAlign - the alignment of the text.  Can be
		 * o3d.CanvasPaint.CENTER, o3d.CanvasPaint.LEFT, o3d.CanvasPaint.RIGHT</li>
		 * <li>textSize - the size of the text to draw.</li>
		 * <li>textStyle - the style of the text.  Can be o3d.CanvasPaint.NORMAL,
		 * o3d.CanvasPaint.BOLD, o3d.CanvasPaint.ITALIC, o3d.CanvasPaint.BOLD_ITALIC
		 * </li>
		 * <li>textTypeface - the type face of the text.  e.g.: 'arial'</li>
		 * </ul>
		 * All options default to undefined.
		 */
		setPaintProperties: function(options) {
			options = jQuery.extend({
				color: undefined,
				shader: undefined,
				textAlign: undefined,
				textSize: undefined,
				textStyle: undefined,
				textTypeface: undefined,
				shadow: undefined,
				outline: undefined
			}, options);
			
			if (options.color != undefined) 
				this.paint.color = options.color;
			if (options.shader != undefined) 
				this.paint.shader = options.shader;
			if (options.textAlign != undefined) 
				this.paint.textAlign = options.textAlign;
			if (options.textSize != undefined) 
				this.paint.textSize = options.textSize;
			if (options.textStyle != undefined) 
				this.paint.textStyle = options.textStyle;
			if (options.textTypeface != undefined) 
				this.paint.textTypeface = options.textTypeface;
			if (options.shadow != undefined) {
				var shadow = options.shadow;
				this.paint.setShadow(shadow.radius, shadow.offsetY, shadow.offsetX, shadow.color);
			}
			else {
				this.paint.setShadow(0, 0, 0, [0, 0, 0, 0]);
			}
			if (options.outline != undefined) {
				var outline = options.outline;
				this.paint.setOutline(outline.radius, outline.color);
			}
			else {
				this.paint.setOutline(0, [0, 0, 0, 0]);
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
			var config = jQuery.extend({}, hemi.hud.theme.page, boxConfig);
			this.setPaintProperties(config);
			
			this.canvas.canvas.drawRect(
				element.left,
				element.top,
				element.right,
				element.bottom,
				this.paint);
			
			if (config.update) {
				this.canvas.updateTexture();
			}
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
			var config = jQuery.extend({}, hemi.hud.theme.text, textConfig);
			this.setPaintProperties(config);
			
			if (config.clear !== undefined) {
				this.canvas.canvas.clear(config.clear);
			}
			
			// In our coordinate system, y indicates the top of the first line
			// of text. Since O3D interprets y as the bottom of the first line,
			// we need to increment our y before making the drawText() call.
			var metrics = this.paint.getFontMetrics();
			var charHeight = Math.abs(metrics.ascent - metrics.descent);
			y += charHeight;
			
			for (var ndx = 0, len = text.length; ndx < len; ndx++) {
				var line = text[ndx];
				this.canvas.canvas.drawText(line, x, y, this.paint);
				y += charHeight + config.lineMargin;
			}
			
			if (config.update) {
				this.canvas.updateTexture();
			}
		},
		
		/**
		 * Create an image overlay.
		 *
		 * @param {o3d.Texture2D} texture the image texture display
		 * @param {Object} imgConfig unique configuration options for the image
		 *    overlay
		 * @param {number} x x coordinate to draw the image at
		 * @param {number} y y coordinate to draw the image at
		 */
		createImageOverlay: function(texture, imgConfig, x, y) {
			var config = jQuery.extend({}, hemi.hud.theme.image, imgConfig);
			this.canvas.canvas.drawBitmap(texture, x, y);
			
			if (config.update) {
				this.canvas.updateTexture();
			}
		},
		
		/**
		 * Clear the current overlays from the HUD.
		 */
		clearDisplay: function() {
			this.canvas.canvas.clear([0, 0, 0, 0]);
			this.canvas.updateTexture();
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
			var config = jQuery.extend({}, hemi.hud.theme.text, textOptions);
			this.setPaintProperties(config);
			var wrappedText;
			
			if (config.strictWrapping) {
				wrappedText = hemi.utils.wrapTextStrict(text, width, this.paint);
			} else {
				var textSize = this.paint.measureText(text);
				var charWidth = (textSize[2] - textSize[0]) / text.length;
				wrappedText = hemi.utils.wrapText(text, width, charWidth);
			}
			
			var metrics = this.paint.getFontMetrics();
			var height = wrappedText.length * (Math.abs(metrics.ascent) + Math.abs(metrics.descent) + config.lineMargin);
			var longestWidth = 0;
			
			for (var ndx = 0, len = wrappedText.length; ndx < len; ndx++) {
				var textSize = this.paint.measureText(wrappedText[ndx]);
				var tempWidth = textSize[2] - textSize[0];
				
				if (longestWidth < tempWidth) {
					longestWidth = tempWidth;
				}
			}
			
			return {
				text: wrappedText,
				height: height,
				width: longestWidth
			};
		}
	};

	/**
	 * Create a canvas to draw 2D elements on.
	 * 
	 * @param {hemi.core.canvas.CanvasInfo} canvasInfo the CanvasInfo to use to
	 *     actually create the canvas
	 * @param {Object} options options for configuring the canvas. Valid
	 * options are
	 * <ul>
	 * <li>topX - default 0</li>
	 * <li>topY - default 0</li>
	 * <li>z - default 0</li>
	 * <li>width - default 100</li>
	 * <li>height - default 100</li>
	 * <li>clear - default [0, 0, 0, 0].  Used to clear the canvas.</li>
	 * <li>transparent - default true</li>
	 * <li>transform - default a newly created transform</li>
	 * </ul>
	 * @return {hemi.core.canvas.CanvasQuad} the newly created canvas
	 */
	hemi.hud.createCanvas = function(canvasInfo, options) {
		options = jQuery.extend({
			topX: 0,
			topY: 0,
			z: 0,
			width: 100,
			height: 100,
			clear: [0, 0, 0, 0],
			transparent: true
		}, options);

		if (!options.transform) {
			options.transform = hemi.hud.pack.createObject('Transform');
		}

		options.transform.parent = hemi.core.client.root;

		var quad = canvasInfo.createXYQuad(options.topX, options.topY, options.z, options.width, options.height, options.transparent, options.transform);
		quad.canvas.clear(options.clear);
		return quad;
	};

	return hemi;
})(hemi || {});
