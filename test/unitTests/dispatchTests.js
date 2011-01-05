var hemi = (function(parent, jQuery) {
    o3djs.require('hemi.dispatch');

	parent.test = parent.test || {};
	
	var TestHandler = function (max) {
		this.max = max;
		this.state = 0;
		this.called = false;
	};

	TestHandler.prototype = {
		
		increment: function() {
			this.state++;
			
			if (this.state >= this.max) {
				this.reset();
			}
		},
		
		reset: function() {
			this.state = 0;
		}
	};
	
	var UnitTest = {
		name: 'dispatch',
		runTests: function() {
			module(this.name);
			
			var dispatcher = new hemi.dispatch.MessageDispatcher();
			var renderHandler = new TestHandler(100);
			var pickHandler = new TestHandler(2);
			var delayHandler = new TestHandler(1);
				
			var renderListener = {
				onRender: function(renderEvent) {
					dispatcher.postMessage(0, "rendUp", renderEvent);
				}
			};
			
			asyncTest("MessageDispatcher: Render Handler", function() {
				expect(2);
			
				dispatcher.addTarget(0, "rendUp", function(msg) {
					renderHandler.increment();
					
					if (renderHandler.state == 0) {
						renderHandler.called = true;
					}
				});
				
				ok(!renderHandler.called, "Render handler not called yet");
				parent.view.addRenderListener(renderListener);
				
				setTimeout(function(){
					parent.view.removeRenderListener(renderListener);
					ok(renderHandler.called, "Render handler was called");
					renderHandler.called = false;
					
					start();
				}, 2000);
			});
			
			test("MessageDispatcher: Pick Handler", function() {
				expect(3);
			
				dispatcher.addTarget(parent.dispatch.WILDCARD, "pick", function(msg) {
					pickHandler.increment();
					
					if (pickHandler.state == 0) {
						pickHandler.called = true;
					}
				});
				
				dispatcher.postMessage(50, "pick", {});
				ok(!pickHandler.called, "Pick handler not called yet");
				dispatcher.postMessage(50, "notPick", {});
				ok(!pickHandler.called, "Pick handler not called yet");
				dispatcher.postMessage(100, "pick", {});
				ok(pickHandler.called, "Pick handler was called");
				pickHandler.called = false;
			});
			
			asyncTest("MessageDispatcher: Delay Handler", function() {
				expect(2);
				
				renderHandler.reset = function() {
					this.state = 0;
					dispatcher.postMessage(1, "reset", {});
				};
				
				delayHandler.reset = function() {
					this.state = 0;
					dispatcher.postMessage(2, "reset", {});
				};
			
				dispatcher.addTarget(1, parent.dispatch.WILDCARD, function(msg) {
					if (pickHandler.state == 1) {
						setTimeout(function(){
							delayHandler.increment();
						}, 1000);
					}
				});
			
				dispatcher.addTarget(2, "reset", function(msg) {
					delayHandler.called = true;
				});
				
				parent.view.addRenderListener(renderListener);
				ok(!delayHandler.called, "Delay handler not called yet");
				dispatcher.postMessage(33, "pick", {});
				
				setTimeout(function(){
					parent.view.removeRenderListener(renderListener);
					ok(delayHandler.called, "Delay handler was called");
					delayHandler.called = false;
					
					start();
				}, 3000);
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
