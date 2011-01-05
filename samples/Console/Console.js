/**
 * This sample is based off of the Tutorial A sample but it shows how to
 * use the Hemi console in your viewer. Be sure to check the HTML file to see
 * important additions made there. The advantage of the Hemi console is that you
 * can insert log messages throughout your code for testing and notifying of
 * error conditions. The messages will only be displayed if the Hemi console is
 * present, so you don't have to worry about removing the log messages when your
 * code is ready to release. Just remove the console DIV from your HTML file.
 */
(function() {
	o3djs.require('o3djs.util');
	o3djs.require('hemi.animation');
	o3djs.require('hemi.motion');
	o3djs.require('hemi.effect');

	var house;
	var window1Left;
	var window1Right;
	var door;
	var interval;
	var fire;
	var entered = false;

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.console.addToPage();
		
		// We set up some intervals to send log messages for demo purposes.
		setInterval(function() {
			hemi.console.log("This is a log message.", hemi.console.LOG);
		}, 1000);
		setInterval(function() {
			hemi.console.log("This is a warning message.", hemi.console.WARN);
		}, 1300);
		setInterval(function() {
			hemi.console.log("This is an error message.", hemi.console.ERR);
		}, 1700);
		
		hemi.view.setBGColor([1, 1, 1, 1]);
		house = new hemi.model.Model();
		house.setFileName('assets/house_v12.o3dtgz');
		
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		
		hemi.world.ready();
	}

	function bindJavascript() {
		jQuery('#enterForm').submit(function() {
			return false;
		});
		jQuery('#enter').click(enter);
		jQuery('#enter').attr('disabled', 'disabled');
	}

	function setupScene() {
		house.setTransformVisible('SO_door', false);
		house.setTransformVisible('SO_window1sashLeft', false);
		house.setTransformVisible('SO_window1sashRight', false);
		house.setTransformVisible('camEye_outdoors', false);
		house.setTransformVisible('camEye_indoors', false);
		house.setTransformVisible('camTarget_outdoors', false);
		house.setTransformVisible('camTarget_indoors', false);
		house.setTransformPickable('camEye_outdoors', false);
		house.setTransformPickable('camEye_indoors', false);
		house.setTransformPickable('camTarget_outdoors', false);
		house.setTransformPickable('camTarget_indoors', false);
		
		door = {
			closed: true,
			rotator: new hemi.motion.Rotator(house.getTransform('door')),
			swing: function() {
				var direction = this.closed? -1 : 1;

				if (this.rotator.rotate([0, direction * Math.PI / 2.0, 0], 1, true)) {
					this.closed = !this.closed;
				}
			}
		};
		window1Left = {
			closed: true,
			translator: new hemi.motion.Translator(house.getTransform('window1_sashLeft')),
			slide: function() {
				var direction = this.closed? 1 : -1;

				if (this.translator.move([0, direction * 60, 0], 1, true)) {
					this.closed = !this.closed;
				}
			}
		};
		window1Right = {
			closed: true,
			translator: new hemi.motion.Translator(house.getTransform('window1_sashRight')),
			slide: function() {
				var direction = this.closed? 1 : -1;

				if (this.translator.move([0, direction * 60, 0], 1, true)) {
					this.closed = !this.closed;
				}
			}
		};
		
		hemi.world.subscribe(hemi.msg.pick,
			function(msg) {
				switch (msg.data.pickInfo.shapeInfo.parent.transform.name) {
				case 'SO_door':
					door.swing();
					break;
				case 'SO_window1sashLeft':
					window1Left.slide();
					break;
				case 'SO_window1sashRight':
					window1Right.slide();
					break;
				}
			});
		
		fire = hemi.effect.createFire();
		fire.transform.translate(0.0, 72.0, -236.0);
		
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_outdoors').localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_outdoors').localMatrix);
		viewpoint.fov = 60;
		hemi.world.camera.moveToView(viewpoint, 60);
		
		var enterMoveCamera = function() {
			if (door.closed || window1Right.closed || window1Left.closed || entered) {
				jQuery('#enter').attr('disabled', 'disabled');

				if (entered) {
					clearInterval(interval);
				}
			} else {
				jQuery('#enter').attr('disabled', '');
			}
		};

		interval = setInterval(enterMoveCamera, 200);
	}

	function enter() {
		entered = true;
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_indoors').localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_indoors').localMatrix);
		viewpoint.fov = 60;
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					lightTheFire();
				}
			});
		
		hemi.world.camera.moveToView(viewpoint, 60);
	}

	function lightTheFire() {
		fire.show();
		
		setTimeout(function() {
			var animation = hemi.animation.createModelAnimation(house, 0, 60);
			animation.start();
		}, 2000);
	}

	jQuery(window).load(function() {
		bindJavascript();
		o3djs.util.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();