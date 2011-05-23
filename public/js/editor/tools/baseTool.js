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
	module.tools = module.tools || {};
	
	/**
	 * Constants for setting up a tool.
	 */
	module.tools.ToolConstants = {
		TO_LEFT: 'toLeft',
		TO_RIGHT: 'toRight',
		MODE_DOWN: 'down',
		MODE_UP: 'up'
	};
	
	module.EventTypes = module.EventTypes || {};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ToolModel is the base tool model class.  All tool models should 
     * inherit this class to gain basic tool model functionality (such as being
     * an observable).
     */
	module.tools.ToolModel = module.utils.Listenable.extend({
		init: function() {
			this._super();
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   
	    
    /*
     * For tool clicked notifications.  Specific to views.
     */
    module.EventTypes.ToolClicked = "baseTool.ToolClicked";
    
    /*
     * For tool mode setting (either up or down in the case of the toolbar 
     * widget).  Specific to views.
     */
    module.EventTypes.ToolModeSet = "baseTool.ToolModeSet";
	
	/*
	 * For when the main dialog is closed for a tool.
	 */
    module.EventTypes.DialogClosed = "baseTool.DialogClosed";
	
	/*
	 * For when the hemi world object is loaded. 
	 */
    module.EventTypes.WorldLoaded = "baseTool.WorldLoaded";
	
	/*
	 * For when the hemi world object is cleaned up (unloaded).
	 */
    module.EventTypes.WorldCleaned = "baseTool.WorldCleaned";
	
	/*
	 * For when the sidebar has been set.
	 */
    module.EventTypes.SidebarSet = "baseTool.SidebarSet";	
	
    /*
     * Configuration object for the ToolView.
     */
    module.tools.ToolViewDefaults = {
        widgetId: null,
        toolName: 'toolName',
		toolTip: '',
        toolClass: 'toolBtn',
		axnBarId: null
    };
	
	/**
	 * The ToolView is the base tool view class.  All tool views should 
	 * inherit from this in order to be added to the toolbar.
	 * 
	 * @param {Object} options configuration options.  The defaults are defined
	 *         in editor.tools.ToolViewDefaults.
	 */
	module.tools.ToolView = module.utils.Listenable.extend({
		init: function(options) {
			this._super();
				
			this.config = jQuery.extend({}, module.tools.ToolViewDefaults, options);
			this.toolbarWidget = null;
			this.enabled = true;
			this.mode = module.tools.ToolConstants.MODE_UP;
			this.sidebarWidgets = [];
			this.visibleWidgets = [];
			
			if (this.config.axnBarId) {
				this.actionBar = new module.ui.ActionBar({
					containerId: this.config.axnBarId
				});
			
				this.actionBar.setVisible(false);
			}
			if (this.config.widgetId) {
				this.layoutToolbarWidget();
			}
			
			this.layoutActionBar();
		},
		
		/**
		 * Enables/disables this tool based on the enabled flag.
		 * 
		 * @param {boolean} enabled flag indicating whether to enable or disable
		 *        this.
		 */
		setEnabled: function(enabled) {
			if (this.enabled != enabled) {
				this.enabled = enabled;
				
				if (this.toolbarWidget) {
					if (enabled) {
						this.toolbarWidget.attr('disabled', '');
					}
					else {
						this.toolbarWidget.attr('disabled', 'disabled');
					}
				}
			}
		},
		
		/**
		 * Sets the tool mode (either editor.tools.ToolConstants.MODE_UP or
		 * editor.tools.ToolConstants.MODE_DOWN).
		 * 
		 * @param {string} mode either editor.tools.ToolConstants.MODE_UP or
		 *        editor.tools.ToolConstants.MODE_DOWN
		 */
		setMode: function(mode) {
			var oldMode = this.mode;
			this.mode = mode;
			
			if (this.toolbarWidget) {
				this.toolbarWidget.removeClass(oldMode);
				this.toolbarWidget.addClass(this.mode);
			}
			
			this.notifyListeners(module.EventTypes.ToolModeSet, {
				oldMode: oldMode,
				newMode: mode
			});
		},
		
		/**
		 * Returns the toolbar widget
		 * 
		 * @return {jQuery Object} the toolbar widget
		 */
		getUI: function() {
			return this.toolbarWidget;
		},
		
		/**
		 * Performs the layout of the toolbar widget.
		 */
		layoutToolbarWidget: function() {
			var view = this,
				left = 70;
			
			this.toolbarWidget = jQuery('<button id="' + this.config.widgetId 
                + '" class="' + this.config.toolClass + ' ' + this.mode 
				+ '" title="' + this.config.toolTip + '"><span>' 
				+ this.config.toolName + '</span></button>');
			
			
			this.toolHover = jQuery('<div class="toolHover">' + this.config.toolName + '</div>')
				.data('set', false);
			this.toolbarWidget.append(this.toolHover);
			
			this.toolbarWidget.bind('click', function() {
                view.notifyListeners(module.EventTypes.ToolClicked, view);
                view.setMode(module.tools.ToolConstants.MODE_DOWN);
			})
			.bind('mouseover', function(evt) {
				if (!view.toolHover.data('set')) {
					var elem = jQuery(this), 
						offset = elem.offset(), 
						top = offset.top, 
						height = elem.height();
					
					view.toolHover.offset({
						top: height / 2 - view.toolHover.outerHeight() / 2,
						left: left
					})
					.data('set', true);
				}
				
				if (view.mode !== module.tools.ToolConstants.MODE_DOWN) {
					view.toolHover.fadeIn(200);
				}
			})
			.bind('mouseout', function(evt) {
				view.toolHover.hide();
			});
		},
		
		/**
		 * Performs the layout of the actionbar.  Left empty intentionally since
		 * each sub class needs to fill out this method.
		 */
		layoutActionBar: function() {
			
		},
		
		addSidebarWidget: function(widget) {
			if (jQuery.inArray(widget, this.sidebarWidgets) === -1) {
				this[widget.getName()] = widget;
				this.sidebarWidgets.push(widget);
				
				widget.currentView = this;
				if (!widget.config.manualVisible) {
					this.visibleWidgets.push(widget);
				}
			}
		},
		
		removeSidebarWidget: function(widget) {
	        var ndx = this.sidebarWidgets.indexOf(widget);
	        
	        if (ndx != -1) {
	            var spliced = this.sidebarWidgets.splice(ndx, 1);
				
				delete this[widget.getName()];
	        }
		},
		
		setSidebar: function(sidebar) {
			this.sidebar = sidebar;
			this.notifyListeners(module.EventTypes.SidebarSet, sidebar);
		},
		
		getSidebar: function() {
			return this.sidebar || null;
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
    /**
     * The ToolController is the base tool controller class.  All tool 
     * controllers should inherit from this to get basic tool controller 
     * functionality.
     */
	module.tools.ToolController = module.Class.extend({
		init: function() {					
			this.model;
			this.view;
		},
	
		/**
		 * Sets the view to the given view.  If a model is already given, this
		 * calls bindEvents().
		 * 
		 * @param {editor.tools.ToolView} view the new view
		 */
		setView: function(view) {
			this.view = view;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		/**
		 * Sets the model to the given model.  If a view is already given, this
		 * calls bindEvents().
		 * 
		 * @param {editor.tools.ToolModel} model the new model
		 */
		setModel: function(model) {
			this.model = model;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		/**
	     * Returns true if the model and view are all set.
	     * 
	     * @return true if model and view are set, false otherwise.
	     */
		checkBindEvents: function() {
			return this.model && this.view;
		},
		
		/**
		 * Binds handlers and listeners to the view and model to facilitate
		 * communication.
		 */
		bindEvents: function() {
			var model = this.model,
				view = this.view,
				ctr = this,
				sbrWgts = view.sidebarWidgets,
				visFcn = function(val) {
					val.widget.shouldBeVisible = val.visible;
				};
						
			var handleWidgets = function(visible) {
				var sidebar = view.getSidebar(),
					sbrMinimized = sidebar.minimized;
				
				// if the tool is no longer selected
				if (!visible) {
					// save the visible widget state					
					for (var ndx = 0, len = sbrWgts.length; ndx < len; ndx++) {
						var wgt = sbrWgts[ndx];
						if (wgt.currentView === view && (wgt.isVisible() 
								|| wgt.shouldBeVisible)) {
							view.visibleWidgets.push(wgt);
							wgt.setVisible(false);
						}
					}
				}
				else {
					// restore the previous visible widget state
					var vis = view.visibleWidgets;
									
					for (var ndx = 0, len = vis.length; ndx < len; ndx++) {
						var wgt = vis[ndx];
						wgt.setVisible(sbrMinimized ? false : true);
						wgt.currentView = view;
						wgt.shouldBeVisible = true;
					}
					
					// reset the visible widgets list
					view.visibleWidgets = [];
				}				
			};
					
			for (var ndx = 0, len = sbrWgts.length; ndx < len; ndx++) {
				var wgt = sbrWgts[ndx];
				wgt.addListener(module.EventTypes.SBWidgetVisible, visFcn);
			}
        
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN;
				
				if (view.actionBar) {
					view.actionBar.setVisible(isDown);
				}
				
				handleWidgets(isDown);
	        });
			
			view.addListener(module.EventTypes.SidebarSet, function(sidebar) {			
				sidebar.addListener(module.EventTypes.SidebarMinimized, function(val) {
	            	var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
					handleWidgets(!val && isDown);
				});
			});
		}
	});
	
	return module;
})(editor || {});
