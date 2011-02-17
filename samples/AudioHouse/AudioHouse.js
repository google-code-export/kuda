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
 * The Audio House demo shows how to incorporate audio media into a 3D model
 * like the Tutorial A house. The door and windows now make sound effects when
 * a user opens or closes them. The fireplace has a sound effect that increases
 * and decreases in volume depending on if windows and doors or open or if the
 * user has entered the house.
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
	var audio;

	function init(clientElements) {
		bindJavascript();
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 1, 1]);
		house = new hemi.model.Model();
		house.setFileName('assets/house_v12/scene.json');
		
		audio = {
			door: new hemi.audio.Audio(),
			fireplace: new hemi.audio.Audio(),
			winLeft: new hemi.audio.Audio(),
			winRight: new hemi.audio.Audio(),
			init: function() {
				// Since browsers don't all support the same formats, we add a
				// URL for both an MP3 and an OGG version of each audio.
				this.door.addUrl('assets/audio/door.mp3', 'mp3');
				this.door.addUrl('assets/audio/door.ogg', 'ogg');
				this.fireplace.addUrl('assets/audio/fireplace.mp3', 'mp3');
				this.fireplace.addUrl('assets/audio/fireplace.ogg', 'ogg');
				this.winLeft.addUrl('assets/audio/window.mp3', 'mp3');
				this.winLeft.addUrl('assets/audio/window.ogg', 'ogg');
				this.winRight.addUrl('assets/audio/window.mp3', 'mp3');
				this.winRight.addUrl('assets/audio/window.ogg', 'ogg');
				return this;
			}
		}.init();
		this.audio = audio;
		
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

		var hMath = hemi.core.math;
		hemi.world.camera.fixEye();
		hemi.world.camera.setLookAroundLimits(null, null, hMath.degToRad(-50),
			hMath.degToRad(50));
		hemi.world.camera.enableControl();
		
		var fire = hemi.effect.createFire();
		fire.transform.translate(0.0, 72.0, -236.0);
		fire.show();

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
		door.onClosing(function() {
			audio.door.seek(4.3);
			audio.door.play();
			setFireVolume();
		});
		door.onClosed(function() {
			// Visually it just looks better if we let the sound play a little
			// longer.
			setTimeout(function() {
				audio.door.pause();
			}, 200);
		});
		door.onOpening(function() {
			audio.door.seek(0.4);
			audio.door.play();
			setFireVolume();
		});
		door.onOpen(function() {
			setTimeout(function() {
				audio.door.pause();
			}, 200);
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
		window1Left.onClosing(function() {
			audio.winLeft.seek(0.7);
			audio.winLeft.play();
			setFireVolume();
		});
		window1Left.onClosed(function() {
			setTimeout(function() {
				audio.winLeft.pause();
			}, 200);
		});
		window1Left.onOpening(function() {
			audio.winLeft.seek(0);
			audio.winLeft.play();
			setFireVolume();
		});
		window1Left.onOpen(function() {
			audio.winLeft.pause();
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
		window1Right.onClosing(function() {
			audio.winRight.seek(0.7);
			audio.winRight.play();
			setFireVolume();
		});
		window1Right.onClosed(function() {
			setTimeout(function() {
				audio.winRight.pause();
			}, 200);
		});
		window1Right.onOpening(function() {
			audio.winRight.seek(0);
			audio.winRight.play();
			setFireVolume();
		});
		window1Right.onOpen(function() {
			audio.winRight.pause();
		});
		
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_outdoors').localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_outdoors').localMatrix);
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
		setFireVolume();
		// We want the fire sound effect to play continuously.
		audio.fireplace.setLoop(true);
		audio.fireplace.play();
	}
	
	function setFireVolume() {
		// Set the volume of the fire based upon how many doors/windows are open
		// and if the user has moved next to it. This gives a spatial effect.
		var volume = 0.05;
		
		if (!door.closed) {
			volume += 0.2;
		}
		if (!window1Left.closed) {
			volume += 0.2;
		}
		if (!window1Right.closed) {
			volume += 0.2;
		}
		if (entered) {
			volume += 0.35;
		}
		
		audio.fireplace.setVolume(volume);
	}

	function enter() {
		entered = true;
		var viewpoint = new hemi.view.Viewpoint();
		viewpoint.eye = hemi.core.math.matrix4.getTranslation(house.getTransform('camEye_indoors').localMatrix);
		viewpoint.target = hemi.core.math.matrix4.getTranslation(house.getTransform('camTarget_indoors').localMatrix);
		viewpoint.fov = hemi.core.math.degToRad(60);
		hemi.world.camera.subscribe(hemi.msg.stop,
			function(msg) {
				if (msg.data.viewpoint === viewpoint) {
					floatBook();
				}
			});
		enterMoveCamera();
		hemi.world.camera.moveToView(viewpoint, 60);
		setFireVolume();
	}

	function floatBook() {
		var animation = hemi.animation.createModelAnimation(house, 0, 60);
		animation.start();
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