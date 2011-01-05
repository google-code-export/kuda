var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.tools.htmlWidget');
    o3djs.require('hemi.tools.toolbarWidget');
	o3djs.require('hemi.tools.blowerDoorView');
	
	parent.test = parent.test || {};
	
	var contentAsset = 'assets/tools/blowerDoorDisplay.htm';
	var knobAsset = 'blowerDoorKnob';
	
	var UnitTest = {
		runTests: function() {
			module("blowerdoor");
			
			asyncTest("BlowerDoorWidget: constructor", function() {
				var config = new parent.tools.BlowerDoorWidgetConfig();
				config.contentFileName = contentAsset;
				config.blowerDoorKnobId = knobAsset;
				
				var view = new parent.tools.BlowerDoorWidget(config, function() {
					// finished loading
					ok(view.knob != null, "Knob isn't null");
					start();
				});
				
				view.loadConfig();
			});
			
			asyncTest("BlowerDoorWidget: rotateKnob", function() {
				var config = new parent.tools.BlowerDoorWidgetConfig();
				config.contentFileName = contentAsset;
				config.blowerDoorKnobId = knobAsset;
				
				var view = new parent.tools.BlowerDoorWidget(config, function() {
					// finished loading
					view.canvasKnob = {
						rotateVal: 0,
						rotateAnimation: function(value) {
							this.rotateVal = value;
						}
					};
					var val = 124;
					
					view.rotateKnob(val);
					
					equals(view.canvasKnob.rotateVal, val, "Rotation value");
					start();
				});
                
                view.loadConfig();
			});
			
			asyncTest("BlowerDoorWidget: notify", function() {
				var config = new parent.tools.BlowerDoorWidgetConfig();
				config.contentFileName = contentAsset;
				config.blowerDoorKnobId = knobAsset;
				
				var view = new parent.tools.BlowerDoorWidget(config, function() {
					// finished loading
					view.canvasKnob = {
						rotateVal: 0,
						rotateAnimation: function(value) {
							this.rotateVal = value;
						}
					};
					var val = 124;
					
					view.notify(parent.tools.ToolEventType.Visible, true);
					view.notify(parent.tools.ToolEventType.BlowerDoorSpeedChanged, val);
					equals(view.visible, true, "visible notification");
					equals(view.canvasKnob.rotateVal, val, "speed change notification");
					start();
				});
                
                view.loadConfig();
			});
			
			asyncTest("BlowerDoorWidget: toOctane", function() {
                var config = new parent.tools.BlowerDoorWidgetConfig();
                config.contentFileName = contentAsset;
                config.blowerDoorKnobId = knobAsset;
                
                var view = new parent.tools.BlowerDoorWidget(config, function() {
                    // finished loading
					view.setId(3000);
					var octane = view.toOctane();
					
                    equals(octane.wi, view.getId(), "World id octaned");
                    equals(octane.cf, config.contentFileName, "Content file name octaned");
					equals(octane.ki, config.blowerDoorKnobId, "Knob id octaned");
                    start();
                });
                
                view.loadConfig();
			});
			
			// TODO: need to test the callback functionality
			asyncTest("BlowerDoorWidget: load callbacks", function() {
                var config = new parent.tools.BlowerDoorWidgetConfig();
                config.contentFileName = contentAsset;
                config.blowerDoorKnobId = knobAsset;
				var method1 = function() {
                };
				var method2 = function() {
					
				};
				var method3 = function() {
                    equals(view.callbacks.length, 3, "Has 3 callbacks");
					start();
				};
                
                var view = new parent.tools.BlowerDoorWidget(config);
				view.addLoadCallback(method1);
                view.addLoadCallback(method2);
                view.addLoadCallback(method3);
				
				view.loadConfig();
			});
			
			test("BlowerDoorToolbarWidget: constructor", function() {
                var config = new parent.tools.BlowerDoorToolbarWidgetConfig();
                config.containerId = 'testId';
                config.buttonId = 'testButtonId';
                var widget = new parent.tools.BlowerDoorToolbarWidget(config);
                
                equals(widget.config.containerId, config.containerId, "Container id is the same");
                ok(widget.container != null, "Container isn't null");
                ok(widget.button != null, "Button is not null");
                equals(widget.container.attr("id"), config.containerId, "Container id is the same as element id");
                equals(widget.button.attr("id"), config.buttonId, "Button id same as element id");
			});
			
            test("BlowerDoorToolbarWidget: toOctane", function() {
                var config = new parent.tools.BlowerDoorToolbarWidgetConfig();
                config.containerId = 'testId';
                config.buttonId = 'testButtonId';
                var widget = new parent.tools.BlowerDoorToolbarWidget(config);
                
                var octane = widget.toOctane();
                
                equals(octane.ci, config.containerId, "Octane container id is the same");
                equals(octane.bi, config.buttonId, "Octane button id is the same");
            });
			
            test("BlowerDoorToolbarWidget: layoutWidget", function() {
                var config = new parent.tools.BlowerDoorToolbarWidgetConfig();
                config.containerId = 'testId';
				config.buttonId = 'testButtonId';
                var widget = new parent.tools.BlowerDoorToolbarWidget(config);
                
                ok(widget.button != null, "Button is not null");
				equals(widget.button.attr("id"), config.buttonId, "Button id same as element id");
            });
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
