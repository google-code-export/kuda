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
	editor.tools = editor.tools || {};
	
	editor.EventTypes = editor.EventTypes || {};
	// model events
    editor.EventTypes.CameraUpdated = "viewpoints.CameraUpdated";
	editor.EventTypes.ViewpointAdded = "viewpoints.ViewpointAdded";
	editor.EventTypes.ViewpointRemoved = "viewpoints.ViewpointRemoved";
	editor.EventTypes.ViewpointUpdated = "viewpoints.ViewpointUpdated";
	
	// Create Viewpoint Widget events
	editor.EventTypes.SaveViewpoint = "viewpoints.SaveViewpoint";
	editor.EventTypes.CancelViewpointEdit = "viewpoints.CancelViewpointEdit";
	editor.EventTypes.PreviewViewpoint = "viewpoints.PreviewViewpoint";
	
	// Viewpoint List Widget events
    editor.EventTypes.AddViewpoint = "viewpoints.AddViewpoint";
    editor.EventTypes.EditViewpoint = "viewpoints.EditViewpoint";
    editor.EventTypes.RemoveViewpoint = "viewpoints.RemoveViewpoint";
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * An ViewpointsModel handles the creation and playing of animations as well
	 * as model picking for the animation tool.
	 */
	editor.tools.ViewpointsModel = editor.ui.ToolModel.extend({
		init: function() {
			this._super('editor.tools.Viewpoints');
			this.camData = null;
			this.curve = null;
			this.prevHandler = null;
			this.prevCurve = null;
			this.previewing = false;
			this.waypoints = [];
		},
		
		cancelViewpointEdit: function() {
			if (this.camData) {
				hemi.world.camera.moveToView(this.camData);
			}
			
			this.camData = null;
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
		
		onRender: function(renderEvt) {
			this.notifyListeners(editor.EventTypes.CameraUpdated);
		},
		
		previewViewpoint: function(params) {
			if (this.camData == null) {
				this.camData = hemi.view.createViewData(hemi.world.camera);
			}
			
			params.up = hemi.world.camera.up;
			var vd = new hemi.view.ViewData(params);
			hemi.world.camera.moveToView(vd);
		},
		
		removeViewpoint: function(viewpoint) {
			this.notifyListeners(editor.EventTypes.ViewpointRemoved, viewpoint);
			hemi.dispatch.postMessage(this, editor.msg.citizenDestroyed, viewpoint);
			viewpoint.cleanup();
		},
		
		saveViewpoint: function(params) {
			var viewpoint = this.createViewpoint(params),
				msgType = this.currentVp ? editor.EventTypes.ViewpointUpdated
					: editor.EventTypes.ViewpointAdded;
				
			this.notifyListeners(msgType, viewpoint);
			// TODO: use dispatch to notify of citizen creation			
			hemi.world.send(editor.msg.citizenCreated, viewpoint);
			
			if (this.camData) {
				hemi.world.camera.moveToView(this.camData);
			}
			
			this.currentVp = null;
			this.camData = null;
		},
		
	    worldCleaned: function() {
			var viewpoints = hemi.world.getViewpoints();
	        
	        for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
	            var vpt = viewpoints[ndx];
	            this.notifyListeners(editor.EventTypes.ViewpointRemoved, vpt);
	        }
	    },
	    
	    worldLoaded: function() {
	        var viewpoints = hemi.world.getViewpoints();
	        
	        for (var ndx = 0, len = viewpoints.length; ndx < len; ndx++) {
	            var vpt = viewpoints[ndx];
	            this.notifyListeners(editor.EventTypes.ViewpointAdded, vpt);
	        }
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  Create Viewpoint Widget     	                  //
////////////////////////////////////////////////////////////////////////////////  
 	
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function(options) {
		    this._super({
				name: 'createVptWidget',
				uiFile: 'js/editor/plugins/camera/html/viewpointsForms.htm',
				manualVisible: true
			});
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
				this.previewBtn.removeAttr('disabled');
				
				if (this.name.val() !== '') {
					this.saveBtn.removeAttr('disabled');
				} else {
					this.saveBtn.attr('disabled', 'disabled');
				}
			} else {
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
			this.autofillBtn = this.find('#vptAutoFill');
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
			
			new editor.ui.Validator(inputs, function(elem) {
				var val = elem.val(),
					msg = null;
					
				if (val !== '' && !hemi.utils.isNumeric(val)) {
					msg = 'must be a number';
				}
				
				return msg;
			});
			
			this.eye = new editor.ui.Vector({
				container: wgt.find('#vptCameraDiv'),
				paramName: 'eye',
				onBlur: function(elem, evt) {					
					wgt.checkToggleButtons();
				},
				validator: new editor.ui.Validator(null, function(elem) {
						var val = elem.val(),
							msg = null;
							
						if (val !== '' && !hemi.utils.isNumeric(val)) {
							msg = 'must be a number';
						}
						
						return msg;
					})
			});
			
			this.target = new editor.ui.Vector({
				container: wgt.find('#vptTargetDiv'),
				paramName: 'position',
				onBlur: function(elem, evt) {
					wgt.checkToggleButtons();
				},
				validator: new editor.ui.Validator(null, function(elem) {
						var val = elem.val(),
							msg = null;
							
						if (val !== '' && !hemi.utils.isNumeric(val)) {
							msg = 'must be a number';
						}
						
						return msg;
					})
			});
			
			this.saveBtn.bind('click', function(evt) {					
				wgt.notifyListeners(editor.EventTypes.SaveViewpoint, 
					wgt.getParams());
			});
			
			this.cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.CancelViewpointEdit, null);
			});
			
			this.previewBtn.bind('click', function(evt) {					
				wgt.notifyListeners(editor.EventTypes.PreviewViewpoint, 
					wgt.getParams());
			});
			
			this.autofillBtn.bind('click', function(evt) {
				var vd = hemi.view.createViewData(hemi.world.camera);
				wgt.set(vd);
				wgt.checkToggleButtons();
			});
			
			this.name.bind('keyup', function(evt) {
				wgt.checkToggleButtons();
			});
			
			editor.ui.sizeAndPosition.call(this);
		},	
		
		getParams: function() {
			var eyeVal = this.eye.getValue(),
				tgtVal = this.target.getValue(),
				params = {
					eye: eyeVal,
					target: tgtVal,
					fov: hemi.core.math.degToRad(parseFloat(this.fov.val())),
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
			this.fov.val(hemi.core.math.radToDeg(viewpoint.fov));
			this.nearPlane.val(viewpoint.np);
			this.farPlane.val(viewpoint.fp);
			this.name.val(viewpoint.name);
			this.previewBtn.removeAttr('disabled');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	 		Viewpoint List Widget                         //
////////////////////////////////////////////////////////////////////////////////
	
	var ListWidget = editor.ui.ListWidget.extend({
		init: function(behaviorWidget) {
		    this._super({
				name: 'viewpointListWidget',
				listId: 'viewpointList',
				prefix: 'vptLst',
				title: 'Camera Viewpoints',
				instructions: "Add new viewpoints above."
			});
			
			editor.ui.sizeAndPosition.call(this);
			this.container.addClass('second');
			this.behaviorWidget = behaviorWidget;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.title.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				hemi.world.camera.moveToView(vpt);
			});
			
			li.editBtn.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.EditViewpoint, vpt);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var vpt = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.RemoveViewpoint, vpt);
			});
		},
		
