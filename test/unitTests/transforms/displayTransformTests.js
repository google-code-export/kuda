var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.transforms.displayTransform');

	parent.test = parent.test || {};
	
	var UnitTest = {
		runTests: function() {
			module("transforms");
			
			test("DisplayTransformConfig: constructor", function() {
				expect(3);
				
				var config = new parent.transforms.DisplayTransformConfig();
				
				equals(config.displayType, null, "Initial display type");
				equals(config.model, null, "Initial model");
				equals(config.transformName, null, "Initial transform name");
			});
			
			test("DisplayTransform: constructor", function() {
				expect(4);
				
				var displayType = parent.transforms.DisplayType.Show;
				var transformName = 'Transform name';
				var model = new parent.model.Model('');
				var transformType = parent.transforms.TransformType.Display;
				
				var config = new parent.transforms.DisplayTransformConfig();
				config.displayType = displayType;
				config.model = model;
				config.transformName = transformName;
				
				var display = new parent.transforms.DisplayTransform(config);
				
				same(display.config, config, "Initial configuration");
				equals(display.transformType, transformType, "Initial transform type");
				equals(display.transform, null, "Initial transform");
				equals(display.getId(), null, "Initial id");
			});
			
			test("DisplayTransform: to Octane", function() {
				expect(4);
				
				var displayType = parent.transforms.DisplayType.Show;
				var transformName = 'Transform name';
				var modelId = 124;
				var model = new parent.model.Model('');
				model.setId(modelId);
				var transformType = parent.transforms.TransformType.Display;
				
				var config = new parent.transforms.DisplayTransformConfig();
				config.displayType = displayType;
				config.model = model;
				config.transformName = transformName;
				
				var display = new parent.transforms.DisplayTransform(config);
				var octane = display.toOctane();
				
				equals(octane.tt, transformType, "Transform type exported to Octane");
				equals(octane.dt, displayType, "Display type exported to Octane");
				equals(octane.mi, modelId, "Model id exported to Octane");
				equals(octane.tn, transformName, "Transform name exported to Octane");
			});
			
			test("DisplayTransform: verifyTarget", function() {
				expect(2);
				
				var displayType = parent.transforms.DisplayType.Show;
				var transformName = 'Transform name';
				var model = new parent.model.Model('');
                var transform = {
					name: transformName,
                    children: [],
					clientId: 2323
                };
				
				model.transforms = [transform];
				
				var config = new parent.transforms.DisplayTransformConfig();
				config.displayType = displayType;
				config.model = model;
				config.transformName = transformName;
				
				var display = new parent.transforms.DisplayTransform(config);
				
				equals(display.transform, null, "Initial transform");
				display.verifyTarget();
				equals(display.transform, transform, "Verified transform");
			});
			
			test("DisplayTransform: createDisplayTransform", function() {
				expect(3);
				
				var displayType1 = parent.transforms.DisplayType.Show;
				var displayType2 = parent.transforms.DisplayType.Hide;
				var displayType3 = parent.transforms.DisplayType.HideWithPick;
				var transformName = 'Transform name';
				var model = new parent.model.Model('');
				var transformType = parent.transforms.TransformType.Display;
				
				var config = new parent.transforms.DisplayTransformConfig();
				config.displayType = displayType1;
				config.model = model;
				config.transformName = transformName;
				
				var display1 = parent.transforms.createDisplayTransform(config);
				config.displayType = displayType2;
				var display2 = parent.transforms.createDisplayTransform(config);
				config.displayType = displayType3;
				var display3 = parent.transforms.createDisplayTransform(config);
				
				ok(display1.applyTransform, "Apply transform function assigned");
				ok(display2.applyTransform, "Apply transform function assigned");
				ok(display3.applyTransform, "Apply transform function assigned");
			});
			
			test("DisplayTransform: fireEvent", function() {
				expect(2);
				
				var displayType1 = parent.transforms.DisplayType.Hide;
				var displayType2 = parent.transforms.DisplayType.Show;
				var transformName = 'Transform name';
				var model = new parent.model.Model('');
                var transform = {
					name: transformName,
                    children: [],
					clientId: 2323
                };
				
				model.transforms = [transform];
				model.modelTransform = {
					name: 'modelTransform',
					children: [transform],
					clientId: 3434
				};
				
				parent.core.addToTransformTable(model.modelTransform);
				
				var config = new parent.transforms.DisplayTransformConfig();
				config.displayType = displayType1;
				config.model = model;
				config.transformName = transformName;
				
				var display1 = parent.transforms.createDisplayTransform(config);
				config.displayType = displayType2;
				var display2 = parent.transforms.createDisplayTransform(config);
				
				display1.fireEvent();
				equals(transform.parent, parent.core.hiddenRoot, "Transform is on the hidden branch");
				display2.fireEvent();
				equals(transform.parent, model.modelTransform, "Transform parent is restored");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
