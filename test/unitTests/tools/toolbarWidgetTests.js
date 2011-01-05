var hemi = (function(parent, jQuery) {

    parent.test = parent.test || {};
    
    o3djs.require('hemi.tools.toolbarWidget');
        
    var UnitTest = {
        runTests: function() {
            module("toolbarWidget");
            
            test("ToolbarWidget: constructor", function() {
				var config = new parent.tools.ToolbarWidgetConfig();
				config.containerId = 'testId';
				var widget = new parent.tools.ToolbarWidget(config);
				
				equals(widget.config.containerId, config.containerId, "Container id is the same");
				ok(widget.container != null, "Container isn't null");
				equals(widget.container.attr("id"), config.containerId, "Container id is the same as element id");
            });
            
            test("ToolbarWidget: toOctane", function() {
                var config = new parent.tools.ToolbarWidgetConfig();
                config.containerId = 'testId';
                var widget = new parent.tools.ToolbarWidget(config);
				var id = 245;
				widget.setId(id);
				
				var octane = widget.toOctane();
				
                equals(octane.wi, widget.getId(), "Octane world id is the same");
				equals(octane.ci, config.containerId, "Octane container id is the same");
            });
        }
    };
    
    parent.test.addUnitTest(UnitTest);
    
    return parent;
})(hemi || {}, jQuery);
