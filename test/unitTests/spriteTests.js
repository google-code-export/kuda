var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.sprite = parent.test.sprite || {};
	
	o3djs.require('hemi.sprite');

	var UnitTest = {
		name: 'sprite',
		runTests : function() {
			module(this.name);
			
			test("Sprite: constructor", function() {
				expect(0);		
			});	
		
		}
	};

	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);