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
	
	hemi.ModelBase = function(client) {
		this.client = client;
		this.fileName = null;
	};
	
	hemi.ModelBase.prototype = {
		load: function(callback) {
			var that = this;
			
			hemi.loadCollada(this.fileName, function (collada) {
				var dae = collada.scene;
				that.client.scene.add(dae);
				
				if (callback) {
					callback(dae);
				}
			});
		},
		
		setFileName: function(fileName, callback) {
			this.fileName = fileName;
			this.load(callback);
		}
	};
	
	hemi.makeCitizen(hemi.ModelBase, 'hemi.Model', {
		msgs: ['hemi.load'],
		toOctane: ['fileName', 'load']
	});

	return hemi;
})(hemi || {});
