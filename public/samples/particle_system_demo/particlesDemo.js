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
 * This is a demo to show how to use the Kuda particle system, built on 
 *		top of the hello world demo.
 */
(function() {
	
	var client;
		
	function createWorld() {

		/**
		 * hemi.world is the default world created to manage all of our models,
		 *		cameras, effects, etc. When we set the model's file name, it
		 *		will begin loading that file.
		 */
		var house = new hemi.Model(client);				// Create a new Model
		house.setFileName('assets/house_v12/house_v12.dae'); // Set the model file
		
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
		var vp = new hemi.Viewpoint();		// Create a new Viewpoint
		vp.eye = new THREE.Vector3(-10, 800, 1800);					// Set viewpoint eye
		vp.target = new THREE.Vector3(10, 250,30);					// Set viewpoint targetget

		/**
		 * Move the camera from it's default position (eye : [0,0,-1],
		 *		target : [0,0,0]} to the new viewpoint, and take 120
		 *		render cycles (~2 seconds) to do so.
		 */
		client.camera.moveToView(vp, 2.5);
		client.camera.enableControl();	// Enable camera mouse control
		
		/* The bounding boxes which the arrows will flow through:
		 * Spawn from a small one to the lower left, flow through a 
		 * large box in the upper left, go through a small bottleneck
		 * directly above the house, spread out through another larfe
		 * box in the upper right, then converge on a small box in the
		 * bottom right.
		 */
		var box1 = new hemi.curve.Box([-510,-110,-10],[-490,-90,10]);
		var box2 = new hemi.curve.Box([-600,400,-200],[-400,600,0]);
		var box3 = new hemi.curve.Box([-10,790,180],[10,810,200]);
		var box4 = new hemi.curve.Box([400,450,-300],[600,650,-100]);
		var box5 = new hemi.curve.Box([490,-110,-10],[510,-90,10]);
		
		/* The colors these arrows will be as they move through:
		 * Start out yellow and transparent, then turn red and opaque,
		 * quickly turn to blue, then fade to black and transparent.
		 */
		var colorKey1 = {key: 0, value: [1,1,0,0.2]};
		var colorKey2 = {key: 0.45, value: [1,0,0,1]};
		var colorKey3 = {key: 0.55, value: [0,0,1,1]};
		var colorKey4 = {key: 1, value: [0,0,0,0.2]};
		
		/* The scale of the arrows as they move through:
		 * Start out infinitesimal, then grow to a decent size,
		 * kind of stretched out, then shrink away again.
		 */
		var scale1 = [1,1,1];
		var scale2 = [4,8,4];
		var scale3 = [1,1,1];
		
		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var particleSystemConfig = {
			aim : true,
			particleCount : 100,
			life : 5,
			boxes : [box1, box2, box3, box4, box5],
			particleShape : hemi.curve.ShapeType.ARROW,
			colorKeys : [colorKey1, colorKey2, colorKey3, colorKey4],
			scales : [scale1, scale2, scale3],
			particleSize: 4
		};
		
		/* Create the particle system with the above config, 
		 * and make the root transform its parent.
		 */
		var particleSystem = hemi.createCurveSystem(client, particleSystemConfig);
		theClient = client;
		
		/* Start the particle system off with no particles generating */
		particleSystem.setRate(0);
	
		var showBoxes = false;		// If boxes are being shown
		
		/* Register a keyDown listener:
		 * If a is pressed, increase the particle system rate
		 *		(it starts at the max rate)
		 * If z is pressed, decrease the particle system rate
		 * If space is pressed, toggle the bounding boxes
		 */
		hemi.input.addKeyDownListener({
			onKeyDown : function(event) {
				switch (event.keyCode) {
					case (65):
						particleSystem.changeRate(1);
						break;
					case (90):
						particleSystem.changeRate(-1);
						break;
					case (32):
						if (showBoxes) {
							particleSystem.hideBoxes();
							showBoxes = false;
						} else {
							particleSystem.showBoxes();
							showBoxes = true;
						}
						break;
					default:
				}
			}
		});
		
	};

	window.onload = function() {
		/**
		 * It is possible to have multiple clients (i.e. multiple frames
		 * 		rendering 3d content) on one page that would have to be
		 * 		initialized. In this case, we only want to initialize the
		 *		first one.
		 */
		client = hemi.makeClients()[0];
		
		/**
		 * Set the background color to a light-bluish. The parameters are a hex
		 * 		code for the RGB values and an alpha value between 0 and 1.
		 */
		client.setBGColor(0xb2cbff, 1);
		
		/**
		 * Set a prefix for the loader that will allow us to load assets as if
		 * the helloWorld.html file was in the root directory.
		 */
		hemi.loadPath = '../../';
		
		createWorld();
	};
})();
