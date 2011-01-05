var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.hud = parent.test.hud || {};
	
	o3djs.require('hemi.hud');

	var UnitTest = {
		name: 'hud',
		runTests : function() {
			module(this.name);
			
			test("Hud: constructor", function() {
				expect(0);		
			});	
		
		}
	};

	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);