var editor = (function(module) {
	module.ui = module.ui || {};
	
    module.EventTypes = module.EventTypes || {};
	
	module.ui.ComponentDefaults = {
		id: '',
		immediateLayout: true,
		uiFile: null,
		showOptions: null,
		hideOptions: null,
		finishLayout: null
	};
	
	module.ui.Component = module.utils.Listenable.extend({
		init: function(options) {
			this._super();
			
	        this.config = jQuery.extend({}, module.ui.ComponentDefaults, options);
			this.container = null;
			this.visible = false;
			
			if (this.config.immediateLayout) {
				this.layout();
			}
		},
		
		layout: function() {
			if (this.config.uiFile && this.config.uiFile !== '') {
				this.load();
			}
			else {
				this.finishLayout();
			}
		},
		
		finishLayout: function() {
			var layoutFcn = this.config.finishLayout;
			
			if (layoutFcn && jQuery.isFunction(layoutFcn)) {
				layoutFcn.call(this);
			}
		},
		
		load: function() {
			var cmp = this;

			if (this.config.uiFile && this.config.uiFile !== '') {
				hemi.loader.loadHtml(this.config.uiFile, function(data) {
					cmp.container = jQuery(data);
					cmp.finishLayout();
				});
			}
		},
		
		getUI: function() {
			return this.container;
		},
		
		setVisible: function(visible) {
			if (visible) {
				this.container.show(this.config.showOptions);
			}
			else {
				this.container.hide(this.config.hideOptions);
			}
		},
		
		isVisible: function() {
			return this.container.is(':visible');
		},
		
		find: function(query) {
			return this.container.find(query);
		}
	});
	
	return module;
})(editor || {});
