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
//                     			   Initialization  		                      //
////////////////////////////////////////////////////////////////////////////////
	
	var shorthand = editor.tools.particleCurves;

	shorthand.init = function() {
		var navPane = editor.ui.getNavPane('Effects'),

			ptcMdl = new ParticleCurvesModel(),
			ptcView = new ParticleCurvesView(),
			ptcCtr = new ParticleCurvesController();

		ptcCtr.setModel(ptcMdl);
		ptcCtr.setView(ptcView);

		navPane.add(ptcView);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                     			  Tool Definition  		                      //
////////////////////////////////////////////////////////////////////////////////	
	
	shorthand.events = {
		// model specific
		BoxAdded: "Curves.BoxAdded",
		BoxSelected: "Curves.BoxSelected",
		BoxRemoved: "Curves.BoxRemoved",
		BoxUpdated: "Curves.BoxUpdated",
		
		// view specific
		BoxManipState: "Curves.BoxManipState",
		
		// curve edit widget specific
		SetParam: "Curves.SetParam",
		AddBox: "Curves.AddBox",
		RemoveBox: "Curves.RemoveBox",
		UpdateBox: "Curves.UpdateBox",
		StartPreview: "Curves.StartPreview",
		StopPreview: "Curves.StopPreview",
		SetCurveColor: "Curves.SetCurveColor",
		Save: "Curves.Save"
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                   Model                                    //
////////////////////////////////////////////////////////////////////////////////

	var Box = function(position, dimensions) {
		this.update(position, dimensions);
	};
	
	Box.prototype.getExtents = function() {
		return new hemi.BoundingBox(this.minExtent, this.maxExtent);
	};
	
	Box.prototype.update = function(position, dimensions) {
		this.position = position.clone();
		this.dimensions = dimensions.slice();
		
		var halfWidth = dimensions[1]/2,
			halfHeight = dimensions[0]/2,
			halfDepth = dimensions[2]/2;
			
		this.minExtent = new THREE.Vector3(position.x - halfWidth, position.y - halfHeight, position.z - halfDepth);
		this.maxExtent = new THREE.Vector3(position.x + halfWidth, position.y + halfHeight, position.z + halfDepth);
	};

	
	var getExtentsList = function(boxes) {
		var list = [];
		
		for (var i = 0, il = boxes.length; i < il; i++) {
			list.push(boxes[i].getExtents());
		}
		
		return list;
	};
	
	/**
	 * A ParticleCurvesModel...
	 */
	var ParticleCurvesModel = function() {
		editor.ToolModel.call(this, 'particleCurves');
		this.config = {
			fast: true,
			boxes: []
		};
		this.boxes = [];
		
		this.msgHandler = hemi.subscribe(
			hemi.msg.pick, 
			this, 
			"onPick", 
			[
				hemi.dispatch.MSG_ARG + "data"
			]);
	};

	ParticleCurvesModel.prototype = new editor.ToolModel();
	ParticleCurvesModel.prototype.constructor = ParticleCurvesModel;
		
	ParticleCurvesModel.prototype.addBox = function(position, dimensions) {
		var box = new Box(position, dimensions),
			previewing = this.previewing;
			
		this.stopPreview();
		
		this.boxes.push(box);
		this.config.boxes = getExtentsList(this.boxes);
		
		this.updateParticles('boxes', this.config.boxes);
		
		this.notifyListeners(shorthand.events.BoxAdded, box);
					
		if (previewing) {
			this.startPreview();
		}
	};
		
	ParticleCurvesModel.prototype.addToColorRamp = function(ndx, color) {
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
		
		this.updateParticles('colors', colors);
	};
		
	ParticleCurvesModel.prototype.cancel = function() {
		this.stopPreview();
		
		if (!this.isUpdate && this.particles) {
			this.particles.cleanup();
		}
		
		// reset
		this.reset();
	};
		
	ParticleCurvesModel.prototype.createParticles = function() {
		if (this.config.trail) {
			this.particles = new hemi.ParticleCurveTrail(editor.client, this.config);
		}
		else {
			this.particles = new hemi.ParticleCurve(editor.client, this.config);
		}
	};
		
	ParticleCurvesModel.prototype.edit = function(particles) {
		this.stopPreview();
		this.particles = particles;
		this.isUpdate = true;
		
		this.config.trail = this.particles instanceof hemi.ParticleCurveTrail;
		this.config.aim = this.particles._aim;
		this.config.particleCount = this.particles._particles;
		this.config.life = this.particles.life;
		this.config.tension = this.particles._tension;
		this.config.colors = [];
		this.config.particleShape = this.particles._particleShape;
		
		var colors = this.particles._colors;
		for (var i = 0, il = colors.length; i < il; i++) {
			this.config.colors.push(colors[i].value);
		}
		
		var boxes = this.particles._boxes;
		for (var i = 0, il = boxes.length; i < il; i++) {
			var b = boxes[i],
				minExtent = b.min,
				maxExtent = b.max,
				height = maxExtent.y - minExtent.y,
				width = maxExtent.x - minExtent.x,
				depth = maxExtent.z - minExtent.z,
				position = new THREE.Vector3(minExtent.x + width/2, 
					minExtent.y + height/2, minExtent.z + depth/2),
				box = new Box(position, [height, width, depth]);
			
			this.boxes.push(box);
		}
		
		this.config.boxes = getExtentsList(this.boxes);
		
		this.notifyListeners(editor.events.Editing, {
			particles: this.particles,
			boxes: this.boxes
		});
	};
		
	ParticleCurvesModel.prototype.onPick = function(pickInfo) {
		var transform = pickInfo.pickedMesh,
			found = -1,
			list = this.boxes;
		
		for (var i = 0, il = list.length; i < il && found === -1; i++) {
			if (list[i].mesh.id === transform.id) {
				found = i;
			}
		}
		
		if (found !== -1) {
			this.notifyListeners(shorthand.events.BoxSelected, {
				transform: transform,
				ndx: found
			});
		}
	};
		
	ParticleCurvesModel.prototype.remove = function(particles) {
		this.stopPreview();
		this.notifyListeners(editor.events.Removing, particles);		
		this.reset();
	};
		
	ParticleCurvesModel.prototype.removeBox = function(box) {				
		var previewing = this.previewing,
			found = -1;
			
		this.stopPreview();
		
		for (var i = 0, il = this.boxes.length; i < il && found === -1; i++) {
			var b = this.boxes[i];				
			found = b == box ? i : -1;
		}
		
		this.boxes.splice(found, 1);
		this.config.boxes = getExtentsList(this.boxes);
		
		this.updateParticles('boxes', this.config.boxes);
		
		this.notifyListeners(shorthand.events.BoxRemoved, box);
					
		if (previewing && this.config.boxes.length > 1) {
			this.startPreview();
		}
	};
		
	ParticleCurvesModel.prototype.reset = function() {
		this.particles = null;
		this.config = {
			fast: true,
			boxes: []
		};
		this.isUpdate = false;
		
		this.boxes = [];
		
		this.notifyListeners(editor.events.Editing, {
			particles: null,
			boxes: null
		});
	};
		
	ParticleCurvesModel.prototype.save = function(name) {
		var msgType = this.isUpdate ? editor.events.Updated :
			editor.events.Created;
		
		this.stopPreview();
		
		if (!this.particles) {
			this.createParticles();
		}
		else if (this.isUpdate) {
			this.particles.loadConfig(this.config);
		}
		
		this.particles.name = name;			
		this.notifyListeners(msgType, this.particles);
		
		// reset
		this.reset();
	};
		
	ParticleCurvesModel.prototype.setParam = function(paramName, paramValue) {
		if (paramValue === '') {
			delete this.config[paramName];
		}
		else {
			this.config[paramName] = paramValue;
		}
		
		if (paramName != 'trail') {
			this.updateParticles(paramName, paramValue);
		}
		else if (this.particles){
			var previewing = this.previewing;
			
			this.stopPreview();
			this.createParticles();
			
			if (previewing) {
				this.startPreview();
			}
		}
	};
		
	ParticleCurvesModel.prototype.startPreview = function() {
		if (!this.previewing) {
			if (!this.particles) {
				this.createParticles();	
			} 
			
			this.particles.start();
			this.previewing = true;
		}
	};
		
	ParticleCurvesModel.prototype.stopPreview = function() {
		if (this.particles) {
			this.particles.stop();
		}
		this.previewing = false;
	};
		
	ParticleCurvesModel.prototype.updateBox = function(box, position, dimensions) {
		var	previewing = this.previewing;
						
		box.update(position, dimensions);
		this.stopPreview();
			
		this.config.boxes = getExtentsList(this.boxes);
		this.updateParticles('boxes', this.config.boxes);
		
		this.notifyListeners(shorthand.events.BoxUpdated, box);
					
		if (previewing) {
			this.startPreview();
		}
	};
		
	ParticleCurvesModel.prototype.updateParticles = function(param, value) {
		if (this.particles) {
			if (param === 'life') {
				this.particles.life = value;
			} else {
				var method = this.particles['set' + hemi.utils.capitalize(param)];
				method.apply(this.particles, [value]);
			}
		}
	};
		
	ParticleCurvesModel.prototype.worldCleaned = function() {
		var particles = hemi.world.getCitizens({
			_octaneType: hemi.ParticleCurve.prototype._octaneType
		});
		particles.concat(hemi.world.getCitizens({
			_octaneType: hemi.ParticleCurveTrail.prototype._octaneType
		}));
		this.reset();
		
		for (var i = 0, il = particles.length; i < il; i++) {
			this.notifyListeners(editor.events.Removing, particles[i]);
		}
	};
		
	ParticleCurvesModel.prototype.worldLoaded = function() {
		var particles = hemi.world.getCitizens({
			_octaneType: hemi.ParticleCurve.prototype._octaneType
		});
		particles.concat(hemi.world.getCitizens({
			_octaneType: hemi.ParticleCurveTrail.prototype._octaneType
		}));
		
		for (var i = 0, il = particles.length; i < il; i++) {
			this.notifyListeners(editor.events.Created, particles[i]);
		}
	};
////////////////////////////////////////////////////////////////////////////////
//                     	  Create Curve Sidebar Widget                         //
//////////////////////////////////////////////////////////////////////////////// 
		
	var ADD_BOX_TEXT = 'Add',
		UPDATE_BOX_TEXT = 'Update';
	
	var CreateWidget = function(options) {
		this.boxMat = new THREE.MeshPhongMaterial({
			color: 0x000088,
			wireframe: true,
			wireframeLinewidth: 1
		});
		
		this.colorPickers = [];
		this.boxHandles = new editor.ui.TransHandles();
		this.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
		this.boxHandles.addListener(editor.events.Updated, this);
		this.boxes = new Hashtable();
		this.shapeConfig = {};
		
		editor.ui.FormWidget.call(this, {
			name: 'createPtcCurveWidget',
			uiFile: 'js/editor/plugins/particleCurves/html/curvesForms.htm'
		});
	};

	CreateWidget.prototype = new editor.ui.FormWidget();
	CreateWidget.prototype.constructor = CreateWidget;
		
	CreateWidget.prototype.layout = function() {
		editor.ui.FormWidget.prototype.layout.call(this);
		
		var form = this.find('form'),
			saveBtn = this.find('#crvSaveBtn'),
			cancelBtn = this.find('#crvCancelBtn'),
			sysTypeSel = this.find('#crvSystemTypeSelect'),
			shpTypeSel = this.find('#crvShapeSelect'),
			boxAddBtn = this.find('#crvAddSaveBoxBtn'),
			boxCancelBtn = this.find('#crvCancelBoxBtn'),
			previewBtn = this.find('#crvPreviewBtn'),
			sizeVdr = editor.ui.createDefaultValidator(0.01),
			wgt = this,
			blurFcn = function(ipt, evt) {
				var id = ipt.getUI().attr('id'),
					param = id.replace('crv', '');
				
				wgt.notifyListeners(shorthand.events.SetParam, {
					paramName: param.charAt(0).toLowerCase() + param.slice(1),
					paramValue: ipt.getValue()
				});
			};
		
		this.boxAddBtn = boxAddBtn;
		this.boxCancelBtn = boxCancelBtn;
		this.saveBtn = saveBtn;
		this.curveAim = this.find('#crvAim');
		this.boxForms = this.find('#crvBoxForms');
		this.boxList = this.find('#crvBoxList');
		this.position = new editor.ui.Vector({
			container: wgt.find('#crvPositionDiv'),
			validator: editor.ui.createDefaultValidator()
		});
		this.dimensions = new editor.ui.Vector({
			container: wgt.find('#crvDimensionsDiv'),
			inputs: ['h', 'w', 'd'],
			validator: editor.ui.createDefaultValidator(0.1)
		});
		this.numParticles = new editor.ui.Input({
			container: wgt.find('#crvParticleCount'),
			onBlur: blurFcn,
			validator: editor.ui.createDefaultValidator(1)
		});
		this.curveLife = new editor.ui.Input({
			container: wgt.find('#crvLife'),
			onBlur: blurFcn,
			validator: sizeVdr
		});
		this.curveTension = new editor.ui.Input({
			container: wgt.find('#crvTension'),
			onBlur: blurFcn,
			validator: editor.ui.createDefaultValidator(null, 1)
		});
		this.particleSize = new editor.ui.Input({
			container: wgt.find('#crvParticleSize'),
			onBlur: function(ipt, evt) {
				setShapeSize.call(wgt, ipt.getValue());

				wgt.notifyListeners(shorthand.events.SetParam, {
					paramName: 'particleShape',
					paramValue: wgt.shapeConfig
				});
			},
			validator: sizeVdr
		});
		this.curveName = new editor.ui.Input({
			container: wgt.find('#crvName'),
			type: 'string'
		});
		
		// bind buttons and inputs
		form.submit(function() {
			return false;
		});
		
		this.curveName.getUI().bind('keyup', function(evt) {		
			wgt.checkSaveButton();
		});
		
		saveBtn.bind('click', function(evt) {
			var name = wgt.curveName.getValue();
			wgt.notifyListeners(shorthand.events.Save, name);
		});
		
		cancelBtn.bind('click', function(evt) {
			wgt.notifyListeners(editor.events.Cancel);
		});
		
		previewBtn.bind('click', function(evt) {
			var btn = jQuery(this);
			
			if (btn.data('previewing')) {
				wgt.notifyListeners(shorthand.events.StopPreview);
				btn.text('Start Preview').data('previewing', false);
			}
			else {
				wgt.notifyListeners(shorthand.events.StartPreview);
				btn.text('Stop Preview').data('previewing', true);
			}
		})
		.data('previewing', false)
		.attr('disabled', 'disabled');
		
		this.curveAim.bind('change', function(evt) {
			wgt.notifyListeners(shorthand.events.SetParam, {
				paramName: 'aim',
				paramValue: wgt.curveAim.prop('checked')
			});
		});
		
		sysTypeSel.bind('change', function(evt) {
			wgt.notifyListeners(shorthand.events.SetParam, {
				paramName: 'trail',
				paramValue: jQuery(this).val() == 'trail'
			});
		});
		
		shpTypeSel.bind('change', function(evt) {
			setShapeType.call(wgt, jQuery(this).val());

			wgt.notifyListeners(shorthand.events.SetParam, {
				paramName: 'particleShape',
				paramValue: wgt.shapeConfig
			});
		});
		
		boxAddBtn.bind('click', function(evt) {
			var box = boxAddBtn.data('box'),
				pos = wgt.position.getValue(),
				dim = wgt.dimensions.getValue();
				
			if (pos.length > 0 && dim.length > 0) {
				var msgType = box == null ? shorthand.events.AddBox 
						: shorthand.events.UpdateBox, 
					data = {
							position: new THREE.Vector3(pos[0], pos[1], pos[2]),
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
		this.addInputsToCheck(this.curveName);
		this.addInputsToCheck(checker);
	};
		
	CreateWidget.prototype.addColorInput = function() {
		var colorAdder = this.find('#crvAddColorToRamp'),
			ndx = colorAdder.data('ndx'),
			wgt = this,
			colorPicker;
		
		if (this.colorPickers.length <= ndx) {
			colorPicker = new editor.ui.ColorPicker({
				inputId: 'crvColorRamp' + ndx,
				containerClass: 'colorRampAdd long',
				buttonId: 'crvColorRamp' + ndx + 'Picker'
			});			
			
			colorPicker.addListener(editor.events.ColorPicked, function(clr) {
				wgt.notifyListeners(shorthand.events.SetCurveColor, {
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
	};
		
	CreateWidget.prototype.boxAdded = function(box) {
		var position = box.position,
			wgt = this,
			wrapper = jQuery('<li class="crvBoxEditor"><span>Box at [' + position.x +',' + position.y + ',' + position.z + ']</span></li>'),
			removeBtn = jQuery('<button class="icon removeBtn">Remove</button>'),
			editBtn = jQuery('<button class="icon editBtn">Edit</button>');
						
		removeBtn.bind('click', function(evt) {
			var box = wrapper.data('box');
			wgt.notifyListeners(shorthand.events.RemoveBox, box);
		});
		
		editBtn.bind('click', function(evt) {
			var b = wrapper.data('box'),
				pos = b.position,
				dim = b.dimensions;
				
			wgt.boxAddBtn.text(UPDATE_BOX_TEXT).data('box', box);
			wgt.boxCancelBtn.show();
			
			wgt.position.setValue({
				x: pos.x,
				y: pos.y,
				z: pos.z
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
		this.showBoxWireframe(box);
	};
		
	CreateWidget.prototype.boxesUpdated = function(size) {
		var btn = this.find('#crvPreviewBtn');
		
		if (size > 1) {				
			btn.removeAttr('disabled');
		}
		else {
			btn.attr('disabled', 'disabled');
		}
	};
		
	CreateWidget.prototype.boxRemoved = function(box) {		
		var wrapper = this.boxes.get(box);
		wrapper.remove();

		this.boxes.remove(box);

		if (box.mesh) {
			if (box.mesh == this.boxHandles.transform) {
				this.boxHandles.setTransform(null);
				this.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
			}
			editor.client.scene.remove(box.mesh);
		}	
	};
		
	CreateWidget.prototype.boxSelected = function(drawState, transform) {
		this.boxHandles.setTransform(transform);
		this.boxHandles.setDrawState(drawState);
	};
		
	CreateWidget.prototype.boxUpdated = function(box) {
		var rndFnc = editor.utils.roundNumber,
			position = new THREE.Vector3(),
			dimensions = [],
			boxUI = this.boxes.get(box);
			
		position.x = rndFnc(box.position.x, 2);
		position.y = rndFnc(box.position.y, 2);
		position.z = rndFnc(box.position.z, 2);
		dimensions[0] = rndFnc(box.dimensions[0], 2);
		dimensions[1] = rndFnc(box.dimensions[1], 2);
		dimensions[2] = rndFnc(box.dimensions[2], 2);
		
		boxUI.data('box', box);
		
		if (this.boxAddBtn.data('box') === box) {
			this.position.setValue({
				x: position.x,
				y: position.y,
				z: position.z
			});
			this.dimensions.setValue({
				h: dimensions[0],
				w: dimensions[1],
				d: dimensions[2]
			});
		}
		
		boxUI.find('span').text('Box at [' + position.x +',' + position.y + ',' + position.z + ']');
		this.showBoxWireframe(box);
	};
		
	CreateWidget.prototype.checkSaveButton = function() {
		var btn = this.saveBtn,
			saveable = this.checkSaveable();
		
		if (saveable) {
			btn.removeAttr('disabled');
		}
		else {
			btn.attr('disabled', 'disabled');
		}
	};
		
	CreateWidget.prototype.cleanup = function() {
		this.boxHandles.setDrawState(editor.ui.trans.DrawState.NONE);
		this.boxHandles.setTransform(null);

		var boxes = this.boxes.keys();
					
		// clean up transforms
		for (var i = 0, il = boxes.length; i < il; i++) {
			var box = boxes[i];
			editor.client.scene.remove(box.mesh);
			box.mesh = null;
		}
	};
		
	CreateWidget.prototype.hideBoxWireframes = function() {
		var boxes = this.boxes.keys();
		
		for (var i = 0, il = boxes.length; i < il; i++) {
			var b = boxes[i],
				t = b.mesh;
				
			if (t) {
				t.visible = false;
			}
		}
	};
		
	CreateWidget.prototype.notify = function(eventType, value) {
		if (eventType === editor.events.Updated) {
			var boxes = this.boxes.keys(),
				transform = value.tran;
			
			for (var i = 0, il = boxes.length; i < il; i++) {
				var box = boxes[i];
				
				if (box.mesh === transform) {
					var boundingBox = transform.getBoundingBox(),
						height = boundingBox.max.y - boundingBox.min.y,
						width = boundingBox.max.x - boundingBox.min.x,
						depth = boundingBox.max.z - boundingBox.min.z,
						position = transform.matrixWorld.getPosition();
					
					this.notifyListeners(shorthand.events.UpdateBox, {
						box: box,
						position: position,
						dimensions: [height, width, depth]
					});
					
					break;
				}
			}
		}
	};
		
	CreateWidget.prototype.reset = function() {	
		this.cleanup();	
		
		// remove additional color ramp values
		this.find('.colorRampAdd').remove();
		var colorRampPicker = this.colorPickers[0];
		this.find('#crvAddColorToRamp').data('ndx', 1);
		
		// reset selects
		this.find('#crvSystemTypeSelect').val(-1);
		this.find('#crvShapeSelect').val(-1);
		
		// reset checkboxes
		this.curveAim.prop('checked', false);
					
		// reset the colorPicker
		colorRampPicker.reset();
		
		// reset the box list
		this.boxList.find('li:not(#crvBoxForms)').remove();
		this.boxes.clear();
		
		this.position.reset();
		this.dimensions.reset();
		this.numParticles.reset();
		this.curveLife.reset();
		this.particleSize.reset();
		this.curveTension.reset();
		this.curveName.reset();
	};
		
	CreateWidget.prototype.resize = function(maxHeight) {
		editor.ui.FormWidget.prototype.resize.call(this, maxHeight);	
		
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
	};
		
	CreateWidget.prototype.set = function(curve, boxes) {
		if (curve) {
			var type = curve instanceof hemi.ParticleCurveTrail ? 'trail' : 'emitter',
				colors = curve._colors,
				config = this.shapeConfig = hemi.utils.clone(curve._shapeConfig);

			this.find('#crvSystemTypeSelect').val(type);
			this.find('#crvShapeSelect').val(config.shape);
			this.curveName.setValue(curve.name);
			this.curveLife.setValue(curve.life);
			this.numParticles.setValue(curve._particles);
			this.particleSize.setValue(getParticleSize(config));
			this.curveTension.setValue(curve._tension);
			this.curveAim.prop('checked', curve._aim);
							
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
	};
		
	CreateWidget.prototype.setupColorPicker = function() {
		var wgt = this,
			colorAdder = this.find('#crvAddColorToRamp');			
		
		var colorRampPicker = new editor.ui.ColorPicker({
			inputId: 'crvColorRamp0',	
			containerClass: 'long',
			buttonId: 'crvColorRamp0Picker'			
		});
		
		this.find('#crvColorRamp0Lbl').after(colorRampPicker.getUI());
		
		// add listeners			
		colorRampPicker.addListener(editor.events.ColorPicked, function(clr) {
			wgt.notifyListeners(shorthand.events.SetCurveColor, {
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
	};
		
	CreateWidget.prototype.setVisible = function(visible) {
		editor.ui.FormWidget.prototype.setVisible.call(this, visible);
		
		if (visible) {
			this.showBoxWireframes();
		}
		else {				
			this.hideBoxWireframes();
		}
	};
		
	CreateWidget.prototype.showBoxWireframe = function(b) {
		var w = b.dimensions[1], 
			h = b.dimensions[0], 
			d = b.dimensions[2];
		
		if (b.mesh == null) {
			var box = new THREE.CubeGeometry(w, h, d),
				mesh = new hemi.Mesh(box, this.boxMat);

			mesh.pickable = true;
			mesh.position = b.position.clone();
			mesh.updateMatrix();
			b.mesh = mesh;

			editor.client.scene.add(mesh);
		} 
		else {
			b.mesh.visible = true;
		}
	};
		
	CreateWidget.prototype.showBoxWireframes = function() {
		var boxes = this.boxes.keys();
		
		for (var i = 0; i < boxes.length; i++) {
			this.showBoxWireframe(boxes[i]);
		}
	};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Methods
////////////////////////////////////////////////////////////////////////////////////////////////////

	function getParticleSize(config) {
		var size;

		switch (config.shape) {
			case 'arrow':
			case 'cube':
			case 'octa':
				size = config.size;
				break;
			case 'cone':
			case 'cylinder':
			case 'pyramid':
				size = config.height;
				break;
			case 'sphere':
				size = config.radius * 2;
				break;
		}

		return size;
	}

	function setShapeSize(size) {
		var config = this.shapeConfig;

		switch (config.shape) {
			case 'arrow':
				config.size = size;
				config.tail = config.depth = size / 2;
				break;
			case 'cone':
				config.height = size;
				config.radius = size / 2;
				break;
			case 'cube':
			case 'octa':
				config.size = size;
				break;
			case 'cylinder':
				config.height = size;
				config.radiusB = config.radiusT = size / 4;
				break;
			case 'pyramid':
				config.height = config.width = config.depth = size;
				break;
			case 'sphere':
				config.radius = size / 2;
				break;
		}
	}

	function setShapeType(type) {
		var config = this.shapeConfig = {},
			size = this.particleSize.getValue() || 0;

		config.shape = type;
		config.color = 0x000000;
		setShapeSize.call(this, size);
	}

////////////////////////////////////////////////////////////////////////////////
//                     		Curve List Sidebar Widget                         //
////////////////////////////////////////////////////////////////////////////////
	
	var AdjustWidget = function() {
		editor.ui.Widget.call(this, {
			name: 'adjustBoxWidget',
			height: editor.ui.Height.MANUAL,
			uiFile: 'js/editor/plugins/particleCurves/html/curvesBoxPanel.htm'
		});
		
		this.drawState = editor.ui.trans.DrawState.NONE;
		this.transform = null;
	};
	
	AdjustWidget.prototype = new editor.ui.Widget();
	AdjustWidget.prototype.constructor = AdjustWidget;
		
	AdjustWidget.prototype.layout = function() {
		editor.ui.Widget.prototype.layout.call(this);
		
		var manipBtns = this.getUI().find('#boxTranslate, #boxScale'),
			downMode = editor.ToolConstants.MODE_DOWN,
			that = this;

		this.boxNumberTxt = this.getUI().find('#boxNumber');
		this.tBtn = manipBtns.filter('#boxTranslate');
		this.sBtn = manipBtns.filter('#boxScale');
		
		manipBtns.bind('click', function(evt) {
			var elem = jQuery(this),
				id = elem.attr('id'),
				isDown = !elem.data('isDown');
			
			// Reset all buttons (create toggle/radio effect)
			manipBtns.data('isDown', false).removeClass(downMode);
			
			if (isDown) {
				elem.addClass(downMode).data('isDown', isDown);
				
				switch(id) {
					case 'boxTranslate':
						that.drawState = editor.ui.trans.DrawState.TRANSLATE;
						break;
					case 'boxScale':
						that.drawState = editor.ui.trans.DrawState.SCALE;
						break;
				}
			} else {
				that.drawState = editor.ui.trans.DrawState.NONE;
			}
			
			that.notifyListeners(shorthand.events.BoxManipState, {
				drawState: that.drawState,
				transform: that.transform
			});
		})
		.data('isDown', false);
	};
	
////////////////////////////////////////////////////////////////////////////////
//                                   View                                     //
////////////////////////////////////////////////////////////////////////////////  
	
	var ParticleCurvesView = function(options){
		editor.ToolView.call(this, {
			toolName: 'Particle Curves',
			toolTip: 'Create and edit particle curves',
			id: 'particleCurves'
		});
		
		this.addPanel(new editor.ui.Panel());
		this.addPanel(new editor.ui.Panel({
			location: editor.ui.Location.BOTTOM,
			classes: ['bottomPanel'],
			startsVisible: false
		}));
		
		this.sidePanel.addWidget(new CreateWidget());
		this.sidePanel.addWidget(new editor.ui.ListWidget({
			name: 'ptcCurveListWidget',
			listId: 'curveList',
			prefix: 'crvLst',
			title: 'Particle Curves',
			instructions: "Add particle curves above."
		}));

		this.bottomPanel.addWidget(new AdjustWidget());
		this.selectedBox = null;
	};
	
	ParticleCurvesView.prototype = new editor.ToolView();
	ParticleCurvesView.prototype.constructor = ParticleCurvesView;
		
	ParticleCurvesView.prototype.boxSelected = function(transform, ndx) {
		var pnl = this.bottomPanel,
			wgt = pnl.adjustBoxWidget,
			oldTransform = wgt.transform;
		
		wgt.transform = transform;
		
		if (transform) {
			pnl.setVisible(true);
			wgt.boxNumberTxt.text(ndx+1);
			
			if (oldTransform != transform 
					|| (!wgt.tBtn.data('isDown') 
					&& !wgt.sBtn.data('isDown'))) {
				wgt.tBtn.click();
			}
			this.selectedBox = transform;
		} else {
			pnl.setVisible(false);
		}
	};

	ParticleCurvesView.prototype.boxRemoved = function(box) {
		if (this.selectedBox === box.mesh) {
			this.bottomPanel.setVisible(false);
		}
	};
	
	
////////////////////////////////////////////////////////////////////////////////
//                                Controller                                  //
////////////////////////////////////////////////////////////////////////////////

	/**
	 * The CurveEditorController facilitates CurveEditorModel and CurveEditorView
	 * communication by binding event and message handlers.
	 */
	var ParticleCurvesController = function() {
		editor.ToolController.call(this);
	};
	
	ParticleCurvesController.prototype = new editor.ToolController();
	ParticleCurvesController.prototype.constructor = ParticleCurvesController;
		
	/**
	 * Binds event and message handlers to the view and model this object 
	 * references.  
	 */
	ParticleCurvesController.prototype.bindEvents = function() {
		editor.ToolController.prototype.bindEvents.call(this);
		
		var model = this.model,
			view = this.view,
			crtWgt = view.sidePanel.createPtcCurveWidget,
			lstWgt = view.sidePanel.ptcCurveListWidget,
			adjWgt = view.bottomPanel.adjustBoxWidget;
		
		view.addListener(editor.events.ToolModeSet, function(value) {
			var isDown = value.newMode == editor.ToolConstants.MODE_DOWN;
			
			if (isDown) {
				crtWgt.boxSelected(adjWgt.drawState, adjWgt.transform);
				crtWgt.showBoxWireframes();
			} else {
				crtWgt.boxSelected(editor.ui.trans.DrawState.NONE, null);
				crtWgt.hideBoxWireframes();
			}
		});
		
		adjWgt.addListener(shorthand.events.BoxManipState, function(value) {
			crtWgt.boxSelected(value.drawState, value.transform);
		});
		
		// edit curve widget specific
		crtWgt.addListener(shorthand.events.AddBox, function(boxParams) {
			model.addBox(boxParams.position, boxParams.dimensions);
		});
		crtWgt.addListener(editor.events.Cancel, function() {
			model.cancel();
		});
		crtWgt.addListener(shorthand.events.RemoveBox, function(box) {
			model.removeBox(box);
		});
		crtWgt.addListener(shorthand.events.Save, function(name) {
			model.save(name);
		});
		crtWgt.addListener(shorthand.events.SetParam, function(paramObj) {
			model.setParam(paramObj.paramName, paramObj.paramValue);
		});
		crtWgt.addListener(shorthand.events.SetCurveColor, function(colorObj) {
			model.addToColorRamp(colorObj.ndx, colorObj.color);
		});
		crtWgt.addListener(shorthand.events.StartPreview, function() {
			model.startPreview();
		});
		crtWgt.addListener(shorthand.events.StopPreview, function() {
			model.stopPreview();
		});
		crtWgt.addListener(shorthand.events.UpdateBox, function(params) {
			model.updateBox(params.box, params.position, params.dimensions);
		});
		
		// curve list widget specific
		lstWgt.addListener(editor.events.Edit, function(curve) {
			model.edit(curve);
		});
		lstWgt.addListener(editor.events.Remove, function(curve) {
			model.remove(curve);
		});
		
		// view specific
		
		// model specific	
		model.addListener(shorthand.events.BoxAdded, function(box) {
			crtWgt.boxAdded(box);
		});
		model.addListener(shorthand.events.BoxRemoved, function(box) {
			view.boxRemoved(box);
			crtWgt.boxRemoved(box);
		});
		model.addListener(shorthand.events.BoxSelected, function(vals) {
			view.boxSelected(vals.transform, vals.ndx);
		});
		model.addListener(shorthand.events.BoxUpdated, function(box) {
			crtWgt.boxUpdated(box);
		});
		model.addListener(editor.events.Created, function(curve) {
			lstWgt.add(curve);
		});
		model.addListener(editor.events.Editing, function(curve) {
			if (curve.particles != null) {
				crtWgt.set(curve.particles, curve.boxes);
			} else {
				crtWgt.reset();
				view.boxSelected(null, -1);
			}
		});
		model.addListener(editor.events.Removing, function(curve) {
			lstWgt.remove(curve);
		});
		model.addListener(editor.events.Updated, function(curve) {
			lstWgt.update(curve);
		});
	};
})();
