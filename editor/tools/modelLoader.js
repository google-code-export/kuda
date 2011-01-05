var editor = (function(module) {
	module.tools = module.tools || {};
	
	module.EventTypes = module.EventTypes || {};
	
	// model specific
	module.EventTypes.ModelLoadBegun = "modelLoader.ModelLoadBegun";
	module.EventTypes.ModelLoadFinished = "modelLoader.ModelLoadFinished";
	
	// view specific
	module.EventTypes.LoadModel = "modelLoader.LoadModel";
	
	Mode = {
		Form: 0,
		Processing: 1,
		Finished: 2
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * An ModelLoaderModel handles the creation and playing of animations as well
	 * as model picking for the animation tool.
	 */
	module.tools.ModelLoaderModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
		},
		
		loadModel: function(url) {
			var model = new hemi.model.Model();
			var that = this;
			
			var msgHandler = model.subscribe(hemi.msg.load,
				function(msg) {
					that.notifyListeners(module.EventTypes.ModelLoadFinished, null);
					model.unsubscribe(msgHandler, hemi.msg.load);
				});
			
			this.notifyListeners(module.EventTypes.ModelLoadBegun, null);
			model.setFileName(url);
		}
	});
	
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
	
	/*
	 * Configuration object for the AnimatorView.
	 */
	module.tools.ModelLoaderViewDefaults = {
		dlgFileName: 'editor/tools/html/modelLoader.htm',
		toolName: 'ModelLoader',
		widgetId: 'mdlLoaderBtn'
	};
	
	/**
	 * The ModelLoaderView controls the dialog and toolbar widget for the
	 * animation tool.
	 *
	 * @param {Object} options configuration options.  Uses
	 *         editor.tools.ModelLoaderViewDefaults as default options
	 */
	module.tools.ModelLoaderView = module.tools.ToolView.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.ModelLoaderViewDefaults, options);
			this._super(newOpts);
			
			this.currentMode;
			this.currentPanel;
			this.formPanel;
			this.processingPanel;
			this.finishedPanel;
			
			var view = this;
			
			this.loaderDialog = new module.ui.Dialog({
				uiFile: 'editor/tools/html/modelLoader.htm',
				position: module.ui.Position.CENTER,
				finishLayout: function() {
					var dlg = this;
					
					this.find('form').submit(function() {
						return false;
					});
					
					view.currentPanel = view.formPanel = this.find('#mlForm');
					view.processingPanel = this.find('#mlProcessing').hide();
					view.finishedPanel = this.find('#mlFinished').hide();			
		            var path = 'assets/';
					
		            this.find('#mlModelUrl').val(path);
					
					this.find('#mlLoadBtn').bind('click', function(evt) {
						var url = dlg.find('#mlModelUrl').val();
						view.notifyListeners(module.EventTypes.LoadModel, url);
					});
				}
			});
		},
		
		showDialog: function() {
			this.setMode(Mode.Form);
			this.loaderDialog.find('#mlModelUrl').val('assets/');
			this.loaderDialog.setVisible(true);
		},
		
		setMode: function(mode) {
			var view = this;
			
			this.currentPanel.hide();
			switch (mode) {
				case Mode.Form:
					this.currentPanel = this.formPanel;
					break;
				case Mode.Processing:
					this.currentPanel = this.processingPanel;
					break;
				case Mode.Finished:
					this.currentPanel = this.finishedPanel;
					setTimeout(function() {
						view.loaderDialog.setVisible(false);
					}, 1000);
					break;
			}
			
			this.currentPanel.show();
		}
	});
	
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * The ModelLoaderController facilitates ModelLoaderModel and
	 * ModelLoaderView communication by binding event and message handlers.
	 */
	module.tools.ModelLoaderController = module.tools.ToolController.extend({
		init: function() {
			this._super();
		},
		
		/**
		 * Binds event and message handlers to the view and model this object
		 * references.
		 */
		bindEvents: function() {
			this._super();
			
			var model = this.model,
				view = this.view,
				that = this;
			
			// view specific
			view.addListener(module.EventTypes.LoadModel, function(url) {
				model.loadModel(url);
			});
			
			// model specific
			model.addListener(module.EventTypes.ModelLoadBegun, function() {
				view.setMode(Mode.Processing);
			});			
			model.addListener(module.EventTypes.ModelLoadFinished, function() {
				view.setMode(Mode.Finished);
			});
		}
	});
	
	return module;
})(editor || {});
