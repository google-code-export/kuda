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
    editor.EventTypes.CameraUpdated = "camcurve.CameraUpdated";
	editor.EventTypes.WaypointAdded = "camcurve.WaypointAdded";
	editor.EventTypes.WaypointRemoved = "camcurve.WaypointRemoved";
	editor.EventTypes.WaypointUpdated = "camcurve.WaypointUpdated";
	
	// Create Camera Curve Widget events
	editor.EventTypes.AddWaypoint = "camcurve.AddWaypoint";
	editor.EventTypes.RemoveWaypoint = "camcurve.RemoveWaypoint";
	editor.EventTypes.SaveCamCurve = "camcurve.SaveCamCurve";
	editor.EventTypes.StartCurvePreview = "camcurve.StartCurvePreview";
	editor.EventTypes.StopCurvePreview = "camcurve.StopCurvePreview";
	editor.EventTypes.UpdateWaypoint = "camcurve.UpdateWaypoint";
	
	// Camera Curve List Widget events
	editor.EventTypes.AddCamCurve = "camcurve.AddCamCurve";
	editor.EventTypes.EditCamCurve = "camcurve.EditCamCurve";
	editor.EventTypes.RemoveCamCurve = "camcurve.RemoveCamCurve";
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * An CamCurveModel handles the creation and playing of animations as well
	 * as model picking for the animation tool.
	 */
	editor.tools.CamCurveModel = editor.ToolModel.extend({
		init: function() {
			this._super('editor.tools.CamCurve');
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
			this.notifyListeners(editor.EventTypes.WaypointAdded, wp);
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
		
		removeCamCurve: function(curve) {
			this.notifyListeners(editor.events.Removed, curve);
			curve.cleanup();
		},
		
		removeWaypoint: function(waypoint) {
			var ndx = this.waypoints.indexOf(waypoint);
			
			if (ndx >= 0) {
				this.waypoints.splice(ndx, 1);
				this.updatePreviewCurve();
				this.notifyListeners(editor.EventTypes.WaypointRemoved, waypoint);
			}
		},
		
		saveCamCurve: function(name) {
			this.stopPreview();
			var msgType = this.curve ? editor.events.Updated :
				editor.events.Created;
			
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
			
			this.curve.eye = new hemi.curve.Curve(eyes, hemi.curve.CurveType.Cardinal),
			this.curve.target = new hemi.curve.Curve(targets, hemi.curve.CurveType.Cardinal);
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
			this.notifyListeners(editor.EventTypes.WaypointUpdated, waypoint);
						
			if (previewing) {
				this.startPreview();
			}
		},
		
	    worldCleaned: function() {
			var	camCurves = hemi.world.getCamCurves();
	        
	        for (var ndx = 0, len = camCurves.length; ndx < len; ndx++) {
	            var cc = camCurves[ndx];
	            this.notifyListeners(editor.events.Removed, cc);
	        }
	    },
	    
	    worldLoaded: function() {
			var	camCurves = hemi.world.getCamCurves();
	        
	        for (var ndx = 0, len = camCurves.length; ndx < len; ndx++) {
	            var cc = camCurves[ndx];
	            this.notifyListeners(editor.events.Created, cc);
	        }
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                      	  Widget Private Methods     	                  //
////////////////////////////////////////////////////////////////////////////////  
	
	var sizeAndPosition = function(height) {
		var wgt = this,
			container = this.container,
			padding = parseInt(container.css('paddingBottom')) +
				parseInt(container.css('paddingTop')),
			win = jQuery(window),
			winHeight = win.height(),
			wgtHeight = winHeight/2 - padding;
		
		container.height(wgtHeight)
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     		Create Camera Curve Widget         	              //
////////////////////////////////////////////////////////////////////////////////     
	
	var ADD_TXT = "Add",
		UPDATE_TXT = "Update",
		PREVIEW_TXT = "Preview",
		STARTED_TXT = "Stop";  
	
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function(options) {
		    this._super({
				name: 'createCamCurveSBW',
				uiFile: 'js/editor/plugins/camera/html/camCurvesForms.htm',
				manualVisible: true
			});
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
				previewBtn = this.find('#crvPreviewBtn'),
				wgt = this;
			
			this.nameIpt = nameIpt;
			this.pntAddBtn = pntAddBtn;
			this.pntCancelBtn = pntCancelBtn;
			this.pntList = this.find('#crvPntList');
			this.position = new editor.ui.Vector({
				container: wgt.find('#crvPositionDiv'),
				paramName: 'position',
				validator: editor.ui.createDefaultValidator()
			});
			this.target = new editor.ui.Vector({
				container: wgt.find('#crvTargetDiv'),
				paramName: 'target',
				validator: editor.ui.createDefaultValidator()
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
				wgt.notifyListeners(editor.EventTypes.SaveCamCurve, name);
				wgt.reset();
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.events.Cancel);
				wgt.reset();
			});
			
			previewBtn.bind('click', function(evt) {
				if (previewBtn.data('started')) {
					wgt.notifyListeners(editor.EventTypes.StopCurvePreview);
					previewBtn.data('started', false).text(PREVIEW_TXT);
				}
				else {
					wgt.notifyListeners(editor.EventTypes.StartCurvePreview);
					previewBtn.data('started', true).text(STARTED_TXT);
				}
			})
			.attr('disabled', 'disabled');
						
			camDataBtn.bind('click', function(evt) {
				var pos = hemi.world.camera.getEye(),
					tgt = hemi.world.camera.getTarget(),
					rndFnc = editor.utils.roundNumber;
				
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
					
				if (pos.length > 0 && tgt.length > 0) {
					var msgType = pnt == null ? editor.EventTypes.AddWaypoint
							: editor.EventTypes.UpdateWaypoint,
						data = {
								position: pos,
								target: tgt,
								point: pnt
						};
					
					wgt.notifyListeners(msgType, data);
					wgt.position.reset();
					wgt.target.reset();
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
			
			var checker = new editor.ui.InputChecker(this.waypoints);
			checker.saveable = function() {
				return this.input.length > 1;
			};
			
			this.addInputsToCheck(nameIpt);
			this.addInputsToCheck(checker);
			
			sizeAndPosition.call(this);
		},
		
		checkPreview: function() {
			var btn = this.find('#crvPreviewBtn');
			
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
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			
			var form = this.find('form:visible'),
				padding = parseInt(form.css('paddingTop')) 
					+ parseInt(form.css('paddingBottom')),
				newHeight = maxHeight - padding,
				oldHeight = form.outerHeight(true);
			
			if (oldHeight > newHeight) {
				form.addClass('scrolling');
			}
			else {
				form.removeClass('scrolling');
			}
			if (newHeight > 0) {
				this.find('form:visible').height(newHeight);
			}
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
				wgt.notifyListeners(editor.EventTypes.RemoveWaypoint, wp);
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
			this.checkSaveButton();
		},
		
		waypointRemoved: function(waypoint) {
			var ndx = this.waypoints.indexOf(waypoint);
			
			if (ndx >= 0) {
				this.waypoints.splice(ndx, 1);
				waypoint.ui.remove();
				waypoint.ui = null;
				this.checkPreview();
				this.checkSaveButton();
			}
		},
		
		waypointUpdated: function(waypoint) {
			var rndFnc = editor.utils.roundNumber,
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
//                     		  Camera Curve List Widget   	                  //
////////////////////////////////////////////////////////////////////////////////     
		
	var ListWidget = editor.ui.ListWidget.extend({
		init: function(behaviorWidget) {
		    this._super({
				name: 'camCurveListWgt',
				listId: 'camCurveList',
				prefix: 'camCrvLst',
				title: 'Camera Curves',
				instructions: "Add camera curves above."
			});
			
			sizeAndPosition.call(this);
			this.container.addClass('second');
			this.behaviorWidget = behaviorWidget;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var crv = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.EditCamCurve, crv);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var crv = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.RemoveCamCurve, crv);
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
	 * The CamCurveView controls the dialog and toolbar widget for the
	 * animation tool.
	 *
	 * @param {Object} options configuration options.  Uses
	 *         editor.tools.CamCurveViewDefaults as default options
	 */
	editor.tools.CamCurveView = editor.ToolView.extend({
		init: function() {
			this._super({
				toolName: 'Camera Curves',
		        toolTip: 'Create curves for cameras to travel on',
				elemId: 'viewpointsBtn',
				id: 'editor.tools.CamCurve'
			});
			this.pre = 'vp_';
			
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
	 * The CamCurveController facilitates CamCurveModel and CamCurveView
	 * communication by binding event and message handlers.
	 */
	editor.tools.CamCurveController = editor.ToolController.extend({
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
				bhvWgt = view.sidePanel.behaviorWidget,
				crtWgt = view.sidePanel.createCamCurveSBW,
				lstWgt = view.sidePanel.camCurveListWgt;
			
			// special listener for when the toolbar button is clicked
			view.addListener(editor.events.ToolModeSet, function(value) {
				var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
				model.enableMonitoring(isDown);
			});
			
			// create camera curve widget specific
			crtWgt.addListener(editor.EventTypes.AddWaypoint, function(wpData) {
				model.addWaypoint(wpData.position, wpData.target);
			});
			crtWgt.addListener(editor.events.Cancel, function() {
				model.setCamCurve(null);
			});
			crtWgt.addListener(editor.EventTypes.RemoveWaypoint, function(wp) {
				model.removeWaypoint(wp);
			});
			crtWgt.addListener(editor.EventTypes.SaveCamCurve, function(name) {
				model.saveCamCurve(name);
			});
			crtWgt.addListener(editor.EventTypes.StartCurvePreview, function() {
				model.startPreview();
			});
			crtWgt.addListener(editor.EventTypes.StopCurvePreview, function() {
				model.stopPreview();
			});
			crtWgt.addListener(editor.EventTypes.UpdateWaypoint, function(wpData) {
				model.updateWaypoint(wpData.point, wpData.position, wpData.target);
			});
			
			// camera curve list widget specific
			lstWgt.addListener(editor.EventTypes.AddCamCurve, function() {
			});
			lstWgt.addListener(editor.EventTypes.EditCamCurve, function(crv) {
				model.setCamCurve(crv);
				crtWgt.set(crv);
			});
			lstWgt.addListener(editor.EventTypes.RemoveCamCurve, function(crv) {
				model.removeCamCurve(crv);
			});
			
			// model specific			
			model.addListener(editor.EventTypes.CameraUpdated, function(value) {
//				view.updateCameraInfo(value);
			});
			model.addListener(editor.events.Created, function(crv) {
				lstWgt.add(crv);
			});
			model.addListener(editor.events.Removed, function(crv) {
				lstWgt.remove(crv);
			});
			model.addListener(editor.events.Updated, function(crv) {
				lstWgt.update(crv);
			});
			model.addListener(editor.EventTypes.WaypointAdded, function(wp) {
				crtWgt.waypointAdded(wp);
			});
			model.addListener(editor.EventTypes.WaypointRemoved, function(wp) {
				crtWgt.waypointRemoved(wp);
			});
			model.addListener(editor.EventTypes.WaypointUpdated, function(wp) {
				crtWgt.waypointUpdated(wp);
			});
		}
	});
	
	return editor;
})(editor || {});
