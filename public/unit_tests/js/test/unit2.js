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


	var unit2 = unit2 || {};
	var unitTest2 = unitTest2 || {};

	
	unit2.start = function(onCompleteCallback) {
		
		this.onCompleteCallback = onCompleteCallback;
		
		var desc = 'Load model with wrong URL to make sure that an Alert is tiggered.  YOU WILL NOT ACTUALLY SEE THE ALERT HERE.  The testing framework traps the alert.';
		jqUnit.module('UNIT 2', desc); 
		jqUnit.test("load model wrong url", unitTest2.step_1);

		
	};
	
	unit2.step_2 = function() {

		var result = hemi.world.unsubscribe(unitTest2.subscription, hemi.msg.load);
		
		jqMock.assertThat(unitTest2.model , is.instanceOf(hemi.model.Model));
		unit2.cleanup();
		
	};

	unit2.cleanup = function() {
		
		//unitTest2.model.cleanup();
		unit2.onCompleteCallback.call();
		
	};
	
	
	unitTest2.step_1 = function()   {
		
		jqUnit.expect(1);
		
		unitTest2.model = new hemi.model.Model();				// Create a new Model
		jqMock.assertThat(unitTest2.model , is.instanceOf(hemi.model.Model));
			
		var filePath = 'LearnGreenBuildings/ductwork2.json';
		var expectedMessage = 'Loading failed: could not load: ../assets/' + filePath;
		
	    unitTest2.alertMock = new jqMock.Mock(window, "alert");  
		unitTest2.alertMock.modify().args(expectedMessage).returnValue();  
		jqUnit.stop();
	
		unitTest2.model.setFileName(filePath); // Set the model file
		
		setTimeout ( unitTest2.callback, 1000 );
			

	};
	
	unitTest2.callback = function(){
		jqUnit.test("verify alert", unitTest2.checkForAlert);
	};


	unitTest2.checkForAlert = function(){
			jqUnit.start();
			jqUnit.expect(1);
			unitTest2.alertMock.verify();
			unitTest2.alertMock.restore();
	};



	
	

