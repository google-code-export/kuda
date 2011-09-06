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
	o3djs.require('editor.requires');
	
////////////////////////////////////////////////////////////////////////////////
//                                 Main App                                   //
////////////////////////////////////////////////////////////////////////////////
	
	var	callbacks = [],
		doneCallbacks = [],
		scripts = new Hashtable(),
		activePlugins = [],
		loadedPlugins = [];
		
//	test = {
//		activePlugins: activePlugins,
//		loadedPlugins: loadedPlugins
//	};
		
	var initViewerStep1 = function() {			
			var notifier = new editor.utils.Listenable();
					
			editor.addListener = function(eventType, listener) {
				notifier.addListener(eventType, listener);
			};
			
			editor.notifyListeners = function(eventType, value) {
				notifier.notifyListeners(eventType, value);
			};
			
			editor.removeListener = function(listener) {
				notifier.removeListener(listener);
			};			
						
			o3djs.webgl.makeClients(function(clientElements) {
				editor.ui.initializeView(clientElements);
				loadPlugins();
			});
		},
		
		loadingComplete = function() {
			var vals = scripts.values(),
				complete = true;
			
			for (var i = 0, il = vals.length; i < il && complete; i++) {
				complete &= vals[i];
			}
			
			if (complete) {
				for (var i = 0, il = callbacks.length; i < il; i++) {
					var obj = callbacks[i];
					obj.callback.apply(this, obj.params);
				}
				
				for (var i = 0, il = doneCallbacks.length; i < il; i++) {
					doneCallbacks[i]();
				}
			}
		},
			
		loadPlugins = function() {		
			jQuery.get('js/editor/plugins/plugins.json')
				.success(function(data, status, xhr) {								
					// data is a json array
					var plugins = data.plugins,
						bdy = jQuery('body');
					
					for (var i = 0, il = plugins.length; i < il; i++) {
						editor.loadPlugin(plugins[i]);
					}
				})
				.error(function(xhr, status, err) {
					// fail gracefully
				});
		},
		
		uninitViewer = function() {
			if (hemi.core.client) {
				hemi.core.client.cleanup();
			}
		};
	
