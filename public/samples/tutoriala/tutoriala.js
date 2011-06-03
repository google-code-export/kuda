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
 * This is Tutorial A using Kuda 1.0.  It shows how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.  The script called for the user interactions on the door
 *		and windows.  The door and windows are click enabled and open.  The
 *		script then called for allowing the user to select a button to enter
 *		the house and see a fire.  After the fire is on a book will animate on
 *		a curve in 2 seconds.
 */
o3djs.require('o3djs.util');
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
		bindJavascript();
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		hemi.loader.loadPath = '../../';
		house = new hemi.model.Model();
		house.setFileName('assets/house_v12/scene.json');
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

		var hMath = hemi.core.math;
		hemi.world.camera.fixEye();
		hemi.world.camera.setLookAroundLimits(null, null, hemi.core.math.degToRad(-50),
			hemi.core.math.degToRad(50));
		hemi.world.camera.enableControl();

		door = new hext.house.Door(house.getTransforms('door')[0]);
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

		window1Left = new hext.house.Window(house.getTransforms('window1_sashLeft')[0],[0,60,0]);
		window1Left.onPick(function(msg) {
			switch (msg.data.pickInfo.shapeInfo.parent.transform.name) {
				case 'SO_window1sashLeft':
				case 'window1_sashLeft':
					window1Left.slide();
					enterMoveCamera();
				break;
			}
		});
	
		window1Right = new hext.house.Window(house.getTransforms('window1_sashRight')[0],[0,60,0]);
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
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransforms('camEye_outdoors')[0].localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransforms('camTarget_outdoors')[0].localMatrix);
		viewpoint.fov = hemi.core.math.degToRad(60);
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
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransforms('camEye_indoors')[0].localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransforms('camTarget_indoors')[0].localMatrix);
		viewpoint.fov = hemi.core.math.degToRad(60);
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
		o3djs.webgl.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();