var hext = (function(hext) {
	hext.sharedModel = hext.sharedModel || {};
	
	hext.sharedModel.Model = function() {
		hemi.model.Model.call(this);

		// create the model manager
		this.mgr = hext.sharedModel.createModelManager();
	};
	
	hext.sharedModel.Model.prototype = {
		load: function() {
			var config = new hemi.model.ModelConfig(),
				that = this;
			
			if (this.pack !== null) {
				this.unload();
			}
			
			that.mgr.addModel(this);
		},
		
		loadConfig: function(config) {
			var id = this.getId();
			
			this.name = getModelName(this.fileName);
			this.root = config.rootTransform;
			this.root.name = this.name;
			this.animParam = config.animationTime;
			this.materials = config.getMaterials();
			this.shapes = config.getShapes();
			this.transforms = config.getTransforms();
			this.pack = config.pack;

			hemi.world.tranReg.distribute(this);
			
			this.send(hemi.msg.load, {});
		}
	};

	// Internal functions
	var getModelName = function(fileName) {
		// Currently, file names are of the form:
		// [path to directory]/[model name]/scene.json
		var name = '',
			end = fileName.lastIndexOf('/');
			start = fileName.lastIndexOf('/', end - 1);
		
		if (start >= 0 && end > start) {
			name = fileName.substring(start + 1, end);
		}
		
		return name;
	};
	
	hext.sharedModel.Model.inheritsFrom(hemi.model.Model);
	
	return hext;
})(hext || {});
