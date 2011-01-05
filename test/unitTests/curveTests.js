var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.curve = parent.test.curve || {};
	
	o3djs.require('hemi.curve');

	var UnitTest = {
		name: 'curve',
		runTests : function() {
			module(this.name);
			
			test("Curve: constructor", function() {
				expect(0);		
			});	
		
		}
	};

	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);