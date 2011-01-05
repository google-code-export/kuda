var hemi = (function(parent, jQuery) {

	parent.test = parent.test || {};
	
	o3djs.require('hemi.tools.baseTool');
	o3djs.require('hemi.tools.blowerDoor');
	o3djs.require('hemi.tools.blowerDoorView');
	o3djs.require('hemi.tools.blowerDoorController');
	
	var model = {
        id: 3456,
		max: 10,
		min: 0,
		currentX: 0,
		currentSpeed: 0,
		visible: false,
        getId: function() {
            return this.id;
        },
        setId: function(id) {
            this.id = id;
        },
		setFanSpeed: function(val) {
			this.currentSpeed = val;
		},
		setVisible: function(val) {
			this.visible = val;
		}
	};
	
	var knob = {
		rotateObj: null,
		rotate: function(obj) {
			this.rotateObj = obj;
		}
	};
	
	var view = {
		id: 1254,
		knob: knob,
		callbacks: [],
		config: {
			loadOnConstruction: false
		},
		addLoadCallback: function(callback) {
			this.callbacks.push(callback);
		},
		loadConfig: function() {
			for (var ndx = 0, len = this.callbacks.length; ndx < len; ndx++) {
				this.callbacks[ndx]();
			}
		},
		getId: function() {
			return this.id;
		},
		setId: function(id) {
			this.id = id;
		}
	};
	
	var toolbarView = {
		id: 4545,
		button: jQuery("<button>The Button</button>"),
		getId: function() {
			return this.id;
		},
		setId: function(id) {
			this.id = id;
		}
	};
	
	var UnitTest = {
		runTests: function() {
			module("blowerdoor");
			
			test("BlowerDoorController: constructor", function() {
				var controller = new parent.tools.BlowerDoorController();
				controller.setModel(model);
				controller.setView(view);
				controller.setToolbarView(toolbarView);
				
				equals(controller.blowerDoorModel, model, "Has model");
				equals(controller.blowerDoorView, view, "Has view");
				equals(controller.toolbarView, toolbarView, "Has toolbar view");
				ok(knob.rotateObj != null, "knob rotate called");
				
				// test that the controller bound the click event
				toolbarView.button.click();
			    ok(model.visible, "Model should now be visible");
				
				// test no model/view/toolbarview
				knob.rotateObj = null;
				
				controller = new parent.tools.BlowerDoorController();
                equals(controller.blowerDoorModel, null, "Has no model");
                equals(controller.blowerDoorView, null, "Has no view");
                equals(controller.toolbarView, null, "Has no toolbar view");
                ok(knob.rotateObj == null, "knob rotate not called");
			});
			
			test("BlowerDoorController: toOctane", function() {				
				var controller = new parent.tools.BlowerDoorController();
				controller.setModel(model);
				controller.setView(view);
				controller.setToolbarView(toolbarView);
				var octane = controller.toOctane();
				
				equals(octane.mi, model.getId(), "Model id == octane model id");
				equals(octane.vi, view.getId(), "View id == octane view id");
				equals(octane.wi, controller.getId(), "Controller id == octane controller id");
				equals(octane.tt, controller.type, "Controller type == octane type");
				equals(octane.ti, toolbarView.getId(), "Toolbar view id == octane toolbar view id");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
