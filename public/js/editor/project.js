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
	
	// TODO: change to the autosave format like in google docs
	// TODO: have this listen to all relevant events implying changed state
	//		perhaps have tool models automatically send a changed state event
	//		whenever an event occurs
	
	var event = {
		CheckProjectExists: 'checkProjectExists',
		Load: 'load',
		Loaded: 'loaded',
		Projects: 'projects',
		ProjectExists: 'projectExsits',
		Publish: 'publish',
		Published: 'published',
		Remove: 'remove',
		Removed: 'removed',
		Save: 'save',
		Saved: 'saved',
		ServerRunning: 'serverRunning',
		StartPreview: 'startPreview',
		StopPreview: 'stopPreview',
		UpdateProjects: 'updateProjects'
	}
	    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	
	var ProjectModel = editor.ToolModel.extend({
		init: function() {
			this._super('projectLoad');
			
			this.projectCache = [];
			this.serverRunning = true;
			this.changed = true;
			this.current = null;
			
			var mdl = this;
						
			jQuery.ajax({
				url: '/projects',
				dataType: 'json',
				success: function(data, status, xhr) {
					mdl.projectCache = data.projects;
				},
				error: function(xhr, status, err) {			
					mdl.serverRunning = false;
					mdl.notifyListeners(event.ServerRunning, false);
				}
			});
		},
		
		checkExisting: function(project) {
			var exists = false;
			
			for (var i = 0, il = this.projectCache.length; i < il && !exists; i++) {
				exists |= this.projectCache[i].toLowerCase() 
					=== project.toLowerCase();
			}
			
			this.notifyListeners(event.ProjectExists, {
				exists: exists,
				project: project
			});
		},
		
		getProjects: function() {
			this.notifyListeners(event.Projects, this.serverRunning ? 
				this.projectCache : null);
		},
		
		load: function(project) {
			var data = {
					name: project
				},
				dispatchProxy = editor.getDispatchProxy(),
				mdl = this;
			
			jQuery.ajax({
				url: '/project',
				data: data,
				dataType: 'json',
				success: function(data, status, xhr) {
					hemi.world.send(hemi.msg.cleanup);
					dispatchProxy.swap();
					hemi.octane.createWorld(data);
					dispatchProxy.unswap();
					hemi.world.ready();
					
					mdl.notifyListeners(event.Loaded, {
						project: project,
						succeeded: true
					});
				},
				error: function(xhr, status, err){
					mdl.notifyListeners(event.Loaded, {
						project: project,
						succeeded: false
					});
				}
			});
		},
		
		notify: function(eventType, value) {
			switch (eventType) {
				case editor.events.Created:
				case editor.events.Removed:
				case editor.events.Updated: 
					this.changed = true;
					this.save();
					break;
			}
		},
		
		publish: function(project) {
			this.save(project, true);
			
			var data = {
					name: project
				},
				models = hemi.world.getModels(),
				mdl = this;
			
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
					mdl.notifyListeners(event.Published, {
						succeeded: true
					});
				},
				error: function(xhr, status, err) {
					mdl.notifyListeners(event.Published, {
						succeeded: false,
						message: ''
					})
				}
			});
			
		},
		
		remove: function(project) {								
			var data = {
					name: project
				},
				mdl = this;
			
			jQuery.ajax({
				url: '/project',
				data: data,
				dataType: 'json',
				type: 'delete',
				success: function(data, status, xhr) {
					mdl.notifyListeners(event.Removed, data.name);
					
					var ndx = mdl.projectCache.indexOf(project);
					
					if (ndx !== -1) {
						mdl.projectCache.splice(ndx, 1);
					}
				},
				error: function(xhr, status, err) {
					mdl.serverRunning = false;
				}
			});
		},
		
		save: function(project, replace) {
			replace = replace || false;
								
			var data = {
					name: project,
					octane: JSON.stringify(editor.getProjectOctane()),
					replace: replace
				},
				mdl = this;
			
			jQuery.ajax({
				url: '/project',
				data: data,
				dataType: 'json',
				type: 'post',
				success: function(data, status, xhr) {
					mdl.notifyListeners(event.Saved, {
						project: project,
						saved: true
					});
					mdl.projectCache.push(project);
				},
				error: function(xhr, status, err) {
					mdl.serverRunning = false;
					mdl.notifyListeners(event.Saved, {
						project: project,
						saved: false
					});					
				}
			});
		},
		
		startPreview: function() {
			if (this.worldState != null) {
				return;
			}
			
			// save current world props (and editor props)
			var hi = hemi.input,
				hr = hemi.core.client.root,
				hw = hemi.world,
				data = editor.getProjectOctane();
			
			// make a deep copy, so the preview world created from the data
			// won't affect the editor world
			data = hemi.utils.clone(data);
			
			this.worldState = {
				camera: hw.camera,
				citizens: hw.citizens,
				loader: hw.loader,
				pickGrabber: hw.pickGrabber,
				tranReg: hw.tranReg,
				fog: hw.fog,
				nextId: hw.checkNextId(),
				msgSpecs: hemi.dispatch.msgSpecs,
				pickRoot: hemi.picking.pickRoot,
				pickManager: hemi.picking.pickManager,
				modelRoot: hemi.model.modelRoot,
				shapeRoot: hemi.shape.root,
				children: hr.children,
				rL: hemi.view.renderListeners,
				mdL: hi.mouseDownListeners,
				muL: hi.mouseUpListeners,
				mmL: hi.mouseMoveListeners,
				mwL: hi.mouseWheelListeners,
		        kdL: hi.keyDownListeners,
		        kuL: hi.keyUpListeners,
		        kpL: hi.keyPressListeners
			};
			
			// Hide the currently rendered tree
			var children = hr.children;
			hr.children = [];
			
			for (var ndx = 0; ndx < children.length; ndx++) {
				children[ndx].parent = null;
			}
			
			// set the world to its initial state
			hemi.view.renderListeners = [hemi.view.clientSize];
			hi.mouseDownListeners = [hw];
			hi.mouseUpListeners = [];
			hi.mouseMoveListeners = [];
			hi.mouseWheelListeners = [];
	        hi.keyDownListeners = [];
	        hi.keyUpListeners = [];
	        hi.keyPressListeners = [];
			hw.citizens = new hemi.utils.Hashtable();
			hw.camera = null;
			hw.loader = {finish: function(){}};
			hw.pickGrabber = null;
			hw.tranReg = new hemi.world.TransformRegistry();
			hw.fog = null;
			
			hemi.dispatch.msgSpecs = new hemi.utils.Hashtable();
			hemi.picking.init();
			hemi.model.init();
			hemi.shape.root = hemi.core.mainPack.createObject('Transform');
			hemi.shape.root.name = hemi.shape.SHAPE_ROOT;
			hemi.shape.root.parent = hemi.picking.pickRoot;
			
			hemi.world.subscribe(hemi.msg.progress, editor.ui.progressUI, 'msgUpdate');
			
			// now load the preview data
			hemi.octane.createWorld(data);
			hemi.world.ready();
		},
		
		stopPreview: function() {
			if (this.worldState == null) {
				return;
			}
			
			var hi = hemi.input,
				hr = hemi.core.client.root,
				hw = hemi.world,
				ws = this.worldState;
			
			// Clean up the preview world
			hw.cleanup();
			hemi.dispatch.cleanup();
			hw.camera.cleanup();
			hemi.hud.hudMgr.clearDisplay();
			hemi.model.modelRoot.parent = null;
			hemi.core.mainPack.removeObject(hemi.model.modelRoot);
			hemi.shape.root.parent = null;
			hemi.core.mainPack.removeObject(hemi.shape.root);
			hemi.picking.pickRoot.parent = null;
			hemi.core.mainPack.removeObject(hemi.picking.pickRoot);
			
			// restore the world back to original state
			hemi.dispatch.msgSpecs = ws.msgSpecs;
			hemi.picking.pickRoot = ws.pickRoot;
			hemi.picking.pickManager = ws.pickManager;
			hemi.model.modelRoot = ws.modelRoot;
			hemi.shape.root = ws.shapeRoot;
			hemi.shape.material.getParam('lightWorldPos').bind(ws.camera.light.position);
			hemi.shape.transMaterial.getParam('lightWorldPos').bind(ws.camera.light.position);
			
			if (ws.fog != null) {
				hw.fog = ws.fog;
				hemi.view.setBGColor(ws.fog.color);
			}
			
			hw.tranReg = ws.tranReg;
			hw.pickGrabber = ws.pickGrabber;
			hw.loader = ws.loader;
			hw.camera = ws.camera;
			hw.citizens = ws.citizens;
			hw.setNextId(ws.nextId);
			hi.mouseDownListeners = ws.mdL;
			hi.mouseUpListeners = ws.muL;
			hi.mouseMoveListeners = ws.mmL;
			hi.mouseWheelListeners = ws.mwL;
	        hi.keyDownListeners = ws.kdL;
	        hi.keyUpListeners = ws.kuL;
	        hi.keyPressListeners = ws.kpL;
			hemi.view.renderListeners = ws.rL;
			
			// Restore the render tree
			hr.children = ws.children;
			
			for (var ndx = 0; ndx < ws.children.length; ndx++) {
				ws.children[ndx].parent = hr;
			}
			
			hw.camera.update();
			hw.camera.updateProjection();
			this.worldState = null;
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  Widget Private Methods     	                  //
////////////////////////////////////////////////////////////////////////////////  
	
	var sizeAndPosition = function() {
			var container = this.container,
				padding = parseInt(container.css('paddingBottom')) +
					parseInt(container.css('paddingTop')),
				win = jQuery(window),
				winHeight = win.height(),
				wgtHeight = winHeight - padding;
			
			container.height(wgtHeight);
		};
	
////////////////////////////////////////////////////////////////////////////////
//                              Loading Widget                                //
////////////////////////////////////////////////////////////////////////////////
	
	var ListItem = editor.ui.EditableListItem.extend({
		init: function() {
			this._super({
				editable: false
			});
			
			this.versionsHash = new Hashtable();
		},
		
		add: function(project, version) {
			var li = new editor.ui.EditableListItem({
					editable: false,
					removeable: false
				});
			
			li.setText(version);
			li.attachObject(version);
			
			this.bindButtons(li);
			this.list.add(li);
			this.versionsHash.put(version, li);
		},
		
		bindButtons: function(li) {
			var wgt = this;
		},
		
		finishLayout: function() {
			this._super();
			
			// attach the sub lists
			var loadHeader = jQuery('<h2>Versions:</h2>'),
				prjList = jQuery('<div class="prjListWrapper"></div>'),
				arrow = jQuery('<div class="prjListArrow"></div>'),
				wgt = this;
			
			this.list = new editor.ui.List({
				cssClass: 'prjLst',
				prefix: 'prjLst'
			});
			
			prjList.append(loadHeader).append(this.list.getUI())
				.hide();
			arrow.hide();
			this.container.append(arrow).append(prjList);
			
			this.container.bind('click', function(evt) {
				var tgt = jQuery(evt.target);
				
//				if (tgt.tagName !== 'BUTTON'
//						&& tgt.parents('.prjListWrapper').size() === 0
//						&& !tgt.hasClass('prjListWrapper')) {
//					arrow.toggle(100);
//					prjList.slideToggle(200);
//				}
			});	
			
			this.title.bind('click', function() {
				wgt.notifyListeners(event.Load, wgt.getAttachedObject());
			});
		},
		
		remove: function(version) {
			var li = this.versionsHash.remove(version);			
			this.list.remove(li);
		}
	});

	var LoadListWidget = editor.ui.ListWidget.extend({
		init: function(options) {
		    this._super({
				name: 'prjListWidget',
				listId: 'projectList',
				prefix: 'prjLst',
				title: 'Projects',
				instructions: ''
			});
			
			this.items = new Hashtable();	
			this.container.addClass('fullSideWidget');	
			sizeAndPosition.call(this);	
		},
			    
	    add: function(project) {			
			var li = this.items.get(project);
			
			if (!li) {
				li = this.createListItem();
					
				li.setText(project);
				li.attachObject(project);
				
				this.bindButtons(li, project);
				
				this.list.add(li);
				this.items.put(project, li);
			}
			
			return li;
	    },
		
		bindButtons: function(li, project) {
			var wgt = this;
			
			li.removeBtn.bind('click', function(evt) {
				wgt.notifyListeners(event.Remove, 
					project);
			});
		},
		
		createListItem: function() {
			var li = new ListItem(),
				wgt = this;
			
			// relay messages
			li.addListener(event.Load, function(project) {
				wgt.notifyListeners(event.Load, project);
			});
			
			return li;
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		},
	    
	    remove: function(project) {
			var li = this.items.get(project),
				retVal = false;
			
			if (li) {
				li.removeObject();
				this.list.remove(li);
				this.items.remove(project);
				retVal = true;
			}
			
			return retVal;
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                              Preview Widget                                //
////////////////////////////////////////////////////////////////////////////////
	
	var PreviewWidget = editor.ui.Widget.extend({
		init: function() {
			this._super({
				name: 'previewWidget',
				classes: ['previewWidget'],
				height: editor.ui.Height.MANUAL
			});
		},
		
		finishLayout: function() {
			this._super();
			var wgt = this,
				title = jQuery('<h1>World<span>Editor</span></h1>'),
				subTitle = jQuery('<h2>Preview Mode</h2>'),
				titleCtn = jQuery('<div></div>');
			
			this.stopBtn = jQuery('<button id="prjStopPreviewBtn">Stop Preview</button>');
			
			this.stopBtn.bind('click', function() {
				wgt.notifyListeners(event.StopPreview);
			});
			
			titleCtn.append(title).append(subTitle);
			this.container.append(titleCtn).append(this.stopBtn);
		}
	});
		
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   
	
	var ProjectView = editor.ToolView.extend({
		init: function() {
			this._super({
				toolName: 'Projects',
				toolTip: '',
				elemId: 'projectsCtn',
				id: 'projectLoad'
			});
			
			this.dontSave = true;
			
			// panels
			this.addPanel(new editor.ui.Panel({
				classes: ['prjSidePanel'],
				startsVisible: false
			}));
			this.addPanel(new editor.ui.Panel({
				location: editor.ui.Location.TOP,
				classes: ['prjTopPanel'],
				startsVisible: false
			}));
			
			this.sidePanel.addWidget(new LoadListWidget());
			this.topPanel.addWidget(new PreviewWidget());
		},
		
		checkSaveable: function() {
			var name = this.saveIpt.val(),
				saveable = name !== 'Unsaved Project' && name !== '';
			
			if (!saveable) {
				this.saveBtn.attr('disabled', 'disabled');
				this.publishBtn.attr('disabled', 'disabled');
			}
			else {
				this.saveBtn.removeAttr('disabled');
				this.publishBtn.removeAttr('disabled');
			}
			
			return saveable;
		},
		
		hideButtons: function() {
			this.buttons.slideUp(200);
		},
		
		layoutToolBarContainer: function() {			
			var ctn = this.toolbarContainer = jQuery('<div id="' 
				+ this.config.elemId + '"> \
					<p id="prjMsg"></p> \
					<input type="text" id="prjSaveIpt" value="Unsaved Project" /> \
					<div class="buttons"> \
						<button id="prjSaveBtn">Save</button> \
						<button id="prjCancelBtn">Cancel</button> \
						<button id="prjPreviewBtn">Preview</button> \
						<button id="prjPublishBtn">Publish</button> \
					</div> \
				</div>');			
				
			var view = this,
				saveIpt = this.saveIpt = ctn.find('#prjSaveIpt'),
				saveBtn = this.saveBtn = ctn.find('#prjSaveBtn'),
				cancelBtn = this.cancelBtn = ctn.find('#prjCancelBtn').hide(),
				loadBtn = this.loadBtn = ctn.find('#prjLoadBtn'),
				previewBtn = this.previewBtn = ctn.find('#prjPreviewBtn'),
				publishBtn = this.publishBtn = ctn.find('#prjPublishBtn'),
				buttons = this.buttons = ctn.find('div.buttons').hide(),
				curPrjCtn = this.curPrjCtn = ctn.find('#prjCur');						
			
			this.msg = ctn.find('#prjMsg').hide();
			
			cancelBtn.bind('click', function() {
				view.reset();
				view.hideButtons();
				view.sidePanel.setVisible(false);
			});
						
			previewBtn.bind('click', function(evt) {
				view.notifyListeners(event.StartPreview);
				
				// proceed to hide all panels
				var views = editor.getViews();
				view.visiblePanels = [];
				
				for (var i = 0, il = views.length; i < il; i++) {
					var pnls = views[i].panels;
					
					for (var j = 0, jl = pnls.length; j < jl; j++) {
						var pnl = pnls[j];
						
						if (pnl.isVisible()) {
							view.visiblePanels.push(pnl);
							pnl.setVisible(false, false);
						}
					}
				}
				// hide the main panel
				editor.ui.getTabBar().setVisible(false);
				
				// show the preview panel
				view.topPanel.setVisible(true);
			});
			
			publishBtn.bind('click', function() {
				view.notifyListeners(event.Publish, saveIpt.val());
			});
			
			saveBtn.bind('click', function(evt) {
				if (saveBtn.hasClass('overwrite')) {
					view.notifyListeners(event.Save, {
						project: saveIpt.val(),
						replace: true
					});
				}
				else {
					view.notifyListeners(event.CheckProjectExists, saveIpt.val());
					view.dontSave = false;
				}
			});
			
			saveIpt.bind('keydown', function(evt) {
				var val = saveIpt.val(),
					code = evt.keyCode ? evt.keyCode : evt.which;
				
				if (view.checkSaveable() && code === 13) {
					view.dontSave = false;
				}
				else if (code == 27) {
					saveIpt.val('').blur();
					view.sidePanel.setVisible(false);
				}
			})
			.bind('focus', function(evt) {				
				if (saveIpt.val() === 'Unsaved Project') {
					saveIpt.val('');
				}
				view.notifyListeners(event.UpdateProjects);
				view.showButtons();
			})
			.bind('blur', function() {	
				var val = saveIpt.val();			
				
				if (val === '') {
					view.reset();
				}
				view.checkSaveable();
			});
			
			this.checkSaveable();
		},
		
		reset: function() {
			this.saveIpt.val(this.loadedProject == null ? 'Unsaved Project' :
				this.loadedProject);
			this.msg.empty().hide();
			this.cancelBtn.hide().removeClass('overwite');
			this.saveBtn.text('Save').removeClass('overwrite');
			this.saveIpt.removeClass('overwrite');
			
			if (this.loadedProject == null) {
				this.saveBtn.attr('disabled', 'disabled');
			}
		},
		
		showButtons: function() {
			this.buttons.slideDown(200);
		},
		
		stopPreview: function() {
			for (var i = 0, il = this.visiblePanels.length; i < il; i++) {
				this.visiblePanels[i].setVisible(true, false);
			}
			
			editor.ui.getTabBar().setVisible(true);
			this.topPanel.setVisible(false);
		},
		
		updateExists: function(exists, project) {
			var view = this;
			
			if (exists) {
				this.msg.empty().html('Already exists.').show();
				this.saveIpt.addClass('overwrite');
				this.cancelBtn.show().addClass('overwrite');
				this.saveBtn.text('Overwrite').addClass('overwrite');
			}
			else {
				this.msg.hide();
				
				if (!this.dontSave) {
					this.notifyListeners(event.Save, {
						project: project,
						replace: false
					});
					
					this.dontSave = true;
				}
			}
		},
		
		updateLoaded: function(project, succeeded) {
			if (succeeded) {
				this.saveIpt.val(project).show().effect('highlight', {
					color: '#3b5e77'
				});
				this.loadedProject = project;
				this.sidePanel.setVisible(false);
				this.msg.hide();
				this.checkSaveable();
			}
			else {
				this.sidePanel.setVisible(false);
				this.saveIpt.show();
				this.msg.text('Server Down. Could not load.').show();
			}
			
			this.loadBtn.removeAttr('disabled');
		},
		
		updateProjects: function(projects) {
			var lstWgt = this.sidePanel.prjListWidget,
				view = this;
			
			lstWgt.clear();
			
			if (projects === null) {
				this.msg.empty().text('Server Down').show();
			}
			else {
				for (var i = 0, il = projects.length; i < il; i++) {
					lstWgt.add(projects[i]);
				}
				
				jQuery(document).bind('click.prj', function(e) {
					var target = jQuery(e.target), 
						parent = target.parents('.prjSidePanel, #prjPane'), 
						isTool = target.parents('.toolBtn').size() > 0 ||
							target.hasClass('toolBtn'),
						isTabPane = target.parents('#tabBar h2'),
						isDown = target.hasClass('down');
					
					if (parent.size() == 0 && target.attr('id') !== 'prjPane') {
						view.sidePanel.setVisible(false, 
							isTool ? !isDown : !isTabPane);
						view.hideButtons();
						view.saveIpt.val('').blur();
						jQuery(document).unbind('click.prj');
					}
				});
				
				this.loadBtn.attr('disabled', 'disabled');
			}
		},
		
		updateRemoved: function(project) {
			if (this.loadedProject === project) {
				this.loadedProject = null;
				this.reset();
			}
		},
		
		updateSaved: function(project, succeeded) {
			if (succeeded) {
				this.loadedProject = project;
				this.reset();
				this.hideButtons();
				this.saveIpt.effect('highlight', {
					color: '#3b5e77'
				});
			}
			else {
				this.msg.empty().text('Server Down. Could not save.').show();
			}
		},
		
		updateServerRunning: function(isRunning) {
			if (!isRunning) {
				this.msg.empty().text('Server Down.').show();
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	var ProjectController = editor.ToolController.extend({
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
				lstWgt = view.sidePanel.prjListWidget,
				prvWgt = view.topPanel.previewWidget,
				controller = this;
			
			// view specific
			view.addListener(event.CheckProjectExists, function(project) {
				model.checkExisting(project);
			});
			view.addListener(event.Publish, function(project) {
				model.publish(project);
			});
			view.addListener(event.Save, function(data) {
				model.save(data.project, data.replace);
			});
			view.addListener(event.StartPreview, function() {
				model.startPreview();
			});
			view.addListener(event.UpdateProjects, function() {
				model.getProjects();
			});
			
			// widget specific
			lstWgt.addListener(event.Load, function(project) {
				model.load(project);
			});
			lstWgt.addListener(event.Remove, function(project) {
				model.remove(project);
			});
			prvWgt.addListener(event.StopPreview, function() {
				model.stopPreview();
				view.stopPreview();
			});
			
			// model specific		
			model.addListener(event.Loaded, function(data) {
				view.updateLoaded(data.project, data.succeeded);
			});			
			model.addListener(event.ProjectExists, function(data) {
				view.updateExists(data.exists, data.project);
			});		
			model.addListener(event.Projects, function(projects) {
				view.sidePanel.setVisible(true);
				view.updateProjects(projects);
			});
			model.addListener(event.Published, function(data) {
				view.updatePublished();
			});
			model.addListener(event.Removed, function(project) {
				view.updateRemoved(project);
				lstWgt.remove(project);
			});
			model.addListener(event.Saved, function(data) {
				view.updateSaved(data.project, data.saved);
				lstWgt.add(data.project);
			});
			model.addListener(event.ServerRunning, function(isRunning) {
				view.updateServerRunning(isRunning);
			});
		}
	});
	
	jQuery(document).ready(function() {
		var prjPane = new editor.ui.TabPane('Projects'),
			prjToolBar = new editor.ui.ToolBar(),
			
			prjMdl = new ProjectModel(),
			prjView = new ProjectView(),
			prjCtr = new ProjectController();	
				
		prjCtr.setModel(prjMdl);
		prjCtr.setView(prjView);
		
		prjToolBar.add(prjView);
		prjPane.setToolBar(prjToolBar);
		editor.ui.addTabPane(prjPane, 'prjPane');
		
		// disable default behavior
		var ui = prjPane.getUI();
		
		ui.find('a').unbind('click');
		prjPane.setVisible(true);
		
		// listen to changes
		editor.addListener(editor.events.DoneLoading, function() {			
			// get the list of panels
			var views = editor.getViews(),
				panels = [];
				
			for (var i = 0, il = views.length; i < il; i++) {
				var view = views[i];
				
				if (view !== prjView) {
					panels = panels.concat(view.panels);
				}
			}
			
			prjView.sidePanel.addListener(editor.events.PanelVisible, function(data) {
				if (data.visible && data.updateMeta) {
					// save the visible state of panels
					prjView.visiblePanels = [];
					
					for (var i = 0, il = panels.length; i < il; i++) {
						var pnl = panels[i];
						
						if (pnl.isVisible()) {
							prjView.visiblePanels.push(pnl);
							// now hide them
							pnl.setVisible(false, false);
						}
					}
				}
				else if (data.updateMeta) {
					var visPnls = prjView.visiblePanels;
					
					for (var i = 0, il = visPnls.length; i < il; i++) {
						visPnls[i].setVisible(true, false);
					}
				}
			});
		});
	});
	
	return editor;
})(editor || {});
