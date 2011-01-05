var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.transforms.keyframeTransform');
	
	parent.test = parent.test || {};
	
	var testStartFrame;
	var testEndFrame;
	var firstTime;
	var secondTime;
	var thirdTime;
	var fourthTime;
	
	var TestAnimationTime = function (value) {
		this.value = value;
	};
	
	var UnitTest = {
		runTests: function() {
			testStartFrame = 0;
			testEndFrame = 48;
			firstTime = 0;
			secondTime = 0.4;
			thirdTime = 1.2;
			fourthTime = 2;
	
			module("transforms");
			
			test("KeyFrameTransformConfig: constructor", function() {
				expect(3);
				
				var config = new parent.transforms.KeyFrameTransformConfig();
				
				equals(config.model, null, "Initial model");
				equals(config.startFrame, 0, "Initial start frame");
				equals(config.endFrame, 0, "Initial end frame");
			});
			
			test("KeyFrameTransform: constructor", function() {
				expect(6);
				
				var startFrame = testStartFrame;
				var endFrame = testEndFrame;
				var startTime = parent.view.getTimeOfFrame(startFrame);
				var endTime = parent.view.getTimeOfFrame(endFrame);
				var model = new parent.model.Model('');
				var transformType = parent.transforms.TransformType.KeyFrame;
				
				var config = new parent.transforms.KeyFrameTransformConfig();
				config.model = model;
				config.startFrame = startFrame;
				config.endFrame = endFrame;
				
				var keyframe = new parent.transforms.KeyFrameTransform(config);
				
				same(keyframe.config, config, "Initial configuration");
				equals(keyframe.transformType, transformType, "Initial transform type");
				equals(keyframe.startTime, startTime, "Initial start time");
				equals(keyframe.endTime, endTime, "Initial end time");
				equals(keyframe.modelTime, null, "Initial model time");
				equals(keyframe.getId(), null, "Initial id");
			});
			
			test("KeyFrameTransform: to Octane", function() {
				expect(4);
				
				var startFrame = testStartFrame;
				var endFrame = testEndFrame;
				var modelId = 124;
				var model = new parent.model.Model('');
				model.setId(modelId);
				var transformType = parent.transforms.TransformType.KeyFrame;
				
				var config = new parent.transforms.KeyFrameTransformConfig();
				config.model = model;
				config.startFrame = startFrame;
				config.endFrame = endFrame;
				
				var keyframe = new parent.transforms.KeyFrameTransform(config);
				var octane = keyframe.toOctane();
				
				equals(octane.tt, transformType, "Transform type exported to Octane");
				equals(octane.mi, modelId, "Model id exported to Octane");
				equals(octane.sf, startFrame, "Start frame exported to Octane");
				equals(octane.ef, endFrame, "End frame exported to Octane");
			});
			
			test("KeyFrameTransform: verifyTarget", function() {
				expect(2);
				
				var startFrame = testStartFrame;
				var endFrame = testEndFrame;
				var startTime = parent.view.getTimeOfFrame(startFrame);
				var model = new parent.model.Model('');
				var modelTime = new TestAnimationTime(startTime);
				model.config = {animationTime: modelTime};
				
				var config = new parent.transforms.KeyFrameTransformConfig();
				config.model = model;
				config.startFrame = startFrame;
				config.endFrame = endFrame;
				
				var keyframe = new parent.transforms.KeyFrameTransform(config);
				
				equals(keyframe.modelTime, null, "Initial model time");
				keyframe.verifyTarget();
				equals(keyframe.modelTime, modelTime, "Verified model time");
			});
			
			test("KeyFrameTransform: fireEvent", function() {
				expect(2);
				
				var startFrame = testStartFrame;
				var endFrame = testEndFrame;
				var startTime = parent.view.getTimeOfFrame(startFrame);
				var endTime = parent.view.getTimeOfFrame(endFrame);
				var model = new parent.model.Model('');
				var modelTime = new TestAnimationTime(startTime);
				model.config = {animationTime: modelTime};
				
				var config = new parent.transforms.KeyFrameTransformConfig();
				config.model = model;
				config.startFrame = startFrame;
				config.endFrame = endFrame;
				
				var keyframe = new parent.transforms.KeyFrameTransform(config);
				
				equals(modelTime.value, startTime, "Initial value");
				keyframe.fireEvent();
				equals(modelTime.value, endTime, "Model time value is set");
			});
			
			test("KeyFrameTransform: setProgress", function() {
				expect(7);
				
				var startFrame = testStartFrame;
				var endFrame = testEndFrame;
				var startTime = parent.view.getTimeOfFrame(startFrame);
				var model = new parent.model.Model('');
				var modelTime = new TestAnimationTime(startTime);
				model.config = {animationTime: modelTime};
				
				var config = new parent.transforms.KeyFrameTransformConfig();
				config.model = model;
				config.startFrame = startFrame;
				config.endFrame = endFrame;
				
				var keyframe = new parent.transforms.KeyFrameTransform(config);
				
				equals(keyframe.modelTime, null, "Initial model time");
				keyframe.setProgress(0);
				equals(keyframe.modelTime, modelTime, "Model time after progress");
				ok(Math.abs(keyframe.modelTime.value - firstTime) < 0.001, "Time for 0 progress");
				keyframe.setProgress(0.2);
				ok(Math.abs(keyframe.modelTime.value - secondTime) < 0.001, "Time for 0.2 progress");
				keyframe.setProgress(0.6);
				ok(Math.abs(keyframe.modelTime.value - thirdTime) < 0.001, "Time for 0.6 progress");
				keyframe.setProgress(1);
				ok(Math.abs(keyframe.modelTime.value - fourthTime) < 0.001, "Time for completed progress");
				equals(keyframe.modelTime, modelTime, "Model time after completion");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
