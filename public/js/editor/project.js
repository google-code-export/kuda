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
	
	var shorthand = editor.projects = {},
		prjMdl = null;
	
	shorthand.init = function() {
		var prjPane = new editor.ui.NavPane('Project:'),
			prjToolBar = new editor.ui.ToolBar(),
			
			prjView = new ProjectView(),
			prjCtr = new ProjectController();	

		prjMdl = new ProjectModel();	
		prjCtr.setModel(prjMdl);
		prjCtr.setView(prjView);
		
		prjToolBar.add(prjView);
		prjPane.setToolBar(prjToolBar);
		editor.ui.addNavPane(prjPane, 'prjPane');
		
		// disable default behavior
		var ui = prjPane.getUI();
		
		ui.find('a').unbind('click').bind('click', function() {
			var down = prjView.buttons.is(':visible');
			if (down) {
				prjView.cancel();
			}
			else {
				prjView.notifyListeners(shorthand.events.UpdateProjects);
				prjView.showButtons();
			}
		});
		prjPane.setVisible(true);
		
		prjView.sidePanel.addListener(editor.events.PanelVisible, function(data) {
			var pane = editor.ui.getNavBar().visiblePane;
			
			if (pane && !prjView.isPreview) {
				pane.setVisible(!data.visible);
			}
		});
		
		// Setup autosave
		var models = editor.getModels();
		
		for (var i = 0, il = models.length; i < il; ++i) {
			var model = models[i];
			
			if (model !== prjMdl) {
				model.addListener(editor.events.Created, prjMdl);
				model.addListener(editor.events.Removing, prjMdl);
				model.addListener(editor.events.Updated, prjMdl);
			}
		}
		
		editor.addListener(editor.events.PluginLoaded, function(name) {
			var model = editor.getModel(name);
			
			if (model) {
				model.addListener(editor.events.Created, prjMdl);
				model.addListener(editor.events.Removing, prjMdl);
				model.addListener(editor.events.Updated, prjMdl);
			}
		});
		
		var autoId = setInterval(function() {
			if (prjMdl.dirty && !prjMdl.loading) {
				prjMdl.save(AUTO_SAVE, true);
				prjMdl.dirty = false;
			}
		}, 5000);
		
		jQuery(document).unload(function() {
			clearInterval(autoId);
		});
	};
	
