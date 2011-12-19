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

	
	var client;
		
	function createWorld() {
//		ticker = new hemi.Model(client.scene);			// Create a new Model
//		ticker.setFileName('assets/DigitalDisplay/scene.json');	// Set the model file
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
				
		var spriteR = new hemi.Sprite(client, {
			maps: ['../../assets/images/dino.png']
		});
		spriteR.run(-1);
		spriteR.translateX(200);
		spriteR.translateY(200);

		var spriteT = new hemi.Sprite(client, {
			maps: ['../../assets/images/dino.png']
		});
		spriteT.run(-1);
		spriteT.translateX(600);
		spriteT.translateY(200);
		
		var spriteS = new hemi.Sprite(client, {
			maps: ['../../assets/images/dino.png']
		});
		spriteS.run(-1);
		spriteS.translateX(1000);
		spriteS.translateY(200);

		var frame = 0;
		var tickCounts = [0,0,0,0,0,0,0,0,0,0];
		var tickOrder = [1,7,5,4,2,8,3,6,9];
		
		hemi.input.addKeyDownListener({onKeyDown:function(e){
			if (e.keyCode == 32) {
				spriteR.rotation += Math.PI/24;
				spriteT.uvOffset.addSelf(new THREE.Vector2(1/24,1/24));
				if (frame < 6 || frame >= 18) { 
					spriteS.scale.set(7/6,7/6);
				} else {
					spriteS.scale.set(6/7,6/7);
				}
				frame++;
				if (frame == 24) {
					frame = 0;
					spriteT.uvOffset.set(0, 0);
				}
			} else if (e.keyCode == 38) {
//				incrementTicker(0,1);
			} else if (e.keyCode == 40) {
//				incrementTicker(0,-1);
			}
		}});	
		
//		function incrementTicker(ndx,tick) {
//			var rollover = false;
//			hemi.texture.translate(ticker.shapes[ndx].elements[0],0.1*tick,0);
//			tickCounts[ndx] = (tickCounts[ndx] + tick)%10;
//			if (tickCounts[ndx] < 0) tickCounts[ndx] = 9;
//			if ((tickCounts[ndx] == 0 && tick == 1) || (tickCounts[ndx] == 9 && tick == -1)) {
//				rollover = true;
//			}
//			if (rollover && ndx < 9) {
//				incrementTicker(tickOrder[ndx],tick);
//			}
//		};

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
