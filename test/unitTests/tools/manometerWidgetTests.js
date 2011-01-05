var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.tools.htmlWidget');
	o3djs.require('hemi.tools.manometerWidget');

	parent.test = parent.test || {};
	
	var UnitTest = {
		runTests: function() {
			module("tools");
			
			test("ManometerWidgetConfig: constructor", function() {
				expect(3);
				
				var containerId = 'viewerContent';
				var contentFileName = 'assets/tools/manometerDisplay.htm';
				var rightDisplay = parent.tools.ManometerDisplayMode.Pressure;
				
				var config = new parent.tools.ManometerWidgetConfig();
				
				equals(config.containerId, containerId, "Initial container id");
				equals(config.contentFileName, contentFileName, "Initial content file name");
				equals(config.rightDisplay, rightDisplay, "Initial right display enum");
			});
			
			asyncTest("ManometerWidget: constructor", function() {
				expect(11);
				
				var timeOut = 1500;
				var container = null;
				var visible = false;
				var contentFileName = 'assets/tools/manometerDisplay.htm';
				var config = new parent.tools.ManometerWidgetConfig();
				config.contentFileName = contentFileName;
				
				var widget = new parent.tools.ManometerWidget(config);
				
				// Inherited attributes
				same(widget.config, config, "Initial configuration");
				equals(widget.container, container, "Initial container");
				equals(widget.visible, visible, "Initial visible flag");
				equals(widget.getId(), null, "Initial id");
				
				setTimeout(function(){
					ok(widget.deviceName, "Device name loaded");
					ok(widget.leftDisplay, "Left display loaded");
					ok(widget.rightDisplay, "Right display loaded");
					ok(widget.rightPrMode, "Right pressure mode loaded");
					ok(widget.rightFlMode, "Right flow mode loaded");
					ok(widget.rightPaUnits, "Right Pascal units loaded");
					ok(widget.rightCfmUnits, "Right CFM units loaded");
					start();
				}, timeOut);
			});
			
			test("ManometerWidget: toOctane", function() {
				expect(3);
				
				var timeOut = 1500;
				var rightDisplay = parent.tools.ManometerDisplayMode.Pressure;
				var container = null;
				var visible = false;
				var containerId = 'viewerContent';
				var contentFileName = 'assets/tools/manometerDisplay.htm';
				var config = new parent.tools.ManometerWidgetConfig();
				config.containerId = containerId;
				config.contentFileName = contentFileName;
				
				var widget = new parent.tools.ManometerWidget(config);
				var octane = widget.toOctane();
				
				equals(octane.rd, parent.tools.ManometerDisplayMode.Pressure, "Right display enum exported to Octane");
				// Inherited attributes
				equals(octane.ci, containerId, "Container id exported to Octane");
				equals(octane.cf, contentFileName, "Content file name exported to Octane");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
