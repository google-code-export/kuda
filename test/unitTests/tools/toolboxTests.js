var hemi = (function(parent, jQuery) {

	parent.test = parent.test || {};
	
	o3djs.require('hemi.tools.toolbox');
	o3djs.require('hemi.world');
	
	var Tool = function (id) {
		this.worldId = id;
	};

	Tool.prototype = {
		octaneActivated: false,
		getId: function() {
			return this.worldId;
		},
		toOctane: function() {
			this.octaneActivated = true;
		}
	};
	
	var UnitTest = {
		runTests: function() {
			module("toolbox");
			
			test("ToolBox: constructor", function() {
				var world = createWorld();
				var toolbox = new parent.tools.ToolBox(world);
				
				ok(toolbox.tools != null, "Initial tools list");
				ok(toolbox.toolViews != null, "Initial tool views list");
				ok(toolbox.toolControllers != null, "Initial tool controllers list");
			});
			
			test("ToolBox: add/remove/get tool", function() {
                var world = createWorld();
                var toolbox = new parent.tools.ToolBox(world);
				var toolId = 1;
                var tool2Id = 2;
                var tool3Id = 3;
				var size = toolbox.tools.size();
                var tool = new Tool(toolId);
                var tool2 = new Tool(tool2Id);
                var tool3 = new Tool(tool3Id);
				
				toolbox.addTool(tool);
				
				equals(toolbox.tools.size(), 1, "Tool list size incremented");
				equals(toolbox.tools.get(toolId), tool, "Tool list contains new tool");
				ok(world.addCitizenCalled, "World.addCitizen() was called");
                
                toolbox.addTool(tool2);
                toolbox.addTool(tool3);
                
                var newTool = toolbox.getTool(toolId);
                same(newTool, tool, "Retrieved tool should be the same");
                
                var list = toolbox.getTools();
                equals(list.length, 3, "List size");
                
                toolbox.removeTool(tool);
                equals(toolbox.tools.size(), 2, "Tool list size decremented");
                equals(toolbox.tools.get(toolId), null, "Tool list does not contain tool");
                ok(world.removeCitizenCalled, "World.removeCitizen() was called");
                
                // remove non existent tool
                toolbox.removeTool(tool);
                equals(toolbox.tools.size(), 2, "Tool list size not decremented");
			});
			
			test("ToolBox: add/remove/get tool view", function() {
                var world = createWorld();
                var toolbox = new parent.tools.ToolBox(world);
                var viewId = 1;
                var view2Id = 2;
                var view3Id = 3;
                var toolView = new Tool(viewId);
                var toolView2 = new Tool(view2Id);
                var toolView3 = new Tool(view3Id);
				var size = toolbox.toolViews.size();
				
				toolbox.addToolView(toolView);				
				equals(toolbox.toolViews.size(), 1, "Tool view list size incremented");
				equals(toolbox.toolViews.get(viewId), toolView, "Tool view list contains view");
                ok(world.addCitizenCalled, "World.addCitizen() was called");
				
                toolbox.addToolView(toolView2);
                toolbox.addToolView(toolView3);
                
                var newToolView = toolbox.getToolView(view2Id);
                same(newToolView, toolView2, "Retrieved tool view");
                
                newToolView = toolbox.getToolView(view3Id);
                same(newToolView, toolView3, "Retrieved tool view");
                
                var list = toolbox.getToolViews();
                equals(list.length, 3, "List size");
                
                toolbox.removeToolView(toolView);
                equals(toolbox.toolViews.size(), 2, "View list size should be decremented");
                ok(toolbox.toolViews.get(viewId) == null, "Tool view should not be found");
                ok(world.removeCitizenCalled, "World.removeCitizen() was called");
                
                toolbox.removeToolView(toolView3);
                equals(toolbox.toolViews.size(), 1, "View list size should be decremented");
                ok(toolbox.toolViews.get(view3Id) == null, "Tool view should not be found");
			});
			
			test("ToolBox: add/remove/get tool controller", function() {
                var world = createWorld();
                var toolbox = new parent.tools.ToolBox(world);
                var controllerId = 1;
                var controller2Id = 2;
                var controller3Id = 3;
                var toolController = new Tool(controllerId);
                var toolController2 = new Tool(controller2Id);
                var toolController3 = new Tool(controller3Id);
				var size = toolbox.toolControllers.size();
				
				toolbox.addToolController(toolController);				
				equals(toolbox.toolControllers.size(), 1, "Tool controller list size incremented");
				equals(toolbox.toolControllers.get(controllerId), toolController, "Tool controller list contains controller");
                ok(world.addCitizenCalled, "World.addCitizen() was called");
				
                toolbox.addToolController(toolController2);
                toolbox.addToolController(toolController3);      
                
                var newToolController = toolbox.getToolController(controller2Id);
                same(newToolController, toolController2, "Retrieved tool controller");
                
                newToolController = toolbox.getToolController(controller3Id);
                same(newToolController, toolController3, "Retrieved tool controller");  
                
                var list = toolbox.getToolControllers();
                equals(list.length, 3, "List size");        
                
                toolbox.removeToolController(toolController);
                equals(toolbox.toolControllers.size(), 2, "Controller list size should be decremented");
                ok(toolbox.toolControllers.get(controllerId) == null, "Tool controller should not be found");
                ok(world.removeCitizenCalled, "World.removeCitizen() was called");
                
                toolbox.removeToolController(toolController3);
                equals(toolbox.toolControllers.size(), 1, "Controller list size should be decremented");
                ok(toolbox.toolControllers.get(controller3Id) == null, "Tool controller should not be found");
			});
			
			test("ToolBox: toOctane", function() {
                var world = createWorld();
                var toolbox = new parent.tools.ToolBox(world);
                var controllerId = 1;
                var controller2Id = 2;
                var controller3Id = 3;
                var toolController = new Tool(controllerId);
                var toolController2 = new Tool(controller2Id);
                var toolController3 = new Tool(controller3Id);
                var viewId = 1;
                var view2Id = 2;
                var view3Id = 3;
                var toolView = new Tool(viewId);
                var toolView2 = new Tool(view2Id);
                var toolView3 = new Tool(view3Id);
                var toolId = 1;
                var tool2Id = 2;
                var tool3Id = 3;
                var tool = new Tool(toolId);
                var tool2 = new Tool(tool2Id);
                var tool3 = new Tool(tool3Id);
				
                toolbox.addToolController(toolController);
                toolbox.addToolController(toolController2);
                toolbox.addToolController(toolController3);
                
                toolbox.addToolView(toolView);
                toolbox.addToolView(toolView2);
                toolbox.addToolView(toolView3);
				
                toolbox.addTool(tool);
                toolbox.addTool(tool2);
                toolbox.addTool(tool3);
				
				var octane = toolbox.toOctane();
				
				ok(tool.octaneActivated, "toOctane called");
                ok(tool2.octaneActivated, "toOctane called");
                ok(tool3.octaneActivated, "toOctane called");
                ok(toolView.octaneActivated, "toOctane called");
                ok(toolView2.octaneActivated, "toOctane called");
                ok(toolView3.octaneActivated, "toOctane called");
                ok(toolController.octaneActivated, "toOctane called");
                ok(toolController2.octaneActivated, "toOctane called");
                ok(toolController3.octaneActivated, "toOctane called");
			});
			
			function createWorld() {
				var world = {
					addCitizenCalled: false,
					removeCitizenCalled: false,
					addCitizen: function(citizen) {
						this.addCitizenCalled = true;
					},
					removeCitizen: function(worldId) {
						this.removeCitizenCalled = true;
					}
				};
				
				return world;
			};
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
