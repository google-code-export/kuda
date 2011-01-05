var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.motion = parent.test.motion || {};
	
	o3djs.require('hemi.motion');

	var UnitTest = {
		name: 'motion',
		runTests : function() {
			module(this.name);
			
			test("Translator: constructor", function() {
				expect(0);		
			});	
		
		}
	};

	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);