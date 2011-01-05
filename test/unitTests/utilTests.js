var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.util = parent.test.util || {};
	
	o3djs.require('hemi.core');
	o3djs.require('hemi.utils');
	
	var UnitTest = {
		name: 'util',
		runTests: function() {
			module(this.name);

			test("Nonlinear interpolation", function() {
				expect(10);
				
				var t1 = 10.56;
				var t2 = -4.88;
				var x = 2.7;
				
				var s1 = parent.utils.linearToSine(t1);
				var s2 = parent.utils.linearToSine(t2);
				ok(Math.abs(s1 - 0.5936) < 0.0001, "Linear interpolation to sine");
				ok(Math.abs(s2 - 0.9648) < 0.0001, "Linear interpolation to sine");
				
				var p1 = parent.utils.linearToParabolic(t1);
				var p2 = parent.utils.linearToParabolic(t2);
				ok(Math.abs(p1 - 111.5136) < 0.0001, "Linear interpolation to parabolic");
				ok(Math.abs(p2 - 23.8144) < 0.0001, "Linear interpolation to parabolic");
				
			    var pi1 = parent.utils.linearToParabolicInverse(t1);
				var pi2 = parent.utils.linearToParabolicInverse(t2);
				ok(Math.abs(pi1 + 90.3936) < 0.0001, "Linear interpolation to inverse parabolic");
				ok(Math.abs(pi2 + 33.5744) < 0.0001, "Linear interpolation to inverse parabolic");
				
				var e1 = parent.utils.linearToExponential(t1, x);
				var e2 = parent.utils.linearToExponential(t2, x);
				ok(Math.abs(e1 - 21122.2575) < 0.0001, "Linear interpolation to exponential");
				ok(Math.abs(e2 + 0.5836) < 0.0001, "Linear interpolation to exponential");
				
				var ei1 = parent.utils.linearToExponentialInverse(t1, x);
				var ei2 = parent.utils.linearToExponentialInverse(t2, x);
				ok(Math.abs(ei1 - 1.5881) < 0.0001, "Linear interpolation to inverse exponential");
				ok(Math.abs(ei2 + 200.6997) < 0.0001, "Linear interpolation to inverse exponential");
			});	
	
		}
	};
	
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);