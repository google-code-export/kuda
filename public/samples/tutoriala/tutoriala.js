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
(function() {
	var house;
	var window1Left;
	var window1Right;
	var door;
	var interval;
	var enterMoveCamera;
	var entered = false;
	var client;

	function init() {
		bindJavascript();
		client = hemi.makeClients()[0];
		client.setBGColor(0xb2cbff, 1);
		hemi.loadPath = '../../';
		house = new hemi.Model(client.scene);
		house.setFileName('assets/house_v12/house_v12.dae');
		hemi.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		hemi.ready();
	}

	function bindJavascript() {
		jQuery('#enterForm').submit(function() {
			return false;
		});
		jQuery('#enter').click(enter);
		jQuery('#enter').attr('disabled', 'disabled');
	}

	function setupScene() {
		var stuff = house.getObject3Ds('SO_door')[0];
		house.getObject3Ds('SO_door')[0].visible = false;
		house.getObject3Ds('SO_window1sashLeft')[0].visible = false;
		house.getObject3Ds('SO_window1sashRight')[0].visible = false;
		house.getObject3Ds('camEye_outdoors')[0].visible = false;
		house.getObject3Ds('camEye_indoors')[0].visible = false;
		house.getObject3Ds('camTarget_outdoors')[0].visible = false;
		house.getObject3Ds('camTarget_indoors')[0].visible = false;
		house.getObject3Ds('camEye_outdoors')[0].isPickable = false;
		house.getObject3Ds('camEye_indoors')[0].isPickable = false;;
		house.getObject3Ds('camTarget_outdoors')[0].isPickable = false;;
		house.getObject3Ds('camTarget_indoors')[0].isPickable = false;;

		client.camera.fixEye();
		client.camera.setLookAroundLimits(null, null, -50 * hemi.DEG_TO_RAD,
			50 * hemi.DEG_TO_RAD);
		client.camera.enableControl();

		door = new hext.house.Door(house.getObject3Ds('door')[0]);
		door.angle = -door.angle;
		door.onPick(function(msg) {
			switch (msg.data.pickedMesh.name) {
				case 'SO_door':
				case 'door':
					door.swing();
					enterMoveCamera();
				break;
			}
		});

		window1Left = new hext.house.Window(house.getObject3Ds('window1_sashLeft')[0],[0,60,0]);
		window1Left.onPick(function(msg) {
			switch (msg.data.pickedMesh.name) {
				case 'SO_window1sashLeft':
				case 'window1_sashLeft':
					window1Left.slide();
					enterMoveCamera();
				break;
			}
		});
	
		window1Right = new hext.house.Window(house.getObject3Ds('window1_sashRight')[0],[0,60,0]);
		window1Right.onPick(function(msg) {
			switch (msg.data.pickedMesh.name) {
				case 'SO_window1sashRight':
				case 'window1_sashRight':
					window1Right.slide();
					enterMoveCamera();
				break;
			}
		});	
		
		var viewpoint = new hemi.Viewpoint();
		viewpoint.eye = house.getObject3Ds('camEye_outdoors')[0].position.clone();
		viewpoint.target = house.getObject3Ds('camTarget_outdoors')[0].position.clone();
		viewpoint.fov = 60 * hemi.DEG_TO_RAD;
		client.camera.moveToView(viewpoint, 2.5);
		// Use a simple function to track when the windows and door are open to allow entering the house per the script.
		enterMoveCamera = function() {
			if (door.closed || window1Right.closed || window1Left.closed || entered) {
				jQuery('#enter').attr('disabled', 'disabled');
			} else {
				jQuery('#enter').removeAttr('disabled');
			}
		};
	}

	function enter() {
		try {
			console.log.apply(console, [ "Enter button clicked" ]);
		} catch(e) { }

		entered = true;
		var viewpoint = new hemi.Viewpoint();
		viewpoint.eye = house.getObject3Ds('camEye_indoors')[0].position.clone();
		viewpoint.target = house.getObject3Ds('camTarget_indoors')[0].position.clone();
		viewpoint.fov = 60 * hemi.DEG_TO_RAD;
		client.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					lightTheFire();
				}
			});
		enterMoveCamera();
		client.camera.moveToView(viewpoint, 2.5);
	}

	function lightTheFire() {
		try {
			console.log.apply(console, ["Light the fire"]);
		} catch(e) { }

		var colorRamp = 
			[1, 1, 0, 0.6,
			 1, 0, 0, 0.6,
			 0, 0, 0, 1,
			 0, 0, 0, 0.5,
			 0, 0, 0, 0];
		var params = {
			numParticles: 20,
			lifeTime: 1.1,
			timeRange: 1,
			startSize: 55,
			startSizeRange : 20,
			endSize: 1,
			endSizeRange: 1,
			velocity:[0, 55, 0],
			velocityRange: [10.1, 9.7, 10.3],
			acceleration: [0, -1, 0],
			positionRange : [3.6, 2, 3.4],
			spinSpeedRange: 4
		};
		var fire = hemi.createParticleEmitter(client, colorRamp, params);
		fire.transform.position.set(0.0, 72.0, -236.0);

		// Per the script start the book animation curve 2 seconds after the fire is lit.
		setTimeout(function() {
			var animation = new hemi.AnimationGroup(0, 60, house);
			var triggerTime = hemi.getTimeOfFrame(30);
			animation.subscribe(hemi.msg.animate, function(msg) {
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
		init();
	});
})();