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
	
o3djs.require('hext.progressUI.progressBar');

/**
 * This is a demo to show how to use the Kuda particle system, built on 
 *		top of the hello world demo.
 */
(function() {
	function init(clientElements) {
		hemi.core.init(clientElements[0]);
		hemi.view.setBGColor([1, 1, 0.7, 1]);
		hemi.loader.loadPath = '../../';
		createWorld();
	};
	
	function createWorld() {
		// instantiate the progress bar
		var pBar = new hext.progressUI.bar();
		var house = new hemi.model.Model();				// Create a new Model
		house.setFileName('assets/house_v12/scene.json'); // Set the model file
		
		hemi.world.subscribe(hemi.msg.ready,
			function(msg) {	
				setupScene(house);
			});
		
		hemi.world.ready();
	};
	
	function setupScene(house) {
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [-10,800,1800];					// Set viewpoint eye
		vp.target = [10,250,30];					// Set viewpoint target

		hemi.world.camera.moveToView(vp,60);
		
		hemi.world.camera.enableControl();	// Enable camera mouse control
		
		/*
		 * The bounding boxes which the arrows will flow through:
		 */
		var box1 = [[-510,-110,-10],[-490,-90,10]];
		var box2 = [[-600,400,-200],[-400,600,0]];
		var box3 = [[-10,790,180],[10,810,200]];
		var box4 = [[400,450,-300],[600,650,-100]];
		var box5 = [[490,-110,-110],[510,-90,-90]];
		var box6 = [[-30,140,-560],[30,260,-440]];
		var box7 = [[-310,490,-10],[110,510,10]];
		var box8 = [[90,190,590],[110,210,610]];
		var box9 = [[-250,-250,270],[-150,-150,330]];
		
		/*
		 * The colors these arrows will be as they move along the curve:
		 */
		var blue = [0, 0, 1, 0.7];
		var green = [0, 1, 0, 0.7];
		var red = [1, 0, 0, 0.7];
		
		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var systemConfig = {
			fast: true,
			aim: true,
			trail: true,
			particleCount: 500,
			life: 12,
			boxes: [box1,box2,box3,box4,box5,box6,box7,box8,box9,box1],
			particleShape: hemi.curve.ShapeType.ARROW,
			colors: [blue,green,red,blue],
			particleSize: 10
		};
		
		/* Create the particle system with the above config, 
		 * and make the root transform its parent.
		 */
		var particleSystem = hemi.curve.createSystem(systemConfig);
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
					case (32):
						if (showBoxes) {
							hemi.curve.hideBoxes();
							showBoxes = false;
						} else {
							hemi.curve.showBoxes(particleSystem.boxes);
							showBoxes = true;
						}
						break;
					case (65):
						var newLife = particleSystem.life - 1;
						
						if (newLife > 0) {
							particleSystem.setLife(newLife);
						}
						break;
					case (80):
						if (particleSystem.active) {
							particleSystem.pause();
						} else {
							particleSystem.play();
						}
						break;
					case (83):
						if (particleSystem.active) {
							particleSystem.stop();
						} else {
							particleSystem.start();
						}
						break;
					case (90):
						var newLife = particleSystem.life + 1;
						
						if (newLife < 30) {
							particleSystem.setLife(newLife);
						}
						break;
					default:
				}
			}
		});
		
	};

	jQuery(window).load(function() {
		o3djs.webgl.makeClients(init);
	});

	jQuery(window).unload(function() {
		if (hemi.core.client) {
			hemi.core.client.cleanup();
		}
	});
})();
