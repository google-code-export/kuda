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


	var unit9 = unit9 || {};
	var unitTest9 = unitTest9 || {};

	
	unit9.start = function(onUnitCompleteCallback) {
		unit9.onUnitCompleteCallback = onUnitCompleteCallback;
		unitTest9.callBack = unit9.step_2;
		
		var desc = 'Creates 2 GPU enabled particle systems. One has red arrows, the other blue arrows. the test then changes the location of one of the blue particle systems by assigning a parent and trnaslating it, shows/hides/shows the bounding boxes';
		jqUnit.module('UNIT 9', desc); 

		jqUnit.test("Load Model", unitTest9.init);
		jqUnit.stop();
	};
	
	
	unit9.step_2 = function() {
		jqUnit.start();
		hemi.view.addRenderListener(unitTest9);
		unitTest9.callBack = unit9.step_3;
		jqUnit.test("Create two GpuParticleSystems", unitTest9.start);
		jqUnit.stop();
	};
	
	unit9.step_3 = function() {
		jqUnit.start();
		unitTest9.callBack = unit9.step_4;
		jqUnit.test("Show Boxes", unitTest9.showBoxes);
		jqUnit.stop();
	};
	
	unit9.step_4 = function() {
		jqUnit.start();
		unitTest9.callBack = unit9.step_5;
		jqUnit.test("Hide Boxes", unitTest9.hideBoxes);
		jqUnit.stop();
	};
	
	unit9.step_5 = function() {
		jqUnit.start();
		unitTest9.callBack = unit9.step_6;
		jqUnit.test("Show Boxes", unitTest9.showBoxes);
		jqUnit.stop();
	};
	
	unit9.step_6 = function() {
		jqUnit.start();
		unitTest9.callBack = unit9.end;
		jqUnit.test("Show Performance", unitTest9.showPerformance);
		jqUnit.stop();
	};
	
	unit9.end = function() {
		jqUnit.start();
		hemi.view.removeRenderListener(unitTest9);
		unit9.onUnitCompleteCallback.call();
	};
	
	unit9.cleanup = function() {
		unitTest9.model.cleanup();
		unitTest9.particleSystem.stop();
		unitTest9.particleSystem2.stop();
	};
	

	unitTest9.init = function()   {
		jqUnit.expect(1);
		
		unitTest9.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest9.model , is.instanceOf(hemi.model.Model));
		
		unitTest9.model.setFileName('house_v12/scene.json'); // Set the model file
		
		var subscription = unitTest9.model.subscribe (
			hemi.msg.load,
			function() {
				unitTest9.model.unsubscribe(subscription, hemi.msg.load);
				unitTest9.callBack.call();
			}
		);
		
		hemi.world.ready();   // Indicate that we are ready to start our script
	};
	
	unitTest9.start = function() {

		unitTest9.totalFramesRendered = 0;
		unitTest9.callbackAfterFrames = 60;
		unitTest9.startMs = new Date().getTime();
		
		jqMock.assertThat(unitTest9.model , is.instanceOf(hemi.model.Model));
		
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
		var blue = [0, 0, 1, 0.4];
		var green = [0, 1, 0, 0.4];
		var red = [1, 0, 0, 0.4];
		
		var scaleKey1 = {key: 0, value: [40,40,40]};
		var scaleKey2 = {key: 1, value: [40,40,40]};
		
		var colorKey1 = {key: 0, value: [1,1,0,0.2]};
		var colorKey2 = {key: 0.45, value: [1,0,0,1]};
		var colorKey3 = {key: 0.55, value: [0,0,1,1]};
		var colorKey4 = {key: 1, value: [0,0,0,0.2]};
		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var systemConfig = {
			fast: true,
			aim: true,
			trail: true,
			particleCount: 200,
			particleSize: 0.6,
			life: 12,
			boxes: [box1,box2,box3,box4, box5,box6,box7,box8,box9],
			particleShape: hemi.curve.ShapeType.ARROW,
			colors: [red],
			scaleKeys : [scaleKey1, scaleKey2]
		};
		

		unitTest9.particleSystem1  = hemi.curve.createSystem(systemConfig);
		unitTest9.particleSystem1.start();
		

		//make second particle system
		systemConfig.colors = [blue];
		
		unitTest9.particleSystem2  = hemi.curve.createSystem(systemConfig);
		//translate to the right
		unitTest9.particleSystem2.translate(1400,0,0);
		unitTest9.particleSystem2.start();
		
		
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [-10,800,1800];					// Set viewpoint eye
		vp.target = [10,250,30];					// Set viewpoint target
		

		hemi.world.camera.moveToView(vp,30);

	};
	
	unitTest9.showBoxes = function(){
		unitTest9.particleSystem1.showBoxes();
		unitTest9.particleSystem2.showBoxes();
		
		jqMock.assertThat(unitTest9.model , is.instanceOf(hemi.model.Model));
	};
	
	unitTest9.hideBoxes = function() {
		unitTest9.particleSystem1.hideBoxes();
		unitTest9.particleSystem2.hideBoxes();
	};
	
	unitTest9.showPerformance = function() {
		var endMs = new Date().getTime();
		
		unitTest9.elapsedMs = endMs - unitTest9.startMs;
		jqUnit.ok((unitTest9.particleSystem1.frames  > 0), 'Number of frames in the particle system: ' + unitTest9.particleSystem1.frames);
		
		
		unitTest9.fps = unitTest9.particleSystem1.frames / (unitTest9.elapsedMs  / 1000);
		
		jqUnit.ok(unitTest9.elapsedMs > 0, 'Elapsed Time in Ms: ' + unitTest9.elapsedMs);
		jqUnit.ok(unitTest9.fps > 0, 'AVG Frames per Second: ' + unitTest9.fps);
	};
	
	
	unitTest9.onRender = function(event) {
		
		unitTest9.totalFramesRendered++;
		var mod = unitTest9.totalFramesRendered % unitTest9.callbackAfterFrames;
		
		if (0 == mod) {
			unitTest9.callBack.call();
		} 
	};

	



	
	

