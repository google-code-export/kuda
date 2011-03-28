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
 * incorporate the Hint extension into your viewer. Be sure to check the HTML
 * file to see important additions made there. The main task with using the Hint
 * feature is to make sure the current Hint message is relevant to the state of
 * the World or part of the script the user is at. If at any point there is no
 * relevant hint, you can hide the Hint button and show it later.
 */
(function() {
	o3djs.require('o3djs.util');
	
	// Include the Hint extension
	o3djs.require('hext.html.hint');

	var house;
	var window1Left;
	var window1Right;
	var door;
	var interval;
	var fire;
	var entered = false;
	var timeoutId = null;

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
				// First set the appropriate Hint message.
				updateHintMessage();
				// Then display the Hint button.
				hext.html.hint.show();
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
			rotator: new hemi.motion.Rotator(house.getTransform('door')),
			swing: function() {
				var direction = this.closed? -1 : 1;

				if (this.rotator.rotate([0, direction * Math.PI / 2.0, 0], 1, true)) {
					this.closed = !this.closed;
				}
				
				updateHintMessage();
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
				
				updateHintMessage();
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
				
				updateHintMessage();
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
	}

	function enter() {
		entered = true;
		updateHintMessage();
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_indoors').localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_indoors').localMatrix);
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
		fire.show();
		
		setTimeout(function() {
			var animation = hemi.animation.createModelAnimation(house, 0, 60);
			animation.start();
		}, 2000);
	}
	
	/*
	 * Update the Hint message to be relevant to the situation the user is
	 * currently in.
	 */
	function updateHintMessage() {
		// The user performed an action so go ahead and clear the countdown
		// since the last action.
		if (timeoutId != null) {
			clearTimeout(timeoutId);
		}
		
		var message = [];
		
		// If any of the door/windows are closed, notify the user. If more than
		// one is closed, this will create a multi-page hint.
		if (door.closed) {
			message.push("You should try opening the door.");
		}
		if (window1Left.closed) {
			message.push("You should try opening the left window.");
		}
		if (window1Right.closed) {
			message.push("You should try opening the right window.");
		}
		
		if (message.length == 0) {
			// If all the door/windows are open, we just need to know if the
			// user has entered the house or not.
			if (entered) {
				message.push("You've completed the scenario!");
			} else {
				message.push("The 'Enter' button is enabled, try pushing it.");
			}
		}
		
		hext.html.hint.setMessage(message);
		// If the user does not perform a relevant action within 5 seconds, go
		// ahead and display the hint even if they haven't clicked the button.
		timeoutId = setTimeout(function() {
			hext.html.hint.displayMessage();
		}, 5000);
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