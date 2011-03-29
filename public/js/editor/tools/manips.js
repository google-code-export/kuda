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
	
	// view specific
	module.EventTypes.CreateManip = "Manip.CreateManip";
	module.EventTypes.RemoveManip = "Manip.RemoveManip";
	module.EventTypes.SaveManip = "Manip.SaveManip";
	module.EventTypes.SetManip = "Manip.SetManip";
	module.EventTypes.StartPreview = "Manip.StartPreview";
	module.EventTypes.StopPreview = "Manip.StopPreview";
	
	// model specific
	module.EventTypes.ManipCreated = "Manip.ManipCreated";
	module.EventTypes.ManipRemoved = "Manip.ManipRemoved";
	module.EventTypes.ManipUpdated = "Manip.ManipUpdated";
	module.EventTypes.ManipSet = "Manip.ManipSet";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
    /**
     * A ManipsModel handles the creation, updating, and removal of Draggables
     * and Turnables.
     */
    module.tools.ManipsModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			
			this.currentManip = null;
			this.previewManip = null;
	    },
		
		removeManip: function(manip) {
			manip.cleanup();
			this.notifyListeners(module.EventTypes.ManipRemoved, manip);
		},
		
		saveManip: function(props) {
			var manip = this.currentManip,
				currentType = null,
				event;
			
			if (manip instanceof hemi.manip.Draggable) {
				currentType = 'drag';
			} else if (manip instanceof hemi.manip.Turnable) {
				currentType = 'turn';
			}
			
			if (currentType !== props.type) {
				if (manip !== null) {
					this.removeManip(manip);
				}
				
				if (props.type === 'drag') {
					manip = new hemi.manip.Draggable();
				} else {
					manip = new hemi.manip.Turnable();
				}
				
				event = module.EventTypes.ManipCreated;
			} else {
				manip.clearLimits();
				manip.clearTransforms();
				event = module.EventTypes.ManipUpdated;
			}
			
			if (props.axis != null) {
				manip.setAxis(props.axis);
			}
			if (props.plane != null) {
				manip.setPlane(props.plane);
			}
			if (props.limits != null) {
				manip.setLimits(props.limits);
			}
			
            for (var ndx = 0, len = props.transforms.length; ndx < len; ndx++) {
				manip.addTransform(props.transforms[ndx]);
			}
			
			manip.name = props.name;
			manip.disable();
			this.notifyListeners(event, manip);
			this.setManip(null);
		},
		
		setManip: function(manip) {
			this.stopPreview();
			this.currentManip = manip;
			this.notifyListeners(module.EventTypes.ManipSet, manip);
		},
		
		startPreview: function(props) {
			if (this.previewManip !== null) {
				this.previewManip.cleanup();
			}
			if (!this.savedMatrices) {
				this.savedMatrices = [];
				this.props = props;
				var list = props.transforms,
					mCopy = hemi.core.math.copyMatrix;
				
				for (var ndx = 0, len = list.length; ndx < len; ndx++) {
					var m = mCopy(list[ndx].localMatrix);
					this.savedMatrices.push(m);
				}
			}
			
			if (props.type === 'drag') {
				this.previewManip = new hemi.manip.Draggable();
			} else {
				this.previewManip = new hemi.manip.Turnable();
			}
			
			if (props.axis != null) {
				this.previewManip.setAxis(props.axis);
			}
			if (props.plane != null) {
				this.previewManip.setPlane(props.plane);
			}
			if (props.limits != null) {
				this.previewManip.setLimits(props.limits);
			}
			
            for (var ndx = 0, len = props.transforms.length; ndx < len; ndx++) {
				this.previewManip.addTransform(props.transforms[ndx]);
			}
			
			this.previewManip.name = module.tools.ToolConstants.EDITOR_PREFIX + 'PreviewManip';
			hemi.world.camera.disableControl();
		},
		
		stopPreview: function() {
			if (this.previewManip !== null) {
				this.previewManip.cleanup();
				this.previewManip = null;
			}
			if (this.savedMatrices) {
				var list = this.savedMatrices;
				
				for (var ndx = 0, len = list.length; ndx < len; ndx++) {
					var m = list[ndx];
					this.props.transforms[ndx].localMatrix = m;
				}
				
				this.savedMatrices = null;
				this.props = null;
			}
			hemi.world.camera.enableControl();
		},
			
		worldCleaned: function() {
			var drags = hemi.world.getDraggables(),
				turns = hemi.world.getTurnables();
			
			for (var i = 0, il = drags.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.ManipRemoved, drags[i]);
			}
			for (var i = 0, il = turns.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.ManipRemoved, turns[i]);
			}
	    },
	    
	    worldLoaded: function() {
			var drags = hemi.world.getDraggables(),
				turns = hemi.world.getTurnables();
			
			for (var i = 0, il = drags.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.ManipCreated, drags[i]);
			}
			for (var i = 0, il = turns.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.ManipCreated, turns[i]);
			}
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                     	   Create Manip Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
		
	/*
	 * Configuration object for the CreateMnpSBWidget.
	 */
	module.tools.CreateMnpSBWidgetDefaults = {
		name: 'createManipSBWidget',
		uiFile: 'js/editor/tools/html/manipsForms.htm',
		manualVisible: true
	};
	
	module.tools.CreateMnpSBWidget = module.ui.SidebarWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.CreateMnpSBWidgetDefaults, options);
		    this._super(newOpts);
				
			this.inputsToCheck = [];
			this.previewing = false;
			this.transforms = [];
		},
		
		addTransform: function(transform) {
			var ndx = this.transforms.indexOf(transform);
			
			if (ndx === -1) {
				this.transforms.push(transform);
				this.checkStatus();
			}
		},
		
		checkStatus: function() {
			var list = this.inputsToCheck,
				nameInput = this.find('#mnpName'),
				prevStartBtn = this.find('#mnpPrevStartBtn'),
				prevStopBtn = this.find('#mnpPrevStopBtn'),
				saveBtn = this.find('#mnpSaveBtn'),
				isSafe = this.transforms.length > 0 && list.length > 0;
			
			for (var ndx = 0, len = list.length && isSafe; ndx < len; ndx++) {
				isSafe = list[ndx].val() !== '-1';
			}
			
			if (this.previewing) {
				prevStopBtn.removeAttr('disabled');
			} else {
				prevStopBtn.attr('disabled', 'disabled');
			}
			
			if (isSafe && !this.previewing) {
				prevStartBtn.removeAttr('disabled');
			} else {
				prevStartBtn.attr('disabled', 'disabled');
			}
			
			if (isSafe && nameInput.val() !== '') {
				saveBtn.removeAttr('disabled');
			} else {
				saveBtn.attr('disabled', 'disabled');
			}
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				typeSel = this.find('#mnpTypeSelect'),
				planeSel = this.find('#mnpPlaneSelect'),
				uMin = this.find('#mnpPlaneMinU'),
				vMin = this.find('#mnpPlaneMinV'),
				uMax = this.find('#mnpPlaneMaxU'),
				vMax = this.find('#mnpPlaneMaxV'),
				axisSel = this.find('#mnpAxisSelect'),
				axisMin = this.find('#mnpAxisMin'),
				axisMax = this.find('#mnpAxisMax'),
				saveBtn = this.find('#mnpSaveBtn'),
				cancelBtn = this.find('#mnpCancelBtn'),
				nameInput = this.find('#mnpName'),
				prevStartBtn = this.find('#mnpPrevStartBtn'),
				prevStopBtn = this.find('#mnpPrevStopBtn'),
				optionalInputs = this.find('.optional'),
				wgt = this;
				
			// hide optional inputs
			optionalInputs.parent().hide();
			
			// bind type selection
			typeSel.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					inputs = [];
				
				planeSel.val(-1).parent().hide();
				uMin.val('').parent().hide();
				vMin.val('');
				uMax.val('');
				vMax.val('');
				axisSel.val(-1).parent().hide();
				axisMin.val('').parent().hide();
				axisMax.val('');
				
				// switch between shapes
				switch(val) {
					case 'drag':
						planeSel.parent().show();
						uMin.parent().show();
						inputs.push(planeSel);
						break;
					case 'turn':
						axisSel.parent().show();
						axisMin.parent().show();
						inputs.push(axisSel);
						break;
				}
				
				wgt.inputsToCheck = inputs;
				wgt.checkStatus();
				wgt.invalidate();
			});
			
			// bind plane selection
			planeSel.bind('change', function(evt) {
				var val = jQuery(this).val();
				
				switch(val) {
					case hemi.manip.Plane.XY:
						uMin.attr('ndx', 'x').focus().blur();
						uMax.attr('ndx', 'x').focus().blur();
						vMin.attr('ndx', 'y').focus().blur();
						vMax.attr('ndx', 'y').focus().blur();
						break;
					case hemi.manip.Plane.XZ:
						uMin.attr('ndx', 'x').focus().blur();
						uMax.attr('ndx', 'x').focus().blur();
						vMin.attr('ndx', 'z').focus().blur();
						vMax.attr('ndx', 'z').focus().blur();
						break;
					case hemi.manip.Plane.YZ:
						uMin.attr('ndx', 'z').focus().blur();
						uMax.attr('ndx', 'z').focus().blur();
						vMin.attr('ndx', 'y').focus().blur();
						vMax.attr('ndx', 'y').focus().blur();
						break;
				}
				
				wgt.checkStatus();
			});
			
			// bind axis selection
			axisSel.bind('change', function(evt) {
				wgt.checkStatus();
			});
			
			nameInput.bind('keyup', function(evt) {
				wgt.checkStatus();
			});
			
			saveBtn.bind('click', function(evt) {
				var props = wgt.getProperties();
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.SaveManip, props);
			})
			.attr('disabled', 'disabled');
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(module.EventTypes.SetManip, null);
			});
			
			prevStartBtn.bind('click', function(evt) {
				wgt.previewing = true;
				wgt.checkStatus();
				var props = wgt.getProperties();
				wgt.notifyListeners(module.EventTypes.StartPreview, props);
			})
			.attr('disabled', 'disabled');
			
			prevStopBtn.bind('click', function(evt) {
				wgt.previewing = false;
				wgt.checkStatus();
				wgt.notifyListeners(module.EventTypes.StopPreview, null);
			})
			.attr('disabled', 'disabled');
			
			form.submit(function(evt) {
				return false;
			});
			
			this.setupAutoFills();
		},
		
		getProperties: function() {
			var typeSel = this.find('#mnpTypeSelect'),
				planeSel = this.find('#mnpPlaneSelect'),
				uMin = this.find('#mnpPlaneMinU'),
				vMin = this.find('#mnpPlaneMinV'),
				uMax = this.find('#mnpPlaneMaxU'),
				vMax = this.find('#mnpPlaneMaxV'),
				axisSel = this.find('#mnpAxisSelect'),
				axisMin = this.find('#mnpAxisMin'),
				axisMax = this.find('#mnpAxisMax'),
				nameInput = this.find('#mnpName'),
				props = {
					name: nameInput.val(),
					transforms: this.transforms,
					type: typeSel.val()
				};
			
			switch(props.type) {
				case 'drag':
					var min = [],
						max = [],
						val;
					
					val = uMin.focus().val();
					uMin.blur();
					min[0] = val === '' ? null : parseFloat(val);
					val = vMin.focus().val();
					vMin.blur();
					min[1] = val === '' ? null : parseFloat(val);
					val = uMax.focus().val();
					uMax.blur();
					max[0] = val === '' ? null : parseFloat(val);
					val = vMax.focus().val();
					vMax.blur();
					max[1] = val === '' ? null : parseFloat(val);
					
					props.limits = [min, max];
					props.plane = planeSel.val();
					break;
				case 'turn':
					var hMath = hemi.core.math,
						min, max, val;
					
					val = axisMin.val();
					min = val === '' ? null : hMath.degToRad(parseFloat(val));
					val = axisMax.val();
					max = val === '' ? null : hMath.degToRad(parseFloat(val));
					
					props.limits = [min, max];
					props.axis = axisSel.val();
					break;
			}
			
			return props;
		},
		
		removeTransform: function(transform) {
			var ndx = this.transforms.indexOf(transform);
			
			if (ndx !== -1) {
				this.transforms.splice(ndx, 1);
				this.checkStatus();
			}
		},
		
		reset: function() {
			this.previewing = false;
			
			// hide optional inputs
			this.find('.optional').parent().hide();
			
			// reset selects
			this.find('form select').val(-1);
			
			// set all inputs to blank
			this.find('form input').val('');
			
			// reset the hints
			this.find('input.vector').addClass('vectorHelper');
						
			// disable the save and preview buttons
			this.find('#mnpSaveBtn').attr('disabled', 'disabled');
			this.find('#mnpPrevStartBtn').attr('disabled', 'disabled');
			this.find('#mnpPrevStopBtn').attr('disabled', 'disabled');
		},
		
		resize: function(maxHeight) {
			this._super(maxHeight);	
			
			var form = this.find('form'),
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
				this.find('form').height(newHeight);
			}
		},
		
		setManip: function(manip) {
			var typeSel = this.find('#mnpTypeSelect'),
				planeSel = this.find('#mnpPlaneSelect'),
				uMin = this.find('#mnpPlaneMinU'),
				vMin = this.find('#mnpPlaneMinV'),
				uMax = this.find('#mnpPlaneMaxU'),
				vMax = this.find('#mnpPlaneMaxV'),
				axisSel = this.find('#mnpAxisSelect'),
				axisMin = this.find('#mnpAxisMin'),
				axisMax = this.find('#mnpAxisMax'),
				nameInput = this.find('#mnpName');
			
			if (manip instanceof hemi.manip.Draggable) {
				var planeStr = hemi.manip.Plane.get(manip.plane);
				typeSel.val('drag').change();
				planeSel.val(planeStr).change();
				
				if (manip.umin != null) {
					uMin.val(manip.umin).keydown();
				}
				if (manip.vmin != null) {
					vMin.val(manip.vmin).keydown();
				}
				if (manip.umax != null) {
					uMax.val(manip.umax).keydown();
				}
				if (manip.vmax != null) {
					vMax.val(manip.vmax).keydown();
				}
			} else if (manip instanceof hemi.manip.Turnable) {
				var hMath = hemi.core.math;
				typeSel.val('turn').change();
				axisSel.val(manip.axis).change();
				
				if (manip.min != null) {
					var min = hMath.radToDeg(manip.min);
					axisMin.val(min).keydown();
				}
				if (manip.max != null) {
					var max = hMath.radToDeg(manip.max);
					axisMax.val(max).keydown();
				}
			}
			
			nameInput.val(manip.name).keyup();
		},
	
		setupAutoFills: function() {
			var vectors = this.find('input.vector'),
				wgt = this;
						
			// setup autofills for vectors
			vectors.bind('keydown', function(evt) {
				var elem = jQuery(this);
				elem.removeClass('vectorHelper');
			})
			.bind('blur', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					ndx = elem.attr('ndx');
				
				if (val === '' && ndx != null) {
					elem.val(ndx).addClass('vectorHelper');
				}
			})
			.bind('focus', function(evt) {
				var elem = jQuery(this),
					val = elem.val();
				if (val === 'x' || val === 'y' || val === 'z') {
					elem.val('');
				}
			})
			.addClass('vectorHelper');
		}
	});

