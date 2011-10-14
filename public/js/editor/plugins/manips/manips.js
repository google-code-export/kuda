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

(function() {

////////////////////////////////////////////////////////////////////////////////
//								Initialization								  //
////////////////////////////////////////////////////////////////////////////////

	var shorthand = editor.tools.manips;
	
	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Behaviors'),
			mnpMdl = new ManipsModel(),
			mnpView = new ManipsView(),
			mnpCtr = new ManipsController();
		
		mnpCtr.setModel(mnpMdl);
		mnpCtr.setView(mnpView);
		
		navPane.add(mnpView);
		
		var model = editor.getModel('browser');
		
		if (model) {
			mnpCtr.setBrowserModel(model);
		} else {
			editor.addListener(editor.events.PluginLoaded, function(name) {
				if (name === 'browser' && !mnpCtr.bound) {
					mnpCtr.setBrowserModel(editor.getModel(name));
				}
			});
		}
	};

////////////////////////////////////////////////////////////////////////////////
//								Tool Definition								  //
////////////////////////////////////////////////////////////////////////////////

	shorthand.events = {
		// view specific
		SaveManip: "Manip.SaveManip",
		StartPreview: "Manip.StartPreview",
		StopPreview: "Manip.StopPreview"
	};
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////
    
	/**
     * A ManipsModel handles the creation, updating, and removal of Draggables
     * and Turnables.
     */
    var ManipsModel = editor.ToolModel.extend({
		init: function() {
			this._super('manips');
			
			this.currentManip = null;
			this.previewManip = null;
	    },
		
		removeManip: function(manip) {
			this.notifyListeners(editor.events.Removing, manip);
			manip.cleanup();
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
				
				event = editor.events.Created;
			} else {
				manip.clearLimits();
				manip.clearTransforms();
				event = editor.events.Updated;
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
			this.notifyListeners(editor.events.Editing, manip);
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
			
			this.previewManip.name = editor.ToolConstants.EDITOR_PREFIX + 'PreviewManip';
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
					var tran = this.props.transforms[ndx];
					
					if (!hemi.utils.isAnimated(tran)) {
						tran.localMatrix = list[ndx];
					}
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
				this.notifyListeners(editor.events.Removing, drags[i]);
			}
			for (var i = 0, il = turns.length; i < il; i++) {
				this.notifyListeners(editor.events.Removing, turns[i]);
			}
	    },
	    
	    worldLoaded: function() {
			var drags = hemi.world.getDraggables(),
				turns = hemi.world.getTurnables();
			
			for (var i = 0, il = drags.length; i < il; i++) {
				this.notifyListeners(editor.events.Created, drags[i]);
			}
			for (var i = 0, il = turns.length; i < il; i++) {
				this.notifyListeners(editor.events.Created, turns[i]);
			}
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                     	   Create Manip Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
	var NO_TRANS = 'NONE_SELECTED';
    
	var CreateWidget = editor.ui.FormWidget.extend({
		init: function() {
			this._super({
				name: 'createMnpWidget',
				uiFile: 'js/editor/plugins/manips/html/manipsForms.htm'
			});
				
			this.inputsToCheck = [];
			this.transforms = [];
			this.tranList = {};
		},
		
		addTransform: function(transform) {
			var ndx = this.transforms.indexOf(transform);
			
			if (ndx === -1) {
				var name = transform.name,
					li = this.tranList[name],
					ol = this.find('#mnpTranList');
				
				if (li == null) {
					this.tranList[name] = li = jQuery('<li><label>' + name + '</label></li>');
				}
				if (this.transforms.length === 0) {
					this.tranList[NO_TRANS].detach();
				}
				
				ol.append(li);
				this.transforms.push(transform);
				this.checkStatus();
			}
		},
		
		checkStatus: function() {
			var list = this.inputsToCheck,
				prevBtn = this.find('#mnpPrevBtn'),
				saveBtn = this.find('#mnpSaveBtn'),
				isSafe = this.transforms.length > 0 && list.length > 0;
			
			for (var ndx = 0, len = list.length && isSafe; ndx < len; ndx++) {
				isSafe = list[ndx].val() !== '-1';
			}
			
			if (isSafe) {
				prevBtn.removeAttr('disabled');
			} else {
				prevBtn.attr('disabled', 'disabled');
			}
			
			if (isSafe && this.nameInput.getValue() != null) {
				saveBtn.removeAttr('disabled');
			} else {
				saveBtn.attr('disabled', 'disabled');
			}
		},
		
		layout: function() {
			this._super();
			
			var form = this.find('form'),
				typeSel = this.find('#mnpTypeSelect'),
				axisSel = this.find('#mnpAxisSelect'),
				axMin = this.find('#mnpAxisMin'),
				axMax = this.find('#mnpAxisMax'),
				planeSel = this.find('#mnpPlaneSelect'),
				planeMin = this.find('#mnpPlaneMinDiv'),
				planeMax = this.find('#mnpPlaneMaxDiv'),
				saveBtn = this.find('#mnpSaveBtn'),
				cancelBtn = this.find('#mnpCancelBtn'),
				prevBtn = this.find('#mnpPrevBtn'),
				ol = this.find('#mnpTranList'),
				optionalInputs = this.find('.optional'),
				validator = editor.ui.createDefaultValidator(),
				wgt = this;

			this.axisMin = new editor.ui.Input({
				validator: validator,
				type: 'angle'
			});
			this.axisMax = new editor.ui.Input({
				validator: validator,
				type: 'angle'
			});
			this.uMin = new editor.ui.Input({
				validator: validator,
				inputClass: 'vector'
			});
			this.vMin = new editor.ui.Input({
				validator: validator,
				inputClass: 'vector'
			});
			this.uMax = new editor.ui.Input({
				validator: validator,
				inputClass: 'vector'
			});
			this.vMax = new editor.ui.Input({
				validator: validator,
				inputClass: 'vector'
			});
			this.nameInput = new editor.ui.Input({
				container: wgt.find('#mnpName'),
				type: 'string'
			});
			
			axMin.append(this.axisMin.getUI());
			axMax.append(this.axisMax.getUI());
			planeMin.append(this.uMin.getUI()).append(this.vMin.getUI());
			planeMax.append(this.uMax.getUI()).append(this.vMax.getUI());
			
			this.tranList[NO_TRANS] = jQuery('<li><label>None selected</label></li>');
			ol.append(this.tranList[NO_TRANS]);
			
			// hide optional inputs
			optionalInputs.parent().hide();
			
			// bind type selection
			typeSel.bind('change', function(evt) {
				var elem = jQuery(this),
					val = elem.val(),
					inputs = [];
				
				planeSel.val(-1).parent().hide();
				wgt.uMin.reset();
				wgt.uMax.reset();
				wgt.vMin.reset();
				wgt.vMax.reset();
				planeMin.parent().hide();
				axisSel.val(-1).parent().hide();
				wgt.axisMin.reset();
				wgt.axisMax.reset();
				axMin.parent().hide();
				
				// switch between shapes
				switch(val) {
					case 'drag':
						planeSel.parent().show();
						planeMin.parent().show();
						inputs.push(planeSel);
						break;
					case 'turn':
						axisSel.parent().show();
						axMin.parent().show();
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
						wgt.uMin.setName('x');
						wgt.vMin.setName('y');
						wgt.uMax.setName('x');
						wgt.vMax.setName('y');
						break;
					case hemi.manip.Plane.XZ:
						wgt.uMin.setName('x');
						wgt.vMin.setName('z');
						wgt.uMax.setName('x');
						wgt.vMax.setName('z');
						break;
					case hemi.manip.Plane.YZ:
						wgt.uMin.setName('z');
						wgt.vMin.setName('y');
						wgt.uMax.setName('z');
						wgt.vMax.setName('y');
						break;
				}
				
				wgt.checkStatus();
			});
			
			// bind axis selection
			axisSel.bind('change', function(evt) {
				wgt.checkStatus();
			});
			
			this.nameInput.getUI().bind('keyup', function(evt) {
				wgt.checkStatus();
			});
			
			saveBtn.bind('click', function(evt) {
				var props = wgt.getProperties();
				wgt.reset();
				wgt.notifyListeners(shorthand.events.SaveManip, props);
			})
			.attr('disabled', 'disabled');
			
			cancelBtn.bind('click', function(evt) {
				wgt.reset();
				wgt.notifyListeners(editor.events.Edit, null);
				wgt.invalidate();
			});
			
			prevBtn.bind('click', function(evt) {
				var btn = jQuery(this);
				
				if (btn.data('previewing')) {
	            	wgt.notifyListeners(shorthand.events.StopPreview, null);
					btn.text('Start Preview').data('previewing', false);
				} else {
					var props = wgt.getProperties();
					wgt.notifyListeners(shorthand.events.StartPreview, props);
					btn.text('Stop Preview').data('previewing', true);
				}
	        }).data('previewing', false);
			
			form.submit(function(evt) {
				return false;
			});
		},
		
		getProperties: function() {
			var typeSel = this.find('#mnpTypeSelect'),
				planeSel = this.find('#mnpPlaneSelect'),
				axisSel = this.find('#mnpAxisSelect'),
				name = this.nameInput.getValue(),
				props = {
					name: name,
					transforms: this.transforms,
					type: typeSel.val()
				};
			
			switch(props.type) {
				case 'drag':
					var min = [this.uMin.getValue(), this.vMin.getValue()],
						max = [this.uMax.getValue(), this.vMax.getValue()];
					
					props.limits = [min, max];
					props.plane = planeSel.val();
					break;
				case 'turn':
					props.limits = [this.axisMin.getValue(), this.axisMax.getValue()];
					props.axis = axisSel.val();
					break;
			}
			
			return props;
		},
		
		removeTransform: function(transform) {
			var ndx = this.transforms.indexOf(transform);
			
			if (ndx !== -1) {
				this.tranList[transform.name].detach();
				
				if (this.transforms.length === 1) {
					var ol = this.find('#mnpTranList');
					ol.append(this.tranList[NO_TRANS]);
				}
				
				this.transforms.splice(ndx, 1);
				this.checkStatus();
			}
		},
		
		reset: function() {
			// hide optional inputs
			this.find('.optional').parent().hide();
			
			// reset selects
			this.find('form select').val(-1);
			
			// set all inputs to blank
			this.find('form input').val('');
						
			// disable the save and preview buttons
			this.find('#mnpSaveBtn').attr('disabled', 'disabled');
			this.find('#mnpPrevBtn').attr('disabled', 'disabled')
				.text('Start Preview')
				.data('previewing', false);
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
				axisSel = this.find('#mnpAxisSelect');
			
			if (manip instanceof hemi.manip.Draggable) {
				var planeStr = hemi.manip.Plane.get(manip.plane);
				typeSel.val('drag').change();
				planeSel.val(planeStr).change();
				
				this.uMin.setValue(manip.umin);
				this.vMin.setValue(manip.vmin);
				this.uMax.setValue(manip.umax);
				this.vMax.setValue(manip.vmax);
			} else if (manip instanceof hemi.manip.Turnable) {
				typeSel.val('turn').change();
				axisSel.val(manip.axis).change();
				
				this.axisMin.setValue(manip.min);
				this.axisMax.setValue(manip.max);
			}
			
			this.nameInput.setValue(manip.name);
			this.checkStatus();
		}
	});

////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

    /**
     * The ManipsView controls the dialog and toolbar widget for the 
     * manips tool.
     */
    var ManipsView = editor.ToolView.extend({
		init: function() {
	        this._super({
	            toolName: 'Manipulations',
	    		toolTip: 'Create and edit manipulatable transforms',
	    		id: 'manips'
	        });
	        
	        this.addPanel(new editor.ui.Panel({
				name: 'sidePanel',
				classes: ['mnpSidePanel']
			}));
			
			this.sidePanel.addWidget(new CreateWidget());
			this.sidePanel.addWidget(new editor.ui.ListWidget({
				name: 'mnpListWidget',
				listId: 'manipList',
				prefix: 'mnpLst',
				title: 'Manipulations',
				instructions: "Add manipulations above."
			}));
	    }
	});

////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The ManipsController facilitates ManipsModel and ManipsView communication
     * by binding event and message handlers.
     */
    var ManipsController = editor.ToolController.extend({
    	init: function() {
			this._super();
			this.bound = false;
			this.bwrModel = null;
		},
		
		setBrowserModel: function(model) {
			this.bwrModel = model;
			
			if (this.checkBindEvents()) {
				this.bindEvents();
			}
		},
		
		checkBindEvents: function() {
			return !this.bound && this.bwrModel && this.model && this.view;
		},
		
		bindEvents: function() {
			this._super();
			
			var model = this.model,
				bwrModel = this.bwrModel,
				view = this.view,
				crtWgt = view.sidePanel.createMnpWidget,
				lstWgt = view.sidePanel.mnpListWidget;
			
			// view events
			crtWgt.addListener(editor.events.Edit, function(manip) {
				model.setManip(manip);
			});
			crtWgt.addListener(shorthand.events.SaveManip, function(props) {
				model.saveManip(props);
			});
			crtWgt.addListener(shorthand.events.StartPreview, function(props) {
				bwrModel.enableSelection(false);
				model.startPreview(props);
			});
			crtWgt.addListener(shorthand.events.StopPreview, function(value) {
				bwrModel.enableSelection(true);
				model.stopPreview();
			});

			lstWgt.addListener(editor.events.Edit, function(manip) {
				model.setManip(manip);
			});
			lstWgt.addListener(editor.events.Remove, function(manip) {
				model.removeManip(manip);
			});
			
			view.addListener(editor.events.ToolModeSet, function(value) {
				var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
				bwrModel.enableSelection(isDown);
			});
			
			// model events
			model.addListener(editor.events.Created, function(manip) {
				var trans = manip.getTransforms();
				
				for (var i = 0, il = trans.length; i < il; ++i) {
					var id = trans[i].getParam('ownerId').value,
						model = hemi.world.getCitizenById(id);
					
					editor.depends.add(manip, model);
				}
				
				lstWgt.add(manip);
			});
			model.addListener(editor.events.Editing, function(manip) {
				bwrModel.deselectAll();
				bwrModel.enableSelection(true);
				
				if (manip != null) {
					crtWgt.setManip(manip);
					var trans = manip.getTransforms();
					
					for (var ndx = 0, len = trans.length; ndx < len; ndx++) {
						bwrModel.selectTransform(trans[ndx]);
					}
				}
			});
			model.addListener(editor.events.Removing, function(manip) {
				var trans = manip.getTransforms();
				
				for (var i = 0, il = trans.length; i < il; ++i) {
					var id = trans[i].getParam('ownerId').value,
						model = hemi.world.getCitizenById(id);
					
					editor.depends.remove(manip, model);
				}
				
				lstWgt.remove(manip);
			});
			model.addListener(editor.events.Updated, function(manip) {
				editor.depends.reset(manip);
				var trans = manip.getTransforms();
				
				for (var i = 0, il = trans.length; i < il; ++i) {
					var id = trans[i].getParam('ownerId').value,
						model = hemi.world.getCitizenById(id);
					
					editor.depends.add(manip, model);
				}
				
				lstWgt.update(manip);
			});

			// browser model events
			var browserEvents = editor.tools.browser.events;
			
			bwrModel.addListener(browserEvents.TransformDeselected, function(transform) {
				crtWgt.removeTransform(transform);
			});
			bwrModel.addListener(browserEvents.TransformSelected, function(transform) {
				crtWgt.addTransform(transform);
			});
		}
	});
    
    return editor;
})(editor || {});