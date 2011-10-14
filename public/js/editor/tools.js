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
	editor.tools = editor.tools || {};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Architecture	  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var models = new Hashtable(),
		views = new Hashtable();
		
	editor.getModel = function(name) {
		return models.get(name);
	};
	
	editor.getModels = function() {
		return models.values();
	};
	
	editor.getView = function(name) {
		return views.get(name);
	};	
	
	editor.getViews = function() {
		return views.values();
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			   	Tool Bar	  		                      //
////////////////////////////////////////////////////////////////////////////////
		
	editor.ui.ToolBar = editor.ui.Component.extend({
		init: function(options) {		
			this.tools = [];
			this.savedTool = null;
			this.mousedIn = [];
			this.hidden = true;
			this._super();
		},
		
		add: function(tool) {
			if (tool instanceof editor.ToolView) {
				this.tools.push({
					tool: tool,
					enabled: true
				});
				this.list.append(createListItem(tool));
				
				tool.addListener(editor.events.ToolClicked, this);
				tool.addListener(editor.events.ToolMouseIn, this);
				tool.addListener(editor.events.ToolMouseOut, this);
				tool.addListener(editor.events.Enabled, this);
			}
		},
		
		layout: function() {		
			this.container = jQuery('<div class="toolbar"></div>');
			this.header = jQuery('<h3 class="toolTitle"></h3>');
			this.list = jQuery('<ul></ul>');
			
			this.container.append(this.header).append(this.list);
		},
		
		getActiveTool: function() {
			for (var i = 0, il = this.tools.length; i < il; i++) {
				var tool = this.tools[i].tool;
				if (tool.mode === editor.ToolConstants.MODE_DOWN) {
					return tool;
				}
			}
			
			return null;
		},
		
		loadState: function() {
			var tool = this.savedTool;
			
			if (tool == null) {
				tool = this.tools[0].tool;
			}
			
			tool.setMode(editor.ToolConstants.MODE_DOWN);
			this.header.text(tool.toolTitle);
			this.hidden = false;
		},
		
		notify: function(eventType, value) {
			switch (eventType) {
				case editor.events.ToolClicked:
					var toolList = this.tools;
					
					for (ndx = 0, len = toolList.length; ndx < len; ndx++) {
						var t = toolList[ndx].tool;
						
						if (t != value) {
							t.setMode(editor.ToolConstants.MODE_UP);
						}
					}
					
					this.header.text(value.toolTitle);
					break;
				case editor.events.ToolMouseIn:
					this.header.css('opacity', 0);
					this.mousedIn.push(value);
					break;
				case editor.events.ToolMouseOut:
					remove(value, this.mousedIn);
					if (this.mousedIn.length === 0) {
						this.header.css('opacity', 1);
					}
					break;
				case editor.events.Enabled:
					handleEnabled.call(this, value);
					break;
			}
 		},
		
		remove: function(tool) {
			var tool = remove(tool, this.tools);
			tool.getUI().remove();
		},
		
		saveState: function() {
			this.savedTool = this.getActiveTool();
			
			if (this.savedTool) {
				this.savedTool.setMode(editor.ToolConstants.MODE_UP);
			}
			
			this.hidden = true;
		},
		
		setEnabled: function(enabled) {
			for (var i = 0, il = this.tools.length; i < il; i++) {
				this.tools[i].setEnabled(enabled);
			}
		}
	});
	
	var checkEnabled = function() {
			var enabled = false;
			
			for (var i = 0, il = this.tools.length; i < il && !enabled; i++) {
				enabled |= this.tools[i].enabled;	
			}
			
			return enabled;
		},
		
		handleEnabled = function(data) {			
			var found = false;
			
			for (var i = 0, il = this.tools.length; i < il && !found; i++) {
				var t = this.tools[i];
				
				if (t.tool === data.item) {
					t.enabled = data.enabled; 
					found = true;
				}
			}	
				
			if (!data.enabled) {
				data.item.setMode(editor.ToolConstants.MODE_UP);			
				
				if (!checkEnabled.call(this)) {
					this.notifyListeners(editor.events.Enabled, {
						item: this,
						enabled: false
					});
				}
				else if (!this.hidden) {
					// select the next available tool
					var tool = nextAvailable.call(this);
					if (!this.hidden) {
						tool.setMode(editor.ToolConstants.MODE_DOWN);
					}
					this.header.text(tool.toolTitle);
				}
			}
			else {
				if (!this.hidden && this.getActiveTool() == null) {
					data.item.setMode(editor.ToolConstants.MODE_DOWN);
				}
				
				this.notifyListeners(editor.events.Enabled, {
					item: this,
					enabled: true
				});
			}
		},
		
		nextAvailable = function() {
			var found = null;
			
			for (var i = 0, il = this.tools.length; i < il && found == null; i++) {
				var t = this.tools[i];
				
				if (t.enabled) {
					found = t.tool;
				}
			}
			
			return found;
		},
		
		remove = function(item, list) {		
	        var found = null;
	        var ndx = list.indexOf(item);
	        
	        if (ndx != -1) {
	            var spliced = list.splice(ndx, 1);
	            
	            if (spliced.length == 1) {
	                found = spliced[0];
	            }
	        }
	        
	        return found;
		};
	
	/**
	 * Constants for setting up a tool.
	 */
	editor.ToolConstants = {
		MODE_DOWN: 'down',
		MODE_UP: 'up',
		SHAPE_PICK: "ShapePick",
		CAM_MOVE: "CameraMove"
	};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ToolModel is the base tool model class.  All tool models should 
     * inherit this class to gain basic tool model functionality (such as being
     * an observable).
     */
	editor.ToolModel = editor.utils.Listenable.extend({
		init: function(id) {
			this._super();
			this.id = id;
			models.put(id, this);
			editor.notifyListeners(editor.events.ModelAdded, {
				id: id,
				model: this
			});
			editor.addListener(editor.events.WorldCleaned, this);
			editor.addListener(editor.events.WorldLoaded, this);
		},
		
		getId: function() {
			return this.id;
		},
		
		notify: function(eventType, value) {
			switch(eventType) {
				case editor.events.WorldCleaned:
					this.worldCleaned();
					break;
				case editor.events.WorldLoaded:
					this.worldLoaded();
					break;
			}
		},
		
		worldCleaned: function() {
			
		},
		
		worldLoaded: function() {
			
		}
	});
    
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   
	
    /*
     * Configuration object for the ToolView.
     */
    editor.ToolViewDefaults = {
		id: '',
        toolName: 'toolName',
		toolTip: ''
    };
	
	/**
	 * The ToolView is the base tool view class.  All tool views should 
	 * inherit from this in order to be added to the toolbar.
	 * 
	 * @param {Object} options configuration options.  The defaults are defined
	 *         in editor.ToolViewDefaults.
	 */
	editor.ToolView = editor.utils.Listenable.extend({
		init: function(options) {
			this._super();
				
			this.config = jQuery.extend({}, editor.ToolViewDefaults, options);
			this.toolTitle = this.config.toolName;
			this.toolbarContainer = null;
			this.enabled = true;
			this.mode = editor.ToolConstants.MODE_UP;
			this.panels = [];
			this.visiblePanels = [];
			this.id = this.config.id;
			
			this.layoutToolBarContainer();
			
			views.put(this.id, this);
			editor.notifyListeners(editor.events.ViewAdded, {
				id: this.id,
				view: this
			});
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
				
				if (enabled) {
					this.toolbarContainer.show();
				}
				else {
					this.toolbarContainer.hide();
				}
				
				this.notifyListeners(editor.events.Enabled, {
					item: this,
					enabled: enabled
				});
			}
		},
		
		/**
		 * Sets the tool mode (either editor.ToolConstants.MODE_UP or
		 * editor.ToolConstants.MODE_DOWN).
		 * 
		 * @param {string} mode either editor.ToolConstants.MODE_UP or
		 *        editor.ToolConstants.MODE_DOWN
		 */
		setMode: function(mode) {
			var oldMode = this.mode;
			this.mode = mode;
			
			if (this.toolbarContainer) {
				this.toolbarContainer.removeClass(oldMode);
				this.toolbarContainer.addClass(this.mode);
			}
			
			switch (mode) {
				case editor.ToolConstants.MODE_DOWN:
					for (var i = 0, il = this.visiblePanels.length; i < il; i++) {
						this.visiblePanels[i].setVisible(true);
					}
					
					this.visiblePanels = [];
					break;
				case editor.ToolConstants.MODE_UP:
					for (var i = 0, il = this.panels.length; i < il; i++) {
						var pnl = this.panels[i];
						
						if (pnl.isVisible()) {
							this.visiblePanels.push(pnl);
							pnl.setVisible(false);
						}
					}
					break;
			}
			
			this.notifyListeners(editor.events.ToolModeSet, {
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
			return this.toolbarContainer;
		},
		
		/**
		 * Performs the layout of the toolbar widget.
		 */
		layoutToolBarContainer: function() {
			var view = this,
				classes = ['toolBtn', this.id, this.mode];
			
			this.toolbarContainer = jQuery('<div class="' + classes.join(' ') 
				+ '" title="' + this.config.toolTip + '"></div>');
			
			this.toolHover = jQuery('<h3 class="toolHover">' + this.config.toolName + '</h3>')
				.css('zIndex', editor.ui.Layer.TOOLBAR);
			this.toolbarContainer.append(this.toolHover);
			
			this.toolbarContainer.bind('click', function() {
				if (view.mode !== editor.ToolConstants.MODE_DOWN) {
                	view.notifyListeners(editor.events.ToolClicked, view);
                    view.setMode(editor.ToolConstants.MODE_DOWN);
                }
			})
			.bind('mouseover', function(evt) {
				if (view.mode === editor.ToolConstants.MODE_UP) {
					view.toolHover.fadeIn(100);
					view.notifyListeners(editor.events.ToolMouseIn, view);
				}
			})
			.bind('mouseout', function(evt) {
				view.toolHover.promise('fx').done(function() {
					view.toolHover.fadeOut(100);
					view.notifyListeners(editor.events.ToolMouseOut, view);
				});
			});
		},
		
		addPanel: function(panel) {
			if (jQuery.inArray(panel, this.panels) === -1) {
				this[panel.getName()] = panel;
				this.panels.push(panel);
				
				if (panel.config.startsVisible) {
					this.visiblePanels.push(panel);
				}
			}
		},
		
		removePanel: function(panel) {
	        var ndx = this.panels.indexOf(panel);
	        
	        if (ndx != -1) {
	            this.panels.splice(ndx, 1);
				delete this[panel.getName()];
	        }
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
	editor.ToolController = editor.Class.extend({
		init: function() {					
			this.model;
			this.view;
		},
	
		/**
		 * Sets the view to the given view.  If a model is already given, this
		 * calls bindEvents().
		 * 
		 * @param {editor.ToolView} view the new view
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
		 * @param {editor.ToolModel} model the new model
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
