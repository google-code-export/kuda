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

	var clientData = [];

////////////////////////////////////////////////////////////////////////////////////////////////////
// Global functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	hemi.fx = hemi.fx || {};

	hemi.fx.cleanup = function() {
		clientData = [];
	};

	/**
	 * Removes the fog for the given client
	 * 
	 * @param {hemi.Client} client the client view to clear fog for
	 */
	hemi.fx.clearFog = function(client) {
		var data = findData(client);

		if (data && data.fog) {
			client.scene.fog = undefined;
			client.setBGColor(data.oldBGHex, data.oldBGAlpha);

			// now change the materials
			for (var i = 0, il = data.materials.length; i < il; i++) {
				var matData = data.materials[i];

				client.renderer.initMaterial(matData.mat, client.scene.lights, client.scene.fog, matData.obj);
			}
		}
	};

	/**
	 * Sets the fog for the given client to the following parameters
	 * 
	 * @param {hemi.Client} client the client view to set fog for 
	 * @param {number} color the hex (begins with 0x) color value
	 * @param {number} alpha the alpha value of the color between 0 and 1
	 * @param {number} near the viewing distance where the fog obscuring starts  
	 * @param {number} far the viewing distance where fog opacity obscures the subject
	 */
	hemi.fx.setFog = function(client, color, alpha, near, far) {
		var data = findData(client),
			objs = client.scene.__webglObjects.concat(client.scene.__webglObjectsImmediate),
			mats = [],
			refresh = false;

		if (!data) {
			data = {
				client: client
			};
			clientData.push(data);
		}

		if (!data.fog) {
			data.fog = new THREE.Fog();

			// save the old background color
			data.oldBGHex = client.renderer.getClearColor().getHex();
			data.oldBGAlpha = client.renderer.getClearAlpha();
			refresh = true;
		}

		data.fog.color.setHex(color);
		data.fog.near = near;
		data.fog.far = far;

		client.scene.fog = data.fog;
		client.setBGColor(color, alpha);

		if (refresh) {
			// go through all the materials and update
			// first get the materials
			for (var i = 0, il = objs.length; i < il; i++) {
				var webglObject = objs[i], 
					object = webglObject.object, 
					opaque = webglObject.opaque, 
					transparent = webglObject.transparent;

				for (var j = 0, jl = opaque.count; j < jl; j++) {
					mats.push({
						mat: opaque.list[j],
						obj: object
					});
				}
				for (var j = 0, jl = transparent.count; j < jl; j++) {
					mats.push({
						mat: transparent.list[j],
						obj: object
					});
				}
			}

			// save the materials for later
			data.materials = mats;
		}

		// now change the materials
		for (var i = 0, il = data.materials.length; i < il; i++) {
			var matData = data.materials[i],
				material = matData.mat,
				object = matData.obj,
				fog = client.scene.fog;

			if (refresh) {
				client.renderer.initMaterial(material, client.scene.lights, 
					fog, object);
			}
			else {
				var uniforms = material.uniforms;
				
				uniforms.fogColor.value = fog.color;		
				uniforms.fogNear.value = fog.near;
				uniforms.fogFar.value = fog.far;
			}
		}
	};

	/**
	 * Sets the opacity for the given material in the given object.
	 * 
	 * @param {hemi.Client} client the client view in which to change opacity
	 * @param {THREE.Object3d} object the object whose material's opacity we're changing
	 * @param {THREE.Material} material the material to set opacity on
	 * @param {number} opacity the opacity value between 0 and 1
	 */
	hemi.fx.setOpacity = function(client, object, material, opacity) {
		var objs = client.scene.__webglObjects.concat(client.scene.__webglObjectsImmediate),
			found = null;

		for (var i = 0, il = objs.length; i < il && found === null; i++) {
			var webglObject = objs[i];

			if (webglObject.object.parent === object || webglObject.object === object) {
				found = webglObject;
			}
		}

		if (found) {
			material.transparent = opacity < 1;
			material.opacity = opacity;

			// move the material to the transparent list and out of the opaque list
			found.transparent && (found.transparent.list = []);
			found.opaque && (found.opaque.list = []);
			unrollBufferMaterial(found);
			unrollImmediateBufferMaterial(found);
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility functions
////////////////////////////////////////////////////////////////////////////////////////////////////

	function findData(client) {
		var retVal = null;
		for (var i = 0, il = clientData.length; i < il && retVal === null; i++) {
			if (clientData[i].client === client) {
				retVal = clientData[i];
			}
		}
		return retVal;
	}

	/*
	 * The following three functions are exact duplicates of the functions in WebGLRenderer. Until
	 * those functions are exposed, we have to duplicate them here.
	 */
	function addToFixedArray(where, what) {
		where.list[ where.count ] = what;
		where.count += 1;
	}

	function unrollImmediateBufferMaterial(globject) {
		var object = globject.object,
			material = object.material;

		if (material.transparent) {
			globject.transparent = material;
			globject.opaque = null;
		} else {
			globject.opaque = material;
			globject.transparent = null;
		}
	}

	function unrollBufferMaterial(globject) {
		var object = globject.object,
			buffer = globject.buffer,
			material, materialIndex, meshMaterial;

		meshMaterial = object.material;

		if (meshMaterial instanceof THREE.MeshFaceMaterial) {
			materialIndex = buffer.materialIndex;

			if (materialIndex >= 0) {
				material = object.geometry.materials[materialIndex];

				if (material.transparent) {
					globject.transparent = material;
					globject.opaque = null;
				} else {
					globject.opaque = material;
					globject.transparent = null;
				}
			}
		} else {
			material = meshMaterial;

			if (material) {
				if (material.transparent) {
					globject.transparent = material;
					globject.opaque = null;
				} else {
					globject.opaque = material;
					globject.transparent = null;
				}
			}
		}
	}

})();
