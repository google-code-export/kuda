/**
 * This is Tutorial A using Kuda 1.0.  It shows how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.  The script called for the user interactions on the door
 *		and windows.  The door and windows are click enabled and open.  The
 *		script then called for allowing the user to select a button to enter
 *		the house and see a fire.  After the fire is on a book will animate on
 *		a curve in 2 seconds.
 */
o3djs.require('o3djs.util');
o3djs.require('hemi.animation');
o3djs.require('hemi.motion');
o3djs.require('hemi.effect');
o3djs.require('hext.house.structure');

(function() {
	var house;
	var window1Left;
	var window1Right;
	var door;
	var interval;
	var enterMoveCamera;
	var entered = false;

	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		house = new hemi.model.Model();
		house.setFileName('assets/house_v12.o3dtgz');
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
				bindJavascript();
			});
		hemi.world.ready();
	}

	function bindJavascript() {
		jQuery('#enterForm').submit(function() {
			return false;
		});
		jQuery('#enter').click(enter);
		jQuery('#enter').attr('disabled', 'disabled');

		var o3dElem = jQuery('#o3d');
		var iframeBtn = jQuery('#iframeBased');
		var divBtn = jQuery('#divBased');
		var children = hemi.core.client.root.children;

		o3dElem.data('oldHeight', o3dElem.height());
		iframeBtn.click(function(evt) {
			var elem = jQuery(this);
			var showing = elem.data('showing');
			var iframe = jQuery('#videoOverlay');

			if (!showing) {
				iframe.show();
				divBtn.attr('disabled', 'disabled');
			}
			else {
				iframe.hide();
				divBtn.removeAttr('disabled');
			}

			elem.data('showing', !showing);
		}).data('showing', false);

		divBtn.click(function(evt) {
			var elem = jQuery(this);
			var showing = elem.data('showing');
			var oldHeight = o3dElem.data('oldHeight');
			var div = jQuery('#divOverlay');
			var filler = jQuery('#fillerDiv');

			if (!showing) {
				filler.show();
				o3dElem.height(1);
				div.show();
				iframeBtn.attr('disabled', 'disabled');

				// Hide the currently rendered tree
				for (var ndx = 0; ndx < children.length; ndx++) {
					children[ndx].parent = null;
				}
			} else {
				filler.hide();
				o3dElem.height(oldHeight);
				div.hide();
				iframeBtn.removeAttr('disabled');

				// Restore the render tree
				for (var ndx = 0; ndx < children.length; ndx++) {
					children[ndx].parent = hemi.core.client.root;
				}
			}

			elem.data('showing', !showing);
		}).data('showing', false);
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

		hemi.world.camera.fixEye();
		hemi.world.camera.setLookAroundLimits(null, null, -50, 50);
		hemi.world.camera.enableControl();

		door = new hext.house.Door(house.getTransform('door'));
		door.angle = -door.angle;
		door.onPick(function(msg) {
			switch (msg.data.pickInfo.shapeInfo.parent.transform.name) {
				case 'SO_door':
				case 'door':
					door.swing();
					enterMoveCamera();
				break;
			}
		});
		
		window1Left = new hext.house.Window(house.getTransform('window1_sashLeft'),[0,60,0]);
		window1Left.onPick(function(msg) {
			switch (msg.data.pickInfo.shapeInfo.parent.transform.name) {
				case 'SO_window1sashLeft':
				case 'window1_sashLeft':
					window1Left.slide();
					enterMoveCamera();
				break;
			}
		});
	
		window1Right = new hext.house.Window(house.getTransform('window1_sashRight'),[0,60,0]);
		window1Right.onPick(function(msg) {
			switch (msg.data.pickInfo.shapeInfo.parent.transform.name) {
				case 'SO_window1sashRight':
				case 'window1_sashRight':
					window1Right.slide();
					enterMoveCamera();
				break;
			}
		});	
		
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_outdoors').localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_outdoors').localMatrix);
		viewpoint.fov = 60;
		hemi.world.camera.moveToView(viewpoint, 60);
		// Use a simple function to track when the windows and door are open to allow entering the house per the script.
		enterMoveCamera = function() {
			if (door.closed || window1Right.closed || window1Left.closed || entered) {
				jQuery('#enter').attr('disabled', 'disabled');
			} else {
				jQuery('#enter').attr('disabled', '');
			}
		};
	}

	function enter() {
		try {
			console.log.apply(console, [ "Enter button clicked" ]);
		} catch(e) { }

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
		enterMoveCamera();
		hemi.world.camera.moveToView(viewpoint, 60);
	}

	function lightTheFire() {
		try {
			console.log.apply(console, ["Light the fire"]);
		} catch(e) { }

		var fire = hemi.effect.createFire();
		fire.transform.translate(0.0, 72.0, -236.0);
		fire.show();

		// Per the script start the book animation curve 2 seconds after the fire is lit.
		setTimeout(function() {
			var animation = hemi.animation.createModelAnimation(house, 0, 60);
			var triggerTime = hemi.view.getTimeOfFrame(30);
			house.subscribe(hemi.msg.animate, function(msg) {
				var time = msg.data.time;
				var prev = msg.data.previous;

				if (triggerTime > prev && triggerTime < time) {
					try {
						console.log.apply(console, ["Half way through the animation"]);
					} catch(e) { }
				}
			});
			animation.start();
		}, 2000);
	}

	jQuery(window).load(function() {
		o3djs.util.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();