//		createListItem: function() {
//			return new editor.ui.BhvListItem(this.behaviorWidget);
//		},
		
		getOtherHeights: function() {
			return this.form.outerHeight(true);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
//////////////////////////////////////////////////////////////////////////////// 
 	
	/**
	 * The ViewpointsView controls the dialog and toolbar widget for the
	 * animation tool.
	 *
	 * @param {Object} options configuration options.  Uses
	 *         editor.tools.ViewpointsViewDefaults as default options
	 */
	editor.tools.ViewpointsView = editor.ui.ToolView.extend({
		init: function(options) {
			this._super({
				toolName: 'Viewpoints',
		        toolTip: 'Create and edit viewpoints for cameras to move between',
				elemId: 'viewpointsBtn',
				id: 'editor.tools.Viewpoints'
			});
			
			this.addPanel(new editor.ui.Panel());
			
//			this.sidePanel.addWidget(editor.ui.getBehaviorWidget());
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new ListWidget());
		}
	});
		
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * The ViewpointsController facilitates ViewpointsModel and ViewpointsView
	 * communication by binding event and message handlers.
	 */
	editor.tools.ViewpointsController = editor.ui.ToolController.extend({
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
				crtWgt = view.sidePanel.createVptWidget,
				lstWgt = view.sidePanel.viewpointListWidget,
				bhvWgt = view.sidePanel.behaviorWidget;
			
			// special listener for when the toolbar button is clicked
			view.addListener(editor.EventTypes.ToolModeSet, function(value) {
				var isDown = value.newMode === editor.ui.ToolConstants.MODE_DOWN;
				model.enableMonitoring(isDown);
			});
			
			// create viewpoint widget specific
			crtWgt.addListener(editor.EventTypes.CancelViewpointEdit, function(params) {
				model.cancelViewpointEdit();
				crtWgt.reset();
			});
			crtWgt.addListener(editor.EventTypes.SaveViewpoint, function(params) {
				model.saveViewpoint(params);
			});
			crtWgt.addListener(editor.EventTypes.PreviewViewpoint, function(params) {
				model.previewViewpoint(params);
			});
			
			// viewpoint list widget specific
			lstWgt.addListener(editor.EventTypes.AddViewpoint, function() {
			});
			lstWgt.addListener(editor.EventTypes.RemoveViewpoint, function(vpt) {
				model.removeViewpoint(vpt);
			});
			lstWgt.addListener(editor.EventTypes.EditViewpoint, function(viewpoint) {
				model.editViewpoint(viewpoint);
				crtWgt.set(viewpoint);
			});
			
			// model specific 
			model.addListener(editor.EventTypes.CameraUpdated, function(value) {
//				view.updateCameraInfo(value);
			});
			// TODO: replace with hemi dispatch
			model.addListener(editor.EventTypes.ViewpointAdded, function(vpt) {
				crtWgt.reset();
				lstWgt.add(vpt);
			});
			model.addListener(editor.EventTypes.ViewpointUpdated, function(vpt) {
				lstWgt.update(vpt);
			});
			model.addListener(editor.EventTypes.ViewpointRemoved, function(vpt) {
				lstWgt.remove(vpt);
			});
			// see TODO above
			hemi.msg.subscribe(editor.EventTypes.Created,
				function(msg) {
					if (msg.src instanceof editor.tools.ViewpointsModel) {
						lstWgt.add(vpt);
					}
				});
			hemi.msg.subscribe(editor.EventTypes.Removed,
				function(msg) {
					if (msg.src instanceof editor.tools.ViewpointsModel) {
						lstWgt.remove(vpt);
					}
				});
			hemi.msg.subscribe(editor.EventTypes.Updated,
				function(msg) {
					if (msg.src instanceof editor.tools.ViewpointsModel) {
						var isDown = view.mode == editor.ui.ToolConstants.MODE_DOWN;
						lstWgt.update(vpt);
					}
				});
			
//			// behavior widget specific
//			bhvWgt.addListener(editor.EventTypes.WidgetVisible, function(obj) {
//				editor.ui.sizeAndPosition.call(bhvWgt);
//				crtWgt.setVisible(!obj.visible);
//			});
		}
	});
	
	return editor;
})(editor || {});
