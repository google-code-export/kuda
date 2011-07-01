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

	
	o3djs.require('hemi.core');
	o3djs.require('o3djs.util');


	var unit3 = unit3 || {};
	var unitTest3 = unitTest3 || {};

	
	unit3.start = function(onUnitCompleteCallback) {
		this.onUnitCompleteCallback = onUnitCompleteCallback;
		
		var desc = 'Creates a simple particle system.  Uses scale keys and color keys so that the shape and size of each particle changes over its lifetime.';
		jqUnit.module('UNIT 3', desc); 
		jqUnit.test("Load model", unitTest3.step_1);

	};
	
	unit3.step_2 = function() {
		var result = unitTest3.model.unsubscribe(unitTest3.loadSubscription, hemi.msg.load);
		jqUnit.test("Create particle system", unitTest3.step_2);

	};
	
	unit3.step_3 = function() {
		hemi.world.camera.unsubscribe(unitTest3.cameraStopSubscription, hemi.msg.stop);
		this.onUnitCompleteCallback.call();
	};
	
	unit3.cleanup = function() {
		unitTest3.model.cleanup();
		unitTest3.particleSystem.stop();
		//unitTest3.particleSystem.cleanup();
	};
	
	

	unitTest3.step_1 = function()   {
		
		jqUnit.expect(1);
		
		unitTest3.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest3.model , is.instanceOf(hemi.model.Model));
		
		unitTest3.model.setFileName('house_v12/scene.json'); // Set the model file
		
		unitTest3.loadSubscription = unitTest3.model.subscribe(
			hemi.msg.load,
			unit3,
			'step_2'
		);
		
		
		hemi.world.ready();   // Indicate that we are ready to start our script


	};


	unitTest3.step_2 = function() {

		jqMock.assertThat(unitTest3.model , is.instanceOf(hemi.model.Model));

		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [-10,800,1800];					// Set viewpoint eye
		vp.target = [10,250,30];					// Set viewpoint target

		hemi.world.camera.enableControl();	// Enable camera mouse control
		
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
		var scaleKey1 = {key: 0, value: [5,5,5]};
		var scaleKey2 = {key: 0.5, value: [25,25,25]};
		var scaleKey3 = {key: 1, value: [5,5,5]};
		
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
			scaleKeys : [scaleKey1, scaleKey2, scaleKey3]
		};
		
		/* Create the particle system with the above config, 
		 * and make the root transform its parent.
		 */
		unitTest3.particleSystem = hemi.curve.createSystem(particleSystemConfig);
		

		unitTest3.particleSystem.start();
		

		hemi.world.camera.moveToView(vp,30);
		
		unitTest3.cameraStopSubscription = hemi.world.camera.subscribe(
				hemi.msg.stop,
				unit3,
				'step_3');

	};


	
	

