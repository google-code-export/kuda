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


	var unit5 = unit5 || {};
	var unitTest5 = unitTest5 || {};

	
	unit5.start = function(onUnitCompleteCallback) {
		unit5.onUnitCompleteCallback = onUnitCompleteCallback;
		
		var desc = 'Creates two particle systems one is GPU acelerated, one is not';
		jqUnit.module('UNIT 5', desc); 
		jqUnit.test("Load model", unitTest5.step_1);

	};
	
	unit5.step_2 = function() {
		var result = unitTest5.model.unsubscribe(unitTest5.loadSubscription, hemi.msg.load);
		
		unitTest5.callBack = unit5.step_3;
		jqUnit.test("Create particle system 1: slow, blue", unitTest5.createParticleSystem1);

	};
	
	unit5.step_3 = function() {
		
		hemi.world.camera.unsubscribe(unitTest5.subscription, hemi.msg.stop);
		//unitTest5.particleSystem1.stop();
		
		unitTest5.callBack = unit5.step_4;
		
		jqUnit.test("Create particle system 2: fast, red", unitTest5.createParticleSystem2);
		
	};
	unit5.step_4 = function() {
		
	//	hemi.world.camera.unsubscribe(unitTest5.subscription, hemi.msg.stop);
		
		unit5.onUnitCompleteCallback.call();
	};
	
	unit5.cleanup = function() {
		unitTest5.model.cleanup();
		unitTest5.particleSystem1.stop();
		unitTest5.particleSystem2.stop();
		//unitTest5.particleSystem.cleanup();
	};
	
	

	unitTest5.step_1 = function()   {
		
		jqUnit.expect(1);
		
		unitTest5.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest5.model , is.instanceOf(hemi.model.Model));
		
		unitTest5.model.setFileName('house_v12/scene.json'); // Set the model file
		
		unitTest5.loadSubscription = unitTest5.model.subscribe(
			hemi.msg.load,
			unit5,
			'step_2'
		);
		
		
		hemi.world.ready();   // Indicate that we are ready to start our script


	};
	
	
	unitTest5.getParticleSystemConfig = function(){
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
		
		
		var scaleKey1 = {key: 0, value: [5,5,5]};
		var scaleKey3 = {key: 1, value: [5,5,5]};
		
		var colorKey1 = {key: 0, value: [0,0,1,0.5]};
		var colorKey4 = {key: 1, value: [0,0,1,0.5]};

			
		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var particleSystemConfig = {
			fast: false,
			aim: true,
			trail: true,
			particleCount: 50,
			life: 12,
			boxes: [box1,box2,box3,box4,box5,box6,box7,box8,box9,box1],
			particleShape: hemi.curve.ShapeType.ARROW,
			colorKeys : [colorKey1, colorKey4],
			particleSize: 6,
			scaleKeys : [scaleKey1, scaleKey3]
		};
		
		return particleSystemConfig;
	}



	unitTest5.createParticleSystem1 = function() {


		var config = unitTest5.getParticleSystemConfig();
		
		
		jqMock.assertThat(unitTest5.model , is.instanceOf(hemi.model.Model));

		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [-10,800,1800];					// Set viewpoint eye
		vp.target = [10,250,30];					// Set viewpoint target

		hemi.world.camera.enableControl();	// Enable camera mouse control
		

		unitTest5.particleSystem1  = hemi.curve.createSystem(config);
		hemi.curve.showBoxes(unitTest5.particleSystem1.boxes);
		unitTest5.particleSystem1.start();
		

		hemi.world.camera.moveToView(vp,30);
		
		unitTest5.subscription = hemi.world.camera.subscribe(
				hemi.msg.stop,
				unitTest5.callBack);

	};
	
	unitTest5.createParticleSystem2 = function() {
		jqUnit.expect(1);
		jqMock.assertThat(unitTest5.model , is.instanceOf(hemi.model.Model));
		
		var config = unitTest5.getParticleSystemConfig();
		
		var red = [1, 0, 0, 0.7];	
		config.colors = [red];
		config.fast = true;
		config.colorKeys = null;

		unitTest5.particleSystem2  = hemi.curve.createSystem(config);
		//hemi.curve.showBoxes(unitTest5.particleSystem2.boxes);
		unitTest5.particleSystem2.start();
		unitTest5.callBack.call();
	};


	
	

