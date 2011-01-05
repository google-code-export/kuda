var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.manip = parent.test.manip || {};
	
	o3djs.require('hemi.manip');

	var UnitTest = {
		name: 'manip',
		runTests : function() {
			module(this.name);
			
			test("Draggable: constructor", function() {
				expect(5);
				
				var t = parent.core.mainPack.createObject("Transform");
				var d1 = new parent.manip.Draggable();
				d1.addTransform(t,null,[[0,0,0],[1,0,0],[0,1,0]]);
				
				equals(d1.umin, null, "Default umin");
				equals(d1.umax, null, "Default umax");
				equals(d1.vmin, null, "Default vmin");
				equals(d1.vmax, null, "Default vmax");
				same(d1.transforms[0].plane, [[0,0,0],[1,0,0],[0,1,0]], "Draggable plane");		
			});	
		
		}
	};

	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);