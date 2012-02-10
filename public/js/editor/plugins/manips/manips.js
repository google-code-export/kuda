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

	var shorthand = editor.tools.manips,
		_matrix = new THREE.Matrix4();
	
	shorthand.init = function() {
		var navPane =editor.ui.getNavPane('Behaviors'),
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
	 * A ManipsModel handles the creation, updating, and removal of Moveables
	 * and Turnables.
	 */
	var ManipsModel = function() {
		editor.ToolModel.call(this, 'manips');
		
		this.currentTransform = null;
		this.previewProps = {
			active: null,
			field: null,
			limits: null,
			transforms: [],
			type: null,
			vector: new THREE.Vector3()
		};
	};

	ManipsModel.prototype = new editor.ToolModel();
	ManipsModel.prototype.constructor = ManipsModel;
		
	ManipsModel.prototype.removeManip = function(manip) {
		this.notifyListeners(editor.events.Removing, manip);
		manip.cleanup();
	};
		
	ManipsModel.prototype.saveManip = function(props) {
		var transform = props.transforms[0],
			event = transform === this.currentTransform ? editor.events.Updated : editor.events.Created;

		this.stopPreview();
		applyManip(props);
		transform._manip.disable();
		this.notifyListeners(event, transform);
		this.setManip(null);
	};
		
	ManipsModel.prototype.setManip = function(transform) {
		this.stopPreview();
		this.currentTransform = transform;
		this.notifyListeners(editor.events.Editing, transform);
	};

	ManipsModel.prototype.startPreview = function(props) {
		this.stopPreview();

		var transform = props.transforms[0],
			manip = transform._manip
			prevProps = this.previewProps;
		
		switch (props.type) {
			case 'move':
				prevProps.vector.copy(transform.position);
				break;
			case 'turn':
				if (transform.useQuaternion) {
					_matrix.setRotationFromQuaternion(transform.quaternion);
					prevProps.vector.setRotationFromMatrix(_matrix);
				} else {
					prevProps.vector.copy(transform.rotation);
				}
				break;
			case 'resize':
				prevProps.vector.copy(transform.scale);
				break;
		}

		if (manip instanceof hemi.Movable) {
			prevProps.type = 'movable';
			prevProps.field = manip.getPlaneString();
			prevProps.limits = [manip.umin, manip.umax, manip.vmin, manip.vmax];
		} else if (manip instanceof hemi.Turnable) {
			prevProps.type = 'turnable';
			prevProps.field = manip.getAxisString();
			prevProps.limits = [manip.min, manip.max];
		} else if (manip instanceof hemi.Resizable) {
			prevProps.type = 'resizable';
			prevProps.field = manip.axis;
		}

		if (manip) {
			for (var i = 0, il = manip.transforms.length; i < il; ++i) {
				var tran = manip.transforms[i];

				if (tran !== transform) {
					prevProps.transforms.push(tran);
				}
			}
		}

		prevProps.active = transform;
		applyManip(props);
        transform._manip.enable();
		editor.client.camera.disableControl();
	};

	ManipsModel.prototype.stopPreview = function() {
		var prevProps = this.previewProps,
			transform = prevProps.active;

		if (transform) {
			// Undo any manipulation done in the preview
			var manip = transform._manip,
				transforms = manip.transforms;

			if (manip instanceof hemi.Movable) {
				var delta = prevProps.vector.subSelf(transform.position);

				for (var i = 0, il = transforms.length; i < il; ++i) {
					hemi.utils.worldTranslate(delta, transforms[i]);
				}
			} else if (manip instanceof hemi.Turnable) {
				for (var i = 0, il = transforms.length; i < il; ++i) {
					hemi.utils.worldRotate(manip.axis, manip._angle * -1, transforms[i]);
				}
			} else if (manip instanceof hemi.Resizable) {
				// TODO: We can't reverse until we track the amount scaling done by the Resizable
			}

			// Restore any previous manipulation
			switch (prevProps.type) {
				case 'movable':
					transform.setMovable(prevProps.field, prevProps.limits, prevProps.transforms);
					break;
				case 'turnable':
					transform.setTurnable(prevProps.field, prevProps.limits, prevProps.transforms);
					break;
				case 'resizable':
					transform.setResizable(prevProps.field, prevProps.transforms);
					break;
			}

			prevProps.active = null;
			prevProps.type = null;
			prevProps.transforms.length = 0;
			editor.client.camera.enableControl();
		}
	};
			
	ManipsModel.prototype.worldCleaned = function() {
		var transforms = [];
		
		THREE.SceneUtils.traverseHierarchy(editor.client.scene, function(transform) {
			transforms.push(transform);
		});
		
		for (var count = 0; count < transforms.length; ++count) {
			var current = transforms[count];
			if (current._manip) {
				this.notifyListeners(editor.events.Removing, current);
			}
		}
	};
		
	ManipsModel.prototype.worldLoaded = function() {
		var transforms = [];
		
		THREE.SceneUtils.traverseHierarchy(editor.client.scene, function(transform) {
			transforms.push(transform);
		});
		
		for (var count = 0; count < transforms.length; ++count) {
			var current = transforms[count];
			if (current._manip) {
				this.notifyListeners(editor.events.Created, current);
			}
		}
	};

	function applyManip(props) {
		if (props.transforms.length) {
			if (props.type == 'move') {
				props.transforms[0].setMovable(props.plane, props.limits, props.transforms.slice[1]);
			}
			else if (props.type == 'turn') {
				props.transforms[0].setTurnable(props.axis, props.limits, props.transforms.slice[1]);
			}
		}
	}


////////////////////////////////////////////////////////////////////////////////
//                     	   Create Manip Sidebar Widget                        //
//////////////////////////////////////////////////////////////////////////////// 
	var NO_TRANS = 'NONE_SELECTED';
	
	var CreateWidget = function() {
		editor.ui.FormWidget.call(this, {
			name: 'createMnpWidget',
			uiFile: 'js/editor/plugins/manips/html/manipsForms.htm'
		});
			
		this.inputsToCheck = [];
		this.transforms = [];
		this.tranList = {};
	};

	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;
		
	CreateWidget.prototype.addTransform = function(transform) {
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
	};
		
	CreateWidget.prototype.checkStatus = function() {
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
		
		if (isSafe) {
			saveBtn.removeAttr('disabled');
		} else {
			saveBtn.attr('disabled', 'disabled');
		}
	};
		
	CreateWidget.prototype.layout = function() {
		editor.ui.FormWidget.prototype.layout.call(this);
		
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
				case 'move':
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
				case hemi.Plane.XY:
					wgt.uMin.setName('x');
					wgt.vMin.setName('y');
					wgt.uMax.setName('x');
					wgt.vMax.setName('y');
					break;
				case hemi.Plane.XZ:
					wgt.uMin.setName('x');
					wgt.vMin.setName('z');
					wgt.uMax.setName('x');
					wgt.vMax.setName('z');
					break;
				case hemi.Plane.YZ:
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
	};
		
	CreateWidget.prototype.getProperties = function() {
		var typeSel = this.find('#mnpTypeSelect'),
			planeSel = this.find('#mnpPlaneSelect'),
			axisSel = this.find('#mnpAxisSelect'),
			props = {
				transforms: this.transforms,
				type: typeSel.val()
			};
		
		switch(props.type) {
			case 'move':
				props.limits = [this.uMin.getValue(), this.uMax.getValue(), this.vMin.getValue(),
					this.vMax.getValue()];
				props.plane = planeSel.val();
				break;
			case 'turn':
				props.limits = [this.axisMin.getValue(), this.axisMax.getValue()];
				props.axis = axisSel.val();
				break;
		}
		
		return props;
	};
		
	CreateWidget.prototype.removeTransform = function(transform) {
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
	};
	
	CreateWidget.prototype.reset = function() {
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
	};
		
	CreateWidget.prototype.resize = function(maxHeight) {
		this._super(maxHeight);	
		
		var form = this.find('form'),
			padding = parseInt(form.css('paddingTop')) + parseInt(form.css('paddingBottom')),
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
	};
		
	CreateWidget.prototype.setManip = function(transform) {
		var typeSel = this.find('#mnpTypeSelect'),
			planeSel = this.find('#mnpPlaneSelect'),
			axisSel = this.find('#mnpAxisSelect'),
			manip = transform._manip;

		if (manip instanceof hemi.Movable) {
			typeSel.val('move').change();
			planeSel.val(manip.getPlaneString()).change();
			
			this.uMin.setValue(manip.umin);
			this.vMin.setValue(manip.vmin);
			this.uMax.setValue(manip.umax);
			this.vMax.setValue(manip.vmax);
		} else if (manip instanceof hemi.Turnable) {
			typeSel.val('turn').change();
			axisSel.val(manip.getAxisString()).change();
			
			this.axisMin.setValue(manip.min);
			this.axisMax.setValue(manip.max);
		}
		
		this.checkStatus();
	};

////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////    

	/**
	 * The ManipsView controls the dialog and toolbar widget for the 
	 * manips tool.
	 */
	var ManipsView = function() {
		editor.ToolView.call(this, {
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
	};

	ManipsView.prototype = new editor.ToolView();
	ManipsView.prototype.constructor = ManipsView;

////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

	/**
	 * The ManipsController facilitates ManipsModel and ManipsView communication
	 * by binding event and message handlers.
	 */
	var ManipsController = function() {
		editor.ToolController.call(this);
		this.bound = false;
		this.bwrModel = null;
	};

	ManipsController.prototype = new editor.ToolController();
	ManipsController.prototype.constructor = ManipsController;
		
	ManipsController.prototype.setBrowserModel = function(model) {
		this.bwrModel = model;
		
		if (this.checkBindEvents()) {
			this.bindEvents();
		}
	};
		
	ManipsController.prototype.checkBindEvents = function() {
		return !this.bound && this.bwrModel && this.model && this.view;
	};
		
	ManipsController.prototype.bindEvents = function() {
		editor.ToolController.prototype.bindEvents.call(this);
		
		var model = this.model,
			bwrModel = this.bwrModel,
			view = this.view,
			crtWgt = view.sidePanel.createMnpWidget,
			lstWgt = view.sidePanel.mnpListWidget;
		
		// view events
		crtWgt.addListener(editor.events.Edit, function(transform) {
			model.setManip(transform);
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

		lstWgt.addListener(editor.events.Edit, function(transform) {
			model.setManip(transform);
		});
		lstWgt.addListener(editor.events.Remove, function(transform) {
			model.removeManip(transform);
		});
		
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode === editor.ToolConstants.MODE_DOWN;
			bwrModel.enableSelection(isDown);
		});
		
		// model events
		model.addListener(editor.events.Created, function(transform) {
			lstWgt.add(transform);
		});
		model.addListener(editor.events.Editing, function(transform) {
			bwrModel.deselectAll();
			bwrModel.enableSelection(true);
			
			if (transform != null) {
				crtWgt.setManip(transform);
				var trans = transform._manip.transforms;
				
				for (var ndx = 0, len = trans.length; ndx < len; ndx++) {
					bwrModel.selectTransform(trans[ndx]);
				}
			}
		});
		model.addListener(editor.events.Removing, function(transform) {
			lstWgt.remove(transform);
		});
		model.addListener(editor.events.Updated, function(transform) {
			editor.depends.reset(transform);
			lstWgt.update(transform);
		});

		// browser model events
		var browserEvents = editor.tools.browser.events;
		
		bwrModel.addListener(browserEvents.TransformDeselected, function(transform) {
			crtWgt.removeTransform(transform);
		});
		bwrModel.addListener(browserEvents.TransformSelected, function(transform) {
			crtWgt.addTransform(transform);
		});
	};
	
	return editor;
})(editor || {});