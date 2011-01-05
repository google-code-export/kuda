var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.input = parent.test.input || {};
	
	o3djs.require('hemi.input');
	
	var ListenerType = {
		MouseDown : 0,
		MouseUp : 1,
		MouseMove : 2,
		MouseWheel : 3,
		KeyDown : 4,
		KeyUp : 5,
		KeyPress : 6
	};
	
	var TestListener = function (type) {
		this.type = type;
	};
	
	var UnitTest = {
		name: 'input',
		runTests: function() {
			module(this.name);
			
			test("Add/remove mouse down listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.MouseDown);
				var listener2 = new TestListener(ListenerType.MouseDown);
				
				parent.input.addMouseDownListener(listener2);
				
				var remove1 = parent.input.removeMouseDownListener(listener1);
				var remove2 = parent.input.removeMouseDownListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				same(remove2, listener2, "Remove added listener");
			});
			
			test("Add/remove mouse up listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.MouseUp);
				var listener2 = new TestListener(ListenerType.MouseUp);
				
				parent.input.addMouseUpListener(listener2);
				
				var remove1 = parent.input.removeMouseUpListener(listener1);
				var remove2 = parent.input.removeMouseUpListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				equals(remove2, listener2, "Remove added listener");
			});
			
			test("Add/remove mouse move listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.MouseMove);
				var listener2 = new TestListener(ListenerType.MouseMove);
				
				parent.input.addMouseMoveListener(listener2);
				
				var remove1 = parent.input.removeMouseMoveListener(listener1);
				var remove2 = parent.input.removeMouseMoveListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				equals(remove2, listener2, "Remove added listener");
			});
			
			test("Add/remove mouse wheel listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.MouseWheel);
				var listener2 = new TestListener(ListenerType.MouseWheel);
				
				parent.input.addMouseWheelListener(listener2);
				
				var remove1 = parent.input.removeMouseWheelListener(listener1);
				var remove2 = parent.input.removeMouseWheelListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				equals(remove2, listener2, "Remove added listener");
			});
			
			test("Add/remove key down listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.KeyDown);
				var listener2 = new TestListener(ListenerType.KeyDown);
				
				parent.input.addKeyDownListener(listener2);
				
				var remove1 = parent.input.removeKeyDownListener(listener1);
				var remove2 = parent.input.removeKeyDownListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				equals(remove2, listener2, "Remove added listener");
			});
			
			test("Add/remove key up listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.KeyUp);
				var listener2 = new TestListener(ListenerType.KeyUp);
				
				parent.input.addKeyUpListener(listener2);
				
				var remove1 = parent.input.removeKeyUpListener(listener1);
				var remove2 = parent.input.removeKeyUpListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				equals(remove2, listener2, "Remove added listener");
			});
			
			test("Add/remove key press listener", function() {
				expect(2);
				
				var listener1 = new TestListener(ListenerType.KeyPress);
				var listener2 = new TestListener(ListenerType.KeyPress);
				
				parent.input.addKeyPressListener(listener2);
				
				var remove1 = parent.input.removeKeyPressListener(listener1);
				var remove2 = parent.input.removeKeyPressListener(listener2);
				
				equals(remove1, null, "Remove unadded listener");
				equals(remove2, listener2, "Remove added listener");
			});

		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
