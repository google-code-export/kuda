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


	var unit8 = unit8 || {};
	var unitTest8 = unitTest8 || {};

	
	unit8.start = function(onUnitCompleteCallback) {
		unit8.onUnitCompleteCallback = onUnitCompleteCallback;
		unitTest8.callBack = unit8.step_2;
		
		var desc = 'This test creates 2 particle systems and then shows/hides/shows the bounding boxes.  ' +
		'The particle system on the left is blue, the particle system on the right is red.' +
		'These particle systems are NOT the GPU accelerated versions.  This tests the process of changing ' +
		'the location of a particle system, buy explicitly creating a reference to a parent';
		
		jqUnit.module('UNIT 8', desc); 
		jqUnit.test("Load model", unitTest8.init);
		jqUnit.stop();
	};
	
	
	unit8.step_2 = function() {
		jqUnit.start();
		hemi.view.addRenderListener(unitTest8);
		unitTest8.callBack = unit8.step_2_5;
		jqUnit.test("Create two particle systems", unitTest8.start);
		jqUnit.stop();
	};
	
	unit8.step_2_5 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.step_3;
		jqUnit.test("Check the location of each particle system in the world", unitTest8.checkLocations);
		jqUnit.stop();
	};
	
	unit8.step_3 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.step_4;
		jqUnit.test("Show bounding boxes", unitTest8.showBoxes);
		jqUnit.stop();
	};
	
	unit8.step_4 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.step_5;
		jqUnit.test("Hide bounding boxes", unitTest8.hideBoxes);
		jqUnit.stop();
	};
	
	unit8.step_5 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.step_6;
		jqUnit.test("Show bounding boxes", unitTest8.showBoxes);
		jqUnit.stop();
	};
	
	unit8.step_6 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.end;
		jqUnit.test("Show performance statistics", unitTest8.showPerformance);
		jqUnit.stop();
	};
	
	unit8.end = function() {
		jqUnit.start();
		hemi.view.removeRenderListener(unitTest8);
		unit8.onUnitCompleteCallback.call();
	};
	
	unit8.cleanup = function() {
		unitTest8.model.cleanup();
		unitTest8.particleSystem.stop();
		unitTest8.particleSystem2.stop();
		//unitTest8.particleSystem.cleanup();
	};
	

	unitTest8.init = function()   {
		jqUnit.expect(1);
		
		unitTest8.model = new hemi.model.Model();
		jqMock.assertThat(unitTest8.model , is.instanceOf(hemi.model.Model));
		
		unitTest8.model.setFileName('house_v12/scene.json'); // Set the model file
		
		var subscription = unitTest8.model.subscribe (
			hemi.msg.load,
			function() {
				unitTest8.model.unsubscribe(subscription, hemi.msg.load);
				unitTest8.callBack.call();
			}
		);
		
		hemi.world.ready();   // Indicate that we are ready to start our script
	};
	
	unitTest8.start = function() {

		unitTest8.totalFramesRendered = 0;
		unitTest8.callbackAfterFrames = 60;
		unitTest8.startMs = new Date().getTime();
		
		jqMock.assertThat(unitTest8.model , is.instanceOf(hemi.model.Model));
		
		hemi.world.camera.enableControl();	// Enable camera mouse control
		
		/*
		 * The bounding boxes which the arrows will flow through:
		 */
		var box1 = new hemi.curve.Box([-510,-110,-10],[-490,-90,10]);
		var box2 = new hemi.curve.Box([-600,400,-200],[-400,600,0]);
		var box3 = new hemi.curve.Box([-10,790,180],[10,810,200]);
		var box4 = new hemi.curve.Box([400,450,-300],[600,650,-100]);
		var box5 = new hemi.curve.Box([490,-110,-110],[510,-90,-90]);
		var box6 = new hemi.curve.Box([-30,140,-560],[30,260,-440]);
		var box7 = new hemi.curve.Box([-310,490,-10],[110,510,10]);
		var box8 = new hemi.curve.Box([90,190,590],[110,210,610]);
		var box9 = new hemi.curve.Box([-250,-250,270],[-150,-150,330]);
		
		/*
		 * The colors these arrows will be as they move along the curve:
		 */
		var blue = [0, 0, 1, 0.4];
		var green = [0, 1, 0, 0.4];
		var red = [1, 0, 0, 0.4];
		
		var scaleKey1 = {key: 0, value: [20,20,20]};
		var scaleKey2 = {key: 1, value: [20,20,20]};
		
		var colorKeyBlue1 = {key: 0, value: [0,0,1,0.6]};
		var colorKeyBlue2 = {key: 1, value: [0,0,1,0.6]};
		
		var colorKeyRed1 = {key: 0, value: [1,0,0,0.6]};
		var colorKeyRed2 = {key: 1, value: [1,0,0,0.6]};
		
		
		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var systemConfig = {
			fast: false,
			aim: true,
			trail: true,
			particleCount: 25,
			life: 12,
			boxes: [box1,box2,box3,box4, box5,box6,box7,box8,box9],
			particleShape: hemi.curve.ShapeType.ARROW,
			scaleKeys : [scaleKey1, scaleKey2],
			colorKeys : [colorKeyBlue1, colorKeyBlue2]
		};
		

		unitTest8.particleSystem1  = hemi.curve.createSystem(systemConfig);
		unitTest8.particleSystem1.start();
		

		//make second particle system
		//set its parent and translate to the right
		var rootShape = hemi.shape.create (
			{shape: 'box',
			color: [1,1,0,0],
			h:1,w:1,d:1}
			);
		
			
		rootShape.translate(1400,0,0);
		systemConfig.parent = rootShape;

		systemConfig.colorKeys = [colorKeyRed1, colorKeyRed2];
		
		unitTest8.particleSystem2  = hemi.curve.createSystem(systemConfig);
		unitTest8.particleSystem2.start();
		
		
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [650,800,1800];					// Set viewpoint eye
		vp.target = [650,250,30];					// Set viewpoint target
		

		hemi.world.camera.moveToView(vp,30);

	};
	
	unitTest8.checkLocations = function(){
		jqUnit.expect(4);
		
		var refPointLocal1 = unitTest8.particleSystem1.boxes[0][0];
		var refPointLocal2 = unitTest8.particleSystem2.boxes[0][0];
		
		jqMock.assertThat(refPointLocal1, [-510, -110, -10]);
		jqMock.assertThat(refPointLocal2, [-510, -110, -10]);
		
		var refPointGlobal1 = hemi.utils.pointAsWorld(unitTest8.particleSystem1.transform, refPointLocal1);
		var refPointGlobal2 = hemi.utils.pointAsWorld(unitTest8.particleSystem2.transform, refPointLocal2);
		
		jqMock.assertThat(refPointGlobal1, [-510, -110, -10]);
		jqMock.assertThat(refPointGlobal2, [890,-110,-10]);
		
		
	};
	
	unitTest8.showBoxes = function(){
		unitTest8.particleSystem1.showBoxes();
		unitTest8.particleSystem2.showBoxes();
		
		jqMock.assertThat(unitTest8.model , is.instanceOf(hemi.model.Model));
	};
	
	unitTest8.hideBoxes = function() {
		unitTest8.particleSystem1.hideBoxes();
		unitTest8.particleSystem2.hideBoxes();
	};
	
	unitTest8.showPerformance = function() {

		var endMs = new Date().getTime();
		
		unitTest8.elapsedMs = endMs - unitTest8.startMs;
		jqUnit.ok((unitTest8.particleSystem1.frames  > 0), 'Number of frames in the particle system: ' +
			unitTest8.particleSystem1.frames);
		
		
		unitTest8.fps = unitTest8.particleSystem1.frames / (unitTest8.elapsedMs  / 1000);
		
		jqUnit.ok(unitTest8.elapsedMs > 0, 'Elapsed Time in milliseconds: ' + unitTest8.elapsedMs);
		jqUnit.ok(unitTest8.fps > 0, 'Average frames displayed per second: ' + unitTest8.fps);

	};
	
	
	unitTest8.onRender = function(event) {
		
		unitTest8.totalFramesRendered++;
		var mod = unitTest8.totalFramesRendered % unitTest8.callbackAfterFrames;
		
		if (0 == mod) {
			unitTest8.callBack.call();
		} 
	};

	



	
	

