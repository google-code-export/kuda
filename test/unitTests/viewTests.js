var hemi = (function(parent, jQuery) {

	parent.test = parent.test || {};
	parent.test.view = parent.test.view || {};
	
	o3djs.require('hemi.view');
	
	var UnitTest = {
		name: "view",
		runTests: function() {
			module(this.name);
			
            /**
             * Tests of the Camera object
             */
			test("Camera: default constructor", function() {
				expect(14);
				
				var cam = new hemi.view.Camera();
				
				equals(cam.pan, 0, "Default pan is 0");
				equals(cam.tilt, 0, "Default tilt is 0");
				equals(cam.distance, 1, "Default distance is 0");
				equals(cam.maxTilt, Math.PI/2.001, "Default max tilt is pi/2");
				equals(cam.minTilt, -Math.PI/2.001, "Default min tilt is -pi/2");
				same(cam.up, [0,1,0], "Default up is y-axis");
				same(cam.eye, [0,0,-1], "Default eye is at [0,0,-1]");
				same(cam.target, [0,0,0], "Default target is the origin");
				equals(cam.lastEye, cam.eye, "Default last eye is current eye");
				equals(cam.lastTarget, cam.target, "Default last target is current target");
				equals(cam.lensAngle, hemi.core.math.degToRad(hemi.view.DEFAULT_FOV), "Default field of view");
				equals(cam.nearPlane, hemi.view.DEFAULT_NP, "Default near clipping plane");
				equals(cam.farPlane, hemi.view.DEFAULT_FP, "Default far clipping plane");	
				equals(cam.orthographic, hemi.view.PERSPECTIVE, "Perspective view by default");			
			});
			
			test("Camera: to Octane", function() {
				expect(0);
				
				var camera = new parent.view.Camera();
				
				camera.lensAngle = 0.5;
				camera.nearPlane = 0.6;
				camera.farPlane = 4000;
				camera.enableControl();
				
				//var octane = camera.toOctane();

			});
			
			test("Camera: init/cleanup (enableControl = false)", function() {
				expect(8);
				var camera = new parent.view.Camera();
				var ndx = -1;
				
				camera.init();
				
				ok(parent.view.renderListeners.indexOf(camera) != -1, "Camera in render listener array");
				
				camera.cleanUp();
				ok(parent.view.renderListeners.indexOf(camera) == -1, "Camera removed from render listener array");
				ok(parent.input.mouseDownListeners.indexOf(camera) == -1, "Camera removed from mouse down listener array");
				ok(parent.input.mouseUpListeners.indexOf(camera) == -1, "Camera removed from mouse up listener array");
				ok(parent.input.mouseMoveListeners.indexOf(camera) == -1, "Camera removed from mouse move listener array");
				ok(parent.input.mouseWheelListeners.indexOf(camera) == -1, "Camera removed from mouse wheel listener array");
				ok(parent.input.keyDownListeners.indexOf(camera) == -1, "Camera removed from key down listener array");
				ok(parent.input.keyUpListeners.indexOf(camera) == -1, "Camera removed from key up listener array");
			});
			
			test("Camera: init/cleanup (enableControl = true)", function() {
				expect(14);
				var camera = new parent.view.Camera();
				camera.init();
				camera.enableControl();
				
				ok(parent.view.renderListeners.indexOf(camera) != -1, "Camera in render listener array");
				
				// check for addition to input listeners
				ok(parent.input.mouseDownListeners.indexOf(camera) != -1, "Camera in mouse down listener array");
				ok(parent.input.mouseUpListeners.indexOf(camera) != -1, "Camera in mouse up listener array");
				ok(parent.input.mouseMoveListeners.indexOf(camera) != -1, "Camera in mouse move listener array");
				ok(parent.input.mouseWheelListeners.indexOf(camera) != -1, "Camera in mouse wheel listener array");
				ok(parent.input.keyDownListeners.indexOf(camera) != -1, "Camera in key down listener array");
				ok(parent.input.keyUpListeners.indexOf(camera) != -1, "Camera in key up listener array");
				
				camera.cleanUp();
				ok(parent.view.renderListeners.indexOf(camera) == -1, "Camera removed from render listener array");
				ok(parent.input.mouseDownListeners.indexOf(camera) == -1, "Camera removed from mouse down listener array");
				ok(parent.input.mouseUpListeners.indexOf(camera) == -1, "Camera removed from mouse up listener array");
				ok(parent.input.mouseMoveListeners.indexOf(camera) == -1, "Camera removed from mouse move listener array");
				ok(parent.input.mouseWheelListeners.indexOf(camera) == -1, "Camera removed from mouse wheel listener array");
				ok(parent.input.keyDownListeners.indexOf(camera) == -1, "Camera removed from key down listener array");
				ok(parent.input.keyUpListeners.indexOf(camera) == -1, "Camera removed from key up listener array");
			});
			
			test("Camera: setEnableControl", function() {
				expect(12);
				var camera = new parent.view.Camera();
				camera.enableControl();
				ok(parent.input.mouseDownListeners.indexOf(camera) != -1, "Camera in mouse down listener array");
				ok(parent.input.mouseUpListeners.indexOf(camera) != -1, "Camera in mouse up listener array");
				ok(parent.input.mouseMoveListeners.indexOf(camera) != -1, "Camera in mouse move listener array");
				ok(parent.input.mouseWheelListeners.indexOf(camera) != -1, "Camera in mouse wheel listener array");
				ok(parent.input.keyDownListeners.indexOf(camera) != -1, "Camera in key down listener array");
				ok(parent.input.keyUpListeners.indexOf(camera) != -1, "Camera in key up listener array");
				
				camera.disableControl();
				ok(parent.input.mouseDownListeners.indexOf(camera) == -1, "Camera removed from mouse down listener array");
				ok(parent.input.mouseUpListeners.indexOf(camera) == -1, "Camera removed from mouse up listener array");
				ok(parent.input.mouseMoveListeners.indexOf(camera) == -1, "Camera removed from mouse move listener array");
				ok(parent.input.mouseWheelListeners.indexOf(camera) == -1, "Camera removed from mouse wheel listener array");
				ok(parent.input.keyDownListeners.indexOf(camera) == -1, "Camera removed from key down listener array");
				ok(parent.input.keyUpListeners.indexOf(camera) == -1, "Camera removed from key up listener array");
			});
			
			test("Camera: update (moveCamera = false, shiftKeyDown = false)", function() {
				expect(4);
				var camera = new parent.view.Camera();
				camera.enableControl();
				var tilt = camera.tilt;
				var pan = camera.pan;
				var eye = camera.eye.slice(0,3);
				var target = camera.target.slice(0,3);
				camera.onMouseDown({
					shiftKey: false,
					x: 200,
					y: 300
				});
				camera.onMouseMove({
					x: 201,
					y: 300
				});
				camera.update();
				
				ok(!hemi.utils.compareArrays(camera.eye,eye), "Camera eye should have changed");
				same(camera.target,target, "Camera target should not have changed");
				equal(camera.tilt, tilt, "Camera tilt should not change");
				ok(camera.pan != pan, "Camera pan should have changed");

			});
			
			test("Camera: update (moveCamera = false, shiftKeyDown = true)", function() {
				expect(4);
				var camera = new parent.view.Camera();
				camera.enableControl();
				var tilt = camera.tilt;
				var pan = camera.pan;
				var eye = camera.eye.slice(0,3);
				var target = camera.target.slice(0,3);
				camera.onMouseDown({
					shiftKey: true,
					x: 200,
					y: 300
				});
				camera.onMouseMove({
					x: 201,
					y: 300
				});
				camera.update();
				
				ok(!hemi.utils.compareArrays(camera.eye,eye), "Camera eye should have changed");
				ok(!hemi.utils.compareArrays(camera.target,target), "Camera target should have changed");
				equal(camera.tilt, tilt, "Camera tilt should not change");
				equal(camera.pan, pan, "Camera pan should not have changed");
			});
			
			asyncTest("Camera: moveToView (also tests update() moveCamera = true)", function() {
				var camera = new parent.view.Camera();
				var viewpoint = parent.view.createCustomViewpoint('newview', [24, 24, 24], [15, 45, 43], [0, 1, 0], 75, 10, 3000);
				
				camera.init();
				camera.moveToView(viewpoint);
				
				// wait for rendering to finish                
				setTimeout(function() {
					// check the result
					ok(hemi.utils.compareArrays(camera.eye, viewpoint.eye), "Camera moved eye to new viewpoint");
					ok(hemi.utils.compareArrays(camera.target, viewpoint.target), "Camera moved target to new viewpoint");
					ok(hemi.utils.compareArrays(camera.up, viewpoint.up), "Camera moved up vector to new viewpoint");

					// necessary to remove the camera as a render listener
					camera.cleanUp();
					
					start();
				}, 3000);
			});
			
			test("Camera: key handlers (keydown, keyup)", function() {
				expect(3);
				
				var camera = new parent.view.Camera();
				var keyEvent = {
					keyCode: 16
				};
				
				// keycode 16 = shift key
				// key down
				camera.onKeyDown(keyEvent);
				ok(camera.shiftKeyDown, "(key down) shift key is down");
				
				// key up
				camera.onKeyUp(keyEvent);
				ok(!camera.shiftKeyDown, "(key up) shift key is up");
				
				// keycode is not shift key
				// key down
				keyEvent.keyCode = 24;
				camera.onKeyDown(keyEvent);
				ok(!camera.shiftKeyDown, "(key down) was not shift key so flag is false");
			});
			
			
			/**
			 * Tests of the Viewpoint object
			 */
			test("Viewpoint: default constructor", function() {
				expect(7);

				var vp = new parent.view.Viewpoint();
				
				same(vp.name, "", "Viewpoint name is the same");
				same(vp.eye, [0,0,0], "Viewpoint eye is the same");
				same(vp.target, [0,0,0], "Viewpoint target is the same");
				same(vp.up, [0,1,0], "Viewpoint up is the same");
				equals(vp.fov, parent.view.DEFAULT_FOV, "Viewpoint fov is the default");
				equals(vp.fp, parent.view.DEFAULT_FP, "Viewpoint far plane is the default");
				equals(vp.np, parent.view.DEFAULT_NP, "Viewpoint near plane is the default");
			});
			
			test("Viewpoint: to Octane", function() {
				expect(0);

			});
			
			asyncTest("Add/remove render listener", function() {
                expect(22);
                
				var timeOut = 2000;
                var renders = 20;
				
				var listener = {
					onRender: function(event) {
						ok(event, "Render event fired.");
						
						if (--renders <= 0) {
							var found = parent.view.removeRenderListener(this);
							ok(found, "Render listener removed.");
						}
					}
				};
                
				parent.view.addRenderListener(listener);
                
				setTimeout(function(){
					var found = parent.view.removeRenderListener(listener);
					same(found, null, "Render listener already removed.");
					start();
				}, timeOut);
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
