var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.picking = parent.test.picking || {};
	
	o3djs.require('hemi.picking');

	var UnitTest = {
		name: 'picking',
		runTests : function() {
			module(this.name);
			
			test("Picking: constructor", function() {
				expect(0);		
			});	
		
		}
	};

	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);