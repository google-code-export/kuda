var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.tools.baseTool');

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
	
	var UnitTest = {
		runTests: function() {
			module("tools");
			
		    // for testing purposes
		    parent.tools.ToolType.TestTool = "TestTool";
			
			test("BaseTool: constructor", function() {
				expect(6);
				
				var triggers = [];
				var enabled = false;
				var visible = false;
				
				var tool = new parent.tools.BaseTool();
				
				ok(tool.listeners, "Initial listener hashtable");
				same(tool.triggers, triggers, "Initial trigger array");
				equals(tool.enabled, enabled, "Initial enabled flag");
				equals(tool.visible, visible, "Initial visible flag");
				equals(tool.type, undefined, "Initial type");
				equals(tool.getId(), null, "Initial id");
			});
			
			test("BaseTool: toOctane", function() {
				expect(7);
				
				var toolType = parent.tools.ToolType.TestTool;
				var toolId = 89;
				var listener1Id = 13;
				var listener1 = new ToolListener(listener1Id);
				var listener2Id = 62;
				var listener2 = new ToolListener(listener2Id);
				var triggerId = 5;
				var trigger = new ToolTrigger(triggerId);
				
				var tool = new parent.tools.BaseTool();
				tool.type = toolType;
				tool.setId(toolId);
				tool.addListener(listener1);
				tool.addListener(listener2);
				tool.addTrigger(trigger);
				
				var octane = tool.toOctane();
				
				equals(octane.tt, toolType, "Tool type exported to Octane");
				equals(octane.wi, toolId, "Tool id exported to Octane");
				equals(octane.li.length, 2, "Tool listener hashtable exported to Octane");
				
				equals(octane.li[0], listener1Id, "Tool listener id exported to Octane");
				equals(octane.li[1], listener2Id, "Tool listener id exported to Octane");
				
				equals(octane.tr.length, 1, "Tool trigger array exported to Octane");
				equals(octane.tr[0], triggerId, "Tool trigger id exported to Octane");
			});
			
			test("BaseTool: add/remove listener", function() {
				expect(10);
				
				var listener1Id = 13;
				var listener1 = new ToolListener(listener1Id);
				var listener2Id = 62;
				var listener2 = new ToolListener(listener2Id);
				var listener3Id = 5;
				var listener3 = new ToolListener(listener3Id);
				
				var tool = new parent.tools.BaseTool();
				
				equals(tool.listeners.length, 0, "Initial tool listener hashtable");
				tool.addListener(listener1);
				equals(tool.listeners.length, 1, "Tool listener array after add");
				tool.addListener(listener2);
				equals(tool.listeners.length, 2, "Tool listener array after add");
				tool.addListener(listener3);
				equals(tool.listeners.length, 3, "Tool listener array after add");
				var removed = tool.removeListener(listener2);
				equals(removed, listener2, "Tool listener removed from array");
				equals(tool.listeners.length, 2, "Tool listener array after remove");
				removed = tool.removeListener(listener1);
				equals(removed, listener1, "Tool listener removed from array");
				equals(tool.listeners.length, 1, "Tool listener array after remove");
				removed = tool.removeListener(listener3);
				equals(removed, listener3, "Tool listener removed from hashtable");
				equals(tool.listeners.length, 0, "Tool listener array after remove");
			});
			
			test("BaseTool: add/remove trigger", function() {
				expect(4);
				
				var toolType = parent.tools.ToolType.TestTool;
				var triggerId = 5;
				var trigger = new ToolTrigger(triggerId);
				
				var tool = new parent.tools.BaseTool();
				equals(tool.triggers.length, 0, "Initial tool trigger array");
				tool.addTrigger(trigger);
				equals(tool.triggers.length, 1, "Tool trigger array after add");
				var removed = tool.removeTrigger(trigger);
				equals(removed, trigger, "Tool trigger removed from array");
				equals(tool.triggers.length, 0, "Tool trigger array after remove");
			});
			
			test("BaseTool: notifyListeners", function() {
				expect(18);
				
				var listener1Type = parent.tools.ToolEventType.Visible;
				var listener2Type = parent.tools.ToolEventType.Enable;
				var listener1Id = 13;
				var listener1 = new ToolListener(listener1Id);
				var listener2Id = 62;
				var listener2 = new ToolListener(listener2Id);
				var listener3Id = 5;
				var listener3 = new ToolListener(listener3Id);
				var value1 = 'value 1';
				var value2 = 'value 2';
				
				var tool = new parent.tools.BaseTool();
				tool.addListener(listener1);
				tool.addListener(listener2);
				tool.addListener(listener3);
				
				equals(listener1.type, null, "Initial tool listener type");
				equals(listener1.value, null, "Initial tool listener value");
				equals(listener2.type, null, "Initial tool listener type");
				equals(listener2.value, null, "Initial tool listener value");
				equals(listener3.type, null, "Initial tool listener type");
				equals(listener3.value, null, "Initial tool listener value");
				tool.notifyListeners(listener1Type, value1);
				equals(listener1.type, listener1Type, "Tool listener type set");
				equals(listener1.value, value1, "Tool listener value set");
				equals(listener2.type, listener1Type, "Tool listener type not set");
				equals(listener2.value, value1, "Tool listener value not set");
				equals(listener3.type, listener1Type, "Tool listener type set");
				equals(listener3.value, value1, "Tool listener value set");
				tool.notifyListeners(listener2Type, value2);
				equals(listener2.type, listener2Type, "Tool listener type set");
				equals(listener2.value, value2, "Tool listener value set");
				equals(listener1.type, listener2Type, "Tool listener type not set");
				equals(listener1.value, value2, "Tool listener value not set");
				equals(listener3.type, listener2Type, "Tool listener type not set");
				equals(listener3.value, value2, "Tool listener value not set");
			});
			
			test("BaseTool: setEnabled", function() {
				expect(8);
				
				var listener1Type = parent.tools.ToolEventType.Visible;
				var listener2Type = parent.tools.ToolEventType.Enable;
				var listener1Id = 13;
				var listener1 = new ToolListener(listener1Id);
				var listener2Id = 62;
				var listener2 = new ToolListener(listener2Id);
				var enable = true;
				
				var tool = new parent.tools.BaseTool();
				tool.addListener(listener1, listener1Type);
				tool.addListener(listener2, listener2Type);
				
				equals(listener1.type, null, "Initial tool listener type");
				equals(listener1.value, null, "Initial tool listener value");
				equals(listener2.type, null, "Initial tool listener type");
				equals(listener2.value, null, "Initial tool listener value");
				tool.setEnabled(enable);
				equals(listener1.type, listener2Type, "Tool listener type not set");
				equals(listener1.value, enable, "Tool listener value not set");
				equals(listener2.type, listener2Type, "Tool listener type set");
				equals(listener2.value, enable, "Tool listener value set");
			});
			
			test("BaseTool: setVisible", function() {
				expect(8);
				
				var listener1Type = parent.tools.ToolEventType.Visible;
				var listener2Type = parent.tools.ToolEventType.Enable;
				var listener1Id = 13;
				var listener1 = new ToolListener(listener1Id);
				var listener2Id = 62;
				var listener2 = new ToolListener(listener2Id);
				var visible = true;
				
				var tool = new parent.tools.BaseTool();
				tool.addListener(listener1, listener1Type);
				tool.addListener(listener2, listener2Type);
				
				equals(listener1.type, null, "Initial tool listener type");
				equals(listener1.value, null, "Initial tool listener value");
				equals(listener2.type, null, "Initial tool listener type");
				equals(listener2.value, null, "Initial tool listener value");
				tool.setVisible(visible);
				equals(listener1.type, listener1Type, "Tool listener type set");
				equals(listener1.value, visible, "Tool listener value set");
				equals(listener2.type, listener1Type, "Tool listener type not set");
				equals(listener2.value, visible, "Tool listener value not set");
			});
			
			test("UpdateToolEvent: constructor", function() {
				expect(4);
				
				var tool = new parent.tools.BaseTool();
				var event = new parent.tools.UpdateToolEvent(tool);
				
				equals(event.tool, tool, "Initial event tool");
				equals(event.enable, null, "Initial enable flag");
				equals(event.visible, null, "Initial visible flag");
				equals(event.getId(), null, "Initial id");
			});
			
			test("UpdateToolEvent: toOctane", function() {
				expect(3);
				
				var toolId = 89;
				var enable = true;
				var visible = false;
				
				var tool = new parent.tools.BaseTool();
				tool.setId(toolId);
				
				var event = new parent.tools.UpdateToolEvent(tool);
				event.enable = enable;
				event.visible = visible;
				
				var octane = event.toOctane();
				
				equals(octane.ti, toolId, "Tool id exported to Octane");
				equals(octane.en, enable, "Enable flag exported to Octane");
				equals(octane.vi, visible, "Visible exported to Octane");
			});
			
			test("UpdateToolEvent: fireEvent", function() {
				expect(2);
				
				var enable = true;
				var visible = false;
				
				var tool = new parent.tools.BaseTool();
				tool.enabled = !enable;
				tool.visible = !visible;
				
				var event = new parent.tools.UpdateToolEvent(tool);
				event.enable = enable;
				event.visible = visible;
				event.fireEvent();
				
				equals(tool.enabled, enable, "Event set enabled flag for tool");
				equals(tool.visible, visible, "Event set visible flag for tool");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