////////////////////////////////////////////////////////////////////////////////
//                             Editor Utilities                               //
////////////////////////////////////////////////////////////////////////////////
	
	editor.getCss = function(url, media) {
		jQuery( document.createElement('link') ).attr({
	        href: url,
	        media: media || 'screen',
	        type: 'text/css',
	        rel: 'stylesheet'
	    }).appendTo('head');
	};
	
	editor.getScript = function(url, callback) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = url;
		
		scripts.put(script, false);
		
		{
	        var done = false;
	
	        // Attach handlers for all browsers
	        script.onload = script.onreadystatechange = function(){
	            if (!done && (!this.readyState ||
	            		this.readyState == "loaded" || 
						this.readyState == "complete")) {
	                done = true;
                	scripts.put(script, true);
					if (callback) {
						callback();
					}
					loadingComplete();
	
	                // Handle memory leak in IE
	                script.onload = script.onreadystatechange = null;
	            }
	        };
	    }
		
	    document.body.appendChild(script);
	};
	
	editor.loadPlugin = function(pluginName) {	
		if (loadedPlugins.indexOf(pluginName) === -1) {
			editor.getScript('js/editor/plugins/' + pluginName + '/' + pluginName + '.js');
			callbacks.push({
				callback: function(name){
					editor.tools[name].init();
					editor.notifyListeners(editor.events.PluginAdded, name);
					activePlugins.push(name);
					loadedPlugins.push(name);
				},
				params: [pluginName]
			});
		}
		else if (activePlugins.indexOf(pluginName) === -1) {
			activePlugins.push(pluginName);
			// now notify that the plugin is active again
		}
	};
	
	editor.removePlugin = function(name) {
		activePlugins.splice(activePlugins.indexOf(name), 1);
	};
	
	editor.whenDoneLoading = function(callback) {
		doneCallbacks.push(callback);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                         Remove the rest of this                            //
////////////////////////////////////////////////////////////////////////////////

	var Application = function() {
	};
	
	Application.prototype = {
		initViewerStep1: function() {
			var app = this,
				options = [];
						
			// set editor defaults
			editor.Defaults = {
				farPlane: 10000,
				nearPlane: 0.5
			};
			
			editor.enableMenuBar = function(enable) {
				app.menu.setEnabled(enable);
			};
			
			editor.enableToolBar = function(enable) {
				app.toolbar.setEnabled(enable);
			};
			
			editor.getActiveTool = function() {
				return app.toolbar.getActiveTool();
			};
			
			editor.getProjectOctane = function() {
				app.msgMdl.dispatchProxy.swap();
				var data = hemi.world.toOctane(function(citizen) {
					return citizen.name.search(editor.tools.ToolConstants.EDITOR_PREFIX) === -1;
				});
				app.msgMdl.dispatchProxy.unswap();
				return data;
			};
			
			o3djs.webgl.makeClients(function(clientElements) {
				app.initViewerStep2(clientElements);
			}, options.join(','));
		},
		
		initViewerStep2: function(clientElements) {
			var defaults = editor.Defaults;
			
			hemi.core.init(clientElements[0]);
			
			var cam = hemi.world.camera;
			cam.enableControl();
			cam.clip.far = defaults.farPlane;
			cam.clip.near = defaults.nearPlane;
			cam.updateProjection();
			
			this.extent = 50;		// Grid will reach 50 meters in each direction
			this.fidelity = 1;		// Grid squares = 1 square meter
			
            this.layoutDialogs();
			this.layoutGrid();
			this.layoutToolbar();
			this.layoutSidebar();
            this.layoutMenu();
			this.layoutProjectName();
			
			// For now, we do this here
			var that = this;
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						editor.ui.treeModel.addCitizen(msg.src);
					}
				});
			hemi.msg.subscribe(hemi.msg.cleanup,
				function(msg) {
					if (msg.src.name != null &&
						msg.src.name.match(editor.tools.ToolConstants.EDITOR_PREFIX) === null) {
						editor.ui.treeModel.removeCitizen(msg.src);
					}
				});
			
			hemi.world.subscribe(hemi.msg.cleanup, this, 'worldCleaned');
			hemi.world.subscribe(hemi.msg.ready, this, 'worldLoaded');
			
			var addFunc = function(citizen) {
				editor.ui.treeModel.addCitizen(citizen);
			};
			var updateFunc = function(citizen) {
				editor.ui.treeModel.updateCitizen(citizen);
			};
			
			this.anmMdl.addListener(editor.EventTypes.AnimationCreated, addFunc);
			this.anmMdl.addListener(editor.EventTypes.AnimationUpdated, updateFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipCreated, addFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipUpdated, updateFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionCreated, addFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionUpdated, updateFunc);
			this.vptMdl.addListener(editor.EventTypes.CamCurveCreated, addFunc);
			this.vptMdl.addListener(editor.EventTypes.ViewpointAdded, addFunc);
			this.scnMdl.addListener(editor.EventTypes.Scenes.SceneAdded, addFunc);
			this.scnMdl.addListener(editor.EventTypes.Scenes.SceneUpdated, updateFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxAdded, addFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxUpdated, updateFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeCreated, addFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeUpdated, updateFunc);
			this.hudMdl.addListener(editor.EventTypes.DisplayCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementUpdated, updateFunc);
			this.hudMdl.addListener(editor.EventTypes.PageCreated, addFunc);
			this.crvMdl.addListener(editor.EventTypes.CurveCreated, addFunc);
			this.crvMdl.addListener(editor.EventTypes.CurveUpdated, updateFunc);
			this.tmrMdl.addListener(editor.EventTypes.TimerCreated, addFunc);
			this.tmrMdl.addListener(editor.EventTypes.TimerUpdated, updateFunc);
			
			// special model browser listeners
			this.shpMdl.addListener(editor.EventTypes.ShapeCreated, function(shape) {
				that.mbrMdl.addShape(shape);
			});
			this.shpMdl.addListener(editor.EventTypes.ShapeRemoved, function(shape) {
				that.mbrMdl.removeShape(shape);
			});
			this.shpMdl.addListener(editor.EventTypes.ShapeUpdated, function(shape) {
				that.mbrMdl.updateShape(shape);
			});
			
			var views = this.toolbar.tools;
				first = views[0];
			
			// wait for the ui to load first
			this.sidebar.addListener(editor.EventTypes.Sidebar.FinishedLoading, function() {				
				hemi.world.ready();
				
				editor.ui.getBehaviorWidget().setVisible(false);
				
				// select the first tool
				first.setMode(editor.tools.ToolConstants.MODE_DOWN);
				
				// enable the tools now that all the ui is loaded
				for (var ndx = 0, len = views.length; ndx < len; ndx++) {
					views[ndx].setEnabled(true);
				}
			});
		},
		
		worldCleaned: function() {
			this.anmMdl.worldCleaned();
			this.vptMdl.worldCleaned();
			this.msgMdl.worldCleaned();
			this.mbrMdl.worldCleaned();
			this.mnpMdl.worldCleaned();
			this.mtnMdl.worldCleaned();
			this.pteMdl.worldCleaned();
			this.scnMdl.worldCleaned();
			this.shpMdl.worldCleaned();
			this.hudMdl.worldCleaned();
			this.fogMdl.worldCleaned();
			this.selMdl.worldCleaned();
			this.crvMdl.worldCleaned();
			this.tmrMdl.worldCleaned();
			
			var citizens = hemi.world.getCitizens();
	
			for (var ndx = 0, len = citizens.length; ndx < len; ndx++) {
				editor.ui.treeModel.removeCitizen(citizens[ndx]);
			}
		},
		
		worldLoaded: function() {
			this.anmMdl.worldLoaded();
			this.vptMdl.worldLoaded();
			this.msgMdl.worldLoaded();
			this.mbrMdl.worldLoaded();
			this.mnpMdl.worldLoaded();
			this.mtnMdl.worldLoaded();
			this.pteMdl.worldLoaded();
			this.scnMdl.worldLoaded();
			this.shpMdl.worldLoaded();
			this.hudMdl.worldLoaded();
			this.fogMdl.worldLoaded();
			this.crvMdl.worldLoaded();
			this.tmrMdl.worldLoaded();
            
			var vd = hemi.view.createViewData(hemi.world.camera);
			vd.eye = [0, 10, 40];
			vd.target = [0, 0, 0];
            hemi.world.camera.moveToView(vd);
		},
		
		layoutGrid: function() {			
			this.grid = new editor.ui.GridPlane(this.extent, this.fidelity);
		},
		
		showGrid: function() {
			this.grid.setVisible(true);
		},
		
		removeGrid: function() {
			this.grid.setVisible(false);
		},
		
		uninitViewer: function() {
			if (hemi.core.client) {
				hemi.core.client.cleanup();
			}
		},
		
		layoutDialogs: function() {
			var that = this;

			this.loadMdlDlg = editor.ui.createLoadModelDialog(function(val, fcn) {
				that.loadModel(val, fcn);
			});
			this.unloadMdlDlg = editor.ui.createUnloadModelDialog(function(val, fcn) {
				that.unloadModel(val, fcn);
			});
			this.importMdlDlg = editor.ui.createImportModelDialog(function(val, fcn) {
				that.loadModel(val, fcn);
			});
            this.savePrjDlg = editor.ui.createSaveProjectDialog(function(name) {
				that.saveProject(name);
			});
			this.openPrjDlg = editor.ui.createOpenProjectDialog(function(name) {
				that.openProject(name);
			});
			this.publishPrjDlg = editor.ui.createPublishProjectDialog(
				this.savePrjDlg, 
				function(name, octane) {
					that.saveProject(name, octane);
					that.publishPrjDlg.find('#pubPrjMsg').text('Publishing...').show();
					that.publishProject(name);
				});
		},
		
		layoutMenu: function() {
			var that = this;
			
            this.wfrMdl = new editor.tools.WireframeModel();
            this.ortMdl = new editor.tools.OrthographicModel();
			
	        this.fileMenu = new editor.ui.Menu('File');
	        this.viewMenu = new editor.ui.Menu('View');
			this.modelMenu = new editor.ui.Menu('Models');
			this.menu = new editor.ui.MenuBar();
			
			var newProject = new editor.ui.MenuItem({
				title: 'New Project',
				action: function(evt) {
					hemi.world.cleanup();
					hemi.world.camera.enableControl();
					hemi.world.ready();
					
					that.projectName.empty();
					that.projectNameDiv.hide(200);
					// Clean up any previous name
					that.savePrjDlg.find('#savePrjName').val('');
				}
			});
			
			var openProject = new editor.ui.MenuItem({
				title: 'Open Project',
				action: function(evt){				
					// close other dialogs
					that.loadMdlDlg.dialog('close');
					that.unloadMdlDlg.dialog('close');
				
					that.openPrjDlg.dialog('open');
				}
			});
			var saveProject = new editor.ui.MenuItem({
				title: 'Save Project',
				action: function(evt){				
					// close other dialogs
					that.loadMdlDlg.dialog('close');
					that.unloadMdlDlg.dialog('close');
				
					that.savePrjDlg.dialog('open');
				}
			});
			var preview = new editor.ui.MenuItem({
				title: 'Preview',
				action: function(evt){
					that.pvwMdl.startPreview();
				}
			});
			var publish = new editor.ui.MenuItem({
				title: 'Publish',
				action: function(evt){
					// close other dialogs
					that.loadMdlDlg.dialog('close');
					that.unloadMdlDlg.dialog('close');
					that.publishPrjDlg.dialog('open');
				}
			});
			
            this.fileMenu.addMenuItem(newProject);
			this.fileMenu.addMenuItem(openProject);
            this.fileMenu.addMenuItem(saveProject);
            this.fileMenu.addMenuItem(preview);
            this.fileMenu.addMenuItem(publish);
			
            var wireframe = new editor.ui.MenuItem({
				title: 'Wireframe',
				stateful: true,
				action: function(evt){
					that.wfrMdl.enableWireframe(!that.wfrMdl.enabled);
				}
			});
            var xy = new editor.ui.MenuItem({
				title: 'XY',
				stateful: true,
				action: function(evt){
					if (xy.state == editor.ui.Constants.UP_STATE) {
						that.ortMdl.setView([0, 0, hemi.world.camera.distance], 1);
						yz.setState(editor.ui.Constants.UP_STATE);
						xz.setState(editor.ui.Constants.UP_STATE);
					}
					else {
						that.ortMdl.resetView();
					}
				}
			});
            var xz = new editor.ui.MenuItem({
				title: 'XZ',
				stateful: true,
				action: function(evt){
					if (xz.state == editor.ui.Constants.UP_STATE) {
						that.ortMdl.setView([0, hemi.world.camera.distance, 0.000001], 2);
						yz.setState(editor.ui.Constants.UP_STATE);
						xy.setState(editor.ui.Constants.UP_STATE);
					}
					else {
						that.ortMdl.resetView();
					}
				}
			});
            var yz = new editor.ui.MenuItem({
				title: 'YZ',
				stateful: true,
				action: function(evt){
					if (yz.state == editor.ui.Constants.UP_STATE) {
						that.ortMdl.setView([hemi.world.camera.distance, 0, 0], 3);
						xz.setState(editor.ui.Constants.UP_STATE);
						xy.setState(editor.ui.Constants.UP_STATE);
					}
					else {
						that.ortMdl.resetView();
					}
				}
			});
			
			var showHideGrid = new editor.ui.MenuItem({
				title: 'Hide Grid',
				stateful: true,
				action: function(evt) {
					if (showHideGrid.state == editor.ui.Constants.UP_STATE) {
						showHideGrid.setTitle('Show Grid');
						that.removeGrid();
					}
					else {
						showHideGrid.setTitle('Hide Grid');
						that.showGrid();
					}
				}
			});
            
            this.viewMenu.addMenuItem(wireframe);
            this.viewMenu.addMenuItem(showHideGrid);
            this.viewMenu.addMenuItem(xy);
            this.viewMenu.addMenuItem(xz);
            this.viewMenu.addMenuItem(yz);
			
			var loadModel = new editor.ui.MenuItem({
				title: 'Load Model',
				action: function(evt) {
					that.loadMdlDlg.dialog('open');
				}
			});
			var unloadModel = new editor.ui.MenuItem({
				title: 'Unload Model',
				action: function(evt) {
					that.unloadMdlDlg.dialog('open');
				}
			});
			var importModel = new editor.ui.MenuItem({
				title: 'Import Model',
				action: function(evt) {
					that.importMdlDlg.dialog('open');
				}
			});
			
			this.modelMenu.addMenuItem(loadModel);
			this.modelMenu.addMenuItem(unloadModel);
			this.modelMenu.addMenuItem(importModel);
			
			this.menu.addMenuItem(this.fileMenu);
			this.menu.addMenuItem(this.viewMenu);
			this.menu.addMenuItem(this.modelMenu);
            
            // add the menus to the container
			var container = jQuery('#menu');
			container.append(this.menu.getUI());
		},
		
		layoutProjectName: function() {
			var container = jQuery('#menu'),
				label = jQuery('<span class="label">Current Project:</span>');
				
			this.projectNameDiv = jQuery('<div id="currentProject"></div>');				
			this.projectName = jQuery('<span class="name"></span>');
			this.projectNameDiv.append(label).append(this.projectName).hide();
			
			container.append(this.projectNameDiv);
		},
		
		layoutToolbar: function() {
			var tools = editor.tools;
			
			this.toolbar = new editor.ui.Toolbar({
				containerId: 'toolcontainer1'
			});
            
			// model browser
            var mbrView = new tools.ModelBrowserView(),
            	mbrCtr = new tools.ModelBrowserController();
            this.mbrMdl = new tools.ModelBrowserModel();
			this.selMdl = new tools.SelectorModel();
            
			// manipulations
            var mnpView = new tools.ManipsView(),
            	mnpCtr = new tools.ManipsController();
            this.mnpMdl = new tools.ManipsModel();
            
			// motions
            var mtnView = new tools.MotionsView(),
            	mtnCtr = new tools.MotionsController();
            this.mtnMdl = new tools.MotionsModel();
			
			// animator
			var anmView = new tools.AnimatorView(),
				anmCtr = new tools.AnimatorController();
			this.anmMdl = new tools.AnimatorModel();
			
			// viewpoints
			var vptView = new tools.ViewpointsView(),
            	vptCtr = new tools.ViewpointsController();
            this.vptMdl = new tools.ViewpointsModel();
            
			// message handling
            var msgView = new tools.MessagingView(),
            	msgCtr = new tools.MessagingController();
            this.msgMdl = new tools.MessagingModel();
			
			// particle effects
			var pteView = new tools.ParticleFxMgrView(),
				pteCtr = new tools.ParticleFxMgrController();
			this.pteMdl = new tools.ParticleFxMgrModel();
			
			// preview tool
			var pvwView = new tools.PreviewView(),
				pvwCtr = new tools.PreviewController();
			this.pvwMdl = new tools.PreviewModel();
			
			// scenes
			var scnView = new tools.SceneMgrView(),
				scnCtr = new tools.SceneMgrController();
			this.scnMdl = new tools.SceneMgrModel();
			
			// shapes
			var shpView = new tools.ShapesView(),
				shpCtr = new tools.ShapesController();
			this.shpMdl = new tools.ShapesModel();
			
			// hud displays
			var hudView = new tools.HudDisplaysView(),
				hudCtr = new tools.HudDisplaysController();
			this.hudMdl = new tools.HudDisplaysModel();
			
			// fog
			var fogView = new tools.FogView(),
				fogCtr = new tools.FogController();
			this.fogMdl = new tools.FogModel();
			
			// curves
			var crvView = new tools.CurveEditorView(),
				crvCtr = new tools.CurveEditorController();
			this.crvMdl = new tools.CurveEditorModel();
			
			// timer
			var tmrView = new tools.TimersView(),
				tmrCtr = new tools.TimersController();
			this.tmrMdl = new tools.TimersModel();
            
			// add to the toolbars
            this.toolbar.addTool(mbrView);
			this.toolbar.addTool(mnpView);
			this.toolbar.addTool(mtnView);
            this.toolbar.addTool(anmView);
            this.toolbar.addTool(vptView);
            this.toolbar.addTool(msgView);
			this.toolbar.addTool(pteView);
			this.toolbar.addTool(pvwView);
			this.toolbar.addTool(scnView);
			this.toolbar.addTool(shpView);
			this.toolbar.addTool(hudView);
			this.toolbar.addTool(fogView);
			this.toolbar.addTool(crvView);
			this.toolbar.addTool(tmrView);
                        			
			// finally, bind all the view/model/controllers together
            mbrCtr.setView(mbrView);
            mbrCtr.setModel(this.mbrMdl);
            mbrCtr.setSelectorModel(this.selMdl);
			
			mnpView.addSidebarWidget(mbrView.modelTreeSBWidget);
            mnpCtr.setView(mnpView);
            mnpCtr.setModel(this.mnpMdl);
            mnpCtr.setSelectorModel(this.selMdl);
			
			mtnView.addSidebarWidget(mbrView.modelTreeSBWidget);
            mtnCtr.setView(mtnView);
            mtnCtr.setModel(this.mtnMdl);
            mtnCtr.setSelectorModel(this.selMdl);
            
            anmCtr.setView(anmView);
            anmCtr.setModel(this.anmMdl);
            
            vptCtr.setView(vptView);
            vptCtr.setModel(this.vptMdl);
			
            msgCtr.setView(msgView);
            msgCtr.setModel(this.msgMdl);
			
			pteCtr.setView(pteView);
			pteCtr.setModel(this.pteMdl);
			
			pvwCtr.setView(pvwView);
			pvwCtr.setModel(this.pvwMdl);
			
			scnCtr.setView(scnView);
			scnCtr.setModel(this.scnMdl);
			scnCtr.setMessagingModel(this.msgMdl);
			
			shpCtr.setView(shpView);
			shpCtr.setModel(this.shpMdl);
			
			hudCtr.setView(hudView);
			hudCtr.setModel(this.hudMdl);
			
			fogCtr.setView(fogView);
			fogCtr.setModel(this.fogMdl);
			
			crvCtr.setView(crvView);
			crvCtr.setModel(this.crvMdl);
			
			tmrCtr.setView(tmrView);
			tmrCtr.setModel(this.tmrMdl);
		},
		
		layoutSidebar: function() {
			this.sidebar = new editor.ui.Sidebar();
			
			var views = this.toolbar.tools;
			
			for (var ndx = 0, len = views.length; ndx < len; ndx++) {
				var view = views[ndx],
					widgets = view.sidebarWidgets;				
				
				// disable the tool to prevent selection before it's ready
				view.setEnabled(false);
				view.setSidebar(this.sidebar);
				
				for (var ndx2 = 0, len2 = widgets.length; ndx2 < len2; ndx2++) {
					this.sidebar.addWidget(widgets[ndx2]);
				}
			}
		},
		
		sizeViewerPane: function() {
			var win = jQuery(window),
				vwr = jQuery('#column2 .mainView'),
				col = jQuery('#column2'),
				toolCol = jQuery('#column1'),
				sidebarCol = jQuery('#column3'),	
		 		hiddenVwr = jQuery('#column2 .hiddenView'),
				wpr = jQuery('#wrapper'),
			
				windowWidth = window.innerWidth ? window.innerWidth 
					: document.documentElement.offsetWidth,
				windowHeight = win.height(),
				headerHeight = jQuery('#menu').outerHeight(true)
					+ jQuery('#actionBar').outerHeight(true),
				toolbarWidths = jQuery('#column1').outerWidth(true) 
					+ jQuery('#column3').outerWidth(true),
				vwrBdrWidth = Math.ceil(parseFloat(col.css('borderRightWidth'))) 
					+ Math.ceil(parseFloat(col.css('borderLeftWidth'))),
				vwrHMargin = Math.ceil(parseFloat(vwr.css('marginLeft'))) 
					+ Math.ceil(parseFloat(vwr.css('marginRight'))),
				vwrVMargin = Math.ceil(parseFloat(vwr.css('marginTop')))
					+ Math.ceil(parseFloat(vwr.css('marginBottom'))),
				wrapperPadding = Math.ceil(parseFloat(wpr.css('paddingTop')))
					+ Math.ceil(parseFloat(wpr.css('paddingBottom'))),
				toolPadding = Math.ceil(parseFloat(toolCol.css('paddingTop')))
					+ Math.ceil(parseFloat(toolCol.css('paddingBottom'))),
				sidebarPadding = 
					Math.ceil(parseFloat(sidebarCol.css('paddingTop')))
					+ Math.ceil(parseFloat(sidebarCol.css('paddingBottom')));
					
			vwrBdrWidth = isNaN(vwrBdrWidth)? 0 : vwrBdrWidth;
			
			var vwrWidth = windowWidth - toolbarWidths - vwrBdrWidth 
				- vwrHMargin,
				vwrHeight = windowHeight - headerHeight - vwrBdrWidth 
				- vwrVMargin - wrapperPadding;
			
			toolCol.height(windowHeight - headerHeight - toolPadding);
			sidebarCol.height(windowHeight - headerHeight - sidebarPadding);
			col.width(vwrWidth);
			vwr.height(vwrHeight);
			col.height(vwrHeight);
			hiddenVwr.height(0);
			
			// trigger event signaling resize
			vwr.trigger('editor.mainView.resize');
		},
		
		scrollbarWidth: function() {
			var div = jQuery('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
			// Append our div, do our calculation and then remove it
			jQuery('body').append(div);
			var w1 = jQuery('div', div).innerWidth();
			div.css('overflow-y', 'scroll');
			var w2 = jQuery('div', div).innerWidth();
			jQuery(div).remove();
			return (w1 - w2);
		},
		
		saveProject: function(name, oldOctane) {
			var data = null;
			
			if (oldOctane) {					
				data = {
					name: name,
					octane: oldOctane,
					replace: true
				};
			}
			else {
				data = {
					name: name,
					octane: JSON.stringify(editor.getProjectOctane()),
					replace: false
				};
			}
			
			var that = this;
			
			jQuery.ajax({
				url: '/project',
				data: data,
				dataType: 'json',
				type: 'post',
				success: function(data, status, xhr) {
					that.savePrjDlg.find('form').hide();
					that.savePrjDlg.find('#savePrjMsg').text('Saved Project to ' + data.name)
						.show();
					that.projectName.text(name);
					that.projectNameDiv.show(200);
					
					setTimeout(function() {
						that.savePrjDlg.dialog('close');
					}, 1500);
				},
				error: function(xhr, status, err) {
					var msg = that.savePrjDlg.data('msg');
					try {
						var data = JSON.parse(xhr.responseText); 
						
						if (data.errType === 'fileExists') {
							msg.html(data.errMsg + '. <a id="saveErrReplace" href="#">Replace</a> the old project or type a new name below.')
								.removeClass('errMsg');
							
							var lnk = msg.find('#saveErrReplace');
							
							lnk.bind('click', function(){
								var oldData = data.errData;
								that.saveProject(oldData.name, oldData.octane);
							});
							
							msg.show();
						}
					}
					catch (e) {
						msg.text("Can't save project. Server isn't running")
							.addClass('errMsg').show();
								
						setTimeout(function() {
							that.savePrjDlg.dialog('close');
						}, 2000);
					}
				}
			});
		},
		
		openProject: function(name) {
			if (name == null) {
				this.openPrjDlg.data('msg').text('No project specified!').show();
				return;
			}
			
			var data = {
				name: name
			}, 
			that = this;
			
			jQuery.ajax({
				url: '/project',
				data: data,
				dataType: 'json',
				success: function(data, status, xhr){
					that.worldCleaned();
					that.msgMdl.dispatchProxy.swap();
					hemi.octane.createWorld(data);
					that.msgMdl.dispatchProxy.unswap();
					hemi.world.ready();
					
					that.openPrjDlg.find('form').hide();
					that.openPrjDlg.find('#loadPrjMsg').text('Loaded world from project').show();
					// For convenience if they decide to save
					that.savePrjDlg.find('#savePrjName').val(name);
					
					that.projectName.text(name);
					that.projectNameDiv.show(200);
					
					setTimeout(function(){
						that.openPrjDlg.dialog('close');
					}, 1500);
				},
				error: function(xhr, status, err){
					that.openPrjDlg.find('#loadPrjMsg').text(xhr.responseText)
						.removeClass('errMsg').show();
				}
			});
		},
		
		publishProject: function(name) {
			var data = {
					name: name
				},
				models = hemi.world.getModels(),
				msg = this.publishPrjDlg.data('msg'),
				that = this;
			
			if (models.length > 0) {
				var names = [];
				
				for (var i = 0, il = models.length; i < il; i++) {
					names.push(models[i].name);
				}
				
				data.models = names.join(', ');
			} else {
				data.models = 'No models needed!';
			}
			
			jQuery.ajax({
				url: '/publish',
				data: data,
				dataType: 'json',
				type: 'post',
				success: function(data, status, xhr) {
					that.publishPrjDlg.find('form').hide();
					msg.text('Published project as ' + data.name).show();
					
					setTimeout(function() {
						that.publishPrjDlg.dialog('close');
					}, 1500);
				},
				error: function(xhr, status, err) {
					if (xhr.status !== 400) {
						msg.text('Can not publish project. Server is not running.')
							.addClass('errMsg').show();
							
						setTimeout(function() {
							that.publishPrjDlg.dialog('close');
						}, 2000);
					} else {
						msg.text(xhr.responseText);
					}
				}
			});
		},
		
		loadModel: function(url, fcn) {
			var model = new hemi.model.Model(),
				that = this;
			
			var msgHandler = model.subscribe(hemi.msg.load,
				function(msg) {
					fcn();
					model.unsubscribe(msgHandler, hemi.msg.load);
				});
				
			model.setFileName(url);
		},
		
		unloadModel: function(id, fcn) {
			var model = hemi.world.getCitizenById(id),
				that = this;
			
			var msgHandler = model.subscribe(hemi.msg.unload,
				function(msg) {
					that.mbrMdl.removeModel(model);
					fcn();
					model.unsubscribe(msgHandler, hemi.msg.unload);
				});
				
			model.cleanup();
		}
	};
	
	function getParam(name) {
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var regexS = "[\\?&]"+name+"=([^&#]*)";
		var regex = new RegExp( regexS );
		var results = regex.exec( window.location.href );
		if( results == null )
			return "";
		else
			return results[1];
	}
	
	app = new Application();
	
	window.onload = function() {		
//		app.sizeViewerPane();
		initViewerStep1();
	};
	
	window.onunload = function() {
		uninitViewer();
	};
	
	jQuery(window).resize(function() {
//		app.sizeViewerPane();
	});
	
	return editor;
})(editor || {});
