/* 
 * Kuda includes a library and editor for authoring interactive 3D content for the web.
 * Copyright (C) 2011 SRI International.
 *
 * This program is free software; you can redistribute it and/or modify it under the terms
 * of the GNU General Public License as published by the Free Software Foundation; either 
 * version 2 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; 
 * if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, 
 * Boston, MA 02110-1301 USA.
 */

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
				this.container.append(tool.getUI());
				
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
					found.getUI().remove();
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
