var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.core = parent.test.core || {};
	
	o3djs.require('hemi.core');
	
	var UnitTest = {
		name: 'core',
		runTests: function() {
			module(this.name);

			test("Transform table", function() {
				expect(8);
				
				// Setup some Transforms to test with
				var transform1 = parent.core.mainPack.createObject('Transform');
				var transform2 = parent.core.mainPack.createObject('Transform');
				var transform3 = parent.core.mainPack.createObject('Transform');
				var transform4 = parent.core.mainPack.createObject('Transform');
				transform1.parent = parent.core.client.root;
				transform2.parent = transform1;
				transform3.parent = transform1;
				transform4.parent = transform3;
				
				var tranPar1 = parent.core.getTransformParent(transform1);
				var tranPar2 = parent.core.getTransformParent(transform2);
				var tranPar3 = parent.core.getTransformParent(transform3);
				var tranPar4 = parent.core.getTransformParent(transform4);
				
				equals(null, tranPar1, "Try to get transform parent before update");
				equals(null, tranPar2, "Try to get transform parent before update");
				equals(null, tranPar3, "Try to get transform parent before update");
				equals(null, tranPar4, "Try to get transform parent before update");
				
				parent.core.addToTransformTable(parent.core.client.root);
				
				tranPar1 = parent.core.getTransformParent(transform1);
				tranPar2 = parent.core.getTransformParent(transform2);
				tranPar3 = parent.core.getTransformParent(transform3);
				tranPar4 = parent.core.getTransformParent(transform4);
				
				equals(parent.core.client.root, tranPar1, "Get transform parent after update");
				equals(transform1, tranPar2, "Get transform parent after update");
				equals(transform1, tranPar3, "Get transform parent after update");
				equals(transform3, tranPar4, "Get transform parent after update");
			});

		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
