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
	

/**
 * @namespace A module for running unit tests
 * @author Raj Dye
 */
var test = (function(test) {


	/**
	 * An MVC controller class for unit tests
	 * @author Raj Dye
	 */
	test.Controller = function(){
		
		/**
		 * The lists of unit test to run
		 * @type Array of Objects
		 */
		this.testList = null;
	
		/**
		 * The number of tests to run
		 * @type int
		 */
		this.testCount = 0;
		
		/**
		 * Index of the current test that we are running
		 * @type int
		 */
		this.testIdx = 0;
		
		/**
		 * This is a delegate that is passed to each unit test in
		 * turn as we run them
		 * @type jQuery proxy
		 */
		this.onFinshedHandler = $.proxy( this.onTestFinished, this);
		
		/**
		 * The unit test that we are running
		 * @type Object (unit test)
		 */
		this.theCurrentTest = null;
		
		//initialize the jqMock object
		jqMock.addShortcut();  
		
	};
	
	test.Controller.prototype = {
		/**
		 * runs all the specified unit tests
		 * @param Array of unit tests
		 */
		run : function(testList) {
			
			
			this.testList = testList;
			this.testCount = this.testList.length;
			
			if (this.testCount < 1) {
				throw ('There are no objects in the test list');
				return;	
			}
			
			this.runOne();
			
		},
		/**
		 * Starts a unit test
		 */
		runOne : function() {
			this.theCurrentTest = this.testList[this.testIdx];
			this.theCurrentTest.start(this.onFinshedHandler);

		},
		/**
		 * This is called after each unit test is completed
		 */
		onTestFinished : function (event) {
			
			this.testIdx++;
			if (this.testIdx <  this.testCount) {
				this.theCurrentTest.cleanup();
				this.runOne();
			} else {
				this.finished();
			}
		},
		/**
		 * This is needed because JqUnit doesnt really tell us that we are done
		 * running tests
		 */
		finished : function () {
			
			jqUnit.start();
		//	jqUnit.module('FINISHED', '');
			//jqUnit.process();
			//jqUnit.test("FINISHED", function(){});
			
			jqUnit.showResults();  
			
		}
		
		
	};

	
	return test;
	
})(test || {});











