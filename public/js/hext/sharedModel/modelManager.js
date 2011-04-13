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
	
	hext.sharedModel = hext.sharedModel || {};
	
	hext.sharedModel.getModelManager = function() {
		if (!window.parent.kuda) {
			window.parent.kuda = {};	
		} 
		
		if (!window.parent.kuda.modelManager) {
			window.parent.kuda.modelManager = new ModelManager();
		}
		
		return window.parent.kuda.modelManager;
	};
	
	// next override o3djs.scene.loadScene
	o3djs.scene.loadScene = function(client, 
									 pack, 
									 parent, 
									 url, 
									 callback, 
									 opt_options){
									 			
		var mgr = hext.sharedModel.getModelManager(),
			archiveInfo = mgr.addArchive(url, o3djs, client, pack, parent, 
				callback, opt_options);
		
		return archiveInfo;
	}
	
	var ModelManager = function() {
		this.archives = new Hashtable();
	};
	
	ModelManager.prototype = {
		addArchive: function(url, o3d, client, pack, parent, callback, options) {
			var obj = this.archives.get(url);
		
			// check if exists
			if (obj) {
				// then check if model is loaded
				// if loaded, simply notify the model
				if (obj.loaded) {
					var finishCallback = function(pack, parent, exception) {
						config.callback(pack, parent, exception);
					};
					
					o3d.serialization.deserializeArchive(obj.archive,
						'scene.json', client, pack, parent,
						callback, options);
				}	
				// else, add to the list of models waiting
				else {
					var configs = obj.configs;
					configs.push({
						o3d: o3djs,
						client: client,
						pack: pack,
						parent: parent,
						callback: callback
					});
				}
				return obj.archive;
			}
			// else add to the hash table 
			else {
				var archive = o3djs.io.loadArchive(pack, url, this.loadFinished);
				
				this.archives.put(fileName, {
					configs: [{
						o3d: o3djs,
						client: client,
						pack: pack,
						parent: parent,
						callback: callback
					}],
					archive: archive,
					loaded: false
				});
				
				// start the loading process 
				return archive;
			}
		},
		
		loadFinished: function(archiveInfo, exception) {
			if (!exception) {
				notifyLoaded(archiveInfo.request_.uri);
			}
			else {
//				archiveInfo.destroy();
//				callback(pack, parent, exception);
			}
		},
		
		notifyLoaded: function(url) {
			var archiveObj = this.archives.get(url),
				archiveInfo = archiveObj.archive,
				list = archiveObj.configs;
			
			for (var ndx = 0, len = list.length; ndx < len; ndx++) {
				var config = list[ndx],
					o3dContext = config.o3d,
					finishCallback = function(pack, parent, exception) {
						config.callback(pack, parent, exception);
					};
					
				o3dContext.serialization.deserializeArchive(archiveInfo,
					'scene.json', config.client, config.pack, config.parent,
					config.callback, config.options);
			}
			
			archiveObj.loaded = true;
		}
	};
	
	return hext;
})(hext || {})
