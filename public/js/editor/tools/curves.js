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
	
	// model specific
    module.EventTypes.CurveCreated = "Curves.CurveCreated";
    module.EventTypes.CurveRemoved = "Curves.CurveRemoved";
    module.EventTypes.CurveUpdated = "Curves.CurveUpdated";
    module.EventTypes.CurveSet = "Curves.CurveSet";
    module.EventTypes.BoxAdded = "Curves.BoxAdded";
    module.EventTypes.BoxSelected = "Curves.BoxSelected";
    module.EventTypes.BoxRemoved = "Curves.BoxRemoved";
    module.EventTypes.BoxUpdated = "Curves.BoxUpdated";
    module.EventTypes.CurveWorldCleaned = "Curves.CurveWorldCleaned";
	
	// view specific
	module.EventTypes.BoxManipState = "Curves.BoxManipState";
	
	// curve list widget specific
	module.EventTypes.CreateCurve = "Curves.CreateCurve";
	module.EventTypes.EditCurve = "Curves.EditCurve";
	module.EventTypes.RemoveCurve = "Curves.RemoveCurve";
	
	// curve edit widget specific
	module.EventTypes.SetParam = "Curves.SetParam";
	module.EventTypes.AddBox = "Curves.AddBox";
	module.EventTypes.RemoveBox = "Curves.RemoveBox";
	module.EventTypes.UpdateBox = "Curves.UpdateBox";
	module.EventTypes.UpdateBoxes = "Curves.UpdateBoxes";
	module.EventTypes.StartPreview = "Curves.StartPreview";
	module.EventTypes.StopPreview = "Curves.StopPreview";
	module.EventTypes.SetCurveColor = "Curves.SetCurveColor";
	module.EventTypes.Cancel = "Curves.Cancel";
	module.EventTypes.Save = "Curves.Save";
    
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

	var Box = function(position, dimensions) {
		this.update(position, dimensions);
	};
	
	Box.prototype = {
		getExtents: function() {
			return [this.minExtent, this.maxExtent];
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
    module.tools.CurveEditorModel = module.tools.ToolModel.extend({
		init: function() {
			this._super();
			this.config = {
				fast: true,
				boxes: []
			};
			this.boxes = [];
			this.boxMat = hemi.core.material.createConstantMaterial(
				hemi.curve.pack,
				hemi.view.viewInfo,
				[0, 0, 0.5, 1]);
			var state = hemi.curve.pack.createObject('State');
			state.getStateParam('PolygonOffset2').value = -1.0;
			state.getStateParam('FillMode').value = hemi.core.o3d.State.WIREFRAME;
			this.boxMat.state = state;
			
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
			
			this.showBoxWireframes();
			this.updateSystem('boxes', this.config.boxes);
			
			this.notifyListeners(module.EventTypes.BoxAdded, box);
						
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
			this.config.colors = this.currentSystem.colors;
			this.config.aim = this.currentSystem.aim;
			this.config.particleCount = this.currentSystem.particles;
			this.config.particleSize = this.currentSystem.size;
			this.config.life = this.currentSystem.life;
			this.config.particleShape = this.currentSystem.particleShape;
			
			var boxes = this.currentSystem.boxes;
			for (var i = 0, il = boxes.length; i < il; i++) {
				var b = boxes[i],
					minExtent = b[0],
					maxExtent = b[1],
					height = maxExtent[1] - minExtent[1],
					width = maxExtent[0] - minExtent[0],
					depth = maxExtent[2] - minExtent[2],
					position = [minExtent[0] + width/2, 
						minExtent[1] + height/2, minExtent[2] + depth/2],
					box = new Box(position, [height, width, depth]);
					
				this.boxes.push(box);					
			}			
			
			this.config.boxes = getExtentsList(this.boxes);
			this.showBoxWireframes();
			
			this.notifyListeners(module.EventTypes.CurveSet, {
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
				this.notifyListeners(module.EventTypes.BoxSelected, {
					transform: transform,
					ndx: found
				});
			}
	    },
		
		remove: function(system) {
			this.stopPreview();
			system.cleanup();			
			this.reset();
			this.notifyListeners(module.EventTypes.CurveRemoved, system);
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
			
			this.updateSystem('boxes', this.config.boxes);
			
			this.notifyListeners(module.EventTypes.BoxRemoved, {
				size: this.config.boxes.length
			});
						
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
			
			// clean up transforms
			var pack = hemi.curve.pack;
		
			for (i = 0, il = this.boxes.length; i < il; i++) {
				var box = this.boxes[i],
					tran = box.transform,
					shape = tran.shapes[0];
				
				tran.removeShape(shape);
				tran.parent = null;
				pack.removeObject(shape);
				pack.removeObject(tran);
				box.transform = null;
			}
			
			this.boxes = [];
		},
		
		save: function(name) {
			this.stopPreview();
			var msgType = this.isUpdate ? module.EventTypes.CurveUpdated :
				module.EventTypes.CurveCreated;
			
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
		
		showBoxWireframes: function() {
			var pack = hemi.curve.pack,
				boxes = this.boxes;
			
			for (i = 0; i < boxes.length; i++) {
				var b = boxes[i];
				
				if (b.transform == null) {
					var transform = pack.createObject('Transform'), 
						w = b.dimensions[1], 
						h = b.dimensions[0], 
						d = b.dimensions[2], 
						x = b.position[0], 
						y = b.position[1], 
						z = b.position[2], 
						box = o3djs.primitives.createBox(pack, this.boxMat, w, 
							h, d);
				
					transform.addShape(box);
					transform.translate(x,y,z);
					transform.parent = hemi.picking.pickRoot;
					b.transform = transform;
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
			this.showBoxWireframes();
			this.updateSystem('boxes', this.config.boxes);
			
			this.notifyListeners(module.EventTypes.BoxUpdated, box);
						
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
								
				this.notifyListeners(module.EventTypes.BoxUpdated, box);
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
				this.notifyListeners(module.EventTypes.CurveRemoved, systems[i]);
			}
			
			this.notifyListeners(module.EventTypes.CurveWorldCleaned);
	    },
		
	    worldLoaded: function() {
			var systems = hemi.world.getCitizens({
				citizenType: hemi.curve.GpuParticleSystem.prototype.citizenType
			});
			
			for (var i = 0, il = systems.length; i < il; i++) {
				this.notifyListeners(module.EventTypes.CurveCreated, systems[i]);
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
	module.tools.EditCrvSBWidgetDefaults = {
		name: 'editCurveSBWidget',
		uiFile: 'js/editor/tools/html/curvesForms.htm',
		manualVisible: true
	};
	
	module.tools.EditCrvSBWidget = module.ui.FormSBWidget.extend({
		init: function(options) {
			var newOpts = jQuery.extend({}, 
				module.tools.EditCrvSBWidgetDefaults, options);
		    this._super(newOpts);
			
			this.colorPickers = [];
			this.boxHandles = new editor.ui.TransHandles();
			this.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
			this.boxHandles.addListener(module.EventTypes.TransChanged, this);
			this.boxes = new Hashtable();
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
			 	tensionVdr = module.ui.createDefaultValidator(-1, 1),
			 	numPrtVdr = module.ui.createDefaultValidator(1),
				sizeVdr = module.ui.createDefaultValidator(0.01),
				isNumVdr = module.ui.createDefaultValidator();
				wgt = this;
			
			this.boxAddBtn = boxAddBtn;
			this.boxCancelBtn = boxCancelBtn;
			this.boxForms = this.find('#crvBoxForms');
			this.boxList = this.find('#crvBoxList');
			this.position = new module.ui.Vector({
				container: wgt.find('#crvPositionDiv'),
				paramName: 'position',
				validator: module.ui.createDefaultValidator()
			});
			this.dimensions = new module.ui.Vector({
				container: wgt.find('#crvDimensionsDiv'),
				paramName: 'dimensions',
				inputs: ['h', 'w', 'd'],
				validator: module.ui.createDefaultValidator(0.1)
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
				
				wgt.notifyListeners(module.EventTypes.Save, name);
				wgt.reset();
			});
			
			cancelBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.Cancel);
				wgt.reset();
			});
			
			startPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StartPreview);
			})
			.attr('disabled', 'disabled');
			
			stopPreviewBtn.bind('click', function(evt) {
				wgt.notifyListeners(module.EventTypes.StopPreview);
			});
			
			inputs.bind('change', function(evt) {
				var elem = jQuery(this),
					id = elem.attr('id'),
					param = id.replace('crv', '');
					
				wgt.notifyListeners(module.EventTypes.SetParam, {
					paramName: param.charAt(0).toLowerCase() + param.slice(1),
					paramValue: id === 'crvAim' ? elem.is(':checked') : 
						parseFloat(elem.val())
				});
			});			
			
			sysTypeSel.bind('change', function(evt) {
				wgt.notifyListeners(module.EventTypes.SetParam, {
					paramName: 'trail',
					paramValue: jQuery(this).val() == 'trail'
				});
			});
			
			shpTypeSel.bind('change', function(evt) {
				wgt.notifyListeners(module.EventTypes.SetParam, {
					paramName: 'particleShape',
					paramValue: jQuery(this).val()
				});
			});
			
			boxAddBtn.bind('click', function(evt) {
				var box = boxAddBtn.data('box'),
					pos = wgt.position.getValue(),
					dim = wgt.dimensions.getValue();
					
				if (pos != null && dim != null) {
					var msgType = box == null ? module.EventTypes.AddBox 
							: module.EventTypes.UpdateBox, 
						data = {
								position: [pos.x, pos.y, pos.z],
								dimensions: [dim.h, dim.w, dim.d],
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
			
			var checker = new module.ui.InputChecker(this.boxes);
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
				colorPicker = new module.ui.ColorPicker({
					inputId: 'crvColorRamp' + ndx,
					containerClass: 'colorRampAdd',
					buttonId: 'crvColorRamp' + ndx + 'Picker'
				});			
				
				colorPicker.addListener(module.EventTypes.ColorPicked, function(clr) {
					wgt.notifyListeners(module.EventTypes.SetCurveColor, {
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
				dimensions = box.dimensions,
				wgt = this,
				wrapper = jQuery('<li class="crvBoxEditor"><span>Box at [' + position.join(',') + ']</span></li>'),
				removeBtn = jQuery('<button class="icon removeBtn">Remove</button>'),
				editBtn = jQuery('<button class="icon editBtn">Edit</button>');
							
			removeBtn.bind('click', function(evt) {
				var box = wrapper.data('box');
				
				wrapper.remove();
				wgt.notifyListeners(module.EventTypes.RemoveBox, box);
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
		
		boxSelected: function(drawState, transform) {
			this.boxHandles.setTransform(transform);
			this.boxHandles.setDrawState(drawState);
		},
		
		boxUpdated: function(box) {
			var rndFnc = module.utils.roundNumber,
				position = box.position,
				dimensions = box.dimensions,
				wgt = this,
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
			for (var i = 0, il = this.transHandles.length; i < il; i++) {
				this.transHandles[i].cleanup();
			}
		},
		
		notify: function(eventType, value) {
			if (eventType === module.EventTypes.TransChanged) {
				this.notifyListeners(module.EventTypes.UpdateBoxes);
			}
		},
		
		reset: function() {		
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
				var colorAdder = this.find('#crvAddColorToRamp'),
					type = curve instanceof hemi.curve.GpuParticleTrail ?
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
					picker.setColor(colors[i]);
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
			
			var colorRampPicker = new module.ui.ColorPicker({
				inputId: 'crvColorRamp0',	
				containerClass: 'long',
				buttonId: 'crvColorRamp0Picker'			
			});
			
			this.find('#crvColorRamp0Lbl').after(colorRampPicker.getUI());
			
			// add listeners			
			colorRampPicker.addListener(module.EventTypes.ColorPicked, function(clr) {
				wgt.notifyListeners(module.EventTypes.SetCurveColor, {
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
		
		createListItemWidget: function() {
			return new module.ui.BhvListItemWidget();
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
    module.tools.CurveEditorView = module.tools.ToolView.extend({
		init: function(options){
			var newOpts = jQuery.extend({}, module.tools.CurveEditorViewDefaults, options);
			this._super(newOpts);
			
			this.addSidebarWidget(new module.tools.EditCrvSBWidget());
			this.addSidebarWidget(new module.tools.CrvListSBWidget());
			this.addSidebarWidget(module.ui.getBehaviorWidget());
		},
		
		layoutActionBar: function() {
			var widget = new module.ui.ActionBarWidget({
				uiFile: 'js/editor/tools/html/curvesAxnBar.htm',
				immediateLayout: false
			});
			var view = this;
			
			widget.finishLayout = function() {
				var manipBtns = widget.find('#crvTranslate, #crvScale'),
					tBtn = manipBtns.filter('#crvTranslate'),
					sBtn = manipBtns.filter('#crvScale'),
					down = module.tools.ToolConstants.MODE_DOWN;
				
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
						    msg.drawState = module.ui.trans.DrawState.TRANSLATE;
							sBtn.data('isDown', false).removeClass(down);
							break;
						case 'crvScale':
						    msg.drawState = module.ui.trans.DrawState.SCALE;
							tBtn.data('isDown', false).removeClass(down);
							break;
					}
					
					if (isDown) {						
						msg.drawState = module.ui.trans.DrawState.NONE;
					}
						
		            view.notifyListeners(module.EventTypes.BoxManipState, msg);
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
			this.actionWgt.setVisible(true);
			this.actionWgt.transform = transform;
			if (!this.actionWgt.tBtn.data('isDown') 
					&& !this.actionWgt.sBtn.data('isDown')) {
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
				bhvWgt = view.behaviorSBWidget,
	        	that = this;
	        
	        view.addListener(module.EventTypes.ToolModeSet, function(value) {
	            var isDown = value.newMode == module.tools.ToolConstants.MODE_DOWN;				
	        });	
			view.addListener(module.EventTypes.BoxManipState, function(value) {
				edtCrvWgt.boxSelected(value.drawState, value.transform);
			});
			
			// edit curve widget specific
			edtCrvWgt.addListener(module.EventTypes.AddBox, function(boxParams) {
				model.addBox(boxParams.position, boxParams.dimensions);
			});
			edtCrvWgt.addListener(module.EventTypes.Cancel, function() {
				model.reset();
				edtCrvWgt.setVisible(false);
				lstWgt.setVisible(true);
			});
			edtCrvWgt.addListener(module.EventTypes.RemoveBox, function(box) {
				model.removeBox(box);
			});
			edtCrvWgt.addListener(module.EventTypes.Save, function(name) {
				model.save(name);
			});
			edtCrvWgt.addListener(module.EventTypes.SetParam, function(paramObj) {
				model.setParam(paramObj.paramName, paramObj.paramValue);
			});
			edtCrvWgt.addListener(module.EventTypes.SetCurveColor, function(colorObj) {
				model.addToColorRamp(colorObj.ndx, colorObj.color);
			});
			edtCrvWgt.addListener(module.EventTypes.StartPreview, function() {
				model.startPreview();
			});
			edtCrvWgt.addListener(module.EventTypes.StopPreview, function() {
				model.stopPreview();
			});
			edtCrvWgt.addListener(module.EventTypes.UpdateBox, function(params) {
				model.updateBox(params.box, params.position, params.dimensions);
			});
			edtCrvWgt.addListener(module.EventTypes.UpdateBoxes, function() {
				model.updateBoxes();
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
			model.addListener(module.EventTypes.BoxAdded, function(box) {
				edtCrvWgt.boxAdded(box);
			});
			model.addListener(module.EventTypes.BoxRemoved, function(ndx) {
			});
			model.addListener(module.EventTypes.BoxSelected, function(vals) {
				var transform = vals.transform,
					ndx = vals.ndx;
					
				view.boxSelected(transform, ndx);
			});
			model.addListener(module.EventTypes.BoxUpdated, function(box) {
				edtCrvWgt.boxUpdated(box);
			});
			model.addListener(module.EventTypes.CurveCreated, function(curve) {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				lstWgt.add(curve);
				edtCrvWgt.setVisible(false);
				lstWgt.setVisible(isDown && true);
			});
			model.addListener(module.EventTypes.CurveRemoved, function(curve) {
				lstWgt.remove(curve);
			});
			model.addListener(module.EventTypes.CurveSet, function(curve) {
				if (curve.system != null) {
					edtCrvWgt.set(curve.system, curve.boxes);
				}
			});
			model.addListener(module.EventTypes.CurveUpdated, function(curve) {
				lstWgt.update(curve);
				edtCrvWgt.setVisible(false);
				lstWgt.setVisible(true);
			});
			model.addListener(module.EventTypes.CurveWorldCleaned, function() {
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
				edtCrvWgt.reset();
				edtCrvWgt.setVisible(false);
				lstWgt.setVisible(isDown && true);
			});
			
			// behavior widget specific
			bhvWgt.addListener(module.EventTypes.Sidebar.WidgetVisible, function(obj) {				
				var isDown = view.mode === module.tools.ToolConstants.MODE_DOWN;
								
				lstWgt.setVisible(!obj.visible && isDown);
			});
	    }
	});
	
	return module;
})(editor || {});
