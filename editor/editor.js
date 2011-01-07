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

(function(window) {
	o3djs.require('editor.requires');
	
	
////////////////////////////////////////////////////////////////////////////////
//                                 Main App                                   //
////////////////////////////////////////////////////////////////////////////////

	Application = function() {
	};
	
	Application.prototype = {
		initViewerStep1: function(largeGeometry, loadProject) {
			var app = this,
				options = [];
			
			this.bindJavascript();
			
			if (largeGeometry) {
				options.push('LargeGeometry');
			}
			
			// set editor defaults
			editor.Defaults = {
				farPlane: 10000,
				nearPlane: 1
			};
			
			editor.dirty = loadProject;
			
			o3djs.util.makeClients(function(clientElements) {
				app.initViewerStep2(clientElements);
			}, options.join(','));
		},
		
		initViewerStep2: function(clientElements) {
			var defaults = editor.Defaults;
			
			// First: adjust the Hemi loader's path since this HTML file is in
			// the editor directory.
			hemi.loader.loadPath = '../';
			
			hemi.core.init(clientElements[0]);
			
			var cam = hemi.world.camera;
			cam.enableControl();
			cam.clip.far = defaults.farPlane;
			cam.clip.near = defaults.nearPlane;
			cam.updateProjection();
			
			this.extent = 2000;		// Grid will reach 20 meters in each direction
			this.fidelity = 100;	// Grid squares will be 100 meters wide
			
            this.layoutDialogs();
			this.layoutGrid();
			this.layoutToolbar();
			this.layoutSidebar();
            this.layoutMenu();
			
			// For now, we do this here
			var that = this;
			hemi.msg.subscribe(hemi.msg.load,
				function(msg) {
					if (msg.src instanceof hemi.model.Model) {
						that.msgMdl.addCitizen(msg.src);
						that.editorStateChanged();
					}
				});
			var addFunc = function(citizen) {
				that.msgMdl.addCitizen(citizen);
				that.editorStateChanged();
			};
			var removeFunc = function(citizen) {
				that.msgMdl.removeCitizen(citizen);
				that.editorStateChanged();
			};
			var updateFunc = function(citizen) {
				that.msgMdl.updateCitizen(citizen);
				that.editorStateChanged();
			};
			
			this.anmMdl.addListener(editor.EventTypes.AnimationCreated, addFunc);
			this.anmMdl.addListener(editor.EventTypes.AnimationRemoved, removeFunc);
			this.anmMdl.addListener(editor.EventTypes.AnimationUpdated, updateFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipCreated, addFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipRemoved, removeFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipUpdated, updateFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionCreated, addFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionRemoved, removeFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionUpdated, updateFunc);
			this.vptMdl.addListener(editor.EventTypes.ViewpointAdded, addFunc);
			this.vptMdl.addListener(editor.EventTypes.ViewpointRemoved, removeFunc);
			this.scnMdl.addListener(editor.EventTypes.SceneAdded, addFunc);
			this.scnMdl.addListener(editor.EventTypes.SceneRemoved, removeFunc);
			this.scnMdl.addListener(editor.EventTypes.SceneUpdated, updateFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxAdded, addFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxRemoved, removeFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxUpdated, updateFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeCreated, addFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeRemoved, removeFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeUpdated, updateFunc);
			this.hudMdl.addListener(editor.EventTypes.DisplayCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.DisplayRemoved, removeFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementRemoved, removeFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementUpdated, updateFunc);
			this.hudMdl.addListener(editor.EventTypes.PageCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.PageRemoved, removeFunc);
			
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
			
			hemi.world.subscribe(hemi.msg.cleanup, this, 'worldCleaned');
			hemi.world.subscribe(hemi.msg.ready, this, 'worldLoaded');
			
			hemi.world.ready();
			
			if (editor.dirty) {
				var app = this;
				// wait for widgets to load
				this.sidebar.addListener(editor.EventTypes.SidebarFinishedLoading, function() {
					app.openProject();
				});
			}
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
            
			var vd = hemi.view.createViewData(hemi.world.camera);
			vd.eye = [0, 100, 600];
			vd.target = [0, 0, 0];
            hemi.world.camera.moveToView(vd);			
		},
		
		layoutGrid: function() {
			this.db = o3djs.debug.createDebugHelper(hemi.core.mainPack, hemi.view.viewInfo);
			this.db.addAxis(hemi.core.client.root);
			this.gridMat = hemi.fx.create({
				type:'grid',
				color1:[0.8,0.8,1,1],
				thickness:0.03,
				squares:this.extent/this.fidelity });
			this.gridShape = hemi.shape.createBox(0,2*this.extent,2*this.extent,this.gridMat);
			this.gridShape.parent = hemi.core.client.root;
			this.resetGrid(this.extent, this.fidelity);
		},
		
		showGrid: function() {
			this.db.addAxis(hemi.core.client.root);
			this.gridShape.visible = true;
			this.resetGrid(this.extent,this.fidelity);
		},
		
		resetGrid: function(extent, fidelity) {
			this.db.setAxisScale(extent, fidelity/10);
			this.gridMat.getParam('squares').value = extent/fidelity;
		},
		
		removeGrid: function() {
			this.gridShape.visible = false;
			this.db.removeAxes(hemi.core.client.root);
		},
		
		uninitViewer: function() {
			if (hemi.core.client) {
				hemi.core.client.cleanup();
			}
		},
		
		layoutDialogs: function() {
			var that = this;
			
            this.savePrjDlg = jQuery('<div title="Save Project" id="saveProjectDlg"><p>Saved project to project.json</p></div>');
            this.savePrjDlg.dialog({
                width: 300,
                resizable: false,
				autoOpen: false,
				modal: true
            });
			
			this.openPrjDlg = jQuery('<div title="Open Project" id="openProjectDlg"><p id="projSuccess">Finished Loading Project</p><p id="projNull">There was no project to load</p></div>');
			this.openPrjDlg.dialog({
				width: 300,
				resizable: false,
				autoOpen: false,
                modal: true
			})
			.find('p#projNull').hide();
			
			this.previewDlg = jQuery('<div title="Preview" id="previewDlg"></div>');
			this.previewDlg.dialog({
				autoOpen: false,
				modal: true,
				resizable: false
			});
		},
		
		layoutMenu: function() {
			var that = this;
			
            this.wfrMdl = new editor.tools.WireframeModel();
            this.ortMdl = new editor.tools.OrthographicModel();
			this.mdlLdrMdl = new editor.tools.ModelLoaderModel();
			var mdlLdrView = new editor.tools.ModelLoaderView();
			var mdlLdrCtr = new editor.tools.ModelLoaderController();
			
			mdlLdrCtr.setModel(this.mdlLdrMdl);
			mdlLdrCtr.setView(mdlLdrView);
						
        
	        this.fileMenu = new editor.ui.Menu('File');
	        this.viewMenu = new editor.ui.Menu('View');
			this.menu = new editor.ui.MenuBar();
			
			var newProject = new editor.ui.MenuItem({
				title: 'New Project',
				action: function(evt) {
					hemi.world.cleanup();
					hemi.world.camera.enableControl();
					hemi.world.ready();
				}
			});
			
			var openProject = new editor.ui.MenuItem({
				title: 'Open Project',
				action: function(evt){					
					if (that.openProject()) {
						that.openPrjDlg.find('p#projSuccess').show();
						that.openPrjDlg.find('p#projNull').hide();
					}
					else {
						that.openPrjDlg.find('p#projSuccess').hide();
						that.openPrjDlg.find('p#projNull').show();
					}
					that.openPrjDlg.dialog('open');
					setTimeout(function(){
						that.openPrjDlg.dialog('close');
					}, 1000);
				}
			});
			var saveProject = new editor.ui.MenuItem({
				title: 'Save Project',
				action: function(evt){
					that.saveProject();
					that.savePrjDlg.dialog('open');
					setTimeout(function(){
						that.savePrjDlg.dialog('close');
					}, 1000);
				}
			});
			var preview = new editor.ui.MenuItem({
				title: 'Preview',
				action: function(evt){
					var win = jQuery(window);
					var windowWidth = window.innerWidth ? window.innerWidth : document.documentElement.offsetWidth;
					var windowHeight = win.height();
					var inset = 20;
					var iframe = jQuery('<iframe src="preview.html"></iframe>');
					// Hide the currently rendered tree
					var children = hemi.core.client.root.children;
					
					for (var ndx = 0; ndx < children.length; ndx++) {
						children[ndx].parent = null;
					}
					
					that.previewDlg.append(iframe).dialog('option', {
						width: windowWidth - inset * 2,
						height: windowHeight - inset * 2
					}).dialog('open').bind('dialogclose', function(evt, ui){
						// Restore the render tree
						for (var ndx = 0; ndx < children.length; ndx++) {
							children[ndx].parent = hemi.core.client.root;
						}
						
						iframe.remove();
					});
					
					iframe.height(that.previewDlg.height() - 4);
				}
			});
			var separator = new editor.ui.Separator();
			var loadModel = new editor.ui.MenuItem({
				title: 'Load Model',
				action: function(evt){
					mdlLdrView.showDialog();
				}
			});
			
            this.fileMenu.addMenuItem(newProject);
			this.fileMenu.addMenuItem(openProject);
            this.fileMenu.addMenuItem(saveProject);
            this.fileMenu.addMenuItem(preview);
            this.fileMenu.addMenuItem(separator);
            this.fileMenu.addMenuItem(loadModel);
			
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
			
			this.menu.addMenuItem(this.fileMenu);
			this.menu.addMenuItem(this.viewMenu);
            
            // add the menus to the container
			var container = jQuery('#menu');
			container.append(this.menu.getUI());
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
            
			// add to the toolbars
            this.toolbar.addTool(mbrView);
			this.toolbar.addTool(mnpView);
			this.toolbar.addTool(mtnView);
            this.toolbar.addTool(anmView);
            this.toolbar.addTool(vptView);
            this.toolbar.addTool(msgView);
			this.toolbar.addTool(pteView);
			this.toolbar.addTool(scnView);
			this.toolbar.addTool(shpView);
			this.toolbar.addTool(hudView);
			this.toolbar.addTool(fogView);
                        			
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
			
			scnCtr.setView(scnView);
			scnCtr.setModel(this.scnMdl);
			
			shpCtr.setView(shpView);
			shpCtr.setModel(this.shpMdl);
			
			hudCtr.setView(hudView);
			hudCtr.setModel(this.hudMdl);
			
			fogCtr.setView(fogView);
			fogCtr.setModel(this.fogMdl);
		},
		
		layoutSidebar: function() {
			this.sidebar = new editor.ui.Sidebar();
			
			var views = this.toolbar.tools,
				first = views[0];
			
			for (var ndx = 0, len = views.length; ndx < len; ndx++) {
				var view = views[ndx],
					widgets = view.sidebarWidgets;				
				
				// disable the tool to prevent selection before it's ready
				view.getUI().attr('disabled', 'disabled');
				view.setSidebar(this.sidebar);
				
				for (var ndx2 = 0, len2 = widgets.length; ndx2 < len2; ndx2++) {
					this.sidebar.addWidget(widgets[ndx2]);
				}
			}
			
			// show the first tool
			this.sidebar.addListener(editor.EventTypes.SidebarFinishedLoading, function() {
				first.setMode(editor.tools.ToolConstants.MODE_DOWN);
				
				// enable the tools now that all the ui is loaded
				for (var ndx = 0, len = views.length; ndx < len; ndx++) {
					views[ndx].getUI().removeAttr('disabled');
				}
			});
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
				headerHeight = jQuery('#menu').outerHeight()
					+ jQuery('#actionBar').outerHeight(),
				toolbarWidths = jQuery('#column1').outerWidth() 
					+ jQuery('#column3').outerWidth(),
				vwrBdrWidth = parseInt(col.css('borderRightWidth')) 
					+ parseInt(col.css('borderLeftWidth')),
				vwrHMargin = parseInt(vwr.css('marginLeft')) 
					+ parseInt(vwr.css('marginRight')),
				vwrVMargin = parseInt(vwr.css('marginTop')) 
					+ parseInt(vwr.css('marginBottom')),
				wrapperPadding = parseInt(wpr.css('paddingTop')) 
					+ parseInt(wpr.css('paddingBottom')),
				toolPadding = parseInt(toolCol.css('paddingTop')) 
					+ parseInt(toolCol.css('paddingBottom')),
				sidebarPadding = parseInt(sidebarCol.css('paddingTop')) 
					+ parseInt(sidebarCol.css('paddingBottom'));
					
			
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
		
		bindJavascript: function() {
			var app = this,
				largeOn = getParam('lrgGeo').toLowerCase() == 'true',
				savedProject = getParam('loadProj').toLowerCase() == 'true',
				lrgParam = largeOn ? 'lrgGeo=false' : 'lrgGeo=true',
				svdParam = savedProject ? 'loadProj=true' : 'loadProj=false',
				href = [lrgParam, svdParam],
				linkTxt = largeOn ? 'Small Geometry' : 'Large Geometry',
				linkCls = largeOn ? 'smallGeom' : 'largeGeom';
			
			jQuery("#geometryToggle").bind('click', function(evt) {
				if (editor.dirty) {
					app.saveProject();
				}
			})
			.attr('href', '?' + href.join('&')).text(linkTxt).addClass(linkCls);
		},
		
		editorStateChanged: function() {		
			var app = this,
				largeOn = getParam('lrgGeo').toLowerCase() == 'true',
				savedProject = getParam('loadProj').toLowerCase() == 'true',
				lrgParam = largeOn ? 'lrgGeo=false' : 'lrgGeo=true',
				svdParam = 'loadProj=true',
				href = [lrgParam, svdParam];
				
			jQuery('#geometryToggle').attr('href', '?' + href.join('&'));
			editor.dirty = true;
		},
		
		saveProject: function() {
			this.msgMdl.dispatchProxy.swap();
			var octane = hemi.world.toOctane();
			this.msgMdl.dispatchProxy.unswap();
			var path = document.location.href;
			var pathArr = path.split(/[\/|\\]/);
			pathArr.pop();
			path = pathArr.join('/') + '/project.json';
			jQuery.twFile.save(jQuery.twFile.convertUriToLocalPath(path), JSON.stringify(octane));
		},
		
		openProject: function() {
			//				var octane = localStorage.getItem('kudaProject');
			var path = document.location.href;
			var pathArr = path.split(/[\/|\\]/);
			pathArr.pop();
			path = pathArr.join('/') + '/project.json';
			var octane = jQuery.twFile.load(jQuery.twFile.convertUriToLocalPath(path));
			
			if (octane) {
				// Fake the World cleanup message now since the dispatch
				// will be switched while cleaning and loading the World
				this.worldCleaned();
				this.msgMdl.dispatchProxy.swap();
				hemi.octane.createWorld(JSON.parse(octane));
				this.msgMdl.dispatchProxy.unswap();
				hemi.world.ready();
			}
			
			return octane != null;
		},
		
		loadModel: function() {
			var url = $('#model').val();
			var model = new hemi.model.Model();
			model.setFileName(url);
		}
	};
	
	function getParam( name ) {
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var regexS = "[\\?&]"+name+"=([^&#]*)";
		var regex = new RegExp( regexS );
		var results = regex.exec( window.location.href );
		if( results == null )
			return "";
		else
			return results[1];
	}
	
	var app = new Application();
	
	window.onload = function() {
		var large = getParam('lrgGeo').toLowerCase() == 'true',
			loadProject = getParam('loadProj').toLowerCase() == 'true';
		
		app.sizeViewerPane();
		app.initViewerStep1(large, loadProject);
	};
	
	window.onunload = function() {
		app.uninitViewer();
	};
	
	jQuery(window).resize(function() {
		app.sizeViewerPane();
	});
})(window);
