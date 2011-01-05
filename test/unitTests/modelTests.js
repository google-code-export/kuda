var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.model = parent.test.model || {};
	
	o3djs.require('hemi.model');
	
	var UnitTest = {
		name: 'model',
		runTests: function() {
			module(this.name);
			
			test("Transform parent for module", function() {
				expect(2);
				
				ok(parent.model.modelRoot, "Initial model transform");
				var tp = parent.core.getTransformParent(parent.model.modelRoot);
				equals(tp, parent.picking.pickRoot, "Initial model transform's parent");
			});
			
			test("ModelConfig: constructor", function() {
				expect(4);
				
				var config = new parent.model.ModelConfig();
				
				ok(config.pack, "Initial pack");
				ok(config.rootTransform, "Initial transform");
				ok(config.animationTime, "Initial animation time");
				
				var tp = parent.core.getTransformParent(config.rootTransform);
				equals(tp.clientId, parent.model.modelRoot.clientId, "Initial transform's parent");
			});
			
			test("ModelConfig: get materials", function() {
				expect(2);
				
				var config = new parent.model.ModelConfig();
				var material = config.pack.createObject('Material');
				var materialArray = config.getMaterials();
				
				equals(materialArray.length, 1, "Number of materials in pack");
				equals(materialArray[0], material, "Correct material in pack");
			});
			
			test("ModelConfig: get shapes", function() {
				expect(2);
				
				var config = new parent.model.ModelConfig();
				var shape = config.pack.createObject('Shape');
				var shapeArray = config.getShapes();
				
				equals(shapeArray.length, 1, "Number of shapes in pack");
				equals(shapeArray[0], shape, "Correct shape in pack");
			});
			
			test("ModelConfig: get transforms", function() {
				expect(2);
				
				var config = new parent.model.ModelConfig();
				var shape = config.pack.createObject('Shape');
				var transformArray = config.getTransforms();
				
				equals(transformArray.length, 1, "Number of transforms in pack");
				equals(transformArray[0], config.rootTransform, "Correct transform in pack");
			});
			
			test("Model: constructor", function() {
				expect(8);
				
				var fileName = 'http://me.com/modelFile.o3dtgz';
				var name = 'modelFile';
				var model = new parent.model.Model();
				model.setFileName(fileName);
				
				equals(model.fileName, fileName, "Initial file name");
				equals(model.name, name, "Initial model name");
				equals(model.config, null, "Initial config");
				same(model.materials, [], "Initial materials array");
				same(model.shapes, [], "Initial shapes array");
				same(model.transforms, [], "Initial transforms array");
				equals(model.isAnimating, false, "Initial animating state");
				equals(model.getId(), null, "Initial ID");
			});
			
			test("Model: to Octane", function() {
				expect(0);
			});

			
			test("Model: get/set/increment animation time", function() {
				expect(4);
				
				var time1 = 25;
				var time2 = 8;
				var increment = 6;
				var fileName = 'http://me.com/modelFile.o3dtgz';
				var model = new parent.model.Model(fileName);
				
				var config = new parent.model.ModelConfig();
				model.loadConfig(config);
				
				equals(model.getAnimationTime(), 0, "Initial animation time value");
				model.setAnimationTime(time1);
				equals(model.getAnimationTime(), time1, "Set animation time value");
				model.incrementAnimationTime(increment);
				equals(model.getAnimationTime(), time1 + increment, "Increment animation time value");
				model.setAnimationTime(time2);
				equals(model.getAnimationTime(), time2, "Set animation time value");
			});
			
			test("Model: get material", function() {
				expect(2);
				
				var fileName = 'http://me.com/modelFile.o3dtgz';
				var model = new parent.model.Model(fileName);
				
				var materialName1 = 'First Material';
				var materialName2 = 'Second Material';
				
				var config = new parent.model.ModelConfig();
				var material = config.pack.createObject('Material');
				material.name = materialName1;
				
				model.loadConfig(config);
				
				var found1 = model.getMaterial(materialName1);
				var found2 = model.getMaterial(materialName2);
				
				equals(found1, material, "Found added material");
				equals(found2, null, "Did not find unadded material");
			});
			
			test("Model: get shape", function() {
				expect(2);
				
				var fileName = 'http://me.com/modelFile.o3dtgz';
				var model = new parent.model.Model(fileName);
				
				var shapeName1 = 'First Shape';
				var shapeName2 = 'Second Shape';
				var searchName1 = model.name + '.First Shape';
				var searchName2 = model.name + '.Second Shape';
				
				var config = new parent.model.ModelConfig();
				var shape = config.pack.createObject('Shape');
				shape.name = shapeName1;
				
				model.loadConfig(config);
				
				var found1 = model.getShape(searchName1);
				var found2 = model.getShape(searchName2);
				
				equals(found1, shape, "Found added shape");
				equals(found2, null, "Did not find unadded shape");
			});
			
			test("Model: get transform", function() {
				expect(2);
				
				var fileName = 'http://me.com/modelFile.o3dtgz';
				var model = new parent.model.Model(fileName);
				
				var transformName1 = 'First Transform';
				var transformName2 = 'Second Transform';
				
				var config = new parent.model.ModelConfig();
				var transform = config.pack.createObject('Transform');
				transform.name = transformName1;
				
				model.loadConfig(config);
				
				var found1 = model.getTransform(transformName1);
				var found2 = model.getTransform(transformName2);
				
				equals(found1, transform, "Found added transform");
				equals(found2, null, "Did not find unadded transform");
			});
			
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
