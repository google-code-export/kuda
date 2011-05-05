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
	
	// model specific
    module.EventTypes.CurveCreated = "Curves.CurveCreated";
    module.EventTypes.CurveRemoved = "Curves.CurveRemoved";
    module.EventTypes.CurveUpdated = "Curves.CurveUpdated";
    module.EventTypes.CurveSet = "Curves.CurveSet";
    module.EventTypes.BoxAdded = "Curves.BoxAdded";
	
	// curve list widget specific
	module.EventTypes.CreateCurve = "Curves.CreateCurve";
	module.EventTypes.EditCurve = "Curves.EditCurve";
	module.EventTypes.RemoveCurve = "Curves.RemoveCurve";
	
	// curve edit widget specific
	module.EventTypes.SetParam = "Curves.SetParam";
	module.EventTypes.AddBox = "Curves.AddBox";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * An CurveEditorModel handles the creation and playing of animations as well
     * as model picking for the animation tool.
     */
    module.tools.CurveEditorModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			this.config = {
				fast: true,
				boxes: []
			};
	    },
		
		addBox: function(position, width, height, depth) {
			var x = position[0],
				y = position[1],
				z = position[2],
				halfWidth = width/2,
				halfHeight = height/2,
				halfDepth = depth/2,
				minExtent = [x - halfWidth, y - halfHeight, z - halfDepth],
				maxExtent = [x + halfWidth, y + halfHeight, z + halfDepth];
				
			this.config.boxes.push([minExtent, maxExtent]);
			this.notifyListeners(module.EventTypes.BoxAdded, null);
		},
		
		cancel: function() {
			if (!this.isUpdate && this.currentSystem) {
				this.currentSystem.cleanup();
			}
			
			// reset
			this.reset();
		},
		
		createSystem: function() {
			this.currentSystem = hemi.curve.createSystem(this.config);
		},
		
		edit: function(system) {
			this.stopPreview();
			this.currentSystem = system;
			this.isUpdate = true;
			
			this.notifyListeners(module.EventTypes.CurveSet, this.currentSystem);
		},
		
		remove: function(system) {
			this.stopPreview();
			this.currentSystem.cleanup();
			
			this.reset();
		},
		
		reset: function() {
			this.currentSystem = null;
			this.config = {
				fast: true,
				boxes: []
			};
			this.isUpdate = false;
		},
		
		save: function(name) {
			this.stopPreview();
			var msgType = this.isUpdate ? module.EventTypes.CurveUpdated :
				module.EventTypes.CurveCreated;
			
			if (this.currentSystem && !this.isUpdate) {
				this.currentSystem.cleanup();
			}
			
			this.createSystem();
			this.currentSystem.name = name;
			
			this.notifyListeners(msgType, this.currentSystem);
			
			// reset
			this.reset();
		},
		
		setParam: function(paramName, paramValue) {
			if (paramValue === '') {
				delete this.config[paramName];
			}
			else {
				this.config[paramName] = paramValue;
			}
			this.stopPreview();
		},
		
		startPreview: function() {
			if (!this.currentSystem) {
				this.createSystem();
			}
			this.currentSystem.start();
		},
		
		stopPreview: function() {
			if (this.currentSystem) {
				this.currentSystem.stop();
			}
		},
		
	    worldCleaned: function() {
	    },
		
	    worldLoaded: function() {
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     		Edit Curve Sidebar Widget                         //
//////////////////////////////////////////////////////////////////////////////// 
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.EditCrvSBWidgetDefaults = {
		name: 'editCurveSBWidget',
		uiFile: 'js/editor/tools/html/curvesForms.htm',
		manualVisible: true
	};
	
	module.tools.EditCrvSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.EditCrvSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				saveBtn = this.find('#crvSaveBtn'),
				cancelBtn = this.find('#crvCancelBtn'),
				sysTypeSel = this.find('#crvSystemTypeSelect'),
				shpTypeSel = this.find('#crvShapeSelect'),
				boxAddBtn = this.find('#crvAddSaveBoxBtn'),
				boxWidthIpt = this.find('#crvWidth'),
				boxHeightIpt = this.find('#crvWidth'),
				boxDepthIpt = this.find('#crvWidth'),
				nameIpt = this.find('#crvName'),
				startPreviewBtn = this.find('#crvPreviewStartBtn'),
				stopPreviewBtn = this.find('#crvPreviewStopBtn'),
				wgt = this;
			
			this.position = new module.ui.Vector({
				container: wgt.find('#crvPositionDiv'),
				paramName: 'position',
				validator: new module.ui.Validator(null, function(elem) {
					var val = elem.val(),
						msg = null;
						
					if (val !== '' && !hemi.utils.isNumeric(val)) {
						msg = 'must be a number';
					}
					
					return msg;
				})
			});
			
			form.submit(function() {
				return false;
			});
			
			saveBtn.bind('click', function(evt) {
				wgt.notifyListeners();
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners();
			});
			
			startPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StartPreview);
			})
			.attr('disabled', 'disabled');
			
			stopPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StopPreview);
			});
			
			sysTypeSel.bind('change', function(evt) {
				wgt.notifyListeners(module.EventTypes.SetParam, {
					paramName: 'trail',
					paramValue: jQuery(this).val() == trail
				});
			});
			
			shpTypeSel.bind('change', function(evt) {
				wgt.notifyListeners(module.EventTypes.SetParam, {
					paramName: 'shape',
					paramValue: jQuery(this).val()
				});
			});
			
			boxAddBtn.bind('click', function(evt) {
				var pos = wgt.position.getValues();
				
				wgt.notifyListeners(module.EventTypes.AddBox, {
					position: [pos.x, pos.y, pos.z],
					width: boxWidthIpt.val(),
					height: boxHeightIpt.val(),
					depth: boxDepthIpt.val()
				});
				
				startPreviewBtn.removeAttr('disabled');
			});
		},
		
		reset: function() {		
		},
		
		set: function(curve) {
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     		Curve List Sidebar Widget                         //
//////////////////////////////////////////////////////////////////////////////// 
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	module.tools.CrvListSBWidgetDefaults = {
		name: 'curveListSBWidget',
		listId: 'curveList',
		prefix: 'crvLst',
		title: 'Curves',
		instructions: "Click 'Create Curve' to create a new curve."
	};
	
	module.tools.CrvListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.CrvListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createCurve">Create Curve</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreateCurve, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var curve = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.EditCurve, curve);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var curve = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveCurve, curve);
			});
		},
		
		getOtherHeights: function() {
			return this.buttonDiv.outerHeight(true);
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////  

    /*
     * Configuration object for the CurveEditorView.
     */
    module.tools.CurveEditorViewDefaults = {
        toolName: 'Curves',
		toolTip: 'Curves: Create and edit curves',
        widgetId: 'curvesBtn'
    };
    
    /**
     * The CurveEditorView controls the dialog and toolbar widget for the 
     * animation tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.CurveEditorViewDefaults as default options
     */
    module.tools.CurveEditorView = module.tools.ToolView.extend({
		init: function(options){
			var newOpts = jQuery.extend({}, module.tools.CurveEditorViewDefaults, options);
			this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.EditCrvSBWidget());
			this.addSidebarWidget(new module.tools.CrvListSBWidget());
		}
	});
	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The CurveEditorController facilitates CurveEditorModel and CurveEditorView
     * communication by binding event and message handlers.
     */
    module.tools.CurveEditorController = module.tools.ToolController.extend({
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
				edtCrvWgt = view.editCurveSBWidget,
				lstWgt = view.curveListSBWidget,
	        	that = this;
	        
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode == module.tools.ToolConstants.MODE_DOWN;				
	        });	
			
			// edit curve widget specific
			edtCrvWgt.addListener(module.EventTypes.AddBox, function(boxParams) {
				model.addBox(boxParams.position, boxParams.width, 
					boxParams.height, boxParams.depth);
			});
			edtCrvWgt.addListener(module.EventTypes.SetParam, function(paramObj) {
				model.setParam(paramObj.paramName, paramObj.paramValue);
			});
			
			// curve list widget specific
			lstWgt.addListener(module.EventTypes.CreateCurve, function() {
				edtCrvWgt.setVisible(true);
				lstWgt.setVisible(false);
			});
			lstWgt.addListener(module.EventTypes.EditCurve, function(curve) {
				edtCrvWgt.setVisible(true);
				lstWgt.setVisible(false);
				
				model.edit(curve);
			});
			lstWgt.addListener(module.EventTypes.RemoveCurve, function(curve) {
				model.remove(curve);
			});
			
			// view specific
	        
			// model specific	
			model.addListener(module.EventTypes.BoxAdded, function() {
				
			});
			model.addListener(module.EventTypes.CurveCreated, function(curve) {
				lstWgt.add(curve);
			});
			model.addListener(module.EventTypes.CurveRemoved, function(curve) {
				lstWgt.remove(curve);
			});
			model.addListener(module.EventTypes.CurveSet, function(curve) {
				if (curve != null) {
					crtWgt.set(curve);
				}
			});
			model.addListener(module.EventTypes.CurveUpdated, function(curve) {
				lstWgt.update(curve);
			});
	    }
	});
	
	return module;
})(editor || {})