////////////////////////////////////////////////////////////////////////////////
//								Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	// TODO: change to the autosave format like in google docs
	
	shorthand.events = {
		CheckProjectExists: 'checkProjectExists',
		Load: 'load',
		Loaded: 'loaded',
		NewProject: 'newProject',
		Projects: 'projects',
		ProjectExists: 'projectExsits',
		Publish: 'publish',
		Published: 'published',
		Save: 'save',
		Saved: 'saved',
		ServerRunning: 'serverRunning',
		StartPreview: 'startPreview',
		StopPreview: 'stopPreview',
		UpdateProjects: 'updateProjects'
	};
	
	var AUTO_SAVE = '_AutoSave_';
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	
	var ProjectModel = function() {
		editor.ToolModel.call('projectLoad');
		
		var mdl = this;
		
		this.projectCache = [];
		this.serverRunning = true;
		this.dirty = false;
		this.loading = false;
		this.current = null;
					
		jQuery.ajax({
			url: '/projects',
			dataType: 'json',
			success: function(data, status, xhr) {
				mdl.projectCache = data.projects;
			},
			error: function(xhr, status, err) {			
				mdl.serverRunning = false;
				mdl.notifyListeners(shorthand.events.ServerRunning, false);
			}
		});
	};
	var mdlSuper = editor.ToolModel.prototype;

	ProjectModel.prototype = new editor.ToolModel();
	ProjectModel.prototype.constructor = ProjectModel;
		
	ProjectModel.prototype.checkExisting = function(project) {			
		this.notifyListeners(shorthand.events.ProjectExists, {
			exists: findProject.call(this, project) !== -1,
			project: project
		});
	};
	
	ProjectModel.prototype.getProjects = function() {
		this.notifyListeners(shorthand.events.Projects, this.serverRunning ? 
			this.projectCache : null);
	};
	
	ProjectModel.prototype.load = function(project) {
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
				mdl.loading = true;
				hemi.world.send(hemi.msg.cleanup);
				dispatchProxy.swap();
				hemi.octane.createWorld(data);
				dispatchProxy.unswap();
				hemi.world.ready();
				
				mdl.notifyListeners(shorthand.events.Loaded, {
					project: project,
					succeeded: true
				});
			},
			error: function(xhr, status, err){
				mdl.notifyListeners(shorthand.events.Loaded, {
					project: project,
					succeeded: false
				});
			}
		});
	};
	
	ProjectModel.prototype.newProject = function() {
		hemi.world.cleanup();
		hemi.world.camera.enableControl();
		hemi.world.ready();
	
		var vd = hemi.view.createViewData(hemi.world.camera);
		vd.eye = [0, 10, 40];
		vd.target = [0, 0, 0];
        hemi.world.camera.moveToView(vd, 0);
		
		this.notifyListeners(shorthand.events.NewProject);			
	};
	
	ProjectModel.prototype.notify = function(eventType, value) {
		mdlSuper.notify.call(eventType, value);
		
		switch (eventType) {
			case editor.events.Created:
			case editor.events.Removing:
			case editor.events.Updated: 
				this.dirty = true;
				break;
		}
	};
	
	ProjectModel.prototype.publish = function(project) {
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
				var ndx = findProject.call(mdl, project);
				mdl.projectCache[ndx].published = true;
				mdl.notifyListeners(shorthand.events.Published, {
					name: project,
					published: true
				});
			},
			error: function(xhr, status, err) {
				mdl.notifyListeners(shorthand.events.Published, {
					name: project,
					published: false
				});
			}
		});
		
	};
	
	ProjectModel.prototype.remove = function(project) {								
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
				mdl.notifyListeners(editor.events.Removing, data.name);
				
				var ndx = findProject.call(mdl, project);
				
				if (ndx !== -1) {
					mdl.projectCache.splice(ndx, 1);
				}
			},
			error: function(xhr, status, err) {
				mdl.serverRunning = false;
			}
		});
	};
	
	ProjectModel.prototype.save = function(project, replace) {
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
				mdl.notifyListeners(shorthand.events.Saved, {
					project: project,
					saved: true
				});
				mdl.projectCache.push({
					name: project,
					published: false
				});
			},
			error: function(xhr, status, err) {
				mdl.serverRunning = false;
				mdl.notifyListeners(shorthand.events.Saved, {
					project: project,
					saved: false
				});
			}
		});
	};
	
	ProjectModel.prototype.startPreview = function() {
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
	};
	
	ProjectModel.prototype.stopPreview = function() {
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
	};
	
	var findProject = function(project) {
		var ndx = -1,
			plc = project.toLowerCase();
		
		for (var i = 0, il = this.projectCache.length; i < il && ndx === -1; i++) {
			if (this.projectCache[i].name.toLowerCase() === plc) {
				ndx = i;
			}
		}
		
		return ndx;
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              Loading Widget                                //
////////////////////////////////////////////////////////////////////////////////
	
	var ListItem = function() {
		editor.ui.EditableListItem.call(this, {
			editable: false
		});
		
		this.versionsHash = new Hashtable();
	};
	var liSuper = editor.ui.EditableListItem.prototype;

	ListItem.prototype = new editor.ui.EditableListItem();
	ListItem.prototype.constructor = ListItem;
		
	ListItem.prototype.add = function(project, version) {
		var li = new editor.ui.EditableListItem({
				editable: false,
				removeable: false
			});
		
		li.setText(version);
		li.attachObject(version);
		
		this.bindButtons(li);
		this.list.add(li);
		this.versionsHash.put(version, li);
	};
	
	ListItem.prototype.layout = function() {
		liSuper.layout.call(this);
		
		// attach the sub lists
		var loadHeader = jQuery('<h2>Versions:</h2>'),
			prjList = jQuery('<div class="prjListWrapper"></div>'),
			arrow = jQuery('<div class="prjListArrow"></div>'),
			wgt = this;
		
		this.list = new editor.ui.List({
			cssClass: 'prjLst',
			prefix: 'prjLst'
		});
		
		// publish link
		this.publishLink = jQuery('<a class="publish" href="" target="_blank">View Published</a>');
		
		prjList.append(loadHeader).append(this.list.getUI())
			.hide();
		arrow.hide();
		this.container.append(arrow).append(prjList);
		
		this.removeBtn.before(this.publishLink.hide());
		
		this.title.bind('click', function() {
			wgt.notifyListeners(shorthand.events.Load, wgt.getText());
		});
	};
	
	ListItem.prototype.remove = function(version) {
		var li = this.versionsHash.remove(version);			
		this.list.remove(li);
	};

	var LoadListWidget = function(options) {
	    editor.ui.ListWidget.call(this, {
			name: 'prjListWidget',
			listId: 'projectList',
			prefix: 'prjLst',
			title: 'Projects',
			instructions: "Click on a project to load it. Click the 'x' to delete.",
			height: editor.ui.Height.FULL
		});
			
		this.container.addClass('widgetWithForms');
	};

	LoadListWidget.prototype = new editor.ui.ListWidget();
	LoadListWidget.prototype.constructor = ProjectModel;
		    
    LoadListWidget.prototype.add = function(project) {			
		var li = this.items.get(project.name);
		
		if (!li) {
			li = this.createListItem();
			li.setText(project.name);
			
			this.bindButtons(li, project);
			this.list.add(li);
			this.items.put(project.name, li);
		}
		
		return li;
    };
	
	LoadListWidget.prototype.bindButtons = function(li, project) {
		var wgt = this;
		
		if (project.published) {
			li.publishLink.attr('href', '/projects/' + project.name 
				+ '.html').show();
		}
		li.removeBtn.bind('click', function(evt) {
			wgt.notifyListeners(editor.events.Remove, project.name);
		});
	};
	
	LoadListWidget.prototype.createListItem = function() {
		var li = new ListItem(),
			wgt = this;
		
		// relay messages
		li.addListener(shorthand.events.Load, function(project) {
			wgt.notifyListeners(shorthand.events.Load, project);
		});
		
		return li;
	};
    
    LoadListWidget.prototype.remove = function(projectName) {
		var li = this.items.get(projectName),
			retVal = false;
		
		if (li) {
			this.list.remove(li);
			this.items.remove(projectName);
			retVal = true;
		}
		
		return retVal;
    };
	
	LoadListWidget.prototype.update = function(project) {
		var li = this.items.get(project.name),
			retVal = false;
		
		if (li) {
			if (project.published) {
				li.publishLink.attr('href', '/projects/' + project.name 
					+ '.html').show();
			}
			retVal = true;
		}
		
		return retVal;
	};
	
////////////////////////////////////////////////////////////////////////////////
//                              Preview Widget                                //
////////////////////////////////////////////////////////////////////////////////
	
	var PreviewWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'previewWidget',
			classes: ['previewWidget'],
			height: editor.ui.Height.MANUAL
		});
	};
	var prvSuper = editor.ui.Widget.prototype;

	PreviewWidget.prototype = new editor.ui.Widget();
	PreviewWidget.prototype.constructor = PreviewWidget;
		
	PreviewWidget.prototype.layout = function() {
		prvSuper.layout.call(this);
		var wgt = this,
			title = jQuery('<h1>World<span>Editor</span></h1>'),
			subTitle = jQuery('<h2>Preview Mode</h2>'),
			titleCtn = jQuery('<div></div>');
		
		this.stopBtn = jQuery('<button id="prjStopPreviewBtn">Stop Preview</button>');
		
		this.stopBtn.bind('click', function() {
			wgt.notifyListeners(shorthand.events.StopPreview);
		});
		
		titleCtn.append(title).append(subTitle);
		this.container.append(titleCtn).append(this.stopBtn);
	};
		
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////   
	
	var ProjectView = function() {
		editor.ToolView.call(this, {
			toolName: 'Project:',
			toolTip: '',
			id: 'projectLoad'
		});
		
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
	};

	ProjectView.prototype = new editor.ToolView();
	ProjectView.prototype.constructor = ProjectView;
		
	ProjectView.prototype.cancel = function() {
		this.hideButtons();
		this.sidePanel.setVisible(false);
		this.saveIpt.val('').show().blur();
		jQuery(document).unbind('click.prj');
	};
	
	ProjectView.prototype.checkSaveable = function() {
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
	};
	
	ProjectView.prototype.hideButtons = function() {
		this.buttons.slideUp(200);
	};
	
	ProjectView.prototype.layoutToolBarContainer = function() {			
		var ctn = this.toolbarContainer = jQuery('<div id="' 
			+ this.id + '"> \
				<p id="prjMsg"></p> \
				<input type="text" id="prjSaveIpt" value="Unsaved Project" /> \
				<div class="buttons"> \
					<button id="prjSaveBtn">Save</button> \
					<button id="prjCancelBtn">Cancel</button> \
					<button id="prjPreviewBtn">Preview</button> \
					<button id="prjPublishBtn">Publish</button> \
					<button id="prjNewBtn">New Project</button> \
				</div> \
			</div>');			
			
		var view = this,
			saveIpt = this.saveIpt = ctn.find('#prjSaveIpt'),
			saveBtn = this.saveBtn = ctn.find('#prjSaveBtn'),
			cancelBtn = this.cancelBtn = ctn.find('#prjCancelBtn').hide(),
			newBtn = this.newBtn = ctn.find('#prjNewBtn'),
			previewBtn = this.previewBtn = ctn.find('#prjPreviewBtn'),
			publishBtn = this.publishBtn = ctn.find('#prjPublishBtn');						
		
		this.buttons = ctn.find('div.buttons').hide();
		this.msg = ctn.find('#prjMsg').hide();
		
		cancelBtn.bind('click', function() {
			view.cancel();
		});
		
		newBtn.bind('click', function() {
			view.notifyListeners(shorthand.events.NewProject);
		});
		
		previewBtn.bind('click', function(evt) {
			view.isPreview = true;
			view.notifyListeners(shorthand.events.StartPreview);
			
			// hide the main panel
			editor.ui.getNavBar().setVisible(false);
			view.sidePanel.setVisible(false);
			
			// show the preview panel
			view.topPanel.setVisible(true);
		});
		
		publishBtn.bind('click', function() {
			view.notifyListeners(shorthand.events.Publish, saveIpt.val());
		});
		
		saveBtn.bind('click', function(evt) {
			if (saveBtn.hasClass('overwrite')) {
				view.notifyListeners(shorthand.events.Save, {
					project: saveIpt.val(),
					replace: true
				});
			}
			else {
				view.notifyListeners(shorthand.events.CheckProjectExists, saveIpt.val());
			}
		});
		
		saveIpt.bind('keyup', function(evt) {
			var code = evt.keyCode ? evt.keyCode : evt.which;
			
			if (code == 27) {
				view.cancel();
			}
			
			view.checkSaveable();
		})
		.bind('focus', function(evt) {				
			if (saveIpt.val() === 'Unsaved Project') {
				saveIpt.val('');
			}
			view.notifyListeners(shorthand.events.UpdateProjects);
			view.showButtons();
		})
		.bind('blur', function() {	
			if (saveIpt.is(':visible')) {
				var val = saveIpt.val();			
				
				if (val === '') {
					view.reset();
				}
			}
		});
		
		this.checkSaveable();
	};
	
	ProjectView.prototype.reset = function() {
		this.saveIpt.val(this.loadedProject == null ? 'Unsaved Project' :
			this.loadedProject);
		this.msg.empty().hide();
		this.cancelBtn.hide().removeClass('overwite');
		this.saveBtn.text('Save').removeClass('overwrite');
		this.saveIpt.removeClass('overwrite').show();
		this.checkSaveable();
	};
	
	ProjectView.prototype.showButtons = function() {
		this.buttons.slideDown(200);
	};
	
	ProjectView.prototype.stopPreview = function() {
		var view = this;
		
		// essentially queueing this
		setTimeout(function() {
			view.isPreview = false;
		}, 0);
		
		editor.ui.getNavBar().setVisible(true);
		this.sidePanel.setVisible(true);
		this.topPanel.setVisible(false);
	};
	
	ProjectView.prototype.updateExists = function(exists, project) {
		if (exists) {
			this.msg.empty().html('Already exists.').show();
			this.saveIpt.addClass('overwrite');
			this.cancelBtn.show().addClass('overwrite');
			this.saveBtn.text('Overwrite').addClass('overwrite');
		}
		else {
			this.msg.hide();
			this.notifyListeners(shorthand.events.Save, {
				project: project,
				replace: false
			});
		}
	};
	
	ProjectView.prototype.updateLoaded = function(project, succeeded) {
		if (succeeded) {
			if (project === AUTO_SAVE) {
				project = 'Restored Project';
			}
			
			this.loadedProject = project;
			this.reset();
			this.saveIpt.show().effect('highlight', {
				color: '#3b5e77'
			});
		}
		else {
			this.saveIpt.show();
			this.msg.text('Server Down. Could not load.').show();
		}

		this.sidePanel.setVisible(false);
		this.hideButtons();
	};
	
	ProjectView.prototype.updateNewProject = function() {
		this.loadedProject = null;
		this.reset();
		this.sidePanel.setVisible(false);
		this.hideButtons();
	};
	
	ProjectView.prototype.updateProjects = function(projects) {
		var lstWgt = this.sidePanel.prjListWidget,
			view = this;
		
		lstWgt.clear();
		
		if (projects === null) {
			this.msg.empty().text('Server Down').show();
			this.saveIpt.hide();
		}
		else {
			for (var i = 0, il = projects.length; i < il; i++) {
				lstWgt.add(projects[i]);
			}
		}
			
		jQuery(document).bind('click.prj', function(e) {
			var target = jQuery(e.target), 
				parent = target.parents('.prjSidePanel, #prjPane');
			
			if (parent.size() == 0 && target.attr('id') !== 'prjPane' 
					&& !view.isPreview) {
				view.cancel();
			}
		});
	};
	
	ProjectView.prototype.updatePublished = function(data) {
		var lstWgt = this.sidePanel.prjListWidget;
			
		lstWgt.update(data);
	};
	
	ProjectView.prototype.updateRemoved = function(project) {
		if (this.loadedProject === project) {
			this.loadedProject = null;
			this.reset();
		}
	};
	
	ProjectView.prototype.updateSaved = function(project, succeeded) {
		if (!succeeded) {
			this.msg.empty().text('Server Down. Could not save.').show();
		}
		else if (project !== AUTO_SAVE) {
			this.loadedProject = project;
			this.cancel();
			this.saveIpt.effect('highlight', {
				color: '#3b5e77'
			});
		}
	};
	
	ProjectView.prototype.updateServerRunning = function(isRunning) {
		if (!isRunning) {
			this.msg.empty().text('Server Down.').show();
		}
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	var ProjectController = function() {
		editor.ToolController.call(this);
	};
	var ctrSuper = editor.ToolController.prototype;

	ProjectController.prototype = new editor.ToolController();
	ProjectController.prototype.constructor = ProjectController;
    
	/**
     * Binds event and message handlers to the view and model this object 
     * references.  
     */        
	ProjectController.prototype.bindEvents = function() {
		ctrSuper.bindEvents.call(this);
		
		var model = this.model,
			view = this.view,
			lstWgt = view.sidePanel.prjListWidget,
			prvWgt = view.topPanel.previewWidget;
		
		// view specific
		view.addListener(shorthand.events.CheckProjectExists, function(project) {
			model.checkExisting(project);
		});
		view.addListener(shorthand.events.NewProject, function() {
			model.newProject();
		});
		view.addListener(shorthand.events.Publish, function(project) {
			model.publish(project);
		});
		view.addListener(shorthand.events.Save, function(data) {
			model.save(data.project, data.replace);
		});
		view.addListener(shorthand.events.StartPreview, function() {
			model.startPreview();
		});
		view.addListener(shorthand.events.UpdateProjects, function() {
			model.getProjects();
		});
		
		// widget specific
		lstWgt.addListener(shorthand.events.Load, function(project) {
			model.load(project);
		});
		lstWgt.addListener(editor.events.Remove, function(project) {
			model.remove(project);
		});
		prvWgt.addListener(shorthand.events.StopPreview, function() {
			model.stopPreview();
			view.stopPreview();
		});
		
		// model specific		
		model.addListener(shorthand.events.Loaded, function(data) {
			view.updateLoaded(data.project, data.succeeded);
		});		
		model.addListener(shorthand.events.NewProject, function() {
			view.updateNewProject();
		});
		model.addListener(shorthand.events.ProjectExists, function(data) {
			view.updateExists(data.exists, data.project);
		});		
		model.addListener(shorthand.events.Projects, function(projects) {
			view.sidePanel.setVisible(true);
			view.updateProjects(projects);
		});
		model.addListener(shorthand.events.Published, function(data) {
			view.updatePublished(data);
		});
		model.addListener(editor.events.Removing, function(project) {
			view.updateRemoved(project);
			lstWgt.remove(project);
		});
		model.addListener(shorthand.events.Saved, function(data) {
			view.updateSaved(data.project, data.saved);
			lstWgt.add({
				name: data.project,
				published: false
			});
		});
		model.addListener(shorthand.events.ServerRunning, function(isRunning) {
			view.updateServerRunning(isRunning);
		});
	};
	
	shorthand.loadingDone = function() {
		prjMdl.dirty = false;
		prjMdl.loading = false;
	};
	
})(editor);