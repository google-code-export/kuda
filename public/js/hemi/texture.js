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
o3djs.require('hemi.loader');

var hemi = (function(hemi) {

	/**
	 * @namespace A module for texture set management, specifically designed
	 * to handle shader sampling and texture maps.  An o3d.Material will have
	 * a parameter that is a sampler when a material is using a texture.  The
	 * paramter is either an emmissive, or diffuse sampler.  This module makes
	 * easy to swap textures dynamically on {@link hemi.model.Model}s.  See the
	 * lighting sample.
	 */
	hemi.texture = hemi.texture || {};

	/**
	 * @class A TestureSampler contains a textureURL and a value.  The value is
	 * the o3d.Sampler which can be assinged to a shaders sampler parameter.
	 * @param {string} url Sets the testureURL
	 * @memberOf hemi.texture
	 */
	hemi.texture.TextureSampler = function(url) {
		/**
		 * The url of the texture image file
		 * @type string
		 * @default ''
		 */
		this.textureURL = url || '';
		this.value = hemi.core.mainPack.createObject('Sampler');
	};

	/**
	 * @class A TextureSet can manage hemi.texture.TextureSampler's that are
	 * part of a set as defined by the author.  It will handle loading them and
	 * notify the author upon completion.
	 * @param {number} count
	 * @param {function(hemi.texture.TextureSet.samplers):void} opt_callback
	 */
	hemi.texture.TextureSet = function(count, opt_callback) {
		/**
		 * An object literal that maps a given name for the
		 * hemi.texture.TextureSampler to its instance for easy access.
		 * @type Object
		 * @default
		 */
		this.samplers = { length: 0 };
		/**
		 * The total number of hemi.texture.TextureSampler's in this set.
		 * @type number
		 * @default 0
		 */
		this.count = count || 0;
		this.callback = opt_callback || function() {};
	};

	hemi.texture.TextureSet.prototype = {
		/**
		 * Add a named texture file at the given url to this set.
		 *
		 * @param {string} name the name it will have in the
		 * hemi.texture.TextureSet.samplers object for lookup.
		 * @param {string} url the url of the image
		 */
		addTexture: function(name, url) {
			this.count++;
			this.loadTexture(name, url);
		},
		/**
		 * Add a hemi.texture.TextureSampler to this set
		 *
		 * @param {string} name the name for lookup
		 * @param {hemi.texture.TextureSampler} texSampler A
		 * hemi.texture.TextureSampler object
		 */
		addTextureSampler: function(name, texSampler) {
			this.count++;

			if (!texSampler.value.texture) {
				this.loadTextureSampler(texSampler);
			}

			this.samplers[name] = texSampler;
		},
		/**
		 * Get the hemi.texture.TextureSampler with the name in this set.
		 *
		 * @param {string} name the name it was given when added.
		 * @return {hemi.texture.TextureSampler} the hemi.texture.TextureSampler object
		 */
		getTextureSampler: function(name) {
			return this.samplers[name];
		},
		/**
		 * Get the o3d.Sampler from the named hemi.texture.TextureSampler
		 *
		 * @param {string} name the name it was given when added
		 * @return {o3d.Sampler} the sampler
		 */
		getSamplerValue: function(name) {
			return this.samplers[name].value;
		},
		/**
		 * Load a texture from the given url and associate it in this set with
		 * the given name.
		 *
		 * @param {string} name the name to associate it with
		 * @param {string} url the url to load the image from
		 */
		loadTexture: function(name, url) {
			var texSampler = new hemi.texture.TextureSampler(url);
			this.samplers[name] = texSampler;
			this.loadTextureSampler(texSampler);
		},
		/**
		 * Load a hemi.texture.TextureSampler's texture image file and set the
		 * texture on the value, which is an o3d.Sampler, once loaded.
		 *
		 * @param {hemi.texture.TextureSampler} texSampler a
		 * hemi.texture.TextureSampler to load and set the texture on
		 */
		loadTextureSampler: function(texSampler) {
			hemi.loader.loadTexture(texSampler.textureURL,
				function(texture) {
					texSampler.value.texture = texture;
					this.samplers.length++;

					if (this.samplers.length === this.count) {
						this.callback(this.samplers);
					}
				}, this);
		}
	};

	/**
	 * Use this function to create multiple texture sets using a simple object literal that
	 * maps distinct meaningful names to the urls of the images.
	 *
	 * @param {Object} urls An object literal with properties of urls to load into the set
	 * @param {function(hemi.texture.TextureSet.samplers):void} callback a
	 * function to call and pass the samplers
	 * @return {hemi.texture.TextureSet} the hemi.texture.TextureSet object
	 */
	hemi.texture.createTextureSet = function(urls, callback) {
		var urls = urls || {},
			count = 0,
			texSet;

		if (typeof Object.keys === 'function') {
			count = Object.keys(urls).length;
		} else {
			for (var p in urls) {
				if (urls.hasOwnProperty(p)) count++;
			}
		}

		texSet = new hemi.texture.TextureSet(count, callback);

		for (var name in urls) {
			texSet.loadTexture(name, urls[name]);
		}

		return texSet;
	};
	
	/**
	 * Get the texture uv coordinates of an element.
	 * @param {o3d.Element} element The element from which to extract uv coordinates
	 * @return {Object} {field: Field object used to reapply coordinates,
	 *				     uv: Float array of uv coordinates}
	 */
	hemi.texture.getUV = function(element) {
		var stream = element.streamBank.getVertexStream(hemi.core.o3d.Stream.TEXCOORD,0);
		return stream?{field:stream.field,
					   uv:stream.field.getAt(0,element.numberVertices)}:null;
	};
	
	hemi.texture.reportUV = function(element) {
		var uv = hemi.texture.getUV(element).uv;
		console.log(element);
		for (var i = 0; i < uv.length; i+=3) {
			console.log(uv[i] + ',' + uv[i+1] + ',' + uv[i+2]);
		}
	};
	
	/**
	 * Scale the texture uv coordinates of an element
	 * @param {o3d.Element} element The element to scale the texture on
	 * @param {float} x Amount to scale by along x-axis
	 * @param {float} y Amoung to scale by along y-axis
	 */
	hemi.texture.scale = function(element,x,y) {
		var set = hemi.texture.getUV(element);
		for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
			set.uv[i] *= x;
			set.uv[i+1] *= y;
		}
		set.field.setAt(0,set.uv);
	};

	/**
	 * Translate the texture uv coordinates of an element
	 * @param {o3d.Element} element The element to translate the texture on
	 * @param {float} x Distance to translate along x-axis
	 * @param {float} y Distance to translate along y-axis
	 */	
	hemi.texture.translate = function(element,x,y) {
		var set = hemi.texture.getUV(element);
		for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
			set.uv[i] += x;
			set.uv[i+1] += y;
		}	
		set.field.setAt(0,set.uv);
	};

	/**
	 * Rotate the texture uv coordinates of an element
	 * @param {o3d.Element} element The element to rotate the texture on
	 * @param {float} theta Radians to rotate texture, counter-clockwise
	 */	
	hemi.texture.rotate = function(element,theta) {
		var set = hemi.texture.getUV(element);
		for (var i = 0; i < set.uv.length; i+=set.field.numComponents) {
			var x = set.uv[i];
			var y = set.uv[i+1];
			set.uv[i] = x*Math.cos(theta) - y*Math.sin(theta);
			set.uv[i+1] = x*Math.sin(theta) + y*Math.cos(theta);
		}	
		set.field.setAt(0,set.uv);	
	};

	return hemi;
})(hemi || {});
