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
	
	hext.sharedModel.createModelManager = function() {
		if (!window.parent.kuda) {
			window.parent.kuda = {};	
		} 
		
		if (!window.parent.kuda.modelManager) {
			window.parent.kuda.modelManager = new ModelManager();
		}
		
		return window.parent.kuda.modelManager;
	};
	
	var ModelManager = function() {
		this.models = new Hashtable();
	};
	
	ModelManager.prototype = {
		addModel: function(model) {
			var fileName = model.fileName,
				obj = this.models.get(fileName);
			
			// check if exists
			if (obj) {
				// then check if model is loaded
				// if loaded, simply notify the model
				if (obj.config) {
					model.loadConfig(obj.config);
				}	
				// else, add to the list of models waiting
				else {
					var modelList = obj.models;
					modelList.push(model);
				}	
			}
			// else add to the hash table 
			else {
				this.models.put(fileName, {
					models: [model],
					config: null
				});
				
				// start the loading process
				this.loadModel(fileName);
			}
		},
		
		loadModel: function(fileName) {
			var mgr = this,
				config = new hemi.model.ModelConfig();
			
			try {
				hemi.loader.loadModel(
					fileName,
					config.pack,
					config.rootTransform,
					function(pack, parent) {
						hemi.core.loaderCallback(pack);
						mgr.models.get(fileName).config = config;
						mgr.notifyModelLoaded(fileName, config);
					},
					{opt_animSource: config.animationTime});
			} 
			catch (e) {
				alert('Loading failed: ' + e);
			}
		},
		
		notifyModelLoaded: function(fileName, config) {
			var models = this.models.get(fileName).models;
			
			for (var ndx = 0, len = models.length; ndx < len; ndx++) {
				var model = models[ndx];
				model.loadConfig(config);
			}
		}
	};
	
	return hext;
})(hext || {})
