var hemi = (function(parent, jQuery) {

    parent.test = parent.test || {};
    parent.test.scene = parent.test.scene || {};
    
    o3djs.require('hemi.scene');
    
    var UnitTest = {
		name: 'scene',
        runTests: function() {
            module(this.name);
            
            test("Scene: constructor", function() {
				expect(4);
				
                // with defaults
				var config = new parent.scene.SceneConfig();
                var scene = new parent.scene.Scene();
                
                equals(scene.title, config.title, "Title is the default");
                equals(scene.content, config.content, "Content is the default");
				
				// with changed config
				config.title = "Test title";
				config.content = "Test content";
				var scene2 = new parent.scene.Scene(config);
                equals(scene2.title, config.title, "Title must be the same as the configuration");
                equals(scene2.content, config.content, "Content must be the same as the configuration");
            });
			
			test("Scene: to Octane", function() {
				expect(0);
			});

			
			test("Scene: set/remove/get modelTime", function() {
				expect(7);
				
                var scene = new parent.scene.Scene();
				var time = 0.5;
				
				scene.setModelTime(0, time);
				equals(scene.modelTimes[0], time, "Set model time should be the same");
				
				var origLen = scene.modelTimes.length;                
                scene.removeModelTime(10);
                equals(scene.modelTimes.length, origLen, "Nothing should be removed from the times list");
				scene.removeModelTime(-1);
                equals(scene.modelTimes.length, origLen, "Nothing should be removed from the times list");
				
				scene.removeModelTime(0);
				equals(scene.modelTimes.length, origLen - 1, "Model times list length decreased by 1");
				
				scene.setModelTime(0, time);
				var theTime = scene.getModelTime(0);
                equals(theTime, time, "Retrieved model time should be the same");
				theTime = scene.getModelTime(1);
				equals(theTime, 0, "Retrieved model time should be default value");
				theTime = scene.getModelTime(-1);
				equals(theTime, null, "Retrieved model time should be null");
			});
        }
    };
    
    parent.test.addUnitTest(UnitTest);
    
    return parent;
})(hemi || {}, jQuery);
