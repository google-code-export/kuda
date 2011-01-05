var hemi = (function(parent, jQuery) {

	parent.test = parent.test || {};
	
	o3djs.require('hemi.octane.loader');
	
	// Update this to keep up with the value in world.js
	var octaneVersion = 1.2;
	
	// World scripting variables
	var nextId = 0;
	// Model
	var modelFileName = 'assets/farmhouse.o3dtgz';
	var modelName = 'farmhouse';
	var modelNdx = 0;
	var modelId = nextId++;
	// Scene
	var scene1Title = "Scene 1 Title";
	var scene1Content = "Scene 1 Content";
	var scene1Ndx = 0;
	var scene1Id = nextId++;
	var scene2Title = "Scene 2 Title";
	var scene2Content = "Scene 2 Content";
	var scene2Ndx = 1;
	var scene2Id = nextId++;
	var sceneModelTime1 = 10;
	var sceneModelTime2 = 37;
	// Location
	var engine1Id = nextId++;
	var location1Volume = 800;
	var location1RefreshTime = 2.2;
	var location1Ndx = 0;
	var location1Id = nextId++;
	var location2Volume = -1;
	var location2RefreshTime = 0.5;
	var location2Ndx = 1;
	var location2Id = nextId++;
	var portal1Area = 40;
	var portal1Ndx = 0;
	var portal1Id = nextId++;
	// Events
	var numberOfEvents = 11;
	// Effect
	var defaultFunctionId = null;
	var defaultAccFactor = [0, 0, 0];
	var defaultSizeFactor = 1.0;
	var effect1State = o3djs.particles.ParticleStateIds.BLEND;
	var effect1ColorRamp = [1, 2, 3, 4, 5, 6, 7, 8];
	var effect1Params = {
		numParticles: 10,
		lifeTime: 1.4,
		startSize: 2,
		endSize: 44,
		position: [2, 4, 6],
		velocity: [0, -3, 10],
		spinSpeedRange: 2
	};
	var effect1Ndx = 0;
	var effect1Id = nextId++;
	var effect2State = o3djs.particles.ParticleStateIds.BLEND;
	var effect2ColorRamp = [0.1, -0.1, 1.2, -1.2, 2.3, -2.3, 3.4, -3.4];
	var effect2Params = {
		numParticles: 45,
		lifeTime: 0.6,
		startSize: 0.8,
		endSize: 38,
		position: [9, 7.5, 3],
		velocity: [1, -1, 2.1],
		spinSpeedRange: 6
	};
	var effect2FunctionId = parent.effect.ParticleFunctionId.Puff;
	var effect2AccFactor = [-1.0, 0.5, 2];
	var effect2SizeFactor = 3.4;
	var effect2Ndx = 1;
	var effect2Id = nextId++;
	var effect3FireInterval = 1.8;
	var effect3State = o3djs.particles.ParticleStateIds.BLEND;
	var effect3ColorRamp = [0, 0, 0, 0.5, 0, 0, 0, 0];
	var effect3Params = {
		numParticles: 2,
		lifeTime: 2,
		startSize: 10,
		endSize: 100,
		position: [0, 0, 0],
		velocity: [0, 0, 100],
		spinSpeedRange: 4
	};
	var effect3FunctionId = parent.effect.ParticleFunctionId.Acceleration;
	var effect3AccFactor = [3.4, 22, -7.23];
	var effect3SizeFactor = 30.6;
	var effect3Ndx = 2;
	var effect3Id = nextId++;
	// Animation
	var loop1StartTime = 0;
	var loop1StopTime = 10;
	var loop1Iterations = 5;
	var loop2StartTime = 3;
	var loop2StopTime = 7;
	var loop2Iterations = 1;
	var anim1BeginTime = 0;
	var anim1EndTime = 1000;
	var anim1Ndx = 3;
	var anim1Id = nextId++;
	var anim2BeginTime = 0.0;
	var anim2EndTime = effect3FireInterval;
	var anim2Ndx = 4;
	var anim2Id = nextId++;
	// Transforms
	var trans1TransType = parent.transforms.TransformType.Display;
	var trans1DisplayType = parent.transforms.DisplayType.Hide;
	var trans1TransName = 'Transform 1 Name';
	var trans1Ndx = 5;
	var trans1Id = nextId++;
	var trans2TransType = parent.transforms.TransformType.Display;
	var trans2DisplayType = parent.transforms.DisplayType.HideWithPick;
	var trans2TransName = 'Transform 2 Name';
	var trans2Ndx = 6;
	var trans2Id = nextId++;
	var trans3TransType = parent.transforms.TransformType.Display;
	var trans3DisplayType = parent.transforms.DisplayType.Show;
	var trans3TransName = 'Transform 3 Name';
	var trans3Ndx = 7;
	var trans3Id = nextId++;
	var trans4TransType = parent.transforms.TransformType.Material;
	var trans4MaterialName = 'Transform 4 Material';
	var trans4ParameterName = parent.transforms.MaterialParameter.Ambient;
	var trans4ParameterValue = [0.8, 0.1, 1, 1];
	var trans4Ndx = 8;
	var trans4Id = nextId++;
	var trans5TransType = parent.transforms.TransformType.KeyFrame;
	var trans5StartFrame = 24;
	var trans5EndFrame = 72;
	var trans5Ndx = 9;
	var trans5Id = nextId++;
	// Trigger
	var trigger1FireEvent = false;
	var trigger1Active = false;
	var trigger1Key = 'a';
	var trigger1Ndx = 0;
	var trigger1Id = nextId++;
	var trigger2FireEvent = false;
	var trigger2Active = true;
	var trigger2Key = 'Shape name';
	var trigger2Ndx = 1;
	var trigger2Id = nextId++;
	var trigger3FireEvent = true;
	var trigger3Active = false;
	var trigger3Key = 135;
	var trigger3Ndx = 2;
	var trigger3Id = nextId++;
	var trigger4FireEvent = true;
	var trigger4Active = true;
	var trigger4Key = true;
	var trigger4Ndx = 3;
	var trigger4Id = nextId++;
	var trigger5FireEvent = true;
	var trigger5Active = true;
	var trigger5Key = true;
	var trigger5Ndx = 4;
	var trigger5Id = nextId++;
	var activator1Flag = true;
	var activator1Ndx = 10;
	var activator1Id = nextId++;
	var activator2Flag = false;
	var activator2Ndx = 11;
	var activator2Id = nextId++;
	// View
	var cameraPan = 4;
	var cameraTilt = 0.5;
	var cameraDistance = 10;
	var cameraAngleSteps = 14;
	var cameraMaxTilt = Math.PI / 4;
	var cameraMinTilt = -Math.PI / 4;
	var cameraUp = [0, 12, 0];
	var cameraEye = [10, 10, 10];
	var cameraTarget = [50, 20, 10];
	var cameraLensAngle = 10;
	var cameraYFactor = 2;
	var cameraNearPlane = 20;
	var cameraFarPlane = 5000;
	var cameraEnableControl = true;
	var viewpoint1Name = "Viewpoint 1 Name";
	var viewpoint1Eye = [0, 0, 24];
	var viewpoint1Target = [0, 2, 2];
	var viewpoint1Up = [1, 0, 0];
	var viewpoint1FieldOfView = 33;
	var viewpoint1NearPlane = 0.2;
	var viewpoint1FarPlane = 280;
	var viewpoint1Id = nextId++;
	var cameraMove1Ndx = 12;
	var cameraMove1Id = nextId++;
	// Tools
	var manWidget1RD = parent.tools.ManometerDisplayMode.Flow;
	var manWidget1Id = nextId++;
	var manometer1Id = nextId++;
	var tube1InputId = parent.tools.InputId.UpperLeft;
	var tube1Id = nextId++;
	var upWidget1Visible = false;
	var upWidget1Ndx = 13;
	var upWidget1Id = nextId++;
	var upTool1Enable = false;
	var upTool1Visible = true;
	var upTool1Ndx = 14;
	var upTool1Id = nextId++;
	var upTube1Value = 1000;
	var upTube1Ndx = 15;
	var upTube1Id = nextId++;
	var blowerDoorId = nextId++;
	var blowerDoorViewId = nextId++;
	var blowerDoorControllerId = nextId++;
	var blowerDoorContentFileName = 'assets/tools/blowerDoorDisplay.htm';
	var blowerDoorKnobId = 'blowerDoorKnob';
	var blowerDoorMax = 200;
	var blowerDoorMin = 20;
	
	var UnitTest = {
		runTests: function() {
			module("loader");
			/*
			 asyncTest("Version 1.0", function(){
			 expect(155);
			 
			 $.get('assets/1_0.json', function(data){
			 var json = JSON.decode(data);
			 var world = parent.world.loadWorld(json, function() {
			 
			 });
			 
			 runTestsFor_1_0(world);
			 start();
			 });
			 });
			 
			 asyncTest("Version 1.1", function(){
			 expect(182);
			 
			 $.get('assets/1_1.json', function(data){
			 // Redefine necessary variables for 1.1
			 numberOfEvents = 12;
			 activator1Id = 9;
			 activator2Id = 10;
			 cameraMove1Id = 11;
			 
			 var json = JSON.decode(data);
			 var world = parent.world.loadWorld(json, function() {
			 
			 });
			 
			 runTestsFor_1_0(world);
			 runTestsFor_1_1(world);
			 start();
			 });
			 });
			 */
			asyncTest("Version 1.2", function() {
				expect(231);
				
				$.get('assets/1_2.json', function(data){
					// Redefine necessary variables for 1.2
					numberOfEvents = 16;
					//activator1Id = 10;
					//activator2Id = 11;
					//cameraMove1Id = 12;
					
					var json = JSON.decode(data);
					var world = parent.world.loadWorld(json, function() {
					
					});
					
					runTestsFor_1_0(world);
					runTestsFor_1_1(world);
					runTestsFor_1_2(world);
					start();
				});
			});
		}
	};
	
	var runTestsFor_1_0 = function(world) {
		// Models
		equals(world.getNumberOfModels(), 1, "Number of models in the World");
		var model = world.getModel(modelNdx);
		equals(model.fileName, modelFileName, "Model file name");
		equals(model.name, modelName, "Model name");
		same(model.config, null, "Model config");
		equals(model.shapes.length, 0, "Model shapes array");
		equals(model.transforms.length, 0, "Model transforms array");
		equals(model.animateListeners.length, 0, "Model animate listeners array");
		equals(model.isAnimating, false, "Model animating state");
		equals(model.getId(), modelId, "Model id");
		// Scenes
		equals(world.getNumberOfScenes(), 2, "Number of scenes in the World");
		var scene1 = world.getScene(scene1Ndx);
		equals(scene1.title, scene1Title, "Scene title");
		equals(scene1.content, scene1Content, "Scene content");
		equals(scene1.getId(), scene1Id, "Scene id");
		equals(scene1.modelTimes.length, 0, "Scene model times");
		var scene2 = world.getScene(scene2Ndx);
		equals(scene2.title, scene2Title, "Scene title");
		equals(scene2.content, scene2Content, "Scene content");
		equals(scene2.getId(), scene2Id, "Scene id");
		equals(scene2.modelTimes.length, 2, "Scene model times");
		equals(scene2.getModelTime(0), sceneModelTime1, "Scene model time value");
		equals(scene2.getModelTime(1), sceneModelTime2, "Scene model time value");
		// Events
		equals(world.getNumberOfEvents(), numberOfEvents, "Number of events in the World");
		// Effect events
		var effect1 = world.getEvent(effect1Ndx);
		equals(effect1.effectType, parent.effect.EffectType.ParticleEmitter, "Effect type");
		equals(effect1.state, effect1State, "Effect state");
		same(effect1.colorRamp, effect1ColorRamp, "Effect color ramp");
		same(effect1.params, effect1Params, "Effect parameters");
		equals(effect1.isAnimating, false, "Effect animating state");
		equals(effect1.getId(), effect1Id, "Effect id");
		equals(effect1.functionSpecs.functionId, defaultFunctionId, "Effect function specs id");
		same(effect1.functionSpecs.accFactor, defaultAccFactor, "Effect function specs acceleration factor");
		same(effect1.functionSpecs.sizeFactor, defaultSizeFactor, "Effect function specs size factor");
		var effect2 = world.getEvent(effect2Ndx);
		equals(effect2.effectType, parent.effect.EffectType.ParticlePuff, "Effect type");
		equals(effect2.state, effect2State, "Effect state");
		same(effect2.colorRamp, effect2ColorRamp, "Effect color ramp");
		same(effect2.params, effect2Params, "Effect parameters");
		equals(effect2.isAnimating, false, "Effect animating state");
		equals(effect2.getId(), effect2Id, "Effect id");
		equals(effect2.functionSpecs.functionId, effect2FunctionId, "Effect function specs id");
		same(effect2.functionSpecs.accFactor, effect2AccFactor, "Effect function specs acceleration factor");
		same(effect2.functionSpecs.sizeFactor, effect2SizeFactor, "Effect function specs size factor");
		var effect3 = world.getEvent(effect3Ndx);
		equals(effect3.effectType, parent.effect.EffectType.ParticleTrail, "Effect type");
		equals(effect3.state, effect3State, "Effect state");
		same(effect3.colorRamp, effect3ColorRamp, "Effect color ramp");
		same(effect3.params, effect3Params, "Effect parameters");
		equals(effect3.isAnimating, false, "Effect animating state");
		equals(effect3.getId(), effect3Id, "Effect id");
		equals(effect3.functionSpecs.functionId, effect3FunctionId, "Effect function specs id");
		same(effect3.functionSpecs.accFactor, effect3AccFactor, "Effect function specs acceleration factor");
		same(effect3.functionSpecs.sizeFactor, effect3SizeFactor, "Effect function specs size factor");
		equals(effect3.fireInterval, effect3FireInterval, "Effect fire interval");
		// Animation events
		var animation1 = world.getEvent(anim1Ndx);
		equals(animation1.animationType, parent.animation.AnimationType.Model, "Animation type");
		equals(animation1.target, model, "Animation target");
		equals(animation1.beginTime, anim1BeginTime, "Animation begin time");
		equals(animation1.endTime, anim1EndTime, "Animation end time");
		equals(animation1.currentTime, anim1BeginTime, "Animation current time");
		equals(animation1.getId(), anim1Id, "Animation id");
		equals(animation1.loops.length, 2, "Animation loops");
		equals(animation1.loops[0].startTime, loop1StartTime, "Animation loop start time");
		equals(animation1.loops[0].stopTime, loop1StopTime, "Animation loop stop time");
		equals(animation1.loops[0].iterations, loop1Iterations, "Animation loop iterations");
		equals(animation1.loops[0].current, 0, "Animation loop current time");
		equals(animation1.loops[1].startTime, loop2StartTime, "Animation loop start time");
		equals(animation1.loops[1].stopTime, loop2StopTime, "Animation loop stop time");
		equals(animation1.loops[1].iterations, loop2Iterations, "Animation loop iterations");
		equals(animation1.loops[1].current, 0, "Animation loop current time");
		var animation2 = world.getEvent(anim2Ndx);
		equals(animation2.animationType, parent.animation.AnimationType.Effect, "Animation type");
		equals(animation2.target, effect3, "Animation target");
		equals(animation2.beginTime, anim2BeginTime, "Animation begin time");
		equals(animation2.endTime, anim2EndTime, "Animation end time");
		equals(animation2.currentTime, anim2BeginTime, "Animation current time");
		equals(animation2.getId(), anim2Id, "Animation id");
		equals(animation2.loops.length, 0, "Animation loops");
		// Transform events
		var transform1 = world.getEvent(trans1Ndx);
		equals(transform1.transformType, trans1TransType, "Transform type");
		equals(transform1.config.displayType, trans1DisplayType, "Transform display type");
		equals(transform1.config.transformName, trans1TransName, "Transform transform name");
		equals(transform1.config.model, model, "Transform model");
		equals(transform1.getId(), trans1Id, "Transform id");
		var transform2 = world.getEvent(trans2Ndx);
		equals(transform2.transformType, trans2TransType, "Transform type");
		equals(transform2.config.displayType, trans2DisplayType, "Transform display type");
		equals(transform2.config.transformName, trans2TransName, "Transform transform name");
		equals(transform2.config.model, model, "Transform model");
		equals(transform2.getId(), trans2Id, "Transform id");
		var transform3 = world.getEvent(trans3Ndx);
		equals(transform3.transformType, trans3TransType, "Transform type");
		equals(transform3.config.displayType, trans3DisplayType, "Transform display type");
		equals(transform3.config.transformName, trans3TransName, "Transform transform name");
		equals(transform3.config.model, model, "Transform model");
		equals(transform3.getId(), trans3Id, "Transform id");
		// Triggers
		equals(world.getNumberOfTriggers(), 5, "Number of triggers in the World");
		var trigger1 = world.getTrigger(trigger1Ndx);
		equals(trigger1.triggerConfig.type, parent.trigger.TriggerType.KeyDown, "Trigger type");
		equals(trigger1.triggerConfig.fireEvent, trigger1FireEvent, "Trigger fire event flag");
		equals(trigger1.triggerConfig.active, trigger1Active, "Trigger active flag");
		equals(trigger1.triggerConfig.key, trigger1Key, "Trigger key");
		same(trigger1.triggerConfig.sourceId, null, "Trigger source ID");
		equals(trigger1.active, trigger1Active, "Trigger active state");
		equals(trigger1.getId(), trigger1Id, "Trigger id");
		equals(trigger1.events.length, 0, "Trigger events");
		var trigger2 = world.getTrigger(trigger2Ndx);
		equals(trigger2.triggerConfig.type, parent.trigger.TriggerType.Pick, "Trigger type");
		equals(trigger2.triggerConfig.fireEvent, trigger2FireEvent, "Trigger fire event flag");
		equals(trigger2.triggerConfig.active, trigger2Active, "Trigger active flag");
		equals(trigger2.triggerConfig.key, trigger2Key, "Trigger key");
		same(trigger2.triggerConfig.sourceId, null, "Trigger source ID");
		equals(trigger2.active, trigger2Active, "Trigger active state");
		equals(trigger2.getId(), trigger2Id, "Trigger id");
		equals(trigger2.events.length, 1, "Trigger events");
		equals(trigger2.events[0], animation1, "Trigger event");
		var trigger3 = world.getTrigger(trigger3Ndx);
		equals(trigger3.triggerConfig.type, parent.trigger.TriggerType.Animate, "Trigger type");
		equals(trigger3.triggerConfig.fireEvent, trigger3FireEvent, "Trigger fire event flag");
		equals(trigger3.triggerConfig.active, trigger3Active, "Trigger active flag");
		equals(trigger3.triggerConfig.key, trigger3Key, "Trigger key");
		equals(trigger3.triggerConfig.sourceId, model.getId(), "Trigger source ID");
		equals(trigger3.active, trigger3Active, "Trigger active state");
		equals(trigger3.getId(), trigger3Id, "Trigger id");
		equals(trigger3.events.length, 1, "Trigger events");
		equals(trigger3.events[0], transform1, "Trigger event");
		var trigger4 = world.getTrigger(trigger4Ndx);
		equals(trigger4.triggerConfig.type, parent.trigger.TriggerType.Scene, "Trigger type");
		equals(trigger4.triggerConfig.fireEvent, trigger4FireEvent, "Trigger fire event flag");
		equals(trigger4.triggerConfig.active, trigger4Active, "Trigger active flag");
		equals(trigger4.triggerConfig.key, trigger4Key, "Trigger key");
		equals(trigger4.triggerConfig.sourceId, scene1.getId(), "Trigger source ID");
		equals(trigger4.active, trigger4Active, "Trigger active state");
		equals(trigger4.getId(), trigger4Id, "Trigger id");
		equals(trigger4.events.length, 2, "Trigger events");
		equals(trigger4.events[0], animation1, "Trigger event");
		equals(trigger4.events[1], transform1, "Trigger event");
		var trigger5 = world.getTrigger(trigger5Ndx);
		equals(trigger5.triggerConfig.type, parent.trigger.TriggerType.TimeElapse, "Trigger type");
		equals(trigger5.triggerConfig.fireEvent, trigger5FireEvent, "Trigger fire event flag");
		equals(trigger5.triggerConfig.active, trigger5Active, "Trigger active flag");
		equals(trigger5.triggerConfig.key, trigger5Key, "Trigger key");
		same(trigger5.triggerConfig.sourceId, null, "Trigger source ID");
		equals(trigger5.active, trigger5Active, "Trigger active state");
		equals(trigger5.getId(), trigger5Id, "Trigger id");
		equals(trigger5.events.length, 0, "Trigger events");
		// Activator events
		var activator1 = world.getEvent(activator1Ndx);
		equals(activator1.tgtTrigger, trigger1, "Activator target trigger");
		equals(activator1.activate, activator1Flag, "Activator activate flag");
		equals(activator1.getId(), activator1Id, "Activator id");
		var activator2 = world.getEvent(activator2Ndx);
		equals(activator2.tgtTrigger, trigger2, "Activator target trigger");
		equals(activator2.activate, activator2Flag, "Activator activate flag");
		equals(activator2.getId(), activator2Id, "Activator id");
		// Camera
		var camera = world.camera;
		equals(camera.farPlane, cameraFarPlane, "Camera initial far plane");
		equals(camera.nearPlane, cameraNearPlane, "Camera initial near plane");
		equals(camera.currentFarPlane, cameraFarPlane, "Camera current far plane");
		equals(camera.currentNearPlane, cameraNearPlane, "Camera current near plane");
		equals(camera.lastFarPlane, cameraFarPlane, "Camera last far plane");
		equals(camera.lastNearPlane, cameraNearPlane, "Camera last near plane");
		equals(camera.enableControl, cameraEnableControl, "Camera enable controls");
		// Viewpoints
		equals(world.getNumberOfViewpoints(), 1, "Number of viewpoints in the World");
		var viewpoint1 = world.getViewpoint(0);
		same(viewpoint1.name, viewpoint1Name, "Viewpoint name");
		same(viewpoint1.eye, viewpoint1Eye, "Viewpoint eye vector");
		same(viewpoint1.target, viewpoint1Target, "Viewpoint target vector");
		same(viewpoint1.up, viewpoint1Up, "Viewpoint up vector");
		equals(viewpoint1.fov, viewpoint1FieldOfView, "Viewpoint field of view");
		equals(viewpoint1.fp, viewpoint1FarPlane, "Viewpoint far plane");
		equals(viewpoint1.np, viewpoint1NearPlane, "Viewpoint near plane");
		equals(viewpoint1.getId(), viewpoint1Id, "Viewpoint id");
		// CameraMove events
		var cameraMove1 = world.getEvent(cameraMove1Ndx);
		equals(cameraMove1.camera, camera, "CameraMove camera");
		equals(cameraMove1.viewpoint, viewpoint1, "CameraMove viewpoint");
		equals(cameraMove1.getId(), cameraMove1Id, "CameraMove id");
	};
	
	var runTestsFor_1_1 = function(world) {
		var model = world.getModel(modelNdx);
		
		// Transform events
		var transform4 = world.getEvent(trans4Ndx);
		equals(transform4.transformType, trans4TransType, "Transform type");
		equals(transform4.config.materialName, trans4MaterialName, "Transform material name");
		equals(transform4.config.parameterName, trans4ParameterName, "Transform parameter name");
		same(transform4.config.parameterValue, trans4ParameterValue, "Transform parameter value");
		equals(transform4.config.model, model, "Transform model");
		equals(transform4.getId(), trans4Id, "Transform id");
		// Camera
		var camera = world.camera;
		equals(camera.pan, cameraPan, "Camera initial pan");
		equals(camera.tilt, cameraTilt, "Camera initial tilt");
		equals(camera.currentPan, cameraPan, "Camera current pan");
		equals(camera.currentTilt, cameraTilt, "Camera current tilt");
		equals(camera.distance, cameraDistance, "Camera distance");
		equals(camera.angleSteps, cameraAngleSteps, "Camera angle steps");
		equals(camera.maxTilt, cameraMaxTilt, "Camera max tilt");
		equals(camera.minTilt, cameraMinTilt, "Camera min tilt");
		same(camera.up, cameraUp, "Camera initial up vector");
		same(camera.eye, cameraEye, "Camera initial eye vector");
		same(camera.target, cameraTarget, "Camera initial target vector");
		same(camera.currentUp, cameraUp, "Camera current up vector");
		same(camera.currentEye, cameraEye, "Camera current eye vector");
		same(camera.currentTarget, cameraTarget, "Camera current target vector");
		same(camera.lastUp, cameraUp, "Camera last up vector");
		same(camera.lastEye, cameraEye, "Camera last eye vector");
		same(camera.lastTarget, cameraTarget, "Camera last target vector");
		equals(camera.lensAngle, cameraLensAngle, "Camera initial lens angle");
		equals(camera.currentLensAngle, cameraLensAngle, "Camera current lens angle");
		equals(camera.lastLensAngle, cameraLensAngle, "Camera last lens angle");
		equals(camera.yFactor, cameraYFactor, "Camera y factor");
	};
	
	var runTestsFor_1_2 = function(world) {
		var model = world.getModel(modelNdx);
		var trigger1 = world.getTrigger(trigger1Ndx);
		
		// Location
		var engine = world.getEngine(0);
		equals(engine.getId(), engine1Id, "Engine id");
		var location1 = engine.getLocation(0);
		equals(location1.getVolume(), location1Volume, "Location volume");
		equals(location1.getRefreshTime(), location1RefreshTime, "Location refresh time");
		equals(location1.listeners.length, 1, "Location listener array");
		equals(location1.listeners[0].getId(), tube1Id, "Location listener id");
		equals(location1.getId(), location1Id, "Location id");
		var location2 = engine.getLocation(1);
		equals(location2.getVolume(), location2Volume, "Location volume");
		equals(location2.getRefreshTime(), location2RefreshTime, "Location refresh time");
		equals(location2.listeners.length, 0, "Location listener array");
		equals(location2.getId(), location2Id, "Location id");
		var portal1 = engine.getPortal(0);
		equals(portal1.getLocationA(), location1, "Location A");
		equals(portal1.getLocationB(), location2, "Location B");
		equals(portal1.getArea(), portal1Area, "Portal area");
		equals(portal1.listeners.length, 1, "Portal listener array");
		equals(portal1.listeners[0].getId(), blowerDoorId, "Portal listener id");
		equals(portal1.getId(), portal1Id, "Portal id");
		// Transform events
		var transform5 = world.getEvent(trans5Ndx);
		equals(transform5.transformType, trans5TransType, "Transform type");
		equals(transform5.config.startFrame, trans5StartFrame, "Transform start frame");
		equals(transform5.config.endFrame, trans5EndFrame, "Transform end frame");
		equals(transform5.config.model, model, "Transform model");
		equals(transform5.getId(), trans5Id, "Transform id");
		// Tools
		var manWidget = world.toolBox.getToolView(manWidget1Id);
		equals(manWidget.getId(), manWidget1Id, "Manometer widget id");
		equals(manWidget.config.rightDisplay, manWidget1RD, "Manometer widget right display");
		var manometer = world.toolBox.getTool(manometer1Id);
		var tube = world.toolBox.getTool(tube1Id);
		var blowerDoor = world.toolBox.getTool(blowerDoorId);
		// Tool Views
		var blowerDoorView = world.toolBox.getToolView(blowerDoorViewId);
		// Tool Controllers
		var blowerDoorController = world.toolBox.getToolController(blowerDoorControllerId);
		// Run BaseTool tests!
		equals(manometer.listeners.length, 1, "Tool listener array");
		equals(manometer.listeners[0], manWidget, "Tool listener");
		equals(manometer.triggers.length, 1, "Tool trigger array");
		equals(manometer.triggers[0], trigger1, "Tool trigger");
		equals(manometer.getId(), manometer1Id, "Manometer tool id");
		//TODO: equals(tube.getLocation(), location, "Tube location");
		equals(tube.manometer, manometer, "Tube manometer");
		equals(tube.inputId, tube1InputId, "Tube input id");
		equals(tube.getId(), tube1Id, "Tube id");
		var upWidget1 = world.getEvent(upWidget1Ndx);
		equals(upWidget1.widget, manWidget, "UpdateHtmlWidget event widget");
		equals(upWidget1.visible, upWidget1Visible, "UpdateHtmlWidget event visible flag");
		equals(upWidget1.getId(), upWidget1Id, "UpdateHtmlWidget event id");
		var upTool1 = world.getEvent(upTool1Ndx);
		equals(upTool1.tool, manometer, "UpdateTool event tool");
		equals(upTool1.enable, upTool1Enable, "UpdateTool event enable flag");
		equals(upTool1.visible, upTool1Visible, "UpdateTool event visible flag");
		equals(upTool1.getId(), upTool1Id, "UpdateTool event id");
		var upTube1 = world.getEvent(upTube1Ndx);
		//equals(upTube1.tube, tube, "UpdateManometerTube event tube");
		//TODO: equals(upTube1.location, location, "UpdateManometerTube event location");
		equals(upTube1.value, upTube1Value, "UpdateManometerTube event value");
		equals(upTube1.getId(), upTube1Id, "UpdateManometerTube event id");
		// Blower door tool tests
		equals(blowerDoor.getToLocation(), location2, "BlowerDoor to location");
		equals(blowerDoor.getFromLocation(), location1, "BlowerDoor from location");
		equals(blowerDoor.getId(), blowerDoorId);
		equals(blowerDoorView.getId(), blowerDoorViewId);
		equals(blowerDoorController.getId(), blowerDoorControllerId);
		// test proper hookups
		equals(blowerDoorController.blowerDoorModel.getId(), blowerDoorId);
		equals(blowerDoorController.blowerDoorView.getId(), blowerDoorViewId);
		equals(blowerDoor.listeners[0].getId(), blowerDoorViewId);
	};
	
	// Scripts
	
	var createWorld = function() {
		var config = {
			pan: cameraPan,
			tilt: cameraTilt,
			distance: cameraDistance,
			angleSteps: cameraAngleSteps,
			maxTilt: cameraMaxTilt,
			minTilt: cameraMinTilt,
			up: cameraUp,
			eye: cameraEye,
			target: cameraTarget,
			lensAngle: cameraLensAngle,
			yFactor: cameraYFactor,
			nearPlane: cameraNearPlane,
			farPlane: cameraFarPlane,
			enableControl: cameraEnableControl
		};
		
		var camera = new parent.view.createCamera(config);
		var world = new parent.world.World(camera);
		var model = addModelModule(world);
		var scene = addSceneModule(world);
		var engine = addLocationModule(world);
		var effect = addEffectModule(world);
		var anim = addAnimationModule(world, model, effect);
		var trans = addTransformModule(world, model);
		var trigger = addTriggerModule(world, model, scene, anim, trans);
		addViewModule(world, camera);
		addToolModule(world, trigger, engine);
		
		return world;
	};
	
	var addModelModule = function(world) {
		var fileName = modelFileName;
		var model = new parent.model.Model(fileName);
		
		world.addModel(model);
		
		return model;
	};
	
	var addSceneModule = function(world) {
		var sceneConfig1 = new parent.scene.SceneConfig();
		sceneConfig1.title = scene1Title;
		sceneConfig1.content = scene1Content;
		var scene1 = new parent.scene.Scene(sceneConfig1);
		
		var sceneConfig2 = new parent.scene.SceneConfig();
		sceneConfig2.title = scene2Title;
		sceneConfig2.content = scene2Content;
		var scene2 = new parent.scene.Scene(sceneConfig2);
		scene2.setModelTime(0, sceneModelTime1);
		scene2.setModelTime(1, sceneModelTime2);
		
		world.addScene(scene1);
		world.addScene(scene2);
		
		return scene1;
	};
	
	var addLocationModule = function(world) {
		var engine = new parent.location.PressureEngine(world);
		world.addEngine(engine);
		
		var volume = 800;
		var refreshTime = 2.2;
		var location1 = new parent.location.Location();
		location1.setVolume(location1Volume);
		location1.setRefreshTime(location1RefreshTime);
		var outside = parent.location.createOutsideLocation();
		
		var area = 40;
		var portal = new parent.location.Portal();
		portal.setLocationA(location1);
		portal.setLocationB(outside);
		portal.setArea(portal1Area);
		
		engine.addLocation(location1);
		engine.addLocation(outside);
		engine.addPortal(portal);
		
		return engine;
	};
	
	var addEffectModule = function(world) {
		var effect1 = parent.effect.Effect.createParticleEmitter(effect1State, effect1ColorRamp, effect1Params);
		
		var specs1 = new parent.effect.ParticleFunctionSpecs();
		specs1.functionId = effect2FunctionId;
		specs1.accFactor = effect2AccFactor;
		specs1.sizeFactor = effect2SizeFactor;
		
		var effect2 = parent.effect.Effect.createParticlePuff(effect2State, effect2ColorRamp, effect2Params, specs1);
		
		var specs2 = new parent.effect.ParticleFunctionSpecs();
		specs2.functionId = effect3FunctionId;
		specs2.accFactor = effect3AccFactor;
		specs2.sizeFactor = effect3SizeFactor;
		
		var effect3 = parent.effect.Effect.createParticleTrail(effect3FireInterval, effect3State, effect3ColorRamp, effect3Params, specs2);
		
		world.addEvent(effect1, parent.world.EventType.Effect);
		world.addEvent(effect2, parent.world.EventType.Effect);
		world.addEvent(effect3, parent.world.EventType.Effect);
		
		return effect3;
	};
	
	var addAnimationModule = function(world, model, effect) {
		var loop1 = new parent.animation.Loop(loop1StartTime, loop1StopTime, loop1Iterations);
		var loop2 = new parent.animation.Loop(loop2StartTime, loop2StopTime, loop2Iterations);
		
		var target1 = model;
		var animation1 = parent.animation.createModelAnimation(target1, anim1BeginTime, anim1EndTime);
		animation1.addLoop(loop1);
		animation1.addLoop(loop2);
		
		var target2 = effect;
		var animation2 = parent.animation.createEffectAnimation(target2);
		
		world.addEvent(animation1, parent.world.EventType.Animation);
		world.addEvent(animation2, parent.world.EventType.Animation);
		
		return animation1;
	};
	
	var addToolModule = function(world, trigger, engine) {
		var location1 = engine.getLocation(0);
		var location2 = engine.getLocation(1);
		var portal1 = engine.getPortal(0);
		
		var toolBox = world.toolBox;
		
		var manConfig = new parent.tools.ManometerWidgetConfig();
		manConfig.rightDisplay = manWidget1RD;
		
		var manWidget = new parent.tools.ManometerWidget(manConfig);
		
		var manometer = new parent.tools.Manometer();
		manometer.addTrigger(trigger);
		manometer.addListener(manWidget);
		
		var tube1 = new parent.tools.ManometerTube(manometer, tube1InputId);
		tube1.setLocation(location1);
		manometer.setInput(tube1);
		
		var upWidget1 = new parent.tools.UpdateHtmlWidgetEvent(manWidget);
		upWidget1.visible = upWidget1Visible;
		
		var upTool1 = new parent.tools.UpdateToolEvent(manometer);
		upTool1.enable = upTool1Enable;
		upTool1.visible = upTool1Visible;
		
		var upTube1 = new parent.tools.UpdateManometerTubeEvent(manometer, tube1);
		upTube1.value = upTube1Value;
		upTube1.setLocation(location2);
		
		toolBox.addToolView(manWidget);
		toolBox.addTool(manometer);
		toolBox.addTool(tube1);
		world.addEvent(upWidget1, parent.world.EventType.UpdateHtmlWidget);
		world.addEvent(upTool1, parent.world.EventType.UpdateTool);
		world.addEvent(upTube1, parent.world.EventType.UpdateManometerTube);
		
		var viewCfg = new parent.tools.BlowerDoorWidgetConfig();
		viewCfg.contentFileName = blowerDoorContentFileName;
		viewCfg.blowerDoorKnobId = blowerDoorKnobId;
		
		var mdlCfg = new parent.tools.BlowerDoorConfig();
		mdlCfg.max = blowerDoorMax;
		mdlCfg.min = blowerDoorMin;
		
		var blowerDoor = new parent.tools.BlowerDoor(mdlCfg);
		var blowerDoorView = new parent.tools.BlowerDoorWidget(viewCfg);		
		blowerDoor.addListener(blowerDoorView);
		var blowerDoorController = new parent.tools.BlowerDoorController();
		blowerDoorController.setModel(blowerDoor);
		blowerDoorController.setView(blowerDoorView);
		
		portal1.addListener(blowerDoor);
		blowerDoor.setToLocation(portal1.getLocationB());
		blowerDoor.setFromLocation(portal1.getLocationA());
		
		toolBox.addTool(blowerDoor);
		toolBox.addToolView(blowerDoorView);
		toolBox.addToolController(blowerDoorController);
	};
	
	var addTransformModule = function(world, model) {
		var config1 = new parent.transforms.DisplayTransformConfig();
		config1.displayType = trans1DisplayType;
		config1.transformName = trans1TransName;
		config1.model = model;
		
		var trans1 = parent.transforms.createDisplayTransform(config1);
		
		var config2 = new parent.transforms.DisplayTransformConfig();
		config2.displayType = trans2DisplayType;
		config2.transformName = trans2TransName;
		config2.model = model;
		
		var trans2 = parent.transforms.createDisplayTransform(config2);
		
		var config3 = new parent.transforms.DisplayTransformConfig();
		config3.displayType = trans3DisplayType;
		config3.transformName = trans3TransName;
		config3.model = model;
		
		var trans3 = parent.transforms.createDisplayTransform(config3);
		
		var config4 = new parent.transforms.MaterialTransformConfig();
		config4.model = model;
		config4.materialName = trans4MaterialName;
		config4.parameterName = trans4ParameterName;
		config4.parameterValue = trans4ParameterValue;
		
		var trans4 = new parent.transforms.MaterialTransform(config4);
		
		var config5 = new parent.transforms.KeyFrameTransformConfig();
		config5.model = model;
		config5.startFrame = trans5StartFrame;
		config5.endFrame = trans5EndFrame;
		
		var trans5 = new parent.transforms.KeyFrameTransform(config5);
		
		world.addEvent(trans1, parent.world.EventType.Transform);
		world.addEvent(trans2, parent.world.EventType.Transform);
		world.addEvent(trans3, parent.world.EventType.Transform);
		world.addEvent(trans4, parent.world.EventType.Transform);
		world.addEvent(trans5, parent.world.EventType.Transform);
		
		return trans1;
	};
	
	var addTriggerModule = function(world, model, scene, event1, event2) {
		var config1 = new parent.trigger.TriggerConfig();
		config1.fireEvent = trigger1FireEvent;
		config1.active = trigger1Active;
		config1.key = trigger1Key;
		
		var trigger1 = parent.trigger.createKeyDownTrigger(config1);
		
		var config2 = new parent.trigger.TriggerConfig();
		config2.fireEvent = trigger2FireEvent;
		config2.active = trigger2Active;
		config2.key = trigger2Key;
		
		var trigger2 = parent.trigger.createPickTrigger(config2);
		trigger2.addEvent(event1);
		
		var config3 = new parent.trigger.TriggerConfig();
		config3.fireEvent = trigger3FireEvent;
		config3.active = trigger3Active;
		config3.key = trigger3Key;
		config3.sourceId = model.getId();
		
		var trigger3 = parent.trigger.createAnimateTrigger(config3);
		trigger3.addEvent(event2);
		
		var config4 = new parent.trigger.TriggerConfig();
		config4.fireEvent = trigger4FireEvent;
		config4.active = trigger4Active;
		config4.key = trigger4Key;
		config4.sourceId = scene.getId();
		
		var trigger4 = parent.trigger.createSceneTrigger(config4);
		trigger4.addEvent(event1);
		trigger4.addEvent(event2);
		
		var config5 = new parent.trigger.TriggerConfig();
		config5.fireEvent = trigger5FireEvent;
		config5.active = trigger5Active;
		config5.key = trigger5Key;
		
		var trigger5 = parent.trigger.createTimeElapseTrigger(config5);
		
		var activator1 = new parent.trigger.Activator(trigger1, activator1Flag);
		var activator2 = new parent.trigger.Activator(trigger2, activator2Flag);
		
		world.addTrigger(trigger1);
		world.addTrigger(trigger2);
		world.addTrigger(trigger3);
		world.addTrigger(trigger4);
		world.addTrigger(trigger5);
		world.addEvent(activator1, parent.world.EventType.Activator);
		world.addEvent(activator2, parent.world.EventType.Activator);
		
		return trigger1;
	};
	
	var addViewModule = function(world, camera) {
		var viewpoint = new parent.view.Viewpoint(viewpoint1Name, viewpoint1Eye, viewpoint1Target, viewpoint1Up, viewpoint1FieldOfView, viewpoint1NearPlane, viewpoint1FarPlane);
		
		var camMove = new parent.view.CameraMove(camera, viewpoint);
		
		world.addViewpoint(viewpoint);
		world.addEvent(camMove, parent.world.EventType.CameraMove);
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
