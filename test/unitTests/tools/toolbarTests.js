var hemi = (function(parent, jQuery) {

    parent.test = parent.test || {};
    
    o3djs.require('hemi.tools.toolbarWidget');
    o3djs.require('hemi.tools.toolbar');
        
    var UnitTest = {
        runTests: function() {
            module("toolbar");
            
            test("Toolbar: constructor", function() {
                var config = new parent.tools.ToolbarConfig();
                config.toolbarId = 'testId';
                var toolbar = new parent.tools.Toolbar(config);
                
                equals(toolbar.config.toolbarId, config.toolbarId, "Container id is the same");
                ok(toolbar.toolbar != null, "Container isn't null");
                equals(toolbar.toolbar.attr("id"), config.toolbarId, "Container id is the same as element id");
				equals(toolbar.widgets.length, 0, "Tools list empty");
            });
            
            test("Toolbar: addTool", function() {
				var widget = new parent.tools.ToolbarWidget();
				var widget2 = {
					container: null
				};
				var toolbar = new parent.tools.Toolbar();
				
				// add a legit widget
				var retVal = toolbar.addTool(widget);
				ok(retVal, "toolbar.addTool() returned true");
				equals(toolbar.widgets.length, 1, "Tools list size == 1");
				equals(toolbar.widgets[0], widget, "Widget is in the tools list");
				
				// add a non-legit widget
				retVal = toolbar.addTool(widget2);
				ok(!retVal, "toolbar.addTool() returned false");
				equals(toolbar.widgets.length, 1, "Tools list size == 1");
            });
        }
    };
    
    parent.test.addUnitTest(UnitTest);
    
    return parent;
})(hemi || {}, jQuery);
