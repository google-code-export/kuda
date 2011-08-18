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


	var unit10 = unit10 || {};
	var unitTest10 = unitTest10 || {};

	
	unit10.start = function(onUnitCompleteCallback) {
		unit10.onUnitCompleteCallback = onUnitCompleteCallback;
		unitTest10.callBack = unit10.step_2;
		
		var desc = 'Tests the ability to load a model, then rotate it 90 degrees';
		jqUnit.module('UNIT 10', desc); 

		jqUnit.test("Load model", unitTest10.init);
		jqUnit.stop();
	};
	
	unit10.step_2 = function() {
		jqUnit.start();
		unitTest10.callBack = unit10.end;
		jqUnit.test("Rotate Model", unitTest10.start);
		jqUnit.stop();
	};
	
	unit10.end = function() {
		jqUnit.start();
		//hemi.view.removeRenderListener(unitTest10);
		unit10.onUnitCompleteCallback.call();
	};
	
	unit10.cleanup = function() {
		unitTest10.model.cleanup();
	};
	

	unitTest10.init = function()   {
		jqUnit.expect(1);
		
		unitTest10.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest10.model , is.instanceOf(hemi.model.Model));
		
		unitTest10.model.setFileName('9FootEnvelope/9FootEnvelope.json'); // Set the model file
		
		var subscription = unitTest10.model.subscribe (
			hemi.msg.load,
			function() {
				unitTest10.model.unsubscribe(subscription, hemi.msg.load);
				unitTest10.callBack.call();
			}
		);
		
		hemi.world.ready();   // Indicate that we are ready to start our script
	};
	
	unitTest10.start = function() {
		
		jqUnit.expect(5);
				
		jqMock.assertThat(unitTest10.model , is.instanceOf(hemi.model.Model));
		hemi.world.camera.enableControl();	// Enable camera mouse control

		var radians = hemi.core.math.degToRad(90);
		
		var bb = unitTest10.model.getBoundingBox();

		
		jqMock.assertThat(bb.maxExtent,[31.959048474121094,6.9381007781982404,0.7842599259948733]);   
		jqMock.assertThat (bb.minExtent , [-6.140950821446975,-17.44590049564801,-2.87334]);
		
		unitTest10.model.rotateTransformX(unitTest10.model.root, radians);
		
		var bb2 = unitTest10.model.getBoundingBox();
		jqMock.assertThat (bb2.maxExtent , [31.959048474121094,2.8733400000000002,6.9381007781982404]);
		jqMock.assertThat (bb2.minExtent , [-6.140950821446975,-0.7842599259948744,-17.44590049564801]);
				
				
		unitTest10.callBack.call();
	};
	






	
	

