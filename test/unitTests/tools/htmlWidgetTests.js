var hemi = (function(parent, jQuery) {
	o3djs.require('hemi.tools.htmlWidget');

	parent.test = parent.test || {};
	
	var UnitTest = {
		runTests: function() {
			module("tools");
			
			test("HtmlWidgetConfig: constructor", function() {
				expect(2);
				
				var containerId = '';
				var contentFileName = '';
				
				var config = new parent.tools.HtmlWidgetConfig();
				
				equals(config.containerId, containerId, "Initial container id");
				equals(config.contentFileName, contentFileName, "Initial content file name");
			});
			
			test("HtmlWidget: constructor", function() {
				expect(4);
				
				var container = null;
				var visible = false;
				var config = new parent.tools.HtmlWidgetConfig();
				
				var widget = new parent.tools.HtmlWidget(config);
				
				same(widget.config, config, "Initial configuration");
				equals(widget.container, container, "Initial container");
				equals(widget.visible, visible, "Initial visible flag");
				equals(widget.getId(), null, "Initial id");
			});
			
			test("HtmlWidget: toOctane", function() {
				expect(2);
				
				var containerId = 'viewerContent';
				var contentFileName = 'assets/tools/manometerDisplay.htm';
				var config = new parent.tools.HtmlWidgetConfig();
				config.containerId = containerId;
				config.contentFileName = contentFileName;
				
				var widget = new parent.tools.HtmlWidget(config);
				var octane = widget.toOctane();
				
				equals(octane.ci, containerId, "Container id exported to Octane");
				equals(octane.cf, contentFileName, "Content file name exported to Octane");
			});
			
			asyncTest("HtmlWidget: loadConfig/removeContent", function() {
				expect(3);
				
				var timeOut = 1500;
				var containerId = 'viewerContent';
				var contentFileName = 'assets/tools/manometerDisplay.htm';
				var config = new parent.tools.HtmlWidgetConfig();
				config.containerId = containerId;
				config.contentFileName = contentFileName;
				
				var widget = new parent.tools.HtmlWidget(config);
				
				widget.loadConfig(function() {
					ok(widget.container, "Content loaded from file");
					var content = widget.removeContent();
					equals(content.parentNode, null, "Content removed from widget");
					equals(widget.container, null, "Widget container set to null");
					start();
				});
				
				setTimeout(function(){
					start();
				}, timeOut);
			});
			
			asyncTest("HtmlWidget: getElement", function() {
				expect(2);
				
				var timeOut = 1500;
				var containerId = 'viewerContent';
				var contentFileName = 'assets/tools/manometerDisplay.htm';
				var config = new parent.tools.HtmlWidgetConfig();
				config.containerId = containerId;
				config.contentFileName = contentFileName;
				var elementName1 = 'left-text';
				var elementName2 = 'not-there';
				
				var widget = new parent.tools.HtmlWidget(config);
				
				widget.loadConfig(function() {
					var element = widget.getElement(elementName1);
					ok(element.length > 0, "Element retrieved from content");
					element = widget.getElement(elementName2);
					ok(element.length == 0, "Non-existent element not retrieved from content");					start();
				});
				
				setTimeout(function(){
					start();
				}, timeOut);
			});
			
			test("HtmlWidget: setVisible/notify", function() {
				expect(4);
				
				var config = new parent.tools.HtmlWidgetConfig();
				var visible1 = true;
				var visible2 = false;
				
				var widget = new parent.tools.HtmlWidget(config);
				
				equals(widget.visible, visible2, "Initial visible flag");
				widget.setVisible(visible1);
				equals(widget.visible, visible1, "Widget visible flag set directly");
				widget.notify(parent.tools.ToolEventType.Visible, visible2);
				equals(widget.visible, visible2, "Widget visible flag set through notify");
				widget.notify(parent.tools.ToolEventType.Enable, visible1);
				equals(widget.visible, visible2, "Widget visible flag not set through notify");
			});
			
			test("UpdateHtmlWidgetEvent: constructor", function() {
				expect(3);
				
				var visible = true;
				var config = new parent.tools.HtmlWidgetConfig();
				var widget = new parent.tools.HtmlWidget(config);
				var event = new parent.tools.UpdateHtmlWidgetEvent(widget, visible);
				
				equals(event.widget, widget, "Initial event widget");
				equals(event.visible, visible, "Initial visible flag");
				equals(event.getId(), null, "Initial id");
			});
			
			test("UpdateHtmlWidgetEvent: toOctane", function() {
				expect(2);
				
				var visible = true;
				var widgetId = 71;
				var config = new parent.tools.HtmlWidgetConfig();
				var widget = new parent.tools.HtmlWidget(config);
				widget.setId(widgetId);
				
				var event = new parent.tools.UpdateHtmlWidgetEvent(widget, visible);
				var octane = event.toOctane();
				
				equals(octane.wi, widgetId, "Widget id exported to Octane");
				equals(octane.vi, visible, "Visible exported to Octane");
			});
			
			test("UpdateHtmlWidgetEvent: fireEvent", function() {
				expect(1);
				
				var visible = true;
				var config = new parent.tools.HtmlWidgetConfig();
				var widget = new parent.tools.HtmlWidget(config);
				
				var event = new parent.tools.UpdateHtmlWidgetEvent(widget, visible);
				event.fireEvent();
				
				equals(widget.visible, visible, "Event set visible flag for widget");
			});
		}
	};
	
	parent.test.addUnitTest(UnitTest);
	
	return parent;
})(hemi || {}, jQuery);
