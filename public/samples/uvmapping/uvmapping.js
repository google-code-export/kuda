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
 * This is a simple hello world, showing how to set up a simple world, 
 *		load a model, and set the camera to a viewpoint once the model
 *		has loaded.
 */
(function() {

	
	var client,
		spriteRMat;
		
	function createWorld() {
		ticker = new hemi.Model(client);			// Create a new Model
		ticker.setFileName('assets/DigitalDisplay/DigitalDisplay.dae');	// Set the model file
		hemi.loadTexture('assets/images/dino.png', function(texture) {
			spriteRMat = new THREE.MeshBasicMaterial({ map: texture });
		});
		/**
		 * When we call the 'ready' function, it will wait for the model to
		 *		finish loading and then it will send out a Ready message. Here
		 *		we register a handler, setupScene(), to be run when the message
		 *		is sent.
		 */
		hemi.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		
		hemi.ready();   // Indicate that we are ready to start our script
	};
	
	function setupScene(house) {
		var vp = new hemi.Viewpoint();							// Create a new Viewpoint
		vp.eye = new THREE.Vector3(0, 0, 100);					// Set viewpoint eye
		vp.target = new THREE.Vector3(0, -25, 0);				// Set viewpoint targetget

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 120
		 *		render cycles (~2 seconds) to do so.
		 */
		client.camera.moveToView(vp, 2.5);
		client.camera.enableControl();							// Enable camera mouse control

        client.useCameraLight(false);               // Remove camera light to prevent it from washing out counter

        new hemi.Light(client, new THREE.AmbientLight(0xFFFFFF));

		var spriteR = hemi.createShape({
			shape: 'plane',
			material: spriteRMat,
			height: 29,
			width: 29 });
		spriteRMat.map.wrapS = spriteRMat.map.wrapT = THREE.RepeatWrapping;
		spriteR.rotation.x = Math.PI / -16;
		spriteR.position.x -= 50;
		spriteR.position.y -= 40;
		spriteR.updateMatrix();
		client.scene.add(spriteR);

		var spriteT = new hemi.Sprite(client, {
			maps: ['assets/images/dino.png'],
			useScreenCoordinates: false
		});
		spriteT.map.wrapS = spriteT.map.wrapT = THREE.RepeatWrapping;
		spriteT.scale.set(0.15, 0.15);
		spriteT.run(-1);
		spriteT.translateY(-40);
		spriteT.updateMatrix();

		var spriteS = new hemi.Sprite(client, {
			maps: ['assets/images/dino.png'],
			useScreenCoordinates: false
		});
		spriteS.map.wrapS = spriteS.map.wrapT = THREE.RepeatWrapping;
		spriteS.scale.set(0.15, 0.15);
		spriteS.run(-1);
		spriteS.translateX(50);
		spriteS.translateY(-40);
		spriteS.updateMatrix();

		var frame = 0;
		var tickCounts = [0,0,0,0,0,0,0,0,0,0];
		var tickOrder = [1,7,5,4,2,8,3,6,9];

		hemi.input.addKeyDownListener({
			onKeyDown: function(e) {
				if (e.keyCode === 32) {
					hemi.utils.rotateUVs(spriteR.geometry, Math.PI/24);
					spriteT.uvOffset.x = spriteT.uvOffset.y += 1/24;
					if (frame < 6 || frame >= 18) {
						spriteS.uvScale.multiplyScalar(7/6);
					} else {
						spriteS.uvScale.multiplyScalar(6/7);
					}
					if (++frame === 24) frame = 0;
				} else if (e.keyCode === 38) {
					incrementTicker(0, 1);
				} else if (e.keyCode === 40) {
					incrementTicker(0, -1);
				}
			}
		});

		function incrementTicker(ndx, tick) {
			var rollover = false;

			hemi.utils.translateUVs(ticker.geometries[ndx], tick * 0.1, 0);
			tickCounts[ndx] = (tickCounts[ndx] + tick) % 10;

			if (tickCounts[ndx] < 0) {
				tickCounts[ndx] = 9;
			}
			if ((tickCounts[ndx] === 0 && tick === 1) || (tickCounts[ndx] === 9 && tick === -1)) {
				rollover = true;
			}
			if (rollover && ndx < 9) {
				incrementTicker(tickOrder[ndx], tick);
			}
		};

	}

	window.onload = function() {
		/**
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		client = hemi.makeClients()[0];
		
		/**
		 * Set the background color to a dark red. The parameters are a hex
		 * 		code for the RGB values and an alpha value between 0 and 1.
		 */
		client.setBGColor(0xbb0000, 1);
		
		/**
		 * Set a prefix for the loader that will allow us to load assets as if
		 * the helloWorld.html file was in the root directory.
		 */
		hemi.loadPath = '../../';
		
		createWorld();
	};
})();
