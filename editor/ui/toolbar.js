var editor = (function(module) {
	module.ui = module.ui || {};
	
	module.ui.ToolbarDefaults = {
		containerId: 'toolbar'
	};
	
	module.ui.Toolbar = module.ui.Component.extend({
		init: function(options) {		
			var newOpts = jQuery.extend({}, module.tools.ToolbarDefaults, options);
			this.tools = [];
				
			this._super(newOpts);
		},
		
		finishLayout: function() {		
			this.container = jQuery('#' + this.config.containerId);	
		},
		
		addTool: function(tool) {
			if (tool instanceof module.tools.ToolView) {
				this.tools.push(tool);
				this.container.append(tool.getToolbarDisplay());
				
				tool.addListener(module.EventTypes.ToolClicked, this);
			}
		},
		
		removeTool: function(tool) {
	        var found = null;
	        var ndx = this.tools.indexOf(tool);
	        
	        if (ndx != -1) {
	            var spliced = this.tools.splice(ndx, 1);
	            
	            if (spliced.length == 1) {
	                found = spliced[0];
					found.getToolbarDisplay().remove();
	            }
	        }
	        
	        return found;
		},
		
		notify: function(eventType, value) {
			if (eventType === module.EventTypes.ToolClicked) {
				var toolList = this.tools;		
						
	            for (ndx = 0, len = toolList.length; ndx < len; ndx++) {
	                var t = toolList[ndx];
	                
	                if (t != value) {
                        t.setMode(module.tools.ToolConstants.MODE_UP);
	                }
	            }
			}
 		}
	});
	
	return module;
})(editor || {});
