/*
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * The MIT License (MIT)
 * 
 * Copyright (c) 2011 SRI International
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated  documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the  Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
 * NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudTheme class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudTheme contains configuration options for displaying HUD elements like pages and
	 * text.
	 */
	var HudTheme = function() {
		/**
		 * Configuration options for an image foreground overlay.
		 * @type Object
		 */
		this.image = {
			/**
			 * Options for a blur shadow effect on the image. Set radius to 0 to cancel.
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
			 * The amount of curving to apply to the corners of the page. Range is from 0.0 to 1.0
			 * where 0 is a plain rectangle and 1 is an oval.
			 * @type number
			 * @default 0
			 */
			curve: 0,

			/**
			 * Options for a blur shadow effect on the page. This is mutually exclusive to outline.
			 * Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0,
				offsetY: 0,
				offsetX: 0,
				color: [0, 0, 0, 0]
			},

			/**
			 * Optional outline for the page in RGBA format. This is mutually exclusive to shadow.
			 * Set to null to cancel.
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
			 * Flag to indicate if the HudManager should perform strict text wrapping.
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
			 * Options for a blur shadow effect on the text. This is mutually exclusive to outline.
			 * Set radius to 0 to cancel.
			 * @type Object
			 */
			shadow: {
				radius: 0.5,
				offsetY: 1,
				offsetX: 1,
				color: [0, 0, 0, 1]
			},

			/**
			 * Optional outline for the text in RGBA format. This is mutually exclusive to shadow.
			 * Set to null to cancel.
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
			 * Options for a blur shadow effect on the video. Set radius to 0 to cancel.
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

	/*
	 * Octane properties for the HudTheme.
	 */
	HudTheme.prototype._octane = ['image', 'page', 'text', 'load'];

	/**
	 * Set the HudTheme as the current theme for HUD displays.
	 */
	HudTheme.prototype.load = function() {
		hemi.setHudTheme(this);
	};

	hemi.HudTheme = HudTheme;
	hemi.makeOctanable(hemi.HudTheme, 'hemi.HudTheme', hemi.HudTheme.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudElement class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * @class A HudElement contains the basics of any element to be drawn on the canvas.
	 */
	var HudElement = function() {
		/*
		 * The y-value of the lower boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._bottom = 0;

		/*
		 * The x-value of the left boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._left = 0;

		/*
		 * The x-value of the right boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._right = 0;

		/*
		 * The y-value of the upper boundary of the HudElement. This value should be calculated at
		 * draw time rather than set directly.
		 * @type number 
		 */
		this._top = 0;

		/**
		 * Unique display options for the HudElement. All other display options will be derived from
		 * the current theme.
		 * @type {Object}
		 */
		this.config = {};

		/**
		 * The handler function for mouse down events that occur within the bounds of the
		 * HudElement.
		 * @type function(Object): void
		 */
		this.mouseDown = null;

		/**
		 * The handler function for mouse up events that occur within the bounds of the HudElement.
		 * @type function(Object): void
		 */
		this.mouseUp = null;

		/**
		 * The handler function for mouse move events. It takes the Event and a boolean indicating
		 * if the Event occurred within the bounds of the HudElement.
		 * @type function(Object, boolean): void
		 */
		this.mouseMove = null;

		/**
		 * Allows the element to be drawn or not.
		 * @type boolean
		 */
		this.visible = true;
	};

	/*
	 * Check if the given Event occurred within the bounds of the HudElement.
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of the HudElement, otherwise
	 *     false
	 */
	HudElement.prototype._checkEvent = function(event) {
		return event.x <= this._right &&
			event.x >= this._left &&
			event.y <= this._bottom &&
			event.y >= this._top;
	};

	/*
	 * Octane properties for the HudElement.
	 */
	HudElement.prototype._octane = ['_bottom', '_left', '_right', '_top', 'config'];

	/**
	 * Remove all references in the HudElement.
	 */
	HudElement.prototype.cleanup = function() {
		this.mouseDown = null;
		this.mouseUp = null;
		this.mouseMove = null;
		this.config = {};
	};

	/**
	 * If the given Event occurred within the bounds of this HudElement, call the HudElement's mouse
	 * down handler function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of this HudElement, otherwise
	 *     false
	 */
	HudElement.prototype.onMouseDown = function(event) {
		var intersected = this._checkEvent(event);

		if (intersected && this.mouseDown) {
			this.mouseDown(event);
		}

		return intersected;
	};

	/**
	 * If the HudElement's mouse move handler function is set, pass it the given Event and if it
	 * occurred within the bounds of this HudElement.
	 * 
	 * @param {Object} event the event that occurred
	 */
	HudElement.prototype.onMouseMove = function(event) {
		if (this.mouseMove) {
			var intersected = this._checkEvent(event);
			this.mouseMove(event, intersected);
		}
	};

	/**
	 * If the given Event occurred within the bounds of this HudElement, call the HudElement's mouse
	 * up handler function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of this HudElement, otherwise
	 *     false
	 */
	HudElement.prototype.onMouseUp = function(event) {
		var intersected = this._checkEvent(event);

		if (intersected && this.mouseUp) {
			this.mouseUp(event);
		}

		return intersected;
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudText class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudText contains formated text and display options for a single area of text on the
	 * HUD.
	 * @extends HudElement
	 */
	var HudText = function() {
		HudElement.call(this);

		/*
		 * The original text before it is wrapped to fit into the given width. It should typically
		 * not be set directly.
		 * @type string[]
		 */
		this._text = [];

		/*
		 * The maximum width that the text should span before being wrapped. It should typically not
		 * be set directly.
		 * @type number
		 */
		this._width = 0;

		/*
		 * The height of the formatted text. This property is calculated whenever the text, config,
		 * or width are set. It should typically not be set directly.
		 * @type number
		 */
		this._wrappedHeight = 0;

		/*
		 * The formatted text that is actually drawn on screen. This property is created whenever
		 * the text, config, or width are set. It should typically not be set directly.
		 * @type string[]
		 */
		this._wrappedText = [];

		/*
		 * The width of the formatted text. This property is calculated whenever the text, config,
		 * or width are set. It should typically not be set directly.
		 * @type number
		 */
		this._wrappedWidth = 0;

		/**
		 * The x-coordinate of the HudText. The actual on screen location will depend on the
		 * horizontal alignment of the text.
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
	};

	HudText.prototype = new HudElement();
	HudText.constructor = HudText;

	/*
	 * Octane properties for the HudText.
	 */
	HudText.prototype._octane = HudElement.prototype._octane.concat([
		'_text', '_width', 'x', 'y', 'wrapText']);

	/**
	 * Calculate the bounds of the formatted text.
	 */
	HudText.prototype.calculateBounds = function() {
		var align;

		if (this.config.textAlign != null) {
			align = this.config.textAlign.toLowerCase();
		} else {
			align = currentTheme.text.textAlign.toLowerCase();
		}

		this._top = this.y;
		this._bottom = this._top + this._wrappedHeight;

		switch (align) {
			case 'left':
				this._left = this.x;
				this._right = this._left + this._wrappedWidth;
				break;
			case 'right':
				this._right = this.x;
				this._left = this._right - this._wrappedWidth;
				break;
			default: // center
				var offset = this._wrappedWidth / 2;
				this._left = this.x - offset;
				this._right = this.x + offset;
				break;
		}
	};

	/**
	 * Draw the formatted text.
	 */
	HudText.prototype.draw = function() {
		hemi.hudManager.createTextOverlay(this, this.config);
	};

	/**
	 * Set unique display options for the HudText and perform text wrapping for the new options.
	 * 
	 * @param {Object} config configuration options
	 */
	HudText.prototype.setConfig = function(config) {
		this.config = config;
		this.wrapText();
	};

	/**
	 * Set the text to display for this HudText. Perform text wrapping for the new text.
	 * 
	 * @param {string} text a string or array of strings to display
	 */
	HudText.prototype.setText = function(text) {
		this._text = hemi.utils.isArray(text) ? text : [text];
		this.wrapText();
	};

	/**
	 * Set the desired width for the HudText. Perform text wrapping for the new width.
	 * 
	 * @param {number} width desired width for the HudText
	 */
	HudText.prototype.setWidth = function(width) {
		this._width = width;
		this.wrapText();
	};

	/**
	 * Perform text wrapping on the HudText's text. This sets the wrapped text, width, and height
	 * properties.
	 */
	HudText.prototype.wrapText = function() {
		if (this._width <= 0 || this._text.length === 0) {
			return;
		}

		var width = 0,
			height = 0,
			wrappedText = [];

		for (var i = 0, il = this._text.length; i < il; ++i) {
			var textObj = hemi.hudManager.doTextWrapping(this._text[i], this._width, this.config);

			if (textObj.width > width) {
				width = textObj.width;
			}

			height += textObj.height;
			wrappedText = wrappedText.concat(textObj.text);
		}

		this._wrappedWidth = width;
		this._wrappedHeight = height;
		this._wrappedText = wrappedText;
	};

	hemi.HudText = HudText;
	hemi.makeOctanable(hemi.HudText, 'hemi.HudText', hemi.HudText.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudImage class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudImage contains a texture and display options for a single image on the HUD.
	 * @extends HudElement
	 */
	var HudImage = function() {
		HudElement.call(this);

		/*
		 * The height of the image. This property is calculated when the image URL is loaded. It
		 * should typically not be set directly.
		 * @type number
		 */
		this._height = 0;

		/*
		 * The loaded image data.
		 * @type Image
		 */
		this._image = null;

		/*
		 * The width of the image. This property is calculated when the image URL is loaded. It
		 * should typically not be set directly.
		 * @type number
		 */
		this._width = 0;

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
		 * The URL of the image file.
		 * @type string
		 */
		this.url = null;

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
	};

	HudImage.prototype = new HudElement();
	HudImage.constructor = HudImage;

	/*
	 * Octane properties for the HudImage.
	 */
	HudImage.prototype._octane = HudElement.prototype._octane.concat([
		'srcX', 'srcY', 'url', 'x', 'y', 'loadImage']);

	/**
	 * Calculate the bounds of the image.
	 */
	HudImage.prototype.calculateBounds = function() {
		this._top = this.y;
		this._bottom = this._top + this._height;
		this._left = this.x;
		this._right = this._left + this._width;
	};

	/**
	 * Remove all references in the HudImage.
	 */
	HudImage.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);
		this._image = null;
	};

	/**
	 * Draw the image texture.
	 */
	HudImage.prototype.draw = function() {
		hemi.hudManager.createImageOverlay(this, this.config);
	};

	/**
	 * Load the image from the image url into a texture for the HudManager to paint. This sets the
	 * texture, height, and width properties.
	 * 
	 * @param {function(hemi.HudImage):void} opt_callback optional callback function to pass the
	 *     HudImage when it is done loading
	 */
	HudImage.prototype.loadImage = function(opt_callback) {
		var that = this;

		hemi.loadImage(this.url, function(image) {
				that._image = image;
				that._height = image.height;
				that._width = image.width;

				if (opt_callback) opt_callback(that);
			});
	};

	/**
	 * Set the URL of the image file to load and begin loading it.
	 * 
	 * @param {string} url the URL of the image file
	 * @param {function(hemi.HudImage):void} opt_callback optional callback function to pass the
	 *     HudImage when it is done loading
	 */
	HudImage.prototype.setUrl = function(url, opt_callback) {
		this.url = url;
		this.loadImage(opt_callback);
	};

	hemi.HudImage = HudImage;
	hemi.makeOctanable(hemi.HudImage, 'hemi.HudImage', hemi.HudImage.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudButton class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudButton uses different images based on if the button is enabled or if a mouse is
	 * hovering over it, etc.
	 * @extends HudElement
	 */
	var HudButton = function() {
		HudElement.call(this);

		/**
		 * The HudImage to use for the HudButton when it is disabled.
		 * @type hemi.HudImage
		 */
		this.disabledImg = null;

		/**
		 * Flag indicating if the HudButton is enabled.
		 * @type boolean
		 * @default true
		 */
		this.enabled = true;

		/**
		 * The HudImage to use for the HudButton when it is enabled.
		 * @type hemi.HudImage
		 */
		this.enabledImg = null;

		/**
		 * Flag indicating if the mouse cursor is hovering over the HudButton.
		 * @type boolean
		 * @default false
		 */
		this.hovering = false;

		/**
		 * The HudImage to use for the HudButton when it is enabled and the mouse cursor is
		 * hovering.
		 * @type hemi.HudImage
		 */
		this.hoverImg = null;

		/**
		 * Flag indicating if the HudButton is selected.
		 * @type boolean
		 * @default false
		 */
		this.selected = false;

		/**
		 * The HudImage to use for the HudButton when it is selected.
		 * @type hemi.HudImage
		 */
		this.selectedImg = null;

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

		var that = this;

		/**
		 * The built-in mouse move handler for a HudButton. If the mouse move occurred within the
		 * button's bounds, set it's hovering flag and redraw the button.
		 * 
		 * @param {Object} event the mouse move event
		 * @param {boolean} intersected true if the event occurred within the HudButton's bounds
		 */
		this.mouseMove = function(event, intersected) {
			if (!that.enabled || that.selected)
				return;
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

	HudButton.prototype = new HudElement();
	HudButton.constructor = HudButton;

	/*
	 * Octane properties for the HudButton.
	 */
	HudButton.prototype._octane = HudElement.prototype._octane.concat([
		'disabledImg', 'enabledImg', 'hoverImg', 'selectedImg', 'x', 'y']);

	/**
	 * Calculate the bounds of the button.
	 */
	HudButton.prototype.calculateBounds = function() {
		var img = this.getImage();
		this._top = this.y;
		this._bottom = this._top + img._height;
		this._left = this.x;
		this._right = this._left + img._width;
	};

	/**
	 * Remove all references in the HudButton.
	 */
	HudButton.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);
		this.mouseMove = null;

		if (this.enabledImg) {
			this.enabledImg.cleanup();
			this.enabledImg = null;
		}
		if (this.disabledImg) {
			this.disabledImg.cleanup();
			this.disabledImg = null;
		}
		if (this.selectedImg) {
			this.selectedImg.cleanup();
			this.selectedImg = null;
		}
		if (this.hoverImg) {
			this.hoverImg.cleanup();
			this.hoverImg = null;
		}
	};

	/**
	 * Set the HudButton's image based on its flags and then draw it.
	 */
	HudButton.prototype.draw = function() {		
		var img = this.getImage();
		img.x = this.x;
		img.y = this.y;
		img.draw();
	};

	/**
	 * Get the image that represents the HudButton in its current state.
	 * 
	 * @return {hemi.HudImage} the image to draw for the HudButton
	 */
	HudButton.prototype.getImage = function() {
		var img = this.enabledImg;

		if (!this.enabled) {
			if (this.disabledImg) {
				img = this.disabledImg;
			}
		} else if (this.selected) {
			if (this.selectedImg) {
				img = this.selectedImg;
			}
		} else if (this.hovering) {
			if (this.hoverImg) {
				img = this.hoverImg;
			}
		}

		return img;
	};

	/**
	 * Set whether the HudButton is selected or not and then draw it.
	 * 
	 * @param {boolean} selected if the button is selected
	 */
	HudButton.prototype.select = function(isSelected) {
		this.selected = isSelected;
		this.draw();
	};

	/**
	 * Set the source x and y coordinates for the HudButton's images.
	 * 
	 * @param {Object} coords structure with optional coordinates for different images
	 */
	HudButton.prototype.setSrcCoords = function(coords) {
		var disabledCoords = coords.disabled,
			enabledCoords = coords.enabled,
			hoverCoords = coords.hover,
			selectedCoords = coords.selected;

		if (enabledCoords != null) {
			if (this.enabledImg === null) {
				this.enabledImg = new hemi.HudImage();
			}

			this.enabledImg.srcX = enabledCoords[0];
			this.enabledImg.srcY = enabledCoords[1];
		}
		if (disabledCoords != null) {
			if (this.disabledImg === null) {
				this.disabledImg = new hemi.HudImage();
			}

			this.disabledImg.srcX = disabledCoords[0];
			this.disabledImg.srcY = disabledCoords[1];
		}
		if (hoverCoords != null) {
			if (this.hoverImg === null) {
				this.hoverImg = new hemi.HudImage();
			}

			this.hoverImg.srcX = hoverCoords[0];
			this.hoverImg.srcY = hoverCoords[1];
		}
		if (selectedCoords != null) {
			if (this.selectedImg === null) {
				this.selectedImg = new hemi.HudImage();
			}

			this.selectedImg.srcX = selectedCoords[0];
			this.selectedImg.srcY = selectedCoords[1];
		}
	};

	/**
	 * Set the image urls for the HudButton's images.
	 * 
	 * @param {Object} urls structure with optional urls for different images
	 */
	HudButton.prototype.setUrls = function(urls) {
		var disabledUrl = urls.disabled,
			enabledUrl = urls.enabled,
			hoverUrl = urls.hover,
			selectedUrl = urls.selected;
		
		if (disabledUrl != null) {
			this.disabledImg = new hemi.HudImage();
			this.disabledImg.setUrl(disabledUrl);
		}
		if (enabledUrl != null) {
			this.enabledImg =  new hemi.HudImage();
			this.enabledImg.setUrl(enabledUrl);
		}
		if (hoverUrl != null) {
			this.hoverImg = new hemi.HudImage();
			this.hoverImg.setUrl(hoverUrl);
		}
		if (selectedUrl != null) {
			this.selectedImg = new hemi.HudImage();
			this.selectedImg.setUrl(selectedUrl);
		}
	};

	hemi.HudButton = HudButton;
	hemi.makeOctanable(hemi.HudButton, 'hemi.HudButton', hemi.HudButton.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudVideo class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudVideo contains video data and display options for a single video on the HUD.
	 * @extends hemi.HudElement
	 */
	var HudVideo = function() {
		HudElement.call(this);

		/*
		 * The height of the video. Call setHeight to change.
		 * @type number
		 */
		this._height = 0;

		/*
		 * The URLs of video files to try to load.
		 * @type string[]
		 */
		this._urls = [];

		/*
		 * The video DOM element.
		 */
		this._video = document.createElement('video');

		/*
		 * The width of the video. Call setWidth to change.
		 * @type number
		 */
		this._width = 0;

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

		var vid = this._video,
			that = this;
		
		this._video.onloadeddata = function() {
			if (that._height === 0) {
				that._height = vid.videoHeight;
			} else {
				vid.setAttribute('height', '' + that._height);
			}
			if (that._width === 0) {
				that._width = vid.videoWidth;
			} else {
				vid.setAttribute('width', '' + that._width);
			}
		};
	};

	HudVideo.prototype = new HudElement();
	HudVideo.constructor = HudVideo;

	/*
	 * Get the Octane properties for the HudVideo.
	 * 
	 * @return {Object[]} array of Octane properties
	 */
	HudVideo.prototype._octane = function() {
		var octane = HudElement.protothype._octane.concat(['x', 'y']);

		for (var i = 0, il = this._urls.length; i < il; ++i) {
			var urlObj = this._urls[i];

			octane.push({
				name: 'addUrl',
				arg: [urlObj.url, urlObj.type]
			});
		}

		return octane;
	};

	/**
	 * Add the given URL as a source for the video file to load.
	 * 
	 * @param {string} url the URL of the video file
	 * @param {string} type the type of the video file (ogv, mp4, etc)
	 */
	HudVideo.prototype.addUrl = function(url, type) {
		var src = document.createElement('source'),
			loadUrl = hemi.getLoadPath(url);
		
		src.setAttribute('src', loadUrl);
		src.setAttribute('type', 'video/' + type);
		this._video.appendChild(src);
		this._urls.push({
			url: url,
			type: type,
			node: src
		});
	};

	/**
	 * Calculate the bounds of the video.
	 */
	HudVideo.prototype.calculateBounds = function() {
		this._top = this.y;
		this._bottom = this._top + this._height;
		this._left = this.x;
		this._right = this._left + this._width;
	};

	/**
	 * Remove all references in the HudElement.
	 */
	HudVideo.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);
		this._video = null;
		this._urls = [];
	};

	/**
	 * Draw the video's current image.
	 */
	HudVideo.prototype.draw = function() {
		hemi.hudManager.createVideoOverlay(this, this.config);
	};

	/**
	 * Remove the given URL as a source for the video file to load.
	 * 
	 * @param {string} url the URL to remove
	 */
	HudVideo.prototype.removeUrl = function(url) {
		for (var i = 0, il = this._urls.length; i < il; ++i) {
			var urlObj = this._urls[i];

			if (urlObj.url === url) {
				this._video.removeChild(urlObj.node);
				this._urls.splice(i, 1);
				break;
			}
		}
	};

	/**
	 * Set the height for the video to be displayed at.
	 * 
	 * @param {number} height the height to set for the video
	 */
	HudVideo.prototype.setHeight = function(height) {
		this._height = height;
		if (this._video !== null) {
			this._video.setAttribute('height', '' + height);
		}
	};

	/**
	 * Set the width for the video to be displayed at.
	 * 
	 * @param {number} width the width to set for the video
	 */
	HudVideo.prototype.setWidth = function(width) {
		this._width = width;
		if (this._video !== null) {
			this._video.setAttribute('width', '' + width);
		}
	};

	hemi.HudVideo = HudVideo;
	hemi.makeOctanable(hemi.HudVideo, 'hemi.HudVideo', hemi.HudVideo.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudPage class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudPage contains other HudElements and display options for  drawing a single page on
	 * the HUD.
	 * @extends hemi.HudElement
	 */
	var HudPage = function() {
		HudElement.call(this);

		/**
		 * Flag indicating if the HudPage should automatically set its size to contain all of its
		 * elements.
		 * @type boolean
		 * @default true
		 */
		this.auto = true;

		/**
		 * Flag indicating if a background rectangle should be drawn for the HudPage.
		 * @type boolean
		 * @default true
		 */
		this.drawBackground = true;

		/**
		 * The number of pixels to add as padding around the bounds of the HudPage's elements when
		 * drawing the background rectangle.
		 * @type number
		 * @default 5
		 */
		this.margin = 5;

		this.elements = [];
	};

	HudPage.prototype = new HudElement();
	HudPage.constructor = HudPage;

	/*
	 * Octane properties for the HudPage.
	 */
	HudPage.prototype._octane = HudElement.prototype._octane.concat([
		'auto', 'drawBackground', 'elements', 'margin']);

	/**
	 * Add the given HudElement to the HudPage for displaying.
	 * 
	 * @param {hemi.HudElement} element element to add
	 */
	HudPage.prototype.add = function(element) {
		if (this.elements.indexOf(element) === -1) {
			this.elements.push(element);
		}
	};

	/**
	 * Calculate the bounds of the HudElements of the HudPage.
	 */
	HudPage.prototype.calculateBounds = function() {
		var ndx, len = this.elements.length;

		if (len === 0) {
			this._top = 0;
			this._bottom = 0;
			this._left = 0;
			this._right = 0;
			return;
		}

		for (ndx = 0; ndx < len; ndx++) {
			this.elements[ndx].calculateBounds();
		}

		if (this.auto) {
			var element = this.elements[0];
			this._top = element._top;
			this._bottom = element._bottom;
			this._left = element._left;
			this._right = element._right;

			for (ndx = 1; ndx < len; ndx++) {
				element = this.elements[ndx];

				if (element._top < this._top) {
					this._top = element._top;
				}
				if (element._bottom > this._bottom) {
					this._bottom = element._bottom;
				}
				if (element._left < this._left) {
					this._left = element._left;
				}
				if (element._right > this._right) {
					this._right = element._right;
				}
			}

			this._top -= this.margin;
			this._bottom += this.margin;
			this._left -= this.margin;
			this._right += this.margin;
		}
	};

	/**
	 * Remove all references in the HudPage.
	 */
	HudPage.prototype.cleanup = function() {
		HudElement.prototype.cleanup.call(this);

		for (var i = 0, il = this.elements.length; i < il; ++i) {
			this.elements[i].cleanup();
		}

		this.elements = [];
	};

	/**
	 * Remove all HudElements from the HudPage.
	 */
	HudPage.prototype.clear = function() {
		this.elements = [];
	};

	/**
	 * Draw the background (if any) and HudElements of the HudPage.
	 */
	HudPage.prototype.draw = function() {
		this.calculateBounds();

		if (this.drawBackground) {				
			hemi.hudManager.createRectangleOverlay(this, this.config);
		}

		for (var i = 0, il = this.elements.length; i < il; ++i) {
			if (this.elements[i].visible)
				this.elements[i].draw();
		}
	};

	/**
	 * Check if the given event occurred within the bounds of any of the HudElements of the HudPage.
	 * If it did, pass the Event to that HudElement. If not, call the HudPage's mouse down handler
	 * function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of the HudPage, otherwise
	 *     false
	 */
	HudPage.prototype.onMouseDown = function(event) {
		if (!this.visible)
			return false;

		var intersected = this._checkEvent(event);

		if (intersected || !this.auto) {
			var caught = false;

			for (var i = 0, il = this.elements.length; i < il && !caught; ++i) {
				if (this.elements[i].visible)
					caught = this.elements[i].onMouseDown(event);
			}

			if (intersected && !caught && this.mouseDown) {
				this.mouseDown(event);
			}
		}

		return intersected;
	};

	/**
	 * Pass the given Event to all of the HudPage's HudElements. If the HudPage's mouse move handler
	 * function is set, pass it the Event and if it occurred within the bounds of the HudPage.
	 * 
	 * @param {Object} event the event that occurred
	 */
	HudPage.prototype.onMouseMove = function(event) {
		if (!this.visible)
			return;

		for (var i = 0, il = this.elements.length; i < il; ++i) {
			if (this.elements[i].visible)
				this.elements[i].onMouseMove(event);
		}

		if (this.mouseMove) {
			var intersected = this._checkEvent(event);
			this.mouseMove(event, intersected);
		}
	};

	/**
	 * Check if the given event occurred within the bounds of any of the HudElements of the HudPage.
	 * If it did, pass the Event to that HudElement. If not, call the HudPage's mouse up handler
	 * function (if one was set).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of the HudPage, otherwise
	 *     false
	 */
	HudPage.prototype.onMouseUp = function(event) {
		var intersected = this._checkEvent(event);

		if (intersected || !this.auto) {
			var caught = false;
			var len = this.elements.length;

			for (var i = 0, il = this.elements.length; i < il && !caught; ++i) {
				caught = this.elements[i].onMouseUp(event);
			}

			if (intersected && !caught && this.mouseUp) {
				this.mouseUp(event);
			}
		}

		return intersected;
	};

	/**
	 * Remove the specified HudElement from the HudPage.
	 * 
	 * @param {hemi.HudElement} element element to remove
	 * @return {hemi.HudElement} the removed element or null
	 */
	HudPage.prototype.remove = function(element) {
		var ndx = this.elements.indexOf(element),
			found = null;

		if (ndx !== -1) {
			found = this.elements.splice(ndx, 1)[0];
		}

		return found;
	};

	/**
	 * Manually set the size of the HudPage. This will prevent it from  autosizing itself to fit all
	 * of the HudElements added to it.
	 * 
	 * @param {number} top the y coordinate of the top
	 * @param {number} bottom the y coordinate of the bottom
	 * @param {number} left the x coordinate of the left
	 * @param {number} right the x coordinate of the right
	 */
	HudPage.prototype.setSize = function(top, bottom, left, right) {
		this._top = top;
		this._bottom = bottom;
		this._left = left;
		this._right = right;
		this.auto = false;
	};

	hemi.HudPage = HudPage;
	hemi.makeOctanable(hemi.HudPage, 'hemi.HudPage', hemi.HudPage.prototype._octane);

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudDisplay class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudDisplay contains one or more HudPages to display sequentially.
	 * 
	 * @param {hemi.Client} opt_client optional client for the HudDisplay to draw to
	 */
	var HudDisplay = function(opt_client) {
		/*
		 * Flag indicating if HudDisplay is visible. This should not be set directly.
		 * @type boolean
		 * @default false
		 */
		this._visible = false;
		this.client = opt_client;
		this.currentPage = 0;
		this.pages = [];
	};

	/*
	 * Remove all references in the HudDisplay.
	 */
	HudDisplay.prototype._clean = function() {
		for (var i = 0, il = this.pages.length; i < il; ++i) {
			this.pages[i].cleanup();
		}

		this.pages = [];
	};

	/*
	 * Array of Hemi Messages that the Citizen is known to send.
	 * @type string[]
	 */
	HudDisplay.prototype._msgSent = [hemi.msg.visible];

	/*
	 * Octane properties for the HudDisplay.
	 */
	HudDisplay.prototype._octane = ['client', 'pages'];

	/**
	 * Add the given HudPage to the HudDisplay.
	 * 
	 * @param {hemi.HudPage} page page to add
	 */
	HudDisplay.prototype.add = function(page) {
		if (this.pages.indexOf(page) === -1) {
			this.pages.push(page);
		}
	};

	/**
	 * Remove all HudPages from the HudDisplay.
	 */
	HudDisplay.prototype.clear = function() {
		if (this._visible) {
			this.hide();
		}

		this.pages = [];
	};

	/**
	 * Get the currently displayed HudPage.
	 * 
	 * @return {hemi.HudPage} currently displayed page
	 */
	HudDisplay.prototype.getCurrentPage = function() {
		return this.currentPage < this.pages.length ? this.pages[this.currentPage] : null;
	};

	/**
	 * Get the number of HudPages in the HudDisplay.
	 * 
	 * @return {number} the number of HudPages
	 */
	HudDisplay.prototype.getNumberOfPages = function() {
		return this.pages.length;
	};

	/**
	 * Hide the HudDisplay and unregister its key and mouse handlers.
	 */
	HudDisplay.prototype.hide = function() {
		if (this._visible) {
			hemi.input.removeMouseMoveListener(this);
			hemi.input.removeMouseUpListener(this);
			hemi.input.removeMouseDownListener(this);
			hemi.hudManager.clearDisplay();
			this._visible = false;
			this.currentPage = 0;

			this.send(hemi.msg.visible,
				{
					page: 0
				});
		}
	};

	/**
	 * Pass the given mouse down Event to the currently displayed HudPage (if there is one).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of a HudPage, otherwise false
	 */
	HudDisplay.prototype.onMouseDown = function(event) {
		var page = this.getCurrentPage(),
			intersected = false;

		if (page) {
			intersected = page.onMouseDown(event);
		}

		return intersected;
	};

	/**
	 * Pass the given mouse move Event to the currently displayed HudPage (if there is one).
	 * 
	 * @param {Object} event the event that occurred
	 */
	HudDisplay.prototype.onMouseMove = function(event) {
		var page = this.getCurrentPage();

		if (page) {
			page.onMouseMove(event);
		}
	};

	/**
	 * Pass the given mouse up Event to the currently displayed HudPage (if there is one).
	 * 
	 * @param {Object} event the event that occurred
	 * @return {boolean} true if the event occurred within the bounds of a HudPage, otherwise false
	 */
	HudDisplay.prototype.onMouseUp = function(event) {
		var page = this.getCurrentPage(),
			intersected = false;

		if (page) {
			intersected = page.onMouseUp(event);
		}

		return intersected;
	};

	/**
	 * Display the next HudPage in the HudDisplay.
	 */
	HudDisplay.prototype.nextPage = function() {
		var numPages = this.pages.length;
		this.currentPage++;
		
		if (this.currentPage >= numPages) {
			this.currentPage = numPages - 1;
		} else {
			this.showPage();
		}
	};

	/**
	 * Display the previous HudPage in the HudDisplay.
	 */
	HudDisplay.prototype.previousPage = function() {
		this.currentPage--;
		
		if (this.currentPage < 0) {
			this.currentPage = 0;
		} else {
			this.showPage();
		}
	};

	/**
	 * Remove the specified HudPage from the HudDisplay.
	 * 
	 * @param {hemi.HudPage} page page to remove
	 * @return {hemi.HudPage} the removed page or null
	 */
	HudDisplay.prototype.remove = function(page) {
		var ndx = this.pages.indexOf(page),
			found = null;

		if (ndx !== -1) {
			if (this._visible && ndx === this.currentPage) {
				if (ndx !== 0) {
					this.previousPage();
				} else if (this.pages.length > 1) {
					this.nextPage();
				} else  {
					this.hide();
				}
			}

			found = this.pages.splice(ndx, 1)[0];
		}

		return found;
	};

	/**
	 * Show the first HudPage of the HudDisplay and bind the mouse handlers for interaction.
	 */
	HudDisplay.prototype.show = function() {
		if (!this._visible) {
			this._visible = true;
			hemi.input.addMouseDownListener(this);
			hemi.input.addMouseUpListener(this);
			hemi.input.addMouseMoveListener(this);
		}

		this.showPage();
	};

	/**
	 * Show the current page of the HudDisplay.
	 */
	HudDisplay.prototype.showPage = function() {
		if (!this.client) return;

		hemi.hudManager.setClient(this.client);
		hemi.hudManager.clearDisplay();
		var page = this.getCurrentPage();
		page.draw();

		this.send(hemi.msg.visible,
			{
				page: this.currentPage + 1
			});
	};

	hemi.makeCitizen(HudDisplay, 'hemi.HudDisplay', {
		cleanup: HudDisplay.prototype._clean,
		toOctane: HudDisplay.prototype._octane
	});

////////////////////////////////////////////////////////////////////////////////////////////////////
// HudManager class
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * @class A HudManager creates the appropriate view components for  rendering a HUD.
	 */
	var HudManager = function() {
		/*
		 * 2D canvas contexts for the Clients the HudManager is managing.
		 */
		this._contexts = {};

		/*
		 * Videos that are currently playing on a HUD.
		 */
		this._videos = [];

		/**
		 * The current 2D canvas context that the HudManager is drawing to.
		 */
		this.currentContext = null;

		hemi.addRenderListener(this);
	};

	/**
	 * Set up a 2D canvas for the given Client and add it to the list of Clients that the HudManager
	 * draws to.
	 * 
	 * @param {hemi.Client} client the Client to start managing
	 */
	HudManager.prototype.addClient = function(client) {
		var canvas = client.renderer.domElement,
			container = canvas.parentNode,
			hudId = container.id + '_hudCanvas',
			hudCan = container.firstChild,
			context;

		// Check to see if we've already appended a HUD canvas to this container
		while (hudCan && hudCan.id !== hudId) {
			hudCan = hudCan.nextSibling;
		}

		if (!hudCan) {
			hudCan = document.createElement('canvas');
			hudCan.id = hudId;
			hudCan.height = canvas.height;
			hudCan.width = canvas.width;

			var style = hudCan.style;
			style.left = canvas.offsetLeft + 'px';
			style.position = 'absolute';
			style.top = canvas.offsetTop + 'px';
			style.zIndex = '10';

			// Since the HUD canvas obscures the WebGL canvas, pass mouse events through to Hemi.
			hudCan.addEventListener('DOMMouseScroll', hemi.input.scroll, true);
			hudCan.addEventListener('mousewheel', hemi.input.scroll, true);
			hudCan.addEventListener('mousedown', hemi.input.mouseDown, true);
			hudCan.addEventListener('mousemove', hemi.input.mouseMove, true);
			hudCan.addEventListener('mouseup', hemi.input.mouseUp, true);
			container.appendChild(hudCan);
		}

		var context = hudCan.getContext('2d'),
			that = this;

		// In our coordinate system, y indicates the top of the first line of text, so set the
		// canvas baseline to match.
		context.textBaseline = 'top';
		this._contexts[client._getId()] = context;
		this.currentContext = context;

		client.subscribe(hemi.msg.cleanup, function(msg) {
			that._contexts[msg.src._getId()] = undefined;
		});
	};

	/**
	 * Clear the current overlays from the HUD.
	 */
	HudManager.prototype.clearDisplay = function() {
		var context = this.currentContext,
			canvas = context.canvas,
			vids = this._videos;

		this._videos = [];

		for (var i = 0, il = vids.length; i < il; ++i) {
			vids[i].video.pause();
		}

		context.clearRect(0, 0, canvas.width, canvas.height);
		context.beginPath();
	};

	/**
	 * Create a rectangular overlay from the given HudElement.
	 *
	 * @param {hemi.HudElement} element element with a bounding box to display
	 * @param {Object} boxConfig unique configuration options for the rectangular overlay
	 */
	HudManager.prototype.createRectangleOverlay = function(element, boxConfig) {
		var config = hemi.utils.join({}, currentTheme.page, boxConfig),
			context = this.currentContext;

		context.save();
		setPaintProperties(context, config);

		if (config.curve > 0) {
			var curve = config.curve <= 1 ? config.curve / 2.0 : 0.5;
			this.drawRoundRect(element, curve, true);

			if (config.outline != null) {
				this.drawRoundRect(element, curve, false);
			}
		} else {
			var x = element._left,
				y = element._top,
				width = element._right - x,
				height = element._bottom - y;

			context.fillRect(x, y, width, height);

			if (config.outline != null) {
				context.strokeRect(x, y, width, height);
			}
		}

		context.restore();
	};

	/**
	 * Create a text overlay.
	 *
	 * @param {hemi.HudText} text the HudText to display
	 * @param {Object} textConfig unique configuration options for the text overlay
	 */
	HudManager.prototype.createTextOverlay = function(text, textConfig) {
		var config = hemi.utils.join({}, currentTheme.text, textConfig),
			lineHeight = config.textSize + config.lineMargin,
			context = this.currentContext,
			textLines = text._wrappedText,
			x = text.x,
			y = text.y;

		context.save();
		setPaintProperties(context, config);

		for (var i = 0, il = textLines.length; i < il; ++i) {
			var line = textLines[i];
			context.fillText(line, x, y);

			if (config.outline != null) {
				context.strokeText(line, x, y);
			}

			y += lineHeight;
		}

		context.restore();
	};

	/**
	 * Create an image overlay.
	 *
	 * @param {hemi.HudImage} image the HudImage to display
	 * @param {Object} imgConfig unique configuration options for the image overlay
	 */
	HudManager.prototype.createImageOverlay = function(image, imgConfig) {
		var config = hemi.utils.join({}, currentTheme.image, imgConfig),
			context = this.currentContext,
			imageData = image._image;

		context.save();
		setPaintProperties(context, config);

		if (image._width !== imageData.width || image._height !== imageData.height ||
				image.srcX !== 0 || image.srcY !== 0) {
			context.drawImage(imageData, image.srcX, image.srcY, image._width, image._height,
				image.x, image.y, image._width, image._height);
		} else {
			context.drawImage(imageData, image.x, image.y);
		}

		context.restore();
	};

	/**
	 * Create a video overlay.
	 *
	 * @param {hemi.HudVideo} video the HudVideo to display
	 * @param {Object} vidConfig unique configuration options for the video overlay
	 */
	HudManager.prototype.createVideoOverlay = function(video, vidConfig) {
		var config = hemi.utils.join({}, currentTheme.video, vidConfig),
			videoData = video._video;

		this._videos.push({
			video: videoData,
			config: config,
			context: this.currentContext,
			x: video.x,
			y: video.y,
			width: video._width || videoData.videoWidth,
			height: video._height || videoData.videoHeight
		});
		videoData.play();
	};

	/**
	 * Calculate text wrapping and format the given string.
	 * 
	 * @param {string} text the text to display
	 * @param {number} width the maximum line width before wrapping
	 * @param {Object} textOptions unique configuration options for the text overlay
	 * @return {Object} wrapped text object
	 */
	HudManager.prototype.doTextWrapping = function(text, width, textOptions) {
		var config = hemi.utils.join({}, currentTheme.text, textOptions),
			context = this.currentContext,
			wrappedText;

		context.save();
		setPaintProperties(context, config);

		if (config.strictWrapping) {
			wrappedText = hemi.utils.wrapTextStrict(text, width, context);
		} else {
			var metric = context.measureText(text),
				charWidth = metric.width / text.length;
			wrappedText = hemi.utils.wrapText(text, width, charWidth);
		}

		var height = wrappedText.length * (config.textSize + config.lineMargin),
			longestWidth = 0;

		for (var i = 0, il = wrappedText.length; i < il; ++i) {
			var metric = context.measureText(wrappedText[i]);

			if (longestWidth < metric.width) {
				longestWidth = metric.width;
			}
		}

		context.restore();

		return {
			text: wrappedText,
			height: height,
			width: longestWidth
		};
	};

	/**
	 * Draw a rectangular overlay that has rounded corners from the given HudElement.
	 *
	 * @param {hemi.HudElement} element element with a bounding box to create the rectangle from
	 * @param {number} curveFactor amount of curving on the corners (between 0 and 0.5)
	 * @param {boolean} fill flag indicating whether to fill or stroke
	 */
	HudManager.prototype.drawRoundRect = function(element, curveFactor, fill) {
		var context = this.currentContext,
			lt = element._left,
			rt = element._right,
			tp = element._top,
			bm = element._bottom,
			wide = rt - lt,
			high = bm - tp,
			inc = high > wide ? wide * curveFactor : high * curveFactor,
			// Positions on a clock in radians :)
			hour12 = 270 * hemi.DEG_TO_RAD,
			hour3 = 0,
			hour6 = 90 * hemi.DEG_TO_RAD,
			hour9 = 180 * hemi.DEG_TO_RAD;

		context.beginPath();
		context.moveTo(lt, tp + inc);
		context.lineTo(lt, bm - inc);
		context.arc(lt + inc, bm - inc, inc, hour9, hour6, true);
		context.lineTo(rt - inc, bm);
		context.arc(rt - inc, bm - inc, inc, hour6, hour3, true);
		context.lineTo(rt, tp + inc);
		context.arc(rt - inc, tp + inc, inc, hour3, hour12, true);
		context.lineTo(lt + inc, tp);
		context.arc(lt + inc, tp + inc, inc, hour12, hour9, true);
		context.closePath();

		if (fill) {
			context.fill();
		} else {
			context.stroke();
		}
	};

	/**
	 * Copy the current image from any video elements onto the canvas on each render.
	 * 
	 * @param {Object} renderEvent event containing render info
	 */
	HudManager.prototype.onRender = function(renderEvent) {
		var vids = this._videos;
		
		for (var i = 0, il = vids.length; i < il; ++i) {
			var vid = vids[i],
				context = vid.context;

			context.save();
			setPaintProperties(context, vid.config);
			context.drawImage(vid.video, vid.x, vid.y, vid.width, vid.height);
			context.restore();
		}
	};

	/**
	 * Reset the text baseline value for all clients to 'top' (the default for the HudManager).
	 */
	HudManager.prototype.resetTextBaseline = function() {
		for (var id in this._contexts) {
			this._contexts[id].textBaseline = 'top';
		}
	};

	/**
	 * Set the current client for the HudManager to draw to.
	 * 
	 * @param {hemi.Client} client the client to draw to
	 */
	HudManager.prototype.setClient = function(client) {
		this.currentContext = this._contexts[client._getId()];
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Get the current theme for HUD displays.
	 * 
	 * @return {hemi.HudTheme} the current display options for HUD elements
	 */
	hemi.getHudTheme = function(theme) {
		return currentTheme;
	};

	/**
	 * Set the current theme for HUD displays.
	 * 
	 * @param {hemi.HudTheme} theme display options for HUD elements
	 */
	hemi.setHudTheme = function(theme) {
		currentTheme = theme;
	};

	/*
	 * The current HUD theme being used for default properties.
	 */
	var currentTheme = new hemi.HudTheme();
	currentTheme.name = 'Default';

	/**
	 * The HUD manager responsible for drawing all HUD displays, elements, etc.
	 */
	hemi.hudManager = new HudManager();

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 * Get the CSS RGBA string for the given color array in 0-1 format.
	 * @param {number[4]} col color array
	 * @return {string} the equivalent RGBA string
	 */
	function getRgba(col) {
		return 'rgba(' + Math.round(col[0]*255) + ',' + Math.round(col[1]*255) + ',' +
			Math.round(col[2]*255) + ',' + col[3] + ')';
	}

	/*
	 * Set the painting properties for the given 2D canvas context.
	 * 
	 * @param {Object} context the 2D canvas context
	 * @param {Object} options the options for painting
	 */
	function setPaintProperties(context, options) {
		var font = options.textStyle == null ? '' : options.textStyle + ' ';

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

		context.font = font;

		if (options.textAlign != null) {
			context.textAlign = options.textAlign;
		}
		if (options.color != null) {
			context.fillStyle = getRgba(options.color);
		}
		if (options.outline != null) {
			context.strokeStyle = getRgba(options.outline);
			// If there is an outline, cancel the shadow.
			context.shadowColor = 'rgba(0,0,0,0)';
		} else if (options.shadow != null) {
			var shad = options.shadow;
			context.shadowBlur = shad.radius;
			context.shadowColor = getRgba(shad.color);
			context.shadowOffsetX = shad.offsetX;
			context.shadowOffsetY = shad.offsetY;
		} else {
			context.shadowColor = 'rgba(0,0,0,0)';
		}
	}

})();
