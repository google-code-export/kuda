var hemi = (function(parent, jQuery) {

	parent.test = parent.test || {};
	
    o3djs.require('hemi.tools.baseTool');
	o3djs.require('hemi.tools.blowerDoor');
		
	var UnitTest = {
		runTests: function() {
			module("blowerdoor");
			
			test("BlowerDoor: constructor", function() {
				var config = new parent.tools.BlowerDoorConfig();
				config.max = 20;
				config.min = 3;
				var blowerDoor = new parent.tools.BlowerDoor(config);
				
				equals(blowerDoor.enabled, false, "Initial enabled flag");
				equals(blowerDoor.visible, false, "Initial visible flag");
				equals(blowerDoor.type, parent.tools.ToolType.BlowerDoor, "Initial type");
				equals(blowerDoor.getId(), null, "Initial id");
				equals(blowerDoor.knob, null, "Initial knob value");
				equals(blowerDoor.currentSpeed, 0, "Initial value");
				equals(blowerDoor.currentX, 0, "Initial x coordinate value");
                equals(blowerDoor.max, config.max, "Initial max value");
                equals(blowerDoor.min, config.min, "Initial min value");
			});
			
			test("BlowerDoor: get/set fan speed", function() {
                var blowerDoor = new parent.tools.BlowerDoor();
                var listener = {
                    updatedVal: -1,                 
                    notify: function(eventType, value) {
                        if (eventType == parent.tools.ToolEventType.BlowerDoorSpeedChanged) {
                            this.updatedVal = value;
                        }
                    }
                };
                var val = 124;
                
                blowerDoor.addListener(listener, parent.tools.ToolEventType.BlowerDoorSpeedChanged);
                blowerDoor.setFanSpeed(val);
                equals(blowerDoor.getFanSpeed(), val, "Current value");
                equals(listener.updatedVal, val, "Listener notified");
			});
			
			test("BlowerDoor: toOctane", function() {
				var config = new parent.tools.BlowerDoorConfig();
				config.max = 2000;
				config.min = -20;
                var blowerDoor = new parent.tools.BlowerDoor(config);
                var listener = {
                    updatedVal: -1,   
					octaned: false,              
                    notify: function(eventType, value) {
                        if (eventType == parent.tools.ToolEventType.BlowerDoorSpeedChanged) {
                            this.updatedVal = value;
                        }
                    },
                    getId: function() {
						this.octaned = true;
						return 20;
					}
                };
                var val = 124;
                
                blowerDoor.addListener(listener, parent.tools.ToolEventType.BlowerDoorSpeedChanged);
				
				var octane = blowerDoor.toOctane();
				ok(listener.octaned, "Listener converted to octane");
				equals(octane.li[0], listener.getId(), "Listener id octaned");
				equals(octane.cf.mn, config.min, "Config min octaned");
				equals(octane.cf.mx, config.max, "Config max octaned");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
