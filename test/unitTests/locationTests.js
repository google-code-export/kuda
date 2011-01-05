var hemi = (function(parent, jQuery) {
    o3djs.require('hemi.location');

	parent.test = parent.test || {};
	
	var LocationListener = function (id) {
		this.worldId = id;
		this.type = null;
		this.value = null;
	};

	LocationListener.prototype = {
		
		getId: function() {
			return this.worldId;
		},
		
		notify: function(eventType, value) {
			this.type = eventType;
			this.value = value;
		}
	};
	
	var UnitTest = {
		name: 'location',
		runTests: function() {
			module(this.name);
			
			test("Portal: constructor", function() {
				expect(4);
				
				var locationA = null;
				var locationB = null;
				var area = 0;
				
				var portal = new parent.location.Portal();
				
				equals(portal.locationA, locationA, "Initial value");
				equals(portal.locationB, locationB, "Initial location");
				equals(portal.area, area, "Initial area");
				// Inherited attributes
				equals(portal.getId(), null, "Initial id");
			});
			
			test("Portal: toOctane", function() {
				expect(0);
			});
			
			test("Portal: updateAirFlow", function() {
				expect(2);
				
				var locationAPressure = 200;
				var locationBPressure = 350;
				var locationA = new parent.location.Location();
				var locationB = new parent.location.Location();
				locationA.setPressure(locationAPressure)
				locationB.setPressure(locationBPressure);
				var area = 40;
				var airFlow = area * Math.pow(Math.abs(locationAPressure - locationBPressure), 0.65) * 0.589;
				
				var portal = new parent.location.Portal();
				portal.setLocationA(locationA);
				portal.setLocationB(locationB);
				portal.setArea(area);
				portal.updateAirFlow();
				
				equals(locationA.getAirFlow(), airFlow, "Location A air flow updated");
				equals(locationB.getAirFlow(), -airFlow, "Location B air flow updated");
			});
			
			test("Location: constructor", function() {
				expect(4);
				
				var volume = 0;
				var pressure = 0;
				var airFlow = 0;
				
				var location = new parent.location.Location();
				
				equals(location.volume, volume, "Initial volume");
				equals(location.pressure, pressure, "Initial pressure");
				equals(location.airFlow, airFlow, "Initial air flow");
				equals(location.getId(), null, "Initial id");
			});
			
			test("Location: toOctane", function() {
				expect(0);
			});
			
			test("Location: updatePressure", function() {
				expect(2);
				
				var volume = 230;
				var airFlow = 85;
				var listenerId = 8;
				var refreshTime = 0.001;
				var listener = new LocationListener(listenerId);
				var pressure = 0.001 * airFlow * 47.8224 / volume;
				
				var location = new parent.location.Location();
				location.setVolume(volume);
				location.addAirFlow(airFlow);
				location.updatePressure(refreshTime);
				
				equals(location.getPressure(), pressure, "Location pressure updated");
				equals(location.getAirFlow(), 0, "Location air flow reset");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
