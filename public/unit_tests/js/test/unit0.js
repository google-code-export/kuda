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

	o3djs.require('hemi.core');
	o3djs.require('o3djs.util');
	


	var unit0 = unit0 || {};
	var unitTest0 = unitTest0 || {};
	

	
	unit0.start = function(onCompleteCallback) {
		
		
		this.onCompleteCallback = onCompleteCallback;
		
		
		var desc = 'initializes the Kuda world and needs to be run first';
		jqUnit.module('UNIT 0', desc); 

		jqUnit.test("makeClients", unitTest0.makeClients);
		jqUnit.stop();
		
	};

	
	unit0.step_2 = function(clientElements) {
		
		unitTest0.clientElements = clientElements;
		

		jqUnit.start();
		jqUnit.test("init", unitTest0.init);
		jqUnit.stop();
		
	};
	
	unit0.step_3 = function() {
		
		var result = hemi.world.unsubscribe(unitTest0.readySubscription, hemi.msg.ready);
		
		jqUnit.start();
		unit0.onCompleteCallback.call();
	};
	
	
	unit0.cleanup = function() {
		//unitTest0.model.cleanup();
		
	};


	unitTest0.makeClients = function()   {
		jqUnit.expect(4);
		
		jqUnit.equals(hemi.version,'1.3.2', "Kuda Version");
		
		jqMock.assertThat(hemi, is.instanceOf(Object), "hemi is instantiated");
		jqMock.assertThat(o3djs,is.anything, "o3djs is instantiated");
		jqMock.assertThat(o3djs.webgl,is.anything, "o3djs.webgl is instantiated");
		
		o3djs.webgl.makeClients(unit0.step_2);
	};
	
	unitTest0.init = function()   {
		jqUnit.expect(5);	
		var clientElements = unitTest0.clientElements;
		
		jqMock.assertThat(clientElements , is.instanceOf(Array));
		jqMock.assertThat(clientElements.length , 1);
		
		var htmlCanvasElement = clientElements[0];
		
		jqMock.assertThat(htmlCanvasElement.tagName ,'CANVAS');
		
		jqMock.assertThat(hemi ,is.anything);
		jqMock.assertThat(hemi.core ,is.anything);
		
		hemi.core.init(htmlCanvasElement);
		hemi.view.setBGColor([0.7, 0.8, 1, 1]);
		hemi.loader.loadPath = '../assets/';
		
		unitTest0.readySubscription = hemi.world.subscribe(
			hemi.msg.ready,
			unit0,
			'step_3'
		);
		
		
		hemi.world.ready();   // Indicate that we are ready to start our script
	};



	

