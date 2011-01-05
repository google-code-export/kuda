var hemi = (function(parent, jQuery) {

	parent.test = parent.test || {};
	parent.test.world = parent.test.world || {};
	
	o3djs.require('hemi.world');
	
	var UnitTest = {
		name: 'world',
		runTests: function() {
			module(this.name);
			
			test("World: default constructor", function() {
				expect(12);

				var world = new parent.world.World();
				
				equals(world.nextId, 1, "Next world Id is 1");
				same(world.models, [], "Models list is empty");
				same(world.animations, [], "Animations list is empty");
				same(world.viewpoints, [], "Viewpoints list is empty");
				same(world.engines, [], "Engines list is empty");
				same(world.hudElements, [], "HUD elements list is empty");
				same(world.manips, [], "Manips list is empty");
				same(world.motions, [], "Motions list is empty");
				ok(world.toolBox != null, "Toolbox is initialized");
				equals(world.pickGrabber, null, "Pick grabber initializes to null");
				equals(world.camera, null, "Camera initializes to null");
				ok(world.loader != null, "Loader is initialized");
			});
			
			test("World: to Octane", function() {
				expect(0);
			});
			
			test("World: add/remove/get scene", function() {
				expect(11);
			
				var world = new parent.world.World();
				var scene = new parent.scene.Scene();
				var scene2 = new parent.scene.Scene();
				var scene3 = new parent.scene.Scene();
				
				world.addScene(scene);
				equals(scene.getId(), 1, "Scene world id set");
				ok(world.scenes.indexOf(scene) != -1, "Scene should exist in world scenes list");
				
				// get existing scene
				var s = world.getScene(0);
				equals(s, scene, "Returned scene is the same as one given");
				
				// get nonexistent scene
				s = world.getScene(2);
				equals(s, null, "Returned scene should be null");
				
				// add a few more scenes to test scene removal
				world.addScene(scene2);
				world.addScene(scene3);
				
				// pop a scene from the top
				world.removeScene(scene);
				equals(scene2.getId(), 2, "Scene2 worldId");
				equals(scene3.getId(), 3, "Scene3 worldId");
				ok(world.scenes.indexOf(scene) == -1, "Scene should not exist in world scenes list");
				
				// pop another scene with world.currentScene set to that scene
				world.currentScene = scene2;
				scene2.isLoaded = true;
				world.removeScene(scene2);
				ok(world.scenes.indexOf(scene2) == -1, "Scene2 should not exist in world scenes list");
				equals(world.currentScene, scene3, "Current scene should now be scene3");
				ok(!scene2.isLoaded, "Scene 2 should be unloaded");
				ok(scene3.isLoaded, "Scene 3 should be loaded");
			});
			
			test("World: next/previous/moveTo/reload scene", function() {
				expect(19);
				
				var world = new parent.world.World();
				var scene1 = new parent.scene.Scene();
				var scene2 = new parent.scene.Scene();
				var scene3 = new parent.scene.Scene();
				
				var animTime1 = 200;
				var animTime2 = 220;
				var animTime3 = 1000;
				
				var modelId = 1;
				var model = createModel(modelId);
				
				scene1.setModelTime(0, animTime1);
				scene2.setModelTime(0, animTime2);
				scene3.setModelTime(0, animTime3);
				
				world.addModel(model);
				world.addScene(scene1);
				world.addScene(scene2);
				world.addScene(scene3);
				
				world.nextScene();
				equals(world.currentScene, scene1, "Current scene should be the first scene");
				ok(scene1.isLoaded, "Scene 1 should be loaded");
				equals(model.animTime, scene1.getModelTime(0), "Model animation time should be set correctly");
				
				world.nextScene();
				equals(world.currentScene, scene2, "Current scene should be the second scene");
				ok(scene2.isLoaded, "Scene 2 should be loaded");
				ok(!scene1.isLoaded, "Scene 1 should be unloaded");
				equals(model.animTime, scene2.getModelTime(0), "Model animation time should be set correctly");
				
				world.previousScene();
				equals(world.currentScene, scene1, "Current scene should be the first scene");
				ok(scene1.isLoaded, "Scene 1 should be loaded");
				ok(!scene2.isLoaded, "Scene 2 should be unloaded");
				equals(model.animTime, scene1.getModelTime(0), "Model animation time should be set correctly");
				
				world.currentScene = null;
				scene1.isLoaded = false;
				world.previousScene();
				equals(world.currentScene, scene1, "Current scene should be the first scene");
				ok(scene1.isLoaded, "Scene 1 should be loaded");
				
				// move to scene 3
				world.moveToScene(2);
				equals(world.currentScene, scene3, "Current scene should be the last scene");
				ok(scene3.isLoaded, "Scene 3 should be loaded");
				ok(!scene1.isLoaded, "Scene 1 should be unloaded");
				equals(model.animTime, scene3.getModelTime(0), "Model animation time should be set correctly");
				
				model.animTime = 3433403;
				world.reloadCurrentScene();
				ok(scene3.isLoaded, "Scene 3 should be loaded");
				equals(model.animTime, scene3.getModelTime(0), "Model animation time should be set correctly");
			});
			
			test("World: add/remove/get model", function() {
				expect(4);
				
				var world = new parent.world.World();
				var model1Id = 1;
				var model2Id = 2;
				var model3Id = 3;
				var model1 = createModel(model1Id);
				var model2 = createModel(model2Id);
				var model3 = createModel(model3Id);
				
                world.addModel(model1);
				equals(model1.getId(), model1Id, "Model 1 world id set");
				ok(world.models.indexOf(model1) != -1, "Model 1 should exist in world models list");
				
				// get existing model
				var m = world.getModel(0);
				equals(m, model1, "Returned model is the same as one given");
				
				// get nonexistent model
				m = world.getModel(1);
				equals(m, null, "Returned model should be null");
				
			});
			
			function createModel(id) {
				model = {
					animTime: -1,
					getId: function() {
						return id;
					},
					setAnimationTime: function(time) {
						this.animTime = time;
					}
				};
				
				return model;
			}
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
