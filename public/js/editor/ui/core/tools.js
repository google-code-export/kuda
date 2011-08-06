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

var editor = (function(editor) {
	editor.ui = editor.ui || {};
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	Tool Bar	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	editor.ui.ToolbarDefaults = {
		containerId: 'toolbar'
	};
	
	editor.ui.Toolbar = editor.ui.Component.extend({
		init: function(options) {		
			var newOpts = jQuery.extend({}, editor.ui.ToolbarDefaults, options);
			this.tools = [];
				
			this._super(newOpts);
		},
		
		finishLayout: function() {		
			this.container = jQuery('<div class="toolbar"></div>');
			this.list = jQuery('<ul></ul>');
			
			this.container.append(this.list);
		},
		
		add: function(tool) {
			if (tool instanceof editor.ui.ToolView) {
				this.tools.push(tool);
				this.list.append(createListItem(tool));
				
				tool.addListener(editor.EventTypes.ToolClicked, this);
			}
		},
		
		getActiveTool: function() {
			for (var i = 0, il = this.tools.length; i < il; i++) {
				var tool = this.tools[i];
				if (tool.mode === editor.ui.ToolConstants.MODE_DOWN) {
					return tool;
				}
			}
			
			return null;
		},
		
		remove: function(tool) {
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
		
		setEnabled: function(enabled) {
			for (var i = 0, il = this.tools.length; i < il; i++) {
				this.tools[i].setEnabled(enabled);
			}
		},
		
		notify: function(eventType, value) {
			if (eventType === editor.EventTypes.ToolClicked) {
				var toolList = this.tools;		
						
	            for (ndx = 0, len = toolList.length; ndx < len; ndx++) {
	                var t = toolList[ndx];
	                
	                if (t != value) {
                        t.setMode(editor.ui.ToolConstants.MODE_UP);
	                }
	            }
			}
 		}
	});
	
	/**
	 * Constants for setting up a tool.
	 */
	editor.ui.ToolConstants = {
		MODE_DOWN: 'down',
		MODE_UP: 'up'
	};
	
	editor.EventTypes = editor.EventTypes || {};
	
    editor.EventTypes.Created = "Created";	
    editor.EventTypes.Updated = "Updated";
    editor.EventTypes.Removed = "Removed";		
    editor.EventTypes.Cancel = "Cancel";	
    editor.EventTypes.SidebarSet = "SidebarSet";	
    editor.EventTypes.ToolClicked = "ToolClicked";
    editor.EventTypes.ToolModeSet = "ToolModeSet";
    editor.EventTypes.WorldLoaded = "WorldLoaded";
    editor.EventTypes.WorldCleaned = "WorldCleaned";
	editor.EventTypes.WidgetVisible = "WidgetVisible";
	editor.EventTypes.PanelVisible = "PanelVisible";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ToolModel is the base tool model class.  All tool models should 
     * inherit this class to gain basic tool model functionality (such as being
     * an observable).
     */
	editor.ui.ToolModel = editor.utils.Listenable.extend({
		init: function() {
			this._super();
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   
	
    /*
     * Configuration object for the ToolView.
     */
    editor.ui.ToolViewDefaults = {
        widgetId: null,
        toolName: 'toolName',
		toolTip: '',
		axnBarId: null
    };
	
	/**
	 * The ToolView is the base tool view class.  All tool views should 
	 * inherit from this in order to be added to the toolbar.
	 * 
	 * @param {Object} options configuration options.  The defaults are defined
	 *         in editor.ui.ToolViewDefaults.
	 */
	editor.ui.ToolView = editor.utils.Listenable.extend({
		init: function(options) {
			this._super();
				
			this.config = jQuery.extend({}, editor.ui.ToolViewDefaults, options);
			this.toolbarWidget = null;
			this.enabled = true;
			this.mode = editor.ui.ToolConstants.MODE_UP;
			this.panels = [];
			this.visiblePanels = [];
			
			if (this.config.axnBarId) {
				this.actionBar = new editor.ui.ActionBar({
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
						this.toolbarWidget.removeAttr('disabled');
					}
					else {
						this.toolbarWidget.attr('disabled', 'disabled');
					}
				}
			}
		},
		
		/**
		 * Sets the tool mode (either editor.ui.ToolConstants.MODE_UP or
		 * editor.ui.ToolConstants.MODE_DOWN).
		 * 
		 * @param {string} mode either editor.ui.ToolConstants.MODE_UP or
		 *        editor.ui.ToolConstants.MODE_DOWN
		 */
		setMode: function(mode) {
			var oldMode = this.mode;
			this.mode = mode;
			
			if (this.toolbarWidget) {
				this.toolbarWidget.removeClass(oldMode);
				this.toolbarWidget.addClass(this.mode);
			}
			
			this.notifyListeners(editor.EventTypes.ToolModeSet, {
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
			
			this.toolbarWidget = jQuery('<div id="' + this.config.widgetId 
                + '" class="toolBtn ' + this.mode 
				+ '" title="' + this.config.toolTip + '"></div>');			
			
			this.toolHover = jQuery('<h3 class="toolHover">' + this.config.toolName + '</h3>')
				.data('set', false).css('zIndex', editor.ui.Layer.TOOLBAR);
			this.toolbarWidget.append(this.toolHover);
			
			this.toolbarWidget.bind('click', function() {
                view.notifyListeners(editor.EventTypes.ToolClicked, view);
                view.setMode(editor.ui.ToolConstants.MODE_DOWN);
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
				
				if (view.mode !== editor.ui.ToolConstants.MODE_DOWN) {
					view.toolHover.fadeIn(200);
				}
			})
			.bind('mouseout', function(evt) {
				view.toolHover.promise().done(function() {
					view.toolHover.hide();
				});
			});
		},
		
		/**
		 * Performs the layout of the actionbar.  Left empty intentionally since
		 * each sub class needs to fill out this method.
		 */
		layoutActionBar: function() {
			
		},
		
		addPanel: function(panel) {
			if (jQuery.inArray(panel, this.panels) === -1) {
				this[panel.getName()] = panel;
				this.panels.push(panel);
				
				panel.currentView = this;
				var meta = panel.addViewMeta(this);
				if (!panel.config.manualVisible) {
//					this.visiblePanels.push(panel);
					meta.panelShouldBeVisible = true;
				}
			}
		},
		
		removePanel: function(panel) {
	        var ndx = this.panels.indexOf(panel);
	        
	        if (ndx != -1) {
	            var spliced = this.panels.splice(ndx, 1);
				
				delete this[panel.getName()];
	        }
		},
		
		setSidebar: function(sidebar) {
			this.sidebar = sidebar;
			this.notifyListeners(editor.EventTypes.SidebarSet, sidebar);
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
	editor.ui.ToolController = editor.Class.extend({
		init: function() {					
			this.model;
			this.view;
		},
	
		/**
		 * Sets the view to the given view.  If a model is already given, this
		 * calls bindEvents().
		 * 
		 * @param {editor.ui.ToolView} view the new view
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
		 * @param {editor.ui.ToolModel} model the new model
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
				wgts = view.panels,
				visFcn = function(val) {
					if (val.updateMeta) {
						var meta = val.panel.getViewMeta(view);
						
						if (meta.viewIsVisible) {
							meta.panelShouldBeVisible = val.visible &&
								meta.panelShouldBeVisible;
						}
					}
				};
						
			var handleWidgets = function(visible) {				
				// if the tool is no longer selected
				if (!visible) {
					// save the visible panel state					
					for (var i = 0, il = wgts.length; i < il; i++) {
						var wgt = wgts[i],
							meta = wgt.getViewMeta(view);
						if (wgt.isVisible() && meta.viewIsVisible) {
							meta.panelShouldBeVisible = true;
							wgt.setVisible(false, false);
						}
						meta.viewIsVisible = false;
					}
				}
				else {
					// restore the previous visible panel state
//					var vis = view.visiblePanels;
									
					for (var i = 0, il = wgts.length; i < il; i++) {
						var wgt = wgts[i],
							meta = wgt.getViewMeta(view);
						
						meta.viewIsVisible = true;
						wgt.setCurrentView(view);
						wgt.setVisible(meta.panelShouldBeVisible, false);
					}
					
					// reset the visible panels list
//					view.visiblePanels = [];
				}				
			};
					
			for (var ndx = 0, len = wgts.length; ndx < len; ndx++) {
				var wgt = wgts[ndx];
				wgt.addListener(editor.EventTypes.WidgetVisible, visFcn);
			}
        
	        view.addListener(editor.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode === editor.ui.ToolConstants.MODE_DOWN;
				
				if (view.actionBar) {
					view.actionBar.setVisible(isDown);
				}
				
				handleWidgets(isDown);
	        });
			
			view.addListener(editor.EventTypes.SidebarSet, function(sidebar) {			
				sidebar.addListener(editor.EventTypes.Sidebar.Minimized, function(val) {
	            	var isDown = view.mode === editor.ui.ToolConstants.MODE_DOWN;
					handleWidgets(!val && isDown);
				});
			});
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     			 Helper Methods	  		                      //
////////////////////////////////////////////////////////////////////////////////
		
	var	createListItem = function(component) {
			var li = jQuery('<li></li>');				
			li.append(component.getUI()).data('component', component);			
			return li;
		};
	
	return editor;
})(editor || {});
