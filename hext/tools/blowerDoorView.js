o3djs.require('hext.tools.htmlView');
o3djs.require('hext.tools.toolbarView');

var hext = (function(hext) {
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BlowerDoorViewConfig contains configuration options for a
	 * BlowerDoorView.
	 * @extends hext.tools.HtmlViewConfig
	 */
	hext.tools.BlowerDoorViewConfig = function() {
		hext.tools.HtmlViewConfig.call(this);
		
		/**
		 * @see hext.tools.HtmlViewConfig#contentFileName
		 * @default 'hext/tools/assets/blowerDoorDisplay.htm'
		 */
		this.contentFileName = 'hext/tools/assets/blowerDoorDisplay.htm';
		
		/**
		 * The id for the HTML element containing the BlowerDoor knob widget.
		 * @type string
		 * @default 'blowerDoorKnob'
		 */
		this.blowerDoorKnobId = 'blowerDoorKnob';
	};
	
	/**
	 * @class A BlowerDoorView is the HTML view for a BlowerDoor.
	 * @extends hext.tools.HtmlView
	 * 
	 * @param {hext.tools.BlowerDoorViewConfig} config configuration options
	 */
	hext.tools.BlowerDoorView = function(config) {
		hext.tools.HtmlView.call(this, config);
		
		this.knob = null;
		this.canvasKnob = null;
		
		var that = this;
		
		this.addLoadCallback(function () {
			that.knob = that.getElement(that.config.blowerDoorKnobId);
		});
	};
	
	hext.tools.BlowerDoorView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.BlowerDoorView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BlowerDoorView.
		 */
		cleanup: function() {
			hext.tools.HtmlView.prototype.cleanup.call(this);
			
			if (this.knob && this.knob.rotate) {
				this.knob.rotate.unbind();
			}
			
			this.knob = null;
			this.canvasKnob = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
		},
		
		/**
		 * Rotate the knob widget by the specified value.
		 * 
		 * @param {number} value the amount to rotate the knob widget
		 */
		rotateKnob: function(value) {
			if (this.canvasKnob) {
				this.canvasKnob.rotateAnimation(value);
			}
		}
	};
    
	/**
	 * @class A BlowerDoorToolbarViewConfig contains configuration options
	 * for a BlowerDoorToolbarView.
	 * @extends hext.tools.ToolbarViewConfig
	 */
    hext.tools.BlowerDoorToolbarViewConfig = function() {
        hext.tools.ToolbarViewConfig.call(this);
		
		/**
		 * @see hext.tools.ToolbarViewConfig#containerId
		 * @default 'blowerDoorToolbarView'
		 */
		this.containerId = 'blowerDoorToolbarView';
		
		/**
		 * The id for the HTML element containing the BlowerDoor toolbar
		 * button.
		 * @type string
		 * @default 'blowerDoorButtonId'
		 */
		this.buttonId = 'blowerDoorButtonId';
    };
	
	/**
	 * @class A BlowerDoorToolbarView is the toolbar view for a BlowerDoor.
	 * @extends hext.tools.ToolbarView
	 * 
	 * @param {hext.tools.BlowerDoorToolbarViewConfig} config configuration
	 *     options
	 */
	hext.tools.BlowerDoorToolbarView = function(config) {
		this.button = null;
        config = jQuery.extend(new hext.tools.BlowerDoorToolbarViewConfig(), config);
        hext.tools.ToolbarView.call(this, config);
	};
	
    hext.tools.BlowerDoorToolbarView.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.BlowerDoorToolbarView',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BlowerDoorToolbarView.
		 */
		cleanup: function() {
			hext.tools.ToolbarView.prototype.cleanup.call(this);
			
			if (this.button) {
				this.button.unbind();
				this.button = null;
			}
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			
	    },
		
    	/**
		 * Create the actual toolbar button element for the
		 * BlowerDoorToolbarView.
		 */
	    layoutView: function() {
	        this.button = jQuery('<button id="' + this.config.buttonId + '" title="Blower Door Tool">Blower Door</button>');
			this.container.append(this.button);
		}
    };
	
	return hext;
})(hext || {});

/*
 * Wait until the DOM is loaded (and hext and hemi are defined) before
 * performing inheritance.
 */
jQuery(window).ready(function() {
	hext.tools.BlowerDoorViewConfig.inheritsFrom(hext.tools.HtmlViewConfig);
	hext.tools.BlowerDoorView.inheritsFrom(hext.tools.HtmlView);
    hext.tools.BlowerDoorToolbarViewConfig.inheritsFrom(hext.tools.ToolbarViewConfig);
    hext.tools.BlowerDoorToolbarView.inheritsFrom(hext.tools.ToolbarView);
});