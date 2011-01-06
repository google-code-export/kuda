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
	
	// Create Viewpoint Sidebar Widget events
	module.EventTypes.SaveViewpoint = "viewpoints.SaveViewpoint";
	module.EventTypes.CancelViewpointEdit = "viewpoints.CancelViewpointEdit";
	module.EventTypes.PreviewViewpoint = "viewpoints.PreviewViewpoint";
	
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
		
		cancelViewpointEdit: function() {
			if (this.origCamPosition) {
				this.moveToViewpoint(this.origCamPosition);
			}
			
			this.origCamPosition = null;
			this.currentVp = null;
		},
		
		createViewpoint: function(params) {
			var viewpoint;
			
			viewpoint = this.currentVp ? this.currentVp 
				: new hemi.view.Viewpoint();
				
			viewpoint.eye = params.eye;
			viewpoint.target = params.target;
			viewpoint.fov = params.fov;
			viewpoint.np = params.np;
			viewpoint.fp = params.fp;
			viewpoint.up = hemi.world.camera.up;
			viewpoint.name = params.name || '';
			
			return viewpoint;
		},
		
		editViewpoint: function(viewpoint) {
			this.currentVp = viewpoint;			
		},
		
		enableMonitoring: function(enable) {
			if (enable) {
				hemi.view.addRenderListener(this);
			}
			else {
				hemi.view.removeRenderListener(this);
			}
		},
		
		moveToViewpoint: function(viewpoint) {
			hemi.world.camera.moveToView(viewpoint);
		},
		
		onRender: function(renderEvt) {
			this.notifyListeners(module.EventTypes.CameraUpdated);
		},
		
		previewViewpoint: function(params) {
			if (this.origCamPosition == null) {
				this.origCamPosition = hemi.view.createViewpoint(params.name, hemi.world.camera);
			}
			var viewpoint = this.createViewpoint(params);
			
			this.moveToViewpoint(viewpoint);
		},
		
		removeViewpoint: function(viewpoint) {
			this.notifyListeners(module.EventTypes.ViewpointRemoved, viewpoint);
			viewpoint.cleanup();
		},
		
		saveViewpoint: function(params) {
			var viewpoint = this.createViewpoint(params),
				msgType = this.currentVp ? module.EventTypes.ViewpointUpdated
					: module.EventTypes.ViewpointAdded;
				
			this.notifyListeners(msgType, viewpoint);
			
			if (this.origCamPosition) {
				this.moveToViewpoint(this.origCamPosition);
			}
			
			this.currentVp = null;
			this.origCamPosition = null;
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
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      Create Viewpoint Sidebar Widget                       //
////////////////////////////////////////////////////////////////////////////////  
 
	/*
	 * Configuration object for the CreateVptSBWidget.
	 */
	module.tools.CreateVptSBWidgetDefaults = {
		name: 'createVptSBWidget',
		uiFile: 'editor/tools/html/viewpointsForms.htm',
		manualVisible: true
	};
	
	module.tools.CreateVptSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateVptSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		checkToggleButtons: function() {
			var np = this.nearPlane.val(),
				fp = this.farPlane.val(),
				fov = this.fov.val(),
				isSafe = this.eye.getValue() != null 
					&& this.target.getValue() != null 
					&& hemi.utils.isNumeric(fov) && hemi.utils.isNumeric(np)
					&& hemi.utils.isNumeric(fp);
					
			if (isSafe) {
				this.saveBtn.removeAttr('disabled');
				this.previewBtn.removeAttr('disabled');
			}
			else {
				this.saveBtn.attr('disabled', 'disabled');
				this.previewBtn.attr('disabled', 'disabled');
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var wgt = this,
				inputs = this.find('input:not(#vptName)'),
				form = this.find('form');
			
			this.saveBtn = this.find('#vptSaveBtn');
			this.cancelBtn = this.find('#vptCancelBtn');
			this.previewBtn = this.find('#vptPreviewBtn');
			this.fov = this.find('#vptFov');
			this.nearPlane = this.find('#vptNearPlane');
			this.farPlane = this.find('#vptFarPlane');
			this.name = this.find('#vptName');
			
			inputs.bind('blur', function(evt) {
				wgt.checkToggleButtons();
			});
			
			form.bind('submit', function() {
				return false;
			});
			
			new module.ui.Validator(inputs, function(elem) {
				var val = elem.val(),
					msg = null;
					
				if (val !== '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				
				return msg;
			});
			
			this.eye = new module.ui.Vector({
				container: wgt.find('#vptCameraDiv'),
				paramName: 'eye',
				onBlur: function(elem, evt) {					
					wgt.checkToggleButtons();
				},
				validator: new module.ui.Validator(null, function(elem) {
						var val = elem.val(),
							msg = null;
							
						if (val !== '' && !hemi.utils.isNumeric(val)) {
							msg = 'must be a number';
						}
						
						return msg;
					})
			});
			
			this.target = new module.ui.Vector({
				container: wgt.find('#vptTargetDiv'),
				paramName: 'position',
				onBlur: function(elem, evt) {
					wgt.checkToggleButtons();
				},
				validator: new module.ui.Validator(null, function(elem) {
						var val = elem.val(),
							msg = null;
							
						if (val !== '' && !hemi.utils.isNumeric(val)) {
							msg = 'must be a number';
						}
						
						return msg;
					})
			});
			
			this.saveBtn.bind('click', function(evt) {					
				wgt.notifyListeners(module.EventTypes.SaveViewpoint, 
					wgt.getParams());
				wgt.reset();
			});
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CancelViewpointEdit, null);
				wgt.reset();
			});
			
			this.previewBtn.bind('click', function(evt) {					
				wgt.notifyListeners(module.EventTypes.PreviewViewpoint, 
					wgt.getParams());
			});
		},	
		
		getParams: function() {
			var eyeVal = this.eye.getValue(),
				tgtVal = this.target.getValue(),
				params = {
					eye: [
						parseFloat(eyeVal.x), 
						parseFloat(eyeVal.y), 
						parseFloat(eyeVal.z)
					],
					target: [
						parseFloat(tgtVal.x), 
						parseFloat(tgtVal.y), 
						parseFloat(tgtVal.z)
					],
					fov: parseFloat(this.fov.val()),
					np: parseFloat(this.nearPlane.val()),
					fp: parseFloat(this.farPlane.val()),
					name: this.name.val()
				};
				
			return params;
		},	
		
		reset: function() {
			this.eye.reset();
			this.target.reset();
			this.fov.val('');
			this.nearPlane.val('');
			this.farPlane.val('');
			this.name.val('');
		},
		
		set: function(viewpoint) {
			this.eye.setValue({
				x: viewpoint.eye[0],
				y: viewpoint.eye[1],
				z: viewpoint.eye[2]
			});
			this.target.setValue({
				x: viewpoint.target[0],
				y: viewpoint.target[1],
				z: viewpoint.target[2]
			});
			this.fov.val(viewpoint.fov);
			this.nearPlane.val(viewpoint.np);
			this.farPlane.val(viewpoint.fp);
			this.name.val(viewpoint.name);
			this.previewBtn.removeAttr('disabled');
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
		instructions: "Click 'Add' to add the viewpoint."
	};
	
	module.tools.VptListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.VptListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.form = jQuery('<form method="post"></form>');
			this.addBtn = jQuery('<button id="vpAdd">Add</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
				var btn = jQuery(this);
					
				wgt.notifyListeners(module.EventTypes.AddViewpoint, null);;
			});
			
			this.form.append(this.addBtn)
			.bind('submit', function(evt) {
				return false;
			});
			
			return this.form;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
				
