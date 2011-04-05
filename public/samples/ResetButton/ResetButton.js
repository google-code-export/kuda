/* 
 * Kuda includes a library and editor for authoring interactive 3D content for the web.
 * Copyright (C) 2011 SRI International.
 *
 * This program is free software; you can redistribute it and/or modify it under the terms
 * of the GNU General Public License as published by the Free Software Foundation; either 
 * version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; 
 * if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 * Boston, MA 02110-1301 USA.
 */

/**
 * This sample is based off of the Tutorial A sample but it shows how to
 * incorporate the Reset extension into your viewer. Be sure to check the HTML
 * file to see important additions made there. Note that the Reset button relies
 * heavily on you adding the necessary callback functions to reset the changes
 * made by your individual script. This can be a fairly difficult task depending
 * on how complex your script is. If you want to include Reset functionality in
 * your viewer, we suggest adding callbacks in steps as you create the script
 * rather than all at once after the script is finished.
 */
(function() {
	o3djs.require('o3djs.util');
	
	// Include the Reset extension
	o3djs.require('hext.html.reset');

	var house;
	var window1Left;
	var window1Right;
	var door;
	var interval;
	var entered = false;
	var fireCallback = null;
	var fire = null;

	function init(clientElements) {
		bindJavascript();
		hemi.core.init(clientElements[0]);	
		hemi.view.setBGColor([1, 1, 1, 1]);
		hemi.loader.loadPath = '../../';
		
		house = new hemi.model.Model();
		house.setFileName('assets/house_v12/scene.json');
		
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
				// Display the Reset button.
				hext.html.reset.show();
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
		house.setTransformVisible(house.getTransforms('SO_door')[0], false);
		house.setTransformVisible(house.getTransforms('SO_window1sashLeft')[0], false);
		house.setTransformVisible(house.getTransforms('SO_window1sashRight')[0], false);
		house.setTransformVisible(house.getTransforms('camEye_outdoors')[0], false);
		house.setTransformVisible(house.getTransforms('camEye_indoors')[0], false);
		house.setTransformVisible(house.getTransforms('camTarget_outdoors')[0], false);
		house.setTransformVisible(house.getTransforms('camTarget_indoors')[0], false);
		house.setTransformPickable(house.getTransforms('camEye_outdoors')[0], false);
		house.setTransformPickable(house.getTransforms('camEye_indoors')[0], false);
		house.setTransformPickable(house.getTransforms('camTarget_outdoors')[0], false);
		house.setTransformPickable(house.getTransforms('camTarget_indoors')[0], false);
		
		door = {
			closed: true,
			rotator: new hemi.motion.Rotator(house.getTransforms('door')[0]),
			swing: function() {
				var direction = this.closed? -1 : 1;

				if (this.rotator.rotate([0, direction * Math.PI / 2.0, 0], 1, true)) {
					this.closed = !this.closed;
				}
			}
		};
		window1Left = {
			closed: true,
			translator: new hemi.motion.Translator(house.getTransforms('window1_sashLeft')[0]),
			slide: function() {
				var direction = this.closed? 1 : -1;

				if (this.translator.move([0, direction * 60, 0], 1, true)) {
					this.closed = !this.closed;
				}
			}
		};
		window1Right = {
			closed: true,
			translator: new hemi.motion.Translator(house.getTransforms('window1_sashRight')[0]),
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
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransforms('camEye_outdoors')[0].localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransforms('camTarget_outdoors')[0].localMatrix);
		viewpoint.fov = hemi.core.math.degToRad(60);
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
		
		// Now we define a callback to reset the changes made in this function. 
		hext.html.reset.addCallback(function() {
			// First make sure the doors and windows are closed (since that is
			// how they start off).
			if (!door.closed) {
				door.swing();
			}
			if (!window1Left.closed) {
				window1Left.slide();
			}
			if (!window1Right.closed) {
				window1Right.slide();
			}
			// If the user entered the house, reset the interval since it would
			// have been cleared.
			if (entered) {
				entered = false;
				interval = setInterval(enterMoveCamera, 200);
			}
			// Move the Camera to its initial viewpoint.
			hemi.world.camera.moveToView(viewpoint, 60);
		});
	}

	function enter() {
		entered = true;
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransforms('camEye_indoors')[0].localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransforms('camTarget_indoors')[0].localMatrix);
		viewpoint.fov = hemi.core.math.degToRad(60);
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					lightTheFire();
				}
			});
		hemi.world.camera.moveToView(viewpoint, 60);
	}

	function lightTheFire() {
		// Since lightTheFire() could be called more than once, let's make sure
		// that this reset callback only gets added once.
		if (fireCallback == null) {
			fireCallback = function() {
				fire.hide();
			};
			
			hext.html.reset.addCallback(fireCallback);
		}
		
		fire.show();
		
		setTimeout(function() {
			var animation = hemi.animation.createModelAnimation(house, 0, 60);
			animation.start();
			// Since a new Animation is created each time, we need to define a
			// new callback each time. Giving the function a name
			// (ResetAnimation)  allows us to refer to it in the remove call.
			hext.html.reset.addCallback(function ResetAnimation() {
				// Stop the Animation if it is currently running.
				animation.stop();
				// Reset the House to its initial keyframe.
				house.setAnimationTime(0);
				// Remove this callback since a new one will be added for the
				// new Animation object that will be created.
				hext.html.reset.removeCallback(ResetAnimation);
			});
		}, 2000);
	}

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();