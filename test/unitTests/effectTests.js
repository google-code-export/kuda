var hemi = (function(parent, jQuery) {
	
	parent.test = parent.test || {};
	parent.test.effect = parent.test.effect || {};
	
	o3djs.require('hemi.effect');
	
	var UnitTest = {
		name: 'effect',
		runTests: function() {
			module(this.name);

			test("ParticleFunction: constructor", function() {
				expect(3);
				
				var specs = new parent.effect.ParticleFunction();
				
				equals(specs.functionId, null, "Initial function id");
				same(specs.accFactor, [0, 0, 0], "Initial acceleration factor");
				equals(specs.sizeFactor, 1.0, "Initial size factor");
			});
			
			test("ParticleFunction: to Octane", function() {
				expect(0);
			});
			
			test("Effect: default constructor", function() {
				expect(6);
				
				var effect = new hemi.effect.Effect();
				
				equals(effect.effectType, hemi.effect.EffectType.ParticleEmitter, "Initial effect type");
				equals(effect.state, hemi.core.particles.ParticleStateIds.BLEND, "Initial state");
				same(effect.colorRamp, [], "Initial color ramp");
				same(effect.params, {}, "Initial parameters");
				equals(effect.particleFunction, null, "Initial function specs");
				equals(effect.isAnimating, false, "Initial animating state");
			});
			
			test("Effect: to Octane", function() {
				expect(0);
			});

		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
