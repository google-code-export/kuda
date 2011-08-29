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
	
	// model specific
    editor.EventTypes.CurveCreated = "Curves.CurveCreated";
    editor.EventTypes.CurveRemoved = "Curves.CurveRemoved";
    editor.EventTypes.CurveUpdated = "Curves.CurveUpdated";
    editor.EventTypes.CurveSet = "Curves.CurveSet";
    editor.EventTypes.BoxAdded = "Curves.BoxAdded";
    editor.EventTypes.BoxSelected = "Curves.BoxSelected";
    editor.EventTypes.BoxRemoved = "Curves.BoxRemoved";
    editor.EventTypes.BoxUpdated = "Curves.BoxUpdated";
    editor.EventTypes.CurveWorldCleaned = "Curves.CurveWorldCleaned";
	
	// view specific
	editor.EventTypes.BoxManipState = "Curves.BoxManipState";
	
	// curve list widget specific
	editor.EventTypes.CreateCurve = "Curves.CreateCurve";
	editor.EventTypes.EditCurve = "Curves.EditCurve";
	editor.EventTypes.RemoveCurve = "Curves.RemoveCurve";
	
	// curve edit widget specific
	editor.EventTypes.SetParam = "Curves.SetParam";
	editor.EventTypes.AddBox = "Curves.AddBox";
	editor.EventTypes.RemoveBox = "Curves.RemoveBox";
	editor.EventTypes.UpdateBox = "Curves.UpdateBox";
	editor.EventTypes.UpdateBoxes = "Curves.UpdateBoxes";
	editor.EventTypes.StartPreview = "Curves.StartPreview";
	editor.EventTypes.StopPreview = "Curves.StopPreview";
	editor.EventTypes.SetCurveColor = "Curves.SetCurveColor";
	editor.EventTypes.Cancel = "Curves.Cancel";
	editor.EventTypes.Save = "Curves.Save";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

	var Box = function(position, dimensions) {
		this.update(position, dimensions);
	};
	
	Box.prototype = {
		getExtents: function() {
			return new hemi.curve.Box(this.minExtent, this.maxExtent);
		},
		
		update: function(position, dimensions) {
			this.position = position;
			this.dimensions = dimensions;
			
			var x = position[0],
				y = position[1],
				z = position[2],
				halfWidth = dimensions[1]/2,
				halfHeight = dimensions[0]/2,
				halfDepth = dimensions[2]/2;
				
			this.minExtent = [x - halfWidth, y - halfHeight, z - halfDepth],
			this.maxExtent = [x + halfWidth, y + halfHeight, z + halfDepth];
		}
	};
	
	var getExtentsList = function(boxes) {
		var list = [];
		
		for (var i = 0, il = boxes.length; i < il; i++) {
			list.push(boxes[i].getExtents());
		}
		
		return list;
	};
    
    /**
     * An CurveEditorModel handles the creation and playing of animations as well
     * as model picking for the animation tool.
     */
    editor.tools.CurveEditorModel = editor.tools.ToolModel.extend({
		init: function() {
			this._super();
			this.config = {
				fast: true,
				boxes: []
			};
			this.boxes = [];
			
			this.msgHandler = hemi.world.subscribe(
				hemi.msg.pick, 
				this, 
				"onPick", 
				[
					hemi.dispatch.MSG_ARG + "data.pickInfo"
				]);
	    },
		
		addBox: function(position, dimensions) {
			var box = new Box(position, dimensions),
				previewing = this.previewing;
				
			this.stopPreview();
			
			this.boxes.push(box);
			this.config.boxes = getExtentsList(this.boxes);
			
//			this.showBoxWireframes();
			this.updateSystem('boxes', this.config.boxes);
			
			this.notifyListeners(editor.EventTypes.BoxAdded, box);
						
			if (previewing) {
				this.startPreview();
			}
		},
		
		addToColorRamp: function(ndx, color) {
			var colors = this.config.colors;
			
			if (colors == null) {
				this.config.colors = colors = [];
			}
			if (colors.length < ndx) {
				colors.push(color);	
			}
			else {
				colors[ndx] = color;
			}
			
			this.updateSystem('colors', colors);
		},
		
		cancel: function() {
			this.stopPreview();
			
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
			
			this.config.trail = this.currentSystem instanceof hemi.curve.GpuParticleTrail;
			this.config.aim = this.currentSystem.aim;
			this.config.particleCount = this.currentSystem.particles;
			this.config.particleSize = this.currentSystem.size;
			this.config.life = this.currentSystem.life;
			this.config.particleShape = this.currentSystem.ptcShape;
			this.config.colors = [];
			
			var colors = this.currentSystem.colors;
			for (var i = 0, il = colors.length; i < il; i++) {
				this.config.colors.push(colors[i].value);
			}
			
			var boxes = this.currentSystem.boxes;
			for (var i = 0, il = boxes.length; i < il; i++) {
				var b = boxes[i],
					minExtent = b.min,
					maxExtent = b.max,
					height = maxExtent[1] - minExtent[1],
					width = maxExtent[0] - minExtent[0],
					depth = maxExtent[2] - minExtent[2],
					position = [minExtent[0] + width/2, 
						minExtent[1] + height/2, minExtent[2] + depth/2],
					box = new Box(position, [height, width, depth]);
				
				this.boxes.push(box);
			}
			
			this.config.boxes = getExtentsList(this.boxes);
//			this.showBoxWireframes();
			
			this.notifyListeners(editor.EventTypes.CurveSet, {
				system: this.currentSystem,
				boxes: this.boxes
			});
		},
		
	    onPick: function(pickInfo) {
			var transform = pickInfo.shapeInfo.parent.transform,
				found = -1,
				list = this.boxes;
			
			for (var i = 0, il = list.length; i < il && found === -1; i++) {
				if (list[i].transform.clientId === transform.clientId) {
					found = i;
				}
			}
			
			if (found !== -1) {
				this.notifyListeners(editor.EventTypes.BoxSelected, {
					transform: transform,
					ndx: found
				});
			}
	    },
		
		remove: function(system) {
			this.stopPreview();
			system.cleanup();			
			this.reset();
			this.notifyListeners(editor.EventTypes.CurveRemoved, system);
		},
		
		removeBox: function(box) {				
			var previewing = this.previewing,
				found = -1;
				
			this.stopPreview();
			
			for (var i = 0, il = this.boxes.length; i < il && found === -1; i++) {
				var b = this.boxes[i];				
				found = b == box ? i : -1;
			}
			
			this.boxes.splice(found, 1);
			this.config.boxes = getExtentsList(this.boxes);
			
			this.updateSystem('boxes', this.config.boxes);
			
			this.notifyListeners(editor.EventTypes.BoxRemoved, box);
						
			if (previewing && this.config.boxes.length > 1) {
				this.startPreview();
			}
		},
		
		reset: function() {
			this.currentSystem = null;
			this.config = {
				fast: true,
				boxes: []
			};
			this.isUpdate = false;
			this.changed = false;
			
			this.boxes = [];
			
			this.notifyListeners(editor.EventTypes.CurveSet, {
				system: null,
				boxes: null
			});
		},
		
		save: function(name) {
			this.stopPreview();
			var msgType = this.isUpdate ? editor.EventTypes.CurveUpdated :
				editor.EventTypes.CurveCreated;
			
			if (!this.currentSystem) {
				this.createSystem();
			}
			else if (this.isUpdate) {
				this.update();
			}
			
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
			
			if (paramName != 'trail') {
				this.updateSystem(paramName, paramValue);
			}
			else if (this.currentSystem){
				var previewing = this.previewing;
				
				this.stopPreview();
				this.currentSystem.cleanup();
				this.createSystem();
				
				if (previewing) {
					this.startPreview();
				}
			}
		},
		
		startPreview: function() {
			if (!this.previewing) {
				if (!this.currentSystem) {
					this.createSystem();	
				} 
				
				this.currentSystem.start();
				this.previewing = true;
				this.changed = false;
			}
		},
		
		stopPreview: function() {
			if (this.currentSystem) {
				this.currentSystem.stop();
			}
			this.previewing = false;
		},
		
		update: function() {
			if (this.currentSystem) {
				this.currentSystem.loadConfig(this.config);
			}
		},
		
		updateBox: function(box, position, dimensions) {
			var	previewing = this.previewing;
							
			box.update(position, dimensions);
			this.stopPreview();
				
			this.config.boxes = getExtentsList(this.boxes);
//			this.showBoxWireframes();
			this.updateSystem('boxes', this.config.boxes);
			
			this.notifyListeners(editor.EventTypes.BoxUpdated, box);
						
			if (previewing) {
				this.startPreview();
			}
		},
		
		updateBoxes: function() {				
			for (var i = 0, il = this.boxes.length; i < il; i++) {
				var box = this.boxes[i],
					transform = box.transform,
					minExtent = transform.boundingBox.minExtent,
					maxExtent = transform.boundingBox.maxExtent,
					height = maxExtent[1] - minExtent[1],
					width = maxExtent[0] - minExtent[0],
					depth = maxExtent[2] - minExtent[2],
					position = transform.getUpdatedWorldMatrix()[3];
				
				box.update(position, [height, width, depth]);
								
				this.notifyListeners(editor.EventTypes.BoxUpdated, box);
			}
			this.config.boxes = getExtentsList(this.boxes);			
			this.updateSystem('boxes', this.config.boxes);
		},
		
		updateSystem: function(param, value) {
			if (this.currentSystem) {
				var method = this.currentSystem['set' + param.capitalize()];
				method.apply(this.currentSystem, [value]);
			}
		},
		
	    worldCleaned: function() {
			var systems = hemi.world.getCitizens({
				citizenType: hemi.curve.GpuParticleSystem.prototype.citizenType
			});
			
			this.reset();
			
			for (var i = 0, il = systems.length; i < il; i++) {
				this.notifyListeners(editor.EventTypes.CurveRemoved, systems[i]);
			}
			
			this.notifyListeners(editor.EventTypes.CurveWorldCleaned);
	    },
		
	    worldLoaded: function() {
			var systems = hemi.world.getCitizens({
				citizenType: hemi.curve.GpuParticleSystem.prototype.citizenType
			});
			
			for (var i = 0, il = systems.length; i < il; i++) {
				this.notifyListeners(editor.EventTypes.CurveCreated, systems[i]);
			}
	    }
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     		Edit Curve Sidebar Widget                         //
//////////////////////////////////////////////////////////////////////////////// 
		
	var ADD_BOX_TEXT = 'Add',
		UPDATE_BOX_TEXT = 'Update';
		
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	editor.tools.EditCrvSBWidgetDefaults = {
		name: 'editCurveSBWidget',
		uiFile: 'js/editor/tools/html/curvesForms.htm',
		manualVisible: true
	};
	
	editor.tools.EditCrvSBWidget = editor.ui.FormSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				editor.tools.EditCrvSBWidgetDefaults, options);
				
			this.boxMat = hemi.core.material.createConstantMaterial(
				hemi.curve.pack,
				hemi.view.viewInfo,
				[0, 0, 0.5, 1]);
			var state = hemi.curve.pack.createObject('State');
			state.getStateParam('PolygonOffset2').value = -1.0;
			state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
			this.boxMat.state = state;
			
			this.colorPickers = [];
			this.boxHandles = new editor.ui.TransHandles();
			this.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
			this.boxHandles.addListener(editor.EventTypes.TransChanged, this);
			this.boxes = new Hashtable();
			
		    this._super(newOpts);
		},
		
		finishLayout: function() {
			this._super();
			
			var form = this.find('form'),
				saveBtn = this.find('#crvSaveBtn'),
				cancelBtn = this.find('#crvCancelBtn'),
				sysTypeSel = this.find('#crvSystemTypeSelect'),
				shpTypeSel = this.find('#crvShapeSelect'),
				inputs = this.find('input:not(#crvName, .box)'),
				boxAddBtn = this.find('#crvAddSaveBoxBtn'),
				boxCancelBtn = this.find('#crvCancelBoxBtn'),
				nameIpt = this.find('#crvName'),
				startPreviewBtn = this.find('#crvPreviewStartBtn'),
				stopPreviewBtn = this.find('#crvPreviewStopBtn'),
			 	tensionVdr = editor.ui.createDefaultValidator(null, 1),
			 	numPrtVdr = editor.ui.createDefaultValidator(1),
				sizeVdr = editor.ui.createDefaultValidator(0.01),
				isNumVdr = editor.ui.createDefaultValidator();
				wgt = this;
			
			this.boxAddBtn = boxAddBtn;
			this.boxCancelBtn = boxCancelBtn;
			this.boxForms = this.find('#crvBoxForms');
			this.boxList = this.find('#crvBoxList');
			this.position = new editor.ui.Vector({
				container: wgt.find('#crvPositionDiv'),
				paramName: 'position',
				validator: editor.ui.createDefaultValidator()
			});
			this.dimensions = new editor.ui.Vector({
				container: wgt.find('#crvDimensionsDiv'),
				paramName: 'dimensions',
				inputs: ['h', 'w', 'd'],
				validator: editor.ui.createDefaultValidator(0.1)
			});
			this.saveBtn = saveBtn;
			
			// set validators
			tensionVdr.setElements(inputs.filter('#crvTension'));
			numPrtVdr.setElements(inputs.filter('#crvParticleCount'));
			sizeVdr.setElements(inputs.filter('#crvParticleSize, #crvLife'));
			isNumVdr.setElements(inputs.filter(':not(#crvTension, #crvParticleCount, #crvParticleSize)'));
			
			// bind buttons and inputs
			form.submit(function() {
				return false;
			});
			
			nameIpt.bind('keyup', function(evt) {		
				wgt.checkSaveButton();
			});
			
			saveBtn.bind('click', function(evt) {
				var name = nameIpt.val();
				wgt.notifyListeners(editor.EventTypes.Save, name);
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.Cancel);
			});
			
			startPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.StartPreview);
			})
			.attr('disabled', 'disabled');
			
			stopPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.StopPreview);
			});
			
			inputs.bind('change', function(evt) {
				var elem = jQuery(this),
					id = elem.attr('id'),
					param = id.replace('crv', '');
					
				wgt.notifyListeners(editor.EventTypes.SetParam, {
					paramName: param.charAt(0).toLowerCase() + param.slice(1),
					paramValue: id === 'crvAim' ? elem.is(':checked') : 
						parseFloat(elem.val())
				});
			});			
			
			sysTypeSel.bind('change', function(evt) {
				wgt.notifyListeners(editor.EventTypes.SetParam, {
					paramName: 'trail',
					paramValue: jQuery(this).val() == 'trail'
				});
			});
			
			shpTypeSel.bind('change', function(evt) {
				wgt.notifyListeners(editor.EventTypes.SetParam, {
					paramName: 'particleShape',
					paramValue: jQuery(this).val()
				});
			});
			
			boxAddBtn.bind('click', function(evt) {
				var box = boxAddBtn.data('box'),
					pos = wgt.position.getValue(),
					dim = wgt.dimensions.getValue();
					
				if (pos.length > 0 && dim.length > 0) {
					var msgType = box == null ? editor.EventTypes.AddBox 
							: editor.EventTypes.UpdateBox, 
						data = {
								position: pos,
								dimensions: dim,
								box: box
							};
					
					wgt.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
					wgt.boxHandles.setTransform(null);
					
					wgt.notifyListeners(msgType, data);
					
					wgt.position.reset();
					wgt.dimensions.reset();
					wgt.checkSaveButton();
					boxAddBtn.data('box', null).text(ADD_BOX_TEXT);
					boxCancelBtn.hide();
				}
			}).data('box', null);
			
			boxCancelBtn.bind('click', function(evt) {
				wgt.position.reset();
				wgt.dimensions.reset();
				boxAddBtn.text(ADD_BOX_TEXT).data('box', null);
				boxCancelBtn.hide();
			}).hide();
			
			var checker = new editor.ui.InputChecker(this.boxes);
			checker.saveable = function() {
				return this.input.size() >= 2;
			};			
			
			this.setupColorPicker();
			this.addInputsToCheck(nameIpt);
			this.addInputsToCheck(checker);
		},
		
		addColorInput: function() {
			var colorAdder = this.find('#crvAddColorToRamp'),
				ndx = colorAdder.data('ndx'),
				wgt = this,
				colorPicker;
			
			if (this.colorPickers.length <= ndx) {
				colorPicker = new editor.ui.ColorPicker({
					inputId: 'crvColorRamp' + ndx,
					containerClass: 'colorRampAdd',
					buttonId: 'crvColorRamp' + ndx + 'Picker'
				});			
				
				colorPicker.addListener(editor.EventTypes.ColorPicked, function(clr) {
					wgt.notifyListeners(editor.EventTypes.SetCurveColor, {
						color: clr,
						ndx: ndx
					});
				});
			
				this.colorPickers.push(colorPicker);
			}
			else {
				colorPicker = this.colorPickers[ndx];
			}
			
			colorAdder.before(colorPicker.getUI());
			colorAdder.data('ndx', ndx+1);
		},
		
		boxAdded: function(box) {
			var position = box.position,
				wgt = this,
				wrapper = jQuery('<li class="crvBoxEditor"><span>Box at [' + position.join(',') + ']</span></li>'),
				removeBtn = jQuery('<button class="icon removeBtn">Remove</button>'),
				editBtn = jQuery('<button class="icon editBtn">Edit</button>');
							
			removeBtn.bind('click', function(evt) {
				var box = wrapper.data('box');
				wgt.notifyListeners(editor.EventTypes.RemoveBox, box);
			});
			
			editBtn.bind('click', function(evt) {
				var b = wrapper.data('box'),
					pos = b.position,
					dim = b.dimensions;
					
				wgt.boxAddBtn.text(UPDATE_BOX_TEXT).data('box', box);
				wgt.boxCancelBtn.show();
				
				wgt.position.setValue({
					x: pos[0],
					y: pos[1],
					z: pos[2]
				});
				wgt.dimensions.setValue({
					h: dim[0],
					w: dim[1],
					d: dim[2]
				});
				
				// a jquery bug here that doesn't test for css rgba
				// wgt.boxForms.effect('highlight');
			});
			
			wrapper.append(editBtn).append(removeBtn).data('box', box);
			
			this.boxes.put(box, wrapper);
			this.boxList.append(wrapper);
			this.boxesUpdated(this.boxes.size());
			this.showBoxWireframes();
		},
		
		boxesUpdated: function(size) {
			var btn = this.find('#crvPreviewStartBtn');
			
			if (size > 1) {				
				btn.removeAttr('disabled');
			}
			else {
				btn.attr('disabled', 'disabled');
			}
		},
		
		boxRemoved: function(box) {
			var wrapper = this.boxes.get(box);
			
			wrapper.remove();
			this.boxes.remove(box);
			
			if (box.transform) {
				var tran = box.transform,
					shape = tran.shapes[0],
					pack = hemi.curve.pack;
				
				tran.removeShape(shape);
				tran.parent = null;
				pack.removeObject(shape);
				pack.removeObject(tran);
				box.transform = null;
			}			
		},
		
		boxSelected: function(drawState, transform) {
			this.boxHandles.setTransform(transform);
			this.boxHandles.setDrawState(drawState);
		},
		
		boxUpdated: function(box) {
			var rndFnc = editor.utils.roundNumber,
				position = box.position,
				dimensions = box.dimensions,
				boxUI = this.boxes.get(box);
				
			for (var i = 0, il = position.length; i < il; i++) {
				position[i] = rndFnc(position[i], 2);
				dimensions[i] = rndFnc(dimensions[i], 2);
			}
			
			boxUI.data('box', box);
			
			if (this.boxAddBtn.data('box') === box) {
				this.position.setValue({
					x: position[0],
					y: position[1],
					z: position[2]
				});
				this.dimensions.setValue({
					h: dimensions[0],
					w: dimensions[1],
					d: dimensions[2]
				});
			}
			
			boxUI.find('span').text('Box at [' + position.join(',') + ']');
			this.showBoxWireframes();
		},
		
		checkSaveButton: function() {
			var btn = this.saveBtn,
				saveable = this.checkSaveable();
			
			if (saveable) {
				btn.removeAttr('disabled');
			}
			else {
				btn.attr('disabled', 'disabled');
			}
		},
		
		cleanup: function() {
			this.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
			this.boxHandles.setTransform(null);
						
			// clean up transforms
			var pack = hemi.curve.pack,
				boxes = this.boxes.keys();
		
			for (var i = 0, il = boxes.length; i < il; i++) {
				var box = boxes[i],
					tran = box.transform,
					shape = tran.shapes[0];
				
				tran.removeShape(shape);
				tran.parent = null;
				pack.removeObject(shape);
				pack.removeObject(tran);
				box.transform = null;
			}
		},
		
		hideBoxWireframes: function() {
			var boxes = this.boxes.keys();
			
			for (var i = 0, il = boxes.length; i < il; i++) {
				var b = boxes[i],
					t = b.transform;
					
				if (t) {
					t.visible = false;
				}
			}
		},
		
		notify: function(eventType, value) {
			if (eventType === editor.EventTypes.TransChanged) {
				this.notifyListeners(editor.EventTypes.UpdateBoxes);
			}
		},
		
		reset: function() {	
			this.cleanup();	
			
			// remove additional color ramp values
			this.find('.colorRampAdd').remove();
			var colorRampPicker = this.colorPickers[0];
			this.find('#crvAddColorToRamp').data('ndx', 1);
			
			// reset selects
			this.find('#crvSystemTypeSelect').val(-1);
			this.find('#crvShapeSelect').val(-1);
			this.find('input:not(.color, .box)').val('');
			
			// reset checkboxes
			this.find('#crvAim').attr('checked', false);
						
			// reset the colorPicker
			colorRampPicker.reset();
			
			// reset the box list
			this.boxList.find('li:not(#crvBoxForms)').remove();
			this.boxes.clear();
			
			this.position.reset();
			this.dimensions.reset();		
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
		
		set: function(curve, boxes) {
			if (curve) {
				var type = curve instanceof hemi.curve.GpuParticleTrail ?
						'trail' : 'emitter',
					colors = curve.colors;
				
				this.find('#crvSystemTypeSelect').val(type);
				this.find('#crvShapeSelect').val(curve.ptcShape);
				this.find('#crvName').val(curve.name);
				this.find('#crvLife').val(curve.life);
				this.find('#crvParticleCount').val(curve.particles);
				this.find('#crvParticleSize').val(curve.size);
				this.find('#crvTension').val(curve.tension);
				
				if (curve.aim) {
					this.find('#crvAim').attr('checked', true);
				}
								
				var count = 1,
					numColors = colors.length;
					
				while (count++ < numColors) {
					this.addColorInput();
				}
				
				for (var i = 0; i < numColors; i++) {
					var picker = this.colorPickers[i];
					picker.setColor(colors[i].value);
				}
				
				for (var i = 0, il = boxes.length; i < il; i++) {					
					this.boxAdded(boxes[i]);
				}
				
				this.checkSaveButton();
			}
			
			this.invalidate();
		},
		
		setupColorPicker: function() {
			var wgt = this,
				colorAdder = this.find('#crvAddColorToRamp');			
			
			var colorRampPicker = new editor.ui.ColorPicker({
				inputId: 'crvColorRamp0',	
				containerClass: 'long',
				buttonId: 'crvColorRamp0Picker'			
			});
			
			this.find('#crvColorRamp0Lbl').after(colorRampPicker.getUI());
			
			// add listeners			
			colorRampPicker.addListener(editor.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(editor.EventTypes.SetCurveColor, {
					color: clr,
					ndx: 0
				});
			});
			
			// setup the color ramp adder
			colorAdder.bind('click', function(evt) {
				wgt.addColorInput();
			})
			.data('ndx', 1);
			
			this.colorPickers.push(colorRampPicker);
		},
		
		setVisible: function(visible, opt_updateMeta) {
			this._super(visible, opt_updateMeta);
			
			if (visible) {
				this.showBoxWireframes();
			}
			else {				
				this.hideBoxWireframes();
			}
		},
		
		showBoxWireframes: function() {
			var pack = hemi.curve.pack,
				boxes = this.boxes.keys();
			
			for (var i = 0; i < boxes.length; i++) {
				var b = boxes[i], 
					w = b.dimensions[1], 
					h = b.dimensions[0], 
					d = b.dimensions[2], 
					x = b.position[0], 
					y = b.position[1], 
					z = b.position[2];
			
			if (b.transform == null) {
				var transform = pack.createObject('Transform'), 
					box = o3djs.primitives.createBox(pack, this.boxMat, 1, 
						1, 1);
			
				transform.addShape(box);
				transform.translate(x,y,z);
				transform.scale(w,h,d);
				transform.parent = hemi.picking.pickRoot;
				b.transform = transform;
			} 
			else {
				b.transform.identity();
				b.transform.translate(x,y,z);
				b.transform.scale(w,h,d);
				b.transform.visible = true;
			}
			}
		}
	});
	
