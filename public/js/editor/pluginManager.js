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

(function(editor) {
	"use strict";
	
////////////////////////////////////////////////////////////////////////////////
//								Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var shorthand = editor.plugins = {};

	shorthand.init = function() {
		var plgPane = new editor.ui.NavPane('Manage Plugins'),
			plgToolBar = new editor.ui.ToolBar(),
		
			plgMdl = new PluginMgrModel(),
			plgView = new PluginMgrView(),
			plgCtr = new PluginMgrController();	
				
		plgCtr.setModel(plgMdl);
		plgCtr.setView(plgView);
		
		plgToolBar.add(plgView);
		plgPane.setToolBar(plgToolBar);
		editor.ui.addNavPane(plgPane, 'plgPane');
		
		// disable default behavior
		var ui = plgPane.getUI();
		
		ui.find('a').unbind('click');
		ui.find('h2').bind('click', function(evt) {
			plgPane.setVisible(!plgPane.isVisible());
			
			jQuery(document).bind('click.plg', function(e) {
				var target = jQuery(e.target), 
					parent = target.parents('#plgPane'), 
					isTool = target.parents('.toolBtn').size() > 0 ||
						target.hasClass('toolBtn'),
					isNavPane = target.parents('#navBar h2').size() > 0;
				
				if (parent.size() == 0 && target.attr('id') !== 'plgPane'
						&& !isTool && !isNavPane) {
					plgPane.setVisible(false);
					jQuery(document).unbind('click.plg');
				}
			});
		});
		
		// load plugins
		jQuery.get('js/editor/plugins/plugins.json', 'json')
			.success(function(data, status, xhr) {								
				// data is a json array
				var plugins = data.plugins;
				
				if (plugins == null) {
					plugins = JSON.parse(xhr.responseText).plugins;
				}
				
				if (plugins != null) {
					for (var i = 0, il = plugins.length; i < il; i++) {
						plgMdl.loadPlugin(plugins[i]);
					}
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
	
////////////////////////////////////////////////////////////////////////////////
//								Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	shorthand.events = {
		Checked: 'checked',
		PluginActive: 'pluginActive',
		PluginAdded: 'pluginAdded'
	};
	    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

	var PluginMgrModel = function() {
		editor.ToolModel.call(this, 'pluginManager');
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
	};
	
	PluginMgrModel.prototype = new editor.ToolModel();
	PluginMgrModel.prototype.constructor = PluginMgrModel;
		
	PluginMgrModel.prototype.loadingComplete = function() {
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
			this.initComplete = true;
			this.callbacks = [];
		}			
	};
	
	PluginMgrModel.prototype.addPlugin = function(pluginName) {
		if (this.plugins.indexOf(pluginName) === -1) {
			this.plugins.push(pluginName);
			this.notifyListeners(shorthand.events.PluginAdded, pluginName);
		}
	};
	
	PluginMgrModel.prototype.loadPlugin = function(pluginName) {
		var mdl = this;
		
		if (this.loadedPlugins.indexOf(pluginName) === -1) {
			// Initialize the plugin's namespace
			editor.tools[pluginName] = {};
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
						mdl.notifyListeners(editor.events.PluginLoaded, name);
					}
					
					mdl.updatePluginList();
					mdl.notifyListeners(shorthand.events.PluginActive, {
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
			
			this.updatePluginList();
			this.notifyListeners(shorthand.events.PluginActive, {
				plugin: pluginName,
				active: true
			});
		}
	};
	
	PluginMgrModel.prototype.notify = function(eventType, value) {
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
						models = [value.model];
					}
					this.models.put(this.currentPlugin, models);
				}
				break;
			case editor.events.ViewAdded:
				if (this.currentPlugin != null) {
					var views = this.views.get(this.currentPlugin);
					if (views == null) {
						views = [value.view];
					}
					this.views.put(this.currentPlugin, views);
				}
				break;
		}			
	};

	PluginMgrModel.prototype.removePlugin = function(pluginName) {
		this.activePlugins.splice(this.activePlugins.indexOf(pluginName), 1);
		
		// get views and disable them
		var views = this.views.get(pluginName);
		
		for (var i = 0, il = views.length; i < il; i++) {
			views[i].setEnabled(false);
		}
		
		this.notifyListeners(shorthand.events.PluginActive, {
			plugin: pluginName,
			active: false
		});
		
		this.updatePluginList();
	};
	
	PluginMgrModel.prototype.updatePluginList = function() {
		if (this.initComplete) {
			var mdl = this,
				plugsData = {
					plugins: mdl.activePlugins
				},
				data = {
					plugins: JSON.stringify(plugsData)
				};
			
			jQuery.post('/plugins', data, 'json')
			.success(function(data, status, xhr) {
				// No feedback expected
			})
			.error(function(xhr, status, err) {
				// No feedback expected
			});
		}
	};
		
////////////////////////////////////////////////////////////////////////////////
//                             Custom List Item                               //
////////////////////////////////////////////////////////////////////////////////

	var CheckableListItem = function() {
		editor.ui.ListItem.call(this);
	};
	var liSuper = editor.ui.ListItem.prototype;
	
	CheckableListItem.prototype = new editor.ui.ListItem();
	CheckableListItem.prototype.constructor = CheckableListItem;
						
	CheckableListItem.prototype.layout = function() {
		liSuper.layout.call(this);
		
		var wgt = this;
		
		this.title = jQuery('<label></label>');
		this.checkbox = jQuery('<input type="checkbox" />');
		this.container.append(this.checkbox).append(this.title);
		
		this.checkbox.bind('change', function() {
			wgt.notifyListeners(shorthand.events.Checked, {
				plugin: wgt.title.text(),
				checked: wgt.checkbox.prop('checked')
			});
		});
		this.container.bind('click', function(evt) {
			var isCheckbox = evt.target.tagName === 'INPUT',
				isLabel = evt.target.tagName === 'LABEL';
			
			if (!isCheckbox && !isLabel) {
				wgt.checkbox.click();
			}
		});			
	};
	
	CheckableListItem.prototype.setChecked = function(checked) {
		this.checkbox.prop('checked', checked);
	};
	
	CheckableListItem.prototype.setText = function(text) {
		var id = 'plg_li_' + text;
		
		this.title.text(text).attr('for', id);
		this.checkbox.attr('id', id);
	};
		
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   

	var PluginMgrView = function() {
		editor.ToolView.call(this, {
			id: 'pluginManager',
			toolName: 'Manage Plugins',
			toolTip: ''
		});
		
		this.listitems = new Hashtable();
	};
	
	PluginMgrView.prototype = new editor.ToolView();
	PluginMgrView.prototype.constructor = PluginMgrView;
		
	PluginMgrView.prototype.add = function(pluginName) {
		var li = new CheckableListItem(),
			view = this;
		li.setText(pluginName);
		
		li.addListener(shorthand.events.Checked, function(data) {
			view.notifyListeners(shorthand.events.Checked, data);
		});
		
		this.list.add(li);
		this.listitems.put(pluginName, li);
	};
	
	PluginMgrView.prototype.layoutToolBarContainer = function() {			
		var ctn = this.toolbarContainer = jQuery('<div id="' 
			+ this.id + '"> </div>');
			
		this.list = new editor.ui.List();			
		ctn.append(this.list.getUI());
	};
	
	PluginMgrView.prototype.setActive = function(pluginName, active) {
		this.listitems.get(pluginName).setChecked(active);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	var PluginMgrController = function() {
		editor.ToolController.call(this);
	};
	var ctrSuper = editor.ToolController.prototype;
	
	PluginMgrController.prototype = new editor.ToolController();
	PluginMgrController.prototype.constructor = PluginMgrController;
    
	/**
     * Binds event and message handlers to the view and model this object 
     * references.  
     */        
	PluginMgrController.prototype.bindEvents = function() {
		ctrSuper.bindEvents.call(this);
		
		var model = this.model,
			view = this.view;
		
		// view specific
		view.addListener(shorthand.events.Checked, function(data) {
			if (data.checked) {
				model.loadPlugin(data.plugin);
			}
			else {
				model.removePlugin(data.plugin);
			}
		});
		
		// model specific
		model.addListener(editor.events.PluginLoaded, function(pluginName) {
			view.add(pluginName);
		});
		model.addListener(shorthand.events.PluginActive, function(data) {
			view.setActive(data.plugin, data.active);
		});
		model.addListener(shorthand.events.PluginAdded, function(pluginName) {
			view.add(pluginName);
		});
	};
	
})(editor);
