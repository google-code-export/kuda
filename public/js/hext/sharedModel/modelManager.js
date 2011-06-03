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
	
	/**
	 * Creates a model manager object. Object is a singleton and always exists
	 * at the top level
	 */
	hext.sharedModel.getModelManager = function() {
		if (!window.parent.kuda) {
			window.parent.kuda = {};	
		} 
		
		if (!window.parent.kuda.modelManager) {
			window.parent.kuda.modelManager = new ModelManager();
		}
		
		return window.parent.kuda.modelManager;
	};

	/**
	 * Overwrites the o3d.scene.loadScene method to make use of the model 
	 * manager.
	 * 
	 * @param {!o3d.Client} client An O3D client object.
	 * @param {!o3d.Pack} pack Pack to load scene into.
	 * @param {!o3d.Transform} parent Transform to parent scene under.
	 * @param {string} url URL of scene to load.
	 * @param {!function(!o3d.Pack, !o3d.Transform, *): void} callback
	 *     Callback when scene is loaded. It will be passed the pack, the parent and
	 *     an exception which is null on success.
	 * @param {!o3djs.serialization.Options} opt_options Options passed into the
	 *     loader.
	 * @return {!o3djs.io.LoadInfo} A LoadInfo for tracking progress.
	 * @see o3djs.loader.createLoader
	 */
	o3djs.scene.loadScene = function(client, 
									 pack, 
									 parent, 
									 url, 
									 callback, 
									 opt_options){
					 			
		var mgr = hext.sharedModel.getModelManager(),
			archiveInfo = mgr.addModel(url, o3djs, client, pack, parent, 
				callback, opt_options);
		
		return archiveInfo;
	};
	
	/**
	 * The ModelManager manages all models, ensuring one copy per model url so
	 * that the model resources can be shared among different contexts. 
	 */
	var ModelManager = function() {
		this.models = new Hashtable();
	};
	
	ModelManager.prototype = {
		/**
		 * Adds a model to the list of those being managed. If the model already
		 * exists (identified by the url) and hasn't been loaded yet, this adds 
		 * the caller to the list (identified by the context provided by o3d, 
		 * client, pack, parent, and callback). If the model has already been
		 * loaded, this immediately begins the deserialization process.
		 * 
		 * @param {string} url the path to the model file
		 * @param {!o3djs} o3d the o3djs context object. Since different
		 * 		contexts can be used here, this ensures the right one gets tied
		 * 		to the caller.
		 * @param {!o3d.Client} client the current O3D client. Required for 
		 * 		deserialization.
		 * @param {!o3d.Pack} pack the pack object used for creating certain o3d
		 * 		objects. Required for deserialization and archive loading.
		 * @param {!o3d.Transform} parent the parent transform to attach to.
		 * @param {!function(!o3d.Pack, !o3d.Transform, *): void} callback 
		 * 		method called when deserialization is finished.
		 * @param {!o3djs.serialization.Options} options optional options passed 
		 * 		to the deserializer.
		 */
		addModel: function(url, o3d, client, pack, parent, callback, options) {
			var obj = this.models.get(url),
				that = this;
		
			if (obj) {
				if (obj.archiveInfo) {
					o3d.serialization.deserializeArchive(obj.archiveInfo,
						'scene.json', client, pack, parent,
						callback, options);
				}	
				else {
					var configs = obj.configs;
					configs.push({
						o3d: o3djs,
						client: client,
						pack: pack,
						parent: parent,
						callback: callback,
						options: options
					});
				}
				return obj.loadInfo;
			}
			else {
				var loadInfo = o3djs.io.loadArchive(pack, url, function(archiveInfo, exception) {
					if (!exception) {
						that.notifyLoaded(archiveInfo);
					}
					else {
						archiveInfo.destroy();
						callback(pack, parent, exception);
					}
				});
				
				this.models.put(url, {
					configs: [{
						o3d: o3djs,
						client: client,
						pack: pack,
						parent: parent,
						callback: callback,
						options: options
					}],
					loadInfo: loadInfo,
					archiveInfo: null
				});
				
				return loadInfo;
			}
		},
		
		/**
		 * Goes through the list of callees associated with the url found in
		 * archiveInfo, and begins the deserialization process for each callee.
		 * 
		 * @param {!o3djs.io.ArchiveInfo} archiveInfo the archiveInfo object 
		 * 		created when an archive is loaded.
		 */
		notifyLoaded: function(archiveInfo) {
			var url = archiveInfo.request_.uri,
				modelObj = this.models.get(url),
				list = modelObj.configs;
			
			for (var ndx = 0, len = list.length; ndx < len; ndx++) {
				var config = list[ndx],
					o3dContext = config.o3d;
					
				o3dContext.serialization.deserializeArchive(archiveInfo,
					'scene.json', config.client, config.pack, config.parent,
					config.callback, config.options);
			}
			
			modelObj.archiveInfo = archiveInfo;
		}
	};
	
	return hext;
})(hext || {});
