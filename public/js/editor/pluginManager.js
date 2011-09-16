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
	
	editor.plugins = {};
	
	var event = {
		Checked: 'checked',
		PluginActive: 'pluginActive',
		PluginAdded: 'pluginAdded',
		PluginLoaded: 'pluginLoaded'
	};
	    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

	var PluginMgrModel = editor.ToolModel.extend({
		init: function() {
			this._super('pluginManager');
			this.activePlugins = [];
			this.loadedPlugins = [];
			this.plugins = [];
			this.callbacks = [];
			this.scripts = new Hashtable();
			this.models = new Hashtable();
			this.views = new Hashtable();
			this.initComplete = false;
			
			editor.addListener(editor.events.ScriptLoadStart, this);
			editor.addListener(editor.events.ScriptLoaded, this);
			editor.addListener(editor.events.ModelAdded, this);
			editor.addListener(editor.events.ViewAdded, this);
		},
		
		loadingComplete: function() {
			var vals = this.scripts.values(),
				complete = true;
			
			for (var i = 0, il = vals.length; i < il && complete; i++) {
				complete &= vals[i];
			}
			
			if (complete) {
				for (var i = 0, il = this.callbacks.length; i < il; i++) {
					var obj = this.callbacks[i];
					obj.callback.apply(this, obj.params);
				}
				
				this.currentPlugin = null;
								
				var mdls = editor.getModels();
					
				for (var i = 0, il = mdls.length; i < il; i++) {
					var mdl = mdls[i];
					
					if (!mdl.hasWorldListeners) {
						editor.addListener(editor.events.WorldCleaned, mdl);
						editor.addListener(editor.events.WorldLoaded, mdl);
					}	
					
					mdl.hasWorldListeners = true;
				}
				
				this.initComplete = true;
				this.callbacks = [];
			}			
		},
		
		addPlugin: function(pluginName) {
			if (this.plugins.indexOf(pluginName) === -1) {
				this.plugins.push(pluginName);
				this.notifyListeners(event.PluginAdded, pluginName);
			}
		},
		
		loadPlugin: function(pluginName) {
			var mdl = this;
			
			if (this.loadedPlugins.indexOf(pluginName) === -1) {
				editor.getScript('js/editor/plugins/' + pluginName + '/' + pluginName + '.js');
				this.callbacks.push({
					callback: function(name){
						mdl.currentPlugin = name;
						editor.tools[name].init();
						editor.notifyListeners(editor.events.PluginLoaded, name);
						mdl.activePlugins.push(name);
						mdl.loadedPlugins.push(name);
						if (mdl.plugins.indexOf(name) === -1) {
							mdl.plugins.push(name);
							mdl.notifyListeners(event.PluginLoaded, name);
						}
			
						mdl.notifyListeners(event.PluginActive, {
							plugin: name,
							active: true
						});
					},
					params: [pluginName]
				});
			}
			else if (this.activePlugins.indexOf(pluginName) === -1) {
				this.activePlugins.push(pluginName);
				// now notify that the plugin is active again
				var views = this.views.get(pluginName);
				
				for (var i = 0, il = views.length; i < il; i++) {
					views[i].setEnabled(true);
				}
			
				this.notifyListeners(event.PluginActive, {
					plugin: pluginName,
					active: true
				});
			}
		},
		
		notify: function(eventType, value) {
			switch(eventType) {
				case editor.events.ScriptLoadStart:	
					this.scripts.put(value, false);
					break;
				case editor.events.ScriptLoaded:
					this.scripts.put(value, true);
					this.loadingComplete();
					break;
				case editor.events.ModelAdded:
					if (this.currentPlugin != null) {
						var models = this.models.get(this.currentPlugin);
						if (models == null) {
							models = [value.model]
						}
						this.models.put(this.currentPlugin, models);
					}
					break;
				case editor.events.ViewAdded:
					if (this.currentPlugin != null) {
						var views = this.views.get(this.currentPlugin);
						if (views == null) {
							views = [value.view]
						}
						this.views.put(this.currentPlugin, views);
					}
					break;
			}			
		},
	
		removePlugin: function(pluginName) {
			this.activePlugins.splice(this.activePlugins.indexOf(pluginName), 1);
			
			// get views and disable them
			var views = this.views.get(pluginName);
			
			for (var i = 0, il = views.length; i < il; i++) {
				views[i].setEnabled(false);
			}
			
			this.notifyListeners(event.PluginActive, {
				plugin: pluginName,
				active: false
			});
		}
	});
		
