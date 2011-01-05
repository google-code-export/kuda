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
 
 var editor = (function(module) {
	module.tools = module.tools || {};
	
	module.EventTypes = module.EventTypes || {};
	// model events
	module.EventTypes.ViewpointAdded = "viewpoints.ViewpointAdded";
	module.EventTypes.ViewpointRemoved = "viewpoints.ViewpointRemoved";
	module.EventTypes.ViewpointUpdated = "viewpoints.ViewpointUpdated";
    module.EventTypes.CameraUpdated = "viewpoints.CameraUpdated";
	
	// Viewpoint List Sidebar Widget events
	module.EventTypes.AddViewpoint = "viewpoints.AddViewpoint";
    module.EventTypes.EditViewpoint = "viewpoints.EditViewpoint";
    module.EventTypes.RemoveViewpoint = "viewpoints.RemoveViewpoint";
    module.EventTypes.MoveToViewpoint = "viewpoints.v";
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * An ViewpointsModel handles the creation and playing of animations as well
	 * as model picking for the animation tool.
	 */
	module.tools.ViewpointsModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
		},
		
	    worldCleaned: function() {
	        var viewpoints = hemi.world.getViewpoints();
	    	
	        for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
	            var vpt = viewpoints[ndx];
	            this.notifyListeners(module.EventTypes.ViewpointRemoved, vpt);
	        }
	    },
	    
	    worldLoaded: function() {
	        var viewpoints = hemi.world.getViewpoints();
	        
	        for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
	            var vpt = viewpoints[ndx];
	            this.notifyListeners(module.EventTypes.ViewpointAdded, vpt);
	        }
	    },
		
		enableMonitoring: function(enable) {
			if (enable) {
				hemi.view.addRenderListener(this);
			}
			else {
				hemi.view.removeRenderListener(this);
			}
		},
		
		onRender: function(renderEvt) {
			this.notifyListeners(module.EventTypes.CameraUpdated);
		},
		
		addViewpoint: function(name) {
			var viewpoint = hemi.view.createViewpoint(name, hemi.world.camera);
			this.notifyListeners(module.EventTypes.ViewpointAdded, viewpoint);
		},
		
		updateViewpoint: function(viewpoint, name) {
			var camera = hemi.world.camera,			
				up = [camera.up[0], camera.up[1], camera.up[2]],
				eye = [camera.eye[0], camera.eye[1], camera.eye[2]],
				target = [camera.target[0], camera.target[1], camera.target[2]];
			
			viewpoint.name = name;
			viewpoint.eye = eye;
			viewpoint.target = target;
			viewpoint.up = up;
			
			this.notifyListeners(module.EventTypes.ViewpointUpdated, viewpoint);
		},
		
		removeViewpoint: function(viewpoint) {
			this.notifyListeners(module.EventTypes.ViewpointRemoved, viewpoint);
			viewpoint.cleanup();
		},
		
		moveToViewpoint: function(viewpoint) {
			hemi.world.camera.moveToView(viewpoint);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 Viewpoint List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////     
	
	var ADD_TXT = "Add",
		SAVE_TXT = "Save";
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.VptListSBWidgetDefaults = {
		name: 'viewpointListSBWidget',
		listId: 'viewpointList',
		prefix: 'vptLst',
		title: 'Camera Viewpoints',
		instructions: "Move the camera to a desired position, give the position a name, and then click 'Add' to add the viewpoint."
	};
	
	module.tools.VptListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.VptListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.form = jQuery('<form method="post"></form>');
			this.nameInput = jQuery('<input type="text" id="vpName" />');
			this.addBtn = jQuery('<button id="vpAdd">Add</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
				var btn = jQuery(this),
					name = wgt.nameInput.val(),
					isEditing = btn.data('isEditing'),
					msgType = isEditing ? module.EventTypes.EditViewpoint 
						: module.EventTypes.AddViewpoint,
					data = isEditing ? {
						viewpoint: btn.data('viewpoint'),
						name: name
					} : name;
					
				wgt.notifyListeners(msgType, data);
				wgt.nameInput.val('');
				wgt.addBtn.attr('disabled', 'disabled').data('isEditing', false)
					.text(ADD_TXT);
			})
			.attr('disabled', 'disabled');
			
			this.form.append(this.nameInput).append(this.addBtn)
			.bind('submit', function(evt) {
				return false;
			});
			
			var nameInputFcn = function(evt) {
				var elem = jQuery(this);
				if (elem.val().length > 0) {
					wgt.addBtn.removeAttr('disabled');
				}
			};
			
			this.nameInput.bind('keypress', nameInputFcn)
				.bind('change', nameInputFcn);
			
			return this.form;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
				
			li.title.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.MoveToViewpoint, vpt);
			});
			
			li.editBtn.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				
				wgt.nameInput.val(vpt.name);
				wgt.notifyListeners(module.EventTypes.MoveToViewpoint, vpt);
				wgt.addBtn.text(SAVE_TXT).data('isEditing', true)
					.data('viewpoint', vpt).removeAttr('disabled');
			});
			
			li.removeBtn.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveViewpoint, vpt);
			});
		},
		
		getOtherHeights: function() {
			return this.form.outerHeight(true);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    
	
	/*
	 * Configuration object for the ViewpointsView.
	 */
	module.tools.ViewpointsViewDefaults = {
		axnBarId: 'vptActionBar',
		toolName: 'Viewpoints',
        toolTip: 'Camera Viewpoints: Create and edit camera viewpoints',
		widgetId: 'viewpointsBtn'
	};
	
	/**
	 * The ViewpointsView controls the dialog and toolbar widget for the
	 * animation tool.
	 *
	 * @param {Object} options configuration options.  Uses
	 *         editor.tools.ViewpointsViewDefaults as default options
	 */
	module.tools.ViewpointsView = module.tools.ToolView.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.ViewpointsViewDefaults, options);
			this._super(newOpts);
			this.pre = 'vp_';
			
			this.addSidebarWidget(new module.tools.VptListSBWidget());
		},
		
		layoutActionBar: function() {
			var widget = new module.ui.ActionBarWidget({
				uiFile: 'editor/tools/html/viewpointsAxnBar.htm'
			});
			var view = this;
			
			widget.finishLayout = function() {
				view.actionBar.addWidget(widget);
			};
		},
		
		updateCameraInfo: function() {
			var eyeX = this.actionBar.find('#vptEyeX'),
	        	eyeY = this.actionBar.find('#vptEyeY'),
	        	eyeZ = this.actionBar.find('#vptEyeZ'),
	        	targetX = this.actionBar.find('#vptTgtX'),
	        	targetY = this.actionBar.find('#vptTgtY'),
	        	targetZ = this.actionBar.find('#vptTgtZ'),
	        	distance = this.actionBar.find('#vptDis'),
				target = hemi.world.camera.getTarget(),
				eye = hemi.world.camera.getEye();
			
			eyeX.text(module.utils.roundNumber(eye[0], 4));
	        eyeY.text(module.utils.roundNumber(eye[1], 4));
	        eyeZ.text(module.utils.roundNumber(eye[2], 4));
			
	        targetX.text(module.utils.roundNumber(target[0], 4));
	        targetY.text(module.utils.roundNumber(target[1], 4));
	        targetZ.text(module.utils.roundNumber(target[2], 4));
			
	        distance.text(module.utils.roundNumber(hemi.world.camera.distance, 4));
		}
	});
		
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * The ViewpointsController facilitates ViewpointsModel and ViewpointsView
	 * communication by binding event and message handlers.
	 */
	module.tools.ViewpointsController = module.tools.ToolController.extend({
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
				ctr = this,
				vptLstWgt = view.viewpointListSBWidget;
			
			// special listener for when the toolbar button is clicked
			view.addListener(module.EventTypes.ToolModeSet, function(value) {
				var isDown = value == module.tools.ToolConstants.MODE_DOWN;
				model.enableMonitoring(isDown);
			});
			
			// viewpoint list widget specific
			vptLstWgt.addListener(module.EventTypes.AddViewpoint, function(name) {
				model.addViewpoint(name);
			});
			vptLstWgt.addListener(module.EventTypes.RemoveViewpoint, function(vpt) {
				model.removeViewpoint(vpt);
			});
			vptLstWgt.addListener(module.EventTypes.EditViewpoint, function(data) {
				model.updateViewpoint(data.viewpoint, data.name);
			});
			vptLstWgt.addListener(module.EventTypes.MoveToViewpoint, function(vpt) {
				model.moveToViewpoint(vpt);
			});
			
			// model specific
			model.addListener(module.EventTypes.ViewpointAdded, function(vpt) {
				vptLstWgt.add(vpt);
			});
			model.addListener(module.EventTypes.ViewpointUpdated, function(vpt) {
				vptLstWgt.update(vpt);
			});			
			model.addListener(module.EventTypes.ViewpointRemoved, function(vpt) {
				vptLstWgt.remove(vpt);
			});			
			model.addListener(module.EventTypes.CameraUpdated, function(value) {
				view.updateCameraInfo(value);
			});
		}
	});
	
	return module;
})(editor || {});
