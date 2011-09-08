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
		Save: 'save',
		Saved: 'saved',
		ServerRunning: 'serverRunning',
		UpdateProjects: 'updateProjects'
	}
	
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
		
		checkExisting: function(name) {
			this.notifyListeners(event.ProjectExists, {
				exists: this.projectCache.indexOf(name) != -1,
				project: name
			});
		},
		
		getProjects: function() {
			this.notifyListeners(event.Projects, this.serverRunning ? 
				this.projectCache : null);
		},
		
		load: function(name) {
			var data = {
					name: name
				},
				dispatchProxy = editor.getDispatchProxy(),
				mdl = this;
			
			jQuery.ajax({
				url: '/project',
				data: data,
				dataType: 'json',
				success: function(data, status, xhr){
					dispatchProxy.swap();
					hemi.octane.createWorld(data);
					dispatchProxy.swap();
					hemi.world.ready();
					
					mdl.notifyListeners(event.Loaded, {
						project: name,
						succeeded: true
					});
				},
				error: function(xhr, status, err){
					mdl.notifyListeners(event.Loaded, {
						project: name,
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
		
		remove: function(name) {
			// TODO: implement this
		},
		
		save: function(name, replace) {
			replace = replace || false;
								
			var data = {
					name: name,
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
						project: name,
						saved: true
					});
					mdl.projectCache.push(name);
				},
				error: function(xhr, status, err) {
					mdl.serverRunning = false;
					mdl.notifyListeners(event.Saved, {
						project: name,
						saved: false
					});					
				}
			});
		}
	});
	
	var ProjectView = editor.ToolView.extend({
		init: function() {
			this._super({
				toolName: 'Projects',
				toolTip: '',
				elemId: 'projectsCtn',
				id: 'projectLoad'
			});
		},
		
		layoutToolbarContainer: function() {			
			var ctn = this.toolbarContainer = jQuery('<div id="' 
				+ this.config.elemId + '"> \
					<p id="prjMsg"></p> \
					<p id="prjCur"><input type="text" id="prjSaveIpt" value="Unsaved Project" /></p> \
					<select id="prjLoadSel"></select> \
					<div class="buttons"> \
						<button id="prjSaveBtn">Save</button> \
						<button id="prjLoadBtn">Load</button> \
						<button id="prjPreviewBtn">Preview</button> \
					</div> \
				</div>');			
				
			var view = this,
				saveIpt = this.saveIpt = ctn.find('#prjSaveIpt'),
				loadSel = this.loadSel = ctn.find('#prjLoadSel').hide(),
				saveBtn = this.saveBtn = ctn.find('#prjSaveBtn'),
				loadBtn = this.loadBtn = ctn.find('#prjLoadBtn'),
				curPrjCtn = this.curPrjCtn = ctn.find('#prjCur');						
			
			this.msg = ctn.find('#prjMsg').hide();
			
			loadBtn.bind('click', function(evt) {
				view.notifyListeners(event.UpdateProjects);
				loadSel.show();
				saveIpt.hide();
			});
			
			loadSel.bind('change', function() {
				view.notifyListeners(event.Load, loadSel.val());
			});
			
			saveBtn.bind('click', function(evt) {
				view.notifyListeners(event.CheckProjectExists, saveIpt.val());
			});
			
			saveIpt.bind('keydown', function(evt) {
				var val = saveIpt.val(),
					code = evt.keyCode ? evt.keyCode : evt.which;
				
				if (code === 13) {
					view.notifyListeners(event.CheckProjectExists, val);
				}
			});
		},
		
		updateExists: function(exists, name) {
			var view = this;
			
			if (exists) {
				this.msg.empty().html('Already exists. <a class="ovr" href="#">Overwrite?</a>').show();
				
				this.msg.find('a').bind('click', function(evt) {
					view.notifyListeners(event.Save, {
						project: view.saveIpt.val(),
						replace: true
					});
				});
			}
			else {
				this.msg.hide();
				this.notifyListeners(event.Save, {
					project: name,
					replace: false
				});
			}
		},
		
		updateLoaded: function(name, succeeded) {
			if (succeeded) {
				this.saveIpt.val(name).show().effect('highlight', {
					color: '#777'
				});
				this.loadSel.hide();
				this.msg.hide();
			}
			else {
				this.loadSel.hide();
				this.saveIpt.show();
				this.msg.text('Server Down. Could not load.').show();
			}
		},
		
		updateProjects: function(projects) {
			this.loadSel.empty();
			
			if (projects === null) {
				this.loadSel.hide();
				this.msg.empty().text('Server Down').show();
			}
			if (projects.length == 0) {
				this.loadSel.append('<option val="-1">No Projects to Load</option>');
			}
			else {
				for (var ndx = 0, len = projects.length; ndx < len; ndx++) {
					var prj = jQuery('<option>' + projects[ndx] + '</option>');
					this.loadSel.append(prj);
				}
			}	
		},
		
		updateSaved: function(name, succeeded) {
			if (succeeded) {
				this.saveIpt.val(name).effect('highlight', {
					color: '#777'
				});
				this.msg.hide();
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
				controller = this;
			
			// view specific
			view.addListener(event.CheckProjectExists, function(name) {
				model.checkExisting(name);
			});
			view.addListener(event.Load, function(name) {
				if (name != '-1') {
					model.load(name);
				}
			});
			view.addListener(event.Save, function(data) {
				model.save(data.project, data.replace);
			});
			view.addListener(event.UpdateProjects, function() {
				model.getProjects();
			});
			
			// model specific		
			model.addListener(event.Loaded, function(data) {
				view.updateLoaded(data.project, data.succeeded);
			});			
			model.addListener(event.ProjectExists, function(data) {
				view.updateExists(data.exists, data.project);
			});		
			model.addListener(event.Projects, function(projects) {
				view.updateProjects(projects);
			});
			model.addListener(event.Saved, function(data) {
				view.updateSaved(data.project, data.saved);
			});
			model.addListener(event.ServerRunning, function(isRunning) {
				view.updateServerRunning(isRunning);
			});
		}
	});
	
	var prjPane = editor.ui.getTabPane('Projects'),
		
		prjMdl = new ProjectModel(),
		prjView = new ProjectView(),
		prjCtr = new ProjectController();	
			
	prjCtr.setModel(prjMdl);
	prjCtr.setView(prjView);
	
	prjPane.toolbar.add(prjView);
	
	// disable default behavior
	var ui = prjPane.getUI();
	
	ui.find('a').unbind('click');
	ui.attr('id', 'prjPane');
	prjPane.setVisible(true);
	
	// listen to changes
	editor.addListener(editor.events.DoneLoading, function() {
		var models = editor.getModels();
		
		for (var i = 0, il = models.length; i < il; i++) {
			var mdl = models[i];
			
			mdl.addListener(editor.events.Created, prjMdl);			
			mdl.addListener(editor.events.Removed, prjMdl);			
			mdl.addListener(editor.events.Updated, prjMdl);
		}
	});
	
	return editor;
})(editor || {});
