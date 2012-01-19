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

	var colladaLoader = new THREE.ColladaLoader();
	
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
		 * the caller to the list. If the model has already been
		 * loaded, this immediately begins the deserialization process.
		 * 
		 * @param {string} url the path to the model file
		 * @param {hemi.Client} client the current hemi client. R
		 * @param {function(hemi.model)} callback the function to be called when the model is loaded
		 */
		addModel: function(url, client, callback) {
			var	obj = this.models.get(url),
				that = this,
				thatURL = url;
		
			if (obj) {
				if (obj.data) {
					var collada = colladaLoader.parse(obj.data, null, url);
					var model = new hemi.model(obj.client);
					model.load(collada);
					callback(model);
				}	
				else {
					var configs = obj.configs;
					configs.push({
						client: client,
						callback: callback
					});
				}
			}
			else {
				hemi.utils.get(url, function(data, status) {
					that.notifyLoaded(thatURL, data);
				}, true);
				
				this.models.put(url, {
					configs: [{
						client: client,
						callback: callback
					}],
					data: null
				});
			}
		},
		
		/**
		 * Goes through the list of callees associated with the url found in
		 * archiveInfo, and begins the deserialization process for each callee.
		 * 
		 * @param {string} url the url of the model
		 * @param {string} data the archiveInfo object 
		 * 		created when an archive is loaded.
		 */
		notifyLoaded: function(url, data) {
			var modelObj = this.models.get(url),
				list = modelObj.configs;
			
			for (var ndx = 0, len = list.length; ndx < len; ndx++) {
				var config = list[ndx];
					
				var collada = colladaLoader.parse(data, null, url);
				var model = new hemi.Model(config.client);
				model.load(collada);
				config.callback(model);
			}
			
			modelObj.data = data;
		}
	};
	
	return hext;
})(hext || {});
