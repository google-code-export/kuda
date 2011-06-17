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
    
    module.ui.ActionbarDefaults = {
        containerId: 'actionsPane',
		parentId: 'actionBar'
    };	
    
    module.ui.ActionBar = module.ui.Component.extend({
		init: function(options) {        
	       	var newOpts = jQuery.extend({}, module.ui.ActionbarDefaults, options);
			this.widgets = [];
				
			this._super(newOpts);
	    },
		
		finishLayout: function() {
	        this.container = jQuery('<div class="toolActionBar"></div>');
			this.container.attr('id', this.config.containerId);
		
			jQuery('#' + this.config.parentId).append(this.container);
		},
		
		addWidget: function(widget) {
			this.widgets.push(widget);
			this.container.append(widget.getUI());
		},
		
		setVisible: function(visible) {
			if (visible) {
				this.container.show();
			}
			else {
				this.container.hide();
			}
		},
		
		isVisible: function() {
			return this.container.is(':visible');
		},
		
		find: function(query) {
			for (var ndx = 0, len = this.widgets.length; ndx < len; ndx++) {
				var found = this.widgets[ndx].find(query);
				if (found) {
					return found;
				}
			}
		}
    });
	
	module.ui.ActionBarWidgetDefaults = {
		uiFile: ''
	};
	
	module.ui.ActionBarWidget = module.ui.Component.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.ui.ActionBarWidgetDefaults, options);
			this._super(newOpts);
		},

		/**
		 * Empty method. Override to provide your own reset for an action bar.
		 * Calling this should result in the action bar being reset to its 
		 * original state.
		 */
		reset : function() {

		}
	});
    
    return module;
})(editor || {});
