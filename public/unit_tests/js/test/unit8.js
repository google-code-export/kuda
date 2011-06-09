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
		
		jqUnit.module('UNIT 8'); 
		jqUnit.test("Load Model", unitTest8.init);
		jqUnit.stop();
	};
	
	
	unit8.step_2 = function() {
		jqUnit.start();
		hemi.view.addRenderListener(unitTest8);
		unitTest8.callBack = unit8.step_3;
		jqUnit.test("Create two particle systems", unitTest8.start);
		jqUnit.stop();
	};
	
	unit8.step_3 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.step_4;
		jqUnit.test("Show Boxes", unitTest8.showBoxes);
		jqUnit.stop();
	};
	
	unit8.step_4 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.step_5;
		jqUnit.test("Hide Boxes", unitTest8.hideBoxes);
		jqUnit.stop();
		//var t=setTimeout("unit8.end();",2000);
	};
	
	unit8.step_5 = function() {
		jqUnit.start();
		unitTest8.callBack = unit8.end;
		jqUnit.test("Show Performance", unitTest8.showPerformance);
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
		
		unitTest8.model = new hemi.model.Model();				// Create a new Model
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
		
		var scale1 = [4,4,4];
		var scale2 = [4,4,4];
		
		var colorKey1 = {key: 0, value: [1,1,0,0.2]};
		var colorKey2 = {key: 0.45, value: [1,0,0,1]};
		var colorKey3 = {key: 0.55, value: [0,0,1,1]};
		var colorKey4 = {key: 1, value: [0,0,0,0.2]};
		/* Create a particle system configuration with the above parameters,
		 * plus a rate of 20 particles per second, and a lifetime of
		 * 5 seconds. Specify the shapes are arrows.
		 */
		var systemConfig = {
			fast: false,
			aim: true,
			trail: true,
			particleCount: 10,
			life: 12,
			boxes: [box1,box2,box3,box4, box5,box6,box7,box8,box9],
			particleShape: hemi.curve.ShapeType.ARROW,
			colors: [red],
			scales : [scale1, scale2],
			particleSize: 4,
			colorKeys : [colorKey1, colorKey2, colorKey3, colorKey4]
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
		systemConfig.colors = [blue];
		
		unitTest8.particleSystem2  = hemi.curve.createSystem(systemConfig);
		unitTest8.particleSystem2.start();
		
		
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		vp.eye = [-10,800,1800];					// Set viewpoint eye
		vp.target = [10,250,30];					// Set viewpoint target
		

		hemi.world.camera.moveToView(vp,30);

	};
	
	unitTest8.showBoxes = function(){
		unitTest8.particleSystem1.showBoxes();
		unitTest8.particleSystem2.showBoxes();
		
		jqMock.assertThat(unitTest8.model , is.instanceOf(hemi.model.Model));
	}
	
	unitTest8.hideBoxes = function() {
		unitTest8.particleSystem1.hideBoxes();
		unitTest8.particleSystem2.hideBoxes();
	}
	
	unitTest8.showPerformance = function() {
		var endMs = new Date().getTime();
		unitTest8.elapsedMs = endMs - unitTest8.startMs;
		unitTest8.fps = unitTest8.particleSystem1.frames / (unitTest8.elapsedMs  / 1000);
	
		jqUnit.ok(unitTest8.elapsedMs > 0, 'Elapsed Time in Ms: ' + unitTest8.elapsedMs);
		jqUnit.ok(unitTest8.fps > 0, 'AVG Frames per Second: ' + unitTest8.fps);
	}
	
	
	unitTest8.onRender = function(event) {
		
		unitTest8.totalFramesRendered++;
		var mod = unitTest8.totalFramesRendered % unitTest8.callbackAfterFrames;
		
		if (0 == mod) {
			unitTest8.callBack.call();
		} 
	}

	



	
	