//			li.title.bind('click', function(evt) {
//				var vpt = li.getAttachedObject();
//				wgt.notifyListeners(module.EventTypes.MoveToViewpoint, vpt);
//			});
			
			li.editBtn.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				
				wgt.notifyListeners(module.EventTypes.EditViewpoint, vpt);
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
			
			this.addSidebarWidget(new module.tools.CreateVptSBWidget());
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
				crtVptWgt = view.createVptSBWidget;
				vptLstWgt = view.viewpointListSBWidget;
			
			// special listener for when the toolbar button is clicked
			view.addListener(module.EventTypes.ToolModeSet, function(value) {
				var isDown = value == module.tools.ToolConstants.MODE_DOWN;
				model.enableMonitoring(isDown);
			});
			
			// create viewpoint widget specific
			crtVptWgt.addListener(module.EventTypes.SaveViewpoint, function(params) {
				model.saveViewpoint(params);
			});
			crtVptWgt.addListener(module.EventTypes.CancelViewpointEdit, function(params) {
				crtVptWgt.setVisible(false);
				vptLstWgt.setVisible(true);
				model.cancelViewpointEdit();
			});
			crtVptWgt.addListener(module.EventTypes.PreviewViewpoint, function(params) {
				model.previewViewpoint(params);
			});
			
			// viewpoint list widget specific
			vptLstWgt.addListener(module.EventTypes.AddViewpoint, function() {
				crtVptWgt.setVisible(true);
				vptLstWgt.setVisible(false);
			});
			vptLstWgt.addListener(module.EventTypes.RemoveViewpoint, function(vpt) {
				model.removeViewpoint(vpt);
			});
			vptLstWgt.addListener(module.EventTypes.EditViewpoint, function(viewpoint) {
				model.editViewpoint(viewpoint);
				crtVptWgt.set(viewpoint);
				crtVptWgt.setVisible(true);
				vptLstWgt.setVisible(false);
			});
			vptLstWgt.addListener(module.EventTypes.MoveToViewpoint, function(vpt) {
				model.moveToViewpoint(vpt);
			});
			
			// model specific
			model.addListener(module.EventTypes.ViewpointAdded, function(vpt) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				crtVptWgt.setVisible(false);
				vptLstWgt.setVisible(true && isDown);
				vptLstWgt.add(vpt);
			});
			model.addListener(module.EventTypes.ViewpointUpdated, function(vpt) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				crtVptWgt.setVisible(false);
				vptLstWgt.setVisible(true && isDown);
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