////////////////////////////////////////////////////////////////////////////////
//                             MnpListSBWidget                                //
////////////////////////////////////////////////////////////////////////////////    

	/*
	 * Configuration object for the MnpListSBWidget.
	 */
	module.tools.MnpListSBWidgetDefaults = {
		name: 'mnpListSBWidget',
		listId: 'manipList',
		prefix: 'mnpLst',
		title: 'Manipulations',
		instructions: "Click 'Create Manipulation' to create a new manipulatable transform."
	};
	
	module.tools.MnpListSBWidget = module.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, module.tools.MnpListSBWidgetDefaults, options);
		    this._super(newOpts);
		},
		
		layoutExtra: function() {
			this.form = jQuery('<form method="post" action=""></form>');
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createManip" disabled="">Create Manipulation</button>');
			var wgt = this;
			
			this.form.submit(function() {return false;});
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.CreateManip, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			this.form.append(this.buttonDiv);
			
			return this.form;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var manip = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.SetManip, manip);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var manip = li.getAttachedObject();
				wgt.notifyListeners(module.EventTypes.RemoveManip, manip);
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
     * Configuration object for the ManipsView.
     */
    module.tools.ManipsViewDefaults = {
        toolName: 'Manipulations',
		toolTip: 'Manipulations: Create and edit manipulatable transforms',
		widgetId: 'manipsBtn',
		axnBarId: 'mnpActionBar'
    };
    
    /**
     * The ManipsView controls the dialog and toolbar widget for the 
     * manips tool.
     * 
     * @param {Object} options configuration options.  Uses 
     *         editor.tools.ManipsViewDefaults as default options
     */
    module.tools.ManipsView = module.tools.ToolView.extend({
		init: function(options) {
	        var newOpts = jQuery.extend({}, module.tools.ManipsViewDefaults, options);
	        this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.CreateMnpSBWidget());
			this.addSidebarWidget(new module.tools.MnpListSBWidget());
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ManipsController facilitates ManipsModel and ManipsView communication
     * by binding event and message handlers.
     */
    module.tools.ManipsController = module.tools.ToolController.extend({
		init: function() {
			this._super();
		},
		
		setSelectorModel: function(model) {
			this.selModel = model;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		checkBindEvents: function() {
			return this.selModel && this.model && this.view;
		},
		
		bindEvents: function() {
			this._super();
			
			var model = this.model,
				selModel = this.selModel,
				view = this.view,
				crtWgt = view.createManipSBWidget,
				mnpWgt = view.mnpListSBWidget;
			
			// view events
			crtWgt.addListener(module.EventTypes.SaveManip, function(props) {
				model.saveManip(props);
			});
			
			crtWgt.addListener(module.EventTypes.SetManip, function(manip) {
				model.setManip(manip);
			});
			
			crtWgt.addListener(module.EventTypes.StartPreview, function(props) {
				selModel.enableSelection(false);
				model.startPreview(props);
			});
			
			crtWgt.addListener(module.EventTypes.StopPreview, function(value) {
				selModel.enableSelection(true);
				model.stopPreview();
			});
			
			mnpWgt.addListener(module.EventTypes.CreateManip, function(transforms) {
				crtWgt.setVisible(true);
				mnpWgt.setVisible(false);
			});
			
			mnpWgt.addListener(module.EventTypes.RemoveManip, function(manip) {
				model.removeManip(manip);
			});
			
			mnpWgt.addListener(module.EventTypes.SetManip, function(manip) {
				model.setManip(manip);
			});
			
			view.addListener(module.EventTypes.ToolModeSet, function(value) {
				var isDown = value.newMode === module.tools.ToolConstants.MODE_DOWN;
				selModel.enableSelection(isDown);
			});
			
			// model events
			model.addListener(module.EventTypes.ManipCreated, function(manip) {
				mnpWgt.add(manip);
			});
			
			model.addListener(module.EventTypes.ManipRemoved, function(manip) {
				mnpWgt.remove(manip);
			});
			
			model.addListener(module.EventTypes.ManipSet, function(manip) {
				selModel.deselectAll();
				selModel.enableSelection(true);
				
				if (manip === null) {
					crtWgt.setVisible(false);
					mnpWgt.setVisible(true);
				} else {
					crtWgt.setManip(manip);
					crtWgt.setVisible(true);
					mnpWgt.setVisible(false);
					var trans = manip.getTransforms();
					
					for (var ndx = 0, len = trans.length; ndx < len; ndx++) {
						selModel.selectTransform(trans[ndx]);
					}
				}
			});
			
			model.addListener(module.EventTypes.ManipUpdated, function(manip) {
				mnpWgt.update(manip);
			});
			
			selModel.addListener(module.EventTypes.TransformDeselected, function(transform) {
				crtWgt.removeTransform(transform);
				
				if (crtWgt.transforms.length === 0) {
					mnpWgt.createBtn.attr('disabled', 'disabled');
				}
			});
			
			selModel.addListener(module.EventTypes.TransformSelected, function(transform) {
				crtWgt.addTransform(transform);
				mnpWgt.createBtn.removeAttr('disabled');
			});
		}
	});
    
    return module;
})(editor || {});