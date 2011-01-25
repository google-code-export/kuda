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
	o3djs.require('o3djs.util');
	o3djs.require('hemi.fx');
	o3djs.require('hemi.texture');

	var ticker;
	
	function init(clientElements) {
		/**
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		hemi.core.init(clientElements[0]);	

		/**
		 * Set the background color to a light-bluish. The parameter is in
		 * 		the form [red,blue,green,alpha], with each value on a 
		 *		scale of 0-1.
		 */
		hemi.view.setBGColor([0.7, 0, 0, 1]);
		createWorld();
	}

	function createWorld() {
	
		ticker = new hemi.model.Model();				// Create a new Model
		ticker.setFileName('assets/DigitalDisplay/scene.json');	// Set the model file
	
		/**
		 * When we call the world's 'ready' function, it will wait for the model
		 *		to finish loading and then it will send out a Ready message.
		 *		Here we register a handler, setupScene(), to be run when the
		 *		message is sent.
		 */
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {
				setupScene();
			});
		
		hemi.world.ready();   // Indicate that we are ready to start our script
	}

	function setupScene() {
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [0,0,100];					// Set viewpoint eye
		vp.target = [0,-25,0];					// Set viewpoint target

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 1
		 *		second to do so
		 */
		hemi.world.camera.moveInSeconds();
		hemi.world.camera.moveToView(vp,1);
		hemi.world.camera.enableControl();	// Enable camera mouse control
		
		var spriteR = new hemi.sprite.Sprite(40,40);
		spriteR.addFrame('assets/images/dino.png');
		spriteR.parent(hemi.core.client.root);
		spriteR.run(-1);
		spriteR.transform.translate(-50,-40,0);
		var elemR = spriteR.transform.shapes[0].elements[0];

		var spriteT = new hemi.sprite.Sprite(40,40);
		spriteT.addFrame('assets/images/dino.png');
		spriteT.parent(hemi.core.client.root);
		spriteT.run(-1);
		spriteT.transform.translate(0,-40,0);
		var elemT = spriteT.transform.shapes[0].elements[0];
		
		var spriteS = new hemi.sprite.Sprite(40,40);
		spriteS.addFrame('assets/images/dino.png');
		spriteS.parent(hemi.core.client.root);
		spriteS.run(-1);
		spriteS.transform.translate(50,-40,0);
		var elemS = spriteS.transform.shapes[0].elements[0];

		var frame = 0;
		var tickCounts = [0,0,0,0,0,0,0,0,0,0];
		var tickOrder = [1,7,5,4,2,8,3,6,9];
		
		hemi.input.addKeyDownListener({onKeyDown:function(e){
			if (e.keyCode == 32) {
				hemi.texture.rotate(elemR,Math.PI/24);
				hemi.texture.translate(elemT,1/24,1/24);
				if (frame < 6 || frame >= 18) { 
					hemi.texture.scale(elemS,7/6,7/6);
				} else {
					hemi.texture.scale(elemS,6/7,6/7);
				}
				frame++;
				if (frame == 24) frame = 0;
			} else if (e.keyCode == 38) {
				incrementTicker(0,1);
			} else if (e.keyCode == 40) {
				incrementTicker(0,-1);
			}
		}});	
		
		function incrementTicker(ndx,tick) {
			var rollover = false;
			hemi.texture.translate(ticker.shapes[ndx].elements[0],0.1*tick,0);
			tickCounts[ndx] = (tickCounts[ndx] + tick)%10;
			if (tickCounts[ndx] < 0) tickCounts[ndx] = 9;
			if ((tickCounts[ndx] == 0 && tick == 1) || (tickCounts[ndx] == 9 && tick == -1)) {
				rollover = true;
			}
			if (rollover && ndx < 9) {
				incrementTicker(tickOrder[ndx],tick);
			}
		};

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