////////////////////////////////////////////////////////////////////////////////
//                     		Curve List Sidebar Widget                         //
//////////////////////////////////////////////////////////////////////////////// 
	
	/*
	 * Configuration object for the HiddenItemsSBWidget.
	 */
	editor.tools.CrvListSBWidgetDefaults = {
		name: 'curveListSBWidget',
		listId: 'curveList',
		prefix: 'crvLst',
		title: 'Curves',
		instructions: "Click 'Create Curve' to create a new curve."
	};
	
	editor.tools.CrvListSBWidget = editor.ui.ListSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, editor.tools.CrvListSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.items = new Hashtable();		
		},
		
		layoutExtra: function() {
			this.buttonDiv = jQuery('<div class="buttons"></div>');
			this.createBtn = jQuery('<button id="createCurve">Create Curve</button>');
			var wgt = this;
						
			this.createBtn.bind('click', function(evt) {
				wgt.notifyListeners(editor.EventTypes.CreateCurve, null);
			});
			
			this.buttonDiv.append(this.createBtn);
			
			return this.buttonDiv;
		},
		
		bindButtons: function(li, obj) {
			var wgt = this;
			
			li.editBtn.bind('click', function(evt) {
				var curve = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.EditCurve, curve);
			});
			
			li.removeBtn.bind('click', function(evt) {
				var curve = li.getAttachedObject();
				wgt.notifyListeners(editor.EventTypes.RemoveCurve, curve);
			});
		},
		
		createListItemWidget: function() {
			return new editor.ui.BhvListItemWidget();
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
    editor.tools.CurveEditorViewDefaults = {
		axnBarId: 'crvActionBar',
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
    editor.tools.CurveEditorView = editor.tools.ToolView.extend({
		init: function(options){
			var newOpts = jQuery.extend({}, editor.tools.CurveEditorViewDefaults, options);
			this._super(newOpts);
			
			this.addSidebarWidget(new editor.tools.EditCrvSBWidget());
			this.addSidebarWidget(new editor.tools.CrvListSBWidget());
			this.addSidebarWidget(editor.ui.getBehaviorWidget());
		},
		
		layoutActionBar: function() {
			var widget = new editor.ui.ActionBarWidget({
				uiFile: 'js/editor/tools/html/curvesAxnBar.htm',
				immediateLayout: false
			});
			var view = this;
			
			widget.finishLayout = function() {
				var manipBtns = widget.find('#crvTranslate, #crvScale'),
					tBtn = manipBtns.filter('#crvTranslate'),
					sBtn = manipBtns.filter('#crvScale'),
					down = editor.tools.ToolConstants.MODE_DOWN;
				
				this.boxNumberTxt = widget.find('#crvBoxNumber');
				this.tBtn = tBtn;
				this.sBtn = sBtn;
				
		        widget.find('form').submit(function() {
		            return false;
		        });
		        
		        manipBtns.bind('click', function(evt) {
					var elem = jQuery(this),
						id = elem.attr('id'),
						isDown = elem.data('isDown'),
						msg = {
							transform: widget.transform
						};
						
					switch(id) {
						case 'crvTranslate':
						    msg.drawState = editor.ui.trans.DrawState.TRANSLATE;
							sBtn.data('isDown', false).removeClass(down);
							break;
						case 'crvScale':
						    msg.drawState = editor.ui.trans.DrawState.SCALE;
							tBtn.data('isDown', false).removeClass(down);
							break;
					}
					
					if (isDown) {						
						msg.drawState = editor.ui.trans.DrawState.NONE;
					}
						
		            view.notifyListeners(editor.EventTypes.BoxManipState, msg);
					elem.data('isDown', !isDown);
					
					if (isDown) {
						elem.removeClass(down);
					}
					else {
						elem.addClass(down);
					}
		        })
		        .data('isDown', false);
				
				view.actionBar.addWidget(widget);
				widget.setVisible(false);
			};
			
			widget.layout();
			
			this.actionWgt = widget;
		},
		
		boxSelected: function(transform, ndx) {
			var oldTransform = this.actionWgt.transform;
			
			this.actionWgt.setVisible(true);
			this.actionWgt.transform = transform;
			if (oldTransform != transform 
					|| (!this.actionWgt.tBtn.data('isDown') 
					&& !this.actionWgt.sBtn.data('isDown'))) {
				this.actionWgt.tBtn.click();
			}
			this.actionWgt.boxNumberTxt.text(ndx+1);
		}
	});
	
    
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

    /**
     * The CurveEditorController facilitates CurveEditorModel and CurveEditorView
     * communication by binding event and message handlers.
     */
    editor.tools.CurveEditorController = editor.tools.ToolController.extend({
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
				bhvWgt = view.behaviorSBWidget;
	        
	        view.addListener(editor.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode == editor.tools.ToolConstants.MODE_DOWN,
					root = isDown ? hemi.core.client.root : hemi.picking.pickRoot;	
				
				hemi.model.modelRoot.parent = root;
				hemi.shape.root.parent = root;
	        });	
			view.addListener(editor.EventTypes.BoxManipState, function(value) {
				edtCrvWgt.boxSelected(value.drawState, value.transform);
			});
			
			// edit curve widget specific
			edtCrvWgt.addListener(editor.EventTypes.AddBox, function(boxParams) {
				model.addBox(boxParams.position, boxParams.dimensions);
			});
			edtCrvWgt.addListener(editor.EventTypes.Cancel, function() {
				model.cancel();
			});
			edtCrvWgt.addListener(editor.EventTypes.RemoveBox, function(box) {
				model.removeBox(box);
			});
			edtCrvWgt.addListener(editor.EventTypes.Save, function(name) {
				model.save(name);
			});
			edtCrvWgt.addListener(editor.EventTypes.SetParam, function(paramObj) {
				model.setParam(paramObj.paramName, paramObj.paramValue);
			});
			edtCrvWgt.addListener(editor.EventTypes.SetCurveColor, function(colorObj) {
				model.addToColorRamp(colorObj.ndx, colorObj.color);
			});
			edtCrvWgt.addListener(editor.EventTypes.StartPreview, function() {
				model.startPreview();
			});
			edtCrvWgt.addListener(editor.EventTypes.StopPreview, function() {
				model.stopPreview();
			});
			edtCrvWgt.addListener(editor.EventTypes.UpdateBox, function(params) {
				model.updateBox(params.box, params.position, params.dimensions);
			});
			edtCrvWgt.addListener(editor.EventTypes.UpdateBoxes, function() {
				model.updateBoxes();
			});
			
			// curve list widget specific
			lstWgt.addListener(editor.EventTypes.CreateCurve, function() {
				edtCrvWgt.setVisible(true);
				lstWgt.setVisible(false);
			});
			lstWgt.addListener(editor.EventTypes.EditCurve, function(curve) {
				edtCrvWgt.setVisible(true);
				lstWgt.setVisible(false);
				
				model.edit(curve);
			});
			lstWgt.addListener(editor.EventTypes.RemoveCurve, function(curve) {
				model.remove(curve);
			});
			
			// view specific
	        
			// model specific	
			model.addListener(editor.EventTypes.BoxAdded, function(box) {
				edtCrvWgt.boxAdded(box);
			});
			model.addListener(editor.EventTypes.BoxRemoved, function(box) {
				edtCrvWgt.boxRemoved(box);
			});
			model.addListener(editor.EventTypes.BoxSelected, function(vals) {
				var transform = vals.transform,
					ndx = vals.ndx;
					
				view.boxSelected(transform, ndx);
			});
			model.addListener(editor.EventTypes.BoxUpdated, function(box) {
				edtCrvWgt.boxUpdated(box);
			});
			model.addListener(editor.EventTypes.CurveCreated, function(curve) {
				lstWgt.add(curve);
			});
			model.addListener(editor.EventTypes.CurveRemoved, function(curve) {
				lstWgt.remove(curve);
			});
			model.addListener(editor.EventTypes.CurveSet, function(curve) {
				if (curve.system != null) {
					edtCrvWgt.set(curve.system, curve.boxes);
				}
				else {
					var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
					
					edtCrvWgt.setVisible(false);
					lstWgt.setVisible(isDown);
					edtCrvWgt.reset();
				}
			});
			model.addListener(editor.EventTypes.CurveUpdated, function(curve) {
				lstWgt.update(curve);
			});
			model.addListener(editor.EventTypes.CurveWorldCleaned, function() {
				var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
				edtCrvWgt.reset();
				edtCrvWgt.setVisible(false);
				lstWgt.setVisible(isDown);
			});
			
			// behavior widget specific
			bhvWgt.addListener(editor.EventTypes.Sidebar.WidgetVisible, function(obj) {
				if (obj.updateMeta) {
					var isDown = view.mode === editor.tools.ToolConstants.MODE_DOWN;
					
					lstWgt.setVisible(!obj.visible && isDown);
				}
			});
	    }
	});
	
	return editor;
})(editor || {});
