o3djs.require('hemi.dispatch');
o3djs.require('hemi.msg');
o3djs.require('hemi.world');

var hext = (function(hext) {
	
	hext.tools = hext.tools || {};
	
	/**
	 * @class A BaseController represents the functionality common to
	 * controllers for all tools. It sets up Message handling between the model
	 * and views.
	 * @extends hemi.world.Citizen
	 */
	hext.tools.BaseController = function() {
		hemi.world.Citizen.call(this);
		
		/**
		 * The tool model.
		 * @type hext.tools.BaseTool
		 */
		this.model = null;
		
		/**
		 * The tool HTML view.
		 * @type hext.tools.HtmlView
		 */
		this.view = null;
		
		/**
		 * The tool shape view.
		 * @type hext.tools.ShapeView
		 */
		this.shapeView = null;
		
		/**
		 * The tool toolbar view.
		 * @type hext.tools.ToolbarView
		 */
		this.toolbarView = null;
	};
	
	hext.tools.BaseController.prototype = {
        /**
         * Overwrites hemi.world.Citizen.citizenType
         */
		citizenType: 'hext.tools.BaseController',
		
		/**
		 * Send a cleanup Message and remove all references in the
		 * BaseController.
		 */
		cleanup: function() {
			hemi.world.Citizen.prototype.cleanup.call(this);
			
			this.model = null;
			this.view = null;
			this.shapeView = null;
			this.toolbarView = null;
		},
		
		/*
		 * Not currently supported.
		 */
		toOctane: function() {
			var octane = {
				// TODO... or maybe not!
			};
			
			return octane;
		},
		
		/**
		 * Set the BaseController's tool model that it interacts with.
		 * 
		 * @param {hext.tools.BaseTool} model the tool model
		 */
		setModel: function(model) {
			this.model = model;
			
			if (this.model && this.toolbarView) {
				this.setupToolbar();
			}
			if (this.model && this.view) {
                this.setupView();
                this.view.loadConfig();
			}
		},
		
		/**
		 * Set the BaseController's tool view that represents the tool as an
		 * HTML widget.
		 * 
		 * @param {hext.tools.HtmlView} view the tool view
		 */
		setView: function(view) {
			this.view = view;
			
			if (this.model && this.view) {
				this.setupView();
                this.view.loadConfig();
			}
		},
		
		/**
		 * Set the BaseController's tool shape view that represents the tool as
		 * a 3D shape.
		 * 
		 * @param {hext.tools.ShapeView} shapeView the tool shape view
		 */
		setShapeView: function(shapeView) {
			this.shapeView = shapeView;
			
			if (this.model && this.shapeView) {
				this.setupShape();
			}
		},
		
		/**
		 * Set the BaseController's toolbar view that represents the tool as a
		 * toolbar icon.
		 * 
		 * @param {hext.tools.ToolbarView} toolbarView the toolbar view
		 */
		setToolbarView: function(toolbarView) {
			this.toolbarView = toolbarView;
			
			if (this.model && this.toolbarView) {
				this.setupToolbar();
			}
		},
		
		/**
		 * Setup the tool's HTML view to handle Messages from the tool model.
		 * This is called automatically when the view is set.
		 */
		setupView: function() {
			this.model.subscribe(
				hemi.msg.visible,
				this.view,
				'setVisible',
				[hemi.dispatch.MSG_ARG + 'data.visible']);
		},
		
		/**
		 * Setup the tool's shape view to handle Messages from the tool model.
		 * This is called automatically when the shape view is set.
		 */
		setupShape: function() {
			this.shapeView.setVisible(this.model.visible);
			
			this.model.subscribe(
				hemi.msg.visible,
				this.shapeView,
				'setVisible',
				[hemi.dispatch.MSG_ARG + 'data.visible']);
		},
		
		/**
		 * Setup the tool's toolbar view to update the tool model when it is
		 * clicked. This is called automatically when the toolbar view is set.
		 */
		setupToolbar: function() {
			var toolModel = this.model;
			var toolbarView = this.toolbarView;
			
			this.toolbarView.button.bind('click', function(evt) {
				toolModel.setVisible(!toolModel.visible);
				toolbarView.setClickedState(toolModel.visible);
			});
		}
	};
	
	hext.tools.BaseController.inheritsFrom(hemi.world.Citizen);
	
	return hext;
})(hext || {});
