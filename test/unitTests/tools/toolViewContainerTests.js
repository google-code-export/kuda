var hemi = (function(parent, jQuery) {

    parent.test = parent.test || {};
    
    o3djs.require('hemi.tools.htmlWidget');
    o3djs.require('hemi.tools.toolViewContainer');
        
    var UnitTest = {
        runTests: function() {
            module("toolViewContainer");
            
            test("ToolViewContainer: constructor", function() {
                var config = new parent.tools.ToolViewContainerConfig();
                config.containerId = 'testId';
                var toolview = new parent.tools.ToolViewContainer(config);
                
                equals(toolview.config.containerId, config.containerId, "Container id is the same");
                ok(toolview.container != null, "Container isn't null");
                equals(toolview.container.attr("id"), config.containerId, "Container id is the same as element id");
                equals(toolview.widgets.length, 0, "Tools list empty");
            });
            
            test("ToolViewContainer: addTool", function() {
                var widget = new parent.tools.HtmlWidget();
                var widget2 = {
                    container: null
                };
                var toolview = new parent.tools.ToolViewContainer();
                
                // add a legit widget
                var retVal = toolview.addTool(widget);
                ok(retVal, "toolview.addTool() returned true");
                equals(toolview.widgets.length, 1, "Tools list size == 1");
                equals(toolview.widgets[0], widget, "Widget is in the tools list");
                
                // add a non-legit widget
                retVal = toolview.addTool(widget2);
                ok(!retVal, "toolview.addTool() returned false");
                equals(toolview.widgets.length, 1, "Tools list size == 1");
            });
        }
    };
    
    parent.test.addUnitTest(UnitTest);
    
    return parent;
})(hemi || {}, jQuery);
