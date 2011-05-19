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
 * Unit Test 0
 * is composed of 2 classes 'Control0' and 'Script0'
 * @namespace A module for running unit tests
 * 
 */
var test = (function(test) {


	/**
	 * A Unit test Control
	 * @author Raj Dye
	 */
	test.Control0 = function(){
		
		/**
		 * This function is called when the test is complete 
		 * @type Function
		 */
	//	this.onCompleteCallback = $.proxy(this.onComplete, this);
		
		var delegate = $.proxy( this.onComplete, this);
		/**
		 * Test Object used to make all the Kuda API calls
		 * @type test.Test0
		 */
		this.test = new test.Script0(delegate);

	
	};
	
	test.Control0.prototype = {
		/**
		 * starts the test
		 * @param Function callback when finished running the test
		 */
		start : function(onCompleteCallback) {
			
			this.onCompleteCallback = onCompleteCallback;
			this.step1();
			
		},
		/**
		 * Controls a step of the test
		 */
		step1 : function() {
			jqUnit.module('UNIT 0'); 
			jqUnit.expect(4);
			jqUnit.test("makeClients", this.test.makeClients);
			jqUnit.stop();
		},
		/**
		 * Controls a step of the test
		 */
		step2 : function() {

		},

		onComplete : function () {
			

			
		}
		
		
	};
	
	/**
	 * A Unit test
	 * @author Raj Dye
	 */
	test.Script0 = function(callback){
		/**
		 * A reference to the controller of this script
		 */
		this.callback = callback;
	
	
		/**
		 * A reference to latests subscription
		 * used to unsubscribe to events after an event is handled
		 */
		this.subscription = null;
	
	
	};
	
	test.Script0.prototype = {
		
		makeClients : function() {

			jqMock.assertThat(hemi, is.instanceOf(Object));
			jqMock.assertThat(hemi.version, '1.3.2');
			
			jqMock.assertThat(o3djs,is.anything);
			jqMock.assertThat(o3djs.webgl,is.anything);
			
		//	var delegate = $.proxy(this.init,this);
			o3djs.webgl.makeClients(this.init);
		},
		
		
		init: function(clientElements){
		
			jqMock.assertThat(clientElements , is.instanceOf(Array));
			jqMock.assertThat(clientElements.length , 1);
			
			var htmlCanvasElement = clientElements[0];
			
			jqMock.assertThat(htmlCanvasElement.tagName ,'CANVAS');
			
			jqMock.assertThat(hemi ,is.anything);
			jqMock.assertThat(hemi.core ,is.anything);
			
			hemi.core.init(htmlCanvasElement);
			hemi.view.setBGColor([0.7, 0.8, 1, 1]);
			hemi.loader.loadPath = '../assets/';
			
			this.subscription = hemi.world.subscribe(
				hemi.msg.ready,
				this,
				'onInitComplete'
			);
			
			
			hemi.world.ready();   // Indicate that we are ready to start our script
		},
		onInitComplete: function(){
			var result = hemi.world.unsubscribe(this.subscription, hemi.msg.ready);
			this.callback.call();
		}
		
		
		
	}
	
	return test;
	
})(test || {});











