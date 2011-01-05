o3djs.require('hext.tools.toolbarView');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A NavigationToolbarViewConfig contains configuration options for
	 * a NavigationToolbarView.
	 * @extends hext.tools.ToolbarViewConfig
	 */
	hext.tools.NavigationToolbarViewConfig = function() {
		hext.tools.ToolbarViewConfig.call(this);
		
		/**
		 * @see hext.tools.ToolbarViewConfig#containerId
		 * @default 'navigateToolbarView'
		 */
		this.containerId = 'navigateToolbarView';
		
		/**
		 * The id for the HTML element containing the Navigation 'zoom in'
		 * toolbar button.
		 * @type string
		 * @default 'zoomInButtonId'
		 */
		this.zoomInButtonId = 'zoomInButtonId';
		
		/**
		 * The id for the HTML element containing the Navigation 'zoom out'
		 * toolbar button.
		 * @type string
		 * @default 'zoomOutButtonId'
		 */
		this.zoomOutButtonId = 'zoomOutButtonId';
	};
	
	/**
	 * @class A NavigationToolbarView is the toolbar view for a Navigation
	 * tool.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {hext.tools.NavigationToolbarViewConfig} config configuration
	 *     options
	 */
	hext.tools.NavigationToolbarView = function(config) {
		this.zoomInBtn = null;
		this.zoomOutBtn = null;
		config = jQuery.extend(new hext.tools.NavigationToolbarViewConfig(), config);
		hext.tools.ToolbarView.call(this, config);
	};
	
	hext.tools.NavigationToolbarView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.NavigationToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * NavigationToolbarView.
		 */
		cleanup: function() {
			hext.tools.ToolbarView.prototype.cleanup.call(this);
			
			if (this.zoomInBtn) {
				this.zoomInBtn.unbind();
				this.zoomInBtn = null;
			}
			if (this.zoomOutBtn) {
				this.zoomOutBtn.unbind();
				this.zoomOutBtn = null;
			}
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
	    },
		
    	/**
		 * Create the actual toolbar button elements for the
		 * NavigationToolbarView.
		 */
		layoutView: function() {
			this.zoomInBtn = jQuery('<button id="' + this.config.zoomInButtonId + '" title="Zoom In">Zoom In</button>');
			this.zoomOutBtn = jQuery('<button id="' + this.config.zoomOutButtonId + '" title="Zoom Out">Zoom Out</button>');
			this.container.append(this.zoomInBtn);
			this.container.append(this.zoomOutBtn);
		},
		
		/**
		 * Add or remove the clicked CSS class to the 'zoom in' button.
		 * 
		 * @param {boolean} clicked flag indicating if the
		 *     NavigationToolbarView was clicked
		 */
		setClickedState: function(clicked) {
			if (clicked) {
				this.zoomInBtn.addClass(this.config.clickClass);
			}
			else {
				this.zoomInBtn.removeClass(this.config.clickClass);
			}
		}
	};
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.NavigationToolbarViewConfig.inheritsFrom(hext.tools.ToolbarViewConfig);
	hext.tools.NavigationToolbarView.inheritsFrom(hext.tools.ToolbarView);
});