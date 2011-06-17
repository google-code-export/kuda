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



	var unit1 = unit1 || {};
	var unitTest1 = unitTest1 || {};

	
	unit1.start = function(onCompleteCallback) {
		
		this.onCompleteCallback = onCompleteCallback;
		
		
		var desc = 'Loads the model of the house and gets the bounding box.  Then it verifies that the dimensions are correct for the bounding box. ';
		jqUnit.module('UNIT 1', desc); 
		
		jqUnit.test("loadModel", unitTest1.loadModel);
		jqUnit.stop();
		
	};

	unit1.step_2 = function() {
		unitTest1.model.unsubscribe(unitTest1.loadSubscription, hemi.msg.load);
		
		jqUnit.start();

		jqUnit.test("moveToView", unitTest1.moveToView);
		jqUnit.stop();
		
	};
	
	unit1.step_3 = function(clientElements) {
		
		hemi.world.camera.unsubscribe(unitTest1.cameraStopSubscription, hemi.msg.stop);
		

		jqUnit.test("boundingBox", unitTest1.boundingBox);
		unit1.onCompleteCallback.call();

	};
	
	unit1.cleanup = function() {
		unitTest1.model.cleanup();

		
	};



	unitTest1.boundingBox = function()   {
		jqUnit.expect(3);
		var boundingBox = unitTest1.model.getBoundingBox();
		
		jqMock.assertThat(boundingBox, is.instanceOf(o3d.BoundingBox));
		
		jqMock.assertThat(boundingBox.minExtent, [-260.0360107421875, -1.661682125231323e-7, -315.0270080566406]);
		jqMock.assertThat(boundingBox.maxExtent, [260.1830139160156, 334.6929931640625, 768.6312638657104]);
	};
	
	

	unitTest1.loadModel = function()   {
		
		unitTest1.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest1.model , is.instanceOf(hemi.model.Model));
		

		unitTest1.loadSubscription = unitTest1.model.subscribe(hemi.msg.load,
			function(msg) {
				unit1.step_2();
			});
			
		unitTest1.model.setFileName('house_v12/scene.json'); // Set the model file
		

	};
	

	unitTest1.moveToView = function()   {
		
		jqUnit.expect(2);
		var x = unitTest1.readyListener;
		
		var vp = new hemi.view.Viewpoint();		// Create a new Viewpoint
		
		jqMock.assertThat(vp , is.instanceOf(hemi.view.Viewpoint));
		jqMock.assertThat(unitTest1.model , is.instanceOf(hemi.model.Model));
		
		vp.eye = [-4,507,1435];					// Set viewpoint eye
		vp.target = [5,154,26];					// Set viewpoint target


		unitTest1.cameraStopSubscription = hemi.world.camera.subscribe(
				hemi.msg.stop,
				unit1,
				'step_3');
		
		hemi.world.camera.moveToView(vp,120);
		hemi.world.camera.enableControl();	// Enable camera mouse control
	};


	

