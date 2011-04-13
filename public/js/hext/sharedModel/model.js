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
			var id = this.getId(),
				children = config.rootTransform.children;
			
			this.name = getModelName(this.fileName);
			this.pack = o3d.clone(config.pack);
			this.pack.gl = hemi.core.client.gl;
			this.pack.client = hemi.core.client;
			
			this.root = this.pack.createObject('Transform');
			this.root.parent = hemi.model.modelRoot;
			this.root.name = this.name;
			this.test = config.rootTransform;
			this.modelRoot = this.root.parent;
//			config.rootTransform.parent = this.root;
			
			this.animParam = config.animationTime;
			this.materials = config.getMaterials();
			this.shapes = config.getShapes();
			this.transforms = config.getTransforms();

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
