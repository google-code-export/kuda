var hemi = (function(parent, jQuery) {
    o3djs.require('hemi.tools.baseTool');
	o3djs.require('hemi.tools.manometer');

	parent.test = parent.test || {};
	
	var ToolListener = function (id) {
		this.worldId = id;
		this.type = null;
		this.value = null;
	};

	ToolListener.prototype = {
		
		getId: function() {
			return this.worldId;
		},
		
		notify: function(eventType, value) {
			this.type = eventType;
			this.value = value;
		}
	};
	
	var ToolTrigger = function (id) {
		this.worldId = id;
		this.active = null;
	};

	ToolTrigger.prototype = {
		
		getId: function() {
			return this.worldId;
		},
		
		activate: function(active) {
			this.active = active;
		}
	};
	
	var Location = function (id) {
		this.id = id;
		this.listener = null;
		this.value = 0;
	};

	Location.prototype = {
		
		getId: function() {
			return this.id;
		},
		
		addListener: function(listener) {
			this.listener = listener;
		},
		
		removeListener: function(listener) {
			if (this.listener == listener) {
				this.listener = null;
			}
		},
		
		setValue: function(value) {
			if (this.listener) {
				this.listener.notify(null, value);
			}
		}
	};
	
	var UnitTest = {
		runTests: function() {
			module("tools");
			
			test("ManometerTube: constructor", function() {
				expect(6);
				
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var location = null;
				var value = 0;
				var toolType = parent.tools.ToolType.ManometerTube;
				
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				
				equals(tube.manometer, manometer, "Initial manometer");
				equals(tube.inputId, inputId, "Initial input id");
				equals(tube.value, value, "Initial value");
				equals(tube.location, location, "Initial location");
				equals(tube.type, toolType, "Initial tool type");
				// Inherited attributes
				equals(manometer.getId(), null, "Initial id");
			});
			
			test("ManometerTube: toOctane", function() {
				expect(5);
				
				var toolId = 89;
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var locationId = 80;
				var location = new Location(locationId);
				var toolType = parent.tools.ToolType.ManometerTube;
				
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				tube.setId(toolId);
				tube.location = location;
				
				var octane = tube.toOctane();
				
				equals(octane.mi, manometer.getId(), "Manometer id exported to Octane");
				equals(octane.ii, inputId, "Input id exported to Octane");
				equals(octane.lo, locationId, "Location id exported to Octane");
				// Inherited attributes
				equals(octane.tt, toolType, "Tool type exported to Octane");
				equals(octane.wi, toolId, "Tool id exported to Octane");
			});
			
			test("ManometerTube: get/set value", function() {
				expect(2);
				
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var value1 = 0;
				var value2 = 100;
				
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				
				equals(tube.getValue(), value1, "Tube value retrieved");
				tube.setValue(value2);
				equals(tube.getValue(), value2, "Tube value set");
			});
			
			test("ManometerTube: get/set location (and notify)", function() {
				expect(5);
				
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var location1Id = 80;
				var location1 = new Location(location1Id);
				var location2Id = 62;
				var location2 = new Location(location2Id);
				var value1 = 0;
				var value2 = 33;
				var value3 = 44;
				var tubeId = 13;
				
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				
				location1.setValue(value2);
				location2.setValue(value3);
				equals(tube.getValue(), value1, "Initial tube value");
				tube.setLocation(location1);
				equals(tube.location, location1, "Tube location set");
				location1.setValue(value2);
				location2.setValue(value3);
				equals(tube.getValue(), value2, "Tube value updated from location");
				tube.setLocation(location2);
				equals(tube.location, location2, "Tube location set");
				location1.setValue(value2);
				location2.setValue(value3);
				equals(tube.getValue(), value3, "Tube value updated from location");
			});
			
			test("Manometer: constructor", function() {
				expect(11);
				
				var listeners = [];
				var triggers = [];
				var enabled = false;
				var visible = false;
				var value = 0;
				var type = parent.tools.ToolType.Manometer;
				
				var manometer = new parent.tools.Manometer();
				
				equals(manometer.value, value, "Initial value");
				equals(manometer.type, type, "Initial type");
				equals(manometer.ulInput, manometer, "Initial upper left input");
				equals(manometer.llInput, manometer, "Initial lower left input");
				equals(manometer.urInput, manometer, "Initial upper right input");
				equals(manometer.lrInput, manometer, "Initial lower right input");
				// Inherited attributes
				same(manometer.listeners, listeners, "Initial listener array");
				same(manometer.triggers, triggers, "Initial trigger array");
				equals(manometer.enabled, enabled, "Initial enabled flag");
				equals(manometer.visible, visible, "Initial visible flag");
				equals(manometer.getId(), null, "Initial id");
			});
			
			test("Manometer: toOctane", function() {
				expect(7);
				
				var toolType = parent.tools.ToolType.Manometer;
				var toolId = 89;
				var listener1Id = 13;
				var listener1 = new ToolListener(listener1Id);
				var listener2Id = 62;
				var listener2 = new ToolListener(listener2Id);
				var triggerId = 5;
				var trigger = new ToolTrigger(triggerId);
				
				var manometer = new parent.tools.Manometer();
				manometer.setId(toolId);
				manometer.addListener(listener1);
				manometer.addListener(listener2);
				manometer.addTrigger(trigger);
				
				var octane = manometer.toOctane();
				
				// Inherited attributes
				equals(octane.tt, toolType, "Tool type exported to Octane");
				equals(octane.wi, toolId, "Tool id exported to Octane");
				equals(octane.li.length, 2, "Tool listener hashtable exported to Octane");
				
				equals(octane.li[0], listener1Id, "Tool listener id exported to Octane");
				equals(octane.li[1], listener2Id, "Tool listener id exported to Octane");
				
				equals(octane.tr.length, 1, "Tool trigger array exported to Octane");
				equals(octane.tr[0], triggerId, "Tool trigger id exported to Octane");
			});
			
			test("Manometer: get/set input (and inputUpdated)", function() {
				expect(6);
				
				var eventType = parent.tools.ToolEventType.ManometerRightValue;
				var listenerId = 13;
				var listener = new ToolListener(listenerId);
				var value1 = 10;
				var value2 = 100;
				var locationId = 44;
				var location = new Location(locationId);
				
				var manometer = new parent.tools.Manometer();
				manometer.addListener(listener);
				
				var inputId = parent.tools.InputId.LowerRight;
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				tube.setLocation(location);
				location.setValue(value1);
				
				equals(manometer.getInput(inputId), manometer, "Manometer input retrieved");
				manometer.setInput(tube);
				equals(manometer.getInput(inputId), tube, "Manometer input set");
				equals(listener.value, value1, "Listener value updated");
				equals(listener.type, eventType, "Listener event type updated");
				location.setValue(value2);
				equals(listener.value, value2, "Listener value updated");
				equals(listener.type, eventType, "Listener event type updated");
			});
			
			test("Manometer: get/set value", function() {
				expect(2);
				
				var value1 = 0;
				var value2 = 100;
				
				var manometer = new parent.tools.Manometer();
				
				equals(manometer.getValue(), value1, "Manometer value retrieved");
				manometer.setValue(value2);
				equals(manometer.getValue(), value2, "Manometer value set");
			});
			
			test("UpdateManometerTubeEvent: constructor", function() {
				expect(4);
				
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				
				var event = new parent.tools.UpdateManometerTubeEvent(tube);
				
				equals(event.tube, tube, "Initial event tube");
				equals(event.location, null, "Initial location value");
				equals(event.value, null, "Initial value value");
				// Inherited attributes
				equals(event.getId(), null, "Initial id");
			});
			
			test("UpdateManometerTubeEvent: toOctane", function() {
				expect(4);
				
				var eventId = 61;
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var tubeId = 8;
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				tube.setId(tubeId);
				var locationId = 44;
				var location = new Location(locationId);
				var value = 73;
				
				var event = new parent.tools.UpdateManometerTubeEvent(tube);
				event.setId(eventId);
				event.location = location;
				event.value = value;
				
				var octane = event.toOctane();
				
				equals(octane.ti, tubeId, "Tube id exported to Octane");
				equals(octane.lo, locationId, "Location id exported to Octane");
				equals(octane.va, value, "Value exported to Octane");
				// Inherited attributes
				equals(octane.wi, eventId, "Event id exported to Octane");
			});
			
			test("UpdateManometerTubeEvent: fireEvent", function() {
				expect(2);
				
				var manometer = new parent.tools.Manometer();
				var inputId = parent.tools.InputId.LowerRight;
				var tube = new parent.tools.ManometerTube(manometer, inputId);
				var locationId = 44;
				var location = new Location(locationId);
				var value = 73;
				
				var event = new parent.tools.UpdateManometerTubeEvent(tube);
				event.location = location;
				event.value = value;
				event.fireEvent();
				
				equals(tube.location, location, "Event set location for tube");
				equals(tube.value, value, "Event set value for tube");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
