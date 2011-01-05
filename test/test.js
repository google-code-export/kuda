var hemi = (function(parent, jQuery) {
	
	var test = parent.test = parent.test || {};
	
	o3djs.require('o3djs.util');
	o3djs.require('hemi.core');
	o3djs.require('hemi.view');
	o3djs.require('test.unitTests.coreTests');
	o3djs.require('test.unitTests.viewTests');
	o3djs.require('test.unitTests.dispatchTests');
	o3djs.require('test.unitTests.animationTests');
	o3djs.require('test.unitTests.effectTests');
	o3djs.require('test.unitTests.inputTests');
	o3djs.require('test.unitTests.locationTests');
	o3djs.require('test.unitTests.modelTests');
	o3djs.require('test.unitTests.sceneTests');
	o3djs.require('test.unitTests.utilTests');
	o3djs.require('test.unitTests.manipTests');
	o3djs.require('test.unitTests.motionTests');
	o3djs.require('test.unitTests.spriteTests');
	o3djs.require('test.unitTests.curveTests');	
	o3djs.require('test.unitTests.worldTests');
	o3djs.require('test.unitTests.hudTests');	
	o3djs.require('test.unitTests.pickingTests');	
	o3djs.require('test.unitTests.tools.baseToolTests');
	o3djs.require('test.unitTests.tools.manometerTests');
	o3djs.require('test.unitTests.tools.manometerWidgetTests');
	o3djs.require('test.unitTests.tools.toolbarWidgetTests');
	o3djs.require('test.unitTests.tools.toolbarTests');
	o3djs.require('test.unitTests.tools.toolviewContainerTests');
	o3djs.require('test.unitTests.tools.toolboxTests');
	o3djs.require('test.unitTests.tools.blowerDoorTests');
	o3djs.require('test.unitTests.tools.blowerDoorViewTests');
	o3djs.require('test.unitTests.tools.blowerDoorControllerTests');
//	o3djs.require('test.unitTests.loaderTests');
	
	var unitTests = [];
	
	test.addUnitTest = function(unitTest) {
		unitTests.push(unitTest);
	};
	
	window.onload = function() {
		// This is necessary to guarantee that O3D is set up before any of the
		// unit tests start running.
		asyncTest("Setup O3D", function() {
			o3djs.util.makeClients(function(clientElements){
				parent.core.init(clientElements[0]);
				parent.view.setBGColor([0, 0, 0, 1]);
				start();
			});
		});
		var tot = unitTests.length;
		for (var ndx = 0; ndx < 17; ndx++) {
			//console.log(ndx + " : " + unitTests[ndx].name);
			unitTests[ndx].runTests();
		}
	};
	
	window.onunload = function() {
		if (parent.core.client) {
			parent.core.client.cleanup();
		}
	};
	
	return parent;
})(hemi || {}, jQuery);
