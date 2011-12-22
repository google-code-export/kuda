/* Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php */
/*
The MIT License (MIT)

Copyright (c) 2011 SRI International

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var hemi = (function(hemi) {

	/**
	 * @class A TextureSet can manage Textures that are part of a set as defined by the user. It
	 * will handle loading them and notify the author upon completion.
	 * 
	 * @param {Object} opt_urls optional object map of Texture names to urls to load
	 * @param {function(Object):void} opt_callback function to receive loaded Textures
	 */
	var TextureSet = function(opt_urls, opt_callback) {
		/*
		 * The function to pass the loaded Textures once they are all ready.
		 * @type function(Object):void
		 */
		this._callback = opt_callback || null;
		/**
		 * The total number of loaded and not-yet-loaded Textures in the TextureSet.
		 * @type number
		 * @default 0
		 */
		this.count = 0;
		/*
		 * The number of loaded/ready Textures in the TextureSet.
		 * @type number
		 */
		this.loaded = 0;
		/**
		 * An object that maps a given name for a Texture to its instance for easy access.
		 * @type Object
		 */
		this.textures = {};

		if (opt_urls) {
			for (var name in opt_urls) {
				this.addTexture(name, opt_urls[name]);
			}
		}
	};

	/**
	 * Add the given Texture to the TextureSet.
	 *
	 * @param {string} name the name of the Texture
	 * @param {THREE.Texture} texture the Texture
	 */
	TextureSet.prototype.addLoadedTexture = function(name, texture) {
		this.count++;
		this.loaded++;
		this.textures[name] = texture;
	};

	/**
	 * Load a Texture from the given file url into the TextureSet.
	 *
	 * @param {string} name the name for the texture
	 * @param {string} url the url of the image
	 */
	TextureSet.prototype.addTexture = function(name, url) {
		var that = this;
		this.count++;

		hemi.loadTexture(url, function(texture) {
				that.textures[name] = texture;
				that.loaded++;

				if (that.loaded === that.count && that._callback) {
					that._callback(that.textures);
				}
			});
	};

	/**
	 * Get the Texture with the given name in the TextureSet.
	 *
	 * @param {string} name the name the Texture was given when added
	 * @return {THREE.Texture} the Texture
	 */
	TextureSet.prototype.getTexture = function(name) {
		return this.textures[name];
	};

	hemi.TextureSet = TextureSet;

	/**
	 * Get the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element from which to extract uv
	 *     coordinates
	 * @return {Object} {field: Field object used to reapply coordinates,
	 *				     uv: Float array of uv coordinates}
	 */
	// hemi.texture.getUV = function(element) {
	// 	var stream = element.streamBank.getVertexStream(hemi.core.o3d.Stream.TEXCOORD,0);
	// 	return stream?{field:stream.field,
	// 				   uv:stream.field.getAt(0,element.numberVertices)}:null;
	// };
	
	// hemi.texture.reportUV = function(element) {
	// 	var uv = hemi.texture.getUV(element).uv;
	// 	console.log(element);
	// 	for (var i = 0; i < uv.length; i+=3) {
	// 		console.log(uv[i] + ',' + uv[i+1] + ',' + uv[i+2]);
	// 	}
	// };
	
	/**
	 * Scale the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element to scale the texture on
	 * @param {number} x Amount to scale by along x-axis
	 * @param {number} y Amoung to scale by along y-axis
	 */
	// hemi.texture.scale = function(element,x,y) {
	// 	var set = hemi.texture.getUV(element);
	// 	for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
	// 		set.uv[i] *= x;
	// 		set.uv[i+1] *= y;
	// 	}
	// 	set.field.setAt(0,set.uv);
	// };

	/**
	 * Translate the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element to translate the texture on
	 * @param {number} x Distance to translate along x-axis
	 * @param {number} y Distance to translate along y-axis
	 */	
	// hemi.texture.translate = function(element,x,y) {
	// 	var set = hemi.texture.getUV(element);
	// 	for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
	// 		set.uv[i] += x;
	// 		set.uv[i+1] += y;
	// 	}	
	// 	set.field.setAt(0,set.uv);
	// };

	/**
	 * Rotate the texture uv coordinates of the given element.
	 * 
	 * @param {o3d.Element} element The element to rotate the texture on
	 * @param {number} theta Radians to rotate texture, counter-clockwise
	 */	
	// hemi.texture.rotate = function(element,theta) {
	// 	var set = hemi.texture.getUV(element);
	// 	for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
	// 		var x = set.uv[i];
	// 		var y = set.uv[i+1];
	// 		set.uv[i] = x*Math.cos(theta) - y*Math.sin(theta);
	// 		set.uv[i+1] = x*Math.sin(theta) + y*Math.cos(theta);
	// 	}	
	// 	set.field.setAt(0,set.uv);	
	// };

	return hemi;
})(hemi || {});
