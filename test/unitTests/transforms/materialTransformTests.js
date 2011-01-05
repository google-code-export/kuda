var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.core');
	o3djs.require('hemi.transforms.materialTransform');
	
	parent.test = parent.test || {};
	
	var testMaterialName;
	var testParameterName;
	var firstMatrix;
	var secondMatrix;
	var thirdMatrix;
	var fourthMatrix;
	
	var TestMaterial = function (parameter) {
		this.name = testMaterialName;
		this.parameter = parameter;
	};

	TestMaterial.prototype = {
		
		getParam: function(paramName) {
			if (paramName == testParameterName) {
				return this.parameter;
			} else {
				return null;
			}
		}
	};
	
	var UnitTest = {
		runTests: function() {
			testMaterialName = 'Test material name';
			testParameterName = parent.transforms.MaterialParameter.Ambient;
			firstMatrix = [0, 1, 2, 3];
			secondMatrix = [0.2, 1.2, 2.2, 2.4];
			thirdMatrix = [0.6, 1.6, 2.6, 1.2];
			fourthMatrix = [1, 2, 3, 0];
	
			module("transforms");
			
			test("MaterialTransformConfig: constructor", function() {
				expect(4);
				
				var config = new parent.transforms.MaterialTransformConfig();
				
				equals(config.model, null, "Initial model");
				equals(config.materialName, null, "Initial material name");
				equals(config.parameterName, null, "Initial parameter name");
				equals(config.parameterValue, null, "Initial parameter value");
			});
			
			test("MaterialTransform: constructor", function() {
				expect(6);
				
				var materialName = testMaterialName;
				var parameterName = testParameterName;
				var parameterValue = fourthMatrix;
				var model = new parent.model.Model('');
				var transformType = parent.transforms.TransformType.Material;
				
				var config = new parent.transforms.MaterialTransformConfig();
				config.model = model;
				config.materialName = materialName;
				config.parameterName = parameterName;
				config.parameterValue = parameterValue;
				
				var material = new parent.transforms.MaterialTransform(config);
				
				same(material.config, config, "Initial configuration");
				equals(material.transformType, transformType, "Initial transform type");
				equals(material.parameter, null, "Initial parameter");
				equals(material.startValue, null, "Parameter start value");
				equals(material.endValue, parameterValue, "Parameter end value");
				equals(material.getId(), null, "Initial id");
			});
			
			test("MaterialTransform: to Octane", function() {
				expect(5);
				
				var materialName = testMaterialName;
				var parameterName = testParameterName;
				var parameterValue = fourthMatrix;
				var modelId = 124;
				var model = new parent.model.Model('');
				model.setId(modelId);
				var transformType = parent.transforms.TransformType.Material;
				
				var config = new parent.transforms.MaterialTransformConfig();
				config.model = model;
				config.materialName = materialName;
				config.parameterName = parameterName;
				config.parameterValue = parameterValue;
				
				var material = new parent.transforms.MaterialTransform(config);
				var octane = material.toOctane();
				
				equals(octane.tt, transformType, "Transform type exported to Octane");
				equals(octane.mi, modelId, "Model id exported to Octane");
				equals(octane.mn, materialName, "Material name exported to Octane");
				equals(octane.pn, parameterName, "Parameter name exported to Octane");
				equals(octane.pv, parameterValue, "Parameter value exported to Octane");
			});
			
			test("MaterialTransform: verifyTarget", function() {
				expect(2);
				
				var materialName = testMaterialName;
				var parameterName = testParameterName;
				var parameterValue = fourthMatrix;
				var model = new parent.model.Model('');
				var parameter = { value: firstMatrix };
				var material = new TestMaterial(parameter);
				model.materials = [material];
				
				var config = new parent.transforms.MaterialTransformConfig();
				config.model = model;
				config.materialName = materialName;
				config.parameterName = parameterName;
				config.parameterValue = parameterValue;
				
				var material = new parent.transforms.MaterialTransform(config);
				
				equals(material.parameter, null, "Initial parameter");
				material.verifyTarget();
				equals(material.parameter, parameter, "Verified parameter");
			});
			
			test("MaterialTransform: fireEvent", function() {
				expect(2);
				
				var materialName = testMaterialName;
				var parameterName = testParameterName;
				var parameterValue = fourthMatrix;
				var model = new parent.model.Model('');
				var parameter = { value: firstMatrix };
				var material = new TestMaterial(parameter);
				model.materials = [material];
				
				var config = new parent.transforms.MaterialTransformConfig();
				config.model = model;
				config.materialName = materialName;
				config.parameterName = parameterName;
				config.parameterValue = parameterValue;
				
				var material = new parent.transforms.MaterialTransform(config);
				
				equals(parameter.value, firstMatrix, "Initial value");
				material.fireEvent();
				equals(parameter.value, parameterValue, "Parameter value is set");
			});
			
			test("MaterialTransform: setProgress", function() {
				expect(10);
				
				var materialName = testMaterialName;
				var parameterName = testParameterName;
				var parameterValue = fourthMatrix;
				var model = new parent.model.Model('');
				var parameter = { value: firstMatrix };
				var material = new TestMaterial(parameter);
				model.materials = [material];
				
				var config = new parent.transforms.MaterialTransformConfig();
				config.model = model;
				config.materialName = materialName;
				config.parameterName = parameterName;
				config.parameterValue = parameterValue;
				
				var material = new parent.transforms.MaterialTransform(config);
				
				equals(material.startValue, null, "Initial start value");
				equals(material.endValue, parameterValue, "Initial end value");
				material.setProgress(0);
				equals(material.startValue, firstMatrix, "Start value after progress");
				equals(material.endValue, parameterValue, "End value after progress");
				ok(parent.core.compareArrays(material.parameter.value, firstMatrix), "Value for 0 progress");
				material.setProgress(0.2);
				ok(parent.core.compareArrays(material.parameter.value, secondMatrix), "Value for 0.2 progress");
				material.setProgress(0.6);
				ok(parent.core.compareArrays(material.parameter.value, thirdMatrix), "Value for 0.6 progress");
				material.setProgress(1);
				ok(parent.core.compareArrays(material.parameter.value, fourthMatrix), "Value for completed progress");
				equals(material.startValue, null, "Start value after completion");
				equals(material.endValue, parameterValue, "End value after completion");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
