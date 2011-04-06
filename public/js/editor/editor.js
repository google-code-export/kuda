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
		initViewerStep1: function() {
			var app = this,
				options = [];
			
			this.bindJavascript();
			
			// set editor defaults
			editor.Defaults = {
				farPlane: 10000,
				nearPlane: 0.5
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
			
			this.extent = 2000;		// Grid will reach 2000 meters in each direction
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
						that.msgMdl.addCitizen(msg.src);
						that.scnMdl.addCitizen(msg.src);
						that.editorStateChanged();
					}
				});
			hemi.msg.subscribe(hemi.msg.cleanup,
				function(msg) {
					if (msg.src.name != null &&
						msg.src.name.match(editor.tools.ToolConstants.EDITOR_PREFIX) === null) {
						that.msgMdl.removeCitizen(msg.src);
						that.scnMdl.removeCitizen(msg.src);
						that.editorStateChanged();
					}
				});
			
			hemi.world.subscribe(hemi.msg.cleanup, this, 'worldCleaned');
			hemi.world.subscribe(hemi.msg.ready, this, 'worldLoaded');
			
			var addFunc = function(citizen) {
				that.msgMdl.addCitizen(citizen);
				that.scnMdl.addCitizen(citizen);
				that.editorStateChanged();
			};
			var updateFunc = function(citizen) {
				that.msgMdl.updateCitizen(citizen);
				that.scnMdl.updateCitizen(citizen);
				that.editorStateChanged();
			};
			
			this.anmMdl.addListener(editor.EventTypes.AnimationCreated, addFunc);
			this.anmMdl.addListener(editor.EventTypes.AnimationUpdated, updateFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipCreated, addFunc);
			this.mnpMdl.addListener(editor.EventTypes.ManipUpdated, updateFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionCreated, addFunc);
			this.mtnMdl.addListener(editor.EventTypes.MotionUpdated, updateFunc);
			this.vptMdl.addListener(editor.EventTypes.ViewpointAdded, addFunc);
			this.scnMdl.addListener(editor.EventTypes.SceneAdded, addFunc);
			this.scnMdl.addListener(editor.EventTypes.SceneUpdated, updateFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxAdded, addFunc);
			this.pteMdl.addListener(editor.EventTypes.ParticleFxUpdated, updateFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeCreated, addFunc);
			this.shpMdl.addListener(editor.EventTypes.ShapeUpdated, updateFunc);
			this.hudMdl.addListener(editor.EventTypes.DisplayCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementCreated, addFunc);
			this.hudMdl.addListener(editor.EventTypes.ElementUpdated, updateFunc);
			this.hudMdl.addListener(editor.EventTypes.PageCreated, addFunc);
			
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
			this.sidebar.addListener(editor.EventTypes.SidebarFinishedLoading, function() {				
				hemi.world.ready();
				
				// select the first tool
				first.setMode(editor.tools.ToolConstants.MODE_DOWN);
				
				// enable the tools now that all the ui is loaded
				for (var ndx = 0, len = views.length; ndx < len; ndx++) {
					views[ndx].getUI().removeAttr('disabled');
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
			vd.eye = [0, 10, 40];
			vd.target = [0, 0, 0];
            hemi.world.camera.moveToView(vd);			
		},
		
		layoutGrid: function() {
			var url = "images/grid.png",
				oldPath = hemi.loader.loadPath;
				that = this;
			this.db = hemi.core.debug.createDebugHelper(hemi.core.mainPack, 
				hemi.view.viewInfo);
			this.db.addAxis(hemi.core.client.root);
			
			hemi.loader.loadPath = '';
			hemi.loader.loadTexture(url, function(texture) {
		    	var mat = hemi.core.material.createConstantMaterial(
					hemi.core.mainPack, hemi.view.viewInfo, texture, true);	
					
				that.gridShape = hemi.shape.createBox(0, 2*that.extent, 
					2*that.extent, mat);
			
				that.gridShape.parent = hemi.core.client.root;
				that.resetGrid(that.extent, that.fidelity);
		  	});
				
			hemi.loader.loadPath = oldPath;
		},
		
		showGrid: function() {
			this.db.addAxis(hemi.core.client.root);
			this.gridShape.visible = true;
			this.resetGrid(this.extent, this.fidelity);
		},
		
		resetGrid: function(extent, fidelity) {
			this.db.setAxisScale(extent, fidelity/10);
			var fullExtent = extent * 2;
			hemi.texture.scale(this.gridShape.shapes[0].elements[0], 
				fullExtent/fidelity, fullExtent/fidelity);
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
			
            this.wfrMdl = new editor.tools.WireframeModel();
            this.ortMdl = new editor.tools.OrthographicModel();
			this.mdlLdrMdl = new editor.tools.ModelLoaderModel();
			this.mdlLdrView = new editor.tools.ModelLoaderView();
			var mdlLdrCtr = new editor.tools.ModelLoaderController();
			
			mdlLdrCtr.setModel(this.mdlLdrMdl);
			mdlLdrCtr.setView(this.mdlLdrView);
			
            this.savePrjDlg = jQuery('<div title="Save Project" id="savePrjDlg" class="simpleDialog"><p id="savePrjMsg"></p><form method="post" action="" class="dialogForm"><label for="savePrjName">Project Name:</label><input type="text" name="savePrjName" id="savePrjName" /><button id="savePrjBtn">Save</button></form></div>');			
			this.savePrjDlg.find('form').submit(function() { 
				return false; 
			});
			this.savePrjDlg.find('#savePrjBtn').click(function() {
				that.saveProject(that.savePrjDlg.find('#savePrjName').val());
			});
            this.savePrjDlg.dialog({
                width: 300,
                resizable: false,
				autoOpen: false,
				modal: true
            })
			.bind('dialogopen', function() {
				that.savePrjDlg.find('form').show();
				that.savePrjDlg.find('#savePrjMsg').hide();
			});
			
			this.openPrjDlg = jQuery('<div title="Open Project" id="loadPrjDlg" class="simpleDialog"><p id="loadPrjMsg"></p><form method="post" action=""><label for="loadPrjSel">Select a Project:</label><select id="loadPrjSel"></select><button id="loadPrjBtn">Load</button></form></div>');
			var form = this.openPrjDlg.find('form').submit(function() {
				return false;
			});
			var btn = this.openPrjDlg.find('#loadPrjBtn').bind('click', function() {
				that.openProject(that.openPrjDlg.find('#loadPrjSel').val());
			});		
			this.openPrjDlg.dialog({
				width: 300,
				resizable: false,
				autoOpen: false,
                modal: true
			})
			.bind('dialogopen', function() {
				var msg = that.openPrjDlg.find('#loadPrjMsg');
				
				msg.text('Retrieving projects...').show();
				form.hide();
				
				jQuery.ajax({
					url: '/listProjects',
					dataType: 'json',
					success: function(data, status, xhr) {
						var sel = that.openPrjDlg.find('#loadPrjSel'),
							options = data.options;
						
						sel.empty();
						for (var ndx = 0, len = options.length; ndx < len; ndx++) {
							var option = jQuery('<option>' + options[ndx] + '</option>');
							sel.append(option);
						}
						
						form.show();
						msg.hide();
					},
					error: function(xhr, status, err) {
						if (xhr.status === 0) {
							msg.text('Cannot get projects. Server is not running')
								.addClass('errMsg').show();
								
							setTimeout(function() {
								that.openPrjDlg.dialog('close');
							}, 2000);
						}
						else {
							msg.text(xhr.responseText);
						}
					}
				});
			})
			.find('p#loadPrjMsg').hide();
			
			this.previewDlg = jQuery('<div title="Preview" id="previewDlg"></div>');
			this.previewDlg.dialog({
				autoOpen: false,
				modal: true,
				resizable: false
			});
		},
		
		layoutMenu: function() {
			var that = this;
			
	        this.fileMenu = new editor.ui.Menu('File');
	        this.viewMenu = new editor.ui.Menu('View');
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
					that.mdlLdrView.hideDialog();
				
					that.openPrjDlg.dialog('open');
				}
			});
			var saveProject = new editor.ui.MenuItem({
				title: 'Save Project',
				action: function(evt){				
					// close other dialogs
					that.mdlLdrView.hideDialog();
				
					that.savePrjDlg.dialog('open');
				}
			});
			var preview = new editor.ui.MenuItem({
				title: 'Preview',
				action: function(evt){				
					// close other dialogs
					that.mdlLdrView.hideDialog();
				
					var win = jQuery(window),
						windowWidth = window.innerWidth ? window.innerWidth 
							: document.documentElement.offsetWidth,
						windowHeight = win.height(),
						inset = 20,
						iframe = jQuery('<iframe src="preview.html"></iframe>');
						
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
					that.mdlLdrView.showDialog();				
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
			scnCtr.setMessagingModel(this.msgMdl);
			
			shpCtr.setView(shpView);
			shpCtr.setModel(this.shpMdl);
			
			hudCtr.setView(hudView);
			hudCtr.setModel(this.hudMdl);
			
			fogCtr.setView(fogView);
			fogCtr.setModel(this.fogMdl);
		},
		
		layoutSidebar: function() {
			this.sidebar = new editor.ui.Sidebar();
			
			var views = this.toolbar.tools;
			
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
		
		bindJavascript: function() {
		},
		
		editorStateChanged: function() {		
		},
		
		saveProject: function(name, oldOctane) {
			this.msgMdl.dispatchProxy.swap();
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
					octane: JSON.stringify(hemi.world.toOctane()),
					replace: false
				};
			}
			
			var that = this;
				
			this.msgMdl.dispatchProxy.unswap();
			
			jQuery.ajax({
				url: '/saveProject',
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
					var msg = that.savePrjDlg.find('#savePrjMsg');
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
				this.openPrjDlg.find('#loadPrjMsg').text('No project specified!').show();
				return;
			}
			
			var data = {
				name: name
			}, that = this;
			
			jQuery.ajax({
				url: '/openProject',
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
		
		loadModel: function() {
			var url = $('#model').val();
			var model = new hemi.model.Model();
			model.setFileName(url);
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
	
	var app = new Application();
	
	window.onload = function() {		
		app.sizeViewerPane();
		app.initViewerStep1();
	};
	
	window.onunload = function() {
		app.uninitViewer();
	};
	
	jQuery(window).resize(function() {
		app.sizeViewerPane();
	});
})(window);