////////////////////////////////////////////////////////////////////////////////
//                             Custom List Item                               //
////////////////////////////////////////////////////////////////////////////////

	var CheckableListItem = editor.ui.ListItem.extend({
		init: function() {
			this._super();
		},
						
		finishLayout: function() {
			var wgt = this;
			
			this.container = jQuery('<div></div>');
			this.title = jQuery('<span></span>');
			this.checkbox = jQuery('<input type="checkbox" />');
						
			this.container.append(this.checkbox).append(this.title);
			
			this.checkbox.bind('click', function() {
				wgt.notifyListeners(event.Checked, {
					plugin: wgt.title.text(),
					checked: wgt.checkbox.prop('checked')
				});
			});
			
		},
		
		setChecked: function(checked) {
			this.checkbox.prop('checked', checked);
		},
		
		setText: function(text) {
			this.title.text(text);
		}
	});
		
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   

	var PluginMgrView = editor.ToolView.extend({
		init: function() {
			this._super({
				id: 'pluginManager',
				elemId: 'plgWrapper',
				toolName: 'Manage Plugins',
				toolTip: ''
			});
			
			this.listitems = new Hashtable();
		},
		
		add: function(pluginName) {
			var li = new CheckableListItem(),
				view = this;
			li.setText(pluginName);
			
			li.addListener(event.Checked, function(data) {
				view.notifyListeners(event.Checked, data);
			});
			
			this.list.add(li);
			this.listitems.put(pluginName, li);
		},
		
		layoutToolBarContainer: function() {			
			var ctn = this.toolbarContainer = jQuery('<div id="' 
				+ this.config.elemId + '"> \
				</div>');
				
			this.list = new editor.ui.List();			
			ctn.append(this.list.getUI());
		},
		
		setActive: function(pluginName, active) {
			this.listitems.get(pluginName).setChecked(active);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	var PluginMgrController = editor.ToolController.extend({
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
				controller = this;
			
			// view specific
			view.addListener(event.Checked, function(data) {
				if (data.checked) {
					model.loadPlugin(data.plugin)
				}
				else {
					model.removePlugin(data.plugin);
				}
			});
			
			// model specific
			model.addListener(event.PluginLoaded, function(pluginName) {
				view.add(pluginName);
			});
			model.addListener(event.PluginActive, function(data) {
				view.setActive(data.plugin, data.active);
			});
			model.addListener(event.PluginAdded, function(pluginName) {
				view.add(pluginName);
			});
		}
	});
	
	editor.plugins.init = function() {
		var plgPane = new editor.ui.TabPane('Manage Plugins'),
			plgToolBar = new editor.ui.ToolBar(),
		
			plgMdl = new PluginMgrModel(),
			plgView = new PluginMgrView(),
			plgCtr = new PluginMgrController();	
				
		plgCtr.setModel(plgMdl);
		plgCtr.setView(plgView);
		
		plgToolBar.add(plgView);
		plgPane.setToolBar(plgToolBar);
		editor.ui.addTabPane(plgPane, 'plgPane');
		
		// disable default behavior
		var ui = plgPane.getUI();
		
		ui.find('a').unbind('click');
		ui.find('h2').bind('click', function(evt) {
			plgPane.setVisible(!plgPane.isVisible());
		});
		
		// load plugins
		jQuery.get('js/editor/plugins/plugins.json')
			.success(function(data, status, xhr) {								
				// data is a json array
				var plugins = data.plugins;
				
				for (var i = 0, il = plugins.length; i < il; i++) {
					plgMdl.loadPlugin(plugins[i]);
				}
			})
			.error(function(xhr, status, err) {
				// fail gracefully
			});
			
		// retrieve the list of plugins
		jQuery.get('/plugins')
			.success(function(data, status, xhr) {
				var plugins = data.plugins;
				
				for (var i = 0, il = plugins.length; i < il; i++) {
					plgMdl.addPlugin(plugins[i]);
				}
			})
			.error(function(xhr, status, err) {
				
			});
	};
	
	return editor;
})(editor || {});
