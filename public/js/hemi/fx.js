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

var hemi = (function(hemi) {

	hemi.fx = hemi.fx || {};
	
	var clientData = [];
	
	function findData(client) {
		var retVal = null;
		for (var i = 0, il = clientData.length; i < il && retVal == null; i++) {
			if (clientData[i].client === client) {
				retVal = clientData[i];
			}
		}
		return retVal;
	};
	
	/**
	 * Sets the fog for the given client to the following parameters
	 * 
	 * @param {hemi.Client} client the client view to set fog for 
	 * @param {number} color the hex (begins with 0x) color value
	 * @param {number} alpha the alpha value of the color between 0 and 1
	 * @param {number} near the viewing distance where the fog obscuring starts  
	 * @param {number} far the viewing distance where fog opacity obscures the 
	 * 		subject
	 */
	hemi.fx.setFog = function(client, color, alpha, near, far) {
		var data = findData(client),
			objs = client.scene.__webglObjects.concat(
				client.scene.__webglObjectsImmediate),
			mats = [];
		
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
		}
		
		data.fog.color.setHex(color);
		data.fog.near = near;
		data.fog.far = far;
		
		client.scene.fog = data.fog;
		client.setBGColor(color, alpha);
		
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
		
		// now change the materials
		for (var i = 0, il = mats.length; i < il; i++) {
			var matData = mats[i];
			
			client.renderer.initMaterial(matData.mat, client.scene.lights, client.scene.fog, matData.obj);
		}
		
		// save the materials for later
		data.materials = mats;
	};
	
	/**
	 * Removes the fog for the given client
	 * 
	 * @param {hemi.Client} client the client view to clear fog for
	 */
	hemi.fx.clearFog = function(client) {
		var data = findData(client);
		
		if (data && data.fog) {
			data.fog = client.scene.fog = undefined;
			client.setBGColor(data.oldBGHex, data.oldBGAlpha);
			
			// now change the materials
			for (var i = 0, il = data.materials.length; i < il; i++) {
				var matData = data.materials[i];
				
				client.renderer.initMaterial(matData.mat, client.scene.lights, client.scene.fog, matData.obj);
			}
		}
	};
	
	return hemi;
})(hemi || {});