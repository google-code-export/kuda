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


	var unit6 = unit6 || {};
	var unitTest6 = unitTest6 || {};

	
	unit6.start = function(onUnitCompleteCallback) {
		unit6.onUnitCompleteCallback = onUnitCompleteCallback;
		
		var desc = 'Creates a basic particle system which is NOT GPU accelerated';
		jqUnit.module('UNIT 6', desc); 
		jqUnit.test("Load model", unitTest6.step_1);

	};
	
	unit6.step_2 = function() {
		var result = unitTest6.model.unsubscribe(unitTest6.loadSubscription, hemi.msg.load);
		
		unitTest6.callBack = unit6.step_3;
		jqUnit.test("Create particle system: fast = false", unitTest6.createParticleSystem);

	};
	
	unit6.step_3 = function() {
		
		hemi.world.camera.unsubscribe(unitTest6.subscription, hemi.msg.stop);
		
		unit6.onUnitCompleteCallback.call();
	};

	
	unit6.cleanup = function() {
		unitTest6.model.cleanup();
		unitTest6.particleSystem.stop();
		unitTest6.particleSystem2.stop();
		//unitTest6.particleSystem.cleanup();
	};
	
	

	unitTest6.step_1 = function()   {
		
		jqUnit.expect(1);
		
		unitTest6.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest6.model , is.instanceOf(hemi.model.Model));
		
		unitTest6.model.setFileName('house_v12/scene.json'); // Set the model file
		
		unitTest6.loadSubscription = unitTest6.model.subscribe(
			hemi.msg.load,
			unit6,
			'step_2'
		);
		
		
		hemi.world.ready();   // Indicate that we are ready to start our script


	};


	unitTest6.createParticleSystem = function() {

		jqMock.assertThat(unitTest6.model , is.instanceOf(hemi.model.Model));

		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [-10,800,1800];					// Set viewpoint eye
		vp.target = [10,250,30];					// Set viewpoint target

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
		var colors = [blue,green,red,blue];
		
		var scaleKey1 = {key: 0, value: [4,4,4]};
		var scaleKey2 = {key: 1, value: [4,4,4]};
		

		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var systemConfig = {
			fast: true,
			aim: true,
			trail: true,
			particleCount: 50,
			life: 12,
			boxes: [box1,box2,box3,box4, box5,box6,box7,box8,box9],
			particleShape: hemi.curve.ShapeType.ARROW,
			colors: colors,
			particleSize: 6,
			scaleKeys : [scaleKey1, scaleKey2]
		};
		

		unitTest6.particleSystem  = hemi.curve.createSystem(systemConfig);
		hemi.curve.showBoxes(unitTest6.particleSystem.boxes);
		unitTest6.particleSystem.start();
		

		systemConfig.fast = false;
		
		unitTest6.particleSystem2  = hemi.curve.createSystem(systemConfig);
		unitTest6.particleSystem2.start();
		
		
		hemi.world.camera.moveToView(vp,30);
		
		unitTest6.subscription = hemi.world.camera.subscribe(
				hemi.msg.stop,
				unitTest6.callBack);

	};


	
	

