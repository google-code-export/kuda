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
    module.EventTypes.CameraUpdated = "viewpoints.CameraUpdated";
	module.EventTypes.ViewpointAdded = "viewpoints.ViewpointAdded";
	module.EventTypes.ViewpointRemoved = "viewpoints.ViewpointRemoved";
	module.EventTypes.ViewpointUpdated = "viewpoints.ViewpointUpdated";
	module.EventTypes.CamCurveCreated = "viewpoints.CamCurveCreated";
	module.EventTypes.CamCurveRemoved = "viewpoints.CamCurveRemoved";
	module.EventTypes.CamCurveUpdated = "viewpoints.CamCurveUpdated";
	module.EventTypes.WaypointAdded = "viewpoints.WaypointAdded";
	module.EventTypes.WaypointRemoved = "viewpoints.WaypointRemoved";
	module.EventTypes.WaypointUpdated = "viewpoints.WaypointUpdated";
	
	// Create Viewpoint Sidebar Widget events
	module.EventTypes.SaveViewpoint = "viewpoints.SaveViewpoint";
	module.EventTypes.CancelViewpointEdit = "viewpoints.CancelViewpointEdit";
	module.EventTypes.PreviewViewpoint = "viewpoints.PreviewViewpoint";
	
	// Create Camera Curve Sidebar Widget events
	module.EventTypes.AddWaypoint = "viewpoints.AddWaypoint";
	module.EventTypes.CancelCamCurve = "viewpoints.CancelCamCurve";
	module.EventTypes.RemoveWaypoint = "viewpoints.RemoveWaypoint";
	module.EventTypes.SaveCamCurve = "viewpoints.SaveCamCurve";
	module.EventTypes.StartCurvePreview = "viewpoints.StartCurvePreview";
	module.EventTypes.StopCurvePreview = "viewpoints.StopCurvePreview";
	module.EventTypes.UpdateWaypoint = "viewpoints.UpdateWaypoint";
	
	// Viewpoint List Sidebar Widget events
    module.EventTypes.AddViewpoint = "viewpoints.AddViewpoint";
    module.EventTypes.EditViewpoint = "viewpoints.EditViewpoint";
    module.EventTypes.RemoveViewpoint = "viewpoints.RemoveViewpoint";
	module.EventTypes.AddCamCurve = "viewpoints.AddCamCurve";
	module.EventTypes.EditCamCurve = "viewpoints.EditCamCurve";
	module.EventTypes.RemoveCamCurve = "viewpoints.RemoveCamCurve";
	
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
			this.camData = null;
			this.curve = null;
			this.prevHandler = null;
			this.prevCurve = null;
			this.previewing = false;
			this.waypoints = [];
		},
		
		addWaypoint: function(position, target) {
			var wp = {
					pos: position,
					tgt: target,
					ui: null
				};
			this.waypoints.push(wp);
			this.updatePreviewCurve();
			this.notifyListeners(module.EventTypes.WaypointAdded, wp);
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
			this.notifyListeners(module.EventTypes.CameraUpdated);
		},
		
		previewViewpoint: function(params) {
			if (this.camData == null) {
				this.camData = hemi.view.createViewData(hemi.world.camera);
			}
			var viewpoint = this.createViewpoint(params);
			hemi.world.camera.moveToView(viewpoint);
		},
		
		removeCamCurve: function(curve) {
			this.notifyListeners(module.EventTypes.CamCurveRemoved, curve);
			curve.cleanup();
		},
		
		removeViewpoint: function(viewpoint) {
			this.notifyListeners(module.EventTypes.ViewpointRemoved, viewpoint);
			viewpoint.cleanup();
		},
		
		removeWaypoint: function(waypoint) {
			var ndx = this.waypoints.indexOf(waypoint);
			
			if (ndx >= 0) {
				this.waypoints.splice(ndx, 1);
				this.updatePreviewCurve();
				this.notifyListeners(module.EventTypes.WaypointRemoved, waypoint);
			}
		},
		
		saveCamCurve: function(name) {
			this.stopPreview();
			var msgType = this.curve ? module.EventTypes.CamCurveUpdated :
				module.EventTypes.CamCurveCreated;
			
			if (!this.curve) {
				this.curve = new hemi.view.CameraCurve();
			}
			
			this.updateCurve();
			this.curve.name = name;			
			this.notifyListeners(msgType, this.curve);
			
			// reset
			this.curve = null;
			this.waypoints = [];
			this.updatePreviewCurve();
		},
		
		saveViewpoint: function(params) {
			var viewpoint = this.createViewpoint(params),
				msgType = this.currentVp ? module.EventTypes.ViewpointUpdated
					: module.EventTypes.ViewpointAdded;
				
			this.notifyListeners(msgType, viewpoint);
			
			if (this.camData) {
				hemi.world.camera.moveToView(this.camData);
			}
			
			this.currentVp = null;
			this.camData = null;
		},
		
		setCamCurve: function(curve) {
			this.stopPreview();
			this.curve = curve;
			this.waypoints = [];
			this.updatePreviewCurve();
			
			if (curve) {
				var eye = curve.eye,
					ex = eye.xpts,
					ey = eye.ypts,
					ez = eye.zpts,
					target = curve.target,
					tx = target.xpts,
					ty = target.ypts,
					tz = target.zpts;
				
				for (var i = 0, il = ex.length; i < il; i++) {
					this.addWaypoint([ex[i], ey[i], ez[i]],
						[tx[i], ty[i], tz[i]]);
				}
			}
		},
		
		startPreview: function() {
			if (!this.previewing) {
				var t = Math.max(this.waypoints.length / 3, 5) * hemi.view.FPS,
					that = this;
				
				this.previewing = true;
				this.prevHandler = hemi.world.camera.subscribe(hemi.msg.stop,
					function(msg) {
						that.stopPreview();
					});
				this.camData = hemi.view.createViewData(hemi.world.camera);
				hemi.world.camera.moveOnCurve(this.prevCurve, t);
			}
		},
		
		stopPreview: function() {
			if (this.prevHandler) {
				hemi.world.camera.unsubscribe(this.prevHandler);
				this.prevHandler = null;
			}
			if (this.previewing) {
				hemi.world.camera.moveToView(this.camData, 0);
				this.camData = null;
				this.previewing = false;
			}
		},
		
		updateCurve: function() {
			var eyes = [],
				targets = [];
			
			for (var i = 0, il = this.waypoints.length; i < il; i++) {
				var wp = this.waypoints[i];
				eyes.push(wp.pos);
				targets.push(wp.tgt);
			}
			
			this.curve.eye = new hemi.curve.Curve(eyes, hemi.curve.curveType.Cardinal),
			this.curve.target = new hemi.curve.Curve(targets, hemi.curve.curveType.Cardinal);
		},
		
		updatePreviewCurve: function() {
			if (this.waypoints.length > 1) {
				var saveCurve = this.curve,
					posDist = 0,
					tgtDist = 0;
				
				for (var i = 1; i < this.waypoints.length; i++) {
					var wp0 = this.waypoints[i-1],
						wp1 = this.waypoints[i];
					
					posDist += hemi.core.math.distance(wp0.pos, wp1.pos);
					tgtDist += hemi.core.math.distance(wp0.tgt, wp1.tgt);
				}
				
				var eSamp = Math.ceil(posDist / 5),
					tSamp = Math.ceil(tgtDist / 5),
					eSize = posDist / 1000,
					tSize = tgtDist / 1000;
				
				this.curve = {};
				this.updateCurve();
				this.prevCurve = this.curve;
				this.curve = saveCurve;
				hemi.curve.hideCurves();
				this.prevCurve.eye.draw(eSamp, {
					edgeColor: [0,0,1,1],
					edgeSize: eSize,
					joints: false
				});
				this.prevCurve.target.draw(tSamp, {
					edgeColor: [1,1,0,1],
					edgeSize: tSize,
					joints: false
				});
			} else if (this.prevCurve) {
				hemi.curve.hideCurves();
				this.prevCurve = null;
			}
		},
		
		updateWaypoint: function(waypoint, position, target) {
			var previewing = this.previewing;
			this.stopPreview();
			
			waypoint.pos = position;
			waypoint.tgt = target;
			
			this.updatePreviewCurve();
			this.notifyListeners(module.EventTypes.WaypointUpdated, waypoint);
						
			if (previewing) {
				this.startPreview();
			}
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
		uiFile: 'js/editor/tools/html/viewpointsForms.htm',
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
			
			this.autofillBtn.bind('click', function(evt) {
				var vd = hemi.view.createViewData(hemi.world.camera);
				wgt.set(vd);
				wgt.checkToggleButtons();
			});
			
			this.name.bind('keyup', function(evt) {
				wgt.checkToggleButtons();
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
//                     	 Viewpoint List Sidebar Widget                        //
////////////////////////////////////////////////////////////////////////////////
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.VptListSBWidgetDefaults = {
		name: 'viewpointListSBWidget',
		listId: 'viewpointList',
		prefix: 'vptLst',
		title: 'Camera Viewpoints',
		instructions: "Click 'Create Viewpoint' to add a viewpoint."
	};
	
	module.tools.VptListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.VptListSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		layoutExtra: function() {
			this.form = jQuery('<form method="post"></form>');
			this.addBtn = jQuery('<button id="vpAdd">Create Viewpoint</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
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
//				hemi.world.camera.moveToView(vpt);
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
//                     Create Camera Curve Sidebar Widget                     //
////////////////////////////////////////////////////////////////////////////////     
	
	var ADD_TXT = "Add",
		UPDATE_TXT = "Update";  
	
	/*
	 * Configuration object for the CreateCamCurveSBW.
	 */
	module.tools.CreateCamCurveSBWDefaults = {
		name: 'createCamCurveSBW',
		uiFile: 'js/editor/tools/html/camCurvesForms.htm',
		manualVisible: true
	};
	
	module.tools.CreateCamCurveSBW = module.ui.FormSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateCamCurveSBWDefaults, options);
		    this._super(newOpts);
			this.waypoints = [];
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				saveBtn = this.find('#crvSaveBtn'),
				cancelBtn = this.find('#crvCancelBtn'),
				camDataBtn = this.find('#crvCamData'),
				pntAddBtn = this.find('#crvAddPntBtn'),
				pntCancelBtn = this.find('#crvCancelPntBtn'),
				nameIpt = this.find('#crvName'),
				startPreviewBtn = this.find('#crvPreviewStartBtn'),
				stopPreviewBtn = this.find('#crvPreviewStopBtn'),
				wgt = this;
			
			this.nameIpt = nameIpt;
			this.pntAddBtn = pntAddBtn;
			this.pntCancelBtn = pntCancelBtn;
			this.pntList = this.find('#crvPntList');
			this.position = new module.ui.Vector({
				container: wgt.find('#crvPositionDiv'),
				paramName: 'position',
				validator: module.ui.createDefaultValidator()
			});
			this.target = new module.ui.Vector({
				container: wgt.find('#crvTargetDiv'),
				paramName: 'target',
				validator: module.ui.createDefaultValidator()
			});
			this.saveBtn = saveBtn;
			
			// bind buttons and inputs
			form.submit(function() {
				return false;
			});
			
			nameIpt.bind('keyup', function(evt) {		
				wgt.checkSaveButton();
			});
			
			saveBtn.bind('click', function(evt) {
				var name = nameIpt.val();
				wgt.notifyListeners(module.EventTypes.SaveCamCurve, name);
				wgt.reset();
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CancelCamCurve);
				wgt.reset();
			});
			
			startPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StartCurvePreview);
			})
			.attr('disabled', 'disabled');
			
			stopPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StopCurvePreview);
			});
			
			camDataBtn.bind('click', function(evt) {
				var pos = hemi.world.camera.getEye(),
					tgt = hemi.world.camera.getTarget(),
					rndFnc = module.utils.roundNumber;
				
				for (var i = 0, il = pos.length; i < il; i++) {
					pos[i] = rndFnc(pos[i], 2);
					tgt[i] = rndFnc(tgt[i], 2);
				}
				
				wgt.position.setValue({
					x: pos[0],
					y: pos[1],
					z: pos[2]
				});
				wgt.target.setValue({
					x: tgt[0],
					y: tgt[1],
					z: tgt[2]
				});
			});
			
			pntAddBtn.bind('click', function(evt) {
				var pnt = pntAddBtn.data('waypoint'),
					pos = wgt.position.getValue(),
					tgt = wgt.target.getValue();
					
				if (pos != null && tgt != null) {
					var msgType = pnt == null ? module.EventTypes.AddWaypoint
							: module.EventTypes.UpdateWaypoint,
						data = {
								position: [pos.x, pos.y, pos.z],
								target: [tgt.x, tgt.y, tgt.z],
								point: pnt
						};
					
					wgt.notifyListeners(msgType, data);
					wgt.position.reset();
					wgt.target.reset();
					wgt.checkSaveButton();
					pntAddBtn.data('waypoint', null).text(ADD_TXT);
					pntCancelBtn.hide();
				}
			}).data('waypoint', null);
			
			pntCancelBtn.bind('click', function(evt) {
				wgt.position.reset();
				wgt.target.reset();
				pntAddBtn.text(ADD_TXT).data('waypoint', null);
				pntCancelBtn.hide();
			}).hide();
			
			var checker = new module.ui.InputChecker(this.waypoints);
			checker.saveable = function() {
				return this.input.length > 1;
			};
			
			this.addInputsToCheck(nameIpt);
			this.addInputsToCheck(checker);
		},
		
		checkPreview: function() {
			var btn = this.find('#crvPreviewStartBtn');
			
			if (this.waypoints.length > 1) {				
				btn.removeAttr('disabled');
			} else {
				btn.attr('disabled', 'disabled');
			}
		},
		
		checkSaveButton: function() {
			var saveable = this.checkSaveable();
			
			if (saveable) {
				this.saveBtn.removeAttr('disabled');
			} else {
				this.saveBtn.attr('disabled', 'disabled');
			}
		},
		
		reset: function() {
			for (var i = 0, il = this.waypoints.length; i < il; i++) {
				this.waypoints[i].ui.remove();
			}
			
			this.nameIpt.val('');
			this.position.reset();
			this.target.reset();
			this.waypoints = [];
		},
		
		set: function(curve) {
			this.nameIpt.val(curve.name);
			this.checkPreview();
		},
		
		waypointAdded: function(waypoint) {
			var position = waypoint.pos,
				target = waypoint.tgt,
				wrapper = jQuery('<li class="crvBoxEditor"><span>Waypoint at [' + position.join(',') + ']</span></li>'),
				removeBtn = jQuery('<button class="icon removeBtn">Remove</button>'),
				editBtn = jQuery('<button class="icon editBtn">Edit</button>'),
				wgt = this;
			
			removeBtn.bind('click', function(evt){
				var wp = wrapper.data('waypoint');
				wgt.notifyListeners(module.EventTypes.RemoveWaypoint, wp);
			});
			
			editBtn.bind('click', function(evt){
				var wp = wrapper.data('waypoint'),
					pos = wp.pos,
					tgt = wp.tgt;
				
				wgt.pntAddBtn.text(UPDATE_TXT).data('waypoint', wp);
				wgt.pntCancelBtn.show();
				
				wgt.position.setValue({
					x: pos[0],
					y: pos[1],
					z: pos[2]
				});
				wgt.target.setValue({
					x: tgt[0],
					y: tgt[1],
					z: tgt[2]
				});
				
			// a jquery bug here that doesn't test for css rgba
			// wgt.boxForms.effect('highlight');
			});
			
			wrapper.append(editBtn).append(removeBtn).data('waypoint', waypoint);
			waypoint.ui = wrapper;
			
			this.waypoints.push(waypoint);
			this.pntList.append(wrapper);
			this.checkPreview();
		},
		
		waypointRemoved: function(waypoint) {
			var ndx = this.waypoints.indexOf(waypoint);
			
			if (ndx >= 0) {
				this.waypoints.splice(ndx, 1);
				waypoint.ui.remove();
				waypoint.ui = null;
				this.checkPreview();
			}
		},
		
		waypointUpdated: function(waypoint) {
			var rndFnc = module.utils.roundNumber,
				position = waypoint.pos,
				target = waypoint.tgt,
				wpUI = waypoint.ui;
				
			for (var i = 0, il = position.length; i < il; i++) {
				position[i] = rndFnc(position[i], 2);
				target[i] = rndFnc(target[i], 2);
			}
			
			if (this.pntAddBtn.data('waypoint') === waypoint) {
				this.position.setValue({
					x: position[0],
					y: position[1],
					z: position[2]
				});
				this.target.setValue({
					x: target[0],
					y: target[1],
					z: target[2]
				});
			}
			
			wpUI.data('waypoint', waypoint);
			wpUI.find('span').text('Waypoint at [' + position.join(',') + ']');
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     	Camera Curve List Sidebar Widget                      //
////////////////////////////////////////////////////////////////////////////////     
	
	/*
	 * Configuration object for the CamCurveListSBW.
	 */
	module.tools.CamCurveListSBWDefaults = {
		name: 'camCurveListSBW',
		listId: 'camCurveList',
		prefix: 'camCrvLst',
		title: 'Camera Curves',
		instructions: "Click 'Create Camera Curve' to add a curve."
	};
	
	module.tools.CamCurveListSBW = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.CamCurveListSBWDefaults, options);
		    this._super(newOpts);
		},
		
		layoutExtra: function() {
			this.form = jQuery('<form method="post"></form>');
			this.addBtn = jQuery('<button id="ccAdd">Create Camera Curve</button>');
			var wgt = this;
			
			this.addBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.AddCamCurve, null);
			});
			
			this.form.append(this.addBtn)
			.bind('submit', function(evt) {
				return false;
			});
			
			return this.form;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var crv = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.EditCamCurve, crv);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var crv = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveCamCurve, crv);
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
			this.addSidebarWidget(new module.tools.CreateCamCurveSBW());
			this.addSidebarWidget(new module.tools.VptListSBWidget());
			this.addSidebarWidget(new module.tools.CamCurveListSBW());
		},
		
		layoutActionBar: function() {
			var widget = new module.ui.ActionBarWidget({
				uiFile: 'js/editor/tools/html/viewpointsAxnBar.htm'
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
				crtVptWgt = view.createVptSBWidget,
				vptLstWgt = view.viewpointListSBWidget,
				crtCrvWgt = view.createCamCurveSBW,
				crvLstWgt = view.camCurveListSBW;
			
			// special listener for when the toolbar button is clicked
			view.addListener(module.EventTypes.ToolModeSet, function(value) {
				var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN;
				model.enableMonitoring(isDown);
			});
			
			// create viewpoint widget specific
			crtVptWgt.addListener(module.EventTypes.SaveViewpoint, function(params) {
				model.saveViewpoint(params);
			});
			crtVptWgt.addListener(module.EventTypes.CancelViewpointEdit, function(params) {
				crtVptWgt.setVisible(false);
				vptLstWgt.setVisible(true);
				crvLstWgt.setVisible(true);
				model.cancelViewpointEdit();
			});
			crtVptWgt.addListener(module.EventTypes.PreviewViewpoint, function(params) {
				model.previewViewpoint(params);
			});
			
			// viewpoint list widget specific
			vptLstWgt.addListener(module.EventTypes.AddViewpoint, function() {
				crtVptWgt.setVisible(true);
				vptLstWgt.setVisible(false);
				crvLstWgt.setVisible(false);
			});
			vptLstWgt.addListener(module.EventTypes.RemoveViewpoint, function(vpt) {
				model.removeViewpoint(vpt);
			});
			vptLstWgt.addListener(module.EventTypes.EditViewpoint, function(viewpoint) {
				model.editViewpoint(viewpoint);
				crtVptWgt.set(viewpoint);
				crtVptWgt.setVisible(true);
				vptLstWgt.setVisible(false);
				crvLstWgt.setVisible(false);
			});
			
			// create camera curve widget specific
			crtCrvWgt.addListener(module.EventTypes.AddWaypoint, function(wpData) {
				model.addWaypoint(wpData.position, wpData.target);
			});
			crtCrvWgt.addListener(module.EventTypes.CancelCamCurve, function() {
				model.setCamCurve(null);
				crtCrvWgt.setVisible(false);
				vptLstWgt.setVisible(true);
				crvLstWgt.setVisible(true);
			});
			crtCrvWgt.addListener(module.EventTypes.RemoveWaypoint, function(wp) {
				model.removeWaypoint(wp);
			});
			crtCrvWgt.addListener(module.EventTypes.SaveCamCurve, function(name) {
				model.saveCamCurve(name);
			});
			crtCrvWgt.addListener(module.EventTypes.StartCurvePreview, function() {
				model.startPreview();
			});
			crtCrvWgt.addListener(module.EventTypes.StopCurvePreview, function() {
				model.stopPreview();
			});
			crtCrvWgt.addListener(module.EventTypes.UpdateWaypoint, function(wpData) {
				model.updateWaypoint(wpData.point, wpData.position, wpData.target);
			});
			
			// camera curve list widget specific
			crvLstWgt.addListener(module.EventTypes.AddCamCurve, function() {
				crtCrvWgt.setVisible(true);
				crvLstWgt.setVisible(false);
				vptLstWgt.setVisible(false);
			});
			crvLstWgt.addListener(module.EventTypes.EditCamCurve, function(crv) {
				model.setCamCurve(crv);
				crtCrvWgt.set(crv);
				crtCrvWgt.setVisible(true);
				vptLstWgt.setVisible(false);
				crvLstWgt.setVisible(false);
			});
			crvLstWgt.addListener(module.EventTypes.RemoveCamCurve, function(crv) {
				model.removeCamCurve(crv);
			});
			
			// model specific			
			model.addListener(module.EventTypes.CameraUpdated, function(value) {
				view.updateCameraInfo(value);
			});
			model.addListener(module.EventTypes.ViewpointAdded, function(vpt) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				crtVptWgt.setVisible(false);
				vptLstWgt.setVisible(isDown);
				crvLstWgt.setVisible(isDown);
				vptLstWgt.add(vpt);
			});
			model.addListener(module.EventTypes.ViewpointUpdated, function(vpt) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				crtVptWgt.setVisible(false);
				vptLstWgt.setVisible(isDown);
				crvLstWgt.setVisible(isDown);
				vptLstWgt.update(vpt);
			});
			model.addListener(module.EventTypes.ViewpointRemoved, function(vpt) {
				vptLstWgt.remove(vpt);
			});
			model.addListener(module.EventTypes.CamCurveCreated, function(crv) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				crtCrvWgt.setVisible(false);
				vptLstWgt.setVisible(isDown);
				crvLstWgt.setVisible(isDown);
				crvLstWgt.add(crv);
			});
			model.addListener(module.EventTypes.CamCurveRemoved, function(crv) {
				crvLstWgt.remove(crv);
			});
			model.addListener(module.EventTypes.CamCurveUpdated, function(crv) {
				var isDown = view.mode == module.tools.ToolConstants.MODE_DOWN;
				crtCrvWgt.setVisible(false);
				vptLstWgt.setVisible(isDown);
				crvLstWgt.setVisible(isDown);
				crvLstWgt.update(crv);
			});
			model.addListener(module.EventTypes.WaypointAdded, function(wp) {
				crtCrvWgt.waypointAdded(wp);
			});
			model.addListener(module.EventTypes.WaypointRemoved, function(wp) {
				crtCrvWgt.waypointRemoved(wp);
			});
			model.addListener(module.EventTypes.WaypointUpdated, function(wp) {
				crtCrvWgt.waypointUpdated(wp);
			});
		}
	});
	
	return module;
})(editor || {});
