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
